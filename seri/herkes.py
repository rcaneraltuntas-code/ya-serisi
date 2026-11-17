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


# ================================================================ episodes 7-13
CAFEBAR = dict(kind='counter', sign=['KASA', 'ORDER HERE'], wall='#2F5957', shelf='cups')
CLASS = dict(kind='class', sign=['DERS', 'LESSON'])
CANTEEN = dict(kind='counter', sign=['KANTİN', 'CANTEEN'], wall='#7A4A3A', shelf='food')
LUNCH = dict(kind='cafe', sign=['KANTİN', 'CANTEEN'], wall='#7A4A3A')
CAMPUS = dict(kind='street', sign=['KAMPÜS', 'CAMPUS'])
STAFF = dict(kind='corridor', sign=['PERSONEL', 'STAFF ONLY'])
ROOM5 = dict(kind='corridor', sign=['ODA 5', 'ROOM 5'])
ROOF = dict(kind='corridor', sign=['ÇATI', 'ROOF'], wall='#6F7C8C')
LIB = dict(kind='counter', sign=['KÜTÜPHANE', 'LIBRARY'], wall='#6B5A4A', shelf='books')


def Q(cue, st, b, act, loop, clock, doors, **kw):
    """A door he now passes without thinking: a quick look, a tick."""
    return X('talk', cue, sfx=ding(10), set=st, b=b, bAct=act, loop=loop, clock=clock, doors=doors, ok=10, flip=-99, ax=[[0, 'smile']], bx=[[0, 'happy']], **kw)


# ---------------------------------------------------------------- 7 · A tea, please
ep7(7, [
    L('Defterini açtı. Bir güne on kapı çizmişti.', '[softly]', 2.4),          # 0
    L('Her kapı bir cümle. Son kapı gece yarısı.', '', 0.6),                   # 1 -> Open all ten
    L('Sonra tezgâha gittim.', '', 0.5),                                       # 2 -> What can I get you?
    L('Çay!', '[cheerful]', 0.4, say=True),                                    # 3 -> Turkish
    L("On ikinci sabah. Defne'nin bakışını hâlâ hatırlıyorum.", '[slowly]', 1.0),  # 4
    L('Kafeye girdim, özür diledim, tezgâha yürüdüm.', '', 0.6),               # 5 -> What can I get you?
    L('A tea, please.', '[cautiously]', 0.5, say=True),                        # 6 -> Coming right up.
    L('Dört kapı açılmıştı. Altı kapı kalmıştı.', '[softly]', 1.0),            # 7 -> door eight
    L('Sekizinci kapıda ne vardı?', '[whispers]'),                             # 8
], [
    I(1, 'defne', 'Open all ten, and the day ends.', 'Onunu da aç, gün biter.', lead=0.6, trail=0.9),
    I(2, 'barista', 'What can I get you?', 'Ne alırsınız?', lead=1.4, trail=0.6),
    TRYI(3, lead=0.9, trail=2.8),
    I(5, 'barista', 'What can I get you?', 'Ne alırsınız?', lead=1.6, trail=0.4),
    I(6, 'barista', 'Coming right up.', 'Hemen geliyor.', lead=0.5, trail=0.9),
    I(7, 'defne', "I'm stuck at door eight.", 'Ben sekizinci kapıda takılıyorum.', lead=1.4, trail=1.2),
], [
    X('talk', 0, sfx=[[8, 'paper_land', 0.25]], set=CAFE, b='defne', bAct='write', cam='b', loop=11, clock='07:26', ax=[[0, 'worried']], bx=[[0, 'neutral']]),
    X('phone', ('a', 0, 10), sfx=BUZZ, mode='doors', clock='07:27', doors=3),
    X('talk', (1, -6), set=CAFE, b='defne', loop=11, clock='07:28', doors=3, flip=-99, ax=[[0, 'worried'], ['N0e', 'shock']], bx=[[0, 'neutral']]),
    X('talk', (2, -6), sfx=STEPS + [[14, 'flap', 0.35]], set=CAFEBAR, b='barista', bAct='cup', enter=True, flip=14, loop=11, clock='07:30', doors=3,
      ax=[[0, 'neutral'], ['N1e', 'worried'], ['L3s', 'happy']], bx=[[0, 'smile'], ['L3e', 'shock']]),
    X('freeze', ('a', 3, 6), sfx=frz(2), of='d', loop=12, react='facepalm'),
    X('wake', (4, -30), sfx=alarm(30), loop=12, mood='tired'),
    X('go', (5, -8), sfx=STEPS, set=STREET, loop=12, clock='07:22', doors=3, expr='worried', run=True, x0=500),
    X('talk', ('i', 3, -34), sfx=STEPS + ding('L6e+4'), set=CAFEBAR, b='barista', bAct='cup', enter=True, flip=-99, loop=12, clock='07:30', doors=3, ok='L6e+4',
      ax=[[0, 'worried'], ['L6s', 'smile'], ['L6e+4', 'happy']], bx=[[0, 'smile'], ['L6e+4', 'happy']]),
    X('talk', (7, -6), set=CAFE, b='defne', aAct='cup', loop=12, clock='07:34', doors=4, flip=-99, ax=[[0, 'happy'], ['N5s', 'neutral'], ['N5e', 'worried']], bx=[[0, 'smile'], ['N5s-6', 'worried']]),
    X('talk', (8, -6), sfx=hb(0, 60, 0.25), set=CAFE, b='defne', cam='b', loop=12, clock='07:35', doors=4, ax=[[0, 'worried']], bx=[[0, 'worried']]),
    X('card', ('a', 8, 28), sfx=[[2, 'drone_hit', 0.35]], phrase="I'm stuck at door eight.", loop=12, next=8),
])

