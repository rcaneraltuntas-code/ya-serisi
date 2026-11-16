"""SON İNSAN, bölüm 2-20: every episode written once, here, as lines (what the voice says, how, and the silence after
it) and shots (what his eyes see, cut on a line). Run from studio/:

    python3 ../seri/episodes.py            writes src/episodes/si-NN/episode.json for every episode
    python3 ../seri/episodes.py 7 12       only those

Then, per episode: tools/episode.py prompt -> the voice take -> tools/episode.py voice.

A line:  L(text, tag, pause, fx)      pause = seconds of silence after it (stretched together to fit ~57 s)
A shot:  S(use, cue, **props)         cue: 3 = cut in on line 3; (3, 12) = 12 frames after it starts;
                                      ('a', 3) / ('a', 3, 20) = when line 3 has ended (+ frames)
         sfx=[[frame, clip, gain, until_frame?], ...], steps=n footsteps, key=frame for the storyboard still
"""
import json, pathlib, sys

OUT = pathlib.Path.cwd() / 'src/episodes'
EP = {}
DV = '[deep voice]'


def L(t, tag='', pause=1.0, fx=None):
    d = {'t': t}
    if tag:
        d['tag'] = tag
    d['pause'] = pause
    if fx:
        d['fx'] = fx
    return d


def T(t, tag=DV, pause=1.2):
    """A line on the phone."""
    return L(t, tag, pause, 'phone')


def S(use, cue, sfx=None, steps=None, key=30, **props):
    d = {'use': use}
    if isinstance(cue, tuple) and cue[0] == 'a':
        d['after'] = cue[1]
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


def card(last, n, off=50):
    return S('card', ('a', last, off), key=40, sub=f'DEVAMI {n}. BÖLÜMDE' if n else 'SON')


def hb(a, b, g=0.3):
    """Heartbeat from frame a to b of the shot (the clip is 3 s long)."""
    return [[f, 'heartbeat', g, min(b, f + 88)] for f in range(a, b, 88)]


def bed(clip, a, b, g, n):
    """A bed clip of n frames repeated from frame a to b."""
    return [[f, clip, g, min(b, f + n)] for f in range(a, b, n - 4)]


RING = [[6, 'phone_ring', 0.5, 34], [44, 'phone_ring', 0.5, 72]]
NOTE = ['SANA "AÇMA" DEDİ,', 'DEĞİL Mİ?', '', 'ONA GÜVENME.']
WRITE = ['O SENİ', 'DİNLİYOR.']
BOARD = [['ON DOKUZ KERE', 356, 44], ['DENEDİN.', 408, 44]]
BOARD2 = BOARD + [['YİRMİNCİDE ONA SORMA.', 462, 28], ['KARDEŞİNE SOR.', 506, 36]]
NIGHT = dict(set='street', lit=0.16, dead=True, dark=0.15, night=True)
ROOF = dict(set='roof', night=True, lightsOut=1, cityLit=1.8, dark=0.08)
STAIRS = dict(set='stairs', dark=0.2)
CROWD = [
    dict(who='mom', at='far', glow=True), dict(who='mo', at='mid', glow=True), dict(who='suit', at='right', glow=True),
    dict(who='dark', at='left', glow=True), dict(who='suit', at=[905, 610, 0.3], glow=True), dict(who='mo', at=[1020, 600, 0.27], glow=True),
]


BGS = {'market': {}, 'kitchen': {}, 'bedroom': {'lamp': 0.3}, 'class': {}, 'corridor': {'lit': 0.4}, 'stairs': {}, 'street': dict(lit=0.16, dead=True, night=True), 'roof': dict(night=True, lightsOut=1, cityLit=1.8)}


def ep(n, lines, shots, lead=2.6, tail=4.6, target=57, bg=None):
    for s in shots:  # what he holds up is seen against the place he is standing in, out of focus
        if s['use'] in ('phone', 'paper', 'watch') and (s['props'].get('bg') or bg):
            b = s['props'].setdefault('bg', bg)
            s['props'].setdefault('bgp', BGS[b])
    for i, s in enumerate(shots):
        s['id'] = 'abcdefghijklmnopqrstuvwxyz'[i]
        s = shots[i] = {'id': s.pop('id'), **s}
    EP[n] = {'id': f'SI{n:02d}', 'slug': f'si-{n:02d}', 'title': ['SON İNSAN', f'BÖLÜM {n}'], 'lead': lead, 'tail': tail, 'target': target, 'lines': lines, 'shots': shots}


# ---------------------------------------------------------------- 2 · Not
ep(2, [
    L('Açmadım.', '[whispers] [nervous]', 0.7), L('Nefesimi tuttum.', '', 1.6), L('Vuruş kesildi.', '[softly]', 1.6),
    L('Sonra kapının altından… bir kâğıt kaydı.', '[cautiously]', 1.5), L('Sana "açma" dedi, değil mi?', '[slowly]', 0.6),
    L('Ona güvenme.', '[whispers]', 2.0), L('Telefon yine çaldı.', '[nervous]', 2.4), T('Notu okuma.', '[deep voice] [slowly]', 1.2),
    L('Okumuştum bile.', '[softly]', 1.6), L('Kapıyı açtım.', '[cautiously]', 1.3), L('Kimse yoktu.', '', 0.9),
    L('Sadece yerde… ıslak ayak izleri.', '[curious]', 1.3), L('Küçüktüler.', '[whispers]', 0.8), L('Bir çocuğun ayak izleri.', '[trembling voice]'),
], [
    S('door', 0, mode='knock', knocks=[14, 23, 32], small=True, key=20, sfx=[[8, 'knock', 0.9]] + hb(50, 130, 0.25)),
    S('tape', 1, tau=[126, 126], z=[1.3, 1.5], soft=True, dark=0.35, key=30, sfx=hb(2, 80) + [[40, 'knock', 0.7]]),
    S('door', 2, mode='still', small=True, feetUntil=40, key=30),
    S('door', 3, mode='note', noteAt=30, feet=False, key=50, sfx=[[32, 'paper_land', 0.3]]),
    S('paper', 4, kind='note', lines=NOTE, size=46, at=2, gap=70, y=420, key=40, sfx=[[70, 'drone_hit', 0.25]]),
    S('phone', 6, mode='ring', sfx=RING + [[82, 'phone_ring', 0.5, 108]]),
    S('phone', 7, mode='live', rise=False, key=20, sfx=[[0, 'copy_click', 0.3]]),
    S('paper', 8, kind='note', lines=NOTE, size=46, at=-30, gap=70, y=420, key=20),
    S('door', 9, mode='open', openAt=30, behind='prints', pushHand=True, feet=False, key=60, sfx=[[32, 'big_step', 0.3]]),
    S('scene', 10, set='market', c=[960, 505, 1.05], c2=[960, 505, 1.3], bob=0.4, dark=0.15, key=15),
    S('floor', 11, floor='tiles', prints=True, walk=0.2, night=0.3, steps=5),
    S('scene', 12, set='market', c=[960, 620, 1.5], c2=[960, 560, 2.1], prints=[960, 640, 1.1, 7], dark=0.2, bob=0.3, key=40, sfx=[[50, 'drone_hit', 0.35]] + hb(4, 170)),
    card(13, 3),
], lead=3.0, bg='market')

# ---------------------------------------------------------------- 3 · İzler
ep(3, [
    L('İzleri takip ettim.', '[cautiously]', 1.6), L('Marketten çıktılar.', '', 1.4), L('Sokağı geçtiler.', '', 2.0),
    L('Bizim kapıda bittiler.', '[nervous]', 2.6), L('İçeri girdim.', '[softly]', 1.4), L('Holde, aynanın önünden geçtim.', '', 1.6),
    L('Durdum.', '[whispers]', 0.9), L('Geri döndüm.', '', 2.2), L('Aynadaki ben… bir saniye geç döndü.', '[trembling voice]', 2.4),
    L('Elimi kaldırdım.', '[cautiously]', 1.6), L('O kaldırmadı.', '[whispers]', 2.2), L('Sadece baktı.', '', 1.4),
    L('Sonra başını iki yana salladı.', '[slowly]', 2.6), L('Ve aynanın içinden, buğuya bir şey yazdı.', '[nervous]', 3.0),
    L('O seni dinliyor.', '[whispers] [slowly]'),
], [
    S('floor', 0, floor='tiles', prints=True, walk=0.22, night=0.3, steps=6),
    S('floor', 1, floor='asphalt', prints=True, walk=0.22, night=0.2, drift=4, steps=4),
    S('scene', 2, set='street', c=[960, 640, 1.15], c2=[960, 600, 1.35], prints=[960, 960, 1.5, 9], bob=0.5, dead=False, lit=0.42, sfx=bed('engine_loop', 0, 110, 0.1, 260)),
    S('floor', 3, floor='boards', prints=True, mat=True, night=0.25, key=40, sfx=[[30, 'drone_hit', 0.25]]),
    S('door', (4, -40), style='home', mode='open', openAt=24, behind='dark', pushHand=True, feet=False, key=50, sfx=[[26, 'big_step', 0.25]]),
    S('scene', ('a', 4, 4), set='kitchen', c=[1100, 540, 1.2], c2=[960, 530, 1.3], bob=0.5, dark=0.12, key=20, steps=3, sfx=[[0, 'room_tone', 0.1, 120]]),
    S('mirror', 5, mode='normal', key=20, steps=2),
    S('mirror', 7, mode='late', key=30, sfx=hb(20, 200, 0.25)),
    S('mirror', 9, mode='still', key=30),
    S('mirror', 11, mode='normal', expr='neutral', key=20),
    S('mirror', 12, mode='no', key=30, sfx=hb(0, 170)),
    S('mirror', 13, mode='write', lines=WRITE, at=96, size=54, key=150, sfx=hb(0, 170) + [[100, 'drone_hit', 0.4]]),
    card(14, 4),
])

