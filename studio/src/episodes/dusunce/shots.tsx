import React from 'react';
import {
  Hero, Pose, basePose, poseAt, faceAt, kf, clamp, easeOut, backOut, rnd, camT, LOOKS, LEG_LEN, HEAD,
  Classroom, SchoolDesk, Kid, KIDS, Kitchen, KitchenIsland, KITCHEN, stand, Stairwell, Rooftop, Schematic, SCH, DrawOn, SchLabel, CountUp,
  PizzaSlice, Foreground, FocusRings, Sparkle, FloatLabel, Glow, FONT, C, ShotProps,
} from '../../engine';

// "Ya herkesin düşüncelerini duyabilseydin?" Twelve shots, framed for a vertical 9:16 frame: the engine crops the
// 1920 x 1080 world to its centre column (x 656..1264), so every shot composes inside that column.
// The power: DUY. Cyan rings open from someone's head, then their thought pops out as a bubble.

const PIP = LOOKS.pipHood;
const MO = LOOKS.mo;
const MOM = LOOKS.mom;
const CYAN = '#7FD4FF';
const INK = '#1A1230';
const CREAM = '#F6EFE3';

const CLOUD: [number, number, number][] = [[-58, 8, 44], [-20, -22, 50], [30, -20, 48], [62, 10, 42], [20, 26, 46], [-24, 28, 44]];

/** A thought bubble: two small circles rise from the head (hx, hy), then the cloud pops in at (x, y) from t = 0. */
const Thought: React.FC<{ x: number; y: number; t: number; s?: number; hx?: number; hy?: number; children?: React.ReactNode; glow?: boolean; fill?: string; o?: number }> = ({
  x, y, t, s = 1, hx, hy, children, glow = true, fill = CREAM, o = 1,
}) => {
  if (t < -6) return null;
  const k = backOut(clamp(t / 7));
  const g = 1 - clamp(t / 14);
  const dot = (p: number, r: number, at: number) => {
    if (hx === undefined || hy === undefined || t < at) return null;
    const px = hx + (x - hx) * p;
    const py = hy + (y + 60 * s - hy) * p;
    const kk = backOut(clamp((t - at) / 4));
    return <circle cx={px} cy={py} r={r * s * kk} fill={fill} stroke={INK} strokeWidth={4 * s} />;
  };
  return (
    <g opacity={o}>
      {dot(0.22, 9, -6)}
      {dot(0.55, 15, -3)}
      {t >= 0 ? (
        <g transform={`translate(${x} ${y}) scale(${s * (0.4 + 0.6 * k)})`} style={glow && g > 0 ? { filter: `drop-shadow(0 0 ${6 + 22 * g}px ${CYAN})` } : undefined}>
          {CLOUD.map(([cx, cy, r], i) => (
            <circle key={`o${i}`} cx={cx} cy={cy} r={r + 5} fill={INK} />
          ))}
          {CLOUD.map(([cx, cy, r], i) => (
            <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill={fill} />
          ))}
          {children}
        </g>
      ) : null}
    </g>
  );
};

/** Three dots: a thought we can't read yet. */
const Dots: React.FC = () => (
  <g fill={INK} opacity={0.75}>
    <circle cx={-30} cy={2} r={9} />
    <circle cx={0} cy={2} r={9} />
    <circle cx={30} cy={2} r={9} />
  </g>
);

/** Little glyphs for a crowd of thoughts: no words, just shapes. */
const Glyph: React.FC<{ i: number }> = ({ i }) => {
  const k = i % 6;
  if (k === 0) return <Dots />;
  if (k === 1) return <path d="M 0 30 C -52 -6 -26 -44 0 -18 C 26 -44 52 -6 0 30 Z" fill="#E0566A" />;
  if (k === 2) return <text y={30} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={88} fill={INK}>?</text>;
  if (k === 3) return <path d="M -34 -22 L 30 -22 L -30 26 L 36 26" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />;
  if (k === 4) return <text y={30} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={88} fill="#E0566A">!</text>;
  return (
    <g fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round">
      <path d="M -36 6 Q -18 -22 0 6 Q 18 34 36 6" />
    </g>
  );
};