# ---------------------------------------------------------------- 8 · Page twelve
ep7(8, [
    L('Beşinci kapı: ders. Geç kalmıştım.', '[softly]', 0.6),                  # 0 -> You're late. Take a seat.
    L("Sorry I'm late.", '', 0.5, say=True),                                   # 1
    L('Bu cümleyi artık biliyordum.', '[softly]', 0.6),                        # 2 -> page twelve
    L('Twelve. On iki miydi, yirmi miydi?', '[nervous]', 0.7),                 # 3
    L('Yirminci sayfayı açtım.', '', 0.5),                                     # 4 -> That's page twenty.
    L('Eyvah.', '[whispers]', 0.4, say=True),                                  # 5 -> Turkish
    L('On üçüncü sabah sayıları ezberledim.', '[slowly]', 2.4),                # 6 -> page twelve
    L('On iki. Doğru sayfa.', '[softly]', 0.5),                                # 7 -> Read the first sentence.
    L('Bütün sınıf bana bakıyordu.', '[whispers]'),                            # 8
], [
    I(0, 'teacher', "You're late. Take a seat.", 'Geç kaldın. Otur.', lead=1.6, trail=0.9),
    I(2, 'teacher', 'Open your books at page twelve.', 'Kitaplarınızı açın, sayfa on iki.', lead=1.0, trail=1.0),
    I(4, 'teacher', "That's page twenty.", 'O yirminci sayfa.', lead=1.2, trail=0.8),
    TRYI(5, lead=0.9, trail=3.4),
    I(6, 'teacher', 'Open your books at page twelve.', 'Kitaplarınızı açın, sayfa on iki.', lead=4.2, trail=1.0),
    I(7, 'teacher', 'You. Read the first sentence.', 'Sen. İlk cümleyi oku.', lead=1.6, trail=1.6),
], [
    X('talk', 0, sfx=STEPS + [[12, 'flap', 0.35]] + ding('L1e+4'), set=CLASS, b='teacher', bAct='book', enter=True, flip=12, loop=12, clock='09:02', doors=4, ok='L1e+4',
      ax=[[0, 'worried'], ['L1e+4', 'smile']], bx=[[0, 'neutral'], ['L1e+4', 'smile']]),
    X('talk', (2, -6), set=CLASS, b='teacher', bAct='book', aAct='book', loop=12, clock='09:03', doors=4, flip=-99, think=['L3s+16', '12 ?  20 ?'],
      ax=[[0, 'smile'], ['N1e', 'worried']], bx=[[0, 'smile']]),
    X('talk', (4, -6), set=CLASS, b='teacher', bAct='book', aAct='book', loop=12, clock='09:04', doors=4, flip=-99,
      ax=[[0, 'smug'], ['N2s+8', 'shock'], ['L5s', 'oops']], bx=[[0, 'smile'], ['N2s-6', 'neutral'], ['L5s+6', 'shock']]),
    X('freeze', ('a', 5, 6), sfx=frz(3), of='c', loop=13, react='facepalm'),
    X('wake', (6, -22), sfx=alarm(18), loop=13, mood='ready', expr='worried'),
    X('phone', ('a', 6, 8), sfx=BUZZ + [[8, 'select_draw', 0.22], [40, 'select_draw', 0.22]], mode='app', clock='07:01', items=[
        dict(at=8, head='NUMBERS', text='twelve', tr='12'), dict(at=40, head='NUMBERS', text='twenty', tr='20')]),
    X('talk', ('i', 4, -30), sfx=ding('L7e+4'), set=CLASS, b='teacher', bAct='book', aAct='book', loop=13, clock='09:03', doors=4, flip=-99, ok='L7e+4',
      ax=[[0, 'worried'], ['L7s', 'smile'], ['L7e+4', 'happy'], ['N5s+8', 'shock']], bx=[[0, 'smile'], ['N5s-4', 'neutral']]),
    X('talk', (8, -6), sfx=hb(0, 60, 0.25), set=CLASS, b='teacher', bAct='book', aAct='book', cam='a', loop=13, clock='09:05', doors=4, ax=[[0, 'shock']], bx=[[0, 'neutral']]),
    X('card', ('a', 8, 28), sfx=[[2, 'drone_hit', 0.35]], phrase='Read the first sentence.', loop=13, next=9),
], tail=5.4)
# ---------------------------------------------------------------- 9 · Can you repeat that, please?
ep7(9, [
    L('Öğretmen bekliyordu.', '[whispers]', 0.5),                              # 0 -> Read the first sentence.
    L('Kitaba baktım. Hiçbir şey görmedim. Sustum.', '[nervous]', 0.5),        # 1 -> no answer
    L("On dördüncü sabah Defne'ye sordum.", '[slowly]', 0.9),                  # 2
    L("I don't understand the teacher.", '[cautiously]', 0.5, say=True),       # 3 -> Then say this
    L('Tekrar eder misiniz. Bu da geçerli bir cevapmış.', '[softly]', 1.2),    # 4 -> Read the first sentence.
    L('Can you repeat that, please?', '[cautiously]', 0.5, say=True),          # 5 -> Of course.
    L('The day is long.', '', 0.6, say=True),                                  # 6
    L('Beşinci kapı açıldı.', '[softly]', 1.0),                                # 7
    L('Öğle yemeğinde kasiyer bir şey sordu.', '', 0.6),                       # 8 -> Cash or card?
    L('İki kelimeyi de bilmiyordum.', '[whispers]'),                           # 9
], [
    I(0, 'teacher', 'Read the first sentence.', 'İlk cümleyi oku.', lead=0.6, trail=0.7),
    TRYI(1, lead=1.0, trail=2.8),
    I(3, 'defne', 'Then say this: Can you repeat that, please?', 'O zaman şunu söyle: Tekrar eder misiniz?', lead=0.6, trail=0.7),
    I(4, 'teacher', 'Read the first sentence.', 'İlk cümleyi oku.', lead=1.6, trail=0.4),
    I(5, 'teacher', 'Of course. Read. The first. Sentence.', 'Tabii. İlk. Cümleyi. Oku.', lead=0.5, trail=0.5),
    I(8, 'clerk', 'Cash or card?', 'Nakit mi, kart mı?', lead=1.6, trail=0.9),
], [
    X('talk', 0, set=CLASS, b='teacher', bAct='book', aAct='book', loop=13, clock='09:05', doors=4, flip=-99, ax=[[0, 'shock'], ['L1s', 'worried']], bx=[[0, 'neutral']]),
    X('freeze', ('a', 1, 8), sfx=frz(1), of='a', why='NO ANSWER', loop=14),
    X('wake', (2, -30), sfx=alarm(30), loop=14, mood='tired'),
    X('talk', (3, -8), set=CAFE, b='defne', bAct='write', aAct='cup', loop=14, clock='07:34', doors=4, flip=-99,
      ax=[[0, 'worried'], ['N2e', 'smile']], bx=[[0, 'neutral'], ['N2s', 'smile']]),
    X('phone', (4, -8), sfx=BUZZ + [[8, 'select_draw', 0.22]], mode='app', clock='07:36', items=[
        dict(at=8, head='ALWAYS A RIGHT ANSWER', text='Can you repeat that, please?', tr='Tekrar eder misiniz?')]),
    X('talk', ('i', 3, -30), sfx=ding('L5e+4') + ding('L6e+4'), set=CLASS, b='teacher', bAct='book', aAct='book', loop=14, clock='09:05', doors=4, flip=-99, ok='L5e+4',
      ax=[[0, 'worried'], ['L5e+4', 'smile'], ['L6e+4', 'happy']], bx=[[0, 'neutral'], ['L5e+2', 'smile'], ['L6e+4', 'happy']]),
    X('talk', (7, -6), sfx=[[6, 'counter_tick', 0.2]], set=CLASS, b='teacher', bAct='book', aAct='book', cam='a', loop=14, clock='09:40', doors=5, ax=[[0, 'happy']], bx=[[0, 'happy']]),
    X('talk', (8, -8), sfx=STEPS + [[12, 'flap', 0.35]], set=CANTEEN, b='clerk', enter=True, flip=12, loop=14, clock='12:10', doors=5,
      ax=[[0, 'happy'], ['N5s+8', 'worried']], bx=[[0, 'smile']]),
    X('talk', (9, -6), sfx=hb(0, 60, 0.25), set=CANTEEN, b='clerk', cam='a', loop=14, clock='12:10', doors=5, ax=[[0, 'worried']], bx=[[0, 'smile']]),
    X('card', ('a', 9, 28), sfx=[[2, 'drone_hit', 0.35]], phrase='Cash or card?', loop=14, next=10),
])

