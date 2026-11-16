import React from 'react';
import {
  Hero, Pose, basePose, kf, clamp, easeOut, backOut, camT, LOOKS, HEAD, FONT, C,
  Bedroom, Market, Cctv, CctvOverlay, tapeTime, watcherHead, PovHand, Eyelids, Phone, Glow, FocusRings, TapeLines, ShotProps,
} from '../../engine';
import { StreetScene, KitchenPov, MUG, bob } from '../son-insan-01/shots';

// SON İNSAN, bölüm 1, kısa film kurgusu. POV: the camera is his eyes; his own voice tells it. The street, kitchen,
// window, mirror and door shots come from ../son-insan-01/shots; these are the ones this cut adds.

const PIP = LOOKS.pipHood;
const CREAM = '#F6EFE3';

// ---------- B1: half awake through the first line; the eyes open on "Sessizlikti" ----------
export const B1: React.FC<ShotProps> = ({ t, len }) => {
  const open = kf(t, [[0, 0], [8, 0], [18, 0.3], [30, 0.3], [35, 0.04], [44, 0.04], [52, 0.34], [70, 0.34], [84, 1]]);
  return (
    <g>
      <g filter={open < 0.6 ? 'url(#blur6)' : undefined}>
        <g transform={`translate(960 540) rotate(${kf(t, [[0, -12], [80, -12], [150, -3], [len, 0]])}) translate(-960 -540)`}>
          <g transform={camT(kf(t, [[0, 1000], [120, 1000], [len, 1090]]), kf(t, [[0, 490], [120, 530], [len, 500]]), kf(t, [[0, 1.36], [120, 1.16], [len, 1.5]]))}>
            <Bedroom t={t} id="b1" clock="06:02" />
          </g>
        </g>
      </g>
      <Eyelids open={open} />
    </g>
  );
};

// ---------- B2: "Anne?" Sitting up: a look across the room to the door. Nothing answers ----------
export const B2: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={`translate(960 540) rotate(${kf(t, [[0, -2], [14, 0]])}) translate(-960 -540)`}>
    <g transform={camT(kf(t, [[0, 1000], [22, 720], [len, 700]], easeOut), kf(t, [[0, 540], [len, 548]]), kf(t, [[0, 1.16], [len, 1.3]]))}>
      <Bedroom t={t + 213} id="b2" clock="06:02" />
    </g>
  </g>
);

// ---------- B3: "Anne!" The kitchen swings past as he turns for the hall ----------
export const B3: React.FC<ShotProps> = ({ t, len }) => {
  const b = bob(t * 2, 1.4);
  return (
    <g filter={t > 6 && t < 20 ? 'url(#blur6)' : undefined}>
      <g transform={camT(kf(t, [[0, MUG.x + 10], [6, MUG.x + 10], [22, 660], [len, 640]]) + b.x, 560 + b.y, kf(t, [[0, 2.2], [8, 1.5], [len, 1.3]]))}>
        <KitchenPov t={t + 200} id="k3b" />
      </g>
    </g>
  );
};

// ---------- B4: down the street between the cars: as if everyone got out at the same moment and left ----------
export const B4: React.FC<ShotProps> = ({ t, len }) => {
  const b = bob(t, 0.8);
  return (
    <g transform={camT(kf(t, [[0, 930], [len, 968]]) + b.x, kf(t, [[0, 700], [len, 600]]) + b.y, kf(t, [[0, 1.5], [len, 2.5]]))}>
      <StreetScene t={t + 260} id="s4b" />
    </g>
  );
};

// ---------- B5: the supermarket doors part for him; nobody inside ----------
export const B5: React.FC<ShotProps> = ({ t, len }) => {
  const open = kf(t, [[0, 0], [6, 0], [26, 1]], easeOut);
  const b = bob(t, clamp((t - 18) / 10));
  const pane = (x: number, dir: number) => (
    <g transform={`translate(${dir * open * 318} 0)`}>
      <rect x={x} y={-40} width={316} height={1160} fill="#9FD4E8" opacity={0.2} />
      <rect x={x} y={-40} width={316} height={1160} fill="none" stroke="#1E232B" strokeWidth={16} />
      <polygon points={`${x + 40},-40 ${x + 120},-40 ${x + 30},1120 ${x - 50},1120`} fill="#FFFFFF" opacity={0.07} />
      <rect x={dir < 0 ? x + 286 : x + 18} y={470} width={12} height={150} rx={6} fill="#C9CCE0" opacity={0.8} />
    </g>
  );
  return (
    <g>
      <g transform={camT(960 + b.x, 505 + b.y, kf(t, [[0, 1.0], [len, 1.5]]))}>
        <Market t={t} id="m5" />
      </g>
      {pane(644, -1)}
      {pane(960, 1)}
      <rect x={0} y={-40} width={660} height={1160} fill="#12151B" opacity={1 - open} />
      <rect x={1260} y={-40} width={660} height={1160} fill="#12151B" opacity={1 - open} />
    </g>
  );
};

