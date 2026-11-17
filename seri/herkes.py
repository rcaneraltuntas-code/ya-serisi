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


# ================================================================ episodes 2-20: the series kit (herkes/kit07.tsx)
KITCHEN = dict(kind='kitchen')
STREET = dict(kind='street', sign=['FIRIN', 'BAKERY'])
STOP = dict(kind='stop', sign=['MERKEZ', 'CITY CENTRE'], sign2=['DURAK', 'BUS STOP'])
BUS = dict(kind='bus')
CAFE = dict(kind='cafe', sign=['MENÜ', 'MENU'])


def X(kind, cue, sfx=None, key=30, **props):
    """A kit shot: kind is wake | go | talk | freeze | phone | card."""
    return S('custom', cue, sfx=sfx, key=key, k=kind, **props)


def I(after, who, en, tr='', lead=0.45, trail=0.55, **kw):
    """Someone else's line, in the pause after line `after`."""
    return dict(after=after, who=who, en=en, tr=tr, lead=lead, trail=trail, trDelay=12, **kw)


def TRYI(after, lead=1.0, trail=2.6):
    return dict(after=after, who='app', en='Try again.', tr='Tekrar dene.', cap=False, gain=0.9, lead=lead, trail=trail)


def frz(k):
    """The sound of a freeze whose "Try again." is insert k."""
    return [[0, 'power_down', 0.3], [f'N{k}s-2', 'glitch', 0.3], [f'N{k}e+12', 'rewind', 0.4], [f'N{k}e+26', 'flap', 0.25]]


def alarm(slap=18):
    return [[0, 'alarm', 0.5, slap], [slap, 'land', 0.35]]


def ding(cue):
    return [[cue, 'ding', 0.22]]


STEPS = [[2, 'step', 0.15], [13, 'step', 0.17], [24, 'step', 0.15]]
BUZZ = [[2, 'phone_ring', 0.25, 12]]


def ep7(n, lines, inserts, shots, lead=1.2, tail=4.4, target=58.5):
    ep(n, lines, inserts, shots, lead=lead, tail=tail)
    EP[n].update(kit='07', fit=True, target=target)