# ---------------------------------------------------------------- 10 · I'm stuck at five o'clock
ep7(10, [
    L('Cash or card. İkisini de bilmiyordum.', '[nervous]', 0.5),             # 0 -> Cash or card?
    L('Yes.', '', 0.4, say=True),                                              # 1 -> wrong
    L('On beşinci sabah cüzdanıma baktım. Kartın üstünde yazıyordu.', '[slowly]', 1.6),  # 2 -> Cash or card?
    L('Card, please.', '[cautiously]', 0.5, say=True),                         # 3 -> Enjoy your meal!
    L('Thanks!', '[cheerful]', 0.6, say=True),                                 # 4
    L('Altıncı kapı. Defne karşıma oturdu.', '[softly]', 0.6),                 # 5 -> never seen the evening
    L('Evening, akşam. Hiç görmemiş.', '[slowly]', 0.5),                       # 6 -> 220 mornings
    L('O da sıkışmıştı. Benden çok daha uzun süredir.', '[softly]', 0.6),      # 7 -> five o'clock
    L('Saat beşte ne vardı?', '[whispers]'),                                   # 8
], [
    I(0, 'clerk', 'Cash or card?', 'Nakit mi, kart mı?', lead=1.2, trail=0.9),
    TRYI(1, lead=1.0, trail=3.4),
    I(2, 'clerk', 'Cash or card?', 'Nakit mi, kart mı?', lead=3.4, trail=0.4),
    I(3, 'clerk', 'Enjoy your meal!', 'Afiyet olsun!', lead=0.5, trail=0.9),
    I(5, 'defne', "I've never seen the evening.", 'Akşamı hiç görmedim.', lead=1.4, trail=1.0),
    I(6, 'defne', 'Two hundred and twenty mornings. No evening.', 'İki yüz yirmi sabah. Hiç akşam yok.', lead=0.9, trail=1.1),
    I(7, 'defne', "I'm stuck at five o'clock.", 'Saat beşte takılıyorum.', lead=1.2, trail=1.6),
], [
    X('talk', 0, set=CANTEEN, b='clerk', loop=14, clock='12:10', doors=5, flip=-99, ax=[[0, 'worried'], ['L1s', 'smile'], ['L1e+6', 'worried']], bx=[[0, 'smile'], ['L1e+4', 'neutral']]),
    X('freeze', ('a', 1, 10), sfx=frz(1), of='a', why='WRONG ANSWER', loop=15),
    X('wake', (2, -22), sfx=alarm(18), loop=15, mood='ready', expr='worried'),
    X('talk', ('a', 2, -70), set=CANTEEN, b='clerk', cam='a', loop=15, clock='12:09', doors=5, think=[6, 'CARD = KART'], ax=[[0, 'worried'], [14, 'smile']], bx=[[0, 'smile']]),
    X('talk', ('i', 2, -20), sfx=ding('L3e+4') + ding('L4e+4'), set=CANTEEN, b='clerk', loop=15, clock='12:10', doors=5, flip=-99, ok='L3e+4',
      ax=[[0, 'smile'], ['L3e+4', 'happy']], bx=[[0, 'smile'], ['L3e+4', 'happy']]),
    X('talk', (5, -8), sfx=[[10, 'flap', 0.3]], set=LUNCH, b='defne', aAct='cup', flip=10, loop=15, clock='12:20', doors=6,
      ax=[[0, 'happy'], ['N4s+10', 'neutral'], ['N4e', 'worried']], bx=[[0, 'neutral'], ['N4s-6', 'worried']]),
    X('talk', (6, -6), set=LUNCH, b='defne', cam='b', loop=15, clock='12:21', doors=6, ax=[[0, 'worried']], bx=[[0, 'worried'], ['N5e', 'tired']]),
    X('talk', (7, -6), set=LUNCH, b='defne', loop=15, clock='12:22', doors=6, flip=-99, ax=[[0, 'worried'], ['N6e', 'shock']], bx=[[0, 'tired'], ['N6s-4', 'worried']]),
    X('talk', (8, -6), sfx=hb(0, 60, 0.25), set=LUNCH, b='defne', cam='a', loop=15, clock='12:23', doors=6, ax=[[0, 'worried']], bx=[[0, 'worried']]),
    X('card', ('a', 8, 28), sfx=[[2, 'drone_hit', 0.35]], phrase="I'm stuck at five o'clock.", tr='Saat beşte takılıyorum.', ask='Saat beşte ne var?', loop=15, next=11),
], tail=5.4)
# ---------------------------------------------------------------- 11 · Turn left
ep7(11, [
    L('Yedinci kapı kütüphaneydi. Yerini bilmiyordum.', '[softly]', 0.6),      # 0
    L('Excuse me, where is the library?', '[cautiously]', 0.5, say=True),      # 1 -> Go straight, then turn left.
    L('Left. Sağ mıydı, sol muydu?', '[nervous]', 0.7),                        # 2
    L('Sağa döndüm.', '', 0.7),                                                # 3 -> You can't be here.
    L('Pardon!', '', 0.4, say=True),                                           # 4 -> Turkish
    L('On altıncı sabah elime yazdım. Left, sol.', '[slowly]', 1.4),           # 5 -> Go straight, then turn left.
    L('Thank you!', '[cheerful]', 0.5, say=True),                              # 6
    L('Sola döndüm. Kütüphane oradaydı.', '[softly]', 0.8),                    # 7 -> Be quiet, please.
    L('Kütüphaneci parmağını dudağına götürdü.', '[whispers]'),                # 8
], [
    I(1, 'barista', 'Go straight, then turn left.', 'Düz git, sonra sola dön.', lead=1.0, trail=1.0),
    I(3, 'guard', "You can't be here.", 'Burada olamazsın.', lead=2.4, trail=1.0),
    TRYI(4, lead=0.9, trail=3.4),
    I(5, 'barista', 'Go straight, then turn left.', 'Düz git, sonra sola dön.', lead=3.4, trail=0.8),
    I(7, 'clerk', 'Shh. Be quiet, please.', 'Şşt. Sessiz olun lütfen.', lead=3.0, trail=1.6),
], [
    X('talk', 0, sfx=STEPS + [[14, 'flap', 0.35]] + ding('L1e+4'), set=CAMPUS, b='barista', bAct='cup', enter=True, flip=14, loop=15, clock='13:05', doors=6, ok='L1e+4',
      ax=[[0, 'worried'], ['L1e+4', 'smile'], ['N0e', 'worried']], bx=[[0, 'smile']]),
    X('talk', (2, -6), set=CAMPUS, b='barista', bAct='cup', cam='a', loop=15, clock='13:06', doors=6, think=['L2s+10', 'LEFT = ?'], ax=[[0, 'worried']], bx=[[0, 'smile']]),
    X('go', (3, -8), sfx=STEPS, set=CAMPUS, loop=15, clock='13:07', doors=6, expr='smug', x0=900),
    X('talk', ('i', 1, -34), sfx=STEPS + [[10, 'flap', 0.35]], set=STAFF, b='guard', enter=True, flip=10, loop=15, clock='13:09', doors=6,
      ax=[[0, 'smug'], ['N1s+6', 'shock'], ['L4s', 'oops']], bx=[[0, 'neutral'], ['N1s-4', 'smug'], ['L4e', 'shock']]),
    X('freeze', ('a', 4, 6), sfx=frz(2), of='d', loop=16, react='facepalm'),
    X('wake', (5, -22), sfx=alarm(18), loop=16, mood='ready', expr='smug'),
    X('talk', ('i', 3, -40), sfx=ding('L6e+4'), set=CAMPUS, b='barista', bAct='cup', loop=16, clock='13:05', doors=6, flip=-99, ok='L6e+4', think=[4, 'LEFT = SOL'],
      ax=[[0, 'smile'], ['L6e+4', 'happy']], bx=[[0, 'smile'], ['L6e+4', 'happy']]),
    X('go', (7, -8), sfx=STEPS, set=CAMPUS, loop=16, clock='13:07', doors=6, expr='happy', x0=900),
    X('talk', ('i', 4, -40), sfx=STEPS + [[10, 'flap', 0.35]], set=LIB, b='clerk', bAct='book', enter=True, flip=10, loop=16, clock='13:10', doors=6,
      ax=[[0, 'happy'], ['N4s+6', 'shock']], bx=[[0, 'neutral'], ['N4s-4', 'worried']]),
    X('talk', (8, -6), sfx=hb(0, 60, 0.25), set=LIB, b='clerk', bAct='book', cam='b', loop=16, clock='13:10', doors=6, ax=[[0, 'shock']], bx=[[0, 'worried']]),
    X('card', ('a', 8, 28), sfx=[[2, 'drone_hit', 0.35]], phrase='Be quiet, please.', loop=16, next=12),
])

