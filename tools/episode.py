"""One command per step for a SON İNSAN episode built from the series kit (studio/src/episodes/son-insan/kit.tsx).

python ../tools/episode.py prompt <slug>          print the text to voice (the lines, with their acting tags)
python ../tools/episode.py voice <slug> <mp3-url> download the take, find each line in it, set the pauses, cut the
                                                  shots on the lines, write the timeline and mix the sound
python ../tools/episode.py registry               rewrite src/episodes/index.ts from the episode folders
Run from studio/. An episode is src/episodes/<slug>/episode.json:
  "lines": [{"t": "Açmadım.", "tag": "[whispers]", "pause": 0.8, "fx": "phone"}, ...]   pause = seconds after the line
  "shots": [{"id": "a", "use": "door", "props": {...}, "at": 0, "off": 0, "key": 20,   at = the line it cuts in on;
             "after": 3, "sfx": [[6, "knock", 0.9]], "steps": 4}, ...]                  after = cut in when line 3 ends
  "lead": 0.5 (seconds before the first line), "tail": 2.0 (seconds after the last line)
The take's lines are found without a transcript: the audio is cut at its silences and the pieces are matched to the
lines by length (dynamic programming), which is exact enough to cut on a line's first word.
"""
import json, pathlib, re, subprocess, sys
import numpy as np

SR = 44100
S = pathlib.Path.cwd()
TOOLS = pathlib.Path(__file__).resolve().parent
SKILL = TOOLS.parent / 'skill' / 'scripts'
CLIPS = {}
CLIPS['hum'] = ['connector sfx: a young girl softly humming a slow lullaby alone in an empty stairwell, reverberant, no words', 3]
for src in ['rewind', 'copy-paste', 'son-insan-b1']:
    f = S / 'src/episodes' / src / 'episode.json'
    if f.exists():
        CLIPS.update(json.loads(f.read_text(encoding='utf-8')).get('sound', {}).get('clips', {}))


def load(slug):
    return json.loads((S / 'src/episodes' / slug / 'episode.json').read_text(encoding='utf-8'))