// ---------- B6: the security room: a wall of screens, a hand on the keys ----------
const Screen: React.FC<{ x: number; y: number; w: number; h: number; t: number; on?: number; seed?: number }> = ({ x, y, w, h, t, on = 1, seed = 1 }) => (
  <g>
    <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={10} fill="#0A0C10" />
    <rect x={x} y={y} width={w} height={h} rx={4} fill="#5E7F86" opacity={0.25 + 0.6 * on} />
    <rect x={x} y={y + h * 0.42} width={w} height={h * 0.58} fill="#3E565C" opacity={0.6 * on} />
    <polygon points={`${x},${y + h} ${x + w * 0.22},${y + h * 0.42} ${x + w * 0.3},${y + h * 0.42} ${x + w * 0.16},${y + h}`} fill="#2A3A40" opacity={0.7 * on} />
    <polygon points={`${x + w},${y + h} ${x + w * 0.78},${y + h * 0.42} ${x + w * 0.7},${y + h * 0.42} ${x + w * 0.84},${y + h}`} fill="#2A3A40" opacity={0.7 * on} />
    {Array.from({ length: Math.floor(h / 6) }).map((_, i) => (
      <rect key={i} x={x} y={y + i * 6} width={w} height={2} fill="#000" opacity={0.16} />
    ))}
    <rect x={x} y={y + ((t * 5 + seed * 40) % (h + 20)) - 10} width={w} height={10} fill="#FFFFFF" opacity={0.06} />
  </g>
);
export const B6: React.FC<ShotProps> = ({ t, len }) => {
  const press = t >= 30 && t < 36 ? 1 : 0;
  const on = clamp((t - 34) / 4);
  const z = kf(t, [[0, 1.0], [40, 1.06], [len, 2.3]]);
  const hx = kf(t, [[0, 1130], [22, 990], [30, 972], [36, 972], [48, 1100]], easeOut);
  const hy = kf(t, [[0, 1180], [22, 940], [30, 916 + 0], [33, 928], [36, 916], [48, 1160]], easeOut);
  return (
    <g transform={`translate(960 ${kf(t, [[0, 540], [40, 540], [len, 470]])}) scale(${z}) translate(-960 -540)`}>
      <rect x={-200} y={-300} width={2320} height={1700} fill="#0E1116" />
      <Glow x={960} y={470} r={620} kind="cool" o={0.3 + 0.25 * on} />
      <Screen x={700} y={170} w={250} h={150} t={t} seed={1} on={0.7} />
      <Screen x={970} y={170} w={250} h={150} t={t} seed={2} on={0.7} />
      <Screen x={716} y={352} w={488} h={300} t={t} seed={3} on={0.35 + 0.65 * on} />
      {/* the main screen: paused, then the tape starts */}
      {on < 1 ? (
        <g opacity={0.8 * (1 - on)} fill={CREAM}>
          <rect x={936} y={470} width={16} height={64} rx={3} />
          <rect x={968} y={470} width={16} height={64} rx={3} />
        </g>
      ) : (
        <polygon points="940,468 940,536 994,502" fill={CREAM} opacity={clamp(1 - (t - 40) / 10)} />
      )}
      <text x={736} y={392} fontFamily={FONT.ui} fontSize={20} fill="#E8F2EE" opacity={0.85}>KAM 03</text>
      <text x={736} y={636} fontFamily={FONT.ui} fontSize={22} fill="#E8F2EE" opacity={0.9}>03:16:52</text>
      {/* the desk and its keys */}
      <polygon points="560,760 1360,760 1500,1200 420,1200" fill="#1A1E26" />
      <rect x={560} y={756} width={800} height={6} fill="#7FD4FF" opacity={0.25 + 0.2 * on} />
      <g transform="translate(960 900)">
        <polygon points="-250,-70 250,-70 290,70 -290,70" fill="#0B0D12" />
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 11 }).map((__, c) => {
            const hit = r === 2 && c === 5;
            return <rect key={`${r}-${c}`} x={-236 + c * 43 + r * 3} y={-58 + r * 30} width={36} height={22} rx={4} fill={hit && (press || on > 0) ? '#7FD4FF' : '#2A2F3A'} opacity={hit && on > 0 ? 0.9 : 1} />;
          }),
        )}
      </g>
      <PovHand x={hx} y={hy} fx={1260} fy={1420} s={0.8} rimId="rimBlue" point />
    </g>
  );
};

