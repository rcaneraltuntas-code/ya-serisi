import React from 'react';
import { lerp, easeInOut } from './anim';

// The cast, drawn entirely in code: one rig, and a costume (a Look) per character. Every character is built
// once here, so they look identical in every shot: that's the "drawn, not guessed" point. Original
// characters only: never a channel's own hero or anything that resembles a famous cartoon character.

export const C = {
  skin: '#F6EFE3',
  skinShade: '#E2D3BE',
  ink: '#1D2033',
  jacket: '#F2B33D',
  jacketShade: '#D4922A',
  shoe: '#2FB7A6',
  orange: '#FF8A3D',
  limb: '#EFE2CC',
};

/** A costume for the rig: the same body and animation, different colours and one optional extra piece. */
export type Look = {
  skin: string;
  skinShade: string;
  hand: string;
  jacket: string;
  jacketShade: string;
  accent: string;
  limb: string;
  line: string;
  shoe: string;
  face: string;
  hair: string;
  extra?: 'hood' | 'curls' | 'bunches' | 'bob' | 'suit' | 'mop' | 'bun';
  /** A fuller face: eyes with whites and pupils, brows on every expression, a small nose, a mouth that opens to talk. */
  detail?: boolean;
  brow?: string; // brow colour (the hair's by default)
  lashes?: boolean;
  cheek?: string; // blush colour
  apron?: string; // an apron over the top, in this colour
  earring?: string;
};
export type CastName = 'pip' | 'pipHood' | 'pipInk' | 'mo' | 'sis' | 'mom' | 'suit';
export const LOOKS: Record<CastName, Look> = {
  // A: Pip as built
  pip: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: C.limb, line: C.ink, shoe: C.shoe, face: C.ink, hair: C.ink },
  // B: Pip in a dark hoodie with mustard drawstrings: the body goes dark and catches the rim light, the head stays the brightest thing
  pipHood: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#2E2B3D', jacketShade: '#24212F', accent: C.jacket, limb: '#2E2B3D', line: '#121019', shoe: C.shoe, face: C.ink, hair: C.ink, extra: 'hood' },
  // C: a dark head with light features, the genre's high-contrast convention, in Pip's mustard
  pipInk: { skin: '#26232F', skinShade: '#1C1A24', hand: '#26232F', jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: '#26232F', line: '#121019', shoe: C.shoe, face: '#F6EFE3', hair: '#26232F' },
  // Mo, Pip's friend: a second recurring character with his own costume (curly hair, headphones round his neck)
  mo: { skin: '#C98E68', skinShade: '#B07A58', hand: '#C98E68', jacket: '#5E6E46', jacketShade: '#4C5A38', accent: '#E9C46A', limb: '#3A3446', line: '#1A1622', shoe: '#D9534F', face: C.ink, hair: '#2A1C18', extra: 'curls' },
  // the formula's recurring cast (beats 5 and 6): Pip's little sister (draw her at about 0.7 of Pip's scale), his mum,
  // and the man in a suit who notices the power. All three are ours: plain shapes, no famous silhouettes.
  sis: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#3E8C86', jacketShade: '#2F6E69', accent: '#F28C6A', limb: '#3A3446', line: '#14121C', shoe: '#F28C6A', face: C.ink, hair: '#3A2620', extra: 'bunches' },
  mom: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#8A5A6A', jacketShade: '#704858', accent: '#E9C46A', limb: '#3A3446', line: '#14121C', shoe: '#5A4A6A', face: C.ink, hair: '#5A3226', extra: 'bob' },
  suit: { skin: '#D9C6AE', skinShade: '#C2AE96', hand: '#D9C6AE', jacket: '#2B2F3A', jacketShade: '#20232C', accent: '#A8323E', limb: '#2B2F3A', line: '#0E0F14', shoe: '#14151A', face: C.ink, hair: '#17141A', extra: 'suit' },
};

// ---------- the hero ----------
/** Mitten hands: open (a palm and a thumb) or pointing (a fist with the index finger out). */
export type HandKind = 'open' | 'point';
export type Expr = 'neutral' | 'happy' | 'smug' | 'shock' | 'worried' | 'oops' | 'cool' | 'dizzy' | 'tired' | 'smile';
export type Limb = { a: number; b: number }; // a: upper segment angle, b: bend of the lower segment (degrees)
export type Pose = {
  x: number;
  y: number; // hip point
  scale: number;
  facing: 1 | -1;
  tilt: number; // torso lean around the hips, degrees, + leans screen-right
  spin: number; // whole-body rotation around the chest (tumbles)
  headTilt: number;
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
  expr: Expr;
  blink: number; // 0 open, 1 shut
  look: number; // -1..1 eye offset
  glasses: number; // 0..1
  yaw: number; // -1 profile facing screen-left, 0 front, 1 profile facing screen-right
  squash: number; // + squashes (landing), - stretches (jump), about the feet
  handL: HandKind;
  handR: HandKind;
  sway: number; // secondary motion: how far loose things (the hood's drawstrings) swing, degrees-ish
  glint?: number; // 0..1 the eyes light up in the power's colour (set it after poseAt: it isn't interpolated)
  glintColor?: string;
  talk?: number; // 0..1 how far the mouth is open while speaking (set it after poseAt: it isn't interpolated)
};

