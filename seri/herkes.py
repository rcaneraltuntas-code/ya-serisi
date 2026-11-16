"""HERKES İNGİLİZCE: one morning everyone around him speaks only English. 30-second parts, seen from outside
(not through his eyes). His inner voice is Turkish (the narrator's take); everyone else's lines are English, in
their own voices (inserts), set on screen with their meaning under them. Each part ends on a line he can't read.

    python3 ../seri/herkes.py        (from studio/) writes src/episodes/he-NN/episode.json
then: tools/episode.py prompt he-01 -> narrator take; the others' lines -> public/he-01/ins<k>.wav; episode.py voice.
"""
import json, pathlib, sys

OUT = pathlib.Path.cwd() / 'src/episodes'
EP = {}


def L(t, tag='', pause=0.6, say=False):
    d = {'t': t, 'pause': pause}
    if tag:
        d['tag'] = tag
    if say:
        d['say'] = True
    return d


def S(use, cue, sfx=None, steps=None, key=20, **props):
    d = {'use': use}
    if isinstance(cue, tuple) and cue[0] == 'a':
        d['after'] = cue[1]
        if len(cue) > 2:
            d['off'] = cue[2]
    elif isinstance(cue, tuple) and cue[0] == 'i':
        d['ins'] = cue[1]
        if len(cue) > 2:
            d['off'] = cue[2]
    elif isinstance(cue, tuple):
        d['at'], d['off'] = cue
    else:
        d['at'] = cue
    d['key'] = key
    d['props'] = props
    if sfx:
        d['sfx'] = sfx
    if steps:
        d['steps'] = steps
    return d


def hb(a, b, g=0.3):
    return [[f, 'heartbeat', g, min(b, f + 88)] for f in range(a, b, 88)]


def ep(n, lines, inserts, shots, lead=2.0, tail=3.8):
    for i, s in enumerate(shots):
        shots[i] = {'id': 'abcdefghijklmnopqrstuvwxyz'[i], **s}
    EP[n] = {'id': f'HE{n:02d}', 'slug': f'he-{n:02d}', 'series': 'HERKES İNGİLİZCE', 'title': ['HERKES İNGİLİZCE', f'BÖLÜM {n}'], 'lead': lead, 'tail': tail,
             'fit': False, 'subs': True, 'music_lu': -19.0, 'lines': lines, 'inserts': inserts, 'shots': shots}


KIT = dict(set='kitchen', veil=0.3)
MOM = dict(who='mom', at='counter')
ME = dict(who='self', at='right')

# ---------------------------------------------------------------- 1 · Kahvaltı
ep(1, [
    L('Annem her sabah aynı şeyi söyler.', '[softly]', 0.35),
    L('Kahvaltın hazır.', '', 0.6),                                   # 1 -> she says it, in English
    L('Bu sabah… böyle söyledi.', '[nervous]', 1.0),
    L('Anne?', '[cautiously]', 0.5, say=True),                        # 3 -> she answers, in English
    L('Annem İngilizce bilmez.', '[whispers]', 3.0),                   # 4, then the phone
    L('Bu cümleyi anlamam lazımdı.', '[trembling voice]', 0.5),
    L('Anlamadım.', '[whispers]'),
], [
    dict(after=1, en='Breakfast is ready.', tr='Kahvaltın hazır.', lead=0.45, trail=0.8, trDelay=16),
    dict(after=3, en="Eat. You're going to be late.", tr='Ye. Geç kalacaksın.', lead=0.5, trail=1.0, trDelay=30),
], [
    S('custom', 0, key=96, sfx=[[0, 'alarm', 0.5, 34], [34, 'land', 0.4], [38, 'whoosh', 0.22], [0, 'room_tone', 0.1, 136], [80, 'gasp', 0.05]]),
    S('custom', 1, key=16, sfx=[[2, 'step', 0.16], [12, 'step', 0.18], [22, 'step', 0.18]]),
    S('custom', ('i', 0, -10), key=40, sfx=[[2, 'step', 0.18], [14, 'drone_hit', 0.2]]),
    S('custom', 2, key=40, sfx=[[14, 'flap', 0.45], [8, 'whoosh', 0.18]] + hb(34, 82, 0.22)),
    S('custom', (3, 0), key=70, sfx=[[4, 'step', 0.14], [14, 'step', 0.16], [18, 'clink', 0.1], [31, 'plate_slide', 0.32], [52, 'flap', 0.22, 64]]),
    S('custom', 4, key=44, sfx=hb(0, 60, 0.3) + [[32, 'switch_off', 0.12]]),
    S('custom', ('a', 4, 12), key=56, sfx=[[2, 'phone_ring', 0.3, 12], [10, 'flap', 0.3], [36, 'copy_click', 0.3], [38, 'drone_hit', 0.3]] + hb(36, 76, 0.3)),
    S('custom', 5, key=96, sfx=hb(0, 200, 0.35) + [[86, 'drone_hit', 0.3]]),
    S('card', ('a', 6, 26), phrase="Don't answer her.", eq='= ?', title='HERKES İNGİLİZCE', sub='DEVAMI 2. BÖLÜMDE', key=50, sfx=[[2, 'drone_hit', 0.4]]),
])

if __name__ == '__main__':
    for n in ([int(a) for a in sys.argv[1:]] or sorted(EP)):
        d = OUT / f'he-{n:02d}'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'episode.json').write_text(json.dumps(EP[n], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'he-{n:02d}: {len(EP[n]["lines"])} lines, {len(EP[n]["inserts"])} lines by others, {len(EP[n]["shots"])} shots')
