import React from 'react';
import { rnd, FONT, Glow } from '../../engine';
import { FlipWord } from './world';

// 07.00: the places outside the flat, drawn side-on like the hall: a wall or a street behind, the floor at FLOOR,
// two people facing each other (a on the left, b on the right) and, where there is one, a table, counter or desk in
// front of them. Each place has one sign that turns from Turkish to English.

export const FLOOR = 800;
export type Kind = 'street' | 'stop' | 'bus' | 'cafe' | 'counter' | 'class' | 'corridor' | 'office' | 'park';
export type FlatP = { kind: Kind; sign?: [string, string]; sign2?: [string, string]; wall?: string; night?: boolean; shelf?: 'cups' | 'books' | 'food' };
export type Spot = { x: number; y: number; sit?: boolean };
const STAND = FLOOR - 140;
export const SPOTS: Record<Kind, { a: Spot; b: Spot; view: [number, number, number] }> = {
  street: { a: { x: 850, y: STAND }, b: { x: 1078, y: STAND }, view: [964, 572, 1.36] },
  stop: { a: { x: 850, y: STAND }, b: { x: 1100, y: 640, sit: true }, view: [972, 564, 1.36] },
  bus: { a: { x: 905, y: 690, sit: true }, b: { x: 1100, y: 690, sit: true }, view: [960, 564, 1.5] },
  cafe: { a: { x: 846, y: 694, sit: true }, b: { x: 1084, y: 694, sit: true }, view: [965, 572, 1.42] },
  counter: { a: { x: 850, y: STAND }, b: { x: 1092, y: STAND }, view: [968, 572, 1.38] },
  class: { a: { x: 850, y: STAND }, b: { x: 1078, y: STAND }, view: [964, 572, 1.36] },
  corridor: { a: { x: 850, y: STAND }, b: { x: 1078, y: STAND }, view: [964, 572, 1.36] },
  office: { a: { x: 846, y: 694, sit: true }, b: { x: 1104, y: 694, sit: true }, view: [972, 572, 1.4] },
  park: { a: { x: 866, y: 694, sit: true }, b: { x: 1062, y: 694, sit: true }, view: [964, 572, 1.42] },
};
const INK = '#161422';
const Sign: React.FC<{ x: number; y: number; w: [string, string]; t: number; at: number; card?: string; ink?: string; plain?: boolean; size?: number }> = ({ x, y, w, t, at, card = '#1D2230', ink = '#F6EFE3', plain, size = 26 }) => {
  const n = Math.max(w[0].length, w[1].length);
  const wd = n * size * 0.78 + 34;
  return (
    <g>
      {plain ? null : <rect x={x - wd / 2} y={y - size * 1.1} width={wd} height={size * 2.2} rx={10} fill="#F6EFE3" stroke={INK} strokeWidth={5} />}
      <FlipWord x={x} y={y} from={w[0]} to={w[1]} t={t} at={at} size={size} card={card} ink={ink} every={2} />
    </g>
  );
};
const Houses: React.FC<{ night?: boolean }> = ({ night }) => (
  <g>
    {Array.from({ length: 8 }).map((_, i) => {
      const x = -260 + i * 330;
      const h = 330 + rnd(21, i) * 110;
      const c = ['#E9B872', '#9FD3C1', '#E2725B', '#C9D6E8', '#E0A63A', '#B8A4D6', '#F2C6A0', '#8FC1D4'][i];
      return (
        <g key={i}>
          <rect x={x} y={FLOOR - h} width={312} height={h} fill={c} stroke={INK} strokeWidth={4} />
          <rect x={x - 8} y={FLOOR - h - 16} width={328} height={22} fill="#7A4A3A" stroke={INK} strokeWidth={4} />
          {[0, 1].map((k) => <rect key={k} x={x + 40 + k * 150} y={FLOOR - h + 60} width={84} height={96} rx={6} fill={night ? '#FFD98A' : '#DFF2FA'} stroke={INK} strokeWidth={4} />)}
          <rect x={x + 116} y={FLOOR - 150} width={80} height={150} rx={6} fill="#6E4A36" stroke={INK} strokeWidth={4} />
          <circle cx={x + 182} cy={FLOOR - 74} r={5} fill="#E9C46A" />
        </g>
      );
    })}
  </g>
);
const Ground: React.FC<{ c?: string; lines?: string }> = ({ c = '#D8D2C6', lines = '#B9B2A4' }) => (
  <g>
    <rect x={-400} y={FLOOR} width={2900} height={400} fill={c} />
    {Array.from({ length: 26 }).map((_, i) => <rect key={i} x={-400 + i * 112} y={FLOOR} width={3} height={400} fill={lines} opacity={0.7} />)}
    <rect x={-400} y={FLOOR} width={2900} height={8} fill="#F6EFE3" opacity={0.7} />
  </g>
);
const Room: React.FC<{ wall: string; floor?: string }> = ({ wall, floor = '#B5875C' }) => (
  <g>
    <rect x={-400} y={-200} width={2900} height={1010} fill={wall} />
    <rect x={-400} y={-200} width={2900} height={320} fill="#000" opacity={0.14} />
    <rect x={-400} y={760} width={2900} height={44} fill="#000" opacity={0.12} />
    <Ground c={floor} lines="#8A6242" />
  </g>
);
const Lamp: React.FC<{ x: number; y?: number }> = ({ x, y = 300 }) => (
  <g>
    <rect x={x - 2} y={-200} width={4} height={y + 200} fill={INK} />
    <path d={`M ${x - 46} ${y + 34} Q ${x} ${y - 30} ${x + 46} ${y + 34} Z`} fill="#E0A63A" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <Glow x={x} y={y + 70} r={170} o={0.35} />
  </g>
);