export const basePose: Pose = {
  x: 960,
  y: 700,
  scale: 1,
  facing: 1,
  tilt: 0,
  spin: 0,
  headTilt: 0,
  armL: { a: 10, b: -8 },
  armR: { a: 10, b: -8 },
  legL: { a: 5, b: 0 },
  legR: { a: -5, b: 0 },
  expr: 'neutral',
  blink: 0,
  look: 0,
  glasses: 0,
  yaw: 0,
  squash: 0,
  handL: 'open',
  handR: 'open',
  sway: 0,
};

type Key = { f: number; p: Partial<Pose>; ease?: (t: number) => number };

const mixLimb = (a: Limb, b: Limb, t: number): Limb => ({ a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t) });

/** Interpolates every numeric part of a pose between keys; the face swaps (never morphs) at its key. */
export const poseAt = (f: number, keys: Key[], from: Pose = basePose): Pose => {
  // resolve each key into a full pose, carrying values forward
  const full: { f: number; p: Pose; ease?: (t: number) => number }[] = [];
  let cur = from;
  for (const k of keys) {
    cur = { ...cur, ...k.p };
    full.push({ f: k.f, p: cur, ease: k.ease });
  }
  if (f <= full[0].f) return full[0].p;
  for (let i = 0; i < full.length - 1; i++) {
    const A = full[i];
    const B = full[i + 1];
    if (f <= B.f) {
      const t = (B.ease ?? easeInOut)((f - A.f) / Math.max(1e-6, B.f - A.f));
      return {
        x: lerp(A.p.x, B.p.x, t),
        y: lerp(A.p.y, B.p.y, t),
        scale: lerp(A.p.scale, B.p.scale, t),
        facing: t < 0.5 ? A.p.facing : B.p.facing,
        tilt: lerp(A.p.tilt, B.p.tilt, t),
        spin: lerp(A.p.spin, B.p.spin, t),
        headTilt: lerp(A.p.headTilt, B.p.headTilt, t),
        armL: mixLimb(A.p.armL, B.p.armL, t),
        armR: mixLimb(A.p.armR, B.p.armR, t),
        legL: mixLimb(A.p.legL, B.p.legL, t),
        legR: mixLimb(A.p.legR, B.p.legR, t),
        expr: A.p.expr, // a face swaps when its own key lands, so hold the earlier one
        handL: A.p.handL,
        handR: A.p.handR,
        blink: lerp(A.p.blink, B.p.blink, t),
        look: lerp(A.p.look, B.p.look, t),
        glasses: lerp(A.p.glasses, B.p.glasses, t),
        yaw: lerp(A.p.yaw, B.p.yaw, t),
        squash: lerp(A.p.squash, B.p.squash, t),
        sway: lerp(A.p.sway, B.p.sway, t),
      };
    }
  }
  return full[full.length - 1].p;
};

// body measurements (local space: hips at 0,0, y down)
const UPPER_ARM = 62;
const FORE_ARM = 58;
const THIGH = 72;
const SHIN = 68;
const SHOULDER = { x: 42, y: -108 };
const HIP = { x: 17, y: 0 };
export const HEAD = { x: 0, y: -176, r: 62 };
export const LEG_LEN = THIGH + SHIN;

const rad = (d: number) => (d * Math.PI) / 180;
type P = { x: number; y: number };
const rot = (p: P, deg: number, c: P = { x: 0, y: 0 }): P => {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};