# ---------------------------------------------------------------- 4 · Dinleyen
ep(4, [
    L('Telefonu cebimden çıkardım.', '[nervous]', 1.2), L('Ekran açıktı.', '', 1.6), L('Arama devam ediyordu.', '[whispers]', 1.0),
    L('Kırk yedi dakikadır.', '[slowly]', 2.4), L('Hiç kapatmamıştım.', '[trembling voice]', 1.0), L('Her şeyi duymuştu.', '[whispers]', 2.4),
    L('Kapattım.', '', 3.2), L('Hemen yeniden çaldı.', '[nervous]', 2.0), T('Kapatma.', DV, 0.9),
    T('Seni bir tek ben koruyabilirim.', '[deep voice] [slowly]', 2.0), T('Saate bak.', DV, 1.6), L('Baktım.', '[softly]', 1.4),
    L('Sabah değildi artık.', '[nervous]', 1.8), L('Üç on altıydı.', '[whispers]', 2.4), T('Bir dakikan var.', DV, 1.2),
    T('Ne olursa olsun… yukarı bakma.', '[deep voice] [slowly]'),
], [
    S('mirror', 0, mode='write', lines=WRITE, at=-40, size=54, key=20, sfx=hb(0, 80, 0.25)),
    S('phone', (0, 6), mode='call', timer='47', key=40),
    S('paper', 4, kind='note', lines=NOTE, size=46, at=-30, gap=70, y=420, key=10, bg='market'),
    S('mirror', 5, mode='write', lines=WRITE, at=-40, size=54, key=20, sfx=[[4, 'drone_hit', 0.25]]),
    S('phone', 6, mode='call', timer='47', rise=False, hand=[1010, 800, 0.8, 'point'], key=20, sfx=[[22, 'copy_click', 0.35]]),
    S('blank', ('a', 6, 10), key=10),
    S('phone', ('a', 6, 44), mode='ring', key=20, sfx=RING + [[82, 'phone_ring', 0.5, 108]]),
    S('phone', 8, mode='live', rise=False, key=20, sfx=[[0, 'copy_click', 0.3]]),
    S('watch', 11, text='03:16', key=30, sfx=[[8, 'drone_hit', 0.3]]),
    S('scene', 12, set='kitchen', dark=[[0, 0.0], [50, 0.62]], c=[960, 500, 1.1], c2=[960, 470, 1.25], key=50, sfx=[[2, 'power_down', 0.25]]),
    S('watch', 13, text='03:16', blink=True, key=30, sfx=hb(0, 150, 0.25)),
    S('phone', 14, mode='live', rise=False, key=20),
    S('scene', (15, 30), **{**NIGHT, 'c': [960, 560, 1.02], 'c2': [960, 520, 1.12], 'light': [[40, 0], [150, 0.3]], 'key': 120}, sfx=[[40, 'power_hum', 0.12, 130], [126, 'power_hum', 0.16, 216]]),
    card(15, 5),
], bg='kitchen')

# ---------------------------------------------------------------- 5 · 03:16
ep(5, [
    L('Dışarısı kararmıştı.', '[nervous]', 1.4), L('Sabah olmuş… sonra geri alınmış gibi.', '[slowly]', 2.6),
    L('Sonra sokak aydınlandı.', '[curious]', 1.2), L('Lambalardan değil.', '', 0.9), L('Yukarıdan.', '[whispers]', 2.6),
    L('Gölgem, ayaklarımın dibinde küçüldü.', '[trembling voice]', 2.2), T('Bakma.', DV, 2.0), L('Yere baktım.', '[breathless]', 0.9),
    L('Asfalta.', '', 0.8), L('Ayakkabılarıma.', '', 3.0), L('Işık geçti.', '[softly]', 1.4), L('Sokak yine karardı.', '', 2.4),
    L('Başımı kaldırdım.', '[cautiously]', 2.2), L('Sokağın sonunda biri duruyordu.', '[nervous]', 1.2),
    L('Yüzü gökyüzüne dönük.', '[whispers]', 2.2), L('Hırkasını tanıdım.', '[trembling voice]', 2.6), L('Anne?', '[whispers]'),
], [
    S('door', 0, style='home', mode='open', openAt=10, behind='dark', pushHand=True, feet=False, key=40, sfx=[[12, 'big_step', 0.25]]),
    S('scene', (0, 0), **NIGHT, c=[960, 600, 1.05], c2=[960, 560, 1.12], bob=0.3, key=20, steps=3),
    S('scene', 1, **NIGHT, c=[960, 380, 1.5], c2=[960, 420, 1.35], key=30),
    S('scene', 2, **{**NIGHT, 'light': [[0, 0], [70, 0.42]]}, c=[960, 560, 1.05], c2=[960, 600, 1.1], key=60, sfx=[[0, 'power_hum', 0.14, 88], [84, 'power_hum', 0.18, 172]]),
    S('floor', 4, floor='asphalt', shadow=True, light=[[0, 0.25], [70, 0.7]], night=0.4, key=50, sfx=[[0, 'power_hum', 0.2, 88], [84, 'power_hum', 0.24, 172]]),
    S('floor', 5, floor='asphalt', shadow=True, shoes=True, light=[[0, 0.7], [60, 1]], night=0.4, key=50, sfx=[[0, 'power_hum', 0.28, 88], [84, 'power_hum', 0.3, 172]] + hb(0, 120, 0.2)),
    S('phone', 6, mode='live', rise=False, light=0.35, key=14),
    S('floor', 7, floor='asphalt', shadow=True, shoes=True, light=1, night=0.4, key=40, sfx=[[0, 'power_hum', 0.3, 88], [84, 'power_hum', 0.3, 172], [168, 'power_hum', 0.3, 256]] + hb(0, 250, 0.3)),
    S('floor', 10, floor='asphalt', shadow=True, shoes=True, light=[[0, 1], [44, 0]], night=0.45, key=30, sfx=[[4, 'power_down', 0.3]]),
    S('floor', 11, floor='asphalt', shoes=True, night=0.5, key=20),
    S('scene', 12, **NIGHT, c=[960, 900, 1.5], c2=[960, 560, 1.05], who=[dict(who='mom', at='end', back=True, up=True, behind=True)], key=60),
    S('scene', 13, **NIGHT, c=['end', 200, 1.7], c2=['end', 200, 2.6], who=[dict(who='mom', at='end', back=True, up=True, behind=True)], key=40, sfx=hb(0, 180, 0.25)),
    S('scene', 15, **NIGHT, c=['end', 240, 3.6], c2=['end', 250, 4.6], who=[dict(who='mom', at='end', back=True, up=True, behind=True)], key=60, sfx=hb(0, 200) + [[90, 'drone_hit', 0.35]]),
    card(16, 6),
], bg='street')

# ---------------------------------------------------------------- 6 · Anne
MOMC = dict(who='mom', at='close', up=True, glow=True)
ep(6, [
    L('Koştum.', '[breathless]', 0.9), L('Önüne geçtim.', '', 1.6), L('Kıpırdamıyordu.', '[whispers]', 2.0),
    L('Gözleri açıktı.', '[nervous]', 1.2), L('İçlerinde, o ışık hâlâ yanıyordu.', '[trembling voice]', 2.6), L('Anne… benim.', '[softly]', 3.0),
    L('Başını yavaşça indirdi.', '[slowly]', 1.4), L('Bana baktı.', '[whispers]', 2.2),
    L('Ve annemin sesiyle, tek bir kelime söyledi.', '[nervous]', 2.0), L('Bak.', '[whispers]', 2.8),
    T('O artık annen değil.', DV, 0.8), T('Koş.', DV, 1.4), L('Koştum.', '[breathless]', 2.4),
    L('Arkamda, sokaktaki bütün pencereler aynı anda yandı.', '[nervous]', 1.6), L('Her pencerede biri vardı.', '[whispers]', 1.2),
    L('Hepsi gökyüzüne bakıyordu.', '', 2.6), L('Sonra hepsi… bana döndü.', '[trembling voice] [slowly]'),
], [
    S('scene', 0, **NIGHT, c=['end', 240, 3.2], c2=['end', 240, 3.6], who=[dict(who='mom', at='end', back=True, up=True, behind=True)], key=20),
    S('floor', (0, 2), floor='asphalt', shoes=True, walk=1.1, night=0.5, key=20, steps=6),
    S('scene', 1, **NIGHT, c=['close', 240, 1.25], c2=['close', 260, 1.4], who=[MOMC], key=30),
    S('scene', 3, **NIGHT, c=['close', 320, 2.3], c2=['close', 325, 2.8], who=[MOMC], key=60, sfx=hb(0, 170, 0.25) + [[10, 'power_hum', 0.1, 98]]),
    S('scene', 5, **NIGHT, c=['close', 260, 1.5], c2=['close', 270, 1.6], who=[MOMC], hand=[1010, 700, 0.8], key=40),
    S('scene', 6, **NIGHT, c=['close', 310, 1.9], c2=['close', 320, 2.3], who=[dict(who='mom', at='close', up=True, glow=True, upUntil=34)], key=70, sfx=hb(0, 170)),
    S('scene', 8, **NIGHT, c=['close', 325, 2.8], c2=['close', 328, 3.3], who=[dict(who='mom', at='close', glow=True)], key=60, sfx=hb(0, 170, 0.35) + [[118, 'drone_hit', 0.4]]),
    S('phone', 10, mode='live', rise=False, key=20, sfx=[[0, 'copy_click', 0.3]]),
    S('floor', 12, floor='asphalt', shoes=True, walk=1.3, night=0.5, key=20, steps=7),
    S('scene', 13, **NIGHT, c=[960, 400, 1.08], c2=[960, 380, 1.16], echoes=True, bob=0.2, key=40, sfx=[[2, 'switch_off', 0.35]]),
    S('scene', 14, **NIGHT, c=[820, 330, 1.9], c2=[830, 320, 2.2], echoes=True, key=30),
    S('scene', 16, **NIGHT, c=[960, 400, 1.1], c2=[960, 390, 1.3], echoes='turn', turnAt=58, key=110, sfx=hb(0, 200) + [[60, 'drone_hit', 0.45]]),
    card(16, 7),
], bg='street')

