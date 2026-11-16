import React from 'react';
import { clamp, lerp, rnd } from '../anim';
import { Glow, LightVeil } from '../light';
import { makeRoom, Box } from '../room';
import { RoomShell } from '../furnish';
import { Hero, Look, LOOKS, LEG_LEN, Pose, basePose, walkPose } from '../rig';
import { FONT } from '../fonts';

// A small supermarket, built for the vertical frame's centre column: one aisle seen from its mouth (Market), and the
// same shop seen from its security camera (Cctv), where the story's recording plays.

export const MARKET = makeRoom({ x: 960, y: 480 }, { x0: 800, x1: 1120, y0: 330, y1: 640 }, 4.0);
const GOODS = ['#C98E58', '#9FB49A', '#D9C69A', '#B9705A', '#8FA6B9', '#E0566A', '#E9C46A', '#7FB4A8'];

/** The aisle: shelves down both sides, strip lights (the middle one failing), fridges glowing on the back wall. */
export const Market: React.FC<{ t: number; id?: string; veil?: number }> = ({ t, id = 'mkt', veil = 0.4 }) => {
  const R = MARKET;
  const { P, Q } = R;
  const strips = [0.14, 0.44, 0.76];
  const flick = (i: number) => (i === 1 ? (Math.sin(t * 1.7) > 0.72 || Math.sin(t * 0.31) > 0.9 ? 0.25 : 1) : 1);
  const goods: React.ReactNode[] = [];
  [0.2, 0.8].forEach((u, side) => {
    for (let r = 0; r < 4; r++) {
      for (let i = 0; i < 14; i++) {
        const w0 = 0.08 + i * 0.064;
        const v0 = 0.36 + r * 0.155;
        goods.push(<polygon key={`g${side}-${r}-${i}`} points={Q([[u, v0, w0], [u, v0, w0 + 0.05], [u, v0 + 0.11, w0 + 0.05], [u, v0 + 0.11, w0]])} fill={GOODS[Math.floor(rnd(side * 7 + r, i) * GOODS.length)]} opacity={0.85} />);
      }
      const v1 = 0.36 + r * 0.155 + 0.115;
      goods.push(<polygon key={`s${side}-${r}`} points={Q([[u, v1, 0.06], [u, v1, 0.98], [u, v1 + 0.02, 0.98], [u, v1 + 0.02, 0.06]])} fill="#24212C" />);
    }
  });
  const basket = P(0.57, 1, 0.5);
  return (
    <g>
      <RoomShell r={R} id={id} floor="tiles" wall="#3C4650" side="#2F3842" floorC="#2B3038" lines="#21252C" />
      {/* the fridges across the back wall */}
      <rect x={P(0.06, 0.4, 0).x} y={P(0, 0.4, 0).y} width={P(0.94, 0, 0).x - P(0.06, 0, 0).x} height={P(0, 0.97, 0).y - P(0, 0.4, 0).y} fill="#9FD4E8" opacity={0.75} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={`fr${i}`} x={P(0.06 + i * 0.22, 0, 0).x - 3} y={P(0, 0.4, 0).y} width={6} height={P(0, 0.97, 0).y - P(0, 0.4, 0).y} fill="#2A3038" />
      ))}
      {[0.55, 0.72, 0.88].map((v, i) => (
        <rect key={`fs${i}`} x={P(0.06, 0, 0).x} y={P(0, v, 0).y} width={P(0.94, 0, 0).x - P(0.06, 0, 0).x} height={3} fill="#5A7A8A" />
      ))}
      <Glow x={960} y={P(0, 0.7, 0).y} r={260} kind="cool" o={0.5} />
      <Box r={R} u={[-0.1, 0.2]} v={[0.3, 1]} w={[0.06, 0.98]} front="#2A2632" side="#3E3A48" top="#4A4654" />
      <Box r={R} u={[0.8, 1.1]} v={[0.3, 1]} w={[0.06, 0.98]} front="#2A2632" side="#383442" top="#4A4654" />
      {goods}
      {strips.map((w, i) => {
        const c = P(0.5, 0, w + 0.03);
        return (
          <g key={`st${i}`} opacity={flick(i)}>
            <polygon points={Q([[0.38, 0, w], [0.62, 0, w], [0.62, 0, w + 0.06], [0.38, 0, w + 0.06]])} fill="#EAF4FF" />
            <Glow x={c.x} y={c.y + 20} r={240 * R.s(w)} kind="cool" o={0.55} />
          </g>
        );
      })}
      {/* a basket dropped where its owner stood, oranges still rolling to a stop */}
      <ellipse cx={basket.x} cy={basket.y + 4} rx={70} ry={12} fill="#000" opacity={0.35} />
      <path d={`M ${basket.x - 54} ${basket.y - 44} L ${basket.x + 30} ${basket.y - 52} L ${basket.x + 46} ${basket.y - 6} L ${basket.x - 40} ${basket.y + 4} Z`} fill="#B0463A" />
      <path d={`M ${basket.x - 54} ${basket.y - 44} L ${basket.x + 30} ${basket.y - 52}`} stroke="#E08A7A" strokeWidth={4} />
      {[[-96, 6, 13], [-128, -2, 12], [70, 10, 13], [104, 2, 11]].map(([dx, dy, r], i) => (
        <circle key={`or${i}`} cx={basket.x + dx} cy={basket.y + dy} r={r} fill="#F2A23A" />
      ))}
      <LightVeil id={`${id}veil`} lights={[...strips.map((w): [number, number, number] => [P(0.5, 0.5, w + 0.03).x, P(0.5, 0.5, w + 0.03).y, 380 * R.s(w)]), [960, 500, 260]]} o={veil} />
    </g>
  );
};