/** Pip's hooded head and shoulder from behind, dark and soft, for over-the-shoulder shots (world units). */
const PipBack: React.FC<{ x: number; y: number; s?: number; blur?: number }> = ({ x, y, s = 1, blur = 6 }) => (
  <Foreground blur={blur}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -190 330 Q -170 110 -40 80 Q 110 60 170 150 Q 230 210 250 330 Z" fill="#14121C" />
      <circle cx={0} cy={0} r={120} fill="#1A1724" />
      <path d="M -112 -30 Q -90 -124 0 -124 Q 90 -124 112 -30" stroke="#FFB46A" strokeWidth={6} fill="none" opacity={0.4} />
    </g>
  </Foreground>
);

// ---------- S1: medium, the classroom: Pip over his exam sheet, no idea ----------
const DESK_X = 1260;
export const S1: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: DESK_X, y: 760, yaw: -0.3, look: -0.5, headTilt: 9, tilt: 3, armL: { a: 22, b: -12 }, armR: { a: 16, b: -8 } } },
    { f: 16, p: { headTilt: 10 } },
    { f: 22, p: { headTilt: -5, tilt: 0, look: 0.7 }, ease: easeOut },
    { f: 34, p: { headTilt: -3, look: 0.7 } },
    { f: 40, p: { headTilt: 2, look: -0.8 }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'worried'], [20, 'oops']]);
  return (
    <g transform={camT(kf(t, [[0, 1246], [len, 1258]]), kf(t, [[0, 566], [len, 556]]), kf(t, [[0, 1.5], [len, 1.62]]))}>
      <Classroom t={t + 30} id="c1" />
      <Hero look={PIP} pose={{ ...pose, ...face }} rimId="rimL" shadow={0} />
      <SchoolDesk x={DESK_X} />
      <FloatLabel x={1352} y={470} t={t - 20} text="?" size={84} />
      <FloatLabel x={1150} y={452} t={t - 27} text="?" size={64} />
      <FloatLabel x={1300} y={400} t={t - 34} text="?" size={54} />
    </g>
  );
};

// ---------- S2: close-up, the kid at the next desk in profile: DUY, and the answer pops out of her head ----------
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const push = 1 + 0.03 * clamp(t / len);
  return (
    <g transform={`translate(960 540) scale(${push}) translate(-960 -540)`}>
      <g filter="url(#blur16)">
        <g transform="translate(-1300 -420) scale(1.9)">
          <Classroom t={t + 80} id="c2" />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.3} />
      <Glow x={760} y={560} r={420} o={0.35} />
      <Kid x={890} y={1010} s={2.05} look={KIDS[0]} turn={1} t={t} />
      <FocusRings x={900} y={700} t={t - 2} r0={110} color={CYAN} />
      <Thought x={1010} y={372} t={t - 7} s={1.5} hx={945} hy={585}>
        <text x={-34} y={38} textAnchor="middle" fontFamily={FONT.hand} fontWeight={700} fontSize={118} fill={INK}>B</text>
        <DrawOnTick x={36} y={6} t={t - 11} />
      </Thought>
      <Sparkle x={1170} y={250} t={t - 12} s={1.2} />
    </g>
  );
};
const DrawOnTick: React.FC<{ x: number; y: number; t: number; s?: number; color?: string }> = ({ x, y, t, s = 1, color = '#3FA65B' }) => {
  const p = clamp(t / 5);
  if (p <= 0) return null;
  return <path d={`M ${x - 22 * s} ${y} L ${x - 4 * s} ${y + 20 * s} L ${x + 30 * s} ${y - 26 * s}`} fill="none" stroke={color} strokeWidth={13 * s} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={120 * s} strokeDashoffset={120 * s * (1 - p)} />;
};