# ---------------------------------------------------------------- 7 · Tahta
CLS = dict(set='class', dark=0.22)
ep(7, [
    L('Peşimden gelmediler.', '[breathless]', 1.2), L('Sadece izlediler.', '[whispers]', 2.6), L('Okula girdim.', '', 1.0),
    L('Kendi sınıfıma.', '[softly]', 1.4), L('Kapıyı kapattım.', '', 2.8), L('Tahta, çentiklerle doluydu.', '[curious]', 1.4),
    L('On dokuz çentik.', '[slowly]', 2.4), L('Altında bir cümle.', '', 0.9), L('Benim el yazımla.', '[nervous]', 2.2),
    L('On dokuz kere denedin.', '[whispers] [slowly]', 2.8), L('Ben bunu yazmamıştım.', '[trembling voice]', 2.8),
    L('Daha altta, tozu hâlâ dökülen… taze bir satır vardı.', '[cautiously]', 2.2), L('Yirmincide ona sorma.', '[slowly]', 1.2),
    L('Kardeşine sor.', '[whispers]', 3.2), L('Benim kardeşim… o gece evdeydi.', '[trembling voice]'),
], [
    S('scene', 0, **NIGHT, c=[960, 400, 1.2], c2=[960, 420, 1.1], echoes='turn', turnAt=-100, bob=0.8, key=20, steps=6),
    S('scene', 1, **NIGHT, c=[1100, 330, 2.0], c2=[1090, 325, 2.3], echoes='turn', turnAt=-100, key=30, sfx=hb(0, 120, 0.25)),
    S('scene', 2, set='corridor', lit=0.5, c=[960, 560, 1.02], c2=[960, 540, 1.3], bob=0.9, key=20, steps=6),
    S('door', 3, style='school', mode='open', openAt=6, behind='dark', pushHand=True, feet=False, key=30, sfx=[[8, 'big_step', 0.25]]),
    S('door', 4, style='school', mode='still', feet=False, key=30, sfx=[[2, 'land', 0.35]]),
    S('scene', ('a', 4, 14), **CLS, c=[760, 460, 1.0], c2=[760, 420, 1.15], bob=0.3, key=20, steps=3),
    S('scene', 5, **CLS, tally=19, c=[735, 330, 1.1], c2=[600, 270, 1.9], key=14),
    S('scene', 6, **CLS, tally=19, c=[600, 270, 1.9], c2=[900, 270, 1.9], key=40),
    S('scene', 7, **CLS, tally=19, board=BOARD, c=[740, 330, 1.5], c2=[740, 370, 1.75], key=40, sfx=hb(60, 230, 0.25)),
    S('scene', 9, **CLS, tally=19, board=BOARD, c=[740, 380, 1.75], c2=[740, 384, 1.88], key=40, sfx=[[4, 'drone_hit', 0.3]]),
    S('scene', 10, **CLS, blur=True, c=[740, 400, 1.6], hand=[960, 640, 1.2], key=30),
    S('scene', 11, **CLS, tally=19, board=BOARD2, boardAt=[0, 0, 100, 150], c=[740, 380, 1.75], c2=[740, 470, 1.8], key=200, sfx=hb(100, 330)),
    S('scene', 14, **CLS, tally=19, board=BOARD2, c=[740, 490, 1.85], c2=[740, 498, 2.1], key=40, sfx=hb(0, 170) + [[40, 'drone_hit', 0.4]]),
    card(14, 8),
], bg='class')

# ---------------------------------------------------------------- 8 · Yalan
ep(8, [
    T('Neredesin?', DV, 1.4), L('Okuldayım.', '[nervous]', 1.6), T('Tahtada ne yazıyor?', '[deep voice] [slowly]', 2.4),
    L('Hiçbir şey.', '[whispers]', 2.6), T('Yalan söylüyorsun.', DV, 1.0), T('Bunu on dokuz kere yaptın.', '[deep voice] [slowly]', 2.8),
    L('Sustum.', '[whispers]', 2.6), T('Ona gidersen… bu sefer seni kurtaramam.', '[deep voice] [slowly]', 3.0),
    L('Koridorda, ıslak ayak izleri vardı.', '[cautiously]', 1.2), L('Küçük.', '', 0.8), L('Aynı izler.', '[whispers]', 2.4),
    L('Çatı merdivenine çıkıyorlardı.', '[nervous]', 2.8), L('Basamakta biri duruyordu.', '[whispers]', 1.2), L('Sırtı bana dönük.', '', 1.8),
    L('Bir şarkı mırıldanıyordu.', '[softly]', 2.6), L('Annemin bize söylediği şarkıyı.', '[trembling voice] [slowly]'),
], [
    S('phone', 0, mode='ring', key=20, sfx=[[4, 'phone_ring', 0.5, 32], [40, 'phone_ring', 0.5, 66]]),
    S('phone', (0, -4), mode='live', rise=False, key=10, sfx=[[0, 'copy_click', 0.3]]),
    S('scene', 1, **CLS, tally=19, board=BOARD2, c=[740, 420, 1.5], c2=[740, 420, 1.6], key=20),
    S('phone', 2, mode='live', rise=False, key=20),
    S('scene', 3, **CLS, tally=19, board=BOARD2, c=[740, 490, 1.85], c2=[740, 498, 2.1], key=30, sfx=hb(0, 120, 0.25)),
    S('phone', 4, mode='live', rise=False, key=20),
    S('scene', 6, **{**CLS, 'dark': 0.4}, tally=19, board=BOARD2, c=[900, 560, 1.05], c2=[860, 540, 1.2], key=30, sfx=hb(0, 120)),
    S('phone', 7, mode='live', rise=False, key=30),
    S('scene', 8, set='corridor', lit=0.4, c=[960, 620, 1.1], c2=[960, 600, 1.25], prints=[960, 1000, 1.5, 9], bob=0.4, key=30, steps=5),
    S('floor', 9, floor='tiles', prints=True, walk=0.15, drift=5, night=0.45, key=20),
    S('scene', 10, set='corridor', lit=0.3, c=[960, 560, 1.6], c2=[960, 540, 2.2], prints=[960, 1000, 1.5, 9], dark=0.15, key=30, sfx=hb(0, 120, 0.2)),
    S('scene', 11, **STAIRS, c=[700, 560, 1.25], c2=[420, 330, 1.42], prints=[760, 660, 0.9, 6, -50], bob=0.3, key=60, steps=3),
    S('scene', 12, **STAIRS, c=[400, 300, 1.42], c2=[440, 290, 1.7], who=[dict(who='sis', at='step', back=True, sway=True)], key=40, sfx=bed('hum', 0, 250, 0.3, 84)),
    S('scene', 14, **STAIRS, c=['step', 190, 2.6], c2=['step', 200, 3.2], who=[dict(who='sis', at='step', back=True, sway=True)], key=60, sfx=bed('hum', 0, 300, 0.4, 84) + hb(40, 300, 0.2)),
    card(15, 9),
], bg='class')