// ---------- the tape ----------
const Tape: React.FC<{ tau: number; f: number; cx?: number; cy?: number; z?: number; id: string; light?: number; face?: number; soft?: boolean; up?: number; rec?: boolean; children?: React.ReactNode }> = ({
  tau, f, cx = 960, cy = 540, z = 1, id, light = 0, face = 0, soft = false, up = 30, rec = true, children,
}) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#0A0D10" />
    <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
      <Cctv tau={tau} id={id} light={light} face={face} soft={soft} up={up} />
      {children}
    </g>
    <CctvOverlay id={`${id}o`} f={f} time={tapeTime(tau)} rec={rec} />
  </g>
);
const FREEZE = 76; // B7's clock when the word "durdu" lands

// ---------- B7: 03:17. Everyone in the shop stops, mid-step, at once ----------
export const B7: React.FC<ShotProps> = ({ t, len, f }) => {
  const jolt = t >= FREEZE && t < FREEZE + 5 ? Math.sin(t * 3) * 3 : 0;
  return (
    <g transform={`translate(${jolt} 0)`}>
      <Tape tau={t - FREEZE} f={f} id="t7" up={9999} z={kf(t, [[0, 1.0], [len, 1.06]])} cy={kf(t, [[0, 540], [len, 548]])} />
    </g>
  );
};

// ---------- B8: every head comes up, the same way ----------
const UP_AT = 26;
export const B8: React.FC<ShotProps> = ({ t, len, f }) => (
  <Tape tau={50 + t} f={f} id="t8" up={50 + UP_AT} z={kf(t, [[0, 1.5], [len, 1.62]])} cx={kf(t, [[0, 930], [len, 915]])} cy={kf(t, [[0, 640], [len, 620]])} light={clamp((t - UP_AT - 20) / 120) * 0.25} />
);

// ---------- B9: the light they are looking at; then the tape ends ----------
const CUT_AT = 62;
export const B9: React.FC<ShotProps> = ({ t, len, f }) => {
  if (t >= CUT_AT) {
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill="#050608" />
        {t < CUT_AT + 4 ? <rect x={0} y={520} width={1920} height={40 - (t - CUT_AT) * 9} fill="#FFFFFF" opacity={0.9} /> : null}
        <text x={960} y={556} textAnchor="middle" fontFamily={FONT.ui} fontSize={34} letterSpacing={6} fill="#E8F2EE" opacity={Math.floor(t / 10) % 2 ? 0.85 : 0.4}>SİNYAL YOK</text>
        <CctvOverlay id="t9x" f={f} time="--:--:--:--" rec={false} />
      </g>
    );
  }
  return <Tape tau={160 + t} f={f} id="t9" up={0} z={kf(t, [[0, 1.0], [len, 1.1]])} light={0.2 + easeOut(clamp(t / CUT_AT)) * 0.8} />;
};

// ---------- B10: he winds it back ----------
export const B10: React.FC<ShotProps> = ({ t, len, f }) => {
  const tau = kf(t, [[0, 215], [len - 6, 96], [len, 96]]);
  return (
    <g>
      <Tape tau={tau} f={f} id="t10" up={76} z={1.0} light={clamp((tau - 96 - 20) / 120) * 0.25 + clamp((tau - 160) / 62) * 0.8} rec={false} />
      <TapeLines f={f} />
      <g transform="translate(960 300)" opacity={Math.floor(t / 4) % 2 ? 1 : 0.6}>
        <polygon points="-8,-30 -50,0 -8,30" fill={CREAM} />
        <polygon points="44,-30 2,0 44,30" fill={CREAM} />
      </g>
    </g>
  );
};

