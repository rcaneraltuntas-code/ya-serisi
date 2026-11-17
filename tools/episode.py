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
CLIPS['alarm'] = ['synth: a bedside alarm clock, five double beeps', 1.12]
CLIPS['flap'] = ['synth: a row of split-flap cards turning over', 0.95]
CLIPS['whoosh'] = ['synth: a quick soft air whoosh for a fast camera pan', 0.42]
CLIPS['plate_slide'] = ['synth: a ceramic plate slid across a worktop, a small stop tick', 0.5]
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


HITS = {'drone_hit', 'switch_off', 'power_down', 'land', 'tumble', 'crack', 'title_boom', 'big_step', 'paper_land', 'clink', 'select_draw', 'copy_click'}


def sound(slug, fs=None, fe=None):
    """Write the episode's sound plan from its shots. A one-off hit that would land on a spoken line is moved to just
    after the line; ep['duck'] holds the gains turned down by `balance`."""
    ep = load(slug)
    if fs is None:
        words = json.loads((S / 'src/episodes' / slug / 'words.json').read_text(encoding='utf-8'))
        fs, fe = [round(w['s'] * 30) for w in words], [round(w['e'] * 30) for w in words]
    at = {e['shot']: int(e['at'][2:]) for e in ep['edit']}
    duck = ep.get('duck', {})
    used, events, repeats, spans = {ep.get('music', 'drone_bed')}, [], [], []
    for s in ep['shots']:
        for e in s.get('sfx', []):
            key = f'{s["id"]}+{e[0]}:{e[1]}'
            f0 = at[s['id']] + e[0]
            if e[1] in HITS:
                for a, b in zip(fs, fe):
                    if a - 4 <= f0 <= b + 2:
                        f0 = b + 12
                        break
            ev = [f'f:{f0}', e[1], round(e[2] * duck.get(key, 1), 3), 'peak' if e[1] in ('big_step', 'title_boom') else 'onset']
            f1 = f0 + round(CLIPS[e[1]][1] * 30)
            if len(e) > 3:
                until = at[s['id']] + e[3] if isinstance(e[3], int) else None
                ev.append(f'f:{until}' if until is not None else e[3])
                f1 = until if until is not None else f1
            events.append(ev)
            spans.append((f0, f1, key))
            used.add(e[1])
        if s.get('steps'):
            key = f'{s["id"]}:steps'
            k = duck.get(key, 1)
            repeats.append({'at': f'{s["id"]}+4', 'clip': 'step', 'n': s['steps'], 'every': 12, 'gain': [round(0.14 * k, 3), round(0.22 * k, 3)], 'pitch': [0.9, 1.1]})
            spans.append((at[s['id']] + 4, at[s['id']] + 4 + s['steps'] * 12 + 15, key))
            used.add('step')
    ep['sound'] = {'clips': {n: CLIPS[n] for n in sorted(used)}, 'events': events, 'repeats': repeats, 'music': {'clip': ep.get('music', 'drone_bed')},
                   'levels': {'sfx_lu': ep.get('sfx_lu', -3.0), 'music_lu': ep.get('music_lu', -16.0)}}
    save(slug, ep)
    return spans