// ---------- the security camera's view ----------
/** A point on the shop floor as the camera sees it: gx -1..1 across the aisle, gz 0 (near, bottom) .. 1 (far). */
export const cctvG = (gx: number, gz: number) => ({ x: 960 + gx * lerp(330, 170, gz), y: lerp(1060, 330, Math.pow(gz, 0.85)) });
export const cctvS = (gz: number) => lerp(1.0, 0.5, gz);

const BLUE: Look = { ...LOOKS.mom, jacket: '#4A6A8A', jacketShade: '#3A566F', hair: '#2A2A30' };
const RUST: Look = { ...LOOKS.mo, jacket: '#8A5A4A', jacketShade: '#6F463A', hair: '#C9925A' };
type Shopper = { gx: number; gz: number; look: Look; dir: 1 | -1; ph: number; k?: number };
export const SHOPPERS: Shopper[] = [
  { gx: -0.12, gz: 0.84, look: RUST, dir: 1, ph: 0.4 },
  { gx: 0.36, gz: 0.68, look: BLUE, dir: -1, ph: 2.1 },
  { gx: -0.42, gz: 0.6, look: LOOKS.sis, dir: 1, ph: 1.2, k: 0.72 },
  { gx: 0.06, gz: 0.48, look: LOOKS.mo, dir: 1, ph: 3.0 },
  { gx: 0.4, gz: 0.3, look: LOOKS.suit, dir: -1, ph: 0.9 },
  { gx: -0.34, gz: 0.14, look: LOOKS.mom, dir: 1, ph: 2.6 },
];
/** Where the one who doesn't look up stands: at the back, by the end of the right-hand shelves. */
export const WATCHER = { gx: 0.5, gz: 0.95 };
export const watcherHead = () => {
  const g = cctvG(WATCHER.gx, WATCHER.gz);
  const s = 0.62 * cctvS(WATCHER.gz);
  return { x: g.x, y: g.y - LEG_LEN * s - 176 * s, s };
};

/**
 * The recording. `tau` is the tape's clock in frames: before 0 the shoppers walk; at 0 every one of them stops
 * mid-step; from `up` they all raise their heads the same way; `light` 0..1 floods the frame from that side.
 * The watcher never moves and looks straight into the lens. `face` 0 shows him as the camera caught him (a dark
 * face, two light eyes), 1 the face itself. Draw it inside a camera group; CctvOverlay goes on top, outside it.
 */