/** Behind the people. t: the scene's clock; flipAt: when the sign turns. */
export const FlatBack: React.FC<{ t: number; p: FlatP; flipAt?: number; noSign?: boolean; signO?: number }> = ({ t, p, flipAt = -999, noSign, signO = 1 }) => {
  // signO: the sign steps back while a badge or a thought sits where it hangs
  const sign = p.sign && !noSign && signO > 0.01 ? <g opacity={signO}><Sign x={965} y={384} w={p.sign} t={t} at={flipAt} /></g> : null;
  const sky = (
    <g>
      <rect x={-400} y={-200} width={2900} height={1010} fill={p.night ? '#1B2140' : '#BFE3F2'} />
      <circle cx={1420} cy={170} r={54} fill={p.night ? '#F1F3FF' : '#FFE08A'} />
      {p.night ? Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={200 + rnd(5, i) * 1500} cy={rnd(6, i) * 320} r={2.2} fill="#FFFFFF" opacity={0.5 + 0.5 * Math.sin(t / 9 + i)} />) : null}
    </g>
  );
  switch (p.kind) {
    case 'street':
    case 'stop':
      return (
        <g>
          {sky}
          <Houses night={p.night} />
          {p.kind === 'street' ? (
            <g>
              {sign}
              {/* his garden: a low fence and a row of flowers */}
              {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={1010 + i * 34} y={716} width={18} height={84} rx={7} fill="#F6EFE3" stroke={INK} strokeWidth={3.5} />)}
              <rect x={1000} y={742} width={460} height={12} fill="#F6EFE3" stroke={INK} strokeWidth={3.5} />
              {Array.from({ length: 7 }).map((_, i) => <g key={i}><rect x={1196 + i * 38} y={690} width={4} height={34} fill="#3E8C6A" /><circle cx={1198 + i * 38} cy={684 + Math.sin(t / 14 + i) * 2} r={11} fill={['#E2613F', '#FFE08A', '#F6EFE3'][i % 3]} stroke={INK} strokeWidth={3} /></g>)}
            </g>
          ) : (
            <g>
              {/* the stop's pole, and the bus standing at it */}
              <rect x={772} y={330} width={10} height={470} fill="#5A6680" stroke={INK} strokeWidth={3} />
              {p.sign2 && !noSign ? <Sign x={777} y={366} w={p.sign2} t={t} at={flipAt} size={17} /> : null}
              <rect x={1000} y={292} width={1400} height={492} rx={30} fill="#E2613F" stroke={INK} strokeWidth={5} />
              <rect x={1000} y={650} width={1400} height={22} fill="#F6EFE3" />
              {[0, 1, 2, 3].map((i) => <rect key={i} x={1200 + i * 230} y={352} width={200} height={150} rx={12} fill="#BFE3F2" stroke={INK} strokeWidth={4} />)}
              <rect x={1030} y={350} width={140} height={434} rx={8} fill="#2B2233" stroke={INK} strokeWidth={4} />
              <rect x={1104} y={552} width={58} height={150} rx={14} fill="#4A4458" stroke={INK} strokeWidth={4} />
              <rect x={1090} y={694} width={76} height={20} rx={8} fill="#4A4458" stroke={INK} strokeWidth={4} />
              {p.sign ? <g><rect x={1012} y={304} width={176} height={36} rx={6} fill="#1D2230" stroke={INK} strokeWidth={3} /><Sign x={1100} y={322} w={p.sign} t={t} at={flipAt} size={14} plain card="#1D2230" ink="#FFB03A" /></g> : null}
            </g>
          )}
          <Ground />
          <rect x={-400} y={FLOOR + 74} width={2900} height={400} fill="#5A5F6E" />
          <rect x={-400} y={FLOOR + 68} width={2900} height={10} fill="#A8A294" />
          {p.night ? <rect x={-400} y={-200} width={2900} height={1500} fill="#0B1024" opacity={0.42} /> : null}
          {p.night ? <Glow x={965} y={420} r={420} o={0.5} /> : null}
        </g>
      );
    case 'park':
      return (
        <g>
          {sky}
          {[520, 1260, 1560].map((x, i) => <g key={i}><rect x={x - 14} y={470} width={28} height={330} fill="#6E4A36" stroke={INK} strokeWidth={4} /><circle cx={x} cy={420 + i * 10} r={120} fill="#3E8C6A" stroke={INK} strokeWidth={4} /><circle cx={x + 70} cy={470} r={70} fill="#4FA07C" stroke={INK} strokeWidth={4} /></g>)}
          <rect x={690} y={300} width={10} height={500} fill="#3A4258" stroke={INK} strokeWidth={3} />
          <circle cx={695} cy={292} r={24} fill="#FFE9B0" stroke={INK} strokeWidth={4} />
          {sign}
          {/* the bench */}
          <rect x={790} y={612} width={350} height={20} rx={6} fill="#8A5E44" stroke={INK} strokeWidth={4} />
          <rect x={790} y={650} width={350} height={20} rx={6} fill="#8A5E44" stroke={INK} strokeWidth={4} />
          <rect x={780} y={694} width={370} height={22} rx={6} fill="#A8765A" stroke={INK} strokeWidth={4} />
          {[806, 1114].map((x) => <rect key={x} x={x} y={612} width={12} height={188} fill="#3A4258" stroke={INK} strokeWidth={3} />)}
          <Ground c="#9CC78A" lines="#7FB06E" />
          {p.night ? <rect x={-400} y={-200} width={2900} height={1500} fill="#0B1024" opacity={0.45} /> : null}
          {p.night ? <Glow x={695} y={330} r={520} o={0.7} /> : null}
        </g>
      );
    case 'bus':
      return (
        <g>
          <rect x={-400} y={-200} width={2900} height={1010} fill="#D9CBB0" />
          <rect x={-400} y={392} width={2900} height={190} fill="#BFE3F2" />
          {Array.from({ length: 12 }).map((_, i) => {
            const x = ((i * 260 - t * 9) % 3120 + 3120) % 3120 - 500;
            return <rect key={i} x={x} y={582 - 70 - rnd(31, i) * 100} width={200} height={70 + rnd(31, i) * 100} fill={['#E9B872', '#9FD3C1', '#C9D6E8', '#E2725B'][i % 4]} opacity={0.85} />;
          })}
          {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={-300 + i * 330} y={380} width={22} height={214} fill="#8A93A0" stroke={INK} strokeWidth={3} />)}
          <rect x={-400} y={380} width={2900} height={14} fill="#8A93A0" stroke={INK} strokeWidth={3} />
          <rect x={-400} y={582} width={2900} height={14} fill="#8A93A0" stroke={INK} strokeWidth={3} />
          <rect x={-400} y={300} width={2900} height={10} fill="#5A6680" />
          {[760, 1010, 1260].map((x) => <path key={x} d={`M ${x} 310 l 0 44 a 14 14 0 1 0 0.1 0`} stroke="#E0A63A" strokeWidth={6} fill="none" />)}
          {sign}
          {/* seat backs */}
          {[780, 1150].map((x) => <rect key={x} x={x} y={560} width={70} height={240} rx={18} fill="#3F7775" stroke={INK} strokeWidth={4} />)}
          <Ground c="#7A7F8C" lines="#5A5F6E" />
        </g>
      );
    case 'cafe':
      return (
        <g>
          <Room wall={p.wall ?? '#2F5957'} />
          <rect x={470} y={380} width={300} height={280} rx={8} fill="#BFE3F2" stroke={INK} strokeWidth={5} />
          <rect x={616} y={380} width={8} height={280} fill={INK} />
          <rect x={470} y={380} width={300} height={280} fill="#FFE2B0" opacity={0.25} />
          {sign}
          <Lamp x={846} /><Lamp x={1084} />
          <rect x={1200} y={470} width={300} height={12} rx={4} fill="#8A5E44" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={1216 + i * 54} y={436} width={34} height={34} rx={7} fill={['#F6EFE3', '#E2613F', '#E0A63A', '#F6EFE3', '#9FD3C1'][i]} stroke={INK} strokeWidth={3} />)}
          {/* chair backs */}
          {[770, 1118].map((x) => <rect key={x} x={x} y={560} width={44} height={150} rx={12} fill="#8A5E44" stroke={INK} strokeWidth={4} />)}
        </g>
      );
    case 'counter':
      return (
        <g>
          <Room wall={p.wall ?? '#C9764F'} floor="#E3D2B4" />
          {sign}
          <Lamp x={850} /><Lamp x={1092} />
          {[0, 1].map((r) => (
            <g key={r}>
              <rect x={1170} y={470 + r * 110} width={360} height={12} rx={4} fill="#6E3F2C" />
              {Array.from({ length: 7 }).map((_, i) => {
                const h = p.shelf === 'books' ? 70 + rnd(7 + r, i) * 20 : 36 + rnd(7 + r, i) * 26;
                const w = p.shelf === 'books' ? 26 : 34;
                return <rect key={i} x={1182 + i * 48} y={470 + r * 110 - h} width={w} height={h} rx={p.shelf === 'books' ? 3 : 8} fill={['#F6EFE3', '#9FD3C1', '#E0A63A', '#E2613F', '#3F7775', '#C9D6E8', '#B8A4D6'][(i + r * 3) % 7]} stroke={INK} strokeWidth={3} />;
              })}
            </g>
          ))}
        </g>
      );
    case 'class':
      return (
        <g>
          <Room wall={p.wall ?? '#E9DFCC'} floor="#C9B28C" />
          <rect x={900} y={330} width={640} height={250} rx={8} fill="#2F5957" stroke="#8A5E44" strokeWidth={12} />
          {p.sign ? <Sign x={1220} y={420} w={p.sign} t={t} at={flipAt} plain card="#2F5957" ink="#F6EFE3" size={34} /> : null}
          <path d="M 960 520 l 120 0 M 960 546 l 200 0" stroke="#F6EFE3" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
          <rect x={520} y={300} width={170} height={500} fill="#8A5E44" stroke={INK} strokeWidth={5} />
          <circle cx={668} cy={560} r={8} fill="#E9C46A" />
          <circle cx={800} cy={350} r={30} fill="#F6EFE3" stroke={INK} strokeWidth={5} />
          <path d={`M 800 350 L 800 330 M 800 350 L ${800 + 14 * Math.cos(t / 40)} ${350 + 14 * Math.sin(t / 40)}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <rect x={1170} y={676} width={300} height={16} rx={4} fill="#8A5E44" stroke={INK} strokeWidth={4} />
          <rect x={1190} y={692} width={12} height={108} fill="#6E4A36" /><rect x={1440} y={692} width={12} height={108} fill="#6E4A36" />
        </g>
      );
    case 'corridor':
      return (
        <g>
          <Room wall={p.wall ?? '#8FA3B8'} floor="#C2B9A8" />
          <rect x={-400} y={610} width={2900} height={190} fill="#6F8499" />
          <rect x={1126} y={330} width={190} height={470} fill="#E9DFCC" stroke={INK} strokeWidth={5} />
          <circle cx={1150} cy={580} r={8} fill="#5A6680" />
          {sign}
          {[560, 1480].map((x) => <rect key={x} x={x} y={330} width={190} height={470} fill="#E9DFCC" stroke={INK} strokeWidth={5} />)}
        </g>
      );
    case 'office':
      return (
        <g>
          <Room wall={p.wall ?? '#C9D6E8'} floor="#8A93A0" />
          <rect x={500} y={340} width={280} height={300} rx={6} fill="#EAF4FA" stroke={INK} strokeWidth={5} />
          {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={500} y={352 + i * 32} width={280} height={8} fill="#9FB0C4" />)}
          {sign}
          <rect x={1330} y={640} width={60} height={160} rx={8} fill="#8A5E44" stroke={INK} strokeWidth={4} />
          {[-1, 0, 1].map((k) => <ellipse key={k} cx={1360 + k * 26} cy={590} rx={18} ry={52} transform={`rotate(${k * 22} 1360 640)`} fill="#3E8C6A" stroke={INK} strokeWidth={3} />)}
          {[768, 1150].map((x) => <rect key={x} x={x} y={556} width={46} height={160} rx={12} fill="#3A4258" stroke={INK} strokeWidth={4} />)}
        </g>
      );
  }
};

/** In front of the people. */
export const FlatFront: React.FC<{ t: number; p: FlatP }> = ({ p }) => {
  switch (p.kind) {
    case 'stop':
      return (
        <g>
          <path d="M 1062 660 L 1056 720" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <ellipse cx={1060} cy={626} rx={11} ry={36} fill="none" stroke={INK} strokeWidth={9} />
          <ellipse cx={1060} cy={626} rx={11} ry={36} fill="none" stroke="#8A93A0" strokeWidth={4} />
          <rect x={1030} y={738} width={140} height={46} fill="#C24E30" stroke={INK} strokeWidth={4} />
          {[1300, 1900].map((x) => <g key={x}><circle cx={x} cy={786} r={50} fill="#2B2233" stroke={INK} strokeWidth={5} /><circle cx={x} cy={786} r={20} fill="#8A93A0" /></g>)}
        </g>
      );
    case 'cafe':
    case 'office':
      return (
        <g>
          <rect x={p.kind === 'cafe' ? 884 : 940} y={706} width={p.kind === 'cafe' ? 164 : 330} height={18} rx={6} fill={p.kind === 'cafe' ? '#FBF6EC' : '#8A5E44'} stroke={INK} strokeWidth={4} />
          {p.kind === 'cafe' ? <rect x={958} y={724} width={16} height={76} fill="#6E4A36" stroke={INK} strokeWidth={3} /> : <rect x={952} y={724} width={306} height={76} fill="#6E4A36" stroke={INK} strokeWidth={4} />}
          {p.kind === 'cafe' ? <g><rect x={1004} y={684} width={26} height={22} rx={5} fill="#F6EFE3" stroke={INK} strokeWidth={3} /><rect x={900} y={696} width={62} height={10} rx={2} fill="#FFE08A" stroke={INK} strokeWidth={3} /></g> : <rect x={980} y={690} width={70} height={16} rx={3} fill="#F6EFE3" stroke={INK} strokeWidth={3} />}
        </g>
      );
    case 'counter':
      return (
        <g>
          <rect x={990} y={664} width={620} height={24} rx={6} fill="#FBF6EC" stroke={INK} strokeWidth={4} />
          <rect x={1004} y={688} width={600} height={120} fill={p.shelf === 'books' ? '#6E4A36' : '#8A5E44'} stroke={INK} strokeWidth={4} />
          <rect x={1230} y={612} width={84} height={52} rx={8} fill="#3A4258" stroke={INK} strokeWidth={4} />
          <rect x={1244} y={624} width={56} height={22} rx={4} fill="#9FD3C1" />
        </g>
      );
    case 'bus':
      return (
        <g>
          <rect x={846} y={700} width={150} height={26} rx={10} fill="#3F7775" stroke={INK} strokeWidth={4} />
          <rect x={1010} y={700} width={150} height={26} rx={10} fill="#3F7775" stroke={INK} strokeWidth={4} />
        </g>
      );
    default:
      return null;
  }
};
export const SIGN_FONT = FONT.ui;
