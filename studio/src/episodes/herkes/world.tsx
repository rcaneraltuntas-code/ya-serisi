import React from 'react';
import {
  Look, C, makeRoom, RoomShell, BackWindow, Pendant, pendantLight, Box, WallFrame, WallClock, FloorShadow, LightVeil, Glow, Dust, AlarmClock,
  clamp, lerp, rnd, FONT, stand, LEG_LEN,
} from '../../engine';

// HERKES İNGİLİZCE: the series' own world. A sunny flat in strong, flat colours (teal bedroom, blue hall,
// terracotta kitchen) where everything looks a little too neat; its own cast; and the series' one trick: written
// words around him flip, letter by letter, from Turkish to English.

// ---------- cast ----------
/** Ege: a mop of chestnut hair, a coral sweatshirt. */
export const EGE: Look = { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#E2613F', jacketShade: '#C24E30', accent: '#F6EFE3', limb: '#2B3350', line: '#161422', shoe: '#F1ECE2', face: C.ink, hair: '#5A3A2A', extra: 'mop' };
/** His mother: dark hair in a bun, a mustard top, never without the smile. */
export const ANNE: Look = { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#E0A63A', jacketShade: '#C08A28', accent: '#FFFFFF', limb: '#3B2F4A', line: '#161422', shoe: '#7A4A5A', face: C.ink, hair: '#2B1E22', extra: 'bun' };

// ---------- the flipping words ----------
/**
 * A word on a row of little flap cards (a departure board): from `at` each card turns over in turn and shows the
 * other word's letter. x, y: the centre. size: the letter height.
 */
export const FlipWord: React.FC<{ x: number; y: number; from: string; to: string; t: number; at: number; size?: number; card?: string; ink?: string; every?: number }> = ({
  x, y, from, to, t, at, size = 40, card = '#1D2230', ink = '#F6EFE3', every = 2.2,
}) => {
  const n = Math.max(from.length, to.length);
  const pad = (s: string) => {
    const k = n - s.length;
    return ' '.repeat(Math.floor(k / 2)) + s + ' '.repeat(Math.ceil(k / 2));
  };
  const A = pad(from);
  const B = pad(to);
  const cw = size * 0.78;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const p = clamp((t - at - i * every) / 7);
        const ch = p < 0.5 ? A[i] : B[i];
        const sy = Math.max(0.06, Math.abs(Math.cos(Math.PI * p)));
        const cx = x + (i - (n - 1) / 2) * cw;
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(1 ${sy})`}>
            <rect x={-cw / 2 + 2} y={-size * 0.68} width={cw - 4} height={size * 1.36} rx={size * 0.12} fill={card} />
            <rect x={-cw / 2 + 2} y={-1} width={cw - 4} height={2} fill="#000" opacity={0.45} />
            <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={size} fill={p > 0.5 && p < 1 ? '#FFE08A' : ink}>{ch}</text>
          </g>
        );
      })}
    </g>
  );
};

// ---------- the bedroom ----------
export const BED = makeRoom({ x: 960, y: 500 }, { x0: 500, x1: 1420, y0: 330, y1: 745 }, 3.4);
/** Where he sits up in bed (hip point and scale). */
export const BED_SIT = (() => {
  const p = BED.P(0.3, 0.8, 0.3);
  return { x: p.x, y: p.y, scale: (0.62 * 415 * BED.s(0.3)) / 378 };
})();
export const CLOCK_AT = BED.P(0.615, 0.8, 0.07);

/** The room behind him: draw this, then him, then <BedFront/> over his legs. */
export const Bedroom: React.FC<{ t: number; id?: string }> = ({ t, id = 'hbr' }) => {
  const R = BED;
  const pil = R.P(0.18, 0.8, 0.1);
  return (
    <g>
      <RoomShell r={R} id={id} floor="boards" wall="#4F8F8C" side="#3F7775" floorC="#B5875C" ceiling="#2F5957" lines="#8A6242" />
      <BackWindow r={R} id={`${id}w`} t={t} x0={1010} x1={1330} y0={372} y1={596} sun={{ x: 1180, y: 520 }} cols={2} curtains />
      <WallFrame x={610} y={400} w={110} h={140} art={1} />
      <WallFrame x={760} y={380} w={150} h={104} art={2} />
      <rect x={640} y={590} width={250} height={12} rx={4} fill="#2F5957" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={656 + i * 30} y={590 - 54 - rnd(4, i) * 26} width={22} height={54 + rnd(4, i) * 26} fill={['#E2613F', '#F6EFE3', '#E0A63A', '#2B3350', '#C9D6E8'][i]} />)}
      {/* the bed along the back wall, and the nightstand */}
      <FloorShadow r={R} u={[0.05, 0.52]} w={[0.02, 0.58]} />
      <Box r={R} u={[0.05, 0.5]} v={[0.56, 0.8]} w={[0, 0.03]} front="#8A5E44" top="#A8765A" side="#6E4A36" />
      <Box r={R} u={[0.05, 0.5]} v={[0.8, 1]} w={[0, 0.55]} front="#DCE4F0" top="#EEF2F8" side="#B9C6DA" />
      <ellipse cx={pil.x} cy={pil.y - 12} rx={92} ry={30} fill="#FFFFFF" stroke="#B9C6DA" strokeWidth={4} />
      <Box r={R} u={[0.55, 0.68]} v={[0.8, 1]} w={[0, 0.14]} front="#8A5E44" top="#A8765A" side="#6E4A36" rim />
      {/* a rug */}
      <polygon points={R.Q([[0.56, 1, 0.3], [0.94, 1, 0.3], [0.98, 1, 0.72], [0.52, 1, 0.72]])} fill="#E0A63A" opacity={0.85} />
      <polygon points={R.Q([[0.6, 1, 0.36], [0.9, 1, 0.36], [0.93, 1, 0.66], [0.57, 1, 0.66]])} fill="none" stroke="#F6EFE3" strokeWidth={5} opacity={0.8} />
      <LightVeil id={`${id}v`} lights={[[1170, 500, 520], [820, 620, 380]]} o={0.2} />
      <polygon points="1010,372 1330,372 1120,1080 620,1080" fill="#FFE2B0" opacity={0.1} style={{ mixBlendMode: 'screen' }} />
      <Dust t={t} seed={5} x0={760} y0={380} w={520} h={420} n={26} o={0.5} />
    </g>
  );
};
/** The duvet and the bed's near side, over his legs. lump: 0..1 someone still under it. */
export const BedFront: React.FC<{ lump?: number }> = ({ lump = 0 }) => {
  const R = BED;
  const a = R.P(0.3, 0.775, 0.3);
  return (
    <g>
      {lump > 0 ? <ellipse cx={a.x} cy={a.y - 6} rx={120} ry={22 + 40 * lump} fill="#E2725B" stroke="#161422" strokeWidth={4} /> : null}
      <Box r={R} u={[0.05, 0.5]} v={[0.772, 1]} w={[0.3, 0.55]} front="#C9573F" top="#E2725B" side="#A84832" />
      <polygon points={R.Q([[0.05, 0.772, 0.3], [0.5, 0.772, 0.3], [0.5, 0.772, 0.36], [0.05, 0.772, 0.36]])} fill="#F6EFE3" />
    </g>
  );
};

// ---------- the hall (seen side-on) ----------
export const HALL = { floor: 800, door: { x0: 1250, x1: 1420 }, board: { x: 1030, y: 318 } };
/** A long hallway from the side: he walks left to right toward the kitchen door, where the light is. */
export const Hall: React.FC<{ t: number; children?: React.ReactNode; shadow?: number; board?: React.ReactNode }> = ({ t, children, shadow = 0, board }) => (
  <g>
    <rect x={-400} y={-200} width={2900} height={1010} fill="#5F74A6" />
    <rect x={-400} y={-200} width={2900} height={300} fill="#000" opacity={0.18} />
    {/* wainscot */}
    <rect x={-400} y={566} width={2900} height={240} fill="#E9DFCC" />
    <rect x={-400} y={556} width={2900} height={14} fill="#F6EFE3" />
    {Array.from({ length: 22 }).map((_, i) => <rect key={i} x={-380 + i * 130} y={592} width={96} height={170} rx={6} fill="none" stroke="#CFC2AA" strokeWidth={5} />)}
    {/* pictures: the family, always smiling */}
    <WallFrame x={300} y={300} w={120} h={150} art={0} />
    <WallFrame x={520} y={270} w={170} h={120} art={2} />
    <WallFrame x={760} y={310} w={110} h={140} art={1} />
    {/* the day board */}
    <rect x={HALL.board.x - 170} y={HALL.board.y - 62} width={340} height={124} rx={12} fill="#F6EFE3" stroke="#161422" strokeWidth={5} />
    <text x={HALL.board.x} y={HALL.board.y - 34} textAnchor="middle" fontFamily={FONT.ui} fontSize={18} fill="#8A7A6A" letterSpacing={4}>BUGÜN</text>
    {board}
    {/* a console with a plant and the keys */}
    <rect x={430} y={700} width={200} height={14} rx={4} fill="#8A5E44" />
    <rect x={446} y={714} width={10} height={86} fill="#6E4A36" /><rect x={604} y={714} width={10} height={86} fill="#6E4A36" />
    <rect x={500} y={650} width={46} height={50} rx={8} fill="#E2613F" />
    {[-1, 0, 1].map((k) => <ellipse key={k} cx={523 + k * 22} cy={626 - Math.abs(k) * -8} rx={14} ry={34} transform={`rotate(${k * 24 + Math.sin(t / 30 + k) * 2} ${523 + k * 6} 650)`} fill="#3E8C6A" />)}
    {/* the kitchen doorway: warm light, and what stands in it */}
    <rect x={HALL.door.x0 - 14} y={236} width={HALL.door.x1 - HALL.door.x0 + 28} height={570} fill="#F6EFE3" />
    <rect x={HALL.door.x0} y={250} width={HALL.door.x1 - HALL.door.x0} height={556} fill="#F4B36A" />
    <rect x={HALL.door.x0} y={250} width={HALL.door.x1 - HALL.door.x0} height={556} fill="#C9764F" opacity={0.45} />
    {/* floor */}
    <rect x={-400} y={HALL.floor} width={2900} height={400} fill="#B5875C" />
    {Array.from({ length: 26 }).map((_, i) => <rect key={i} x={-400 + i * 112} y={HALL.floor} width={3} height={400} fill="#8A6242" opacity={0.7} />)}
    <rect x={-400} y={HALL.floor} width={2900} height={10} fill="#F6EFE3" />
    <rect x={120} y={HALL.floor + 46} width={1380} height={96} rx={10} fill="#3F7775" />
    <rect x={140} y={HALL.floor + 58} width={1340} height={72} rx={6} fill="none" stroke="#E0A63A" strokeWidth={5} />
    {/* the light from the door across the floor, and her shadow in it */}
    <polygon points={`${HALL.door.x0},${HALL.floor} ${HALL.door.x1},${HALL.floor} ${HALL.door.x1 - 60},1200 ${HALL.door.x0 - 620},1200`} fill="#FFD39A" opacity={0.42} style={{ mixBlendMode: 'screen' }} />
    {shadow > 0 ? (
      <g opacity={0.5 * clamp(shadow * 2)} transform={`translate(${HALL.door.x0 + 90 - 330 * shadow} ${HALL.floor + 30}) skewX(-48) scale(${0.8 + 0.5 * shadow} 1)`}>
        <ellipse cx={0} cy={30} rx={46} ry={32} fill="#1A1230" />
        <circle cx={0} cy={-16} r={16} fill="#1A1230" />
        <path d="M -52 60 Q 0 30 52 60 L 70 230 L -70 230 Z" fill="#1A1230" />
      </g>
    ) : null}
    {children}
    <Glow x={(HALL.door.x0 + HALL.door.x1) / 2} y={520} r={520} o={0.5} />
    <rect x={-400} y={-200} width={2900} height={1500} fill="#0B1024" opacity={0.08} />
  </g>
);

// ---------- the kitchen ----------
export const KIT = makeRoom({ x: 960, y: 500 }, { x0: 500, x1: 1420, y0: 330, y1: 745 }, 3.4);
export const TABLE_V = 0.745;
/** A point on the dining table's top: u across the room, d 0 (far edge) to 1 (near edge). */
export const tableTop = (u: number, d: number) => KIT.P(u, TABLE_V, 0.42 + 0.26 * d);
export const kitSpot = (u: number, w: number) => {
  const q = stand(KIT, u, w);
  return { x: q.x, y: q.y, scale: q.scale, floor: q.y + LEG_LEN * q.scale };
};
export const NOTE_AT = { x: KIT.P(0.86, 0.5, 0.12).x, y: KIT.P(0.86, 0.5, 0.12).y };

/** The kitchen behind the people. fridgeNote: what is stuck to the fridge (a FlipWord, say). */
export const Kitchen2: React.FC<{ t: number; id?: string; fridgeNote?: React.ReactNode }> = ({ t, id = 'hkt', fridgeNote }) => {
  const R = KIT;
  return (
    <g>
      <RoomShell r={R} id={id} floor="tiles" wall="#C9764F" side="#A85F3F" floorC="#E3D2B4" ceiling="#6E3F2C" lines="#C2AE8C" />
      <BackWindow r={R} id={`${id}w`} t={t} x0={610} x1={900} y0={372} y1={580} sun={{ x: 760, y: 500 }} cols={2} curtains={false} />
      {/* a shelf of jars, a clock */}
      <rect x={960} y={452} width={270} height={12} rx={4} fill="#6E3F2C" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={976 + i * 50} y={452 - 40 - rnd(9, i) * 22} width={34} height={40 + rnd(9, i) * 22} rx={7} fill={['#F6EFE3', '#9FD3C1', '#E0A63A', '#F6EFE3', '#3F7775'][i]} stroke="#161422" strokeWidth={3} />)}
      <WallClock x={1090} y={380} r={30} t={t} />
      {/* the counter along the back wall, with a hob */}
      <Box r={R} u={[0, 0.74]} v={[0.72, 1]} w={[0, 0.11]} front="#F1E7D3" top="#8A5E44" side="#D9CBB0" rim />
      {[0.1, 0.26, 0.42, 0.58].map((u) => <rect key={u} x={R.P(u, 0.8, 0.11).x - 5} y={R.P(u, 0.8, 0.11).y} width={10} height={40} rx={5} fill="#C9764F" />)}
      {/* the fridge */}
      <Box r={R} u={[0.78, 0.97]} v={[0.26, 1]} w={[0, 0.13]} front="#9FD3C1" top="#7FB8A6" side="#7FB8A6" rim />
      <rect x={R.P(0.795, 0.6, 0.13).x} y={R.P(0.795, 0.4, 0.13).y} width={8} height={120} rx={4} fill="#F6EFE3" />
      {fridgeNote}
      <Pendant r={R} u={0.5} w={0.52} t={t} glow={0.4} />
      <LightVeil id={`${id}v`} lights={[[760, 480, 480], pendantLight(R, 0.5, 0.52)]} o={0.2} />
      <polygon points="610,372 900,372 1180,1080 520,1080" fill="#FFE2B0" opacity={0.1} style={{ mixBlendMode: 'screen' }} />
      <Dust t={t} seed={8} x0={600} y0={380} w={520} h={420} n={24} o={0.5} />
    </g>
  );
};
/** The dining table in the middle of the room (drawn over the people behind it), and the milk carton on it. */
export const Table: React.FC<{ label?: React.ReactNode; children?: React.ReactNode }> = ({ label, children }) => {
  const R = KIT;
  const c = tableTop(0.5, 0.62);
  return (
    <g>
      <FloorShadow r={R} u={[0.24, 0.8]} w={[0.4, 0.74]} />
      {[[0.28, 0.44], [0.72, 0.44], [0.28, 0.66], [0.72, 0.66]].map(([u, w], i) => <Box key={i} r={R} u={[u, u + 0.02]} v={[TABLE_V + 0.03, 1]} w={[w, w + 0.02]} front="#D9CBB0" side="#C2B294" />)}
      <Box r={R} u={[0.26, 0.76]} v={[TABLE_V, TABLE_V + 0.035]} w={[0.42, 0.68]} front="#E9DFCC" top="#FBF6EC" side="#D9CBB0" rim />
      {/* a milk carton */}
      <g transform={`translate(${c.x} ${c.y})`}>
        <ellipse cx={4} cy={0} rx={40} ry={8} fill="#000" opacity={0.2} />
        <rect x={-30} y={-104} width={60} height={104} fill="#F6EFE3" stroke="#161422" strokeWidth={4} />
        <polygon points="-30,-104 0,-134 30,-104" fill="#DCE4F0" stroke="#161422" strokeWidth={4} strokeLinejoin="round" />
        <rect x={-30} y={-52} width={60} height={30} fill="#4F8F8C" />
      </g>
      {label}
      {children}
    </g>
  );
};
export const CARTON = (() => {
  const c = tableTop(0.5, 0.62);
  return { x: c.x, y: c.y - 76 };
})();
