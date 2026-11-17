"""07.00: he accepted an app's terms without reading them; now every morning is the same morning, everyone speaks
only English, and the day starts over at 07.00 whenever he answers in Turkish or gets a line wrong. One-minute parts,
seen from outside. His inner voice is Turkish (the narrator's take); everyone else's lines are English, in their own
voices (inserts), set on screen with their meaning under them. Each part ends on the line he has to answer next.

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
    EP[n] = {'id': f'HE{n:02d}', 'slug': f'he-{n:02d}', 'series': '07.00', 'title': ['07.00', f'BÖLÜM {n}'], 'lead': lead, 'tail': tail,
             'fit': False, 'subs': True, 'music_lu': -19.0, 'lines': lines, 'inserts': inserts, 'shots': shots}


MOM = dict(en='Breakfast is ready.', tr='Kahvaltın hazır.')
TRY = dict(en='Try again.', tr='Tekrar dene.', cap=False, gain=0.9)

# ---------------------------------------------------------------- 1 · Loop 1, 2, 3
ep(1, [
    L('Dün gece bir uygulama indirdim.', '[softly]', 0.5),                 # 0  night, the phone's light on his face
    L('İngilizceyi bir günde öğren, yazıyordu.', '', 0.5),                 # 1  the app
    L('Şartları okumadım.', '[slowly]', 4.3),                              # 2  ACCEPT. "Good luck." Then the alarm
    L('Sabah her şey normaldi.', '[softly]', 2.3),                         # 3  loop 1: he sits up and yawns
    L('Neredeyse.', '', 0.6),                                              # 4  the day board turns behind his back -> she speaks
    L('Annem İngilizce bilmez.', '[nervous]', 0.9),                       # 5
    L('Anne?', '[cautiously]', 0.5, say=True),                             # 6  -> everything stops. "Try again."
    L('Aynı alarm. Aynı sabah.', '[nervous]', 0.6),                        # 7  loop 2 -> she says it again
    L('Çay yine aynı yere döküldü.', '[whispers]', 0.8),                  # 8
    L('Anne, ne oluyor?', '[trembling voice]', 0.5, say=True),             # 9  -> "Try again."
    L('Üçüncü sabah kuralı anladım.', '[slowly]', 0.7),                   # 10 loop 3
    L('Türkçe konuşursam, gün başa sarıyordu.', '', 2.2),                  # 11
    L('Peki, ne cevap verecektim?', '[nervous]'),                          # 12
], [
    dict(after=4, lead=3.6, trail=1.4, trDelay=16, **MOM),
    dict(after=6, lead=1.4, trail=3.5, **TRY),
    dict(after=7, lead=1.9, trail=1.0, trDelay=10, **MOM),
    dict(after=9, lead=0.6, trail=3.0, **TRY),
], [
    S('custom', 0, key=60, sfx=[[0, 'room_tone', 0.1, 118]]),                                                   # a night
    S('custom', (1, -6), key=60, sfx=[[4, 'select_draw', 0.18], [140, 'copy_click', 0.4], [146, 'power_hum', 0.14, 172]]),  # b the app
    S('custom', ('a', 2, 46), key=96, sfx=[[0, 'alarm', 0.5, 34], [34, 'land', 0.4], [38, 'whoosh', 0.22]]),    # c loop 1: alarm
    S('custom', (4, -45), key=40, sfx=[[2, 'step', 0.16], [14, 'step', 0.18], [26, 'step', 0.18], [39, 'flap', 0.4], [50, 'step', 0.14]]),  # d hall
    S('custom', ('i', 0, -86), key=100, sfx=[[4, 'step', 0.14], [14, 'step', 0.16], [24, 'step', 0.14], [48, 'clink', 0.1], [52, 'whoosh', 0.14], [128, 'flap', 0.22]]),  # e kitchen
    S('custom', (5, -4), key=30, sfx=hb(0, 60, 0.25)),                                                           # f his face
    S('custom', (6, -10), key=20),                                                                               # g "Anne?"
    S('custom', ('a', 6, 5), key=60, sfx=[[0, 'power_down', 0.3], [34, 'glitch', 0.3], [89, 'rewind', 0.4], [111, 'flap', 0.25]]),  # h everything stops
    S('custom', (7, -40), key=50, sfx=[[0, 'alarm', 0.5, 29], [8, 'gasp', 0.12], [29, 'land', 0.4]]),            # i loop 2: alarm
    S('custom', ('i', 2, -46), key=60, sfx=[[4, 'step', 0.14], [6, 'whoosh', 0.16], [10, 'clink', 0.1]]),        # j kitchen again
    S('custom', (8, -6), key=30, sfx=hb(0, 60, 0.25)),                                                           # k the tea
    S('custom', (9, -8), key=20),                                                                                # l "Anne, ne oluyor?"
    S('custom', ('a', 9, 4), key=40, sfx=[[0, 'power_down', 0.3], [12, 'glitch', 0.3], [54, 'rewind', 0.4], [70, 'flap', 0.25]]),  # m stops again
    S('custom', (10, -48), key=80, sfx=[[0, 'alarm', 0.5, 28], [28, 'land', 0.3], [125, 'pop', 0.25], [149, 'ding', 0.2], [200, 'phone_ring', 0.3, 214]]),  # n loop 3
    S('custom', (12, -36), key=50, sfx=[[2, 'phone_ring', 0.25, 12], [8, 'select_draw', 0.22], [26, 'select_draw', 0.22], [58, 'select_draw', 0.22], [84, 'select_draw', 0.22]]),  # o the rule
    S('custom', ('a', 12, 30), key=50, sfx=[[2, 'drone_hit', 0.35]]),                                            # p card
], lead=1.4, tail=4.6)

if __name__ == '__main__':
    for n in ([int(a) for a in sys.argv[1:]] or sorted(EP)):
        d = OUT / f'he-{n:02d}'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'episode.json').write_text(json.dumps(EP[n], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'he-{n:02d}: {len(EP[n]["lines"])} lines, {len(EP[n]["inserts"])} lines by others, {len(EP[n]["shots"])} shots')
