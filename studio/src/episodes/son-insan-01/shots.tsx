import React from 'react';
import {
  Hero, Pose, basePose, faceAt, kf, clamp, easeOut, backOut, camT, LOOKS, LEG_LEN, FONT, C,
  Bedroom, Kitchen, KitchenIsland, islandTop, Rooftop, Schematic, SCH, DrawOn, SchLabel,
  Street, Car, Exhaust, sp, STREET_GROUND, PovHand, Eyelids, Mug, Glow, ShotProps,
} from '../../engine';

// SON İNSAN, bölüm 1. First person: the camera is your eyes. Vertical 9:16 (the engine crops the 1920 x 1080 world
// to its centre column, x 656..1264), so every shot composes inside that column.

const PIP = LOOKS.pipHood;
const INK = '#1A1230';
const CREAM = '#F6EFE3';
/** A walking camera: the sway and bob of your own steps. */
export const bob = (t: number, amp = 1) => ({ x: Math.sin(t / 6) * 6 * amp, y: Math.abs(Math.sin(t / 6)) * 10 * amp });

// ---------- the street with its abandoned cars, shared by the window, the doorway and the walk ----------
export const CAR1 = sp(860, STREET_GROUND, 1.55);
const CAR2 = sp(1085, STREET_GROUND, 2.3);
const CAR3 = sp(925, STREET_GROUND, 3.6);
const CAR4 = sp(1015, STREET_GROUND, 5.6);
export const C1S = 0.85;
export const StreetScene: React.FC<{ t: number; id: string; door?: number }> = ({ t, id, door = 1 }) => (
  <g>
    <Street t={t} id={id} />
    <Car x={CAR4.x} y={CAR4.y} s={0.23} color="#5A6A8A" lights={1} run={1} f={t + 9} />
    <Car x={CAR3.x} y={CAR3.y} s={0.36} color="#C9A24A" door={1} lights={1} run={1} f={t + 5} flip />
    <Exhaust x={CAR3.x + 56} y={CAR3.y - 10} t={t + 11} s={0.36} dir={1} />
    <Car x={CAR2.x} y={CAR2.y} s={0.56} color="#4A7A6A" door={1} lights={1} run={1} f={t + 3} flip />
    <Exhaust x={CAR2.x + 88} y={CAR2.y - 15} t={t + 4} s={0.56} dir={1} />
    <Car x={CAR1.x} y={CAR1.y} s={C1S} color="#8A4A52" door={door} lights={1} run={1} f={t} />
    <Exhaust x={CAR1.x - 158 * C1S} y={CAR1.y - 26 * C1S} t={t} s={C1S} />
  </g>
);

// ---------- A1: your eyes open on the bedroom ----------
export const A1: React.FC<ShotProps> = ({ t, len }) => {
  const open = kf(t, [[0, 0], [16, 0], [24, 0.3], [30, 0.3], [34, 0.05], [40, 0.05], [52, 1]]);
  return (
    <g>
      <g transform={`translate(960 540) rotate(${kf(t, [[0, -10], [48, -10], [len, 0]])}) translate(-960 -540)`}>
        <g transform={camT(1000, kf(t, [[0, 500], [len, 545]]), kf(t, [[0, 1.3], [len, 1.14]]))}>
          <Bedroom t={t} id="b1" clock="06:02" />
        </g>
      </g>
      <Eyelids open={open} />
    </g>
  );
};

