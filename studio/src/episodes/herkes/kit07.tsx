import React from 'react';
import { Hero, Pose, Expr, basePose, faceAt, clamp, lerp, easeOut, easeInOut, backOut, walkPose, Plate, Glow, FONT, ShotProps, LEG_LEN } from '../../engine';
import { camAt, alive, handAt, Whip, CamKey } from './act';
import { CAST, EGE, FlipWord, Hall, HALL, Kitchen2, Table, tableTop, kitSpot, CARTON, GLASS, SPILL, TeaGlass, Teapot, Hud, BED_SIT } from './world';
import { FlatBack, FlatFront, FlatP, SPOTS } from './flat';
import { TryAgain, Rewind, Flash, Bed, squash, slapArm, PhoneFrame, AppIcon } from '../he-01/shots';

// 07.00, episodes 2 to 20: the series kit. An episode is data (seri/herkes.py): each shot names a kind and its
// props, and the kit plays it. Who speaks when comes from the voice track (marks), so mouths, gestures and the camera
// follow the lines by themselves.
//   wake    the alarm at 07:00, in a mood                         { loop, mood, from?, count? }
//   go      someone walks or runs across a place                  { set, run?, flip?, expr? }
//   talk    two people in a place (or one, close)                 { set, a?, b?, ax?, bx?, cam?, enter?, leave?, ok?, think?, flip? }
//   freeze  the talk before it, stopped; TRY AGAIN; rewind        { of, why, loop, react? }
//   phone   his phone: a chat, the app's cards, the ten doors     { mode, clock, items, doors? }
//   card    the end card                                          { phrase, tr, ask, loop }

type M = { L: [number, number][]; N: [number, number][]; who?: string[]; say?: boolean[]; env?: number[]; cut: Record<string, number>; shots: { id: string; props: any }[] };
type Shot = React.FC<ShotProps>;
const INK = '#161422';
const E0 = kitSpot(0.37, 0.33);
const M0 = kitSpot(0.62, 0.33);
const PLATE = tableTop(0.39, 0.3);

const cueOf = (m: M, sid: string) => (v: any, len = 0): number => {
  if (typeof v === 'number') return v;
  if (v === 'end') return len;
  const q = /^([LN])(\d+)([se])([+-]\d+)?$/.exec(String(v));
  if (!q) return 0;
  const arr = (q[1] === 'L' ? m.L : m.N)[+q[2]];
  return arr[q[3] === 's' ? 0 : 1] + (q[4] ? +q[4] : 0) - m.cut[sid];
};
/** When `id` is speaking, in frames of the shot that starts at c. */
const wins = (m: M, id: string | null, c: number): [number, number][] => {
  const out: [number, number][] = [];
  if (!id) return out;
  m.N.forEach((n, i) => { if ((m.who?.[i] ?? '') === id) out.push([n[0] - c, n[1] - c]); });
  if (id === 'ege') m.L.forEach((l, i) => { if (m.say?.[i]) out.push([l[0] - c, l[1] - c]); });
  return out;
};

type SetP = FlatP | { kind: 'kitchen'; night?: boolean };
type Spot = { x: number; y: number; scale: number; sit?: boolean };
const place = (set: SetP): { a: Spot; b: Spot; view: [number, number, number] } =>
  set.kind === 'kitchen'
    ? { a: { x: E0.x, y: E0.y, scale: E0.scale }, b: { x: M0.x, y: M0.y, scale: M0.scale }, view: [954, 590, 1.36] }
    : { a: { ...SPOTS[set.kind].a, scale: 1 }, b: { ...SPOTS[set.kind].b, scale: 1 }, view: SPOTS[set.kind].view };

