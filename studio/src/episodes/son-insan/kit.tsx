import React from 'react';
import {
  Hero, Pose, basePose, kf, clamp, lerp, easeOut, easeInOut, backOut, rnd, camT, LOOKS, Look, LEG_LEN, FONT, C,
  Bedroom, Kitchen, KitchenIsland, KITCHEN, islandTop, stand, Stairwell, Banister, Classroom, SchoolDesk, Rooftop,
  Street, Car, Exhaust, sp, STREET_GROUND, Market, MARKET, Cctv, CctvOverlay, tapeTime, watcherHead, cctvG, cctvS,
  PovHand, Eyelids, Phone, Mug, AlarmClock, Glow, FocusRings, TapeLines, walkPose,
  defineEpisode, Timeline, ShotProps,
} from '../../engine';

// SON İNSAN: the series kit. Every episode is an episode.json whose shots name one of these scenes ("use") and pass
// it a few props; nothing else is written per episode. First person throughout: the camera is his eyes.
// Vertical 9:16: the engine crops the 1920 x 1080 world to its centre column (x 656..1264).

type P = Record<string, any>;
type Shot = React.FC<ShotProps>;
const CREAM = '#F6EFE3';
const INK = '#1A1230';
const SELF = LOOKS.pipHood;
const bob = (t: number, amp = 1) => ({ x: Math.sin(t / 6) * 6 * amp, y: Math.abs(Math.sin(t / 6)) * 10 * amp });
/** A look seen from behind: the face takes the hood's (or the hair's) colour and its features go with it. */
const backOf = (l: Look): Look => ({ ...l, skin: l.extra === 'hood' ? l.jacket : l.hair, skinShade: l.extra === 'hood' ? l.jacketShade : l.hair, face: l.extra === 'hood' ? l.jacket : l.hair });
const WHO: Record<string, Look> = { self: SELF, other: SELF, sis: LOOKS.sis, mom: LOOKS.mom, mo: LOOKS.mo, suit: LOOKS.suit, dark: LOOKS.pipInk };

// ---------- people ----------
/**
 * Someone in the scene. who: self | other | sis | mom | mo | suit | dark. at: [x, y, scale] is where their feet
 * stand in world units. back: seen from behind. up: head tipped to the sky. glow: eyes lit white (an echo).
 * turnAt: frame they turn round to face us (from back to front). wave, tired, expr, yaw, look as on the rig.
 */
const Person: React.FC<{ p: P; t: number }> = ({ p, t }) => {
  const mk = p.to ? easeInOut(clamp((t - (p.move?.[0] ?? 0)) / Math.max(1, (p.move?.[1] ?? 60) - (p.move?.[0] ?? 0)))) : 0;
  const [x, y0, s] = p.to ? [lerp(p.at[0], p.to[0], mk), lerp(p.at[1], p.to[1], mk), lerp(p.at[2], p.to[2], mk)] : (p.at as [number, number, number]);
  const y = y0 - (p.to && mk > 0 && mk < 1 ? Math.abs(Math.sin(t / 4)) * 8 * s : 0);
  const turned = p.turnAt === undefined ? !p.back : t >= p.turnAt;
  const base = WHO[p.who ?? 'self'];
  const look = turned ? base : backOf(base);
  const k = p.sis || p.who === 'sis' ? 0.74 : 1;
  const up = p.upUntil !== undefined && t >= p.upUntil ? 0 : p.up ? 1 : 0;
  const wave = p.wave ? Math.sin(t / 2.6) * 16 : 0;
  const walk = p.walk ? walkPose(x + (p.walk as number) * t, t * 0.5, y, s * k, {}, (p.walk as number) > 0 ? 1 : -1) : null;
  const pose: Pose = walk ?? {
    ...basePose, x, y: y - LEG_LEN * s * k, scale: s * k,
    yaw: p.yaw ?? (up ? (p.upYaw ?? -0.6) : 0), look: p.look ?? 0, headTilt: (up ? (p.upTilt ?? -26) : p.down ? -14 : 0) + (p.sway ? Math.sin(t / 9) * 2 : 0),
    armL: { a: 10, b: -6 }, armR: p.wave ? { a: 112 + wave, b: 42 } : p.hold ? { a: 150, b: 10 } : { a: 10, b: -6 },
    expr: turned ? (p.exprAt && t >= p.exprAt[0] ? p.exprAt[1] : p.expr ?? 'neutral') : 'neutral',
    blink: turned && p.eyesShut ? 1 : 0, sway: p.sway ? 6 : 0,
  };
  if (p.glow && turned) {
    pose.glint = 1;
    pose.glintColor = '#FFFFFF';
  }
  return <Hero look={look} pose={pose} rimId={p.rim ?? 'rimL'} shadow={p.shadow ?? 0.6} />;
};

/** Small wet footprints leading away up the frame from (x, y), n of them, each `step` apart, scaled by s. */
const Prints: React.FC<{ x: number; y: number; n?: number; step?: number; s?: number; dx?: number; o?: number }> = ({ x, y, n = 7, step = 70, s = 1, dx = 0, o = 0.5 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const k = Math.pow(0.86, i);
      const px = x + dx * i + (i % 2 ? 16 : -16) * s * k;
      const py = y - step * s * (1 - Math.pow(0.86, i)) / (1 - 0.86);
      return (
        <g key={i} transform={`translate(${px} ${py}) scale(${s * k})`} opacity={o * (1 - i * 0.05)}>
          <ellipse cx={0} cy={0} rx={11} ry={17} fill="#9FD4E8" />
          <ellipse cx={0} cy={-22} rx={9} ry={7} fill="#9FD4E8" />
          <ellipse cx={-3} cy={-3} rx={4} ry={8} fill="#FFFFFF" opacity={0.5} />
        </g>
      );
    })}
  </g>
);