// ---------- A2: at the window: the street, and not a soul on it ----------
export const A2: React.FC<ShotProps> = ({ t, len }) => {
  const push = kf(t, [[0, 1], [len, 1.1]]);
  return (
    <g transform={`translate(960 500) scale(${push}) translate(-960 -500)`}>
      <defs>
        <clipPath id="a2win">
          <rect x={706} y={150} width={508} height={670} />
        </clipPath>
      </defs>
      <rect x={-200} y={-300} width={2320} height={1700} fill="#1B1626" />
      <g clipPath="url(#a2win)">
        <g transform="translate(960 470) scale(0.92) translate(-960 -520)">
          <StreetScene t={t} id="s2" />
        </g>
        {/* the glass: a faint sheen */}
        <polygon points="706,150 900,150 760,820 706,820" fill="#FFFFFF" opacity={0.04} />
      </g>
      {/* the frame, a mullion and a transom, the sill */}
      <rect x={696} y={140} width={528} height={690} fill="none" stroke="#3A2826" strokeWidth={22} />
      <rect x={952} y={150} width={16} height={670} fill="#3A2826" />
      <rect x={706} y={380} width={508} height={14} fill="#3A2826" />
      <rect x={696} y={140} width={528} height={4} fill="#FFB46A" opacity={0.35} />
      <rect x={670} y={826} width={580} height={30} rx={6} fill="#4A3430" />
      <rect x={670} y={826} width={580} height={4} fill="#FFB46A" opacity={0.5} />
      {/* curtains either side, barely moving */}
      <path d={`M 640 110 L 760 110 Q ${742 + Math.sin(t / 14) * 6} 480 ${724 + Math.sin(t / 11) * 8} 900 L 640 900 Z`} fill="#5A3440" />
      <path d={`M 1280 110 L 1160 110 Q ${1178 + Math.sin(t / 13) * 6} 480 ${1196 + Math.sin(t / 10) * 8} 900 L 1280 900 Z`} fill="#4E2C38" />
      <rect x={620} y={96} width={680} height={16} rx={8} fill="#15111C" />
      <Glow x={960} y={480} r={520} o={0.22} />
      <PovHand x={kf(t, [[0, 1130], [14, 1090]], easeOut)} y={kf(t, [[0, 960], [14, 842]], easeOut)} fx={1210} fy={1180} s={0.95} />
    </g>
  );
};

// ---------- A3: the hall mirror on the way past: this is you ----------
export const A3: React.FC<ShotProps> = ({ t, len }) => {
  const pose: Pose = { ...basePose, x: 960, y: 800, scale: 1.5, yaw: 0, look: 0, headTilt: kf(t, [[0, 3], [10, 0]]), armL: { a: 12, b: -6 }, armR: { a: 12, b: -6 }, ...faceAt(t, [[0, 'neutral'], [10, 'worried']]) };
  return (
    <g transform={`translate(${kf(t, [[0, -40], [len, 30]])} ${Math.abs(Math.sin(t / 6)) * 6}) translate(960 540) scale(${kf(t, [[0, 1.02], [len, 1.08]])}) translate(-960 -540)`}>
      <defs>
        <clipPath id="a3mir">
          <rect x={738} y={190} width={444} height={700} rx={44} />
        </clipPath>
      </defs>
      <rect x={-200} y={-300} width={2320} height={1700} fill="#2E2639" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={560 + i * 110} y={-300} width={3} height={1700} fill="#261F30" />
      ))}
      <rect x={-200} y={930} width={2320} height={500} fill="#211A28" />
      <rect x={-200} y={924} width={2320} height={10} fill="#3A2826" />
      <g clipPath="url(#a3mir)">
        <rect x={700} y={150} width={520} height={780} fill="#3B3550" />
        <rect x={1040} y={260} width={170} height={680} fill="#2A2438" />
        <rect x={1052} y={276} width={146} height={660} fill="#4A3A34" />
        <circle cx={1070} cy={610} r={8} fill="#E9C46A" />
        <Glow x={860} y={300} r={420} o={0.4} />
        <Hero look={PIP} pose={pose} rimId="rimL" shadow={0} />
        <polygon points="738,190 880,190 800,890 738,890" fill="#FFFFFF" opacity={0.06} />
        <polygon points="930,190 990,190 910,890 850,890" fill="#FFFFFF" opacity={0.04} />
      </g>
      <rect x={738} y={190} width={444} height={700} rx={44} fill="none" stroke="#6B4B42" strokeWidth={20} />
      <rect x={738} y={190} width={444} height={700} rx={44} fill="none" stroke="#FFB46A" strokeWidth={3} opacity={0.4} />
      <Glow x={960} y={120} r={380} o={0.3} />
    </g>
  );
};