type ActorIn = { side: 1 | -1; spot: Spot; tt: number; ws: [number, number][]; keys: [number, Expr][]; act?: string; seed: number; voice: number; enter?: boolean; leaveAt?: number; still?: boolean };
/** One person in a scene: stands or sits at a spot, leans and gestures while speaking, wears the face its keys say. */
const LEAVE_F = 57; // frames of walking away: far enough to clear the other person and the talk's frame
const actor = (o: ActorIn): Pose => {
  const { side, spot, tt } = o;
  const g = Math.max(0, ...o.ws.map(([a, b]) => clamp((tt - a + 5) / 7) * clamp((b + 9 - tt) / 9)));
  const speaking = o.ws.some(([a, b]) => tt >= a - 1 && tt <= b + 1);
  const floor = spot.y + LEG_LEN * spot.scale;
  const near = side === 1 ? 'armR' : 'armL'; // the arm on the listener's side
  const far = side === 1 ? 'armL' : 'armR';
  let p: Pose;
  if (o.enter && tt < 24 && !spot.sit) {
    p = walkPose(spot.x - side * 250 * (1 - tt / 24), tt * 0.62, floor, spot.scale, { yaw: 0.6 * side, look: side }, side);
  } else if (o.leaveAt !== undefined && tt > o.leaveAt && tt <= o.leaveAt + LEAVE_F && !spot.sit) {
    p = walkPose(spot.x + side * (tt - o.leaveAt) * 7.4, (tt - o.leaveAt) * 0.62, floor, spot.scale, { yaw: 0.6 * side, look: side }, side);
  } else {
    const gone = o.leaveAt !== undefined && tt > o.leaveAt + LEAVE_F ? side * 7.4 * LEAVE_F : 0;
    p = { ...basePose, x: spot.x + gone, y: spot.y, scale: spot.scale, facing: side, yaw: 0.58 * side, look: side, tilt: 4 * side * g, headTilt: 3 * side * g, armL: { a: 13, b: -10 }, armR: { a: 13, b: -10 } };
    p[near] = { a: lerp(13, 56, g) + Math.sin(tt * 0.45) * 7 * g, b: lerp(-10, -28, g) };
    if (spot.sit) {
      p.legL = { a: 84, b: -84 };
      p.legR = { a: 79, b: -79 };
    }
    if (o.act === 'can') p[far] = { a: 46, b: 30 };
    if (o.act === 'cup' || o.act === 'pot' || o.act === 'book' || o.act === 'phone') p[far] = { a: 30, b: -104 };
    if (o.act === 'wheel') {
      p.armL = { a: 60, b: -4 };
      p.armR = { a: 28, b: -44 };
    }
    if (o.act === 'write' && g < 0.3) p[near] = { a: 36 + Math.sin(tt * 0.9) * 3, b: -62 };
  }
  const fc = faceAt(tt, o.keys);
  p.expr = fc.expr;
  p.blink = fc.blink;
  const out = o.still ? p : alive(p, tt, o.seed, { calm: 0.6 });
  if (speaking && !o.still) out.talk = Math.max(0.1, o.voice);
  return out;
};

/** What someone holds, drawn at the hand. */
const Held: React.FC<{ kind?: string; p: Pose; side: 1 | -1; tt: number }> = ({ kind, p, side, tt }) => {
  if (!kind || kind === 'wheel' || kind === 'write') return null;
  const h = handAt(p, side === 1 ? 'armL' : 'armR');
  if (kind === 'pot') return <Teapot x={h.x} y={h.y} s={0.8} />;
  if (kind === 'can')
    return (
      <g transform={`translate(${h.x} ${h.y + 6}) scale(${side === 1 ? -1 : 1} 1) rotate(${18 + Math.sin(tt / 12) * 4})`}>
        <path d="M 22 -6 l 52 -22 l 6 12 l -50 20 Z" fill="#3F7775" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <rect x={-26} y={-18} width={52} height={44} rx={8} fill="#3F7775" stroke={INK} strokeWidth={3.5} />
        <path d="M -26 -8 q -22 12 0 28" stroke={INK} strokeWidth={5} fill="none" />
        {[0, 1, 2].map((i) => <circle key={i} cx={84 + i * 9} cy={-14 + ((tt * 3 + i * 9) % 30)} r={2.6} fill="#8FD3FF" />)}
      </g>
    );
  if (kind === 'book') return <rect x={h.x - 22} y={h.y - 30} width={44} height={56} rx={4} fill="#C9573F" stroke={INK} strokeWidth={3.5} />;
  if (kind === 'phone') return <rect x={h.x - 12} y={h.y - 24} width={24} height={42} rx={5} fill="#0A0C12" stroke="#5A6680" strokeWidth={2.5} />;
  return <g><rect x={h.x - 13} y={h.y - 22} width={26} height={28} rx={5} fill="#F6EFE3" stroke={INK} strokeWidth={3.5} /><path d={`M ${h.x - 4} ${h.y - 30} q 5 -8 0 -16`} stroke="#FFFFFF" strokeWidth={2.5} fill="none" opacity={0.6} /></g>;
};