# ---------------------------------------------------------------- 12 · Where are you?
ep7(12, [
    L('Sessiz ol, demekti. Fısıldadım.', '[whispers]', 0.5),                   # 0
    L('Sorry.', '[whispers]', 0.6, say=True),                                  # 1
    L('Yedinci kapı. Sonra telefonum çaldı. Annemdi.', '[softly]', 0.9),       # 2
    L('Efendim?', '', 0.4, say=True),                                          # 3 -> Turkish
    L('Telefonu bile İngilizce açmam gerekiyordu.', '[slowly]', 1.0),          # 4
    L('On yedinci sabah yedi kapıyı arka arkaya geçtim.', '', 3.4),            # 5
    L('Hello?', '[cautiously]', 0.4, say=True),                                # 6 -> Where are you?
    L("I'm at the library.", '', 0.5, say=True),                               # 7 -> When are you coming home?
    L('At seven.', '', 0.7, say=True),                                         # 8
    L("Saat on altı elli beşti. Defne'den mesaj geldi.", '[softly]', 2.0),     # 9
    L('Beş numaralı oda neredeydi?', '[nervous]'),                             # 10
], [
    TRYI(3, lead=0.9, trail=2.8),
    I(6, 'anne', 'Where are you?', 'Neredesin?', lead=0.5, trail=0.4),
    I(7, 'anne', 'When are you coming home?', 'Eve ne zaman geliyorsun?', lead=0.5, trail=0.4),
], [
    X('talk', 0, sfx=ding('L1e+4'), set=LIB, b='clerk', bAct='book', loop=16, clock='13:10', doors=6, flip=-99, ok='L1e+4',
      ax=[[0, 'worried'], ['L1e+4', 'smile']], bx=[[0, 'worried'], ['L1e+4', 'smile']]),
    X('talk', (2, -6), sfx=[['L2e-30', 'phone_ring', 0.3, 'L2e+10']], set=LIB, b='clerk', bAct='book', aAct='phone', cam='a', loop=16, clock='15:30', doors=7,
      ax=[[0, 'happy'], ['L2e-30', 'shock']], bx=[[0, 'smile']]),
    X('talk', (3, -8), set=LIB, b='clerk', bAct='book', aAct='phone', loop=16, clock='15:30', doors=7, flip=-99, ax=[[0, 'smile'], ['L3e', 'oops']], bx=[[0, 'smile'], ['L3e', 'shock']]),
    X('freeze', ('a', 3, 6), sfx=frz(0), of='c', loop=17, react='facepalm'),
    X('wake', (4, -30), sfx=alarm(30), loop=17, mood='tired'),
    Q((5, -6), KITCHEN, 'anne', 'pot', 17, '07:05', 1),
    Q(('a', 5, -40), STREET, 'hasan', 'can', 17, '07:08', 2),
    Q(('a', 5, 0), STOP, 'driver', 'wheel', 17, '07:12', 3),
    Q(('a', 5, 40), CLASS, 'teacher', 'book', 17, '09:05', 5),
    X('talk', (6, -30), sfx=[[0, 'phone_ring', 0.3, 24]] + ding('L7e+4') + ding('L8e+4'), set=LIB, b='clerk', bAct='book', aAct='phone', loop=17, clock='15:30', doors=7, flip=-99, ok='L8e+4',
      ax=[[0, 'worried'], ['L7e+4', 'smile'], ['L8e+4', 'happy']], bx=[[0, 'smile']]),
    X('phone', (9, -8), sfx=BUZZ + [[16, 'pop', 0.2]], mode='chat', title='DEFNE', clock='16:55', items=[dict(at=16, text='Go to room 5. Now.')]),
    X('talk', (10, -6), sfx=hb(0, 60, 0.25), set=LIB, b='clerk', bAct='book', aAct='phone', cam='a', loop=17, clock='16:55', doors=7, ax=[[0, 'worried']], bx=[[0, 'smile']]),
    X('card', ('a', 10, 28), sfx=[[2, 'drone_hit', 0.35]], phrase='Go to room 5. Now.', clock='16:55', loop=17, next=13),
])