# ---------------------------------------------------------------- 2 · Thank you
ep7(2, [
    L('Üçüncü sabah. Bu sefer hazırdım.', '[softly]', 0.6),                    # 0 -> mum's line
    L('Ne dediğini artık biliyordum.', '', 0.5),                               # 1
    L('Yes!', '[cheerful]', 0.5, say=True),                                    # 2 -> wrong answer
    L('Yes, cevap değilmiş.', '[slowly]', 0.7),                                # 3
    L('Dördüncü sabah uygulama bir ipucu verdi.', '', 1.6),                    # 4 -> mum's line
    L('Thank you!', '[cautiously]', 0.5, say=True),                            # 5 -> You're welcome.
    L('Saat ilk kez yedi sıfır beşi geçti.', '[softly]', 0.8),                 # 6
    L('Kapıyı açtım.', '', 0.5),                                               # 7
    L('Bütün sokak İngilizce konuşuyordu.', '[nervous]', 0.6),                 # 8 -> the neighbour
    L('Bunun için bir ipucum yoktu.', '[whispers]'),                           # 9
], [
    I(0, 'anne', 'Breakfast is ready.', 'Kahvaltın hazır.', lead=3.0),
    TRYI(2, lead=1.3, trail=3.2),
    I(4, 'anne', 'Breakfast is ready.', 'Kahvaltın hazır.', lead=3.4),
    I(5, 'anne', "You're welcome.", 'Rica ederim.', lead=0.5, trail=1.4),
    I(8, 'hasan', 'Good morning! How are you?', 'Günaydın! Nasılsın?', lead=2.6, trail=1.3),
], [
    X('wake', 0, sfx=alarm(18), loop=3, mood='ready', flash=False),
    X('talk', ('i', 0, -46), sfx=STEPS, set=KITCHEN, b='anne', bAct='pot', enter=True, loop=3, ax=[[0, 'smile'], ['L2e+8', 'worried']], bx=[[0, 'happy']]),
    X('freeze', ('a', 2, 12), sfx=frz(1), of='b', why='WRONG ANSWER', loop=4),
    X('wake', (3, -34), sfx=alarm(30), loop=4, mood='tired'),
    X('phone', (4, -8), sfx=BUZZ + [[6, 'select_draw', 0.22], ['L4e+4', 'select_draw', 0.22]], mode='app', clock='07:01', items=[
        dict(at=6, head='SHE SAYS', text='Breakfast is ready.', tr='Kahvaltın hazır.'),
        dict(at='L4e+4', head='YOU SAY', text='Thank you.', tr='Teşekkür ederim.')]),
    X('talk', ('i', 2, -34), sfx=STEPS + ding('L5e+4'), set=KITCHEN, b='anne', bAct='pot', enter=True, loop=4, ok='L5e+4',
      ax=[[0, 'worried'], ['L5s-2', 'smile'], ['L5e+4', 'happy']], bx=[[0, 'happy']]),
    X('talk', (6, -6), sfx=[[4, 'counter_tick', 0.2]], set=KITCHEN, b='anne', bAct='pot', cam='a', loop=4, clock='07:05', ax=[[0, 'happy']], bx=[[0, 'happy']]),
    X('go', (7, -10), sfx=STEPS, set='hall', loop=4, clock='07:06', expr='smile'),
    X('talk', (8, -26), sfx=STEPS + [[16, 'flap', 0.4]], set=STREET, b='hasan', bAct='can', enter=True, flip=16, loop=4, clock='07:08',
      ax=[[0, 'smile'], [22, 'shock'], ['N4e+6', 'worried']], bx=[[0, 'smile'], ['N4s-4', 'happy']]),
    X('talk', (9, -6), sfx=hb(0, 60, 0.25), set=STREET, b='hasan', bAct='can', cam='a', loop=4, clock='07:08', ax=[[0, 'worried']], bx=[[0, 'happy']]),
    X('card', ('a', 9, 28), sfx=[[2, 'drone_hit', 0.35]], phrase='How are you?', loop=4, next=3),
])

