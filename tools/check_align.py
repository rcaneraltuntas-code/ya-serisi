"""Check that each line of an episode was matched to the right piece of its voice take: recognise the take with a
small local Turkish model (vosk) and compare what was heard inside each line's span with the line's text.
python ../tools/check_align.py <slug> [<slug> ...]      (run from studio/; model dir in $VOSK_TR)"""
import json, os, re, subprocess, sys, difflib, wave, io
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)
model = Model(os.environ.get('VOSK_TR', '/home/claude/work/vosk/vosk-model-small-tr-0.3'))
norm = lambda s: re.sub(r'[^a-zçğıöşü ]', '', s.lower().replace('İ', 'i').replace('I', 'ı').replace('â', 'a'))
for slug in sys.argv[1:]:
    ep = json.load(open(f'src/episodes/{slug}/episode.json', encoding='utf-8'))
    spans = [(w['start'], w['end']) for w in json.load(open(f'out/{slug}/scribe_words.json'))['words']]
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'public/{slug}/voice_raw.mp3', '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    rec = KaldiRecognizer(model, 16000)
    rec.SetWords(True)
    words = []
    for i in range(0, len(pcm), 8000):
        if rec.AcceptWaveform(pcm[i:i + 8000]):
            words += json.loads(rec.Result()).get('result', [])
    words += json.loads(rec.FinalResult()).get('result', [])
    bad = []
    for i, ((a, b), l) in enumerate(zip(spans, ep['lines'])):
        heard = ' '.join(w['word'] for w in words if a - 0.12 <= (w['start'] + w['end']) / 2 <= b + 0.12)
        r = difflib.SequenceMatcher(None, norm(l['t']), norm(heard)).ratio()
        if r < 0.45:
            bad.append(f'  L{i} {r:.2f} [{a:.1f}-{b:.1f}] want "{l["t"]}" heard "{heard}"')
    print(slug, 'ok' if not bad else f'{len(bad)} doubtful', f'({len(words)} words heard)')
    print('\n'.join(bad)) if bad else None