// ---------- B11: all of them looking up. Except one ----------
const WH = watcherHead();
const Bracket: React.FC<{ x: number; y: number; w: number; h: number; t: number; color?: string; sw?: number }> = ({ x, y, w, h, t, color = '#FF5A4A', sw = 4 }) => {
  const k = backOut(clamp(t / 8));
  if (t <= 0) return null;
  const c = Math.min(w, h) * 0.28;
  const g = (1 - k) * 30;
  const x0 = x - w / 2 - g;
  const x1 = x + w / 2 + g;
  const y0 = y - h / 2 - g;
  const y1 = y + h / 2 + g;
  return (
    <g fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={Math.floor(t / 6) % 2 || t > 18 ? 1 : 0.6}>
      <path d={`M ${x0} ${y0 + c} L ${x0} ${y0} L ${x0 + c} ${y0}`} />
      <path d={`M ${x1 - c} ${y0} L ${x1} ${y0} L ${x1} ${y0 + c}`} />
      <path d={`M ${x1} ${y1 - c} L ${x1} ${y1} L ${x1 - c} ${y1}`} />
      <path d={`M ${x0 + c} ${y1} L ${x0} ${y1} L ${x0} ${y1 - c}`} />
    </g>
  );
};
export const B11: React.FC<ShotProps> = ({ t, len, f }) => {
  const k = easeOut(clamp((t - 14) / 40));
  return (
    <Tape tau={126} f={f} id="t11" up={76} rec={false} z={1 + 1.4 * k} cx={960 + (WH.x + 4 - 960) * k} cy={540 + (WH.y + 40 - 540) * k} light={0.03}>
      <Bracket x={WH.x} y={WH.y + 34} w={86} h={150} t={t - 40} sw={2.5} />
    </Tape>
  );
};

// ---------- B12: closer. He is looking straight into the lens ----------
export const B12: React.FC<ShotProps> = ({ t, len, f }) => (
  <Tape tau={126} f={f} id="t12" up={76} rec={false} soft z={kf(t, [[0, 4.2], [len, 5.6]])} cx={WH.x} cy={WH.y + 8} light={0.03}>
    <Bracket x={WH.x} y={WH.y} w={66} h={66} t={t - 6} sw={1.2} />
  </Tape>
);

// ---------- B13: the picture clears. It is his own face ----------
export const B13: React.FC<ShotProps> = ({ t, len, f }) => {
  const face = t < 4 ? 0 : t < 7 ? 1 : t < 9 ? 0 : 1;
  return (
    <g>
      <Tape tau={126} f={f} id="t13" up={76} rec={false} face={face} z={kf(t, [[0, 5.6], [len, 6.6]])} cx={WH.x} cy={WH.y + 4} light={0.03}>
        <Bracket x={WH.x} y={WH.y} w={66} h={66} t={30} sw={1.2} color={face ? '#7FD4FF' : '#FF5A4A'} />
      </Tape>
      {t >= 4 && t < 6 ? <rect x={0} y={0} width={1920} height={1080} fill="#DDF2FF" opacity={0.35} /> : null}
    </g>
  );
};

