"""Put a sound file into the shared library under the name sfx.py will look for (name + prompt + seconds), so clips
made with the ElevenLabs connector, or synthesised here, are used exactly like generated ones.
python ../tools/add_clip.py <name> "<prompt>" <seconds> <file>      (run from studio/)"""
import hashlib, pathlib, subprocess, sys
name, prompt, secs, src = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
secs = int(secs) if secs == int(secs) else secs
h = hashlib.sha1(f'{prompt}|{secs}'.encode()).hexdigest()[:8]
dst = pathlib.Path('library/sfx') / f'{name}-{h}.mp3'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-ac', '1', '-ar', '44100', '-b:a', '128k', str(dst)], check=True)
print(dst)