// ---------- A4: the kitchen. Nobody ----------
export const MUG = islandTop(0.5, 0.5);
export const KitchenPov: React.FC<{ t: number; id: string }> = ({ t, id }) => (
  <g>
    <Kitchen t={t} id={id} veil={0.44} />
    <KitchenIsland />
    <Mug x={MUG.x} y={MUG.y} rot={0} steam={1} f={t} />
  </g>
);
export const A4: React.FC<ShotProps> = ({ t, len }) => {
  const b = bob(t);
  return (
    <g transform={camT(960 + b.x, 565 + b.y, kf(t, [[0, 0.98], [len, 1.14]]))}>
      <KitchenPov t={t + 40} id="k4" />
    </g>
  );
};

// ---------- A5: her coffee, on the island ----------
export const A5: React.FC<ShotProps> = ({ t, len }) => {
  const b = bob(t, 0.5);
  return (
    <g transform={camT(MUG.x + b.x, MUG.y - 70 + b.y, kf(t, [[0, 1.9], [len, 2.5]]))}>
      <KitchenPov t={t + 90} id="k5" />
    </g>
  );
};

// ---------- A6: your hand on the mug. Still hot ----------
export const A6: React.FC<ShotProps> = ({ t, len }) => {
  const hx = kf(t, [[0, MUG.x + 120], [16, MUG.x + 46], [22, MUG.x + 31], [27, MUG.x + 31], [32, MUG.x + 58], [len, MUG.x + 54]], easeOut);
  const hy = kf(t, [[0, MUG.y + 130], [16, MUG.y - 14], [22, MUG.y - 26], [27, MUG.y - 26], [32, MUG.y - 6], [len, MUG.y - 8]], easeOut);
  return (
    <g transform={camT(MUG.x + 14, MUG.y - 46, kf(t, [[0, 3.3], [len, 3.7]]))}>
      <g filter="url(#blur3)">
        <Kitchen t={t + 140} id="k6" veil={0.44} />
      </g>
      <KitchenIsland />
      <Mug x={MUG.x} y={MUG.y} rot={t >= 22 && t < 30 ? Math.sin(t * 2) * 1.5 : 0} steam={1} f={t} />
      <Glow x={MUG.x} y={MUG.y - 40} r={120} o={0.25} />
      <PovHand x={hx} y={hy} fx={MUG.x + 150} fy={MUG.y + 230} s={0.33} />
    </g>
  );
};

// ---------- A7: the front door opens on the street ----------
export const A7: React.FC<ShotProps> = ({ t, len }) => {
  const open = kf(t, [[0, 0], [6, 0.04], [30, 1]], easeOut);
  const w = 560 * (1 - open * 0.88);
  const b = bob(t, clamp((t - 26) / 10));
  return (
    <g>
      <g transform={camT(960 + b.x, 550 + b.y, kf(t, [[0, 1], [len, 1.1]]))}>
        <StreetScene t={t} id="s7" />
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#FFE2B0" opacity={0.25 * (1 - open) + 0.12 * open * clamp(1 - (t - 30) / 12)} />
      {/* the door, hinged on the left, swinging away; the dark hall either side of the doorway */}
      <polygon points={`688,-40 ${688 + w},${-40 - 70 * open} ${688 + w},${1120 + 70 * open} 688,1120`} fill="#3A2826" />
      <polygon points={`${688 + w * 0.14},90 ${688 + w * 0.86},${90 - 40 * open} ${688 + w * 0.86},${480 + 6 * open} ${688 + w * 0.14},480`} fill="#2E201F" />
      <polygon points={`${688 + w * 0.14},560 ${688 + w * 0.86},${560 + 8 * open} ${688 + w * 0.86},${1010 + 44 * open} ${688 + w * 0.14},1010`} fill="#2E201F" />
      <circle cx={688 + w * 0.88} cy={540} r={16 * (1 - open * 0.5)} fill="#E9C46A" />
      <rect x={688 + w - 5} y={-120} width={5} height={1320} fill="#FFB46A" opacity={0.6 * open} />
      <rect x={0} y={-100} width={690} height={1300} fill="#120E18" />
      <rect x={1232} y={-100} width={700} height={1300} fill="#120E18" />
      <rect x={1226} y={-100} width={8} height={1300} fill="#FFB46A" opacity={0.35 * open} />
      {t < 30 ? <PovHand x={688 + w * 0.7} y={kf(t, [[0, 640], [8, 580], [30, 700]])} fx={1040} fy={1220} s={0.95} rimId="rimL" /> : null}
    </g>
  );
};

