"""Cut one take that holds several lines (said with long pauses between them) into one file per line.
python ../tools/split_take.py <take.mp3> <n> <out-prefix>     -> <out-prefix>0.wav ... <out-prefix>{n-1}.wav
Cuts at the n-1 longest silences; each piece keeps 60 ms of air around it with short fades."""
import subprocess, sys, wave
import numpy as np

SR = 44100
src, n, pre = sys.argv[1], int(sys.argv[2]), sys.argv[3]
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout, dtype=np.float32).astype(np.float64)
hop = int(0.005 * SR)
env = np.sqrt(np.convolve(x ** 2, np.ones(4 * hop) / (4 * hop), 'same'))[::hop]
loud = env >= 0.05 * np.percentile(env, 95)
idx = np.flatnonzero(loud)
a0, b0 = idx[0], idx[-1]
gaps, start = [], None
for i in range(a0, b0 + 1):
    if not loud[i] and start is None:
        start = i
    elif loud[i] and start is not None:
        gaps.append((i - start, start, i))
        start = None
cuts = sorted(sorted(gaps, reverse=True)[:n - 1], key=lambda g: g[1])
edges = [a0] + [v for _, s, e in cuts for v in (s, e)] + [b0 + 1]
for k in range(n):
    a, b = max(0, edges[2 * k] * hop - int(0.06 * SR)), min(len(x), edges[2 * k + 1] * hop + int(0.06 * SR))
    y = x[a:b].copy()
    f = int(0.012 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    with wave.open(f'{pre}{k}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    print(f'{pre}{k}.wav  {len(y) / SR:.2f} s')
