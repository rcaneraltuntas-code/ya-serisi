import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { KitDefs, SetDefs, FONT } from '../../engine';
import { CoverScene, coverPlace, COVER_C_OFF } from './kit07';

// The covers of 07.00: one frame per episode (frame 0 = episode 1). 1080x1920; what matters sits inside the middle
// 3:4 (the profile grid crops to it): the series mark, the episode's sentence, the faces, the episode number.
//   npx remotion still src/index.ts HECover out/cover-07.png --frame=6

const KITCHEN = { kind: 'kitchen' };
const KITCHEN_N = { kind: 'kitchen', night: true };
const STREET = { kind: 'street', sign: ['FIRIN', 'BAKERY'] };
const STOP = { kind: 'stop', sign: ['MERKEZ', 'CITY CENTRE'], sign2: ['DURAK', 'BUS STOP'] };
const BUS = { kind: 'bus' };
const CAFE = { kind: 'cafe', sign: ['MENÜ', 'MENU'] };
const CAFEBAR = { kind: 'counter', sign: ['KASA', 'ORDER HERE'], wall: '#2F5957', shelf: 'cups' };
const CLASS = { kind: 'class', sign: ['DERS', 'LESSON'] };
const CANTEEN = { kind: 'counter', sign: ['KANTİN', 'CANTEEN'], wall: '#7A4A3A', shelf: 'food' };
const CAMPUS = { kind: 'street', sign: ['KAMPÜS', 'CAMPUS'] };
const LIB = { kind: 'counter', sign: ['KÜTÜPHANE', 'LIBRARY'], wall: '#6B5A4A', shelf: 'books' };
const ROOF = { kind: 'corridor', sign: ['ÇATI', 'ROOF'], wall: '#6F7C8C' };
const OFFICE = { kind: 'office', sign: ['GÖRÜŞME', 'INTERVIEW'] };
const PARK = { kind: 'park' };

type C = { phrase: string; P: any; speak?: string | null; focus?: 'a' | 'b' };
const X = (e: string) => [[0, e]];
export const COVERS: C[] = [
  { phrase: 'Breakfast is ready.', P: { set: KITCHEN, b: 'anne', bAct: 'pot', ax: X('shock'), bx: X('happy') }, speak: 'anne' },
  { phrase: 'Thank you!', P: { set: KITCHEN, b: 'anne', bAct: 'pot', ax: X('happy'), bx: X('happy') }, speak: 'ege' },
  { phrase: 'How are you?', P: { set: STREET, b: 'hasan', bAct: 'can', ax: X('worried'), bx: X('happy') }, speak: 'hasan' },
  { phrase: 'Where to?', P: { set: STOP, b: 'driver', bAct: 'wheel', ax: X('worried'), bx: X('neutral') }, speak: 'driver' },
  { phrase: "I'm on loop 214.", P: { set: BUS, b: null, aAct: 'phone', ax: X('shock') }, focus: 'a' },
  { phrase: "You're late. Again.", P: { set: CAFE, b: 'defne', bAct: 'write', ax: X('worried'), bx: X('cool') }, speak: 'defne' },
  { phrase: 'A tea, please.', P: { set: CAFEBAR, b: 'barista', bAct: 'cup', ax: X('smile'), bx: X('happy') }, speak: 'ege' },
  { phrase: "That's page twenty.", P: { set: CLASS, b: 'teacher', bAct: 'book', aAct: 'book', ax: X('oops'), bx: X('neutral') }, speak: 'teacher' },
  { phrase: 'Can you repeat that, please?', P: { set: CLASS, b: 'teacher', bAct: 'book', aAct: 'book', ax: X('worried'), bx: X('smile') }, speak: 'ege' },
  { phrase: 'Cash or card?', P: { set: CANTEEN, b: 'clerk', ax: X('worried'), bx: X('smile') }, speak: 'clerk' },
  { phrase: 'Go straight, then turn left.', P: { set: CAMPUS, b: 'barista', bAct: 'cup', ax: X('worried'), bx: X('smile') }, speak: 'barista' },
  { phrase: 'Where are you?', P: { set: LIB, b: 'clerk', bAct: 'book', aAct: 'phone', ax: X('oops'), bx: X('worried') } },
  { phrase: 'Stop right there!', P: { set: ROOF, b: 'guard', ax: X('shock'), bx: X('smug') }, speak: 'guard' },
  { phrase: 'It was you.', P: { set: CAFE, b: 'defne', ax: X('worried'), bx: X('tired') }, speak: 'ege' },
  { phrase: "I'm scared.", P: { set: CAFE, b: 'defne', ax: X('worried'), bx: X('worried') }, speak: 'defne', focus: 'b' },
  { phrase: 'Mistakes are okay.', P: { set: PARK, b: 'defne', ax: X('smile'), bx: X('worried') }, speak: 'ege' },
  { phrase: 'Tell me about yourself.', P: { set: OFFICE, a: 'defne', b: 'boss', ax: X('shock'), bx: X('neutral') }, speak: 'boss' },
  { phrase: 'Nice to meet you.', P: { set: KITCHEN_N, b: 'anne', c: 'defne', ax: X('happy'), bx: X('happy'), cx: X('smile') }, speak: 'anne' },
  { phrase: 'What did you learn today?', P: { set: KITCHEN_N, b: 'defne', aAct: 'phone', ax: X('shock'), bx: X('worried') } },
  { phrase: 'Level 1 complete.', P: { set: KITCHEN, b: 'anne', bAct: 'pot', ax: X('happy'), bx: X('happy') }, focus: 'a' },
];

