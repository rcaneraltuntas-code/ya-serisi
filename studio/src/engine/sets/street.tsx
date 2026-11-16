import React from 'react';
import { rnd } from '../anim';
import { DuskSky, Sun, Haze, Skyline } from '../kit';
import { Glow, LightVeil } from '../light';
import { S3 } from '../room';

// A city street at first light, looking straight down the road between two rows of buildings: one-point perspective
// with the vanishing point at STREET_VP. Built for the vertical frame's centre column (x 656..1264). A point on the
// street is sp(xNear, Y, d): xNear and Y are where it would sit at depth 1 (the near plane), d >= 1 pushes it back.
// Ground is Y = STREET_GROUND; the walls stand at xNear = 500 and 1420; the kerbs at 640 and 1280.

export const STREET_VP = { x: 960, y: 520 };
export const STREET_GROUND = 1000;
export const sp = (xn: number, Y: number, d: number) => ({ x: STREET_VP.x + (xn - STREET_VP.x) / d, y: STREET_VP.y + (Y - STREET_VP.y) / d });
const quad = (a: [number, number, number][]) => a.map(([xn, Y, d]) => `${sp(xn, Y, d).x.toFixed(1)},${sp(xn, Y, d).y.toFixed(1)}`).join(' ');

const DS = [1.25, 1.6, 2.05, 2.6, 3.3, 4.2, 5.4, 7];
const ROWS = [-1000, -720, -440, -160, 120, 400];

const Wall: React.FC<{ xn: number; seed: number; lit: number }> = ({ xn, seed, lit }) => (
  <g>
    <polygon points={quad([[xn, -1600, 0.45], [xn, -1600, 10], [xn, STREET_GROUND, 10], [xn, STREET_GROUND, 0.45]])} fill={xn < 960 ? '#2B2340' : '#241D36'} />
    {/* storey lines */}
    {ROWS.map((Y, j) => (
      <polygon key={`l${j}`} points={quad([[xn, Y + 235, 0.6], [xn, Y + 235, 10], [xn, Y + 245, 10], [xn, Y + 245, 0.6]])} fill="#1A1528" opacity={0.7} />
    ))}
    {DS.map((d, i) =>
      ROWS.map((Y, j) => {
        const on = rnd(seed + j, i) < lit;
        return (
          <g key={`w${i}-${j}`}>
            <polygon points={quad([[xn, Y, d], [xn, Y, d * 1.14], [xn, Y + 190, d * 1.14], [xn, Y + 190, d]])} fill={on ? '#FFC27A' : '#161226'} opacity={on ? 0.55 + rnd(seed + 9, i * 7 + j) * 0.35 : 1} />
            {on ? <polygon points={quad([[xn, Y + 90, d], [xn, Y + 90, d * 1.14], [xn, Y + 100, d * 1.14], [xn, Y + 100, d]])} fill="#3A2A30" opacity={0.6} /> : null}
          </g>
        );
      }),
    )}
    {/* shop fronts at street level: glass, an awning, a few still lit */}
    {DS.slice(0, 6).map((d, i) => {
      const on = rnd(seed + 40, i) < 0.6;
      const c = ['#7FD4C8', '#FFC27A', '#F2A27A', '#9FC7FF'][(i + seed) % 4];
      return (
        <g key={`s${i}`}>
          <polygon points={quad([[xn, 660, d], [xn, 660, d * 1.2], [xn, 960, d * 1.2], [xn, 960, d]])} fill={on ? c : '#15111F'} opacity={on ? 0.5 : 1} />
          <polygon points={quad([[xn, 610, d * 0.99], [xn, 610, d * 1.21], [xn, 660, d * 1.21], [xn, 660, d * 0.99]])} fill={['#7A4A52', '#4A6A5A', '#5A4A7A'][(i + seed) % 3]} />
        </g>
      );
    })}
  </g>
);

/**
 * The street. `lit` is the share of windows still lit (the people are gone, the lights are not), `lamps` switches the
 * street lamps. Draw cars and anything on the road after it, at sp(x, STREET_GROUND, d) with scale 1 / d.
 */
