"""One narrator take that holds several episodes' lines, cut into one voice_raw.mp3 per episode.
python ../tools/split_eps.py <take.mp3> <slug> <slug> ...   (from studio/; the take reads the episodes' prompts in that order)"""
import importlib.util, json, pathlib, subprocess, sys
import numpy as np

spec = importlib.util.spec_from_file_location('episode', str(pathlib.Path(__file__).parent / 'episode.py'))
E = importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)
take, slugs = sys.argv[1], sys.argv[2:]
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', take, '-f', 'f32le', '-ac', '1', '-ar', str(E.SR), '-'], capture_output=True, check=True).stdout, dtype=np.float32).astype(np.float64)
lines, counts = [], []
for s in slugs:
    ls = E.load(s)['lines']
    lines += ls
    counts.append(len(ls))
spans = E.align(x, lines, E.heard_words(take))
k, start = 0, 0.0
for s, n in zip(slugs, counts):
    k += n
    end = (spans[k - 1][1] + spans[k][0]) / 2 if k < len(spans) else len(x) / E.SR
    out = pathlib.Path.cwd() / 'public' / s
    out.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{start:.3f}', '-to', f'{end:.3f}', '-i', take, str(out / 'voice_raw.mp3')], check=True)
    print(f'  {s}: {start:.2f}-{end:.2f} s ({n} lines)')
    start = end