/** Joint positions in local space (before the hip translate/scale), so scenes can attach props to hands. */
export const joints = (pose: Pose) => {
  const side = (s: 1 | -1, limb: Limb, root: P, l1: number, l2: number, isLeg: boolean) => {
    // arms swing outward (away from the body) on their own side; legs swing forward in the facing direction
    const dir = isLeg ? pose.facing : s;
    const d1 = { x: dir * Math.sin(rad(limb.a)), y: Math.cos(rad(limb.a)) };
    const mid = { x: root.x + d1.x * l1, y: root.y + d1.y * l1 };
    const a2 = limb.a + limb.b;
    const d2 = { x: dir * Math.sin(rad(a2)), y: Math.cos(rad(a2)) };
    return { root, mid, end: { x: mid.x + d2.x * l2, y: mid.y + d2.y * l2 } };
  };
  const torsoRot = (p: P) => rot(p, pose.tilt);
  const sp = limbSpread(pose.yaw);
  const shL = { x: -SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const shR = { x: SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const armL = side(-1, pose.armL, shL, UPPER_ARM, FORE_ARM, false);
  const armR = side(1, pose.armR, shR, UPPER_ARM, FORE_ARM, false);
  const legL = side(-1, pose.legL, { x: -HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const legR = side(1, pose.legR, { x: HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const r = (o: { root: P; mid: P; end: P }) => ({ root: torsoRot(o.root), mid: torsoRot(o.mid), end: torsoRot(o.end) });
  return { armL: r(armL), armR: r(armR), legL, legR, head: torsoRot(HEAD) };
};

/** How wide the body reads as it turns: full width face-on, about 60% in profile. */
export const turnWidth = (yaw: number) => 1 - 0.4 * Math.min(1, Math.abs(yaw));
/** Shoulders and hips close up as he turns, so in profile the limbs overlap the body. */
export const limbSpread = (yaw: number) => 1 - 0.85 * Math.min(1, Math.abs(yaw));

/** Face swaps happen through a blink: two frames shut either side of each change, as in the genre. */
export const faceAt = (f: number, keys: [number, Expr][]): { expr: Expr; blink: number } => {
  let expr = keys[0][1];
  let blink = 0;
  for (let i = 0; i < keys.length; i++) {
    const [k, e] = keys[i];
    if (f >= k) expr = e;
    if (i > 0 && f >= k - 2 && f < k + 1) blink = 1;
  }
  return { expr, blink };
};

/** A local point to world space, for attaching props (the mug in Pip's hand). */
export const toWorld = (pose: Pose, p: P): P => {
  const spun = rot(p, pose.spin, { x: 0, y: -90 });
  return { x: pose.x + spun.x * pose.scale, y: pose.y + spun.y * pose.scale };
};

/** Straight-arm reach: the right arm angle (local) that points the hand at a world target. */
export const reachAngle = (pose: Pose, target: P) => {
  const sh = toWorld(pose, rot({ x: SHOULDER.x * limbSpread(pose.yaw) + pose.yaw * 6, y: SHOULDER.y }, pose.tilt));
  const world = (Math.atan2(target.x - sh.x, target.y - sh.y) * 180) / Math.PI; // 0 = straight down
  return world - pose.tilt;
};

/**
 * The fuller face (Look.detail): eyes with whites, pupils and a catchlight; brows on every expression, in the hair's
 * colour; a small nose; cheeks; lashes; and a mouth that opens with `talk`. Every measure hangs off the head, so the
 * face is the same size and in the same place on the head in every shot.
 */
const FaceFull: React.FC<{ expr: Expr; blink: number; look: number; yaw: number; L: Look; talk: number }> = ({ expr, blink, look, yaw, L, talk }) => {
  const ink = L.face;
  const browC = L.brow ?? L.hair;
  const ay = Math.min(1, Math.abs(yaw));
  const farHidden = ay > 0.72;
  const farSide = yaw > 0 ? -1 : 1;
  const eyeY = HEAD.y - 4;
  const EX = 22;
  const lid = expr === 'smug' || expr === 'cool' ? 0.42 : expr === 'tired' ? 0.52 : 0;
  const open = Math.max(0, 1 - Math.max(blink, lid));
  const big = expr === 'shock' || expr === 'oops';
  const RX = big ? 15 : 13;
  const RY = big ? 18 : 15;
  const pr = big ? 5 : 6.6;
  const px = look * 5.2;
  const shut = blink >= 0.95;
  const arcs = expr === 'happy';
  const eye = (cx: number) => {
    if (farHidden && Math.sign(cx) === farSide) return null;
    const out = Math.sign(cx);
    if (arcs || shut || expr === 'dizzy') {
      const d = arcs ? `M ${cx - 12} ${eyeY + 4} Q ${cx} ${eyeY - 10} ${cx + 12} ${eyeY + 4}` : `M ${cx - 12} ${eyeY + 1} Q ${cx} ${eyeY + 9} ${cx + 12} ${eyeY + 1}`;
      return (
        <g>
          {expr === 'dizzy' && !shut ? (
            <path d={`M ${cx - 8} ${eyeY - 8} L ${cx + 8} ${eyeY + 8} M ${cx + 8} ${eyeY - 8} L ${cx - 8} ${eyeY + 8}`} stroke={ink} strokeWidth={5} strokeLinecap="round" />
          ) : (
            <path d={d} stroke={ink} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          )}
          {L.lashes && expr !== 'dizzy' ? <path d={`M ${cx + out * 12} ${eyeY + (arcs ? 4 : 1)} l ${out * 7} ${arcs ? 3 : -4} M ${cx + out * 8} ${eyeY + (arcs ? -1 : 5)} l ${out * 7} ${arcs ? -4 : 3}`} stroke={ink} strokeWidth={3} strokeLinecap="round" /> : null}
          {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 17} Q ${cx} ${eyeY + 23} ${cx + 12} ${eyeY + 17}`} stroke="#8C7AA6" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.5} /> : null}
        </g>
      );
    }
    // the lid comes down from the top: the white keeps its lower edge, the pupil is cut by the lid
    const ry = Math.max(2.2, RY * open);
    const cy = eyeY + (RY - ry);
    const top = cy - ry;
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={RX} ry={ry} fill="#FFFFFF" stroke={ink} strokeWidth={3.5} />
        <ellipse cx={cx + px} cy={Math.max(cy, eyeY + 1)} rx={pr} ry={Math.min(pr, Math.max(1.6, ry - 2.2))} fill={ink} />
        {ry > 6 ? <circle cx={cx + px + 2.2} cy={Math.max(cy, eyeY + 1) - 2.4} r={2} fill="#FFFFFF" /> : null}
        {lid || (blink > 0.05 && !shut) ? <path d={`M ${cx - RX - 1} ${top + 2} Q ${cx} ${top - 3} ${cx + RX + 1} ${top + 2}`} stroke={ink} strokeWidth={4.5} fill="none" strokeLinecap="round" /> : null}
        {L.lashes ? <path d={`M ${cx + out * (RX - 3)} ${top + 4} l ${out * 8} -6 M ${cx + out * (RX - 9)} ${top + 1} l ${out * 5} -8`} stroke={ink} strokeWidth={3} strokeLinecap="round" /> : null}
        {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 20} Q ${cx} ${eyeY + 26} ${cx + 12} ${eyeY + 20}`} stroke="#8C7AA6" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.5} /> : null}
      </g>
    );
  };
  // brows: [inner end height, outer end height, arch] above the eye line, drawn for both sides
  const B: Record<Expr, [number, number, number]> = {
    neutral: [25, 24, 4],
    smile: [27, 26, 5],
    happy: [30, 28, 6],
    smug: [24, 28, 2],
    cool: [23, 25, 1],
    shock: [38, 36, 8],
    oops: [36, 33, 6],
    worried: [35, 25, 2],
    tired: [25, 22, 3],
    dizzy: [30, 27, 4],
  };
  const [bi, bo, arch] = B[expr];
  const brow = (sd: 1 | -1) => {
    if (farHidden && sd === farSide) return null;
    // a raised brow on the smug face: the screen-right one sits higher
    const lift = expr === 'smug' && sd === 1 ? 7 : 0;
    const x0 = sd * (EX - 12);
    const x1 = sd * (EX + 13);
    return <path key={sd} d={`M ${x0} ${eyeY - bi - lift} Q ${sd * EX} ${eyeY - (bi + bo) / 2 - arch - lift} ${x1} ${eyeY - bo - lift}`} stroke={browC} strokeWidth={6} fill="none" strokeLinecap="round" />;
  };
  const mY = HEAD.y + 30;
  const said = Math.min(1, Math.max(0, talk));
  const mouths: Record<Expr, React.ReactNode> = {
    neutral: <path d={`M -10 ${mY} Q 0 ${mY + 4} 10 ${mY}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    smile: <path d={`M -15 ${mY - 3} Q 0 ${mY + 11} 15 ${mY - 3}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    happy: (
      <g>
        <path d={`M -18 ${mY - 5} Q 0 ${mY + 20} 18 ${mY - 5} Z`} fill={ink} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        <path d={`M -9 ${mY + 8} Q 0 ${mY + 3} 9 ${mY + 8} Q 0 ${mY + 14} -9 ${mY + 8} Z`} fill="#E8736B" />
      </g>
    ),
    smug: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    cool: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    shock: <ellipse cx={0} cy={mY + 4} rx={9} ry={13} fill={ink} />,
    worried: <path d={`M -14 ${mY + 5} Q 0 ${mY - 5} 14 ${mY + 5}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    oops: <g><rect x={-17} y={mY - 6} width={34} height={15} rx={6} fill={ink} /><path d={`M -13 ${mY + 1.5} L 13 ${mY + 1.5}`} stroke="#fff" strokeWidth={3} /></g>,
    dizzy: <path d={`M -14 ${mY + 4} Q -7 ${mY - 4} 0 ${mY + 4} Q 7 ${mY + 12} 14 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    tired: <path d={`M -11 ${mY + 4} Q 0 ${mY} 11 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
  };
  // speaking: the mouth opens and closes with the voice; wide on a smiling face, round on a worried one
  const wide = expr === 'happy' || expr === 'smile' || expr === 'smug' ? 13 : 9.5;
  const speak = (
    <g>
      <ellipse cx={0} cy={mY + 2 + said * 3} rx={wide - said * 1.5} ry={2.5 + said * 9.5} fill={ink} />
      {said > 0.45 ? <ellipse cx={0} cy={mY + 5 + said * 8} rx={wide * 0.55} ry={said * 3.6} fill="#E8736B" /> : null}
    </g>
  );
  return (
    <g transform={`translate(${yaw * 25} 0) scale(${1 - 0.3 * ay} 1)`}>
      {L.cheek ? [-1, 1].map((sd) => (farHidden && sd === farSide ? null : <ellipse key={sd} cx={sd * 37} cy={eyeY + 26} rx={11 - 3 * ay} ry={7} fill={L.cheek} opacity={0.5 * (1 - 0.6 * ay)} />)) : null}
      {eye(-EX)}
      {eye(EX)}
      {brow(-1)}
      {brow(1)}
      <path d={`M ${yaw * 5 - 1} ${eyeY + 15} q ${4 + yaw * 4} 5 ${-1 + yaw * 2} 9`} stroke={ink} strokeWidth={3.2} fill="none" strokeLinecap="round" opacity={0.55} />
      {said > 0.06 ? speak : mouths[expr]}
      {expr === 'shock' || expr === 'oops' ? <path d={`M 54 ${HEAD.y - 30} q 6 10 0 16 q -6 -6 0 -16 Z`} fill="#8FD3FF" /> : null}
    </g>
  );
};


const Face: React.FC<{ expr: Expr; blink: number; look: number; glasses: number; yaw?: number; ink?: string; glint?: number; glintColor?: string; L?: Look; talk?: number }> = ({ expr, blink, look, glasses, yaw = 0, ink = C.ink, glint = 0, glintColor = '#8FF0FF', L, talk = 0 }) => {
  if (L?.detail) return <FaceFull expr={expr} blink={blink} look={look} yaw={yaw} L={L} talk={talk} />;
  const ex = look * 7;
  const ay = Math.min(1, Math.abs(yaw));
  const farHidden = ay > 0.72;
  const farSide = yaw > 0 ? -1 : 1; // facing screen-right hides the screen-left eye
  const eyeY = HEAD.y - 4;
  // heavy lids: half shut when smug or cool, more than half when tired (with dark rings under the eyes)
  const lid = expr === 'smug' || expr === 'cool' ? 0.45 : expr === 'tired' ? 0.58 : 0;
  const open = Math.max(0.08, 1 - Math.max(blink, lid));
  const eye = (cx: number) => {
    if (farHidden && Math.sign(cx) === farSide) return null;
    if (expr === 'happy') return <path d={`M ${cx - 10} ${eyeY + 3} Q ${cx} ${eyeY - 9} ${cx + 10} ${eyeY + 3}`} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (expr === 'oops') return <path d={`M ${cx - 9} ${eyeY - 6} L ${cx + 4} ${eyeY} L ${cx - 9} ${eyeY + 6}`} transform={cx > 0 ? `translate(${2 * cx},0) scale(-1,1)` : undefined} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    if (expr === 'dizzy') return <g stroke={ink} strokeWidth={5} strokeLinecap="round"><path d={`M ${cx - 7} ${eyeY - 7} L ${cx + 7} ${eyeY + 7} M ${cx + 7} ${eyeY - 7} L ${cx - 7} ${eyeY + 7}`} /></g>;
    // shut (a blink's middle frame, or asleep): the closed lid's curve, with the tired rings kept
    if (blink >= 0.95)
      return (
        <g>
          <path d={`M ${cx - 12} ${eyeY + 1} Q ${cx} ${eyeY + 8} ${cx + 12} ${eyeY + 1}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 15} Q ${cx} ${eyeY + 22} ${cx + 12} ${eyeY + 15}`} stroke="#8C7AA6" strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={0.85} /> : null}
        </g>
      );
    const big = expr === 'shock';
    const rx = big ? 11 : 7;
    const ry = (big ? 13 : 10) * open;
    return (
      <g>
        <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={rx} ry={ry} fill={ink} />
        {big && open > 0.5 ? <circle cx={cx + ex + 3.5} cy={eyeY - 4} r={3.4} fill="#fff" /> : null}
        {lid ? <path d={expr === 'tired' ? `M ${cx - 13} ${eyeY - 1} Q ${cx} ${eyeY - 5} ${cx + 13} ${eyeY - 1}` : `M ${cx - 12} ${eyeY - 4} L ${cx + 12} ${eyeY - 2}`} stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
        {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 14} Q ${cx} ${eyeY + 21} ${cx + 12} ${eyeY + 14}`} stroke="#8C7AA6" strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={0.85} /> : null}
      </g>
    );
  };
  const brows: Record<Expr, string> = {
    neutral: '',
    happy: '',
    smug: `M -34 ${eyeY - 22} L -12 ${eyeY - 20} M 12 ${eyeY - 26} L 34 ${eyeY - 30}`,
    shock: `M -32 ${eyeY - 28} Q -21 ${eyeY - 36} -10 ${eyeY - 29} M 10 ${eyeY - 29} Q 21 ${eyeY - 36} 32 ${eyeY - 28}`,
    worried: `M -32 ${eyeY - 18} L -12 ${eyeY - 26} M 12 ${eyeY - 26} L 32 ${eyeY - 18}`,
    oops: `M -32 ${eyeY - 20} L -12 ${eyeY - 16} M 12 ${eyeY - 16} L 32 ${eyeY - 20}`,
    cool: '',
    dizzy: '',
    tired: `M -33 ${eyeY - 17} Q -22 ${eyeY - 21} -11 ${eyeY - 19} M 11 ${eyeY - 19} Q 22 ${eyeY - 21} 33 ${eyeY - 17}`,
    smile: '',
  };
  const mY = HEAD.y + 28;
  const mouth: Record<Expr, React.ReactNode> = {
    neutral: <path d={`M -10 ${mY} Q 0 ${mY + 4} 10 ${mY}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    happy: <path d={`M -18 ${mY - 4} Q 0 ${mY + 20} 18 ${mY - 4} Z`} fill={ink} />,
    smug: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    shock: <ellipse cx={0} cy={mY + 4} rx={10} ry={14} fill={ink} />,
    worried: <path d={`M -16 ${mY + 4} Q -8 ${mY - 4} 0 ${mY + 4} Q 8 ${mY + 12} 16 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    oops: <g><rect x={-18} y={mY - 6} width={36} height={16} rx={6} fill={ink} /><path d={`M -14 ${mY + 2} L 14 ${mY + 2}`} stroke="#fff" strokeWidth={3} /></g>,
    cool: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    dizzy: <path d={`M -14 ${mY + 4} Q -7 ${mY - 4} 0 ${mY + 4} Q 7 ${mY + 12} 14 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    tired: <path d={`M -11 ${mY + 4} Q 0 ${mY} 11 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    smile: <path d={`M -15 ${mY - 2} Q 0 ${mY + 12} 15 ${mY - 2}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
  };
  return (
    <g transform={`translate(${yaw * 30} 0) scale(${1 - 0.28 * ay} 1)`}>
      {eye(-21)}
      {eye(21)}
      {brows[expr] ? <path d={brows[expr]} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" /> : null}
      {mouth[expr]}
      {expr === 'shock' || expr === 'oops' ? <path d={`M 52 ${HEAD.y - 30} q 6 10 0 16 q -6 -6 0 -16 Z`} fill="#8FD3FF" /> : null}
      {/* a power lighting the eyes: a soft halo, a bright iris, a white catchlight (none while the lids are shut) */}
      {glint > 0.01 && blink < 0.95
        ? [-21, 21].map((cx) =>
            farHidden && Math.sign(cx) === farSide ? null : (
              <g key={`gl${cx}`} opacity={Math.min(1, glint)}>
                <circle cx={cx + ex} cy={eyeY} r={17} fill={glintColor} opacity={0.2} />
                <circle cx={cx + ex} cy={eyeY} r={12} fill={glintColor} opacity={0.28} />
                <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={8} ry={Math.max(2, 11 * open)} fill={glintColor} />
                <circle cx={cx + ex + 2.5} cy={eyeY - 3} r={2.6} fill="#FFFFFF" />
              </g>
            ),
          )
        : null}
      {glasses > 0.01 ? (
        <g opacity={glasses} transform={`translate(0 ${(1 - glasses) * -60})`}>
          {/* classic shades: a full bar across, two big lenses, one bright glint so it reads at feed size */}
          <path d={`M -58 ${eyeY - 12} L 58 ${eyeY - 12}`} stroke={ink} strokeWidth={6} strokeLinecap="round" />
          <path d={`M -50 ${eyeY - 14} L -6 ${eyeY - 14} L -10 ${eyeY + 8} Q -28 ${eyeY + 18} -46 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
          <path d={`M 6 ${eyeY - 14} L 50 ${eyeY - 14} L 46 ${eyeY + 8} Q 28 ${eyeY + 18} 10 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
          <path d={`M -40 ${eyeY + 2} L -26 ${eyeY - 10} M 16 ${eyeY + 2} L 30 ${eyeY - 10}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
        </g>
      ) : null}
    </g>
  );
};

export const Hero: React.FC<{ pose: Pose; shadow?: number; rimId?: string; look?: Look }> = ({ pose, shadow = 1, rimId = 'rimR', look = LOOKS.pipHood }) => {
  const j = joints(pose);
  const L = look;
  // limbs are light with a dark outline, so they read on the dark sets (navy limbs vanished on navy walls)
  const limb = (o: { root: P; mid: P; end: P }, w: number) => {
    const d = `M ${o.root.x} ${o.root.y} L ${o.mid.x} ${o.mid.y} L ${o.end.x} ${o.end.y}`;
    return (
      <g>
        <path d={d} stroke={L.line} strokeWidth={w + 7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={L.limb} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  const shoe = (o: { root: P; mid: P; end: P }) => (
    <ellipse cx={o.end.x + pose.facing * 9} cy={o.end.y + 4} rx={22} ry={11} fill={L.shoe} stroke={L.line} strokeWidth={4} />
  );
  // a mitten along the forearm: the palm, the thumb toward the body, two knuckle marks; or a pointing fist
  const hand = (o: { mid: P; end: P }, side: 1 | -1, kind: HandKind) => {
    const ang = (Math.atan2(o.end.x - o.mid.x, o.end.y - o.mid.y) * 180) / Math.PI;
    return (
      <g transform={`translate(${o.end.x} ${o.end.y}) rotate(${-ang})`}>
        {kind === 'point' ? (
          <g>
            <rect x={-4} y={10} width={8} height={24} rx={4} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
            <path d="M -11 -2 Q -14 14 -6 18 L 7 18 Q 14 14 11 -2 Z" fill={L.hand} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
            <ellipse cx={side * 10} cy={6} rx={4.5} ry={7} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
          </g>
        ) : (
          <g>
            <ellipse cx={side * 10} cy={3} rx={5.5} ry={9} transform={`rotate(${side * -28} ${side * 10} 3)`} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <ellipse cx={0} cy={10} rx={11} ry={15} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <path d="M -4 17 L -4 23 M 3 18 L 3 24" stroke={L.line} strokeWidth={2} opacity={0.45} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  };
  const kw = turnWidth(pose.yaw);
  const torso = (
    <g transform={`rotate(${pose.tilt}) translate(${pose.yaw * 6} 0) scale(${kw} 1)`}>
      <path d="M -46 -112 Q 0 -124 46 -112 L 40 2 Q 0 12 -40 2 Z" fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 10 -116 Q 30 -114 46 -112 L 40 2 Q 26 8 12 9 Z" fill={L.jacketShade} opacity={0.55} />
      <path d="M 0 -112 L 0 4" stroke={L.jacketShade} strokeWidth={4} />
      {L.extra === 'suit' ? (
        // a white shirt in the V of the jacket and a tie in the accent colour
        <g>
          <path d="M -24 -116 L 0 -54 L 24 -116 Z" fill="#EDE8DE" />
          <path d="M -7 -112 L 7 -112 L 9 -100 L 5 -64 L 0 -56 L -5 -64 L -9 -100 Z" fill={L.accent} />
          <path d="M -26 -116 L 0 -54 M 26 -116 L 0 -54" stroke={L.line} strokeWidth={4} />
        </g>
      ) : (
        <path d="M -22 -118 Q 0 -100 22 -118" stroke={L.accent} strokeWidth={6} fill="none" strokeLinecap="round" />
      )}
      {L.apron ? (
        // an apron: a bib on two straps, a waist tie, one pocket
        <g>
          <path d="M -17 -90 L -12 -116 M 17 -90 L 12 -116" stroke={L.apron} strokeWidth={6} strokeLinecap="round" />
          <path d="M -20 -92 L 20 -92 L 24 -44 L 37 -40 L 35 5 Q 0 13 -35 5 L -37 -40 L -24 -44 Z" fill={L.apron} stroke={L.line} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M -13 -24 L 13 -24 L 12 -6 Q 0 -2 -12 -6 Z" fill="none" stroke={L.line} strokeWidth={3} strokeLinejoin="round" opacity={0.55} />
        </g>
      ) : null}
    </g>
  );
  const head = (
    <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt} 0 ${HEAD.y + 40})`}>
      {L.detail && Math.abs(pose.yaw) > 0.5 ? (
        <ellipse cx={Math.sign(pose.yaw) * (HEAD.r - 2)} cy={HEAD.y + 13} rx={3 + 6 * Math.min(1, (Math.abs(pose.yaw) - 0.5) / 0.5)} ry={6} fill={L.skin} stroke={L.line} strokeWidth={4} />
      ) : null}
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={L.skin} stroke={L.line} strokeWidth={4} />
      <path d={`M ${HEAD.x + 14} ${HEAD.y + 58} A ${HEAD.r} ${HEAD.r} 0 0 0 ${HEAD.x + 60} ${HEAD.y + 14} A 70 70 0 0 1 ${HEAD.x + 14} ${HEAD.y + 58} Z`} fill={L.skinShade} />
      {L.extra === 'bunches' || L.extra === 'bob' || L.extra === 'suit' || L.extra === 'mop' || L.extra === 'bun' ? null : (
        <path transform={`translate(${-pose.yaw * 16} 0)`} d={`M -6 ${HEAD.y - 60} q 10 -26 30 -18 q -16 2 -14 16 q -8 -10 -16 2 Z`} fill={L.hair} />
      )}
      {L.extra === 'bunches' ? (
        // a fringe cap and two bunches tied with coral bands; the bunches swing a little with sway
        <g>
          {[-1, 1].map((sd) => (
            <g key={sd} transform={`rotate(${pose.sway * 0.5} ${sd * 58} ${HEAD.y - 30})`}>
              <circle cx={sd * 72 - pose.yaw * 10} cy={HEAD.y - 24} r={24} fill={L.hair} stroke={L.line} strokeWidth={4} />
              <circle cx={sd * 55 - pose.yaw * 10} cy={HEAD.y - 30} r={8} fill={L.accent} />
            </g>
          ))}
          <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -60 ${HEAD.y - 22} Q -62 ${HEAD.y - 66} 0 ${HEAD.y - 66} Q 62 ${HEAD.y - 66} 60 ${HEAD.y - 22} Q 40 ${HEAD.y - 46} 14 ${HEAD.y - 40} Q 0 ${HEAD.y - 50} -14 ${HEAD.y - 40} Q -40 ${HEAD.y - 46} -60 ${HEAD.y - 22} Z`} fill={L.hair} />
        </g>
      ) : null}
      {L.extra === 'bob' ? (
        // a chin-length bob framing the face, a side parting
        <path
          transform={`translate(${-pose.yaw * 12} 0)`}
          d={`M -74 ${HEAD.y + 34} Q -84 ${HEAD.y - 70} 0 ${HEAD.y - 72} Q 84 ${HEAD.y - 70} 74 ${HEAD.y + 34} L 56 ${HEAD.y + 34} Q 60 ${HEAD.y - 20} 40 ${HEAD.y - 40} Q 10 ${HEAD.y - 34} -16 ${HEAD.y - 48} Q -52 ${HEAD.y - 30} -56 ${HEAD.y + 34} Z`}
          fill={L.hair}
          stroke={L.line}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ) : null}
      {L.extra === 'mop' || L.extra === 'bun' ? (
        // Hair that stays on the skull as the head turns: its outer edge is the head's own outline (a little proud of
        // it), ending lower at the back of the head and higher at the brow on the side he faces; only the hairline
        // (the fringe, the parting) moves across with the face.
        (() => {
          const yw = Math.max(-1, Math.min(1, pose.yaw));
          const R = HEAD.r + 5;
          const cy = HEAD.y;
          const drop = (sd: 1 | -1) => -8 + (sd * yw < 0 ? 30 : -16) * Math.abs(yw); // the back comes down, the front goes up
          const end = (sd: 1 | -1) => {
            const dy = drop(sd);
            return { x: sd * Math.sqrt(R * R - dy * dy), y: cy + dy };
          };
          const a = end(-1);
          const b = end(1);
          const large = Math.asin(drop(-1) / R) + Math.asin(drop(1) / R) > 0 ? 1 : 0;
          const sh = yw * 15;
          const cap = `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`;
          const q = (n: number) => n.toFixed(1);
          if (L.extra === 'mop') {
            const line = `Q ${q(Math.min(b.x - 4, 52 + sh))} ${cy - 40} ${q(36 + sh)} ${cy - 38} Q ${q(28 + sh)} ${cy - 54} ${q(11 + sh)} ${cy - 40} Q ${q(-2 + sh)} ${cy - 56} ${q(-18 + sh)} ${cy - 40} Q ${q(Math.max(a.x + 4, -42 + sh))} ${cy - 50} ${a.x} ${a.y} Z`;
            return (
              <g>
                <g transform={`translate(${-yw * 5} 0) rotate(${pose.sway * 0.6} 0 ${cy - 60})`}>
                  <path d={`M -26 ${cy - 62} l 4 -26 l 14 20 Z M -4 ${cy - 66} l 12 -28 l 8 26 Z M 20 ${cy - 62} l 18 -18 l -2 22 Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
                </g>
                <path d={`${cap} ${line}`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
              </g>
            );
          }
          const line = `Q ${q(Math.min(b.x - 6, 48 + sh))} ${cy - 44} ${q(sh)} ${cy - 50} Q ${q(Math.max(a.x + 6, -48 + sh))} ${cy - 44} ${a.x} ${a.y} Z`;
          return (
            <g>
              <circle cx={-yw * 9} cy={cy - 84} r={24} fill={L.hair} stroke={L.line} strokeWidth={4} />
              <path d={`${cap} ${line}`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
              <circle cx={sh * 0.6} cy={cy - 63} r={5} fill={L.accent} />
            </g>
          );
        })()
      ) : null}
      {L.extra === 'suit' ? (
        // short combed-back hair with a hard side parting
        <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -60 ${HEAD.y - 18} Q -64 ${HEAD.y - 70} 4 ${HEAD.y - 68} Q 64 ${HEAD.y - 64} 60 ${HEAD.y - 18} Q 52 ${HEAD.y - 44} 18 ${HEAD.y - 46} L 12 ${HEAD.y - 54} L 6 ${HEAD.y - 46} Q -44 ${HEAD.y - 46} -60 ${HEAD.y - 18} Z`} fill={L.hair} />
      ) : null}
      {L.earring ? [-1, 1].map((sd) => (Math.abs(pose.yaw) > 0.72 && sd === (pose.yaw > 0 ? -1 : 1) ? null : <circle key={sd} cx={sd * (HEAD.r - 3) * (1 - 0.25 * Math.abs(pose.yaw)) + pose.yaw * 12} cy={HEAD.y + 26} r={6} fill={L.earring} stroke={L.line} strokeWidth={3} />)) : null}
      <Face expr={pose.expr} blink={pose.blink} look={pose.look} glasses={pose.glasses} yaw={pose.yaw} ink={L.face} glint={pose.glint} glintColor={pose.glintColor} L={L} talk={pose.talk} />
      {L.extra === 'curls'
        ? [-150, -125, -100, -78, -55, -30].map((deg, k) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={k} cx={Math.cos(a) * 54} cy={HEAD.y + Math.sin(a) * 54} r={24} fill={L.hair} />;
          })
        : null}
    </g>
  );
  return (
    <g>
      {shadow > 0 ? <ellipse cx={pose.x} cy={pose.y + LEG_LEN * pose.scale + 10} rx={70 * pose.scale} ry={12 * pose.scale} fill="#000" opacity={0.25 * shadow} /> : null}
      <g transform={`translate(${pose.x} ${pose.y}) scale(${pose.scale}) rotate(${pose.spin} 0 -90)`} filter={`url(#${rimId})`}>
        <g transform={`translate(0 ${LEG_LEN}) scale(${1 + 0.6 * pose.squash} ${1 - pose.squash}) translate(0 ${-LEG_LEN})`}>
          {/* the far side is drawn first, so a turned body overlaps itself the right way */}
          {pose.yaw < 0 ? <>{limb(j.legR, 12)}{shoe(j.legR)}{limb(j.legL, 12)}{shoe(j.legL)}</> : <>{limb(j.legL, 12)}{shoe(j.legL)}{limb(j.legR, 12)}{shoe(j.legR)}</>}
          {pose.yaw < 0 ? <>{limb(j.armR, 11)}{hand(j.armR, -1, pose.handR)}</> : <>{limb(j.armL, 11)}{hand(j.armL, 1, pose.handL)}</>}
          {torso}
          {pose.yaw < 0 ? <>{limb(j.armL, 11)}{hand(j.armL, 1, pose.handL)}</> : <>{limb(j.armR, 11)}{hand(j.armR, -1, pose.handR)}</>}
          {L.extra === 'hood' ? (
            <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt * 0.5} 0 ${HEAD.y + 40})`}>
              <path d={`M -70 ${HEAD.y + 14} Q -80 ${HEAD.y - 74} 0 ${HEAD.y - 80} Q 80 ${HEAD.y - 74} 70 ${HEAD.y + 14} Q 52 -100 0 -106 Q -52 -100 -70 ${HEAD.y + 14} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} />
              {(() => {
                const sw = pose.sway * 0.7 - pose.tilt * 0.6;
                return (
                  <g>
                    <path d={`M -12 -108 Q ${-14 + sw * 0.3} -88 ${-16 + sw} -66 M 12 -108 Q ${14 + sw * 0.3} -88 ${16 + sw} -66`} stroke={L.accent} strokeWidth={5} strokeLinecap="round" fill="none" />
                    <circle cx={-16 + sw} cy={-64} r={5} fill={L.accent} />
                    <circle cx={16 + sw} cy={-64} r={5} fill={L.accent} />
                  </g>
                );
              })()}
            </g>
          ) : null}
          {L.extra === 'curls' ? (
            <g transform={`rotate(${pose.tilt})`}>
              <path d="M -46 -110 Q 0 -86 46 -110" stroke="#E06A5A" strokeWidth={8} fill="none" strokeLinecap="round" />
              <rect x={-60} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
              <rect x={40} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
            </g>
          ) : null}
          {head}
        </g>
      </g>
    </g>
  );
};


/** A character is the rig in a costume: <Actor> is the same as <Hero>, named for scenes with more than one person. */
export const Actor = Hero;

/**
 * A walk in profile. `phase` advances about 0.6 a frame for a normal walk; `ground` is the floor height under the hips
 * (a number, or a function of x for stairs and slopes). Leans into the step, bobs the head, bends the elbows, swings
 * loose things (the drawstrings) a beat behind the body.
 */
export const walkPose = (x: number, phase: number, ground: number | ((x: number) => number), scale = 0.9, extra: Partial<Pose> = {}, facing: 1 | -1 = 1): Pose => {
  const s = Math.sin(phase);
  const g = typeof ground === 'number' ? ground : ground(x);
  return {
    ...basePose,
    x,
    y: g - LEG_LEN * scale - Math.abs(Math.cos(phase)) * 7,
    scale,
    facing,
    yaw: facing,
    tilt: 5 * facing,
    headTilt: 2 * Math.sin(phase * 2),
    sway: 10 * Math.sin(phase + 0.8),
    legL: { a: 28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2)) },
    legR: { a: -28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2 + Math.PI)) },
    armL: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    armR: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    ...extra,
  };
};

/** Where the feet are for a pose standing at hip y: use it to put a character on a floor (y = floor - feetBelowHips). */
export const feetBelowHips = (scale: number) => LEG_LEN * scale;