# ---------------------------------------------------------------- 9 · Elif
SIS = dict(who='sis', at='step')
ep(9, [
    L('Elif?', '[whispers]', 2.8), L('Mırıldanma kesildi.', '[softly]', 1.6), L('Döndü.', '', 1.4), L('Gözleri normaldi.', '[softly]', 2.4),
    L('Beni görünce sevinmedi.', '[nervous]', 1.2), L('Bir adım geri çekildi.', '', 2.4), L('Abi… sen hangisisin?', '[whispers] [cautiously]', 3.0),
    L('Ne demek hangisi?', '[curious]', 2.0), L('Telefonun var mı?', '[nervous]', 0.8), L('Varsa at.', '', 1.2),
    L('O telefondaki… sen değilsin.', '[whispers] [slowly]', 3.0), L('Cebimdeki telefon titredi.', '[nervous]', 1.4),
    L('Açmadım.', '[softly]', 2.4), L('Kendi kendine açıldı.', '[trembling voice]', 2.4), T("Elif'e inanma.", DV, 1.2),
    T('Elif o gece yukarı baktı.', '[deep voice] [slowly]', 1.6), T('Ben gördüm.', '[deep voice] [whispers]'),
], [
    S('scene', 0, **STAIRS, c=['step', 190, 2.4], c2=['step', 190, 2.5], who=[dict(who='sis', at='step', back=True, sway=True)], key=20, sfx=bed('hum', 0, 62, 0.4, 84)),
    S('scene', 1, **STAIRS, c=['step', 150, 1.9], c2=['step', 160, 2.0], who=[dict(who='sis', at='step', back=True)], key=20),
    S('scene', 2, **STAIRS, c=['step', 170, 2.0], c2=['step', 190, 2.4], who=[dict(who='sis', at='step', back=True, turnAt=10)], key=40),
    S('scene', 3, **STAIRS, c=['step', 215, 3.6], c2=['step', 218, 4.0], who=[SIS], key=40),
    S('scene', 4, **STAIRS, c=['step', 180, 2.3], who=[dict(SIS, expr='worried')], key=20),
    S('scene', 5, **STAIRS, c=['step', 180, 2.3], c2=['step', 180, 2.1], who=[dict(who='sis', at='step', to='landing', move=[4, 26], expr='worried')], key=50, sfx=[[8, 'step', 0.3]]),
    S('scene', 6, **STAIRS, c=['landing', 215, 3.3], c2=['landing', 218, 3.8], who=[dict(who='sis', at='landing', expr='worried')], key=50, sfx=hb(0, 200, 0.25)),
    S('mirror', 7, mode='late', dark=0.2, key=32, sfx=[[0, 'rewind_start', 0.2]]),
    S('scene', 8, **STAIRS, c=['landing', 200, 2.8], c2=['landing', 210, 3.1], who=[dict(who='sis', at='landing', expr='worried', hold=True)], key=30),
    S('scene', 10, **STAIRS, c=['landing', 215, 3.6], c2=['landing', 218, 4.1], who=[dict(who='sis', at='landing', expr='worried')], key=40, sfx=hb(0, 170)),
    S('phone', ('a', 10, 8), mode='call', timer='58', key=30),
    S('phone', 11, mode='ring', key=30, sfx=[[6, 'phone_ring', 0.5, 34], [44, 'phone_ring', 0.5, 72], [82, 'phone_ring', 0.5, 108]]),
    S('phone', 13, mode='live', rise=False, talk=[400, 500], key=30, sfx=[[2, 'copy_click', 0.35], [4, 'drone_hit', 0.25]]),
    S('phone', 14, mode='live', rise=False, key=20),
    S('tape', 15, tau=[70, 118], light=[[0, 0.15], [60, 0.7]], key=50, sfx=[[0, 'glitch', 0.08, 20], [4, 'power_hum', 0.14, 92]]),
    S('scene', 16, **STAIRS, c=['landing', 215, 3.4], c2=['landing', 218, 4.0], who=[dict(who='sis', at='landing', expr='worried', exprAt=[24, 'shock'])], key=60, sfx=hb(0, 220) + [[26, 'drone_hit', 0.4]]),
    card(16, 10),
], bg='stairs')

# ---------------------------------------------------------------- 10 · Kime
SISL = dict(who='sis', at='landing', expr='worried')
ep(10, [
    L('İkisi de bana bakıyordu.', '[nervous]', 1.4), L('Biri karşımda.', '', 1.2), L('Biri avucumda.', '[whispers]', 2.6),
    L('Elif kolunu sıvadı.', '[curious]', 1.8), L('Kalemle çizilmiş… yirmi çizgi.', '[slowly]', 2.8),
    L('Her gece üç on yedide baştan başlıyor, dedi.', '[softly]', 1.4), L('Sen unutuyorsun.', '', 1.0), L('Ben unutmuyorum.', '[whispers]', 2.8),
    L('İspat et.', '[nervous]', 2.2), L('Şimdi "sakın" diyecek.', '[whispers]', 2.6), T('Sakın…', DV, 1.8),
    L('Telefonu merdivenden aşağı fırlattım.', '[breathless]', 3.0), L('Çalmaya devam etti.', '[nervous]', 1.8),
    L('Ekranı kırılmıştı… ama yazı okunuyordu.', '[cautiously]', 2.4), L('Arayan artık "Ben" değildi.', '[trembling voice]', 2.4),
    L('Arayan… üç on yedi.', '[whispers] [slowly]'),
], [
    S('scene', 0, **STAIRS, c=['landing', 215, 3.4], c2=['landing', 215, 3.6], who=[dict(SISL, expr='shock')], key=20),
    S('scene', 1, **STAIRS, c=['landing', 180, 2.2], who=[SISL], key=20),
    S('phone', 2, mode='live', rise=False, talk=[900, 901], key=30),
    S('paper', 3, kind='arm', tally=20, key=70, sfx=[[4, 'paper_land', 0.15]]),
    S('clock', 5, text='03:16', textAt=[44, '03:17'], lamp=0.2, key=60, sfx=[[44, 'drone_hit', 0.25], [0, 'rewind_start', 0.15]]),
    S('scene', 6, set='bedroom', eyes=[[0, 0], [12, 0.5], [18, 0.3], [30, 1]], c=[1000, 540, 1.15], c2=[1000, 540, 1.25], key=40, sfx=[[0, 'room_tone', 0.1, 100]]),
    S('scene', 7, **STAIRS, c=['landing', 218, 4.2], c2=['landing', 218, 4.6], who=[SISL], key=30, sfx=hb(0, 120, 0.25)),
    S('scene', 8, **STAIRS, c=['landing', 180, 2.2], who=[SISL], hand=[1040, 780, 0.9], key=20),
    S('scene', 9, **STAIRS, c=['landing', 210, 3.2], c2=['landing', 215, 3.5], who=[dict(SISL, hold=True)], key=30),
    S('phone', 10, mode='live', rise=False, key=16, sfx=[[10, 'drone_hit', 0.3]]),
    S('scene', 11, **STAIRS, c=[420, 320, 1.42], c2=[860, 640, 1.7], shakeAt=4, key=50, sfx=[[14, 'tumble', 0.5], [52, 'crack', 0.35]]),
    S('scene', 12, **{**STAIRS, 'dark': 0.4}, c=[860, 640, 1.7], c2=[860, 660, 2.0], key=30, sfx=[[4, 'phone_ring', 0.4, 32], [42, 'phone_ring', 0.4, 70]]),
    S('phone', 13, mode='crack', key=40, sfx=[[6, 'phone_ring', 0.5, 34], [44, 'phone_ring', 0.5, 72], [82, 'phone_ring', 0.5, 108]]),
    S('phone', 14, mode='crack', rise=False, callerAt=[78, '03:17'], key=100, sfx=[[6, 'phone_ring', 0.5, 34], [44, 'phone_ring', 0.5, 72], [82, 'phone_ring', 0.5, 108], [120, 'phone_ring', 0.5, 146], [78, 'drone_hit', 0.45]] + hb(0, 250)),
    card(15, 11),
], bg='stairs')

# ---------------------------------------------------------------- 11 · Çatı
OTHB = dict(who='other', at='edge', back=True)
ep(11, [
    L('Elif elimi tuttu.', '[softly]', 1.2), L('Buz gibiydi.', '[whispers]', 2.6), L('Işık gökten gelmiyor, dedi.', '[softly]', 2.2),
    L('Nereden geliyor?', '[curious]', 2.0), L('Bizim çatıdan.', '[whispers]', 3.2), L('Merdivenleri çıktık.', '[cautiously]', 2.6),
    L('Kapı aralıktı.', '[whispers]', 2.8), L('Çatıda, korkuluğun yanında biri duruyordu.', '[nervous]', 1.4),
    L('Sırtı bize dönük.', '[whispers]', 2.4), L('Kapüşonunu tanıdım.', '[trembling voice]', 1.2), L('İplerini tanıdım.', '[whispers]', 2.8),
    L('Döndü.', '', 2.6), L('Benim yüzümdü.', '[trembling voice]', 1.4), L('Ama çok yorgundu.', '[softly]', 2.8),
    L('Nihayet, dedi.', '[deep voice] [slowly]', 1.4), L('Yirminci.', '[deep voice] [whispers]'),
], [
    S('phone', 0, mode='crack', rise=False, caller='03:17', key=20, sfx=[[4, 'phone_ring', 0.4, 30], [40, 'phone_ring', 0.3, 64]]),
    S('scene', (0, -2), **STAIRS, c=['landing', 190, 2.4], c2=['landing', 195, 2.6], who=[dict(who='sis', at='landing')], hand=[1010, 820, 0.9], key=30),
    S('scene', 2, **STAIRS, c=['landing', 215, 3.4], c2=['landing', 218, 3.7], who=[dict(who='sis', at='landing')], key=30),
    S('scene', 3, **STAIRS, c=['landing', 180, 2.2], who=[dict(who='sis', at='landing')], key=20),
    S('scene', 4, **STAIRS, c=['landing', 215, 3.0], c2=['landing', 330, 2.2], who=[dict(who='sis', at='landing', hold=True, up=True)], key=40, sfx=[[30, 'drone_hit', 0.3]]),
    S('floor', 5, floor='boards', walk=0.5, night=0.45, key=20, steps=7),
    S('door', 6, style='roof', mode='open', openAt=44, behind='dark', feet=False, pushHand=True, key=90, sfx=[[40, 'roof_wind', 0.18, 200]]),
    S('scene', 7, **ROOF, c=[960, 600, 1.1], c2=[960, 620, 1.25], who=[OTHB], key=40, sfx=[[0, 'roof_wind', 0.16, 200]]),
    S('scene', 9, **ROOF, c=['edge', 240, 2.6], c2=['edge', 260, 3.2], who=[OTHB], key=40, sfx=[[0, 'roof_wind', 0.14, 200]] + hb(0, 170, 0.25)),
    S('scene', 11, **ROOF, c=['edge', 250, 3.0], who=[dict(who='other', at='edge', back=True, turnAt=16, expr='tired')], key=50, sfx=[[16, 'drone_hit', 0.4]] + hb(0, 110)),
    S('scene', 12, **ROOF, c=['edge', 325, 4.6], c2=['edge', 328, 5.4], who=[dict(who='other', at='edge', expr='tired')], key=60, sfx=hb(0, 220, 0.3) + [[0, 'roof_wind', 0.12, 200]]),
    S('scene', 14, **ROOF, c=['edge', 300, 3.6], c2=['edge', 320, 4.4], who=[dict(who='other', at='edge', expr='tired')], key=50, sfx=hb(0, 200) + [[70, 'drone_hit', 0.4]]),
    card(15, 12),
], bg='stairs')

