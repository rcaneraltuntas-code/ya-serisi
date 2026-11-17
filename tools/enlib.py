"""The library of English lines said by the other characters (07.00).
python ../tools/enlib.py add <who> <take.mp3> "line 1" "line 2" ...   split a take (lines said with long pauses between) and file each line
python ../tools/enlib.py place <slug> ...                             copy each insert's line to public/<slug>/ins<k>.wav
Run from studio/. The library lives in $ENLIB (default /home/claude/work/takes/en): <who>/<key>.wav, key = the line's letters and digits."""
import json, os, pathlib, re, shutil, subprocess, sys

LIB = pathlib.Path(os.environ.get('ENLIB', '/home/claude/work/takes/en'))
S = pathlib.Path.cwd()
key = lambda t: re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')

if sys.argv[1] == 'add':
    who, take, lines = sys.argv[2], sys.argv[3], sys.argv[4:]
    d = LIB / who
    d.mkdir(parents=True, exist_ok=True)
    if len(lines) == 1:
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', take, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse', '-ar', '44100', '-ac', '1', str(d / f'{key(lines[0])}.wav')], check=True)
    else:
        subprocess.run([sys.executable, str(pathlib.Path(__file__).parent / 'split_take.py'), take, str(len(lines)), str(d / '_p')], check=True)
        for i, t in enumerate(lines):
            (d / f'_p{i}.wav').replace(d / f'{key(t)}.wav')
    for t in lines:
        f = d / f'{key(t)}.wav'
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout)
        print(f'  {who}: {dur:5.2f} s  {t}' + ('   <- check' if dur < 0.25 + len(t) / 30 or dur > 1.2 + len(t) / 7 else ''))
else:
    for slug in sys.argv[2:]:
        ep = json.loads((S / 'src/episodes' / slug / 'episode.json').read_text(encoding='utf-8'))
        miss = []
        for k, n in enumerate(ep.get('inserts', [])):
            f = LIB / n.get('who', '') / f'{n.get("vk") or key(n["en"])}.wav'
            if f.exists():
                shutil.copy(f, S / 'public' / slug / f'ins{k}.wav')
            else:
                miss.append(f'{n.get("who")}: {n["en"]}')
        print(slug, 'ok' if not miss else f'MISSING {miss}')