# ---------------------------------------------------------------- 3 · How are you?
ep7(3, [
    L('Komşumuz Hasan Amca. Otuz yıldır Türkçe konuşur.', '[softly]', 0.6),   # 0 -> How are you?
    L('Gülümsedim. Başımı salladım. Yürüdüm.', '', 0.5),                       # 1 -> no answer
    L('Susmak da yanlış cevapmış.', '[slowly]', 1.4),                          # 2 -> mum
    L('Thank you!', '', 0.5, say=True),                                        # 3 -> the neighbour again
    L('Good morning!', '[cautiously]', 0.5, say=True),                         # 4 -> How are you? again
    L('İyiyim?', '[nervous]', 0.5, say=True),                                  # 5 -> Turkish
    L('Altıncı sabah önce uygulamaya baktım.', '', 1.8),                       # 6 -> the neighbour
    L("I'm fine, thanks. And you?", '[cautiously]', 0.5, say=True),            # 7 -> Not bad
    L('You too!', '[cheerful]', 0.6, say=True),                                # 8
    L('Sokağın sonuna ilk kez vardım.', '[softly]', 0.8),                      # 9 -> the driver
    L('Otobüs şoförü bana bakıyordu.', '[whispers]'),                          # 10
], [
    I(0, 'hasan', 'Good morning! How are you?', 'Günaydın! Nasılsın?', lead=0.5, trail=0.7),
    TRYI(1, lead=1.2),
    I(2, 'anne', 'Breakfast is ready.', 'Kahvaltın hazır.', lead=2.0, trail=0.3),
    I(3, 'hasan', 'Good morning! How are you?', 'Günaydın! Nasılsın?', lead=1.5, trail=0.4),
    I(4, 'hasan', 'How are you?', 'Nasılsın?', lead=0.9, trail=0.6),
    TRYI(5, lead=1.0, trail=2.4),
    I(6, 'hasan', 'Good morning! How are you?', 'Günaydın! Nasılsın?', lead=3.2, trail=0.4),
    I(7, 'hasan', 'Not bad! Have a nice day!', 'Fena değil! İyi günler!', lead=0.5, trail=0.4),
    I(9, 'driver', 'Where to?', 'Nereye?', lead=2.2, trail=1.0),
], [
    X('talk', 0, sfx=STEPS, set=STREET, b='hasan', bAct='can', enter=True, loop=4, clock='07:08', leave='L1s+14',
      ax=[[0, 'worried'], ['L1s', 'smile']], bx=[[0, 'happy'], ['L1e', 'neutral']]),
    X('freeze', ('a', 1, 10), sfx=frz(1), of='a', why='NO ANSWER', loop=5),
    X('wake', (2, -34), sfx=alarm(30), loop=5, mood='tired'),
    X('talk', ('i', 2, -20), sfx=ding('L3e+3'), set=KITCHEN, b='anne', bAct='pot', loop=5, ok='L3e+3', ax=[[0, 'neutral'], ['L3s', 'smile']], bx=[[0, 'happy']]),
    X('talk', ('i', 3, -30), sfx=STEPS, set=STREET, b='hasan', bAct='can', enter=True, loop=5, clock='07:08',
      ax=[[0, 'worried'], ['L4s', 'smile'], ['N4s', 'worried'], ['L5s', 'oops']], bx=[[0, 'happy'], ['L4e+8', 'neutral'], ['N4s', 'happy'], ['L5s+6', 'shock']]),
    X('freeze', ('a', 5, 8), sfx=frz(5), of='e', loop=6, react='facepalm'),
    X('wake', (6, -22), sfx=alarm(18), loop=6, mood='ready', expr='worried'),
    X('phone', ('a', 6, 6), sfx=BUZZ + [[6, 'select_draw', 0.22], [40, 'select_draw', 0.22]], mode='app', clock='07:01', items=[
        dict(at=6, head='HE SAYS', text='How are you?', tr='Nasılsın?'),
        dict(at=40, head='YOU SAY', text="I'm fine, thanks. And you?", tr='İyiyim, teşekkürler. Ya sen?')]),
    X('talk', ('i', 6, -30), sfx=STEPS + ding('L7e+4') + ding('L8e+4'), set=STREET, b='hasan', bAct='can', enter=True, loop=6, clock='07:08', ok='L7e+4',
      ax=[[0, 'worried'], ['L7s', 'smile'], ['L7e+4', 'happy']], bx=[[0, 'happy']]),
    X('go', (9, -8), sfx=STEPS, set=STREET, loop=6, clock='07:10', expr='happy', x0=900),
    X('talk', ('i', 8, -40), sfx=[[0, 'engine_loop', 0.16, 120]], set=STOP, b='driver', bAct='wheel', enter=True, loop=6, clock='07:12',
      ax=[[0, 'happy'], ['N8s+6', 'worried']], bx=[[0, 'neutral']]),
    X('card', ('a', 10, 28), sfx=[[2, 'drone_hit', 0.35]], phrase='Where to?', loop=6, next=4),
])

