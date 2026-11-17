import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Hero, basePose, Pose, Expr, KitDefs, SetDefs, FONT, Look } from '../../engine';
import { EGE, ANNE } from './world';

// The series' model sheet: both characters, every face, the turn, the talking mouth, and the two side by side on a
// height ruler. Render after any change to the rig or the looks, and look at it before anything else:
//   npx remotion still src/index.ts HESheet out/sheet0.png --frame=0   (faces)
//   npx remotion still src/index.ts HESheet out/sheet1.png --frame=1   (turn, talk, heights)

const EXPRS: Expr[] = ['neutral', 'smile', 'happy', 'smug', 'cool', 'shock', 'oops', 'worried', 'tired', 'dizzy'];
const P = (o: Partial<Pose>): Pose => ({ ...basePose, ...o });
const Label: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill="#1D2033" letterSpacing={2}>{text}</text>
);

const Faces: React.FC = () => (
  <g>
    {[EGE, ANNE].map((L: Look, r) => EXPRS.map((e, i) => {
      const x = 105 + i * 190;
      const y = 470 + r * 520;
      return (
        <g key={`${r}${e}`}>
          <Hero look={L} pose={P({ x, y, scale: 1, expr: e, look: i % 3 === 0 ? 0 : i % 3 === 1 ? 0.7 : -0.7 })} shadow={0} rimId="none" />
          <rect x={x - 95} y={y + 20} width={190} height={400} fill="#D8D2C6" />
          <Label x={x} y={y + 52} text={e.toUpperCase()} />
        </g>
      );
    }))}
  </g>
);

const Turn: React.FC = () => {
  const yaws = [-1, -0.6, -0.3, 0, 0.3, 0.6, 1];
  const floor = 520;
  return (
    <g>
      {/* height ruler: feet, hips, shoulders, chin, crown */}
      {[[0, 'FEET'], [112, 'HIPS'], [198, 'SHOULDER'], [302, 'CROWN']].map(([h, n]) => (
        <g key={n as string}>
          <line x1={20} x2={1900} y1={floor - (h as number)} y2={floor - (h as number)} stroke="#1D2033" strokeWidth={1.5} opacity={0.25} strokeDasharray="6 8" />
          <text x={24} y={floor - (h as number) - 6} fontFamily={FONT.ui} fontSize={14} fill="#1D2033" opacity={0.6}>{n as string}</text>
        </g>
      ))}
      {yaws.map((yw, i) => <Hero key={`e${i}`} look={EGE} pose={P({ x: 110 + i * 124, y: floor - 140 * 0.8, scale: 0.8, yaw: yw, facing: yw < 0 ? -1 : 1, look: yw, expr: 'neutral' })} shadow={0.5} rimId="none" />)}
      {yaws.map((yw, i) => <Hero key={`a${i}`} look={ANNE} pose={P({ x: 1060 + i * 124, y: floor - 140 * 0.8, scale: 0.8, yaw: yw, facing: yw < 0 ? -1 : 1, look: yw, expr: 'smile' })} shadow={0.5} rimId="none" />)}
      <Label x={500} y={floor + 60} text="EGE: TURN" />
      <Label x={1420} y={floor + 60} text="ANNE: TURN" />
      {/* talking mouths and blinks */}
      {[0, 0.25, 0.5, 0.75, 1].map((tk, i) => <Hero key={`t${i}`} look={EGE} pose={{ ...P({ x: 130 + i * 170, y: 920, scale: 0.9, expr: i % 2 ? 'worried' : 'neutral' }), talk: tk }} shadow={0} rimId="none" />)}
      {[0, 0.25, 0.5, 0.75, 1].map((tk, i) => <Hero key={`u${i}`} look={ANNE} pose={{ ...P({ x: 1010 + i * 170, y: 920, scale: 0.9, expr: i % 2 ? 'smile' : 'happy', blink: i === 4 ? 1 : i === 3 ? 0.5 : 0 }), talk: tk }} shadow={0} rimId="none" />)}
      <rect x={0} y={945} width={1920} height={140} fill="#D8D2C6" />
      <Label x={470} y={990} text="EGE: TALK 0 / .25 / .5 / .75 / 1" />
      <Label x={1350} y={990} text="ANNE: TALK + BLINK" />
    </g>
  );
};

export const HESheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#D8D2C6' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <KitDefs />
        <SetDefs />
        {f === 0 ? <Faces /> : <Turn />}
      </svg>
    </AbsoluteFill>
  );
};