export const Street: React.FC<{ t: number; id?: string; lit?: number; lamps?: number; veil?: number }> = ({ t, id = 'str', lit = 0.42, lamps = 1, veil = 0.34 }) => {
  const lampsAt = [1.9, 3.3, 5.6];
  return (
    <g>
      <DuskSky id={`${id}sky`} horizonY={STREET_VP.y + 50} />
      <Sun x={STREET_VP.x} y={STREET_VP.y - 6} r={84} t={t} />
      <Skyline y={STREET_VP.y + 52} seed={17} color="#30224C" h={110} />
      <Haze y={STREET_VP.y + 10} h={200} o={0.5} />
      {/* the road and the pavements */}
      <polygon points={quad([[-2000, STREET_GROUND, 0.45], [4000, STREET_GROUND, 0.45], [4000, STREET_GROUND, 10], [-2000, STREET_GROUND, 10]])} fill="#27222F" />
      <polygon points={quad([[500, STREET_GROUND, 0.45], [640, STREET_GROUND, 0.45], [640, STREET_GROUND, 10], [500, STREET_GROUND, 10]])} fill="#3A3346" />
      <polygon points={quad([[1280, STREET_GROUND, 0.45], [1420, STREET_GROUND, 0.45], [1420, STREET_GROUND, 10], [1280, STREET_GROUND, 10]])} fill="#342E40" />
      <polygon points={quad([[640, STREET_GROUND, 0.45], [652, STREET_GROUND, 0.45], [652, STREET_GROUND, 10], [640, STREET_GROUND, 10]])} fill={S3.warm} opacity={0.25} />
      {/* the sun's long reflection down the middle of the road */}
      <polygon points={quad([[900, STREET_GROUND, 1], [1020, STREET_GROUND, 1], [990, STREET_GROUND, 10], [930, STREET_GROUND, 10]])} fill="#FFB46A" opacity={0.16} />
      {[[1.15, 1.4], [1.75, 2.1], [2.6, 3.1], [3.9, 4.7], [6, 7.6]].map(([a, b], i) => (
        <polygon key={`d${i}`} points={quad([[952, STREET_GROUND, a], [968, STREET_GROUND, a], [968, STREET_GROUND, b], [952, STREET_GROUND, b]])} fill="#D9D2C2" opacity={0.5} />
      ))}
      <Wall xn={500} seed={3} lit={lit} />
      <Wall xn={1420} seed={11} lit={lit} />
      {/* street lamps on the right kerb, still on */}
      {lampsAt.map((d, i) => {
        const a = sp(1300, STREET_GROUND, d);
        const b = sp(1300, 180, d);
        const c = sp(1200, 150, d);
        return (
          <g key={`lp${i}`}>
            <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y} Q ${b.x} ${c.y} ${c.x} ${c.y}`} stroke="#15111F" strokeWidth={14 / d} fill="none" strokeLinecap="round" />
            <ellipse cx={c.x} cy={c.y + 6 / d} rx={30 / d} ry={10 / d} fill={lamps ? '#FFE2B0' : '#2A2433'} />
            {lamps ? <Glow x={c.x} y={c.y + 20 / d} r={190 / d} o={0.5 * (0.92 + 0.08 * Math.sin(t / 3 + i * 2))} /> : null}
            <ellipse cx={a.x} cy={a.y} rx={34 / d} ry={7 / d} fill="#000" opacity={0.35} />
          </g>
        );
      })}
      <LightVeil id={`${id}veil`} lights={[[STREET_VP.x, STREET_VP.y, 430], ...lampsAt.map((d): [number, number, number] => [sp(1200, 300, d).x, sp(1200, 300, d).y, 300 / d])]} o={veil} />
      <Glow x={STREET_VP.x} y={STREET_VP.y} r={420} o={0.42} />
    </g>
  );
};

/**
 * A car from the side, standing on (x, y) (the middle of its wheelbase on the ground), about 300 long at s = 1.
 * `door` 0..1 opens the front door (the cabin light comes on with it), `lights` the head and tail lights,
 * `run` 0..1 makes the engine shake the body (pass the shot clock in f). `flip` faces it left.
 */
export const Car: React.FC<{ x: number; y: number; s?: number; color?: string; door?: number; lights?: number; run?: number; f?: number; flip?: boolean }> = ({
  x, y, s = 1, color = '#8A4A52', door = 0, lights = 1, run = 0, f = 0, flip = false,
}) => {
  const j = run ? Math.sin(f * 2.3) * 1.2 * run : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={2} rx={170} ry={14} fill="#000" opacity={0.4} />
      {lights ? <polygon points="150,-52 520,-110 520,10 150,-30" fill="#FFE2B0" opacity={0.16 * lights} /> : null}
      <g transform={`translate(0 ${j})`}>
        <path d="M -84 -66 L -58 -112 Q -54 -119 -44 -119 L 42 -119 Q 54 -119 62 -108 L 98 -66 Z" fill={color} />
        <path d="M -84 -66 L -58 -112 Q -54 -119 -44 -119 L 42 -119 Q 54 -119 62 -108 L 98 -66 Z" fill="#000" opacity={0.25} />
        <path d="M -70 -68 L -52 -106 L -8 -106 L -8 -68 Z" fill={door ? '#5A4630' : '#1B2433'} />
        <path d="M 0 -68 L 0 -106 L 40 -106 Q 48 -106 54 -98 L 78 -68 Z" fill={door ? '#FFD39A' : '#1B2433'} opacity={door ? 0.55 + 0.45 * door : 1} />
        <path d="M -150 -22 Q -154 -60 -120 -66 L 122 -66 Q 150 -60 152 -32 L 152 -22 Z" fill={color} />
        <path d="M -150 -40 L 152 -40 L 152 -22 L -150 -22 Z" fill="#000" opacity={0.22} />
        <path d="M -120 -66 L 122 -66" stroke="#FFB46A" strokeWidth={2.5} opacity={0.6} />
        {door > 0 ? (
          <g>
            {/* the open doorway: the lit cabin, an empty seat */}
            <path d="M -4 -66 L -4 -24 L 70 -24 L 82 -66 Z" fill="#3A2C22" />
            <path d="M -4 -66 L -4 -24 L 70 -24 L 82 -66 Z" fill="#FFD39A" opacity={0.3 * door} />
            <path d="M 10 -30 Q 6 -74 22 -100 Q 36 -104 40 -92 Q 34 -60 44 -30 Z" fill="#241C1C" />
            <path d={`M 82 -66 L ${82 + 46 * door} -62 L ${70 + 50 * door} -22 L 70 -24 Z`} fill={color} />
            <path d={`M 82 -66 L ${82 + 46 * door} -62 L ${70 + 50 * door} -22 L 70 -24 Z`} fill="#000" opacity={0.35} />
            <path d={`M 78 -68 L ${80 + 44 * door} -104 L ${82 + 46 * door} -62 L 82 -66 Z`} fill="#9FC7FF" opacity={0.22} />
          </g>
        ) : null}
        <rect x={140} y={-58} width={14} height={12} rx={3} fill={lights ? '#FFF3C8' : '#6A6470'} />
        <rect x={-154} y={-58} width={10} height={14} rx={3} fill={lights ? '#FF4A4A' : '#5A2A30'} />
        <rect x={-158} y={-30} width={22} height={7} rx={3} fill="#3A3640" />
      </g>
      {[-92, 92].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={-24} r={27} fill="#14121A" />
          <circle cx={wx} cy={-24} r={12} fill="#5E5A6C" />
        </g>
      ))}
      {lights ? <circle cx={-150} cy={-50} r={46} fill="url(#g3red)" opacity={0.45 * lights} style={{ mixBlendMode: 'screen' }} /> : null}
    </g>
  );
};

/** Exhaust puffing from a running car's tailpipe at (x, y), drifting the way `dir` points (-1 left, 1 right). */
export const Exhaust: React.FC<{ x: number; y: number; t: number; s?: number; dir?: number }> = ({ x, y, t, s = 1, dir = -1 }) => (
  <g>
    {Array.from({ length: 6 }).map((_, i) => {
      const p = ((t + i * 5) % 30) / 30;
      return <circle key={i} cx={x + dir * (10 + p * 90) * s} cy={y - (p * p * 46 + Math.sin(i * 2.1) * 6) * s} r={(8 + p * 26) * s} fill="#C9CCE0" opacity={0.3 * (1 - p)} />;
    })}
  </g>
);