const INK = '#161422';
const wrap = (s: string, n: number): string[] => {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(' ')) {
    if (cur && (cur + ' ' + w).length > n) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
};

const Cover: React.FC<{ n: number }> = ({ n }) => {
  const c = COVERS[n - 1];
  const pl = coverPlace(c.P.set);
  const sa = pl.a.scale;
  const sb = pl.b.scale;
  const ha = { x: pl.a.x, y: pl.a.y - 176 * sa };
  const hb = { x: pl.b.x, y: pl.b.y - 176 * sb };
  // where the faces go on the cover: centred, their eyes a little under the middle
  let mx: number;
  let hy: number;
  let z: number;
  if (c.focus === 'a' || !c.P.b) { mx = ha.x + 8; hy = ha.y - 6; z = 2.05; }
  else if (c.focus === 'b') { mx = hb.x - 8; hy = hb.y - 6; z = 2.05; }
  else {
    const l = c.P.c ? ha.x - (COVER_C_OFF + 78) * sa : ha.x - 78 * sa;
    const r = hb.x + 84 * sb;
    mx = (l + r) / 2;
    hy = (ha.y + hb.y) / 2;
    z = Math.min(1.85, 600 / (r - l));
  }
  const SY = c.focus || !c.P.b ? 690 : 668; // screen y of the heads' centre line
  const cam = { transform: `translate(960 ${SY}) scale(${z.toFixed(4)}) translate(${(-mx).toFixed(2)} ${(-hy).toFixed(2)})`, cx: mx, cy: hy + (540 - SY) / z, z };
  const lines = wrap(c.phrase, c.phrase.length > 20 ? 15 : 13);
  const longest = Math.max(...lines.map((l) => l.length));
  const fs = Math.min(92, 1040 / Math.max(8, longest), lines.length > 2 ? 62 : 92);
  const top = 256;
  const lh = fs * 1.04;
  return (
    <g>
      <CoverScene P={{ ...c.P, noSign: true }} speak={c.speak ?? null} cam={cam} id={`cv${n}`} />
      <defs>
        <linearGradient id={`cvt${n}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B0D1A" stopOpacity="0.96" />
          <stop offset="0.72" stopColor="#0B0D1A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0B0D1A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`cvb${n}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B0D1A" stopOpacity="0" />
          <stop offset="0.36" stopColor="#0B0D1A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0B0D1A" stopOpacity="0.97" />
        </linearGradient>
      </defs>
      <rect x={640} y={0} width={640} height={top + lines.length * lh + 70} fill={`url(#cvt${n})`} />
      <rect x={640} y={770} width={640} height={310} fill={`url(#cvb${n})`} />
      {/* the series mark: the alarm clock's face */}
      <g transform="translate(960 196)">
        <rect x={-92} y={-27} width={184} height={54} rx={27} fill="#1D2230" stroke="#3A4258" strokeWidth={2.5} />
        <circle cx={-62} cy={0} r={7} fill="#FF5A4A" />
        <text x={12} y={12} textAnchor="middle" fontFamily={FONT.ui} fontSize={34} fill="#FF8A7A" letterSpacing={3}>07:00</text>
      </g>
      {lines.map((l, i) => (
        <text key={i} x={960} y={top + fs * 0.82 + i * lh} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={fs} fill="#FFD25E" stroke={INK} strokeWidth={fs * 0.16} paintOrder="stroke" strokeLinejoin="round">{l}</text>
      ))}
      <g transform="translate(960 892)">
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={n === 20 ? 48 : 58} fill="#FFFFFF" stroke={INK} strokeWidth={9} paintOrder="stroke" strokeLinejoin="round" letterSpacing={2}>{n === 20 ? 'BÖLÜM 20 · FİNAL' : `BÖLÜM ${n}`}</text>
      </g>
    </g>
  );
};

export const HECover: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#0B0D1A' }}>
      <svg width={1080} height={1920} viewBox="656 0 608 1080">
        <KitDefs />
        <SetDefs />
        <Cover n={Math.min(20, f + 1)} />
      </svg>
    </AbsoluteFill>
  );
};