// ---------- the sets, each with a default camera [cx, cy, zoom] and named places to stand ----------
const K_STAND = stand(KITCHEN, 0.5, 0.4);
const MUG = islandTop(0.5, 0.5);
const C1 = sp(860, STREET_GROUND, 1.55);
const C2 = sp(1085, STREET_GROUND, 2.3);
const C3 = sp(925, STREET_GROUND, 3.6);
const stPlace = (xn: number, d: number): [number, number, number] => [sp(xn, STREET_GROUND, d).x, sp(xn, STREET_GROUND, d).y, 1.5 / d];
const mkPlace = (u: number, w: number): [number, number, number] => {
  const s = stand(MARKET, u, w);
  return [s.x, s.y + LEG_LEN * s.scale, s.scale];
};
type SetDef = { c: number[]; back: (t: number, id: string, p: P) => React.ReactNode; front?: (t: number, id: string, p: P) => React.ReactNode; at: Record<string, [number, number, number]> };
const WIN_D = [1.6, 2.05, 2.6, 3.3, 4.2];
const WIN_Y = [-720, -440, -160, 120];
/** The echoes: a head and shoulders in every window of the street, faces to the sky, or (turn) to us. */
const Echoes: React.FC<{ t: number; turn?: number }> = ({ t, turn = 0 }) => (
  <g>
    {[500, 1420].map((xn) =>
      WIN_D.map((d, i) =>
        WIN_Y.map((Y, j) => {
          const a = sp(xn, Y, d * 1.02);
          const b = sp(xn, Y + 190, d * 1.12);
          const cx = (a.x + b.x) / 2;
          const w = Math.abs(b.x - a.x);
          const hh = b.y - a.y;
          const hr = Math.min(w * 0.4, hh * 0.19);
          const hy = b.y - hh * 0.4 - hr * 0.7;
          const k = clamp(turn - rnd(i + (xn > 960 ? 9 : 0), j) * 0.3);
          const cid = `ec${xn}${i}${j}`;
          return (
            <g key={`${xn}-${i}-${j}`}>
              <defs><clipPath id={cid}><polygon points={`${a.x},${a.y} ${b.x},${a.y + (b.y - a.y) * 0.04} ${b.x},${b.y} ${a.x},${b.y + (b.y - a.y) * 0.04}`} /></clipPath></defs>
              <polygon points={`${a.x},${a.y} ${b.x},${a.y + (b.y - a.y) * 0.04} ${b.x},${b.y} ${a.x},${b.y + (b.y - a.y) * 0.04}`} fill="#FFE2B0" opacity={0.9} />
              <g clipPath={`url(#${cid})`}>
                <ellipse cx={cx} cy={b.y + hh * 0.06} rx={w * 0.5} ry={hh * 0.46} fill="#15111F" />
                <circle cx={cx} cy={hy} r={hr} fill="#15111F" />
              </g>
              {k > 0.5 ? (
                <g fill="#FFFFFF">
                  <circle cx={cx - hr * 0.38} cy={hy} r={hr * 0.2} />
                  <circle cx={cx + hr * 0.38} cy={hy} r={hr * 0.2} />
                </g>
              ) : null}
            </g>
          );
        }),
      ),
    )}
  </g>
);
const CVP = { x: 960, y: 470 };
const cp = (xn: number, Y: number, d: number) => ({ x: CVP.x + (xn - CVP.x) / d, y: CVP.y + (Y - CVP.y) / d });
const cq = (a: [number, number, number][]) => a.map(([xn, Y, d]) => `${cp(xn, Y, d).x.toFixed(1)},${cp(xn, Y, d).y.toFixed(1)}`).join(' ');
const CD = [1, 1.25, 1.56, 1.95, 2.44, 3.05, 3.8, 4.75, 5.9];
/** The school corridor at night: lockers down both walls, classroom doors, a strip of ceiling lights, a double door at the end. */
const Corridor: React.FC<{ t: number; lit?: number }> = ({ t, lit = 0.5 }) => (
  <g>
    <rect x={-600} y={-400} width={3200} height={1900} fill="#141A22" />
    <polygon points={cq([[560, 1020, 0.5], [1360, 1020, 0.5], [1360, 1020, 7.4], [560, 1020, 7.4]])} fill="#2C343C" />
    <polygon points={cq([[560, -80, 0.5], [1360, -80, 0.5], [1360, -80, 7.4], [560, -80, 7.4]])} fill="#1A2028" />
    {[560, 1360].map((xn) => (
      <g key={xn}>
        <polygon points={cq([[xn, -80, 0.5], [xn, -80, 7.4], [xn, 1020, 7.4], [xn, 1020, 0.5]])} fill={xn < 960 ? '#27323A' : '#222C34'} />
        {CD.slice(0, -1).map((d, i) => {
          const d2 = CD[i + 1];
          const door = (i + (xn < 960 ? 0 : 2)) % 4 === 2;
          return door ? (
            <g key={i}>
              <polygon points={cq([[xn, 250, d * 1.04], [xn, 250, d2 * 0.97], [xn, 1020, d2 * 0.97], [xn, 1020, d * 1.04]])} fill="#3B4F5A" />
              <polygon points={cq([[xn, 330, d * 1.08], [xn, 330, d2 * 0.94], [xn, 560, d2 * 0.94], [xn, 560, d * 1.08]])} fill="#0E141A" />
            </g>
          ) : (
            <g key={i}>
              {[0, 1, 2].map((k) => {
                const a = d + ((d2 - d) * k) / 3;
                const b = d + ((d2 - d) * (k + 1)) / 3;
                return (
                  <g key={k}>
                    <polygon points={cq([[xn, 330, a * 1.01], [xn, 330, b * 0.99], [xn, 1010, b * 0.99], [xn, 1010, a * 1.01]])} fill={['#3E6470', '#35545F', '#46707C'][(i + k) % 3]} />
                    <polygon points={cq([[xn, 400, a * 1.04], [xn, 400, b * 0.96], [xn, 430, b * 0.96], [xn, 430, a * 1.04]])} fill="#1B262D" opacity={0.7} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    ))}
    {CD.map((d, i) => <polygon key={`f${i}`} points={cq([[560, 1020, d], [1360, 1020, d], [1360, 1020, d * 1.012], [560, 1020, d * 1.012]])} fill="#222930" />)}
    {[760, 960, 1160].map((xn) => <polygon key={xn} points={cq([[xn - 2, 1020, 0.5], [xn + 2, 1020, 0.5], [xn + 2, 1020, 7.4], [xn - 2, 1020, 7.4]])} fill="#222930" />)}
    {CD.filter((_, i) => i % 2 === 1).map((d, i) => {
      const on = i % 2 === 0 || lit > 0.7;
      const fl = on ? 0.85 + 0.15 * Math.sin(t / 2.3 + i * 4) * (i === 2 ? 1 : 0.1) : 0;
      return (
        <g key={`l${i}`}>
          <polygon points={cq([[840, -78, d], [1080, -78, d], [1080, -78, d * 1.1], [840, -78, d * 1.1]])} fill={on ? '#DDEBFF' : '#2A323C'} opacity={on ? fl : 1} />
          {on ? <Glow x={cp(960, -40, d * 1.05).x} y={cp(960, -40, d * 1.05).y} r={420 / d} kind="cool" o={0.4 * lit * fl} /> : null}
        </g>
      );
    })}
    <polygon points={cq([[560, -80, 7.4], [1360, -80, 7.4], [1360, 1020, 7.4], [560, 1020, 7.4]])} fill="#18222A" />
    <polygon points={cq([[800, 250, 7.4], [1120, 250, 7.4], [1120, 1020, 7.4], [800, 1020, 7.4]])} fill="#32444E" />
    <polygon points={cq([[956, 250, 7.4], [964, 250, 7.4], [964, 1020, 7.4], [956, 1020, 7.4]])} fill="#18222A" />
    <polygon points={cq([[840, 360, 7.4], [930, 360, 7.4], [930, 640, 7.4], [840, 640, 7.4]])} fill="#8FB8C8" opacity={0.35} />
    <polygon points={cq([[990, 360, 7.4], [1080, 360, 7.4], [1080, 640, 7.4], [990, 640, 7.4]])} fill="#8FB8C8" opacity={0.35} />
    <rect x={-600} y={-400} width={3200} height={1900} fill="#06080E" opacity={0.3 * (1 - lit)} />
  </g>
);
const coPlace = (xn: number, d: number): [number, number, number] => [cp(xn, 1020, d).x, cp(xn, 1020, d).y, 1.35 / d];

const SETS: Record<string, SetDef> = {
  corridor: {
    c: [960, 540, 1.02],
    back: (t, id, p) => <Corridor t={t} lit={p.lit ?? 0.5} />,
    at: { end: coPlace(960, 6.4), far: coPlace(1000, 4.0), mid: coPlace(930, 2.4), near: coPlace(1000, 1.5), close: coPlace(960, 1.1) },
  },
  bedroom: {
    c: [1000, 540, 1.15],
    back: (t, id, p) => <Bedroom t={t} id={id} clock={p.clock ?? '06:02'} lamp={p.lamp ?? 1} />,
    at: { door: [560, 840, 1.0], mid: [900, 880, 1.15], bed: [760, 760, 0.9] },
  },
  kitchen: {
    c: [960, 565, 1.05],
    back: (t, id, p) => <Kitchen t={t} id={id} veil={p.veil ?? 0.44} />,
    front: (t, id, p) => (
      <g>
        <KitchenIsland />
        <Mug x={MUG.x} y={MUG.y} rot={0} steam={1} f={t} />
        {p.mugs === 2 ? <Mug x={MUG.x + 96} y={MUG.y + 2} rot={0} steam={1} f={t + 9} /> : null}
      </g>
    ),
    at: { island: [K_STAND.x, K_STAND.y + LEG_LEN * K_STAND.scale, K_STAND.scale], left: [K_STAND.x - 150, K_STAND.y + LEG_LEN * K_STAND.scale, K_STAND.scale], right: [K_STAND.x + 150, K_STAND.y + LEG_LEN * K_STAND.scale, K_STAND.scale] },
  },
  street: {
    c: [960, 560, 1.02],
    back: (t, id, p) => (
      <g>
        <Street t={t} id={id} lit={p.lit ?? 0.42} lamps={p.lamps ?? 1} night={!!p.night} />
        {p.__mid ?? null}
        {p.echoes ? <Echoes t={t} turn={p.echoes === 'turn' ? clamp((t - (p.turnAt ?? 20)) / 14) : 0} /> : null}
        {p.cars === false ? null : (
          <g>
            <Car x={C3.x} y={C3.y} s={0.36} color="#C9A24A" door={1} lights={1} run={p.dead ? 0 : 1} f={t + 5} flip />
            <Car x={C2.x} y={C2.y} s={0.56} color="#4A7A6A" door={1} lights={1} run={p.dead ? 0 : 1} f={t + 3} flip />
            <Car x={C1.x} y={C1.y} s={0.85} color="#8A4A52" door={1} lights={1} run={p.dead ? 0 : 1} f={t} />
            {p.dead ? null : <Exhaust x={C1.x - 134} y={C1.y - 22} t={t} s={0.85} />}
          </g>
        )}
      </g>
    ),
    at: { end: stPlace(1250, 5.2), far: stPlace(1000, 4.2), mid: stPlace(980, 2.6), near: stPlace(1010, 1.6), close: stPlace(960, 1.12), left: stPlace(760, 2.2), right: stPlace(1180, 3.0) },
  },
  market: {
    c: [960, 505, 1.2],
    back: (t, id, p) => <Market t={t} id={id} />,
    at: { far: mkPlace(0.5, 0.14), mid: mkPlace(0.45, 0.42), near: mkPlace(0.55, 0.7) },
  },
  stairs: {
    c: [330, 290, 1.42],
    back: (t, id, p) => <Stairwell t={t} id={id} />,
    front: () => <Banister />,
    at: { landing: [300, 420, 0.9], step: [520, 490, 0.9], low: [830, 700, 0.9], door: [170, 420, 0.9] },
  },
  class: {
    c: [760, 420, 1.42],
    back: (t, id, p) => (
      <Classroom
        t={t}
        id={id}
        empty
        board={
          <g fontFamily={FONT.hand} fill="#EDEFE6">
            {p.tally ? Array.from({ length: p.tally }).map((_, i) => (
              <g key={i} opacity={0.9}>
                <path d={`M ${468 + i * 26 + Math.floor(i / 5) * 22} ${228 + (i % 3) * 3} l ${-4 + (i % 4) * 2} 64`} stroke="#EDEFE6" strokeWidth={6} strokeLinecap="round" />
                {i % 5 === 4 ? <path d={`M ${468 + (i - 4) * 26 + Math.floor(i / 5) * 22 - 12} ${276} l 124 -34`} stroke="#EDEFE6" strokeWidth={6} strokeLinecap="round" /> : null}
              </g>
            )) : null}
            {(p.board ?? []).map((ln: [string, number, number], i: number) => (
              <text key={i} x={740} y={ln[1]} textAnchor="middle" fontSize={ln[2]} fontWeight={700} opacity={clamp((t - (p.boardAt?.[i] ?? 0)) / 8) * 0.95}>{ln[0]}</text>
            ))}
          </g>
        }
      />
    ),
    front: () => <SchoolDesk x={1260} />,
    at: { front: [860, 800, 1.0], door: [1380, 800, 1.0] },
  },
  roof: {
    c: [960, 540, 1.02],
    back: (t, id, p) => (
      <Rooftop t={t} sunX={960} sunY={p.sunY ?? 660} cityLit={p.cityLit ?? 2.4} red={p.red ?? 0} blackout={typeof p.blackout === 'number' ? p.blackout : p.blackout ? kf(t, [[10, 0], [90, 1]]) : 0} lightsOut={p.lightsOut ?? 0} night={!!p.night} />
    ),
    at: { edge: [960, 842, 0.62], left: [800, 842, 0.62], right: [1110, 842, 0.62], near: [960, 1000, 1.25], nearL: [800, 1000, 1.25], nearR: [1120, 1000, 1.25] },
  },
};

/** Behind something held up to his eyes: the place he is standing in, out of focus (bg: a set name), or plain dark. */
const Backdrop: React.FC<{ p: P; t: number; id: string; fill: string }> = ({ p, t, id, fill }) => {
  const S = p.bg ? SETS[p.bg] : null;
  if (!S) return <rect x={-400} y={-400} width={2720} height={1900} fill={fill} />;
  const c = p.bgc ?? S.c;
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform={camT(c[0], c[1], c[2] * 1.15)}>
          {S.back(t, `${id}bg`, p.bgp ?? {})}
          {S.front ? S.front(t, `${id}bg`, p.bgp ?? {}) : null}
        </g>
      </g>
      <rect x={-400} y={-400} width={2720} height={1900} fill="#07060E" opacity={p.bgDark ?? 0.5} />
    </g>
  );
};

// ---------- the scenes ----------
/** Anything drawn over a scene in screen units: night, the light from above, a tint, eyelids, a hand. */
const Over: React.FC<{ p: P; t: number; len: number }> = ({ p, t, len }) => {
  const light = p.light === undefined ? 0 : typeof p.light === 'number' ? p.light : kf(t, p.light as [number, number][]);
  const dark = p.dark === undefined ? 0 : typeof p.dark === 'number' ? p.dark : kf(t, p.dark as [number, number][]);
  return (
    <g>
      {dark > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#05040C" opacity={dark} /> : null}
      {light > 0 ? (
        <g>
          <circle cx={960} cy={-260} r={500 + 1300 * light} fill="url(#g3cool)" opacity={Math.min(1, light * 1.4)} style={{ mixBlendMode: 'screen' }} />
          <rect x={0} y={0} width={1920} height={1080} fill="#FFFFFF" opacity={clamp((light - 0.7) / 0.3)} />
        </g>
      ) : null}
      {p.red ? <rect x={0} y={0} width={1920} height={1080} fill="#5A0A14" opacity={0.25 * p.red} style={{ mixBlendMode: 'multiply' }} /> : null}
      {p.hand ? <PovHand x={kf(t, [[0, 1130], [14, p.hand[0]]], easeOut)} y={kf(t, [[0, 1180], [14, p.hand[1]]], easeOut)} fx={1220} fy={1300} s={p.hand[2] ?? 0.95} point={p.hand[3] === 'point'} /> : null}
      {p.eyes ? <Eyelids open={kf(t, p.eyes as [number, number][])} /> : null}
    </g>
  );
};

/**
 * A place, seen through his eyes. set: bedroom | kitchen | street | market | stairs | class | roof.
 * c / c2: the camera [cx, cy, zoom] at the start and end of the shot. bob: 0..1 walking. who: the people in it.
 * prints: [x, y, scale] wet footprints on the floor. blur: soft. Plus anything Over takes (dark, light, eyes, hand).
 */
const scene = (p: P, id: string): Shot => ({ t, len }) => {
  const S = SETS[p.set];
  const cam = (v: any[]): number[] => (typeof v[0] === 'string' ? [S.at[v[0]][0] + (v[3] ?? 0), S.at[v[0]][1] - v[1] * S.at[v[0]][2], v[2]] : v);
  const a = cam(p.c ?? S.c);
  const b = p.c2 ? cam(p.c2) : a;
  const k = easeInOut(clamp(t / Math.max(1, len)));
  const bb = bob(t, p.bob ?? 0);
  const sh = p.shakeAt !== undefined && t >= p.shakeAt && t < p.shakeAt + 8 ? Math.sin(t * 2.9) * 10 * (1 - (t - p.shakeAt) / 8) : 0;
  const who: P[] = (p.who ?? []).map((w: P) => ({ ...w, at: typeof w.at === 'string' ? S.at[w.at] : w.at, to: typeof w.to === 'string' ? S.at[w.to] : w.to }));
  return (
    <g>
      <g filter={p.blur ? 'url(#blur6)' : undefined}>
        <g transform={camT(lerp(a[0], b[0], k) + bb.x + sh, lerp(a[1], b[1], k) + bb.y, lerp(a[2], b[2], k))}>
          {S.back(t + (p.t0 ?? 0), id, { ...p, __mid: who.filter((w) => w.behind).map((w, i) => <Person key={`b${i}`} p={w} t={t} />) })}
          {p.prints ? <Prints x={p.prints[0]} y={p.prints[1]} s={p.prints[2] ?? 1} n={p.prints[3] ?? 7} dx={p.prints[4] ?? 0} /> : null}
          {who.filter((w) => !w.inFront && !w.behind).map((w, i) => <Person key={i} p={w} t={t} />)}
          {S.front ? S.front(t, id, p) : null}
          {who.filter((w) => w.inFront).map((w, i) => <Person key={`f${i}`} p={w} t={t} />)}
        </g>
      </g>
      <Over p={p} t={t} len={len} />
    </g>
  );
};

/** The hall mirror. mode: normal | late (he turns a beat after you) | still (your hand goes up, his doesn't) | no (he shakes his head) | write (he writes `lines` on the glass). */
const mirror = (p: P, id: string): Shot => ({ t, len }) => {
  const mode = p.mode ?? 'normal';
  const yaw = mode === 'late' ? kf(t, [[0, 0.7], [26, 0.7], [36, 0]], easeOut) : 0;
  const tilt = mode === 'no' ? Math.sin(clamp((t - 10) / 40) * Math.PI * 4) * 9 : 0;
  const pose: Pose = { ...basePose, x: 960, y: 800, scale: 1.5, yaw, look: 0, headTilt: tilt, armL: { a: 12, b: -6 }, armR: mode === 'write' ? { a: 118, b: 30 } : { a: 12, b: -6 }, handR: mode === 'write' ? 'point' : 'open', expr: p.expr ?? 'neutral' };
  const pan = mode === 'late' ? kf(t, [[0, -260], [12, 0]], easeOut) : kf(t, [[0, -20], [len, 20]]);
  return (
    <g>
      <g transform={`translate(${pan} ${Math.abs(Math.sin(t / 7)) * 4}) translate(960 540) scale(${kf(t, [[0, 1.02], [len, 1.1]])}) translate(-960 -540)`}>
        <defs>
          <clipPath id={`${id}m`}><rect x={738} y={190} width={444} height={700} rx={44} /></clipPath>
        </defs>
        <rect x={-600} y={-300} width={3200} height={1700} fill="#2E2639" />
        {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={200 + i * 110} y={-300} width={3} height={1700} fill="#261F30" />)}
        <rect x={-600} y={930} width={3200} height={500} fill="#211A28" />
        <g clipPath={`url(#${id}m)`}>
          <rect x={700} y={150} width={520} height={780} fill="#3B3550" />
          <rect x={1052} y={276} width={146} height={660} fill="#4A3A34" />
          <Glow x={860} y={300} r={420} o={0.4} />
          <Hero look={SELF} pose={pose} rimId="rimL" shadow={0} />
          {p.lines ? (
            <g>
              <rect x={738} y={190} width={444} height={700} fill="#DDEAF2" opacity={0.2} />
              {(p.lines as string[]).map((ln, i) => (
                <text key={i} x={960} y={330 + i * 62} textAnchor="middle" fontFamily={FONT.hand} fontWeight={700} fontSize={p.size ?? 50} fill="#F4F8FB" opacity={clamp((t - (p.at ?? 8) - i * 14) / 10)} transform={p.flip === false ? undefined : undefined}>{ln}</text>
              ))}
            </g>
          ) : null}
          <polygon points="738,190 880,190 800,890 738,890" fill="#FFFFFF" opacity={0.06} />
        </g>
        <rect x={738} y={190} width={444} height={700} rx={44} fill="none" stroke="#6B4B42" strokeWidth={20} />
        <Glow x={960} y={120} r={380} o={0.3} />
      </g>
      {mode === 'still' ? <PovHand x={kf(t, [[0, 1260], [16, 1150]], easeOut)} y={kf(t, [[0, 1100], [16, 520]], easeOut)} fx={1330} fy={1300} s={0.9} /> : null}
      <Over p={p} t={t} len={len} />
    </g>
  );
};

/** Something written, held up to his eyes. kind: note | notebook | arm | glass. lines: the writing. tally: n strokes. slide: it comes in from under a door. */
const paper = (p: P, id: string): Shot => ({ t, len }) => {
  const kind = p.kind ?? 'note';
  const rise = p.slide ? easeOut(clamp(t / 16)) : easeOut(clamp(t / 8));
  const lines: string[] = p.lines ?? [];
  const tally = Array.from({ length: p.tally ?? 0 });
  const strokes = (x0: number, y0: number, color: string, w: number) =>
    tally.map((_, i) => <path key={i} d={`M ${x0 + (i % 10) * 30 + Math.floor((i % 10) / 5) * 26} ${y0 + Math.floor(i / 10) * 110 + (i % 3) * 3} l ${-3 + (i % 4) * 2} 70`} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={clamp((t - 4 - i) / 3)} />);
  return (
    <g>
      <Backdrop p={p} t={t} id={id} fill={kind === 'arm' ? '#231C2A' : '#0E1116'} />
      <Glow x={960} y={420} r={640} kind={kind === 'arm' ? 'warm' : 'cool'} o={0.3} />
      <g transform={`translate(0 ${(1 - rise) * 620}) translate(960 540) rotate(${-3 + Math.sin(t / 11) * 0.8}) scale(${kf(t, [[0, 1], [len, 1.07]])}) translate(-960 -540)`}>
        {kind === 'arm' ? (
          <g>
            <path d="M 620 1200 L 760 240 L 1180 240 L 1300 1200 Z" fill={LOOKS.sis.jacket} />
            <path d="M 780 300 L 1160 300 L 1230 1200 L 700 1200 Z" fill={C.skin} />
            {strokes(812, 400, '#2A3A8A', 10)}
          </g>
        ) : (
          <g>
            <rect x={716} y={236} width={500} height={640} fill="#000" opacity={0.35} />
            <rect x={700} y={220} width={520} height={640} fill={kind === 'notebook' ? '#EDE6D2' : '#F4EEE0'} />
            {kind === 'notebook' ? Array.from({ length: p.rows ? p.rows + 1 : 12 }).map((_, i) => <rect key={i} x={700} y={(p.rows ? 268 : 290) + i * (p.rows ? 560 / (p.rows + 1) : 46)} width={520} height={2} fill="#9FB4C8" opacity={0.5} />) : null}
            {kind === 'notebook' ? <rect x={752} y={220} width={3} height={640} fill="#E0566A" opacity={0.5} /> : null}
            {kind === 'notebook'
              ? Array.from({ length: p.rows ?? 0 }).map((_, i) => {
                  const gap = 560 / ((p.rows ?? 10) + 1);
                  const y = 268 + (i + 1) * gap - 5;
                  return (
                    <g key={i} opacity={clamp((t - 6 - i * 1.5) / 4)}>
                      <text x={790} y={y} fontFamily={FONT.hand} fontWeight={700} fontSize={Math.min(34, gap * 0.98)} fill="#2A2A40">{p.row ?? ''}</text>
                      <path d={`M 1090 ${y - gap * 0.4} l ${gap * 0.3} ${gap * 0.34} l ${gap * 0.6} ${-gap * 0.7}`} stroke="#3FA65B" strokeWidth={5} fill="none" strokeLinecap="round" />
                    </g>
                  );
                })
              : null}
            {strokes(760, 300, '#2A2A40', 7)}
            {lines.map((ln, i) => (
              <text key={i} x={960} y={(p.y ?? 440) + i * (p.gap ?? 74)} textAnchor="middle" fontFamily={FONT.hand} fontWeight={700} fontSize={p.size ?? 54} fill="#2A2A40" opacity={clamp((t - (p.at ?? 10) - i * 6) / 6)}>{ln}</text>
            ))}
          </g>
        )}
      </g>
      {kind === 'arm' ? null : <PovHand x={1090} y={900 + (1 - rise) * 620} fx={1250} fy={1420} s={1.1} rimId="rimBlue" />}
      <Over p={p} t={t} len={len} />
    </g>
  );
};

/** The phone in his hand. mode: ring | live (a voice on the line) | call (a call that never ended: `timer`) | crack. caller: the name on screen. */
const phone = (p: P, id: string): Shot => ({ t, len }) => {
  const w = 300;
  const h = w * 2.05;
  const mode = p.mode ?? 'ring';
  const ring = mode === 'ring' || mode === 'crack' ? ((t > 6 && t < 32) || (t > 44 && t < 70) || (t > 82 && t < 108) ? 1 : 0) : 0;
  const rise = p.rise === false ? 1 : easeOut(clamp(t / 12));
  const talk = mode === 'live' ? (p.talk ? (t >= p.talk[0] && t < p.talk[1] ? 1 : 0.06) : 1) : 0;
  const caller = p.callerAt && t >= p.callerAt[0] ? p.callerAt[1] : p.caller ?? 'BEN';
  return (
    <g transform={`translate(0 ${(1 - rise) * 700}) translate(960 540) scale(${kf(t, [[0, 0.98], [len, 1.1]])}) translate(-960 -540)`}>
      <Backdrop p={p} t={t} id={id} fill="#0C0F14" />
      <Glow x={960} y={90} r={520} kind="cool" o={0.22} />
      <PovHand x={990} y={810} fx={1190} fy={1420} s={1.25} rimId="rimBlue" />
      <Phone x={960} y={560} w={w} rot={-3} on={1} caller={caller} buzz={ring} f={t} />
      <g transform="translate(960 560) rotate(-3)">
        <circle cx={0} cy={-h * 0.19} r={w * 0.27} fill="#3C5484" />
        {caller === 'BEN' ? (
          <g>
            <circle cx={0} cy={-h * 0.18} r={w * 0.2} fill={SELF.jacket} stroke={SELF.line} strokeWidth={5} />
            <circle cx={0} cy={-h * 0.175} r={w * 0.155} fill={C.skin} />
            <circle cx={-w * 0.055} cy={-h * 0.18} r={6} fill={C.ink} />
            <circle cx={w * 0.055} cy={-h * 0.18} r={6} fill={C.ink} />
            <path d={`M ${-w * 0.04} ${-h * 0.145} L ${w * 0.04} ${-h * 0.145}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          </g>
        ) : (
          <circle cx={0} cy={-h * 0.18} r={w * 0.2} fill="#0B0A10" stroke="#FF5A4A" strokeWidth={5} />
        )}
        {mode === 'live' || mode === 'call' ? (
          <g>
            <rect x={-w * 0.4} y={h * 0.1} width={w * 0.8} height={h * 0.32} fill="#2C3A5E" />
            {Array.from({ length: 15 }).map((_, i) => {
              const a = (0.15 + 0.85 * Math.abs(Math.sin(t * 0.9 + i * 1.7) * Math.sin(t * 0.37 + i))) * (mode === 'call' ? 0.08 : talk);
              return <rect key={i} x={-w * 0.33 + i * w * 0.047 - 4} y={h * 0.2 - a * 46} width={8} height={Math.max(6, a * 92)} rx={4} fill="#7FD4FF" />;
            })}
            <text x={0} y={h * 0.37} textAnchor="middle" fontFamily={FONT.ui} fontSize={30} fill={CREAM} opacity={0.85}>{p.timer ? `${p.timer}:${String(10 + (Math.floor(t / 30) % 50)).padStart(2, '0')}` : `00:0${Math.min(9, Math.floor(t / 30))}`}</text>
          </g>
        ) : null}
        {mode === 'crack' ? (
          <g stroke="#E8F2EE" strokeWidth={3} fill="none" opacity={0.85}>
            <path d="M -40 -300 L 10 -120 L -60 20 L 30 160 L -20 300" />
            <path d="M 10 -120 L 120 -60 M -60 20 L -140 70 M 30 160 L 130 200 M 10 -120 L -110 -170" />
          </g>
        ) : null}
      </g>
      <Over p={p} t={t} len={len} />
    </g>
  );
};

const DOORS: Record<string, { wall: string; floor: string; door: string; panel: string; knob: string }> = {
  steel: { wall: '#0D1015', floor: '#090B0F', door: '#1B2028', panel: '#161A21', knob: '#8A93A0' },
  home: { wall: '#2E2639', floor: '#211A28', door: '#5A4034', panel: '#4C352B', knob: '#C9A24A' },
  school: { wall: '#27363E', floor: '#1A2228', door: '#3B5560', panel: '#334A54', knob: '#B8C4CC' },
  roof: { wall: '#25262C', floor: '#17181C', door: '#4A4F58', panel: '#40454E', knob: '#9AA3AE' },
  room: { wall: '#2B2340', floor: '#1E1830', door: '#4A4466', panel: '#403A5A', knob: '#C9A24A' },
};
/**
 * A door in front of him. mode: knock (knocks: frames) | still | note (a paper slides under at noteAt) | open (it swings
 * open at openAt on `behind`: dark | prints | light). feet: two shadows in the light under the door.
 */
const door = (p: P, id: string): Shot => ({ t, len }) => {
  const knocks: number[] = p.knocks ?? (p.mode === 'knock' ? [12, 21, 30] : []);
  const hit = knocks.map((k) => (t >= k && t < k + 6 ? Math.sin((t - k) * 2.6) * 9 * (1 - (t - k) / 6) : 0)).reduce((a, b) => a + b, 0);
  const open = p.mode === 'open' ? easeOut(clamp((t - (p.openAt ?? 10)) / 22)) : 0;
  const w = 400 * (1 - open * 0.9);
  const note = p.mode === 'note' ? easeOut(clamp((t - (p.noteAt ?? 14)) / 14)) : 0;
  const D = DOORS[p.style ?? 'steel'];
  return (
    <g transform={`translate(${hit * 0.4} 0) translate(960 540) scale(${kf(t, [[0, 1.0], [len, 1.18]])}) translate(-960 -560)`}>
      <rect x={-400} y={-300} width={2720} height={1700} fill={D.wall} />
      {p.style === 'home' ? Array.from({ length: 16 }).map((_, i) => <rect key={i} x={380 + i * 82} y={-300} width={3} height={1270} fill="#000" opacity={0.14} />) : null}
      {p.style === 'school' ? <g><rect x={-400} y={560} width={2720} height={410} fill="#1F3038" /><rect x={-400} y={552} width={2720} height={10} fill="#3B5560" /></g> : null}
      {p.style === 'room' ? <g><rect x={1230} y={300} width={150} height={200} fill="#C96A5A" opacity={0.5} /><rect x={1250} y={330} width={110} height={90} fill="#F6EFE3" opacity={0.35} /></g> : null}
      <rect x={-400} y={968} width={2720} height={500} fill={D.floor} />
      {p.style === 'home' ? <rect x={800} y={990} width={320} height={70} rx={8} fill="#4A3A34" /> : null}
      <rect x={746} y={150} width={428} height={822} fill="#06080B" />
      {open > 0 ? (
        <g>
          <rect x={760} y={164} width={400} height={806} fill={p.behind === 'light' ? '#EAF4FF' : '#11161D'} />
          <polygon points="760,970 1160,970 1240,1400 680,1400" fill="#1A222B" opacity={0.9} />
          {p.behind === 'light' ? <Glow x={960} y={560} r={700} kind="cool" o={0.8 * open} /> : <Glow x={960} y={420} r={300} kind="cool" o={0.25} />}
          {p.behind === 'prints' ? <Prints x={960} y={1010} s={1.5} n={6} step={66} o={0.75 * open} /> : null}
        </g>
      ) : null}
      <g transform={`translate(${hit} 0)`}>
        <polygon points={`760,164 ${760 + w},${164 - 50 * open} ${760 + w},${970 + 50 * open} 760,970`} fill={D.door} />
        <polygon points={`${760 + w * 0.08},200 ${760 + w * 0.92},${200 - 40 * open} ${760 + w * 0.92},${530 + 6 * open} ${760 + w * 0.08},530`} fill={p.style === 'school' ? '#9FC4D0' : D.panel} opacity={p.style === 'school' ? 0.28 : 1} />
        <polygon points={`${760 + w * 0.08},570 ${760 + w * 0.92},${570 + 8 * open} ${760 + w * 0.92},${930 + 40 * open} ${760 + w * 0.08},930`} fill={D.panel} />
        {p.style === 'roof' ? <rect x={760 + w * 0.1} y={548} width={w * 0.8} height={14} rx={7} fill="#9AA3AE" /> : <rect x={760 + w * 0.87} y={540} width={34 * (1 - open * 0.6)} height={12} rx={6} fill={D.knob} />}
        {p.style === 'home' && open === 0 ? <circle cx={960} cy={360} r={9} fill="#C9A24A" /> : null}
        {p.style === 'roof' && open < 0.05 ? <g><rect x={880} y={184} width={160} height={54} rx={8} fill="#0E2A1C" /><text x={960} y={224} textAnchor="middle" fontFamily={FONT.ui} fontWeight={700} fontSize={34} fill="#5CF0A0">ÇATI</text></g> : null}
      </g>
      {open > 0 ? null : (
        <g>
          <rect x={760} y={970} width={400} height={9} fill="#FFE2B0" opacity={0.9} />
          {p.feet === false ? null : (
            <g opacity={p.feetUntil !== undefined && t >= p.feetUntil ? 0 : 1}>
              <rect x={880} y={970} width={(p.small ? 40 : 58)} height={9} fill="#0D1015" />
              <rect x={984} y={970} width={(p.small ? 40 : 58)} height={9} fill="#0D1015" />
            </g>
          )}
          <Glow x={960} y={985} r={260} o={0.3} />
        </g>
      )}
      {note > 0 ? (
        <g transform={`translate(${930} ${1060 - note * 60}) rotate(${-8 + note * 4})`}>
          <rect x={-70} y={-50} width={150} height={104} fill="#F4EEE0" />
          <path d="M -44 -18 L 50 -18 M -44 8 L 30 8" stroke="#2A2A40" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        </g>
      ) : null}
      {knocks.map((k) => (
        <g key={k} transform="translate(960 470) scale(0.9)"><FocusRings x={0} y={0} t={t - k} r0={36} color="#E8F2EE" /></g>
      ))}
      {p.guard ? <Hero look={SELF} pose={{ ...basePose, x: 960, y: 1010 - LEG_LEN * 1.5, scale: 1.5, armL: { a: 24, b: -10 }, armR: { a: 24, b: -10 }, expr: p.guardAt && t >= p.guardAt[0] ? p.guardAt[1] : p.guard }} rimId="rimBlue" shadow={0.5} /> : null}
      {p.pushHand && open > 0 && open < 0.9 ? <PovHand x={900 + w * 0.5} y={600} fx={1180} fy={1300} s={0.9} rimId="rimBlue" /> : null}
      <Over p={p} t={t} len={len} />
    </g>
  );
};

/** Looking down at the ground: floor: tiles | asphalt | boards. prints: wet footprints leading on. shadow: his own shadow, shrinking as the light above grows (light). shoes: his trainers. */
const floor = (p: P, id: string): Shot => ({ t, len }) => {
  const kind = p.floor ?? 'tiles';
  const scroll = (p.walk ?? 0) * t * 6;
  const fill = kind === 'asphalt' ? '#2B2733' : kind === 'boards' ? '#3A2826' : '#3A4048';
  const light = p.light === undefined ? 0 : typeof p.light === 'number' ? p.light : kf(t, p.light as [number, number][]);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={fill} />
      <g transform={`translate(0 ${scroll % 120})`}>
        {kind === 'tiles' ? Array.from({ length: 14 }).map((_, i) => <rect key={i} x={0} y={-240 + i * 120} width={1920} height={3} fill="#252A30" />) : null}
        {kind === 'tiles' ? Array.from({ length: 8 }).map((_, i) => <rect key={`v${i}`} x={600 + i * 120} y={-300} width={3} height={1700} fill="#252A30" />) : null}
        {kind === 'boards' ? Array.from({ length: 8 }).map((_, i) => <rect key={i} x={600 + i * 110} y={-300} width={3} height={1700} fill="#261A1A" />) : null}
        {kind === 'asphalt' ? Array.from({ length: 60 }).map((_, i) => <circle key={i} cx={640 + rnd(3, i) * 640} cy={-200 + rnd(4, i) * 1500} r={2 + rnd(5, i) * 3} fill="#3A3644" />) : null}
      </g>
      {p.prints ? (
        <g transform={`translate(0 ${scroll})`}>
          {Array.from({ length: p.mat ? 4 : 12 }).map((_, i) => (
            <g key={i} transform={`translate(${960 + (i % 2 ? 34 : -34) + (p.drift ?? 0) * i} ${(p.mat ? 980 : 900) - i * 150}) scale(1.9)`} opacity={0.7}>
              <ellipse cx={0} cy={0} rx={11} ry={17} fill="#9FD4E8" />
              <ellipse cx={0} cy={-22} rx={9} ry={7} fill="#9FD4E8" />
              <ellipse cx={-3} cy={-3} rx={4} ry={8} fill="#FFFFFF" opacity={0.5} />
            </g>
          ))}
        </g>
      ) : null}
      {p.mat ? (
        <g>
          <rect x={0} y={0} width={1920} height={330} fill="#12151B" />
          <rect x={700} y={0} width={520} height={318} fill="#1B2028" />
          <rect x={700} y={318} width={520} height={12} fill="#FFE2B0" opacity={0.85} />
          <rect x={820} y={352} width={280} height={150} rx={10} fill="#4A3A34" />
        </g>
      ) : null}
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={(p.night ?? 0.35) * (1 - light)} />
      {p.shadow ? <ellipse cx={960} cy={lerp(520, 800, light)} rx={lerp(150, 80, light)} ry={lerp(330, 60, light)} fill="#000" opacity={0.3 + 0.5 * light} /> : null}
      {light > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#DDEFFF" opacity={0.42 * light} style={{ mixBlendMode: 'screen' }} /> : null}
      {p.shoes ? (
        <g>
          {[-70, 70].map((dx) => (
            <g key={dx} transform={`translate(${960 + dx} ${920 + Math.abs(Math.sin(t / 6 + (dx > 0 ? 1.5 : 0))) * (p.walk ? 18 : 0)})`}>
              <path d="M -52 150 L -52 -30 Q -52 -96 0 -96 Q 52 -96 52 -30 L 52 150 Z" fill="#2E2B3D" />
              <path d="M -46 -10 Q -46 -86 0 -86 Q 46 -86 46 -10 L 46 30 L -46 30 Z" fill="#3FB8A8" />
              <path d="M -30 -40 L 30 -40 M -30 -18 L 30 -18" stroke="#F6EFE3" strokeWidth={6} strokeLinecap="round" />
            </g>
          ))}
        </g>
      ) : null}
      <Over p={{ ...p, light: undefined }} t={t} len={len} />
    </g>
  );
};

/**
 * The market's recording. tau: [from, to] the tape's clock over the shot (0 = 03:17:00, the stop). up: when the heads
 * rise. on: wide | watcher (zoomed in on the one at the back). z: [from, to] zoom. face: 0 dark, 1 his own face.
 * wave / cover: the watcher waves, or holds a hand over the eyes of the child beside him. light: 0..1 or keys.
 */
const tape = (p: P, id: string): Shot => ({ t, len, f }) => {
  const k = clamp(t / Math.max(1, len));
  const tau = lerp(p.tau?.[0] ?? 126, p.tau?.[1] ?? p.tau?.[0] ?? 126, k);
  const WH = watcherHead();
  const z = lerp(p.z?.[0] ?? (p.on === 'watcher' ? 4.2 : 1), p.z?.[1] ?? p.z?.[0] ?? (p.on === 'watcher' ? 5.4 : 1.06), easeInOut(k));
  const on = p.on === 'watcher' ? 1 : p.on === 'pan' ? easeOut(clamp((t - 10) / 40)) : 0;
  const cx = lerp(960, WH.x - (p.cover ? 14 : 0), on);
  const cy = lerp(540, WH.y + (p.cover || p.wave ? 26 : 6), on);
  const light = p.light === undefined ? 0.03 : typeof p.light === 'number' ? p.light : kf(t, p.light as [number, number][]);
  const face = p.faceAt !== undefined ? (t >= p.faceAt ? 1 : 0) : p.face ?? 0;
  const wg = cctvG(0.5, 0.95);
  const ws = 0.62 * cctvS(0.95);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#0A0D10" />
      <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
        <Cctv tau={tau} id={id} up={p.up ?? 76} light={light} face={face} soft={p.soft} wave={p.wave ? Math.sin(t / 2.6) * 16 + 112 : undefined} cover={p.cover} crowd={p.crowd} />
        {p.box ? (
          <rect x={WH.x - 44 - (p.cover ? 30 : 0)} y={WH.y - 44} width={88 + (p.cover ? 30 : 0)} height={p.cover || p.wave ? 170 : 88} fill="none" stroke={face ? '#7FD4FF' : '#FF5A4A'} strokeWidth={2.2} strokeDasharray="14 8" opacity={clamp((t - (p.boxAt ?? 6)) / 6)} />
        ) : null}
      </g>
      <CctvOverlay id={`${id}o`} f={f} time={p.time ?? tapeTime(tau)} rec={p.rec ?? false} label={p.label ?? 'KAM 03'} />
      {p.rewind ? (
        <g>
          <TapeLines f={f} />
          <g transform="translate(960 300)" opacity={Math.floor(t / 4) % 2 ? 1 : 0.6}>
            <polygon points="-8,-30 -50,0 -8,30" fill={CREAM} />
            <polygon points="44,-30 2,0 44,30" fill={CREAM} />
          </g>
        </g>
      ) : null}
      <Over p={{ ...p, light: undefined }} t={t} len={len} />
    </g>
  );
};

/** A clock, close: the bedside alarm with `text` (or textAt: [frame, text] to change it). */
const clock = (p: P, id: string): Shot => ({ t, len }) => (
  <g>
    <g filter="url(#blur16)">
      <g transform={camT(960, 560, 1.9)}><Bedroom t={t} id={id} clock={p.text} lamp={p.lamp ?? 0.4} /></g>
    </g>
    <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.5} />
    <g transform={`translate(960 ${640 + Math.sin(t / 9) * 3}) scale(${kf(t, [[0, 1.5], [len, 1.9]])})`}>
      <AlarmClock x={0} y={0} text={p.textAt && t >= p.textAt[0] ? p.textAt[1] : p.text} on={Math.floor(t / 15) % 2 || !p.blink ? 1 : 0.5} />
    </g>
    <Over p={p} t={t} len={len} />
  </g>
);

/** Nothing: black (or white), with a line of small text if `text` is given. */
const blank = (p: P, id: string): Shot => ({ t, len }) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill={p.white ? '#F4F8FB' : '#000'} />
    {p.text ? <text x={960} y={556} textAnchor="middle" fontFamily={FONT.ui} fontSize={34} letterSpacing={6} fill={p.white ? '#1A1230' : '#E8F2EE'} opacity={clamp((t - 4) / 8) * 0.85}>{p.text}</text> : null}
    <Over p={p} t={t} len={len} />
  </g>
);

/** The end card. */
const card = (p: P, id: string): Shot => ({ t }) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#000" />
    <g opacity={clamp((t - 6) / 8)}>
      <text x={960} y={520} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={76} fill={CREAM} letterSpacing={4}>{p.title ?? 'SON İNSAN'}</text>
      <text x={960} y={590} textAnchor="middle" fontFamily={FONT.ui} fontSize={30} fill={CREAM} letterSpacing={8} opacity={0.7}>{p.sub ?? ''}</text>
    </g>
  </g>
);

/** A mirror carried or held up: the sky's light caught in it (light), or a face (who) looking into it. */
const glass = (p: P, id: string): Shot => ({ t, len }) => {
  const light = p.light === undefined ? 0 : typeof p.light === 'number' ? p.light : kf(t, p.light as [number, number][]);
  const pose: Pose = { ...basePose, x: 960, y: 800, scale: 2.0 * 0.74, yaw: 0, look: 0, headTilt: -4, expr: p.exprAt && t >= p.exprAt[0] ? p.exprAt[1] : p.expr ?? 'neutral' };
  if (light > 0.3) {
    pose.glint = clamp((light - 0.3) / 0.4);
    pose.glintColor = '#FFFFFF';
  }
  return (
    <g>
      {p.bg === 'street' ? <g transform={camT(960 + Math.sin(t / 6) * 8, 560, 1.02)}><Street t={t} id={id} lit={0.2} lamps={1} night /></g> : p.bg === 'dark' ? <rect x={0} y={0} width={1920} height={1080} fill="#14121C" /> : <g transform={camT(960, 540, 1.02)}><Rooftop t={t} sunX={960} sunY={700} cityLit={1.6} lightsOut={1} night /></g>}
      <rect x={0} y={0} width={1920} height={1080} fill="#05040C" opacity={0.55 * (1 - light)} />
      <g transform={`translate(${Math.sin(t / 5) * 4} ${Math.abs(Math.sin(t / 6)) * 5 * (p.bob ?? 0)}) translate(960 560) rotate(${-2 + Math.sin(t / 13)}) translate(-960 -560)`}>
        <defs><clipPath id={`${id}g`}><rect x={738} y={200} width={444} height={700} rx={44} /></clipPath></defs>
        <g clipPath={`url(#${id}g)`}>
          <rect x={700} y={150} width={520} height={800} fill="#1A1C2C" />
          <circle cx={960} cy={230} r={200 + 900 * light} fill="url(#g3cool)" opacity={Math.min(1, light * 1.5)} style={{ mixBlendMode: 'screen' }} />
          {p.who ? <Hero look={WHO[p.who]} pose={pose} rimId="rimBlue" shadow={0} /> : null}
          <rect x={700} y={150} width={520} height={800} fill="#FFFFFF" opacity={clamp((light - 0.75) / 0.25) * 0.9} />
          <polygon points="738,200 880,200 800,900 738,900" fill="#FFFFFF" opacity={0.06} />
        </g>
        <rect x={738} y={200} width={444} height={700} rx={44} fill="none" stroke="#6B4B42" strokeWidth={20} />
      </g>
      <PovHand x={770} y={930} fx={640} fy={1400} s={1.0} rimId="rimBlue" />
      <PovHand x={1150} y={930} fx={1290} fy={1400} s={1.0} rimId="rimBlue" />
      <Over p={{ ...p, light: light > 0.85 ? (light - 0.85) / 0.15 : 0 }} t={t} len={len} />
    </g>
  );
};

/** His wrist, raised to his eyes: a digital watch reading `text` (textAt: [frame, text] changes it). */
const watch = (p: P, id: string): Shot => ({ t, len }) => {
  const rise = easeOut(clamp(t / 10));
  const text = p.textAt && t >= p.textAt[0] ? p.textAt[1] : p.text;
  return (
    <g>
      <Backdrop p={p} t={t} id={id} fill="#0C0F14" />
      <Glow x={960} y={200} r={620} kind="cool" o={0.22} />
      <g transform={`translate(0 ${(1 - rise) * 600}) translate(960 560) rotate(${-8 + Math.sin(t / 12)}) scale(${kf(t, [[0, 1.0], [len, 1.12]])}) translate(-960 -560)`}>
        <rect x={420} y={452} width={1400} height={216} rx={100} fill={SELF.line} />
        <rect x={430} y={462} width={1400} height={196} rx={96} fill={C.skin} />
        <rect x={1090} y={440} width={800} height={240} rx={40} fill={SELF.line} />
        <rect x={1100} y={450} width={800} height={220} rx={36} fill={SELF.jacket} />
        <rect x={850} y={444} width={220} height={232} rx={16} fill="#17141C" />
        <rect x={812} y={420} width={296} height={280} rx={44} fill="#0B0D12" stroke="#8A93A0" strokeWidth={8} />
        <rect x={836} y={470} width={248} height={150} rx={18} fill="#132A2A" />
        <text x={960} y={574} textAnchor="middle" fontFamily={FONT.ui} fontWeight={700} fontSize={(text ?? '').length > 5 ? 50 : 76} fill="#8FF0D8" opacity={p.blink && Math.floor(t / 15) % 2 ? 0.6 : 1}>{text}</text>
      </g>
      <Over p={p} t={t} len={len} />
    </g>
  );
};

/** A piece of mirror in the other one's hand, held out to us; light: the sky's light caught in it (0..1 or keys). */
const shard = (p: P, id: string): Shot => ({ t, len }) => {
  const light = p.light === undefined ? 0 : typeof p.light === 'number' ? p.light : kf(t, p.light as [number, number][]);
  const rise = easeOut(clamp(t / 12));
  return (
    <g>
      <g transform={camT(960, 520, 1.3)} filter="url(#blur6)"><Rooftop t={t} sunX={960} sunY={700} cityLit={1.6} lightsOut={1} night /></g>
      <rect x={0} y={0} width={1920} height={1080} fill="#05040C" opacity={0.6} />
      <g transform={`translate(${(1 - rise) * 500} 0) translate(960 540) rotate(${Math.sin(t / 12) * 1.5}) scale(${kf(t, [[0, 1], [len, 1.1]])}) translate(-960 -540)`}>
        <PovHand x={1000} y={700} fx={1700} fy={900} s={1.25} rimId="rimBlue" />
        <polygon points="860,300 1040,250 1090,470 1010,660 890,600 830,430" fill="#000" opacity={0.4} transform="translate(10 12)" />
        <polygon points="860,300 1040,250 1090,470 1010,660 890,600 830,430" fill="#2A3350" stroke="#C9D6E8" strokeWidth={5} strokeLinejoin="round" />
        <polygon points="872,312 960,288 900,590 844,430" fill="#FFFFFF" opacity={0.12} />
        <circle cx={965} cy={440} r={60 + 320 * light} fill="url(#g3cool)" opacity={Math.min(1, 0.15 + light * 1.2)} style={{ mixBlendMode: 'screen' }} />
        <circle cx={965} cy={440} r={10 + 40 * light} fill="#FFFFFF" opacity={Math.min(1, light * 1.3)} />
      </g>
      <Over p={{ ...p, light: undefined }} t={t} len={len} />
    </g>
  );
};

const USES: Record<string, (p: P, id: string) => Shot> = { scene, mirror, paper, phone, door, floor, tape, clock, blank, card, glass, watch, shard };

/** Build an episode from its episode.json: each shot is { id, use, props }. */
export const buildEpisode = (ep: any, timeline: any) => {
  const shots: Record<string, Shot> = {};
  for (const s of ep.shots) {
    const make = USES[s.use];
    if (!make) throw new Error(`${ep.slug}: shot ${s.id} uses unknown scene "${s.use}"`);
    shots[s.id] = make(s.props ?? {}, `${ep.id}${s.id}`.replace(/[^A-Za-z0-9]/g, ''));
  }
  return defineEpisode(ep.id, { timeline: timeline as Timeline, shots });
};