export const Cctv: React.FC<{ tau: number; id?: string; up?: number; light?: number; face?: number; soft?: boolean; wave?: number; cover?: boolean; crowd?: string }> = ({ tau, id = 'cc', up = 30, light = 0, face = 0, soft = false, wave, cover = false }) => {
  const tiles: React.ReactNode[] = [];
  for (let i = -5; i <= 5; i++) {
    const a = cctvG(i / 5, 0);
    const b = cctvG(i / 5, 1);
    tiles.push(<path key={`tv${i}`} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke="#4A5258" strokeWidth={2} />);
  }
  for (let j = 0; j <= 9; j++) {
    const a = cctvG(-1.6, j / 9);
    const b = cctvG(1.6, j / 9);
    tiles.push(<path key={`th${j}`} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke="#4A5258" strokeWidth={2} />);
  }
  const shelf = (side: 1 | -1) => {
    const a0 = cctvG(side * 0.74, 0.02);
    const a1 = cctvG(side * 0.74, 1);
    const b0 = cctvG(side * 1.7, 0.02);
    const b1 = cctvG(side * 1.7, 1);
    const h0 = 300;
    const h1 = 300 * cctvS(1);
    return (
      <g key={side}>
        <polygon points={`${a0.x},${a0.y} ${a1.x},${a1.y} ${a1.x},${a1.y - h1} ${a0.x},${a0.y - h0}`} fill="#3A3F46" />
        <polygon points={`${a0.x},${a0.y - h0} ${a1.x},${a1.y - h1} ${b1.x},${b1.y - h1} ${b0.x},${b0.y - h0}`} fill="#565C64" />
        {[0.22, 0.48, 0.74].map((k, r) => (
          <g key={r}>
            <path d={`M ${a0.x} ${a0.y - h0 * k} L ${a1.x} ${a1.y - h1 * k}`} stroke="#23272C" strokeWidth={5} />
            {Array.from({ length: 12 }).map((_, i) => {
              const z0 = 0.04 + i * 0.08;
              const p = cctvG(side * 0.74, z0);
              const q = cctvG(side * 0.74, z0 + 0.055);
              const hh = lerp(h0, h1, z0);
              return <polygon key={i} points={`${p.x},${p.y - hh * k - 4} ${q.x},${q.y - lerp(h0, h1, z0 + 0.055) * k - 4} ${q.x},${q.y - lerp(h0, h1, z0 + 0.055) * (k + 0.2)} ${p.x},${p.y - hh * (k + 0.2)}`} fill={GOODS[Math.floor(rnd(r * 5 + (side > 0 ? 3 : 0), i) * GOODS.length)]} opacity={0.8} />;
            })}
          </g>
        ))}
      </g>
    );
  };
  const k = clamp((tau - up) / 7);
  const figures = SHOPPERS.map((p, i) => {
    const s = 0.62 * cctvS(p.gz) * (p.k ?? 1);
    const moving = Math.min(0, tau);
    const g = cctvG(p.gx + p.dir * moving * 0.006, p.gz);
    const walk = walkPose(g.x, p.ph + moving * 0.5, g.y, s, {}, p.dir);
    const pose: Pose = { ...walk, yaw: lerp(walk.yaw, -0.62, k), headTilt: lerp(walk.headTilt, 24, k), look: lerp(0, -1, k), tilt: lerp(walk.tilt, 0, k), expr: k > 0.5 ? 'shock' : 'neutral' };
    return <Hero key={i} look={p.look} pose={pose} rimId="rimL" shadow={0.7} />;
  });
  const wg = cctvG(WATCHER.gx, WATCHER.gz);
  const ws = 0.62 * cctvS(WATCHER.gz);
  const wpose: Pose = { ...basePose, x: wg.x, y: wg.y - LEG_LEN * ws, scale: ws, yaw: 0, look: 0, armL: { a: 8, b: -4 }, armR: wave !== undefined ? { a: wave, b: 42 } : { a: 8, b: -4 }, expr: 'neutral' };
  // the child beside him the first night: his hand across her eyes
  const sx = wg.x - 78 * ws;
  const sscale = ws * 0.74;
  const spose: Pose = { ...basePose, x: sx, y: wg.y - LEG_LEN * sscale, scale: sscale, yaw: 0.1, look: 0, expr: 'neutral' };
  const shead = { x: sx, y: wg.y - LEG_LEN * sscale - 176 * sscale };
  return (
    <g>
      <defs>
        <filter id={`${id}F`} filterUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.30 0.52 0.16 0 0.01  0.33 0.58 0.18 0 0.03  0.36 0.62 0.20 0 0.07  0 0 0 1 0" />
        </filter>
      </defs>
      <g filter={`url(#${id}F)`}>
        <g filter={soft ? 'url(#blur3)' : undefined}>
          <rect x={-400} y={-400} width={2720} height={1880} fill="#5A636B" />
          <rect x={-400} y={-400} width={2720} height={732} fill="#3C444C" />
          <rect x={720} y={150} width={480} height={182} fill="#AFC8D4" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={717 + i * 120} y={150} width={6} height={182} fill="#2A3038" />
          ))}
          {tiles}
          {shelf(-1)}
          {shelf(1)}
          {face < 1 ? <Hero look={LOOKS.pipInk} pose={wpose} rimId="rimL" shadow={0.7} /> : null}
          {face > 0 ? (
            <g opacity={face}>
              <Hero look={LOOKS.pipHood} pose={wpose} rimId="rimL" shadow={0.7} />
            </g>
          ) : null}
          {cover ? (
            <g>
              <Hero look={LOOKS.sis} pose={spose} rimId="rimL" shadow={0.7} />
              <path d={`M ${wg.x - 40 * ws} ${wg.y - LEG_LEN * ws - 106 * ws} L ${shead.x + 26 * sscale} ${shead.y}`} stroke={LOOKS.pipHood.line} strokeWidth={26 * ws} strokeLinecap="round" />
              <path d={`M ${wg.x - 40 * ws} ${wg.y - LEG_LEN * ws - 106 * ws} L ${shead.x + 26 * sscale} ${shead.y}`} stroke={LOOKS.pipHood.limb} strokeWidth={20 * ws} strokeLinecap="round" />
              <ellipse cx={shead.x} cy={shead.y - 2 * sscale} rx={52 * sscale} ry={20 * sscale} fill={LOOKS.pipHood.hand} stroke={LOOKS.pipHood.line} strokeWidth={3 * ws} />
            </g>
          ) : null}
          {figures}
        </g>
        {light > 0 ? (
          <g>
            <circle cx={640} cy={90} r={300 + 1500 * light} fill="url(#g3cool)" opacity={Math.min(1, light * 1.6)} style={{ mixBlendMode: 'screen' }} />
            <rect x={-400} y={-400} width={2720} height={1880} fill="#FFFFFF" opacity={clamp((light - 0.55) / 0.45)} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

/** What the monitor adds on top of the recording (screen units, never zoomed): scan lines, the time code, REC. */
export const CctvOverlay: React.FC<{ id?: string; f: number; time: string; rec?: boolean; label?: string }> = ({ id = 'cco', f, time, rec = true, label = 'KAM 03' }) => (
  <g>
    <defs>
      <pattern id={`${id}ln`} width={8} height={6} patternUnits="userSpaceOnUse">
        <rect width={8} height={2} fill="#000" opacity={0.2} />
      </pattern>
      <radialGradient id={`${id}vg`} cx="50%" cy="50%" r="70%">
        <stop offset="60%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.6} />
      </radialGradient>
    </defs>
    <rect x={640} y={-10} width={640} height={1100} fill={`url(#${id}ln)`} />
    <rect x={640} y={(f * 7) % 1200 - 60} width={640} height={46} fill="#FFFFFF" opacity={0.05} />
    <rect x={656} y={0} width={608} height={1080} fill={`url(#${id}vg)`} />
    <g fontFamily={FONT.ui} fill="#E8F2EE" style={{ filter: 'drop-shadow(0 0 4px #000)' }}>
      <text x={690} y={228} fontSize={24} letterSpacing={2} opacity={0.9}>{label}</text>
      <text x={690} y={266} fontSize={34} letterSpacing={2}>{time}</text>
      {rec ? (
        <g opacity={Math.floor(f / 12) % 2 ? 1 : 0.35}>
          <circle cx={1150} cy={220} r={9} fill="#FF4A4A" />
          <text x={1168} y={229} fontSize={24} letterSpacing={2}>REC</text>
        </g>
      ) : null}
    </g>
  </g>
);

/** The tape's clock as a time code: tau 0 is 03:17:00. */
export const tapeTime = (tau: number) => {
  const s = Math.floor(tau / 30);
  const fr = String(((Math.floor(tau) % 30) + 30) % 30).padStart(2, '0');
  return s >= 0 ? `03:17:${String(s).padStart(2, '0')}:${fr}` : `03:16:${String(60 + s).padStart(2, '0')}:${fr}`;
};