def save(slug, ep):
    (S / 'src/episodes' / slug / 'episode.json').write_text(json.dumps(ep, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def prompt(slug):
    ep = load(slug)
    # every line starts with a tag: a line without one of its own gets [pause], so the take has a silence at each
    # line boundary (lines that run together cannot be told apart, or cut apart, afterwards)
    print(' '.join((l.get('tag') or ('[pause]' if i else '[softly]')) + ' ' + l['t'] for i, l in enumerate(ep['lines'])))


def heard_words(path):
    """What a small local recogniser (vosk, Turkish) hears in the take, with times; [] if it is not installed."""
    try:
        import os
        from vosk import Model, KaldiRecognizer, SetLogLevel
        SetLogLevel(-1)
        model = Model(os.environ.get('VOSK_TR', '/home/claude/work/vosk/vosk-model-small-tr-0.3'))
    except Exception:
        return []
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    rec = KaldiRecognizer(model, 16000)
    rec.SetWords(True)
    words = []
    for i in range(0, len(pcm), 8000):
        if rec.AcceptWaveform(pcm[i:i + 8000]):
            words += json.loads(rec.Result()).get('result', [])
    return words + json.loads(rec.FinalResult()).get('result', [])


def _norm(s):
    return re.sub(r'[^a-zçğıöşü ]', '', s.replace('İ', 'i').replace('I', 'ı').lower().replace('â', 'a'))


def align(x, lines, words=()):
    """Start and end (seconds) of each line in the take."""
    import difflib
    hop = int(0.005 * SR)
    env = np.sqrt(np.convolve(x ** 2, np.ones(4 * hop) / (4 * hop), 'same'))
    thr = 0.05 * np.percentile(env, 95)
    loud = env[::hop] >= thr
    chunks, start, quiet = [], None, 0
    for i, v in enumerate(loud):
        if v:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet * 0.005 >= 0.16:
                chunks.append((start * 0.005, (i - quiet + 1) * 0.005))
                start = None
    if start is not None:
        chunks.append((start * 0.005, len(loud) * 0.005))
    chunks = [c for c in chunks if c[1] - c[0] > 0.05]
    w = [max(2, len(re.sub(r"[^\w]", '', l['t']))) for l in lines]
    N, M = len(w), len(chunks)
    while len(chunks) < N:  # lines that ran together: split the longest piece at its quietest point
        i = max(range(len(chunks)), key=lambda q: chunks[q][1] - chunks[q][0])
        a0, b0 = chunks[i]
        lo, hi = int((a0 + (b0 - a0) * 0.25) / 0.005), int((a0 + (b0 - a0) * 0.75) / 0.005)
        cut = (lo + int(np.argmin(env[::hop][lo:hi]))) * 0.005
        chunks[i:i + 1] = [(a0, cut), (cut, b0)]
        print(f'  note: no silence between two lines near {cut:.1f} s; split by loudness')
    M = len(chunks)
    rate = sum(c[1] - c[0] for c in chunks) / sum(w)
    INF = 1e18
    cost = np.full((N + 1, M + 1), INF)
    back = np.zeros((N + 1, M + 1), dtype=int)
    cost[0][0] = 0
    for k in range(1, N + 1):
        for j in range(k, M - (N - k) + 1):
            for i in range(k - 1, j):
                if cost[k - 1][i] >= INF:
                    continue
                dur = sum(c[1] - c[0] for c in chunks[i:j])
                c = cost[k - 1][i] + (dur - w[k - 1] * rate) ** 2
                if words:  # and what was heard in those pieces should read like the line
                    heard = ' '.join(q['word'] for q in words if chunks[i][0] - 0.1 <= (q['start'] + q['end']) / 2 <= chunks[j - 1][1] + 0.1)
                    c += 2.0 * (1 - difflib.SequenceMatcher(None, _norm(lines[k - 1]['t']), _norm(heard)).ratio()) ** 2
                if c < cost[k][j]:
                    cost[k][j], back[k][j] = c, i
    out, j = [], M
    for k in range(N, 0, -1):
        i = back[k][j]
        out.append((chunks[i][0], chunks[j - 1][1]))
        j = i
    return out[::-1]


def voice(slug, url):
    ep = load(slug)
    pub = S / 'public' / slug
    out = S / 'out' / slug
    pub.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    draft = url == 'draft'  # no take yet: a silent stand-in as long as the lines should be, to look at the pictures
    if draft:
        tt, parts = 0.3, []
        for l in ep['lines']:
            d = max(0.5, len(l['t']) / 14)
            parts.append((tt, tt + d))
            tt += d + 0.4
        tone = np.zeros(int((tt + 0.3) * SR))
        for a0, b0 in parts:
            tone[int(a0 * SR):int(b0 * SR)] = 0.2 * np.sin(np.arange(int(b0 * SR) - int(a0 * SR)) * 2 * np.pi * 180 / SR)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', str(pub / 'voice_raw.mp3')], input=tone.astype(np.float32).tobytes(), check=True)
    elif url != '-':
        subprocess.run(['curl', '-sS', '--max-time', '120', '-o', str(pub / 'voice_raw.mp3'), url], check=True)
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(pub / 'voice_raw.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout, dtype=np.float32).astype(np.float64)
    spans = align(x, ep['lines'], [] if draft else heard_words(pub / 'voice_raw.mp3'))
    # check the match: a line whose pace is far from the rest was probably matched to the wrong piece of audio
    wl = [max(2, len(re.sub(r"[^\w]", '', l['t']))) for l in ep['lines']]
    pace = [(b - a) / w for (a, b), w in zip(spans, wl)]
    med = float(np.median(pace))
    odd = [i for i, r in enumerate(pace) if (r > 2.6 * med or r < 0.38 * med) and wl[i] > 5]
    if odd:
        print('  check lines', odd, [ep['lines'][i]['t'] for i in odd])
    # fit the episode to its target length by stretching (or tightening) the written pauses together
    speech = sum(b - a for a, b in spans)
    written = sum(l.get('pause', 0.6) for l in ep['lines'][:-1])
    fit = max(0.75, min(1.7, (ep.get('target', 57) - ep.get('lead', 0.5) - ep.get('tail', 2.0) - speech) / written))
    (out / 'scribe_words.json').write_text(json.dumps({'words': [{'text': f'L{i}.', 'type': 'word', 'start': round(a, 3), 'end': round(b, 3)} for i, (a, b) in enumerate(spans)]}))
    ep['script'] = [{'beat': str(i), 'text': l['t']} for i, l in enumerate(ep['lines'])]
    ep['pauses'] = {'lead': ep.get('lead', 0.5), 'sentence': 0.6, 'after': {f'L{i}': round(l.get('pause', 0.6) * fit, 2) for i, l in enumerate(ep['lines'][:-1])}}
    ep['voice_fx'] = [{'from': f'L{i}', 'to': f'L{i}', 'fx': 'phone'} for i, l in enumerate(ep['lines']) if l.get('fx') == 'phone']
    save(slug, ep)
    subprocess.run([sys.executable, str(TOOLS / 'voice_connector.py'), slug], check=True, stdout=subprocess.DEVNULL)
    words = json.loads((S / 'src/episodes' / slug / 'words.json').read_text(encoding='utf-8'))
    fs = [round(w['s'] * 30) for w in words]
    fe = [round(w['e'] * 30) for w in words]
    edit, last = [], -1
    for k, s in enumerate(ep['shots']):
        f = 0 if k == 0 else (fe[s['after']] + s.get('off', 8) if 'after' in s else max(0, fs[s['at']] - 2 + s.get('off', 0)))
        if f <= last:
            raise SystemExit(f'shot {s["id"]} would start at {f}, not after the one before it ({last})')
        edit.append({'shot': s['id'], 'at': f'f:{f}'})
        last = f
    end = fe[-1] + round(ep.get('tail', 2.0) * 30)
    ep['edit'], ep['end'] = edit, f'f:{end}'
    used, events, repeats = {'drone_bed'}, [], []
    for s in ep['shots']:
        for e in s.get('sfx', []):
            ev = [f'{s["id"]}+{e[0]}', e[1], e[2], 'peak' if e[1] in ('big_step', 'title_boom') else 'onset']
            if len(e) > 3:
                ev.append(f'{s["id"]}+{e[3]}' if isinstance(e[3], int) else e[3])
            events.append(ev)
            used.add(e[1])
        if s.get('steps'):
            repeats.append({'at': f'{s["id"]}+4', 'clip': 'step', 'n': s['steps'], 'every': 12, 'gain': [0.14, 0.22], 'pitch': [0.9, 1.1]})
            used.add('step')
    ep['sound'] = {'clips': {n: CLIPS[n] for n in sorted(used)}, 'events': events, 'repeats': repeats, 'music': {'clip': 'drone_bed'}, 'levels': {'sfx_lu': -3.0, 'music_lu': -16.0}}
    ep.setdefault('title', ['SON İNSAN', ep['slug']])
    save(slug, ep)
    (S / 'src/episodes' / slug / 'index.tsx').write_text("import { buildEpisode } from '../son-insan/kit';\nimport ep from './episode.json';\nimport timeline from './timeline.json';\n\nexport const episode = buildEpisode(ep, timeline);\n")
    subprocess.run([sys.executable, str(SKILL / 'plan.py'), slug], check=True, stdout=subprocess.DEVNULL)
    if not draft:
        r = subprocess.run([sys.executable, str(SKILL / 'sfx.py'), slug], capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(r.stdout[-600:] + r.stderr[-600:])
    registry()
    print(f'{slug}: {end / 30:.1f} s (speech {speech:.1f}, pauses x{fit:.2f}), {len(ep["shots"])} shots; lines at ' + ' '.join(f'{i}:{a}-{b}' for i, (a, b) in enumerate(zip(fs, fe))))


def registry():
    d = S / 'src/episodes'
    series = sorted(p.name for p in d.iterdir() if p.is_dir() and (p / 'index.tsx').exists() and (p / 'timeline.json').exists() and p.name.startswith('si-'))
    imp = "import { rewind } from './rewind';\nimport { copyPaste } from './copy-paste';\nimport { dusunce } from './dusunce';\nimport { sonInsan01 } from './son-insan-01';\nimport { sonInsanB1 } from './son-insan-b1';\n"
    imp += ''.join(f"import {{ episode as {n.replace('-', '')} }} from './{n}';\n" for n in series)
    lst = ', '.join(['rewind', 'copyPaste', 'dusunce', 'sonInsan01', 'sonInsanB1'] + [n.replace('-', '') for n in series])
    (d / 'index.ts').write_text('// The registry (written by tools/episode.py registry).\n' + imp + f'\nexport const EPISODES = [{lst}];\n')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'prompt':
        prompt(sys.argv[2])
    elif cmd == 'voice':
        voice(sys.argv[2], sys.argv[3])
    elif cmd == 'registry':
        registry()