# ---------------------------------------------------------------- 4 · Where to?
ep7(4, [
    L('Şoför tek bir şey sordu.', '[softly]', 0.5),                            # 0 -> Where to?
    L('Bus?', '[nervous]', 0.5, say=True),                                     # 1 -> Where. To.
    L('Soruyu bile anlamamıştım.', '[whispers]', 0.5),                         # 2 -> wrong
    L('Yedinci sabah Türkçe söyledim.', '[slowly]', 1.4),                      # 3
    L('Merkez!', '', 0.4, say=True),                                           # 4 -> Turkish
    L('Sekizinci sabah da olmadı.', '[slowly]', 1.0),                          # 5
    L('Dokuzuncu sabah otobüsün üstüne baktım.', '', 1.6),                     # 6 -> Where to?
    L('To the city centre, please.', '[cautiously]', 0.5, say=True),           # 7 -> Hop on.
    L('Otobüse ilk kez bindim.', '[softly]', 0.9),                             # 8
    L('Kimse Türkçe konuşmuyordu. Ben de.', '', 1.2),                          # 9
    L('Sonra cebimde telefon titredi.', '[whispers]'),                         # 10
], [
    I(0, 'driver', 'Where to?', 'Nereye?', lead=0.8, trail=0.6),
    I(1, 'driver', 'Where. To.', 'Nereye.', lead=0.6, trail=0.5, vk='where-to-slow'),
    TRYI(2, lead=0.9, trail=2.4),
    TRYI(4, lead=0.9, trail=2.4),
    I(6, 'driver', 'Where to?', 'Nereye?', lead=2.6, trail=0.4),
    I(7, 'driver', 'Hop on.', 'Atla.', lead=0.5, trail=0.8),
], [
    X('talk', 0, sfx=[[0, 'engine_loop', 0.16, 150]] + STEPS, set=STOP, b='driver', bAct='wheel', enter=True, loop=6, clock='07:12',
      ax=[[0, 'worried'], ['L1e+6', 'oops']], bx=[[0, 'neutral'], ['N1s-4', 'smug']]),
    X('freeze', ('a', 2, 8), sfx=frz(2), of='a', why='WRONG ANSWER', loop=7),
    X('wake', (3, -30), sfx=alarm(26), loop=7, mood='jump'),
    X('talk', (4, -30), sfx=[[0, 'engine_loop', 0.16, 60]] + STEPS, set=STOP, b='driver', bAct='wheel', enter=True, loop=7, clock='07:12',
      ax=[[0, 'smug']], bx=[[0, 'neutral'], ['L4e', 'shock']]),
    X('freeze', ('a', 4, 6), sfx=frz(3), of='d', loop=8, react='facepalm'),
    X('wake', (5, -24), sfx=[[0, 'alarm', 0.5, 9], [9, 'land', 0.3], [13, 'alarm', 0.5, 22], [22, 'land', 0.3], [18, 'flap', 0.25]], loop=9, count=[8, 9]),
    X('talk', (6, -12), sfx=[[0, 'engine_loop', 0.16, 150]] + STEPS + [['L6s+24', 'flap', 0.35]] + ding('L7e+4'), set=STOP, b='driver', bAct='wheel', enter=True, loop=9, clock='07:12',
      flip='L6s+24', think=['L6e+2', 'CITY CENTRE'], ok='L7e+4', ax=[[0, 'worried'], ['L6e', 'smile'], ['L7e+4', 'happy']], bx=[[0, 'neutral'], ['L7e+2', 'happy']]),
    X('talk', (8, -8), sfx=[[0, 'engine_loop', 0.2, 200]], set=BUS, b=None, cam='wide', loop=9, clock='07:14', ax=[[0, 'happy'], ['L9s', 'neutral']]),
    X('talk', (10, -8), sfx=[['L10e-6', 'phone_ring', 0.3, 'L10e+40']], set=BUS, b=None, cam='a', loop=9, clock='07:16', ax=[[0, 'neutral'], ['L10e-4', 'shock']]),
    X('card', ('a', 10, 44), sfx=[[2, 'drone_hit', 0.35]], phrase='Where to?', tr='Nereye?', ask='Mesaj kimden?', loop=9, next=5),
])

