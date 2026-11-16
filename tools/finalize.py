"""Master a rendered episode and write the delivery file.
python ../tools/finalize.py <slug> [<slug> ...] [--to <dir>]      (run from studio/, after tools/runpod.py renderall)
out/<slug>/<slug>-raw.mp4 -> master.py (-14 LUFS two-pass) -> a small lift with a limiter (phones play quiet mixes
too low) -> <dir>/son-insan-bolum-NN.mp4, plus a strip of frames to look at (<dir>/kontrol/<slug>.jpg)."""
import json, pathlib, re, subprocess, sys

TOOLS = pathlib.Path(__file__).resolve().parent
args = sys.argv[1:]
to = pathlib.Path(args[args.index('--to') + 1]) if '--to' in args else pathlib.Path('out/final')
slugs = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] != '--to')]
(to / 'kontrol').mkdir(parents=True, exist_ok=True)
for slug in slugs:
    od = pathlib.Path('out') / slug
    if not (od / f'{slug}-raw.mp4').exists():
        print(slug, 'not rendered yet')
        continue
    subprocess.run([sys.executable, str(TOOLS.parent / 'skill/scripts/master.py'), slug, '--skip-render'], check=True, stdout=subprocess.DEVNULL)
    n = int(re.sub(r'\D', '', slug))
    dst = to / f'son-insan-bolum-{n:02d}.mp4'
    gain = 2.4
    for _ in range(3):  # lift toward -14.5 LUFS under a limiter; whispered episodes need a little more than others
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(od / f'{slug}-final.mp4'), '-c:v', 'copy', '-af', f'volume={gain:.1f}dB,alimiter=limit=0.74:attack=3:release=60:level=disabled',
                        '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', str(dst)], check=True)
        m = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(dst), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
        lufs = re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1]
        peak = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', m)[-1]
        if float(lufs) >= -14.9 or gain >= 6:
            break
        gain = min(6.0, gain + (-14.4 - float(lufs)) * 1.15)
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=width,height,codec_name', '-of', 'json', str(dst)], capture_output=True, text=True).stdout)
    v = [s for s in info['streams'] if s.get('width')][0]
    dur = float(info['format']['duration'])
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(dst), '-vf', f'fps=12/{dur:.2f},scale=216:-1,tile=12x1', '-frames:v', '1', '-q:v', '4', str(to / 'kontrol' / f'{slug}.jpg')], check=True)
    print(f'{dst.name}: {dur:.1f} s, {v["width"]}x{v["height"]}, {int(info["format"]["size"]) / 1e6:.1f} MB, {lufs} LUFS, peak {peak} dBFS', flush=True)