// ---------- A8: the cars, stopped where they were, in the middle of the road ----------
export const A8: React.FC<ShotProps> = ({ t, len }) => {
  const b = bob(t);
  return (
    <g transform={camT(kf(t, [[0, 960], [len, 935]]) + b.x, kf(t, [[0, 560], [len, 640]]) + b.y, kf(t, [[0, 1.02], [len, 1.42]]))}>
      <StreetScene t={t + 45} id="s8" />
    </g>
  );
};

// ---------- A9: every door open, every cabin light on, every seat empty ----------
export const A9: React.FC<ShotProps> = ({ t, len }) => {
  const b = bob(t, 0.4);
  return (
    <g transform={camT(CAR1.x + 34 + b.x, CAR1.y - 62 + b.y, kf(t, [[0, 2.5], [len, 2.9]]))}>
      <StreetScene t={t + 130} id="s9" door={0.88 + 0.12 * Math.sin(t / 7)} />
      {/* the door-ajar light, blinking on the dash */}
      <circle cx={CAR1.x + 46 * C1S} cy={CAR1.y - 74 * C1S} r={3.2} fill="#FF8A3D" opacity={Math.floor(t / 8) % 2 ? 1 : 0.2} />
    </g>
  );
};

// ---------- A10: engines still running ----------
export const A10: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(CAR1.x - 128 * C1S + Math.sin(t * 2.3) * 0.5, CAR1.y - 44 * C1S, kf(t, [[0, 3.6], [len, 4.2]]))}>
    <StreetScene t={t + 180} id="s10" />
  </g>
);

// ---------- A11: eight billion people ----------
const dots = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const GRID = Array.from({ length: 48 }).map((_, i) => ({ x: 733 + (i % 6) * 91, y: 520 + Math.floor(i / 6) * 62, i }));
const ME = 27;
const Person: React.FC<{ x: number; y: number; on: number; me?: boolean; t?: number }> = ({ x, y, on, me = false, t = 0 }) => {
  const c = me ? SCH.live : SCH.line;
  return (
    <g opacity={me ? 1 : 0.14 + 0.86 * on} style={me && on < 1 ? { filter: `drop-shadow(0 0 ${10 + 6 * Math.sin(t / 4)}px ${SCH.glow})` } : undefined}>
      <circle cx={x} cy={y - 14} r={11} fill="none" stroke={c} strokeWidth={4} />
      <path d={`M ${x - 16} ${y + 24} Q ${x - 16} ${y + 2} ${x} ${y + 2} Q ${x + 16} ${y + 2} ${x + 16} ${y + 24}`} fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};
const Counter: React.FC<{ v: number; t: number; color?: string }> = ({ v, t, color = SCH.live }) => (
  <text x={960} y={352} textAnchor="middle" fontFamily={FONT.ui} fontSize={66} fill={color} style={{ filter: `drop-shadow(0 0 14px ${SCH.glow}66)` }} opacity={clamp(t / 3)}>
    {dots(v)}
  </text>
);
export const A11: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(960, 545, kf(t, [[0, 1.0], [len, 1.05]]))}>
    <Schematic t={t} id="sch11" />
    <SchLabel x={960} y={250} t={t + 4} text="DÜNYA NÜFUSU" size={30} color={SCH.dim} />
    <Counter v={8_000_000_000 * easeOut(clamp((t - 2) / 34))} t={t} />
    <SchLabel x={960} y={410} t={t + 2} text="İNSAN" size={36} />
    {GRID.map((g) => (
      <Person key={g.i} x={g.x} y={g.y} on={clamp((t - 2 - ((g.i * 7) % 48) * 0.6) / 4)} />
    ))}
  </g>
);