# ---------------------------------------------------------------- 12 · Öteki
OTH = dict(who='other', at='near', expr='tired')
ep(12, [
    L('Ben senim, dedi.', '[deep voice] [slowly]', 1.2), L('İlk gecenin seni.', DV, 2.6), L('O gece yukarı bakmayan bendim.', '[deep voice] [slowly]', 1.2),
    L('Burada kalan da.', '[deep voice] [whispers]', 2.6), L('Dört yüz on iki gecedir… yalnızım.', '[deep voice] [softly]', 3.2),
    L('Peki ben kimim?', '[nervous]', 2.4), L('Sen her sabah uyanan sensin.', '[deep voice] [slowly]', 1.2), L('Hiçbir şey hatırlamayan.', '[deep voice] [softly]', 2.8),
    L('Seni her gece ben arıyorum.', DV, 1.2), L('Kapıdan uzak tutmak için.', '[deep voice] [whispers]', 2.8), L('Kapıda kim var?', '[nervous]', 3.0),
    L("Elif'e baktı.", '[softly]', 1.0), L('Sonra bana.', '', 2.4), L('Sana söylemedi mi?', '[deep voice] [slowly]', 1.8),
    L('Onu buraya ben getirmedim.', DV, 2.4), L('Sen getirdin.', '[deep voice] [whispers]'),
], [
    S('scene', 0, **ROOF, c=['near', 300, 1.5], c2=['near', 315, 1.8], who=[OTH], key=30, sfx=[[0, 'roof_wind', 0.14, 200]]),
    S('tape', 1, on='watcher', face=1, tau=[100, 120], box=True, key=30, sfx=[[0, 'glitch', 0.1, 30]]),
    S('tape', 2, tau=[70, 110], light=[[0, 0.2], [60, 0.7]], key=40, sfx=[[0, 'power_hum', 0.12, 88]]),
    S('scene', 3, **ROOF, c=[960, 620, 1.1], c2=[960, 640, 1.02], who=[OTHB], key=40, sfx=[[0, 'roof_wind', 0.18, 200]]),
    S('scene', 4, **ROOF, c=['near', 325, 2.2], c2=['near', 328, 2.6], who=[OTH], key=50, sfx=[[0, 'roof_wind', 0.12, 200]]),
    S('scene', 5, **ROOF, blur=True, c=[960, 600, 1.2], hand=[960, 660, 1.2], key=30),
    S('scene', 6, set='bedroom', eyes=[[0, 0], [16, 0.5], [22, 0.3], [40, 1]], c=[1000, 540, 1.15], c2=[1000, 540, 1.25], key=50, sfx=[[0, 'room_tone', 0.1, 150]]),
    S('scene', 7, set='kitchen', c=[960, 520, 1.3], c2=[960, 510, 1.5], key=30, sfx=[[10, 'clink', 0.15]]),
    S('phone', 8, mode='ring', key=30, sfx=RING, bg='bedroom'),
    S('door', 9, mode='knock', knocks=[20, 29, 38], small=True, key=30, sfx=[[14, 'knock', 0.8]]),
    S('door', 10, mode='still', small=True, key=40, sfx=hb(0, 170)),
    S('scene', 11, **ROOF, c=[960, 720, 1.25], who=[dict(who='other', at='nearR', expr='tired', yaw=-0.5, look=-1), dict(who='sis', at='nearL', down=True)], key=20),
    S('scene', 12, **ROOF, c=['nearR', 310, 1.9], c2=['nearR', 318, 2.1], who=[dict(who='other', at='nearR', expr='tired')], key=30),
    S('scene', 13, **ROOF, c=['near', 300, 1.6], c2=['near', 315, 1.9], who=[dict(OTH, yaw=0.5, look=1)], key=50, sfx=hb(0, 220, 0.25)),
    S('scene', 15, **ROOF, c=['nearL', 235, 2.6], c2=['nearL', 240, 3.2], who=[dict(who='sis', at='nearL', down=True, expr='worried')], key=50, sfx=hb(0, 200) + [[8, 'drone_hit', 0.4]]),
    card(15, 13),
], bg='roof')

# ---------------------------------------------------------------- 13 · İlk gece
ep(13, [
    L('Bana kaydı gösterdi.', '[softly]', 1.2), L('İlk gecenin kaydını.', '[whispers]', 2.6), L('Saat üç on yedi.', '[slowly]', 1.0),
    L('Market.', '', 1.4), L('Herkes yukarı bakıyor.', '[nervous]', 2.8), L('Ben kameraya bakıyorum.', '[whispers]', 2.4),
    L('Ve bir elim… yanımdaki çocuğun gözlerini kapatıyor.', '[trembling voice] [slowly]', 2.6), L("Elif'in gözlerini.", '[whispers]', 3.0),
    L('Bakmasın diye.', '[softly]', 1.0), L('Korkmasın diye.', '[trembling voice]', 3.2), L('Bakan herkes gitti.', '[slowly]', 1.4),
    L('Bakmayan iki kişi kaldı.', '[whispers]', 2.8), L('Nereye gittiler?', '[nervous]', 2.4), L('Yukarı, dedi.', DV, 1.0),
    L('Sabaha.', '[deep voice] [softly]', 3.0), L('Kötü olan yukarısı değil.', '[deep voice] [slowly]', 1.6), L('Kötü olan… burası.', '[deep voice] [whispers]'),
], [
    S('scene', 0, **ROOF, c=['nearL', 235, 2.8], who=[dict(who='sis', at='nearL', down=True, expr='worried')], key=20),
    S('tape', (0, 0), tau=[126, 20], rewind=True, key=30, sfx=[[0, 'rewind', 0.3, 60]]),
    S('tape', 2, tau=[-50, 4], rec=True, key=40, sfx=[[0, 'room_tone', 0.1, 120]]),
    S('tape', 4, tau=[60, 118], light=[[0, 0.1], [70, 0.75]], key=60, sfx=[[0, 'power_hum', 0.16, 88], [84, 'power_hum', 0.2, 172]]),
    S('tape', 5, tau=[100, 122], on='pan', face=1, z=[1.0, 4.4], light=0.5, key=70),
    S('tape', 6, tau=[104, 124], on='watcher', face=1, cover=True, z=[4.6, 5.6], light=0.5, box=True, boxAt=40, key=80, sfx=hb(0, 260, 0.25) + [[40, 'select_draw', 0.2]]),
    S('tape', 8, tau=[110, 125], on='watcher', face=1, cover=True, z=[6.2, 7.0], light=0.55, key=40, sfx=hb(0, 200, 0.25)),
    S('tape', 10, tau=[118, 126], light=[[0, 0.75], [50, 1]], white=True, key=30, sfx=[[0, 'power_hum', 0.25, 60], [56, 'power_down', 0.35]]),
    S('scene', 11, set='market', dark=0.35, c=[960, 505, 1.2], c2=[960, 505, 1.35], who=[dict(who='self', at='far'), dict(who='sis', at=[1010, 548, 0.34], eyesShut=True)], key=40),
    S('scene', 12, **ROOF, c=['near', 310, 1.8], who=[OTH], key=20, sfx=[[0, 'roof_wind', 0.14, 200]]),
    S('scene', 13, **ROOF, c=['near', 320, 1.7], c2=['near', 520, 1.5], who=[dict(who='other', at='near', expr='tired', up=True)], key=50, sfx=[[0, 'roof_wind', 0.14, 200]]),
    S('scene', 15, **ROOF, c=['near', 325, 2.4], c2=['near', 328, 2.9], who=[OTH], key=40, sfx=hb(0, 200, 0.25)),
    S('scene', (16, 20), **NIGHT, c=[960, 540, 1.05], c2=[960, 540, 1.25], key=50, sfx=hb(0, 170) + [[20, 'drone_hit', 0.4]]),
    card(16, 14),
], bg='roof')

