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
# Pauses are only ever changed inside real silence. The word times say roughly where a gap is; the audio says whether
# there is one. Inside each gap the longest run of true silence is found: silence is added at its centre, or taken
# out of its middle. A gap with no silence in it (words that run together) is left exactly as spoken, whatever the
# episode asks for: cutting or padding there is heard as a stutter.
hop = int(0.005 * SR)
env = np.sqrt(np.convolve(x ** 2, np.ones(4 * hop) / (4 * hop), 'same'))
thr = 0.05 * np.percentile(env, 95)
xf = int(0.012 * SR)  # 12 ms fades either side of every join


def quiet_run(t0, t1):
    """The longest stretch below the silence threshold between t0 and t1 (seconds), as (start, end) samples."""
    a, b = max(0, int(t0 * SR)), min(len(x), int(t1 * SR))
    best, cur = (0, 0), None
    for k in range(a, b, hop):
        if env[k] < thr:
            cur = k if cur is None else cur
            if k + hop - cur > best[1] - best[0]:
                best = (cur, k + hop)
        else:
            cur = None
    return best


out, res = [np.zeros(int(P['lead'] * SR))], []
pos, cur, skipped = 0, P['lead'], 0  # pos: next unread sample of the take; cur: seconds written so far


def emit(a, b):
    global cur
    seg = x[a:b].copy()
    if len(seg) > 2 * xf:
        seg[:xf] *= np.linspace(0, 1, xf)
        seg[-xf:] *= np.linspace(1, 0, xf)
    out.append(seg)
    cur += len(seg) / SR


for i, w in enumerate(words):
    nxt = words[i + 1] if i + 1 < len(words) else None
    res.append({'w': w['w'], 's': round(cur + (w['s'] - pos / SR), 3), 'e': round(cur + (w['e'] - pos / SR), 3), 'p': w['p']})
    if not nxt:
        emit(pos, len(x))
        break
    gap, tgt = nxt['s'] - w['e'], target[i]
    q0, q1 = quiet_run(w['e'] - 0.06, nxt['s'] + 0.06)
    have = (q1 - q0) / SR
    if tgt is None or have < 0.05:
        skipped += tgt is not None and abs(tgt - gap) > 0.05
        continue  # nothing to do, or no silence to do it in: keep reading the take straight through
    delta = tgt - have  # the pause is the silence itself, so that is what gets set
    mid = (q0 + q1) // 2
    if delta >= 0:
        emit(pos, mid)
        out.append(np.zeros(int(delta * SR)))
        cur += int(delta * SR) / SR
        pos = mid
    else:
        cut = min(-delta, max(0.0, have - 0.08))
        h = int(cut * SR / 2)
        emit(pos, mid - h)
        pos = mid + h
y = np.concatenate(out)
# "voice_fx": [{"from": "Sakın", "fx": "phone"}] puts the words from that one on through a phone: band-limited, a
# little crushed (the caller on the other end of the line)
for fx in ep.get('voice_fx', []):
    i0 = next(i for i, w in enumerate(res) if norm(w['w']) == norm(fx['from']))
    i1 = next((i for i, w in enumerate(res) if norm(w['w']) == norm(fx['to'])), None) if fx.get('to') else None
    a0 = max(0, int((res[i0]['s'] - 0.06) * SR))
    a1 = len(y) if i1 is None else min(len(y), int((res[i1]['e'] + 0.12) * SR))
    seg = y[a0:a1]
    F = np.fft.rfft(seg)
    fr = np.fft.rfftfreq(len(seg), 1 / SR)
    F[(fr < 420) | (fr > 3100)] *= 0.03
    seg = np.tanh(np.fft.irfft(F, len(seg)) * 3.2) * 0.42
    k = min(len(seg) // 2, int(0.01 * SR))
    if k:
        seg[:k] *= np.linspace(0, 1, k)
        seg[-k:] *= np.linspace(1, 0, k)
    y[a0:a1] = seg
with wave.open(str(S / 'public' / slug / 'voice.wav'), 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
(S / 'src/episodes' / slug / 'words.json').write_text(json.dumps(res, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'{len(x) / SR:.2f} s -> {len(y) / SR:.2f} s; last word ends {res[-1]["e"]:.2f}; {skipped} requested pauses left as spoken (no silence there)')
try:
    print(' '.join(f"{w['w']}@{w['s']}" for w in res))
except BrokenPipeError:
    pass