def balance(slug, rounds=9):
    """Mix, check the voice against the effects, turn down whatever sits on a spoken line, and mix again."""
    for i in range(rounds):
        spans = sound(slug)
        subprocess.run([sys.executable, str(SKILL / 'plan.py'), slug], check=True, stdout=subprocess.DEVNULL)
        r = subprocess.run([sys.executable, str(SKILL / 'sfx.py'), slug], capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(r.stdout[-600:] + r.stderr[-600:])
        out = subprocess.run([sys.executable, str(SKILL / 'mixcheck.py'), slug], capture_output=True, text=True).stdout
        flags = re.findall(r"\(([\d.]+), '(\w+)', '(\w+)', (?:np\.float64\()?(-?[\d.]+)", out)
        if not flags:
            print(f'{slug}: voice clear of the effects after {i} adjustment(s)')
            return
        ep = load(slug)
        duck = ep.setdefault('duck', {})
        for tsec, _, stem_, over in flags:
            fr = float(tsec) * 30
            if stem_ == 'music':
                ep['music_lu'] = ep.get('music_lu', -16.0) - 1.0
                continue
            hit = [k for a, b, k in spans if a - 6 <= fr <= b + 12]
            for k in hit:
                duck[k] = round(max(0.15, duck.get(k, 1) * 0.72), 3)
            if not hit:
                ep['sfx_lu'] = ep.get('sfx_lu', -3.0) - 0.5
        # the effects stem is levelled as a whole against the voice, so turning down its only loud parts changes
        # little by itself: bring the whole stem down a step as well
        ep['sfx_lu'] = max(-22.0, ep.get('sfx_lu', -3.0) - 1.0)
        save(slug, ep)
    print(f'{slug}: still {len(flags)} close moment(s) after {rounds} rounds: {flags[:4]}')


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
    fit = max(0.75, min(1.7, (ep.get('target', 57) - ep.get('lead', 0.5) - ep.get('tail', 2.0) - speech) / written)) if ep.get('fit', True) else 1.0
    # lines spoken by someone else (ep['inserts']: their own takes, public/<slug>/ins<k>.wav) sit in the pause after a line
    ins = ep.get('inserts', [])
    for k, n in enumerate(ins):
        p = pub / f'ins{k}.wav'
        n['dur'] = round(float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True).stdout or 0), 3) if p.exists() else round(max(0.8, len(n['en']) / 13), 3)
    hold = {n['after']: n.get('lead', 0.3) + n['dur'] + n.get('trail', 0.4) for n in ins}
    (out / 'scribe_words.json').write_text(json.dumps({'words': [{'text': f'L{i}.', 'type': 'word', 'start': round(a, 3), 'end': round(b, 3)} for i, (a, b) in enumerate(spans)]}))
    ep['script'] = [{'beat': str(i), 'text': l['t']} for i, l in enumerate(ep['lines'])]
    ep['pauses'] = {'lead': ep.get('lead', 0.5), 'sentence': 0.6, 'after': {f'L{i}': round(hold.get(i, l.get('pause', 0.6) * fit), 2) for i, l in enumerate(ep['lines'][:-1])}}
    ep['voice_fx'] = [{'from': f'L{i}', 'to': f'L{i}', 'fx': 'phone'} for i, l in enumerate(ep['lines']) if l.get('fx') == 'phone']
    save(slug, ep)
    subprocess.run([sys.executable, str(TOOLS / 'voice_connector.py'), slug], check=True, stdout=subprocess.DEVNULL)
    words = json.loads((S / 'src/episodes' / slug / 'words.json').read_text(encoding='utf-8'))
    fs = [round(w['s'] * 30) for w in words]
    fe = [round(w['e'] * 30) for w in words]
    for k, n in enumerate(ins):
        n['s'] = round(words[n['after']]['e'] + n.get('lead', 0.3), 3)
        n['e'] = round(n['s'] + n['dur'], 3)
    if ins and not draft and all((pub / f'ins{k}.wav').exists() for k in range(len(ins))):
        v = pub / 'voice.wav'
        cmd = ['ffmpeg', '-y', '-v', 'error', '-i', str(v)]
        flt = []
        for k, n in enumerate(ins):
            cmd += ['-i', str(pub / f'ins{k}.wav')]
            flt.append(f'[{k + 1}:a]aresample={SR},volume={n.get("gain", 1.0)},adelay={int(n["s"] * 1000)}:all=1[i{k}]')
        flt.append('[0:a]' + ''.join(f'[i{k}]' for k in range(len(ins))) + f'amix=inputs={len(ins) + 1}:normalize=0:duration=first[m]')
        subprocess.run(cmd + ['-filter_complex', ';'.join(flt), '-map', '[m]', '-ar', str(SR), '-ac', '1', str(pub / 'voice_mix.wav')], check=True)
        (pub / 'voice_mix.wav').replace(v)
    if ep.get('subs'):
        # captions: his own lines in short runs of words, the others' lines whole with their meaning under them
        caps = []
        for i, l in enumerate(ep['lines']):
            if l.get('cap') is False:
                continue
            caps.append({'a': fs[i], 'b': fe[i] + 8, 'tr': l['t'], 'say': bool(l.get('say'))})
        for n in ins:
            if n.get('cap') is False:
                continue
            caps.append({'a': round(n['s'] * 30) - 2, 'b': round(n['e'] * 30) + n.get('hold', 14), 'en': n['en'], 'tr': n.get('tr', ''), 'trAt': round(n['s'] * 30) + n.get('trDelay', 14)})
        ep['captions'] = sorted(caps, key=lambda c: c['a'])
    ep['marks'] = {'L': [[a, b] for a, b in zip(fs, fe)], 'N': [[round(n['s'] * 30), round(n['e'] * 30)] for n in ins]}
    # how loud the voice is in each frame, 0..1: the speaker's mouth opens with it
    vx = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(pub / 'voice.wav'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout, dtype=np.float32).astype(np.float64)
    hop = SR // 30
    rms = np.array([np.sqrt(np.mean(vx[i:i + hop] ** 2)) if i + hop <= len(vx) else 0.0 for i in range(0, len(vx), hop)])
    top = np.percentile(rms[rms > 1e-4], 85) if (rms > 1e-4).any() else 1.0
    env = np.clip(rms / top, 0, 1) ** 0.8
    env[env < 0.12] = 0
    ep['marks']['env'] = [round(float(q), 2) for q in env]
    edit, last = [], -1
    for k, s in enumerate(ep['shots']):
        f = 0 if k == 0 else (round(ins[s['ins']]['s'] * 30) + s.get('off', -4) if 'ins' in s else fe[s['after']] + s.get('off', 8) if 'after' in s else max(0, fs[s['at']] - 2 + s.get('off', 0)))
        if f <= last:
            raise SystemExit(f'shot {s["id"]} would start at {f}, not after the one before it ({last})')
        edit.append({'shot': s['id'], 'at': f'f:{f}'})
        last = f
    end = max(fe[-1], round(ins[-1]['e'] * 30) if ins else 0) + round(ep.get('tail', 2.0) * 30)
    ep['edit'], ep['end'] = edit, f'f:{end}'
    save(slug, ep)
    sound(slug, fs, fe)
    ep = load(slug)
    ep.setdefault('title', [ep.get('series', 'SON İNSAN'), ep['slug']])
    save(slug, ep)
    own = (S / 'src/episodes' / slug / 'shots.tsx').exists()
    (S / 'src/episodes' / slug / 'index.tsx').write_text("import { buildEpisode } from '../son-insan/kit';\nimport ep from './episode.json';\nimport timeline from './timeline.json';\n" + ("import * as custom from './shots';\n" if own else '') + f"\nexport const episode = buildEpisode(ep, timeline{', custom' if own else ''});\n")
    subprocess.run([sys.executable, str(SKILL / 'plan.py'), slug], check=True, stdout=subprocess.DEVNULL)
    if not draft:
        r = subprocess.run([sys.executable, str(SKILL / 'sfx.py'), slug], capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(r.stdout[-600:] + r.stderr[-600:])
    registry()
    print(f'{slug}: {end / 30:.1f} s (speech {speech:.1f}, pauses x{fit:.2f}), {len(ep["shots"])} shots; lines at ' + ' '.join(f'{i}:{a}-{b}' for i, (a, b) in enumerate(zip(fs, fe))))


def registry():
    d = S / 'src/episodes'
    series = sorted(p.name for p in d.iterdir() if p.is_dir() and (p / 'index.tsx').exists() and (p / 'timeline.json').exists() and p.name[:3] in ('si-', 'he-'))
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
    elif cmd == 'balance':
        for sl in sys.argv[2:]:
            balance(sl)