# ---------------------------------------------------------------- 5 · Loop 214
ep7(5, [
    L('Bilinmeyen bir numaraydı.', '[whispers]', 2.6),                         # 0
    L('Biri beni sayıyordu.', '[nervous]', 0.8),                               # 1
    L('Hemen yazdım.', '', 1.8),                                               # 2 -> Turkish
    L('Yazarken de İngilizce gerekiyormuş.', '[slowly]', 0.9),                 # 3
    L('Evden otobüse kadar her cümleyi ezbere söyledim.', '', 2.4),            # 4
    L('Mesaj yine geldi.', '[softly]', 2.4),                                   # 5
    L('Bu sefer İngilizce sordum.', '', 3.4),                                  # 6
    L('Next stop, sonraki durak. Get off, in.', '[slowly]', 0.8),              # 7
    L('İndim.', '', 0.9),                                                      # 8
    L('Son mesaj kısaydı.', '[whispers]', 2.2),                                # 9
    L('Maple Café neredeydi?', '[nervous]'),                                   # 10
], [
    TRYI(2, lead=1.9, trail=2.5),
], [
    X('phone', 0, sfx=BUZZ + [[14, 'pop', 0.2], ['L0e+16', 'pop', 0.2]], mode='chat', clock='07:16', items=[
        dict(at=14, text="You're on loop 9.", tr='9. döngüdesin.'), dict(at='L0e+16', text="I'm on loop 214.", tr='Ben 214. döngüdeyim.')]),
    X('talk', (1, -6), sfx=[[0, 'engine_loop', 0.2, 60]] + hb(0, 50, 0.22), set=BUS, b=None, cam='a', aAct='phone', loop=9, clock='07:16', ax=[[0, 'shock']]),
    X('phone', (2, -6), sfx=[['L2e+6', 'pop', 0.2], ['L2e+18', 'buzzer', 0.22]], mode='chat', clock='07:17', items=[
        dict(at=-99, text="You're on loop 9."), dict(at=-99, text="I'm on loop 214."), dict(at='L2e+6', me=True, bad=True, text='Sen kimsin?')]),
    X('talk', ('a', 2, 32), set=BUS, b=None, aAct='phone', loop=9, clock='07:17', hud=False, ax=[[0, 'oops']]),
    X('freeze', ('a', 2, 34), sfx=frz(0), of='d', loop=10, react='facepalm'),
    X('wake', (3, -30), sfx=alarm(30), loop=10, mood='tired'),
    X('talk', (4, -6), sfx=ding(10), set=KITCHEN, b='anne', bAct='pot', loop=10, ok=10, clock='07:05', ax=[[0, 'smile']], bx=[[0, 'happy']]),
    X('talk', ('a', 4, -40), sfx=ding(10), set=STREET, b='hasan', bAct='can', loop=10, ok=10, clock='07:08', flip=-99, ax=[[0, 'smile']], bx=[[0, 'happy']]),
    X('talk', ('a', 4, 8), sfx=ding(10) + [[0, 'engine_loop', 0.16, 50]], set=STOP, b='driver', bAct='wheel', loop=10, ok=10, clock='07:12', flip=-99, ax=[[0, 'smile']], bx=[[0, 'happy']]),
    X('phone', (5, -8), sfx=BUZZ + [[12, 'pop', 0.2], ['L6s+10', 'pop', 0.2], ['L6e+14', 'pop', 0.2], ['L6e+50', 'pop', 0.2]], mode='chat', clock='07:16', items=[
        dict(at=12, text="You're on loop 10. I'm on loop 215."), dict(at='L6s+10', me=True, text='Who are you?', tr='Sen kimsin?'),
        dict(at='L6e+14', text='A friend.', tr='Bir dost.'), dict(at='L6e+50', text='Get off at the next stop.')]),
    X('talk', (7, -8), sfx=[[0, 'engine_loop', 0.2, 90]], set=BUS, b=None, aAct='phone', loop=10, clock='07:18', think=['L7s+34', 'GET OFF = İN'], ax=[[0, 'worried'], ['L7e', 'smile']]),
    X('go', (8, -10), sfx=STEPS, set=STREET, loop=10, clock='07:20', expr='worried', x0=700),
    X('phone', (9, -8), sfx=BUZZ + [[14, 'pop', 0.2], [44, 'pop', 0.2]], mode='chat', clock='07:21', items=[
        dict(at=14, text='Maple Café.'), dict(at=44, text="Don't be late.")]),
    X('card', ('a', 10, 26), sfx=[[2, 'drone_hit', 0.35]], phrase="Don't be late.", loop=10, next=6),
])

