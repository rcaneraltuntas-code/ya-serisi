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
    S('scene', 0, **KIT, c=[950, 565, 1.02], c2=[930, 555, 1.14], who=[dict(MOM, back=True, sway=True), dict(ME, yaw=-0.7, look=-1)], key=40,
      sfx=[[0, 'room_tone', 0.12, 200], [26, 'clink', 0.18], [70, 'clink', 0.12]]),
    S('scene', ('i', 0, -12), **KIT, c=['counter', 250, 2.0], c2=['counter', 262, 2.4], who=[dict(MOM, back=True, turnAt=3, expr='happy'), dict(ME, yaw=-0.7, look=-1)], key=30,
      sfx=[[0, 'room_tone', 0.1, 120]]),
    S('scene', 2, **KIT, c=['right', 305, 2.3], c2=['right', 310, 2.7], who=[dict(MOM, expr='happy'), dict(ME, yaw=-0.5, look=-1, expr='worried')], key=30, sfx=hb(10, 90, 0.2)),
    S('scene', 3, **KIT, c=[930, 540, 1.3], c2=[925, 535, 1.38], who=[dict(MOM, expr='happy', yaw=0.4, look=1), dict(ME, yaw=-0.7, look=-1, expr='worried')], key=14),
    S('scene', ('i', 1, -6), **KIT, c=['counter', 258, 2.5], c2=['counter', 266, 2.9], who=[dict(MOM, expr='happy', yaw=0.3, look=1)], key=40),
    S('scene', 4, **KIT, c=['counter', 318, 3.9], c2=['counter', 322, 4.8], who=[dict(MOM, expr='happy', yaw=0.3, look=1)], dark=[[0, 0.0], [60, 0.22]], key=40, sfx=hb(0, 130, 0.3)),
    S('msg', ('a', 4, 12), bg='kitchen', bgp=dict(veil=0.3), at=18, text="Don't answer her.", key=50,
      sfx=[[6, 'phone_ring', 0.35, 20], [18, 'copy_click', 0.3], [22, 'drone_hit', 0.3]] + hb(20, 110, 0.3)),
    S('scene', 5, **KIT, c=[965, 505, 1.42], c2=[972, 498, 1.56], who=[dict(MOM, expr='happy', yaw=0.45, look=1), dict(ME, yaw=-0.2, look=0, down=True, expr='worried', exprAt=[70, 'shock'])],
      dark=0.2, key=80, sfx=hb(0, 200, 0.35)),
    S('card', ('a', 6, 26), phrase="Don't answer her.", eq='= ?', title='HERKES İNGİLİZCE', sub='DEVAMI 2. BÖLÜMDE', key=50, sfx=[[2, 'drone_hit', 0.4]]),
])

if __name__ == '__main__':
    for n in ([int(a) for a in sys.argv[1:]] or sorted(EP)):
        d = OUT / f'he-{n:02d}'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'episode.json').write_text(json.dumps(EP[n], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'he-{n:02d}: {len(EP[n]["lines"])} lines, {len(EP[n]["inserts"])} lines by others, {len(EP[n]["shots"])} shots')
