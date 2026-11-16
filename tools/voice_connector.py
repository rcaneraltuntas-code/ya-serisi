"""Voice step without an API key: the take comes from the ElevenLabs connector (speech) and its word timings from
the connector's transcription (Scribe). This retimes the take: every pause is set to the length the episode asks for
(cut or lengthened with silence), so a thriller can hold on a picture.

python ../tools/voice_connector.py <slug>        (run from studio/)
Reads  public/<slug>/voice_raw.mp3, out/<slug>/scribe_words.json, src/episodes/<slug>/episode.json
       "pauses": {"lead": 1.0, "word": 0.14, "comma": 0.25, "sentence": 0.5, "question": 0.6,
                  "after": {"yok#1": 1.0, "sıcak": 1.1}}     after = pause after that word (#n = its nth occurrence)
Writes public/<slug>/voice.wav and src/episodes/<slug>/words.json (same shape voice.py writes).
"""
import json, pathlib, re, subprocess, sys, wave
import numpy as np

SR = 44100
slug = sys.argv[1]
S = pathlib.Path.cwd()
ep = json.loads((S / 'src/episodes' / slug / 'episode.json').read_text(encoding='utf-8'))
raw = S / 'public' / slug / 'voice_raw.mp3'
sw = json.loads((S / 'out' / slug / 'scribe_words.json').read_text(encoding='utf-8'))
sw = sw['words'] if isinstance(sw, dict) else sw
words = []
tag_open, tag_run = False, None  # the take's audio tags ([whispers], [long pause]) come back as tokens: skip them
for w in sw:
    if w.get('type', 'word') != 'word':
        continue
    txt = w['text']
    if txt.startswith('[') or tag_open:
        tag_open = not txt.endswith(']')
        tag_run = w if (w['end'] - w['start']) > 0.3 and 'gasp' not in txt and 'pause' not in txt else None
        continue
    if tag_run is not None and w['end'] - w['start'] < 0.15:
        w = dict(w, start=tag_run['start'])  # the aligner gave the word's sound to the tag before it
    tag_run = None
    core = re.sub(r"^[^\w]+|[^\w]+$", '', txt)
    words.append({'w': core, 's': w['start'], 'e': w['end'], 'p': txt[txt.find(core) + len(core):] if core else ''})
P = {'lead': 0.0, 'word': 0.14, 'comma': 0.25, 'sentence': 0.5, 'question': 0.6, 'after': {}}
P.update(ep.get('pauses', {}))
norm = lambda s: re.sub(r"[^\w]", '', s.lower())
seen, target = {}, []
for w in words[:-1]:
    k = norm(w['w'])
    seen[k] = seen.get(k, 0) + 1
    t = None
    for key, val in P['after'].items():
        base, _, nth = key.partition('#')
        if norm(base) == k and int(nth or 1) == seen[k] and (nth or list(P['after']).count(key) >= 0):
            if nth or sum(1 for x in words if norm(x['w']) == k) == 1:
                t = val
    if t is None:
        p = w['p']
        t = P['question'] if ('?' in p or '!' in p) else P['sentence'] if ('.' in p or ':' in p) else P['comma'] if ',' in p else None
    target.append(t)
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(raw), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout, dtype=np.float32).astype(np.float64)
fade = int(0.004 * SR)
out, pos, cur = [np.zeros(int(P['lead'] * SR))], 0.0, P['lead']
res = []
for i, w in enumerate(words):
    nxt = words[i + 1] if i + 1 < len(words) else None
    gap = (nxt['s'] - w['e']) if nxt else 0
    tgt = target[i] if nxt else 0
    if nxt and tgt is None:
        tgt = min(gap, P['word'])
    mid = w['e'] + gap / 2 if nxt else len(x) / SR
    seg = x[int(pos * SR):int(mid * SR)].copy() if nxt else x[int(pos * SR):].copy()
    if len(seg) > 2 * fade:
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
    res.append({'w': w['w'], 's': round(cur + (w['s'] - pos), 3), 'e': round(cur + (w['e'] - pos), 3), 'p': w['p']})
    if nxt:
        if tgt < gap:  # cut the pause from its middle
            keep = tgt / 2
            a = seg[: int((w['e'] - pos + keep) * SR)]
            out.append(a)
            cur += len(a) / SR
            pos = nxt['s'] - keep
        else:  # keep the take's pause and add silence at its quietest moment (never through a breath or a gasp)
            g0, g1 = int(w['e'] * SR), int(nxt['s'] * SR)
            hop = int(0.02 * SR)
            best, at = None, (g0 + g1) // 2
            for k in range(g0 + hop, max(g0 + hop + 1, g1 - 2 * hop), hop):
                r = float(np.sqrt(np.mean(x[k:k + 2 * hop] ** 2)))
                if best is None or r < best:
                    best, at = r, k + hop
            seg = x[int(pos * SR):at].copy()
            if len(seg) > 2 * fade:
                seg[:fade] *= np.linspace(0, 1, fade)
                seg[-fade:] *= np.linspace(1, 0, fade)
            out.append(seg)
            out.append(np.zeros(int((tgt - gap) * SR)))
            cur += len(seg) / SR + (tgt - gap)
            pos = at / SR
    else:
        out.append(seg)
y = np.concatenate(out)
# "voice_fx": [{"from": "Sakın", "fx": "phone"}] puts the words from that one on through a phone: band-limited, a
# little crushed (the caller on the other end of the line)
for fx in ep.get('voice_fx', []):
    i0 = next(i for i, w in enumerate(res) if norm(w['w']) == norm(fx['from']))
    a0, a1 = int((res[i0]['s'] - 0.06) * SR), len(y)
    seg = y[a0:a1]
    F = np.fft.rfft(seg)
    fr = np.fft.rfftfreq(len(seg), 1 / SR)
    F[(fr < 420) | (fr > 3100)] *= 0.03
    seg = np.tanh(np.fft.irfft(F, len(seg)) * 3.2) * 0.42
    y[a0:a1] = seg
with wave.open(str(S / 'public' / slug / 'voice.wav'), 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
(S / 'src/episodes' / slug / 'words.json').write_text(json.dumps(res, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'{len(x) / SR:.2f} s -> {len(y) / SR:.2f} s; last word ends {res[-1]["e"]:.2f}')
try:
    print(' '.join(f"{w['w']}@{w['s']}" for w in res))
except BrokenPipeError:
    pass