# ---------------------------------------------------------------- 6 · You're late. Again.
ep7(6, [
    L('Maple Café köşedeydi. Cam kenarında biri oturuyordu.', '[softly]', 0.6),  # 0 -> You're late. Again.
    L('Late, geç. Again, yine.', '[slowly]', 0.6),                             # 1
    L('Beni tanıyordu. Ben onu ilk kez görüyordum.', '[nervous]', 0.6),        # 2
    L('Sen Türk müsün?', '[cheerful]', 0.4, say=True),                         # 3 -> Turkish
    L('Rahatlayınca Türkçe konuşmuşum.', '[slowly]', 1.0),                     # 4
    L('On birinci sabah kafeye koşarak gittim.', '', 1.0),                     # 5 -> You're late. Again.
    L("Sorry I'm late.", '[cautiously]', 0.5, say=True),                       # 6 -> Do you speak English?
    L('A little.', '', 0.6, say=True),                                         # 7
    L('Defterini bana çevirdi. İki yüz on altı çizgi vardı.', '[softly]', 0.7),  # 8 -> We don't have much time.
    L('Son cümleyi anlamadım.', '[whispers]'),                                 # 9
], [
    I(0, 'defne', "You're late. Again.", 'Geç kaldın. Yine.', lead=1.8, trail=0.8),
    TRYI(3, lead=0.9, trail=3.0),
    I(5, 'defne', "You're late. Again.", 'Geç kaldın. Yine.', lead=2.8, trail=0.4),
    I(6, 'defne', 'Do you speak English?', 'İngilizce biliyor musun?', lead=0.6, trail=0.5),
    I(8, 'defne', "Then listen. We don't have much time.", 'O zaman dinle. Fazla vaktimiz yok.', lead=1.4, trail=1.4),
], [
    X('go', 0, sfx=STEPS, set=STREET, loop=10, clock='07:24', expr='worried', run=True, x0=500),
    X('talk', ('i', 0, -44), sfx=[[10, 'flap', 0.35]], set=CAFE, b='defne', bAct='write', flip=10, loop=10, clock='07:26',
      ax=[[0, 'worried'], ['L3s-2', 'happy']], bx=[[0, 'cool'], ['L3s+8', 'shock']]),
    X('talk', (2, -6), set=CAFE, b='defne', bAct='write', cam='a', loop=10, clock='07:26', ax=[[0, 'worried']], bx=[[0, 'cool']], flip=-99),
    X('talk', (3, -8), set=CAFE, b='defne', bAct='write', loop=10, clock='07:27', flip=-99, ax=[[0, 'happy']], bx=[[0, 'cool'], ['L3s+8', 'shock']]),
    X('freeze', ('a', 3, 6), sfx=frz(1), of='d', loop=11, react='facepalm'),
    X('wake', (4, -30), sfx=alarm(30), loop=11, mood='tired'),
    X('go', (5, -8), sfx=STEPS, set=STREET, loop=11, clock='07:22', expr='worried', run=True, x0=500),
    X('talk', ('i', 2, -30), sfx=ding('L6e+4') + ding('L7e+4'), set=CAFE, b='defne', bAct='write', loop=11, clock='07:24', flip=-99, ok='L6e+4',
      ax=[[0, 'worried'], ['L6e+4', 'smile']], bx=[[0, 'cool'], ['L6e+4', 'neutral'], ['L7e+4', 'smile']]),
    X('talk', (8, -6), sfx=[[8, 'paper_land', 0.25]], set=CAFE, b='defne', cam='b', loop=11, clock='07:25', flip=-99, ax=[[0, 'shock']], bx=[[0, 'neutral']]),
    X('talk', ('i', 4, -10), set=CAFE, b='defne', loop=11, clock='07:26', flip=-99, ax=[[0, 'worried']], bx=[[0, 'neutral'], ['N4e', 'worried']]),
    X('card', ('a', 9, 28), sfx=[[2, 'drone_hit', 0.35]], phrase="We don't have much time.", loop=11, next=7),
])

if __name__ == '__main__':
    for n in ([int(a) for a in sys.argv[1:]] or sorted(EP)):
        d = OUT / f'he-{n:02d}'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'episode.json').write_text(json.dumps(EP[n], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'he-{n:02d}: {len(EP[n]["lines"])} lines, {len(EP[n]["inserts"])} lines by others, {len(EP[n]["shots"])} shots')