// ---------- A12: none of them. Except one ----------
export const A12: React.FC<ShotProps> = ({ t, len }) => {
  const k = clamp((t - 4) / 26);
  const v = 1 + (8_000_000_000 - 1) * Math.pow(1 - k, 3);
  return (
    <g transform={camT(960, kf(t, [[0, 545], [30, 545], [len, 600]]), kf(t, [[0, 1.05], [30, 1.05], [len, 1.5]]))}>
      <Schematic t={t + 74} id="sch12" />
      <SchLabel x={960} y={250} t={30} text="DÜNYA NÜFUSU" size={30} color={SCH.dim} />
      <Counter v={v} t={30} color={k >= 1 ? '#FF5A4A' : SCH.live} />
      <SchLabel x={960} y={410} t={30} text="İNSAN" size={36} />
      {GRID.map((g) => {
        const d = Math.hypot((g.i % 6) - (ME % 6), Math.floor(g.i / 6) - Math.floor(ME / 6));
        return <Person key={g.i} x={g.x} y={g.y} me={g.i === ME} t={t} on={g.i === ME ? 0 : 1 - clamp((t - 4 - (5.6 - d) * 4.2) / 4)} />;
      })}
    </g>
  );
};

// ---------- A13: the title, from the roof: the city's lights going out with nobody left to need them ----------
const TitleCard3: React.FC<{ t: number }> = ({ t }) => {
  const pop = (d: number) => backOut(clamp((t - d) / 9));
  const big = { textAnchor: 'middle' as const, fontFamily: FONT.title, fontWeight: 700, stroke: INK, paintOrder: 'stroke' as const };
  return (
    <g>
      <g transform={`translate(960 232) scale(${pop(3)})`}>
        <text textAnchor="middle" fontFamily={FONT.title} fontWeight={600} fontSize={40} letterSpacing={5} fill={CREAM} stroke={INK} strokeWidth={8} paintOrder="stroke">YA DÜNYADA KALAN</text>
      </g>
      <g transform={`translate(960 330) scale(${pop(18)})`}>
        <text {...big} strokeWidth={13} fontSize={98} fill={C.orange} style={{ filter: 'drop-shadow(0 0 22px rgba(255,138,61,0.55))' }}>SON İNSAN</text>
      </g>
      <g transform={`translate(960 404) scale(${pop(52)})`}>
        <text {...big} strokeWidth={10} fontSize={60} fill="#FFE27A" style={{ filter: 'drop-shadow(0 0 18px rgba(255,200,90,0.5))' }}>SEN OLSAYDIN?</text>
      </g>
    </g>
  );
};
export const A13: React.FC<ShotProps> = ({ t, len }) => (
  <g>
    <g transform={camT(960, kf(t, [[0, 520], [len, 556]]), kf(t, [[0, 1.0], [len, 1.1]]))}>
      <Rooftop t={t} sunX={960} sunY={660} cityLit={2.6} blackout={kf(t, [[60, 0], [len - 6, 1]])} lightsOut={kf(t, [[84, 0], [len, 1]])} />
    </g>
    <TitleCard3 t={t} />
  </g>
);

// ---------- R1: the roof, no title: the city's lights going out with nobody left to need them ----------
export const R1: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(960, kf(t, [[0, 520], [len, 560]]), kf(t, [[0, 1.0], [len, 1.14]]))}>
    <Rooftop t={t} sunX={960} sunY={660} cityLit={2.6} blackout={kf(t, [[20, 0], [len - 6, 1]])} lightsOut={kf(t, [[50, 0], [len, 1]])} />
  </g>
);