# ---------------------------------------------------------------- 14 · Kural
ep(14, [
    L('Kural basit, dedi.', DV, 1.4), L('Üç on yedide ışığa bakan… sabaha çıkar.', '[deep voice] [slowly]', 2.8),
    L('O zaman sen neden çıkmadın?', '[nervous]', 2.6), L('Elindekini gösterdi.', '[softly]', 1.2), L('Bir ayna parçası.', '[whispers]', 2.8),
    L('Işığı, biri tutmak zorunda.', '[deep voice] [slowly]', 1.4), L('Tutan… bakamaz.', '[deep voice] [whispers]', 3.0),
    L('Dört yüz on iki gecedir, herkesi ben gönderiyorum.', '[deep voice] [softly]', 2.8), L('Pencerelerdekiler?', '[nervous]', 2.2),
    L('Onlar yankı.', DV, 1.0), L('Gidenlerin bıraktığı.', '[deep voice] [whispers]', 3.0), L('Elif elimi sıktı.', '[softly]', 2.2),
    L('Yalan söylüyor abi.', '[whispers] [nervous]', 1.4), L('Işığı tutan, gidemez.', '[whispers]', 2.4), L('Seni yerine bırakacak.', '[trembling voice] [slowly]'),
], [
    S('scene', 0, **NIGHT, c=[960, 540, 1.2], c2=[960, 540, 1.3], key=20),
    S('scene', (0, -2), **ROOF, c=['near', 310, 1.7], c2=['near', 315, 1.8], who=[OTH], key=20, sfx=[[0, 'roof_wind', 0.14, 200]]),
    S('tape', 1, tau=[70, 124], light=[[0, 0.15], [80, 0.95]], key=70, sfx=[[0, 'power_hum', 0.16, 88], [84, 'power_hum', 0.22, 172]]),
    S('scene', 2, **ROOF, c=['near', 325, 2.3], c2=['near', 328, 2.6], who=[OTH], key=30),
    S('shard', 3, key=40, sfx=[[6, 'clink', 0.12]]),
    S('shard', 5, light=[[0, 0], [70, 0.85]], key=70, sfx=[[4, 'power_hum', 0.16, 92]]),
    S('scene', 6, **ROOF, c=['near', 325, 2.6], c2=['near', 328, 3.0], who=[dict(OTH, eyesShut=True)], light=[[0, 0.3], [40, 0.12]], key=40, sfx=hb(0, 170, 0.25)),
    S('scene', 7, **ROOF, c=[960, 620, 1.1], c2=[960, 600, 1.25], who=[dict(OTHB, hold=True)], light=[[0, 0], [70, 0.4]], key=70, sfx=[[0, 'roof_wind', 0.16, 200], [0, 'power_hum', 0.12, 88]]),
    S('scene', 8, **NIGHT, c=[960, 400, 1.1], c2=[960, 390, 1.2], echoes=True, key=30),
    S('scene', 9, **NIGHT, c=[1100, 330, 2.0], c2=[1095, 325, 2.4], echoes=True, key=40, sfx=hb(0, 170, 0.2)),
    S('scene', 11, **ROOF, c=['nearL', 220, 2.3], c2=['nearL', 225, 2.5], who=[dict(who='sis', at='nearL')], hand=[1010, 830, 0.9], key=30),
    S('scene', 12, **ROOF, c=['nearL', 238, 3.2], c2=['nearL', 240, 3.6], who=[dict(who='sis', at='nearL', expr='worried')], key=40, sfx=hb(0, 220, 0.25)),
    S('scene', 14, **ROOF, c=['near', 320, 2.0], c2=['near', 328, 2.9], who=[OTH], key=60, sfx=hb(0, 200) + [[30, 'drone_hit', 0.4]]),
    card(14, 15),
], bg='roof')

# ---------------------------------------------------------------- 15 · On dokuz
ep(15, [
    L('Öteki ben, cebinden bir defter çıkardı.', '[softly]', 2.4), L('On dokuz satır.', '[slowly]', 1.2), L('Hepsinde aynı isim.', '', 1.0),
    L('Benim ismim.', '[whispers]', 2.6), L('Hepsinin yanında, bir işaret.', '[curious]', 2.8),
    L('Seni on dokuz kere gönderdim, dedi.', '[deep voice] [slowly]', 1.2), L('Sabaha.', DV, 0.9), L('Annene.', '[deep voice] [softly]', 2.8),
    L('On dokuzunda da geri geldin.', '[deep voice] [slowly]', 2.8), L('Neden?', '[whispers]', 2.8), L("Elif'e baktı.", '[softly]', 2.4),
    L('Çünkü o hiç gelmedi.', '[deep voice] [slowly]', 3.0), L('Elif başını eğdi.', '[softly]', 2.6),
    L('Ben ışığı görmüyorum abi.', '[whispers] [trembling voice]', 1.8), L('Hiç görmedim.', '[whispers]'),
], [
    S('scene', 0, **ROOF, c=['near', 320, 2.2], c2=['near', 300, 1.7], who=[dict(OTH, hold=True)], key=40, sfx=[[0, 'roof_wind', 0.14, 200]]),
    S('paper', 1, kind='notebook', rows=19, row='Kaan', key=60, sfx=[[2, 'paper_land', 0.2]]),
    S('paper', 4, kind='notebook', rows=19, row='Kaan', at=-40, key=30, sfx=hb(0, 120, 0.2)),
    S('scene', 5, **ROOF, c=['near', 325, 2.3], c2=['near', 328, 2.6], who=[OTH], key=30),
    S('scene', 6, set='kitchen', veil=0.08, c=[960, 520, 1.15], c2=[960, 510, 1.3], who=[dict(who='mom', at='island', expr='happy')], mugs=2, light=0.25, key=40, sfx=[[0, 'sparkle', 0.08]]),
    S('scene', 8, set='bedroom', eyes=[[0, 0], [16, 0.5], [22, 0.3], [40, 1]], c=[1000, 540, 1.15], c2=[1000, 540, 1.25], key=50, sfx=[[0, 'rewind_start', 0.2]]),
    S('scene', 9, **ROOF, c=['near', 325, 2.6], c2=['near', 328, 3.0], who=[OTH], key=40, sfx=hb(0, 170, 0.25)),
    S('scene', 10, **ROOF, c=[960, 720, 1.25], who=[dict(who='other', at='nearR', expr='tired', yaw=-0.5, look=-1), dict(who='sis', at='nearL')], key=30),
    S('scene', 11, **ROOF, c=['nearL', 200, 2.0], c2=['nearL', 215, 2.4], who=[dict(who='sis', at='nearL')], key=40, sfx=[[0, 'roof_wind', 0.14, 200]]),
    S('scene', 12, **ROOF, c=['nearL', 225, 2.8], c2=['nearL', 230, 3.0], who=[dict(who='sis', at='nearL', down=True, expr='worried')], key=30),
    S('scene', 13, **ROOF, c=['nearL', 236, 3.4], c2=['nearL', 240, 4.0], who=[dict(who='sis', at='nearL', expr='worried')], key=50, sfx=hb(0, 230) + [[60, 'drone_hit', 0.4]]),
    card(14, 16),
], bg='roof')

# ---------------------------------------------------------------- 16 · Elif'in gözleri
SISR = dict(who='sis', at='nearL')
ep(16, [
    L('Herkes yukarı bakıyor, dedi Elif.', '[softly]', 1.4), L('Ben de bakıyorum.', '[whispers]', 1.4), L('Hiçbir şey yok.', '[trembling voice]', 3.2),
    L('Saat üç on dörttü.', '[nervous]', 2.8), L('Öteki ben konuştu.', '[softly]', 1.4), L('Bu sefer geri gelme.', '[deep voice] [slowly]', 1.4),
    L('Ona ben bakarım.', DV, 1.6), L('Dört yüz on iki gece baktım zaten.', '[deep voice] [softly]', 3.2), L("Elif'e döndüm.", '', 1.2),
    L('Ağlamıyordu.', '[whispers]', 1.4), L('Bu daha kötüydü.', '[trembling voice]', 3.0), L('Git abi, dedi.', '[softly]', 1.2),
    L('Annem seni soruyordur.', '[whispers]', 3.2), L('Elini bırakmadım.', '[nervous]', 2.8), L('Aklıma, holdeki ayna geldi.', '[curious]', 1.8),
    L('Bir saniye geç kalan ayna.', '[whispers] [slowly]'),
], [
    S('scene', 0, **ROOF, c=['nearL', 236, 3.4], who=[dict(SISR, expr='worried')], key=20),
    S('tape', (0, 0), tau=[80, 120], light=0.5, key=30, sfx=[[0, 'power_hum', 0.1, 80]]),
    S('scene', 1, **ROOF, c=['nearL', 240, 2.6], c2=['nearL', 330, 2.2], who=[dict(SISR, up=True)], key=30),
    S('scene', 2, **ROOF, c=[960, 260, 1.4], c2=[960, 220, 1.6], key=40, sfx=[[0, 'roof_wind', 0.18, 200]]),
    S('watch', 3, text='03:14', key=30, sfx=[[8, 'drone_hit', 0.3]]),
    S('scene', 4, **ROOF, c=['near', 310, 1.8], who=[OTH], key=20),
    S('scene', 5, **ROOF, c=['near', 325, 2.4], c2=['near', 328, 2.8], who=[OTH], key=40),
    S('scene', 7, **ROOF, c=[960, 620, 1.15], c2=[960, 640, 1.05], who=[OTHB], key=40, sfx=[[0, 'roof_wind', 0.16, 200]]),
    S('scene', 8, **ROOF, c=['nearL', 200, 2.0], who=[SISR], bob=0.2, key=20),
    S('scene', 9, **ROOF, c=['nearL', 236, 3.4], c2=['nearL', 240, 4.0], who=[SISR], key=50, sfx=hb(0, 200, 0.2)),
    S('scene', 11, **ROOF, c=['nearL', 236, 3.0], who=[dict(SISR, expr='happy')], key=20),
    S('scene', 12, set='kitchen', veil=0.1, c=[960, 520, 1.2], c2=[960, 510, 1.4], who=[dict(who='mom', at='island')], light=0.2, blur=True, key=40),
    S('scene', 13, **ROOF, c=['nearL', 220, 2.4], c2=['nearL', 225, 2.6], who=[SISR], hand=[1010, 830, 0.9], key=30, sfx=hb(0, 170, 0.25)),
    S('mirror', 14, mode='normal', key=20),
    S('mirror', 15, mode='late', key=32, sfx=hb(0, 200) + [[28, 'drone_hit', 0.4]]),
    card(15, 17),
], bg='roof')