// ---------- S3: wide over Pip's shoulder, the kitchen: mum busy at the island ----------
const MOM_STAND = stand(KITCHEN, 0.5, 0.4);
const momPose = (t: number): Pose =>
  poseAt(t, [
    { f: 0, p: { x: MOM_STAND.x, y: MOM_STAND.y, scale: MOM_STAND.scale, yaw: 0.35, look: 0.5, headTilt: 3, armL: { a: 30, b: 40 }, armR: { a: 34, b: 50 } } },
  ]);
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const stir = Math.sin(t / 2.2) * 9;
  const mom = { ...momPose(t), armR: { a: 36 + stir, b: 52 - stir }, headTilt: 3 + Math.sin(t / 5) * 3 };
  return (
    <g transform={camT(kf(t, [[0, 940], [len, 952]]), kf(t, [[0, 585], [len, 575]]), kf(t, [[0, 1.3], [len, 1.4]]))}>
      <Kitchen t={t + 40} id="k3" veil={0.4} />
      <Hero look={MOM} pose={{ ...mom, ...faceAt(t, [[0, 'happy']]) }} rimId="rimR" shadow={0} />
      <KitchenIsland />
      {/* a pot on the island, steam rising */}
      <g transform={`translate(${MOM_STAND.x + 52} 672)`}>
        <ellipse cx={0} cy={10} rx={60} ry={8} fill="#000" opacity={0.3} />
        <rect x={-46} y={-38} width={92} height={46} rx={8} fill="#5A6470" />
        <rect x={-52} y={-44} width={104} height={10} rx={5} fill="#7A8794" />
        <rect x={-46} y={-38} width={92} height={3} fill="#FFD9A0" opacity={0.6} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M ${-18 + i * 18} -52 q ${8 * Math.sin((t + i * 9) / 6)} -18 0 -34`} stroke="#F6EFE3" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.35} />
        ))}
      </g>
      <PipBack x={790} y={858} s={0.92} />
    </g>
  );
};

// ---------- S4: close-up on mum: DUY, a slice of pizza pops out of her head ----------
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const head = { x: MOM_STAND.x, y: MOM_STAND.y + HEAD.y * MOM_STAND.scale };
  const mom = { ...momPose(t), headTilt: 4 };
  return (
    <g transform={camT(head.x + 8, kf(t, [[0, head.y - 78], [len, head.y - 86]]), kf(t, [[0, 2.15], [len, 2.25]]))}>
      <g filter="url(#blur6)">
        <Kitchen t={t + 80} id="k4" veil={0.45} />
      </g>
      <Hero look={MOM} pose={{ ...mom, ...faceAt(t, [[0, 'happy']]) }} rimId="rimR" shadow={0} />
      <g filter="url(#blur3)">
        <KitchenIsland />
      </g>
      <FocusRings x={head.x} y={head.y} t={t - 2} r0={62 * MOM_STAND.scale + 6} color={CYAN} />
      <Thought x={head.x + 26} y={head.y - 176} t={t - 7} s={0.92} hx={head.x + 22} hy={head.y - 62 * MOM_STAND.scale - 4}>
        <g transform={`rotate(${-8 + Math.sin(t / 4) * 4})`}>
          <PizzaSlice x={0} y={58} len={112} rot={-90} shadow={0} />
        </g>
      </Thought>
    </g>
  );
};

// ---------- S5: extreme close-up, Pip: pizza! his eyes still lit by the power ----------
export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 2.7 * (1 + 0.05 * clamp(t / len));
  const hop = -26 * Math.sin(clamp(t / 9) * Math.PI);
  const head = { x: 960, y: 600 + hop };
  const pose: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.25, look: 0.5, headTilt: kf(t, [[0, -4], [8, 6], [14, 3]]), armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, ...faceAt(t, [[0, 'happy']]), glint: clamp(1 - t / 16), glintColor: CYAN };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-860 -480) scale(1.9)">
          <Kitchen t={t + 100} id="k5" veil={0.4} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.22} />
      <Hero look={PIP} pose={pose} rimId="rimR" shadow={0} />
      <g transform={`translate(1150 ${290 - t * 1.2}) rotate(${14 + Math.sin(t / 4) * 5}) scale(${backOut(clamp((t - 2) / 7))})`}>
        <PizzaSlice x={0} y={80} len={170} rot={-90} shadow={0} />
      </g>
      <Sparkle x={800} y={250} t={t - 8} s={1.5} />
      <Sparkle x={1200} y={420} t={t - 11} s={1.1} />
    </g>
  );
};

// ---------- S6: medium over Pip's shoulder, the stairwell: Mo waves, all smiles ----------
const LANDING = 420;
const MO_X = 300;
const moPose = (extra: Partial<Pose> = {}): Pose => ({ ...basePose, x: MO_X, y: LANDING - LEG_LEN * 0.9, scale: 0.9, ...extra });
const MO_HEAD = { x: MO_X, y: LANDING - LEG_LEN * 0.9 + HEAD.y * 0.9 };
export const S6: React.FC<ShotProps> = ({ t, len }) => {
  const wave = Math.sin(t / 2.6) * 16;
  const mo = moPose({ yaw: 0.25, look: 0.6, armR: { a: 112 + wave, b: 42 }, armL: { a: 10, b: -8 }, headTilt: Math.sin(t / 6) * 3 });
  return (
    <g transform={camT(kf(t, [[0, 316], [len, 306]]), kf(t, [[0, 300], [len, 290]]), kf(t, [[0, 1.42], [len, 1.52]]))}>
      <Stairwell t={t + 200} id="sw6" />
      <Hero look={MO} pose={{ ...mo, ...faceAt(t, [[0, 'happy']]) }} rimId="rimL" shadow={0.5} />
      <PipBack x={440} y={530} s={0.86} />
    </g>
  );
};

// ---------- S7: close-up on Mo, still smiling: DUY, and what he really thinks pops out ----------
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const mo = moPose({ yaw: 0.2, look: 0.5, armR: { a: 20, b: 10 }, armL: { a: 10, b: -8 }, headTilt: 2 });
  return (
    <g transform={camT(MO_HEAD.x + 6, kf(t, [[0, MO_HEAD.y - 84], [len, MO_HEAD.y - 92]]), kf(t, [[0, 2.05], [len, 2.15]]))}>
      <rect x={-600} y={-700} width={2000} height={900} fill="#2B2438" />
      <g filter="url(#blur6)">
        <Stairwell t={t + 240} id="sw7" />
      </g>
      <Hero look={MO} pose={{ ...mo, ...faceAt(t, [[0, 'happy']]) }} rimId="rimL" shadow={0} />
      <FocusRings x={MO_HEAD.x} y={MO_HEAD.y} t={t - 2} r0={62} color={CYAN} />
      <Thought x={MO_HEAD.x + 20} y={MO_HEAD.y - 182} t={t - 7} s={0.98} hx={MO_HEAD.x + 16} hy={MO_HEAD.y - 70}>
        {/* Pip, as Mo sees him, crossed out */}
        <g transform="translate(0 4)">
          <circle r={45} fill={PIP.jacket} stroke={PIP.line} strokeWidth={4} />
          <circle cx={0} cy={3} r={35} fill={C.skin} />
          <circle cx={-12} cy={0} r={4.5} fill={C.ink} />
          <circle cx={12} cy={0} r={4.5} fill={C.ink} />
          <path d="M -9 16 Q 0 21 9 16" stroke={C.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          {t - 10 > 0 ? (
            <g stroke="#E23A44" strokeWidth={14} strokeLinecap="round" transform={`scale(${backOut(clamp((t - 10) / 4))})`}>
              <path d="M -46 -40 L 46 40" />
              <path d="M 46 -40 L -46 40" />
            </g>
          ) : null}
        </g>
      </Thought>
    </g>
  );
};

// ---------- S8: extreme close-up, Pip: oh no. Mo soft behind him, still waving ----------
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 2.8 * (1 + 0.05 * clamp(t / len));
  const jolt = t < 6 ? Math.sin(t * 2.4) * 7 * (1 - t / 6) : 0;
  const head = { x: 985 + jolt, y: 600 };
  const pose: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: -0.3, look: kf(t, [[0, -0.8], [12, -0.8], [16, 0.2]]), headTilt: kf(t, [[0, 0], [10, -6]]), armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, ...faceAt(t, [[0, 'shock'], [14, 'oops']]), glint: clamp(1 - t / 10), glintColor: CYAN };
  const wave = Math.sin(t / 2.6) * 16;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#2B2438" />
      <g filter="url(#blur16)">
        <g transform="translate(280 150) scale(1.75)">
          <Stairwell t={t + 266} id="sw8" />
          <Hero look={MO} pose={{ ...moPose({ yaw: 0.3, look: 0.8, armR: { a: 112 + wave, b: 42 } }), expr: 'happy' }} rimId="rimL" shadow={0} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.3} />
      <Hero look={PIP} pose={pose} rimId="rimL" shadow={0} />
    </g>
  );
};

// ---------- S9: the title, wide on the roof at dusk: thoughts rise from the whole city ----------
const ROOF_FEET = 840;
const CITY = Array.from({ length: 16 }).map((_, i) => ({
  x: 676 + rnd(7, i) * 568,
  y0: 800 - rnd(8, i) * 150,
  s: 0.26 + rnd(9, i) * 0.26,
  at: 8 + i * 3.4,
  v: 1.1 + rnd(10, i) * 1.3,
}));
const TitleTR: React.FC<{ t: number }> = ({ t }) => {
  const pop = (d: number) => backOut(clamp((t - d) / 9));
  const pulse = t >= 38 && t < 50 ? 1 + 0.06 * Math.sin(((t - 38) / 12) * Math.PI) : 1;
  const big = { textAnchor: 'middle' as const, fontFamily: FONT.title, fontWeight: 700, stroke: INK, strokeWidth: 10, paintOrder: 'stroke' as const };
  return (
    <g>
      <g transform={`translate(960 222) scale(${pop(2)})`}>
        <text textAnchor="middle" fontFamily={FONT.title} fontWeight={600} fontSize={42} letterSpacing={5} fill={CREAM} stroke={INK} strokeWidth={8} paintOrder="stroke">YA HERKESİN</text>
      </g>
      <g transform={`translate(960 290) scale(${pop(5)})`}>
        <text {...big} fontSize={58} fill={C.orange} style={{ filter: 'drop-shadow(0 0 18px rgba(255,138,61,0.55))' }}>DÜŞÜNCELERİNİ</text>
      </g>
      <g transform={`translate(960 354) scale(${pop(8) * pulse})`}>
        <text {...big} fontSize={58} fill="#FFE27A" style={{ filter: 'drop-shadow(0 0 18px rgba(255,200,90,0.55))' }}>DUYABİLSEYDİN?</text>
      </g>
    </g>
  );
};
export const S9: React.FC<ShotProps> = (p) => (
  <g>
    <S9World {...p} />
    <TitleTR t={p.t} />
  </g>
);
const S9World: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: ROOF_FEET - LEG_LEN * 0.62, scale: 0.62, yaw: 0.3, look: 0.8, armL: { a: 20, b: 6 }, armR: { a: 20, b: 6 } } },
    { f: 20, p: { yaw: 0.3, look: 0.8 } },
    { f: 26, p: { yaw: -0.35, look: -0.8, headTilt: -5 }, ease: easeOut },
    { f: 44, p: { yaw: -0.35, look: -0.8, headTilt: -5 } },
    { f: 50, p: { yaw: 0.1, look: 0, headTilt: 6, armL: { a: 34, b: 30 }, armR: { a: 34, b: 30 } }, ease: easeOut },
  ]);
  return (
    <g transform={camT(960, kf(t, [[0, 525], [len, 548]]), kf(t, [[0, 1.0], [len, 1.06]]))}>
      <Rooftop t={t} sunX={960} sunY={690 - 40 * easeOut(clamp(t / 40))} cityLit={2} />
      {CITY.map((b, i) => (
        <Thought key={i} x={b.x + Math.sin((t + i * 7) / 9) * 6} y={b.y0 - Math.max(0, t - b.at) * b.v} t={t - b.at} s={b.s} glow={false} o={0.92}>
          <Glyph i={i} />
        </Thought>
      ))}
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral'], [24, 'worried']]) }} rimId="rimR" shadow={0.6} />
    </g>
  );
};

// ---------- S10: the schematic: one head, a day of thoughts, the counter runs to 6.200 ----------
const tr = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const RING = Array.from({ length: 18 }).map((_, i) => {
  const a = (i / 18) * Math.PI * 2 + rnd(3, i) * 0.3;
  const r = 205 + rnd(4, i) * 70;
  return { x: 960 + Math.cos(a) * r * 0.86, y: 700 + Math.sin(a) * r * 0.8, s: 0.34 + rnd(5, i) * 0.2, at: 8 + ((i * 7) % 18) * 3 };
});
const HeadIcon: React.FC<{ x: number; y: number; r: number; t: number; w?: number }> = ({ x, y, r, t, w = 6 }) => (
  <g>
    <DrawOn d={`M ${x - r} ${y} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`} t={t} dur={8} width={w} />
    {t > 6 ? (
      <g fill={SCH.line}>
        <circle cx={x - r * 0.32} cy={y - r * 0.05} r={r * 0.09} />
        <circle cx={x + r * 0.32} cy={y - r * 0.05} r={r * 0.09} />
        <rect x={x - r * 0.2} y={y + r * 0.34} width={r * 0.4} height={w * 0.9} rx={w * 0.4} />
      </g>
    ) : null}
  </g>
);
export const S10: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(960, kf(t, [[0, 548], [len, 540]]), kf(t, [[0, 1.0], [len, 1.05]]))}>
    <Schematic t={t} id="sch10" />
    <SchLabel x={960} y={218} t={t + 4} text="1 İNSAN · 1 GÜN" size={30} color={SCH.dim} />
    <CountUp x={960} y={352} t={t - 3} to={6200} dur={58} size={132} format={tr} />
    <SchLabel x={960} y={416} t={t + 2} text="DÜŞÜNCE" size={38} />
    <HeadIcon x={960} y={700} r={86} t={t + 5} />
    {RING.map((b, i) => (
      <g key={i}>
        {t > b.at - 3 ? <line x1={960 + (b.x - 960) * 0.45} y1={700 + (b.y - 700) * 0.45} x2={960 + (b.x - 960) * 0.72} y2={700 + (b.y - 700) * 0.72} stroke={SCH.dim} strokeWidth={3} strokeDasharray="4 8" opacity={0.7} /> : null}
        <Thought x={b.x} y={b.y} t={t - b.at} s={b.s} glow={false}>
          <Glyph i={i + 1} />
        </Thought>
      </g>
    ))}
  </g>
);

// ---------- S11: schematic insert: that's real. A tick draws on over the source ----------
export const S11: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(960, 540, kf(t, [[0, 1.08], [len, 1.0]], easeOut))}>
    <Schematic t={t + 77} id="sch11" />
    {Array.from({ length: 12 }).map((_, i) => {
      const x = 746 + (i % 4) * 143;
      const y = 660 + Math.floor(i / 4) * 128;
      return (
        <g key={i} opacity={0.5}>
          <HeadIcon x={x} y={y + 24} r={28} t={30} w={3.5} />
          <Thought x={x + 26} y={y - 30 - Math.sin((t + i * 5) / 5) * 3} t={t + 10 - (i % 5)} s={0.2} glow={false} />
        </g>
      );
    })}
    <circle cx={960} cy={330} r={kf(t, [[0, 50], [7, 104]], easeOut)} fill="none" stroke="#5BD67C" strokeWidth={9} opacity={0.9} />
    <DrawOnTick x={956} y={334} t={t - 3} s={2.3} color="#5BD67C" />
    <SchLabel x={960} y={508} t={t - 5} text="NATURE COMMUNICATIONS" size={32} />
    <SchLabel x={960} y={556} t={t - 8} text="TSENG & POPPENK · 2020" size={26} color={SCH.dim} />
  </g>
);

// ---------- S12: back in class: every head in the room, all at once, and no way to turn it off ----------
const FLOOD = Array.from({ length: 46 }).map((_, i) => {
  const late = i >= 30;
  let x = 900 + rnd(11, i) * 700;
  let y = 150 + rnd(12, i) * 860;
  // early thoughts keep clear of Pip's face; the late ones bury it
  if (!late && Math.abs(x - 1262) < 150 && Math.abs(y - 575) < 150) x += x < 1262 ? -170 : 170;
  if (late) {
    x = 1262 + (rnd(13, i) - 0.5) * 420;
    y = 560 + (rnd(14, i) - 0.5) * 560;
  }
  return { x, y, s: late ? 1.1 + rnd(15, i) * 0.9 : 0.42 + rnd(15, i) * 0.6, at: late ? 30 + (i - 30) * 1.0 : 3 + Math.pow(i / 30, 0.75) * 28 };
});
const BLACK_AT = 48;
export const S12: React.FC<ShotProps> = ({ t, len }) => {
  const shiver = Math.sin(t * 1.9) * clamp(t / 30) * 3;
  const pose = poseAt(t, [
    { f: 0, p: { x: DESK_X + shiver, y: 760, yaw: 0, look: -0.8, headTilt: -4, armL: { a: 22, b: -12 }, armR: { a: 22, b: -12 } } },
    { f: 8, p: { look: 0.8, headTilt: 5 }, ease: easeOut },
    { f: 16, p: { look: -0.8, headTilt: -6 }, ease: easeOut },
    { f: 24, p: { look: 0.6, headTilt: 4 }, ease: easeOut },
    { f: 32, p: { look: 0, headTilt: 0, squash: 0.05 }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'worried'], [14, 'oops'], [30, 'dizzy']]);
  const red = clamp(t / 30);
  if (t >= BLACK_AT) return <rect x={0} y={0} width={1920} height={1080} fill="#000" />;
  return (
    <g transform={camT(kf(t, [[0, 1240], [len, 1260]]), kf(t, [[0, 590], [len, 572]]), kf(t, [[0, 1.2], [len, 1.6]]))}>
      <Classroom t={t + 300} id="c12" />
      <rect x={-400} y={-400} width={2720} height={1880} fill="#3A0A14" opacity={0.42 * red} style={{ mixBlendMode: 'multiply' }} />
      <Glow x={1262} y={560} r={520} kind="red" o={0.5 * red} />
      <Hero look={PIP} pose={{ ...pose, ...face, glint: 1, glintColor: CYAN }} rimId="rimRed" shadow={0} />
      <SchoolDesk x={DESK_X} />
      {FLOOD.map((b, i) => (
        <Thought key={i} x={b.x + Math.sin((t + i * 5) / 4) * 3} y={b.y + Math.cos((t + i * 3) / 5) * 3} t={t - b.at} s={b.s} glow={false}>
          <Glyph i={i} />
        </Thought>
      ))}
    </g>
  );
};