const Bubble: React.FC<{ x: number; y: number; t: number; text: string; to?: { x: number; y: number }; out?: number }> = ({ x, y, t, text, to, out = 1 }) => {
  // to: where the thinker's head top is on screen; the two small circles walk from the bubble down to it
  const ax = to ? clamp((to.x - x) / 150, -1, 1) * 96 : -74;
  const d1 = to ? { x: lerp(ax, to.x - x, 0.3), y: lerp(40, to.y - y, 0.3) } : { x: -74, y: 56 };
  const d2 = to ? { x: lerp(ax, to.x - x, 0.72), y: lerp(40, to.y - y, 0.72) } : { x: -92, y: 76 };
  const far = !to || to.y - y > 74;
  return (
    <g opacity={clamp(t / 3) * out} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * backOut(clamp(t / 9))})`}>
      {far ? <circle cx={d2.x} cy={d2.y} r={7} fill="#FFFFFF" stroke={INK} strokeWidth={4} /> : null}
      {far ? <circle cx={d1.x} cy={d1.y} r={11} fill="#FFFFFF" stroke={INK} strokeWidth={4} /> : null}
      <rect x={-150} y={to ? -36 : -42} width={300} height={to ? 72 : 84} rx={to ? 36 : 42} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
      <text x={0} y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={Math.min(34, 520 / Math.max(8, text.length))} fill={INK}>{text}</text>
    </g>
  );
};

const C_OFF = 150; // how far behind a the third person stands
type SceneIn = { m: M; sid: string; P: any; tt: number; f: number; len: number; cam: { transform: string; cx: number; cy: number; z: number }; id: string; grey?: number; still?: boolean; aOver?: (p: Pose) => Pose };
/** A place with its people at scene time tt. grey: the world and b lose their colour; a keeps his. */
const Scene: React.FC<SceneIn> = ({ m, sid, P, tt, f, len, cam, id, grey = 0, still, aOver }) => {
  const c = m.cut[sid];
  const cue = cueOf(m, sid);
  const pl = place(P.set);
  const aId: string | null = P.a === undefined ? 'ege' : P.a;
  const bId: string | null = P.b ?? null;
  const keysOf = (xs: [any, Expr][] | undefined, d: Expr): [number, Expr][] => [[-9999, d], ...(xs ?? []).map(([q, e]) => [cue(q, len), e] as [number, Expr])];
  const voice = still ? 0 : m.env?.[f] ?? 0;
  let A = aId ? actor({ side: 1, spot: pl.a, tt, ws: wins(m, aId, c), keys: keysOf(P.ax, 'neutral'), act: P.aAct, seed: 5, voice, enter: P.enter, leaveAt: P.leave !== undefined ? cue(P.leave, len) : undefined }) : null;
  if (A && aOver) A = aOver(A);
  const B = bId ? actor({ side: -1, spot: pl.b, tt, ws: wins(m, bId, c), keys: keysOf(P.bx, 'smile'), act: P.bAct, seed: 2, voice, still }) : null;
  // a third person, standing just behind a (wide shots only)
  const cId: string | null = P.c ?? null;
  const C = cId ? actor({ side: 1, spot: { x: pl.a.x - C_OFF * pl.a.scale, y: pl.a.y, scale: pl.a.scale }, tt: P.enter ? tt - 7 : tt, ws: wins(m, cId, c), keys: keysOf(P.cx, 'smile'), seed: 8, voice, enter: P.enter, still }) : null;
  const gf = grey > 0.01 ? `url(#${id}gr)` : undefined;
  const flipAt = P.flip !== undefined ? cue(P.flip, len) : -999;
  const kitchen = P.set.kind === 'kitchen';
  const th = P.think ? { at: cue(P.think[0], len), text: String(P.think[1]) } : null;
  const head = { x: pl.a.x, y: pl.a.y - 176 * pl.a.scale };
  const close = P.cam === 'a' || P.cam === 'b';
  // the thought goes when the answer lands (the CORRECT badge takes its place)
  const thOut = P.ok !== undefined ? clamp((cue(P.ok, len) - tt) / 4) : 1;
  const okT = P.ok !== undefined ? tt - cue(P.ok, len) : -1;
  const signO = 1 - Math.max(okT >= 0 ? clamp(okT / 3) * clamp((58 - okT) / 10) : 0, th && !close ? clamp((tt - th.at) / 3) * thOut : 0);
  return (
    <g>
      {grey > 0.01 ? (
        <defs>
          <filter id={`${id}gr`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values={(1 - 0.9 * grey).toFixed(3)} />
          </filter>
        </defs>
      ) : null}
      <g transform={cam.transform}>
        <g filter={gf}>
          {kitchen ? <Kitchen2 t={tt + 300} id={id} /> : <FlatBack t={tt} p={P.set} flipAt={flipAt} noSign={P.cam === 'a' || P.cam === 'b' || P.noSign} signO={signO} />}
          {kitchen && P.set.night ? <rect x={0} y={0} width={1920} height={1080} fill="#1B1430" opacity={0.34} /> : null}
          {B ? <Hero look={CAST[bId as string]} pose={B} rimId="rimL" shadow={kitchen ? 0.4 : 0.7} /> : null}
          {B ? <Held kind={P.bAct} p={B} side={-1} tt={tt} /> : null}
        </g>
        {C ? <g filter={gf}><Hero look={CAST[cId as string]} pose={C} rimId="rimR" shadow={kitchen ? 0.4 : 0.7} /></g> : null}
        {A ? <Hero look={CAST[aId as string]} pose={A} rimId="rimR" shadow={kitchen ? 0.4 : 0.7} /> : null}
        {A ? <Held kind={P.aAct} p={A} side={1} tt={tt} /> : null}
        <g filter={gf}>
          {kitchen ? (
            <Table label={<FlipWord x={CARTON.x} y={CARTON.y + 39} from="SÜT" to="MILK" t={tt} at={-99} size={15} card="#4F8F8C" every={3} />}>
              <Plate x={PLATE.x} y={PLATE.y} s={0.6} />
              <ellipse cx={SPILL.x} cy={SPILL.y} rx={17} ry={5.5} fill="#B5461E" opacity={0.85} />
              <TeaGlass x={GLASS.x} y={GLASS.y} level={1} steam={1} tw={tt} />
            </Table>
          ) : (
            <FlatFront t={tt} p={P.set} />
          )}
        </g>
      </g>
      {th && tt >= th.at && close ? <Bubble x={1010} y={300} t={tt - th.at} text={th.text} out={thOut} /> : null}
      {th && tt >= th.at && !close ? (() => {
        // on screen, never in the world: it stays clear of the loop counter and inside the frame wherever the camera leans
        const hx = 960 + (head.x - cam.cx) * cam.z;
        const top = 540 + (head.y - 70 * pl.a.scale - cam.cy) * cam.z;
        const bx = clamp(hx + 70, 818, 1102);
        const by = Math.max(240, top - 96);
        return <Bubble x={bx} y={by} t={tt - th.at} text={th.text} to={{ x: clamp(hx, 670, 1250), y: top }} out={thOut} />;
      })() : null}
    </g>
  );
};

/** The camera for a talk: both in frame; it leans toward whoever speaks; or it stays close on one of them. */
const camFor = (m: M, sid: string, P: any, t: number, len: number, seed: number) => {
  const pl = place(P.set);
  const [vx, vy, vz] = pl.view;
  if (P.cam === 'a' || P.cam === 'b') {
    const sp = P.cam === 'a' ? pl.a : pl.b;
    const s = P.cam === 'a' ? 1 : -1;
    const hy = sp.y - 176 * sp.scale;
    return camAt(t, [[0, sp.x + 24 * s, hy + 18, 2.4, -s], [len, sp.x + 18 * s, hy + 14, 2.8, -2 * s]], 0.6, seed);
  }
  if (P.c) {
    // three people: the frame is set by the outer two heads
    const l = pl.a.x - (C_OFF + 80) * pl.a.scale;
    const r = pl.b.x + 86 * pl.b.scale;
    const z = Math.min(vz, 608 / (r - l + 12));
    const mx = (l + r) / 2;
    return camAt(t, [[0, mx - 5, vy + 2, z * 0.985, 0.3], [len, mx + 4, vy - 2, z * 1.0, -0.3]], 0.5, seed);
  }
  const z0 = P.cam === 'wide' ? vz * 0.86 : vz;
  const keys: CamKey[] = [[0, vx - 10, vy + 2, z0 * 0.97, 0.4]];
  if (P.cam !== 'wide') {
    const c = m.cut[sid];
    const aId = P.a === undefined ? 'ege' : P.a;
    const evs = [...wins(m, aId, c).map((w) => [w[0], w[1], -1]), ...wins(m, P.b ?? null, c).map((w) => [w[0], w[1], 1])].filter(([s, e]) => e > 6 && s < len - 8).sort((x, y) => x[0] - y[0]);
    // how far it can lean toward the speaker before the listener's head leaves the frame
    // (measured at the lean's own zoom, with the listener's whole head and hair inside)
    const sh = clamp(304 / (z0 * 1.09) - ((pl.b.x - pl.a.x) / 2 + 66 * Math.max(pl.a.scale, pl.b.scale) + 8), 0, 40);
    const zg = 1 + (0.09 * sh) / 40;
    for (const [s, e, d] of evs) {
      const k0 = Math.max(keys[keys.length - 1][0] + 3, s - 8);
      if (k0 >= len - 8) break;
      keys.push([k0, vx + d * sh * 0.8, vy - 4, z0 * (1 + (zg - 1) * 0.7), d * 0.5, 'io']);
      keys.push([Math.min(len - 4, Math.max(k0 + 3, e + 4)), vx + d * sh, vy - 6, z0 * zg, d * 0.6]);
    }
  }
  keys.push([Math.max(len, keys[keys.length - 1][0] + 1), vx + 6, vy - 2, z0 * 1.04, -0.4, 'io']);
  return camAt(t, keys, 0.8, seed);
};

const Ok: React.FC<{ t: number }> = ({ t }) => {
  const k = backOut(clamp(t / 7));
  return (
    <g opacity={clamp(t / 3) * clamp((54 - t) / 10)} transform={`translate(960 252) scale(${0.6 + 0.4 * k}) translate(-960 -252)`}>
      <rect x={830} y={224} width={260} height={56} rx={28} fill="#3DDC84" stroke="#0B2A18" strokeWidth={4} />
      <path d="M 858 252 l 10 11 l 18 -22" stroke="#0B2A18" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={984} y={263} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill="#0B2A18" letterSpacing={2}>CORRECT</text>
    </g>
  );
};
const HudOf: React.FC<{ P: any; t: number }> = ({ P, t }) => (P.hud === false || P.loop === undefined ? null : <Hud loop={P.loop} t={t} clock={P.clock ?? '07:00'} doors={P.doors} />);

const talk = (m: M, s: { id: string; props: any }): Shot => ({ t, len, f }) => {
  const P = s.props;
  const cue = cueOf(m, s.id);
  const okAt = P.ok !== undefined ? cue(P.ok, len) : null;
  return (
    <g>
      <Scene m={m} sid={s.id} P={P} tt={t} f={f} len={len} cam={camFor(m, s.id, P, t, len, s.id.charCodeAt(0))} id={`k${s.id}`} />
      {P.night ? <rect x={0} y={0} width={1920} height={1080} fill="#0B0714" opacity={0.18} /> : null}
      <HudOf P={P} t={t} />
      {okAt !== null && t >= okAt ? <Ok t={t - okAt} /> : null}
      {P.flash ? <Flash o={1 - t / 6} /> : null}
    </g>
  );
};

// The talk before it, stopped at the moment he got it wrong. Only he still moves. TRY AGAIN. Then it all runs back.
const freeze = (m: M, s: { id: string; props: any }): Shot => ({ t, len, f }) => {
  const P = s.props;
  const TP = (m.shots.find((q) => q.id === P.of) as { props: any }).props;
  const FR = m.cut[s.id] - m.cut[P.of];
  const k = m.N.findIndex((n, i) => (m.who?.[i] ?? '') === 'app' && n[0] >= m.cut[s.id] - 2);
  const SHOW = k >= 0 ? m.N[k][0] - m.cut[s.id] - 2 : 12;
  const RW = Math.min(len - 34, (k >= 0 ? m.N[k][1] - m.cut[s.id] : 40) + 12);
  const back = clamp((t - RW) / 26);
  const tt = t < RW ? FR : lerp(FR, 0, easeInOut(back));
  const [vx, vy, vz] = place(TP.set).view;
  const sx = TP.leave !== undefined ? 172 : 0; // he walked on: the frozen frame holds him and the one he passed
  const cam = camAt(t, [[0, vx + sx, vy - 4, vz * 1.1, 0], [16, vx + sx - 6, vy - 40, vz * 0.96, 0.5, 'out'], [RW, vx + sx - 8, vy - 44, vz * 1.0, -0.5], [RW + 8, vx, vy, vz * 0.95, 0, 'out'], [Math.max(len, RW + 9), vx, vy, vz * 0.95, 0]], t < RW ? 0.5 : 0.2, 8, [[0, 7], [SHOW, 6]]);
  const over = (p: Pose): Pose => {
    if (t >= RW) return p;
    const d = t - SHOW;
    const q: Pose = { ...p, talk: 0 };
    if (d >= 3) {
      const u = clamp((d - 3) / 6);
      q.expr = 'shock';
      q.headTilt = -12 * u;
      q.yaw = lerp(p.yaw, 0.1, u);
      q.look = 0;
    }
    if (P.react === 'none') return { ...p, talk: 0 };
    if (d >= 24 && P.react === 'facepalm') {
      const u = easeInOut(clamp((d - 24) / 9));
      q.expr = 'tired';
      q.blink = u > 0.8 ? 1 : 0;
      q.headTilt = lerp(-12, 13, u);
      q.armR = { a: lerp(13, 132, u), b: lerp(-10, 122, u) };
    } else if (d >= 24) {
      const sw = Math.sin(clamp((d - 24) / 30) * Math.PI * 2);
      q.yaw = 0.1 + 0.55 * sw;
      q.look = sw;
      q.headTilt = -4;
    }
    return q;
  };
  const grey = clamp(t / 7);
  return (
    <g>
      <Whip id={`kw${s.id}`} on={t >= RW && back < 1 ? 0.22 + 0.2 * Math.sin(Math.PI * back) : 0}>
        <Scene m={m} sid={P.of} P={TP} tt={tt} f={f} len={9999} cam={cam} id={`k${s.id}`} grey={grey} still aOver={over} />
      </Whip>
      <rect x={0} y={0} width={1920} height={1080} fill="#27407A" opacity={0.14 * grey} />
      {t >= RW && back < 1 ? <Rewind t={t} /> : null}
      {t < RW - 3 ? <TryAgain t={t - SHOW} why={P.why ?? 'TURKISH DETECTED'} /> : null}
      <Hud loop={P.loop} from={P.loop - 1} at={RW + 14} t={t} doors={P.doors} />
      <Flash o={(t - (len - 9)) / 8} />
    </g>
  );
};

// 07:00 again. mood: ready (up already, flattens it without looking), jump (bolts upright), tired (slumped).
const wake = (m: M, s: { id: string; props: any }): Shot => ({ t, len }) => {
  const P = s.props;
  const mood: string = P.mood ?? 'ready';
  const count: [number, number] | null = P.count ?? null;
  const SLAP = count ? 12 : mood === 'tired' ? 30 : mood === 'jump' ? 26 : 18;
  const every = 13;
  const nth = count ? Math.min(count[1] - count[0], Math.floor(t / every)) : 0;
  const lt = count ? t - nth * every : t; // time within this slap
  const ring = count ? lt < 9 && nth < count[1] - count[0] : t < SLAP;
  const kicks: [number, number][] = count ? Array.from({ length: count[1] - count[0] + 1 }).map((_, i) => [i * every + 9, 6] as [number, number]) : [[SLAP, 8]];
  const cam = camAt(t, [[0, BED_SIT.x + 60, BED_SIT.y - 100, 1.64, 1], [len, BED_SIT.x + 30, BED_SIT.y - 128, count ? 1.9 : 2.15, -0.6]], 0.7, 15, kicks);
  const sit: Pose = { ...basePose, x: BED_SIT.x, y: BED_SIT.y, scale: BED_SIT.scale, yaw: 0, look: 0, armL: { a: 16, b: -10 }, armR: { a: 16, b: -10 } };
  const lean: Pose = { ...sit, tilt: 25 };
  const hit = count ? 9 : SLAP;
  const u = count ? clamp((lt - 2) / 6) * clamp((hit + 6 - lt) / 5) : clamp((t - (SLAP - 9)) / 8) * clamp((SLAP + 14 - t) / 10);
  const reach = slapArm(lean);
  const rise = mood === 'jump' && !count ? backOut(clamp((t - 4) / 8)) : 1;
  const after = t > SLAP + 16 ? easeInOut(clamp((t - SLAP - 16) / 10)) : 0;
  const expr: Expr = count ? (nth >= count[1] - count[0] ? 'dizzy' : 'tired') : mood === 'jump' ? (t > SLAP + 18 ? 'worried' : 'shock') : mood === 'tired' ? 'tired' : t > SLAP + 14 ? (P.expr ?? 'smug') : 'cool';
  const me = alive({
    ...sit,
    y: BED_SIT.y + 130 * (1 - rise),
    tilt: 25 * u,
    armR: { a: lerp(16, reach.a, u), b: 0 - 10 * (1 - u) },
    yaw: mood === 'jump' ? 0.5 * (1 - u) : 0.6 * after,
    look: mood === 'jump' ? 1 - u : after,
    headTilt: mood === 'tired' ? 9 : 0,
    expr,
  }, t, 5, { calm: 0.7 });
  const loop = count ? count[0] + nth : P.loop;
  return (
    <g>
      <Bed t={t} id={`kb${s.id}`} cam={cam} me={rise > 0.02 ? me : null} lump={1 - rise} ring={ring} sq={count ? squash(lt, hit) : squash(t, SLAP)} />
      {count ? <Hud loop={loop} from={nth > 0 ? loop - 1 : undefined} at={nth * every + 5} t={t} doors={P.doors} /> : P.loop !== undefined ? <Hud loop={P.loop} from={P.from} at={4} t={t} doors={P.doors} clock={P.clock ?? '07:00'} /> : null}
      {P.flash === false ? null : <Flash o={1 - t / 6} />}
    </g>
  );
};

// Someone crosses a place, left to right.
const go = (m: M, s: { id: string; props: any }): Shot => ({ t, len }) => {
  const P = s.props;
  const cue = cueOf(m, s.id);
  const hall = P.set === 'hall';
  const sp = P.run ? 13 : 7.4;
  const x0 = P.x0 ?? (hall ? 700 : 600);
  const x = x0 + t * sp;
  const floor = hall ? HALL.floor : 800;
  const me = { ...walkPose(x, t * (P.run ? 0.95 : 0.62), floor, 1, { yaw: 0.6, expr: P.expr ?? 'neutral', look: 0.6, tilt: P.run ? 12 : 5 }, 1), headTilt: 4 * Math.sin(t * 0.31) };
  const cam = camAt(t, [[0, x0 + 80, 592, 1.45, -0.6, 'lin'], [len, x0 + len * sp + 80, 590, 1.5, 0.4, 'lin']], 0.9, 4);
  const flipAt = P.flip !== undefined ? cue(P.flip, len) : -999;
  const who = CAST[P.a ?? 'ege'];
  return (
    <g>
      <g transform={cam.transform}>
        {hall ? (
          <Hall t={t} board={<FlipWord x={HALL.board.x} y={HALL.board.y + 14} from={P.board?.[0] ?? 'PAZARTESİ'} to={P.board?.[1] ?? 'MONDAY'} t={t} at={-99} size={34} />}>
            <Hero look={who} pose={me} rimId="rimR" shadow={0.7} />
          </Hall>
        ) : (
          <g>
            <FlatBack t={t} p={P.set} flipAt={flipAt} />
            <Hero look={who} pose={me} rimId="rimR" shadow={0.7} />
            <FlatFront t={t} p={P.set} />
          </g>
        )}
      </g>
      <HudOf P={P} t={t} />
      {P.flash ? <Flash o={1 - t / 6} /> : null}
    </g>
  );
};

const wrap = (s: string, n: number) => {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(' ')) {
    if (cur && cur.length + 1 + w.length > n) {
      out.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  return [...out, cur];
};
const DOORS = ['BREAKFAST', 'NEIGHBOUR', 'BUS', 'CAFÉ', 'CLASS', 'LUNCH', 'LIBRARY', 'FIVE O’CLOCK', 'DINNER', 'MIDNIGHT'];

// His phone, seen over his arm. mode chat: messages come in (and his go out); app: the app's cards; doors: the day's list.
const phone = (m: M, s: { id: string; props: any }): Shot => ({ t, len }) => {
  const P = s.props;
  const cue = cueOf(m, s.id);
  const rise = easeOut(clamp(t / 9));
  const buzz = t >= 2 && t < 12 ? Math.sin(t * 3.1) * 5 : 0;
  const cam = camAt(t, [[0, 960, 600, 1.0, -5], [len * 0.5, 960, 562, 1.1, -3], [len, 960, 532, 1.2, -1]], 0.9, 16);
  const items: any[] = (P.items ?? []).map((it: any) => ({ ...it, at: cue(it.at ?? 0, len) }));
  // lay the items out top to bottom; when they run past the screen, the list slides up
  let y = 330;
  const rows = items.map((it) => {
    const ls = wrap(String(it.text), P.mode === 'app' ? 19 : 21);
    const h = (P.mode === 'app' ? 58 : 30) + ls.length * (P.mode === 'app' ? 40 : 34) + (it.tr ? 30 : 0);
    const r = { it, ls, y, h };
    y += h + 14;
    return r;
  });
  const shown = rows.filter((r) => t >= r.it.at);
  const bottom = shown.length ? shown[shown.length - 1].y + shown[shown.length - 1].h : 330;
  const slide = Math.max(0, bottom - 690);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#070A18" />
      <Glow x={960} y={560} r={700} kind="cool" o={0.22} />
      <g transform={cam.transform}>
        <PhoneFrame t={t} rise={rise} buzz={buzz} glow={0.3}>
          <clipPath id={`kp${s.id}`}><rect x={760} y={284} width={400} height={430} /></clipPath>
          <text x={960} y={258} textAnchor="middle" fontFamily={FONT.ui} fontSize={22} fill="#8A93A0">{P.clock ?? '07:00'}</text>
          {P.mode === 'doors' ? (
            <g>
              <text x={784} y={312} fontFamily={FONT.ui} fontSize={20} fill="#FFE08A" letterSpacing={5}>TODAY · 10 DOORS</text>
              {DOORS.map((d, i) => {
                const done = i < (P.doors ?? 0);
                const now = i === (P.doors ?? 0);
                const on = clamp((t - 6 - i * 3) / 5);
                return (
                  <g key={i} opacity={on} transform={`translate(${(1 - on) * 30} 0)`}>
                    <rect x={782} y={328 + i * 38} width={356} height={32} rx={10} fill={now ? '#2A3350' : '#1A1E2B'} stroke={now ? '#FFE08A' : '#2A3144'} strokeWidth={2.5} />
                    <text x={798} y={351 + i * 38} fontFamily={FONT.ui} fontSize={19} fill={done ? '#3DDC84' : now ? '#FFFFFF' : '#7C879C'} letterSpacing={2}>{`${i + 1}  ${d}`}</text>
                    {done ? <path d={`M 1104 ${344 + i * 38} l 7 8 l 13 -16`} stroke="#3DDC84" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              {P.mode === 'app' ? <g><AppIcon x={808} y={302} s={0.56} t={t} /><text x={838} y={310} fontFamily={FONT.ui} fontSize={19} fill="#9AA6C0" letterSpacing={6}>ONE DAY</text></g> : (
                <g><circle cx={806} cy={302} r={18} fill="#3A4258" /><text x={836} y={310} fontFamily={FONT.ui} fontSize={20} fill="#C9D2E8" letterSpacing={2}>{P.title ?? 'UNKNOWN NUMBER'}</text></g>
              )}
              <g clipPath={`url(#kp${s.id})`}>
                <g transform={`translate(0 ${-slide})`}>
                  {rows.map(({ it, ls, y: ry, h }, i) => {
                    if (t < it.at) return null;
                    const k = backOut(clamp((t - it.at) / 7));
                    const bad = it.bad && t >= it.at + 12;
                    const w = P.mode === 'app' ? 356 : Math.min(330, 46 + Math.max(...ls.map((q) => q.length)) * 15.5);
                    const x = P.mode === 'app' ? 782 : it.me ? 1138 - w : 782;
                    const jig = bad && t < it.at + 22 ? Math.sin(t * 2.6) * 5 : 0;
                    return (
                      <g key={i} opacity={clamp((t - it.at) / 3)} transform={`translate(${jig} ${(1 - k) * 22})`}>
                        <rect x={x} y={ry} width={w} height={h} rx={20} fill={P.mode === 'app' ? '#232838' : bad ? '#3A1A20' : it.me ? '#2F6FED' : '#232838'} stroke={bad ? '#FF5A4A' : P.mode === 'app' ? '#3A4258' : 'none'} strokeWidth={3} />
                        {P.mode === 'app' ? <text x={x + 22} y={ry + 34} fontFamily={FONT.ui} fontSize={18} fill="#FFE08A" letterSpacing={4}>{it.head ?? ''}</text> : null}
                        {ls.map((q, j) => <text key={j} x={x + 22} y={ry + (P.mode === 'app' ? 76 : 38) + j * (P.mode === 'app' ? 40 : 34)} fontFamily={FONT.title} fontWeight={P.mode === 'app' ? 800 : 700} fontSize={P.mode === 'app' ? 33 : 26} fill="#FFFFFF">{q}</text>)}
                        {it.tr ? <text x={x + 22} y={ry + h - 14} fontFamily={FONT.title} fontWeight={600} fontSize={21} fill="#9FD3C1" opacity={clamp((t - it.at - 12) / 6)}>{`= ${it.tr}`}</text> : null}
                        {bad ? <g><rect x={x + w - 214} y={ry + h - 12} width={214} height={30} rx={15} fill="#D8342C" /><text x={x + w - 107} y={ry + h + 9} textAnchor="middle" fontFamily={FONT.ui} fontSize={15} fill="#FFFFFF" letterSpacing={2}>TURKISH DETECTED</text></g> : null}
                      </g>
                    );
                  })}
                </g>
              </g>
            </g>
          )}
        </PhoneFrame>
      </g>
      {P.loop !== undefined && P.hud ? <Hud loop={P.loop} t={t} clock={P.clock ?? '07:00'} doors={P.doors} /> : null}
    </g>
  );
};

const card = (_m: M, s: { id: string; props: any }): Shot => ({ t }) => {
  const P = s.props;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#000" />
      <g opacity={clamp((t - 4) / 8)}>
        <text x={960} y={392} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={Math.min(52, 1050 / Math.max(10, String(P.phrase).length))} fill="#FFE08A">{P.phrase}</text>
        {P.tr ? <text x={960} y={452} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={32} fill="#F6EFE3" opacity={0.85}>{`= ${P.tr}`}</text> : <text x={960} y={462} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={50} fill="#F6EFE3" opacity={clamp((t - 18) / 8) * (0.75 + 0.25 * Math.sin(t / 5))}>= ?</text>}
        {P.ask ? <text x={960} y={544} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={Math.min(46, 1000 / Math.max(10, String(P.ask).length))} fill="#FFFFFF" opacity={clamp((t - 22) / 8) * (0.75 + 0.25 * Math.sin(t / 5))}>{P.ask}</text> : null}
        <g opacity={clamp((t - 34) / 8)}>
          <rect x={860} y={616} width={200} height={84} rx={18} fill="#24202C" stroke="#3A3446" strokeWidth={3} />
          <text x={960} y={676} textAnchor="middle" fontFamily={FONT.ui} fontSize={52} fill="#FF5A4A" opacity={Math.floor(t / 15) % 2 ? 1 : 0.7}>{P.clock ?? '07:00'}</text>
          <text x={960} y={748} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill="#F6EFE3" letterSpacing={6} opacity={0.7}>{P.sub ?? `LOOP ${P.loop} · DEVAMI ${P.next}. BÖLÜMDE`}</text>
        </g>
      </g>
    </g>
  );
};

const KINDS: Record<string, (m: M, s: { id: string; props: any }) => Shot> = { wake, go, talk, freeze, phone, card };
/** A talk scene at rest, for the covers: no marks. `speak` gives that person the speaking pose and an open mouth. */
export const CoverScene: React.FC<{ P: any; speak?: string | null; cam: { transform: string; cx: number; cy: number; z: number }; id: string }> = ({ P, speak, cam, id }) => {
  const ege = speak === 'ege' && (P.a === undefined || P.a === 'ege');
  const m: M = { L: ege ? [[20, 200]] : [], N: speak && !ege ? [[20, 200]] : [], who: speak && !ege ? [speak] : [], say: ege ? [true] : [], env: [0.75], cut: { cover: 0 }, shots: [] };
  return <Scene m={m} sid="cover" P={P} tt={60} f={0} len={9999} cam={cam} id={id} />;
};
export const coverPlace = (set: any) => place(set);
export const COVER_C_OFF = C_OFF;

export const make = (m: M): Record<string, Shot> => {
  const out: Record<string, Shot> = {};
  for (const s of m.shots) out[s.id] = KINDS[s.props.k](m, s);
  return out;
};
export const KIT_LOOK = EGE;