# ---------------------------------------------------------------- 17 · Ayna
ep(17, [
    L('Işığı göremiyorsan, dedim… yansımasını görürsün.', '[curious]', 2.8), L('Öteki ben güldü.', '[softly]', 1.0),
    L('Yorgun bir gülüştü.', '[whispers]', 2.4), L('Bunu hiç denemedin.', '[deep voice] [slowly]', 1.2), L('On dokuz kerede, bir kez bile.', DV, 2.8),
    L('Saat üç on beşti.', '[nervous]', 1.0), L('İki dakika.', '[whispers]', 2.4), L('Merdivenlerden aşağı koştum.', '[breathless]', 1.2),
    L('Sokağa.', '[breathless]', 1.0), L('Bizim kapıya.', '[breathless]', 2.4), L('Aynayı duvardan söktüm.', '[breathless]', 2.8),
    L('Dışarı çıktığımda… pencereler boştu.', '[nervous]', 2.6), L('Yankılar aşağı inmişti.', '[whispers]', 2.4),
    L('Sokakta duruyorlardı.', '[trembling voice]', 1.2), L('Hepsi bana bakıyordu.', '[whispers]', 3.0), L('Ve yürümeye başladılar.', '[trembling voice] [slowly]'),
], [
    S('mirror', 0, mode='late', key=32),
    S('scene', (0, 0), **ROOF, c=['nearL', 236, 3.0], c2=['nearL', 240, 3.3], who=[dict(SISR, expr='worried')], key=30),
    S('scene', 1, **ROOF, c=['near', 320, 2.2], c2=['near', 325, 2.4], who=[dict(who='other', at='near', expr='tired', exprAt=[10, 'happy'])], key=30),
    S('scene', 3, **ROOF, c=['near', 325, 2.6], c2=['near', 328, 3.0], who=[OTH], key=40),
    S('watch', 5, text='03:15', key=30, sfx=[[6, 'drone_hit', 0.3]] + hb(20, 110, 0.3)),
    S('scene', 7, **STAIRS, c=[330, 290, 1.5], c2=[860, 660, 1.7], bob=1, key=20, steps=8),
    S('scene', 8, **NIGHT, c=[960, 620, 1.1], c2=[960, 600, 1.2], bob=1, key=14, steps=4),
    S('door', 9, style='home', mode='open', openAt=4, behind='dark', pushHand=True, feet=False, key=24, sfx=[[4, 'land', 0.25]]),
    S('mirror', 10, mode='normal', hand=[1160, 600, 0.9], key=30, sfx=[[34, 'crack', 0.2]]),
    S('glass', ('a', 10, 30), bg='street', bob=1, key=20, steps=4),
    S('scene', 11, **NIGHT, c=[960, 380, 1.3], c2=[960, 400, 1.15], key=40),
    S('scene', 12, **NIGHT, c=[960, 400, 1.15], c2=[960, 580, 1.08], who=CROWD, key=70, sfx=hb(0, 170, 0.25)),
    S('scene', 13, **NIGHT, c=[960, 560, 1.3], c2=[960, 555, 1.5], who=CROWD, key=40, sfx=hb(0, 200)),
    S('scene', 15, **NIGHT, c=[960, 570, 1.15], c2=[960, 575, 1.25], who=[
        dict(who='mom', at='far', to='mid', move=[26, 150], glow=True), dict(who='mo', at='mid', to='near', move=[20, 150], glow=True),
        dict(who='suit', at='right', to=[1150, 880, 0.75], move=[30, 150], glow=True), dict(who='dark', at='left', to=[720, 960, 0.9], move=[24, 150], glow=True),
        dict(who='suit', at=[905, 610, 0.3], to=[880, 700, 0.5], move=[30, 150], glow=True), dict(who='mo', at=[1020, 600, 0.27], to=[1050, 680, 0.45], move=[36, 150], glow=True),
    ], key=110, sfx=hb(0, 220, 0.35) + [[26, 'drone_hit', 0.45]], steps=8),
    card(15, 18),
], bg='roof')

# ---------------------------------------------------------------- 18 · 03:16
ep(18, [
    L('Aynayı sırtıma aldım.', '[breathless]', 0.9), L('Koştum.', '[breathless]', 2.0), L('Merdiven.', '[breathless]', 0.7), L('Bir kat.', '', 0.7),
    L('İki kat.', '', 1.2), L('Arkamda ayak sesleri.', '[nervous]', 2.4), L('Çatı kapısından girdim.', '[breathless]', 1.2),
    L('Öteki ben kapıyı kapattı.', '', 1.0), L('Sırtını dayadı.', '[softly]', 2.2), L('Kapı vuruldu.', '[nervous]', 1.0), L('Üç kere.', '[whispers]', 2.8),
    L('Bana baktı.', '[softly]', 1.0), L('Gülümsedi.', '[softly]', 2.2), L('Sakın kapıyı açma, dedi.', '[deep voice] [slowly]', 2.8),
    L('Sesi, telefondaki sesti.', '[trembling voice]', 1.4), L('Yorgun.', '', 0.8), L('Ama benim sesim.', '[whispers]', 2.8),
    L('Saat üç on altı.', '[nervous]', 0.9), L('Elli dokuz saniye.', '[whispers]', 2.2), L("Aynayı, Elif'in önüne tuttum.", '[breathless]', 2.4),
    L('Gökyüzü açıldı.', '[whispers] [slowly]'),
], [
    S('scene', 0, **NIGHT, c=[960, 570, 1.2], who=[dict(who='mom', at='mid', glow=True), dict(who='mo', at='near', glow=True), dict(who='suit', at=[1150, 880, 0.75], glow=True), dict(who='dark', at=[720, 960, 0.9], glow=True)], key=20, sfx=hb(0, 80, 0.3)),
    S('floor', (0, 0), floor='asphalt', shoes=True, walk=1.3, night=0.5, key=20, steps=7),
    S('scene', 2, **STAIRS, c=[860, 660, 1.7], c2=[330, 290, 1.5], bob=1, key=30, steps=9),
    S('scene', 5, **{**STAIRS, 'dark': 0.4}, c=[760, 600, 1.4], c2=[800, 620, 1.6], who=[dict(who='mo', at='low', glow=True), dict(who='suit', at=[960, 760, 0.9], glow=True)], key=30, sfx=hb(0, 120, 0.35), steps=6),
    S('door', 6, style='roof', mode='open', openAt=2, behind='dark', pushHand=True, feet=False, key=20, sfx=[[2, 'big_step', 0.3]]),
    S('door', 7, style='roof', mode='still', feet=False, guard='tired', key=30, sfx=[[4, 'land', 0.4]]),
    S('door', 9, style='roof', mode='knock', knocks=[10, 19, 28], guard='tired', key=20, sfx=[[4, 'knock', 0.95]] + hb(40, 200)),
    S('door', 11, style='roof', mode='still', guard='tired', guardAt=[40, 'happy'], key=60),
    S('scene', 13, **ROOF, c=['near', 325, 2.4], c2=['near', 328, 2.8], who=[dict(who='other', at='near', expr='happy')], key=40, sfx=hb(0, 170, 0.25)),
    S('phone', 14, mode='live', rise=False, key=20, sfx=[[0, 'glitch', 0.08, 20]]),
    S('scene', 15, **ROOF, c=['near', 325, 3.0], c2=['near', 328, 3.4], who=[OTH], key=40),
    S('watch', 17, text='03:16:59', blink=True, key=30, sfx=hb(0, 150, 0.35) + [[4, 'drone_hit', 0.3]]),
    S('glass', 19, who='sis', light=0, expr='worried', key=40),
    S('scene', 20, **ROOF, c=[960, 300, 1.3], c2=[960, 200, 1.5], light=[[0, 0], [80, 0.6]], key=70, sfx=[[0, 'power_hum', 0.2, 88], [84, 'power_hum', 0.28, 172]]),
    card(20, 19),
], target=59, bg='roof')