# ---------------------------------------------------------------- 13 · 16:55
ep7(13, [
    L('Beş numaralı odaya gittim.', '[softly]', 0.6),                          # 0 -> You can't be here.
    L('Cevap veremedim.', '[whispers]', 0.5),                                  # 1 -> no answer
    L('On sekizinci sabah, aynı saatte, yeni bir mesaj geldi.', '[slowly]', 2.2),  # 2
    L('Çatıya çıktım. Kapı kilitliydi.', '', 0.6),                             # 3 -> Stop right there!
    L('Ben bir şey yapmadım!', '[nervous]', 0.4, say=True),                    # 4 -> Turkish
    L('İki sabah. İki yanlış adres. İkisi de on altı elli beşte.', '[slowly]', 1.0),  # 5
    L('On dokuzuncu sabah mesaja uymadım.', '', 2.0),                          # 6
    L('Saat ilk kez on altı elli altıyı gösterdi.', '[softly]', 0.9),          # 7
    L('Sonra her şey yine dondu.', '[whispers]', 0.4),                         # 8 -> reset
    L('Ama bu sefer Türkçe konuşan ben değildim.', '[nervous]'),               # 9
], [
    I(0, 'guard', "You can't be here.", 'Burada olamazsın.', lead=1.4, trail=0.6),
    TRYI(1, lead=1.0, trail=2.8),
    I(3, 'guard', 'Stop right there!', 'Olduğun yerde dur!', lead=1.0, trail=0.5),
    TRYI(4, lead=0.9, trail=2.8),
    TRYI(8, lead=1.2, trail=2.8),
], [
    X('talk', 0, sfx=STEPS + [[12, 'flap', 0.35]], set=ROOM5, b='guard', enter=True, flip=12, loop=17, clock='16:57', doors=7,
      ax=[[0, 'worried'], ['N0s+6', 'shock']], bx=[[0, 'neutral'], ['N0s-4', 'smug']]),
    X('freeze', ('a', 1, 8), sfx=frz(1), of='a', why='NO ANSWER', loop=18),
    X('wake', (2, -30), sfx=alarm(30), loop=18, mood='tired'),
    X('phone', ('a', 2, 6), sfx=BUZZ + [[16, 'pop', 0.2]], mode='chat', title='DEFNE', clock='16:55', items=[dict(at=16, text='Go to the roof. Quickly.')]),
    X('talk', (3, -6), sfx=STEPS + [[12, 'flap', 0.35], ['N2s-10', 'buzzer', 0.2]], set=ROOF, b='guard', enter=True, flip=12, loop=18, clock='16:58', doors=7,
      ax=[[0, 'worried'], ['N2s+4', 'shock'], ['L4s', 'oops']], bx=[[0, 'smug'], ['L4e', 'shock']]),
    X('freeze', ('a', 4, 6), sfx=frz(3), of='e', loop=19, react='facepalm'),
    X('wake', (5, -22), sfx=alarm(18), loop=19, mood='ready', expr='worried'),
    X('phone', (6, -8), sfx=BUZZ + [[16, 'pop', 0.2]], mode='chat', title='DEFNE', clock='16:55', items=[dict(at=16, text='Go to room 9. Now.')]),
    X('talk', (7, -8), sfx=[[6, 'counter_tick', 0.2]], set=LIB, b='clerk', bAct='book', aAct='phone', loop=19, clock='16:56', doors=7, flip=-99,
      ax=[[0, 'worried'], ['L7s+10', 'happy'], ['L8s', 'shock']], bx=[[0, 'smile']]),
    X('freeze', ('a', 8, 6), sfx=frz(4), of='i', loop=20),
    X('wake', (9, -30), sfx=alarm(26), loop=20, mood='jump'),
    X('card', ('a', 9, 28), sfx=[[2, 'drone_hit', 0.35]], phrase='Turkish detected.', tr='Türkçe algılandı.', ask='Kim konuştu?', loop=20, next=14),
])

if __name__ == '__main__':
    for n in ([int(a) for a in sys.argv[1:]] or sorted(EP)):
        d = OUT / f'he-{n:02d}'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'episode.json').write_text(json.dumps(EP[n], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'he-{n:02d}: {len(EP[n]["lines"])} lines, {len(EP[n]["inserts"])} lines by others, {len(EP[n]["shots"])} shots')