// ---------- B14 / B15: the phone. The caller is him ----------
const PhoneInHand: React.FC<{ t: number; ring: number; live?: boolean; talk?: number }> = ({ t, ring, live = false, talk = 0 }) => {
  const w = 300;
  const h = w * 2.05;
  const px = 960;
  const py = 560;
  return (
    <g>
      <rect x={-200} y={-300} width={2320} height={1700} fill="#0C0F14" />
      <polygon points="300,-200 1620,-200 1500,260 420,260" fill="#151A22" />
      <Glow x={960} y={90} r={520} kind="cool" o={0.22} />
      <PovHand x={px + 30} y={py + 250} fx={1190} fy={1420} s={1.25} rimId="rimBlue" />
      <Phone x={px} y={py} w={w} rot={-3} on={1} caller="BEN" buzz={ring} f={t} />
      <g transform={`translate(${px} ${py}) rotate(-3)`}>
        {/* his own picture where the caller's would be */}
        <circle cx={0} cy={-h * 0.19} r={w * 0.27} fill="#3C5484" />
        <circle cx={0} cy={-h * 0.18} r={w * 0.2} fill={PIP.jacket} stroke={PIP.line} strokeWidth={5} />
        <circle cx={0} cy={-h * 0.175} r={w * 0.155} fill={C.skin} />
        <circle cx={-w * 0.055} cy={-h * 0.18} r={6} fill={C.ink} />
        <circle cx={w * 0.055} cy={-h * 0.18} r={6} fill={C.ink} />
        <path d={`M ${-w * 0.04} ${-h * 0.145} L ${w * 0.04} ${-h * 0.145}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        {live ? (
          <g>
            <rect x={-w * 0.4} y={h * 0.1} width={w * 0.8} height={h * 0.32} fill="#2C3A5E" />
            {Array.from({ length: 15 }).map((_, i) => {
              const a = (0.15 + 0.85 * Math.abs(Math.sin(t * 0.9 + i * 1.7) * Math.sin(t * 0.37 + i))) * talk;
              return <rect key={i} x={-w * 0.33 + i * w * 0.047 - 4} y={h * 0.2 - a * 46} width={8} height={Math.max(6, a * 92)} rx={4} fill="#7FD4FF" />;
            })}
            <text x={0} y={h * 0.37} textAnchor="middle" fontFamily={FONT.ui} fontSize={30} fill={CREAM} opacity={0.8}>{`00:0${Math.min(9, Math.floor(t / 30))}`}</text>
          </g>
        ) : null}
      </g>
    </g>
  );
};
export const B14: React.FC<ShotProps> = ({ t, len }) => {
  const ring = (t > 8 && t < 34) || (t > 46 && t < 70) ? 1 : 0;
  const rise = easeOut(clamp(t / 12));
  return (
    <g transform={`translate(0 ${(1 - rise) * 700}) translate(960 540) scale(${kf(t, [[0, 0.96], [len, 1.04]])}) translate(-960 -540)`}>
      <PhoneInHand t={t} ring={ring} />
      {t > len - 8 ? <circle cx={960 + 66} cy={560 + 196} r={44} fill="#4CC774" opacity={0.5} /> : null}
    </g>
  );
};
export const B15: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={`translate(960 540) scale(${kf(t, [[0, 1.04], [len, 1.16]])}) translate(-960 -540)`}>
    <PhoneInHand t={t} ring={0} live talk={t > 2 && t < 60 ? 1 : 0.06} />
  </g>
);

// ---------- B16: three knocks on the door behind him. Under it, two shadows where feet would be ----------
const KNOCKS = [12, 21, 30];
export const B16: React.FC<ShotProps> = ({ t, len }) => {
  const hit = KNOCKS.map((k) => (t >= k && t < k + 6 ? Math.sin((t - k) * 2.6) * 9 * (1 - (t - k) / 6) : 0)).reduce((a, b) => a + b, 0);
  const whip = easeOut(clamp(t / 5));
  return (
    <g transform={`translate(${(1 - whip) * 500 + hit * 0.4} 0) translate(960 540) scale(${kf(t, [[0, 1.0], [len, 1.22]])}) translate(-960 -560)`}>
      <rect x={-400} y={-300} width={2720} height={1700} fill="#0D1015" />
      <rect x={-400} y={968} width={2720} height={500} fill="#090B0F" />
      <g transform={`translate(${hit} 0)`}>
        <rect x={746} y={150} width={428} height={822} fill="#06080B" />
        <rect x={760} y={164} width={400} height={806} fill="#1B2028" />
        <rect x={792} y={200} width={336} height={330} fill="#161A21" />
        <rect x={792} y={570} width={336} height={360} fill="#161A21" />
        <rect x={1106} y={540} width={34} height={12} rx={6} fill="#8A93A0" />
      </g>
      {/* the light under the door, and what stands in it */}
      <rect x={760} y={970} width={400} height={9} fill="#FFE2B0" opacity={0.9} />
      <rect x={880} y={970} width={58} height={9} fill="#0D1015" />
      <rect x={984} y={970} width={58} height={9} fill="#0D1015" />
      <Glow x={960} y={985} r={260} o={0.3} />
      {KNOCKS.map((k) => (
        <g key={k} transform="translate(960 470) scale(0.9)">
          <FocusRings x={0} y={0} t={t - k} r0={36} color="#E8F2EE" />
        </g>
      ))}
    </g>
  );
};

// ---------- B17: the end card ----------
export const B17: React.FC<ShotProps> = ({ t }) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#000" />
    <g opacity={clamp((t - 6) / 8)}>
      <text x={960} y={520} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={76} fill={CREAM} letterSpacing={4}>SON İNSAN</text>
      <text x={960} y={590} textAnchor="middle" fontFamily={FONT.ui} fontSize={30} fill={CREAM} letterSpacing={8} opacity={0.7}>DEVAMI 2. BÖLÜMDE</text>
    </g>
  </g>
);