# ---------------------------------------------------------------- 19 · 03:17
ep(19, [
    L('Elif aynaya baktı.', '[softly]', 2.2), L('Bir şey yok abi.', '[whispers]', 2.4), L('Bekle.', '[nervous]', 0.9),
    L('Ayna geç kalıyor.', '[whispers]', 3.0), L('Sonra… yüzü aydınlandı.', '[softly] [slowly]', 2.6), L('Görüyorum, dedi.', '[whispers]', 2.8),
    L('Ben de başımı kaldırdım.', '[softly]', 1.0), L('İlk kez.', '[whispers]', 3.6), L('Günaydın.', '[softly]', 2.6), L('Annemin sesi.', '[softly]', 1.0),
    L('Kahve kokusu.', '', 1.0), L('Elif masada.', '', 1.4), L('Sokak, insan dolu.', '[curious]', 2.6), L('Markete gittim.', '', 1.0),
    L('Kaydı açtırdım.', '[cautiously]', 2.4), L('Üç on yedi.', '[slowly]', 1.0), L('Herkes yukarı bakıyor.', '', 2.2), L('Bir kişi hariç.', '[whispers] [slowly]'),
], [
    S('glass', 0, who='sis', light=0, expr='neutral', key=30, sfx=hb(0, 170, 0.3)),
    S('glass', 1, who='sis', light=0, expr='worried', key=20, sfx=hb(0, 100, 0.3)),
    S('watch', 2, text='03:17:00', blink=True, key=20, sfx=hb(0, 100, 0.35)),
    S('glass', 3, who='sis', light=[[0, 0], [90, 0.3]], expr='worried', key=80, sfx=[[10, 'power_hum', 0.14, 98]]),
    S('glass', 4, who='sis', light=[[0, 0.3], [60, 0.68]], expr='worried', exprAt=[50, 'happy'], key=70, sfx=[[0, 'power_hum', 0.2, 88], [84, 'power_hum', 0.22, 172], [50, 'sparkle', 0.1]]),
    S('glass', 5, who='sis', light=[[0, 0.68], [80, 0.8]], expr='happy', key=40, sfx=[[0, 'power_hum', 0.24, 88], [84, 'power_hum', 0.24, 172]]),
    S('scene', 6, **{**ROOF, 'dark': 0.1}, c=[960, 520, 1.2], c2=[960, 120, 1.6], light=[[0, 0.35], [90, 1]], key=50, sfx=[[0, 'power_hum', 0.28, 88], [84, 'power_hum', 0.3, 172]]),
    S('blank', ('a', 7, 6), white=True, key=20),
    S('scene', 8, set='bedroom', clock='07:30', lamp=1, eyes=[[0, 0], [14, 0.5], [20, 0.35], [36, 1]], light=[[0, 0.5], [40, 0.15]], c=[1000, 540, 1.15], c2=[1000, 540, 1.22], key=50, sfx=[[0, 'room_tone', 0.12, 200]]),
    S('scene', 9, set='kitchen', veil=0.05, c=[960, 520, 1.15], c2=[960, 510, 1.3], who=[dict(who='mom', at='island', expr='happy')], mugs=2, light=0.15, key=30, sfx=[[8, 'clink', 0.2], [0, 'room_tone', 0.12, 200]]),
    S('scene', 11, set='kitchen', veil=0.05, c=[1060, 540, 1.5], c2=[1070, 535, 1.7], who=[dict(who='mom', at='left', expr='happy', inFront=False), dict(who='sis', at='right', expr='happy', wave=True)], mugs=2, light=0.15, key=30),
    S('scene', 12, set='street', lit=1.0, lamps=0, dead=True, cars=False, c=[960, 580, 1.08], c2=[960, 570, 1.18], who=[
        dict(who='mo', at=[700, 990, 1.0], walk=2.2), dict(who='suit', at=[1240, 930, 0.8], walk=-1.8), dict(who='dark', at=[820, 760, 0.5], walk=1.0),
        dict(who='mom', at=[1080, 700, 0.42], walk=-0.8), dict(who='suit', at=[900, 640, 0.3], walk=0.5)], key=40, sfx=[[0, 'class_murmur', 0.25, 60], [56, 'class_murmur', 0.25, 116], [112, 'class_murmur', 0.25, 172]]),
    S('scene', 13, set='market', c=[960, 505, 1.2], c2=[960, 505, 1.35], bob=0.4, who=[dict(who='mo', at='mid'), dict(who='suit', at='far', back=True)], key=20, steps=3),
    S('tape', 14, tau=[126, 20], rewind=True, key=30, sfx=[[0, 'rewind', 0.3, 60]]),
    S('tape', 15, tau=[-30, 30], rec=True, key=30, sfx=[[0, 'room_tone', 0.1, 100]]),
    S('tape', 16, tau=[70, 118], light=[[0, 0.1], [60, 0.6]], key=50, sfx=[[0, 'power_hum', 0.16, 88]]),
    S('tape', 17, tau=[100, 124], on='pan', face=1, z=[1.0, 4.6], light=0.5, box=True, boxAt=60, key=90, sfx=hb(0, 220, 0.3) + [[60, 'drone_hit', 0.4]]),
    card(17, 20),
], target=60, bg='roof')

# ---------------------------------------------------------------- 20 · Son
ep(20, [
    L('O, kameraya bakıyordu.', '[whispers]', 1.4), L('El salladı.', '[trembling voice]', 3.0), L('Kalmıştı.', '[softly]', 1.0),
    L('Bizim yerimize.', '[whispers]', 3.4), L('O gece uyuyamadım.', '[softly]', 2.8), L('Saat üç on yedide… telefonum çaldı.', '[nervous]', 2.8),
    L('Arayan: Ben.', '[whispers]', 2.6), L('Açtım.', '[softly]', 2.4), T('İyi misiniz?', '[deep voice] [softly]', 1.8), L('İyiyiz.', '[softly]', 1.8),
    T('Elif?', DV, 1.6), L('Uyuyor.', '[whispers]', 2.0), T('Güzel.', '[deep voice] [softly]', 3.2), L('Sustu.', '[softly]', 1.4),
    L('Hatta bir nefes vardı.', '[whispers]', 1.8), L('Sonra…', '[nervous]', 2.2), T('O zaman kapıyı aç.', '[deep voice] [slowly]'),
], [
    S('tape', 0, tau=[118, 126], on='watcher', face=1, z=[4.6, 5.0], light=0.5, box=True, key=20),
    S('tape', 1, tau=[120, 126], on='watcher', face=1, wave=True, z=[5.0, 5.8], light=0.5, key=30, sfx=hb(0, 170, 0.25)),
    S('tape', 2, tau=[122, 126], on='watcher', face=1, wave=True, z=[2.4, 1.6], light=0.4, key=60, sfx=[[70, 'switch_off', 0.3]]),
    S('scene', 4, set='bedroom', clock='03:16', lamp=0.15, dark=0.45, c=[1000, 540, 1.15], c2=[1000, 540, 1.3], key=40, sfx=[[0, 'room_tone', 0.12, 200]]),
    S('clock', 5, text='03:16', textAt=[50, '03:17'], lamp=0.15, key=70, sfx=[[50, 'drone_hit', 0.3]]),
    S('phone', ('a', 5, 8), mode='ring', key=30, sfx=RING + [[82, 'phone_ring', 0.5, 108]]),
    S('phone', 7, mode='live', rise=False, talk=[60, 400], key=20, sfx=[[2, 'copy_click', 0.35]]),
    S('scene', 10, set='bedroom', clock='03:17', lamp=0.15, dark=0.5, c=[620, 620, 1.6], c2=[600, 620, 1.8], key=30),
    S('phone', 12, mode='live', rise=False, talk=[0, 30], key=20),
    S('phone', 13, mode='call', rise=False, timer='00', key=40, sfx=hb(30, 200, 0.3)),
    S('phone', 16, mode='live', rise=False, key=30, sfx=[[70, 'drone_hit', 0.4]]),
    S('door', ('a', 16, 26), style='room', mode='knock', knocks=[16, 25, 34], key=30, sfx=[[10, 'knock', 1.0]] + hb(50, 130, 0.35)),
    S('card', ('a', 16, 116), key=40, title='SON İNSAN', sub='SON'),
], tail=7.0, target=59, bg='bedroom')


if __name__ == '__main__':
    want = [int(a) for a in sys.argv[1:]] or sorted(EP)
    for n in want:
        d = OUT / f'si-{n:02d}'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'episode.json').write_text(json.dumps(EP[n], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        speech = sum(len(l['t']) for l in EP[n]['lines']) / 13.5
        pauses = sum(l.get('pause', 0) for l in EP[n]['lines'][:-1])
        print(f"si-{n:02d}: {len(EP[n]['lines'])} lines, {len(EP[n]['shots'])} shots, ~{EP[n]['lead'] + speech + pauses + EP[n]['tail']:.0f} s before fitting")
