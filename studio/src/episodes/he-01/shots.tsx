import React from 'react';
import { Hero, Pose, basePose, poseAt, faceAt, kf, clamp, lerp, easeOut, easeInOut, backOut, walkPose, Plate, Glow, AlarmClock, PovHand, FONT, LEG_LEN, ShotProps } from '../../engine';
import { camAt, alive, handAt, Whip, CamKey } from '../herkes/act';
import { EGE, ANNE, FlipWord, Bedroom, BedFront, BED_SIT, CLOCK_AT, Hall, HALL, Kitchen2, Table, tableTop, kitSpot, CARTON } from '../herkes/world';

// HERKES İNGİLİZCE, bölüm 1: "Kahvaltı". Three places, keyed by hand.
//   a  bedroom   the alarm, the slap, the yawn: an ordinary morning
//   b  hall      he walks to the kitchen saying her line before she can
//   c  hall      her voice from the kitchen door, in English; he stops with one foot in the air; her shadow
//   d  hall      the day board beside him turns over, letter by letter: PAZARTESİ -> MONDAY
//   e  kitchen   "Anne?" She slides the plate down the table; the milk carton reads MILK now
//   f  kitchen   close on her: the smile holds, the eyes open
//   g  phone     the sender's name turns English too; then the message
//   h  kitchen   he looks up; she has come along the table without a sound
// Places hold for the whole part: she stands behind the table's right half, he at its left end; the plate ends in
// front of him; the carton stays put and stays English once it has turned.

type Marks = { L: [number, number][]; N: [number, number][]; cut: Record<string, number> };
const at = (s: { x: number; y: number; scale: number }): Partial<Pose> => ({ x: s.x, y: s.y, scale: s.scale });
const M0 = kitSpot(0.62, 0.33); // her place behind the table
const E0 = kitSpot(0.37, 0.33); // his
const PLATE_A = tableTop(0.6, 0.18);
const PLATE_B = tableTop(0.39, 0.3);
const HALL_HIP = HALL.floor - LEG_LEN;
const STOP_X = 884; // where he freezes in the hall

const KitchenScene: React.FC<{ t: number; id: string; cam: { transform: string }; people: React.ReactNode; top?: React.ReactNode; dark?: number; milk?: number; t0?: number }> = ({ t, id, cam, people, top, dark = 0, milk = -999, t0 = 0 }) => (
  <g>
    <g transform={cam.transform}>
      <Kitchen2 t={t + t0} id={id} />
      {people}
      <Table label={<FlipWord x={CARTON.x} y={CARTON.y + 39} from="SÜT" to="MILK" t={t} at={milk} size={15} card="#4F8F8C" every={3} />}>{top}</Table>
    </g>
    {dark > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#0B0714" opacity={dark} /> : null}
  </g>
);

export const make = (m: Marks): Record<string, React.FC<ShotProps>> => {
  const rel = (frame: number, shot: string) => frame - m.cut[shot];

  // a · The alarm. A hand comes out of the duvet and flattens it. He sits up, yawns, scratches his head.
  const a: React.FC<ShotProps> = ({ t, len }) => {
    const SLAP = 34;
    const ring = t < SLAP;
    const kicks: [number, number][] = [[SLAP, 9]];
    for (let k = 0; k < SLAP; k += 5) kicks.push([k, 2.2]);
    const keys: CamKey[] = [[0, CLOCK_AT.x - 10, CLOCK_AT.y - 34, 3.3, 4], [SLAP + 2, CLOCK_AT.x - 16, CLOCK_AT.y - 30, 3.05, 3], [SLAP + 12, BED_SIT.x + 46, BED_SIT.y - 118, 1.85, 0, 'out'], [len, BED_SIT.x + 34, BED_SIT.y - 132, 2.25, -1.2]];
    const cam = camAt(t, keys, 0.7, 1, kicks);
    const rise = backOut(clamp((t - 42) / 12));
    const face = faceAt(t, [[0, 'tired'], [104, 'neutral'], [124, 'smug']]);
    const me = alive({
      ...poseAt(t, [
        { f: 42, p: { ...at(BED_SIT), y: BED_SIT.y + 130, tilt: -10, headTilt: -8, blink: 1, armL: { a: 20, b: -10 }, armR: { a: 20, b: -10 } } },
        { f: 54, p: { y: BED_SIT.y, tilt: 0, headTilt: 6 }, ease: backOut },
        { f: 62, p: { armL: { a: 20, b: -10 }, armR: { a: 20, b: -10 }, headTilt: 4 } },
        { f: 74, p: { armL: { a: 152, b: 24 }, armR: { a: 158, b: -16 }, tilt: -5, headTilt: -10, squash: -0.04 }, ease: easeOut },
        { f: 90, p: { armL: { a: 158, b: 32 }, armR: { a: 150, b: -8 }, tilt: 4, headTilt: -7, squash: -0.05 } },
        { f: 102, p: { armL: { a: 18, b: -10 }, armR: { a: 150, b: -128 }, tilt: 0, headTilt: 9, squash: 0 }, ease: easeInOut },
        { f: 120, p: { armR: { a: 150, b: -128 }, headTilt: 9 } },
        { f: 130, p: { armR: { a: 16, b: -10 }, headTilt: 0, yaw: 0.45, look: 1 }, ease: easeInOut },
      ]),
      ...face,
      blink: t < 100 ? 1 : 0,
    }, t, 5, { noBlink: t < 104 });
    // scratching: the hand at his head jiggles
    if (t >= 102 && t < 122) me.armR = { a: 150 + Math.sin(t * 1.3) * 5, b: -128 + Math.cos(t * 1.3) * 6 };
    const arm = clamp((t - 24) / 9) * (1 - clamp((t - 38) / 6));
    const lumpAt = { x: BED_SIT.x - 6, y: BED_SIT.y - 30 };
    const hand = { x: lerp(lumpAt.x + 110, CLOCK_AT.x - 4, easeOut(arm)), y: lerp(lumpAt.y, CLOCK_AT.y - 44 + (t >= SLAP ? 14 : 0), easeOut(arm)) };
    const sq = t >= SLAP && t < SLAP + 8 ? 0.35 * Math.exp(-(t - SLAP) / 3) : 0;
    return (
      <Whip id="heaw" on={t > SLAP + 2 && t < SLAP + 11 ? Math.sin((Math.PI * (t - SLAP - 2)) / 9) : 0}>
        <g transform={cam.transform}>
          <Bedroom t={t} id="hea" />
          {t >= 42 ? <Hero look={EGE} pose={me} rimId="rimR" shadow={0} /> : null}
          <BedFront lump={1 - rise} />
          {arm > 0.02 ? (
            <g>
              <path d={`M ${lumpAt.x + 96} ${lumpAt.y + 4} Q ${(lumpAt.x + hand.x) / 2 + 40} ${lumpAt.y - 70} ${hand.x} ${hand.y}`} stroke="#161422" strokeWidth={30} fill="none" strokeLinecap="round" />
              <path d={`M ${lumpAt.x + 96} ${lumpAt.y + 4} Q ${(lumpAt.x + hand.x) / 2 + 40} ${lumpAt.y - 70} ${hand.x} ${hand.y}`} stroke={EGE.jacket} strokeWidth={22} fill="none" strokeLinecap="round" />
              <ellipse cx={hand.x} cy={hand.y} rx={20} ry={15} fill={EGE.hand} stroke="#161422" strokeWidth={4} />
            </g>
          ) : null}
          <g transform={`translate(${CLOCK_AT.x + (ring ? Math.sin(t * 2.9) * 4 : 0)} ${CLOCK_AT.y}) rotate(${ring ? Math.sin(t * 2.3) * 5 : 0}) scale(${1 + sq * 0.5} ${1 - sq})`}>
            <AlarmClock x={0} y={0} s={0.3} text="07:00" on={ring ? (Math.floor(t / 4) % 2 ? 1 : 0.5) : 1} />
            {ring ? [-1, 1].map((k) => <path key={k} d={`M ${k * 46} -40 q ${k * 12} -10 ${k * 6} -24 M ${k * 56} -30 q ${k * 16} -8 ${k * 12} -26`} stroke="#FFE08A" strokeWidth={4} fill="none" strokeLinecap="round" opacity={Math.floor(t / 3) % 2 ? 1 : 0.3} />) : null}
          </g>
        </g>
      </Whip>
    );
  };

  // b · Down the hall, saying it for her: finger up, every word on a step. The camera walks with him.
  const walkX = (t: number) => 600 + t * 7.4;
  const b: React.FC<ShotProps> = ({ t, len }) => {
    const x = walkX(t);
    const cam = camAt(t, [[0, x + 60, 590, 1.55, -1.2, 'lin'], [len, walkX(len) + 60, 588, 1.6, -0.6, 'lin']], 0.9, 2);
    const me = { ...walkPose(x, t * 0.62, HALL.floor, 1, { yaw: 0.6, expr: 'smug', look: 0.4 }, 1), armR: { a: 100, b: 64 + 16 * Math.sin(t * 0.95) }, handR: 'point' as const, headTilt: 6 * Math.sin(t * 0.5) };
    return (
      <g transform={cam.transform}>
        <Hall t={t} board={<FlipWord x={HALL.board.x} y={HALL.board.y + 14} from="PAZARTESİ" to="MONDAY" t={t} at={999} size={34} />}>
          <Hero look={EGE} pose={me} rimId="rimR" shadow={0.7} />
        </Hall>
      </g>
    );
  };

  // c · Her voice from the kitchen. He stops with one foot in the air. Her shadow comes out across the floor.
  const c: React.FC<ShotProps> = ({ t, len }) => {
    const say = rel(m.N[0][0], 'c');
    const x0 = walkX(m.cut.c - m.cut.b);
    const x = Math.min(STOP_X, x0 + t * 7.4);
    const stopAt = Math.max(1, Math.round((STOP_X - x0) / 7.4));
    const cam = camAt(t, [[0, x0 + 80, 596, 1.5, -0.6], [say + 4, 1060, 610, 1.02, 0, 'out'], [len, 1090, 604, 1.1, -2.2]], 0.8, 3, [[say, 4]]);
    const walking = t < stopAt;
    const face = faceAt(t, [[0, 'smug'], [say + 3, 'shock']]);
    const me: Pose = walking
      ? { ...walkPose(x, (m.cut.c - m.cut.b + t) * 0.62, HALL.floor, 1, { yaw: 0.6, expr: 'smug', look: 0.4 }, 1), armR: { a: 100, b: 64 + 16 * Math.sin(t * 0.95) }, handR: 'point' as const }
      : alive({
          ...poseAt(t, [
            { f: stopAt, p: { x: STOP_X, y: HALL_HIP, scale: 1, facing: 1, yaw: 0.6, look: 0.4, tilt: 5, legR: { a: 34, b: -62 }, legL: { a: -6, b: 0 }, armR: { a: 100, b: 66 }, handR: 'point', armL: { a: -20, b: 20 } } },
            { f: say + 2, p: { tilt: 5 } },
            { f: say + 8, p: { tilt: -7, headTilt: -6, yaw: 1, look: 1, squash: -0.03 }, ease: easeOut },
            { f: say + 14, p: { tilt: -4, squash: 0 } },
            { f: len, p: { tilt: -5, legR: { a: 30, b: -66 } } },
          ]),
          ...face,
        }, t, 5, { calm: 0.3 });
    // balancing on one leg: a wobble that grows
    if (!walking) me.tilt += Math.sin(t * 0.5) * 1.6 * clamp((t - say - 14) / 30);
    return (
      <g transform={cam.transform}>
        <Hall t={t} shadow={kf(t, [[say - 2, 0], [say + 34, 0.75], [len, 0.95]])} board={<FlipWord x={HALL.board.x} y={HALL.board.y + 14} from="PAZARTESİ" to="MONDAY" t={t} at={999} size={34} />}>
          <Hero look={EGE} pose={me} rimId="rimR" shadow={0.7} />
        </Hall>
      </g>
    );
  };

  // d · Beside his head the day board turns itself over. He watches the last letter fall.
  const d: React.FC<ShotProps> = ({ t, len }) => {
    const FLIP = 14;
    const hy = HALL_HIP - 176;
    const cam = camAt(t, [[0, STOP_X + 6, hy + 4, 2.3, 0], [FLIP - 2, STOP_X + 6, hy, 2.4, 0], [FLIP + 8, HALL.board.x, HALL.board.y + 10, 2.3, 0, 'out'], [FLIP + 36, HALL.board.x, HALL.board.y + 10, 2.45, 0], [FLIP + 52, 962, 420, 1.62, 1.6], [len, 958, 424, 1.72, 2.2]], 0.8, 4, [[FLIP + 34, 3]]);
    const face = faceAt(t, [[0, 'shock'], [FLIP + 44, 'worried']]);
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: { x: STOP_X, y: HALL_HIP, scale: 1, facing: 1, yaw: 1, look: 1, tilt: -5, legR: { a: 30, b: -66 }, legL: { a: -6, b: 0 }, armR: { a: 100, b: 66 }, handR: 'point', armL: { a: -20, b: 20 } } },
        { f: 12, p: { legR: { a: 5, b: 0 }, legL: { a: -5, b: 0 }, tilt: -2 }, ease: easeInOut },
        { f: FLIP + 20, p: { armR: { a: 100, b: 66 } } },
        { f: FLIP + 30, p: { yaw: 0.25, look: 1, headTilt: -16, armR: { a: 70, b: 50 } }, ease: easeInOut },
        { f: FLIP + 56, p: { armR: { a: 14, b: -10 }, handR: 'open', armL: { a: 14, b: -10 } }, ease: easeInOut },
        { f: FLIP + 62, p: { squash: 0.04 } },
        { f: FLIP + 68, p: { squash: 0 } },
      ]),
      ...face,
    }, t, 5, { calm: 0.5 });
    return (
      <g transform={cam.transform}>
        <Hall t={t} shadow={0.95} board={<FlipWord x={HALL.board.x} y={HALL.board.y + 14} from="PAZARTESİ" to="MONDAY" t={t} at={FLIP} size={34} every={2.6} />}>
          <Hero look={EGE} pose={me} rimId="rimR" shadow={0.7} />
        </Hall>
      </g>
    );
  };

  // e · The kitchen. He edges in along the table. She pours, smiles, and slides the plate down to him.
  const e: React.FC<ShotProps> = ({ t, len }) => {
    const say = rel(m.N[1][0], 'e');
    const said = say + (m.N[1][1] - m.N[1][0]);
    const push = say + 2;
    const cam = camAt(t, [[0, E0.x - 60, E0.y - 110, 1.6, 0], [24, 950, 588, 1.2, -0.6], [push + 4, 990, 592, 1.3, 0.4], [push + 20, 930, 600, 1.3, 0], [len, 952, 590, 1.22, 1.2]], 0.7, 5, [[push + 15, 3]]);
    const inK = easeInOut(clamp(t / 22));
    const s0 = kitSpot(lerp(0.2, 0.37, inK), 0.33);
    const face = faceAt(t, [[0, 'worried'], [push + 22, 'shock'], [push + 50, 'worried']]);
    const me: Pose = t < 22
      ? { ...walkPose(s0.x, t * 0.55, s0.floor, s0.scale, { yaw: 0.5, look: 1, expr: 'worried', tilt: 2 }, 1), armL: { a: 10, b: -8 }, armR: { a: 30, b: 30 } }
      : alive({
          ...poseAt(t, [
            { f: 22, p: { ...at(E0), yaw: 0.6, look: 1, tilt: 6, armR: { a: 30, b: 30 }, armL: { a: 10, b: -8 } } },
            { f: push + 10, p: { tilt: 4 } },
            { f: push + 20, p: { tilt: -3, headTilt: 12, look: 0.3, yaw: 0.3 }, ease: easeOut },
            { f: push + 48, p: { tilt: -1, headTilt: 0, look: 1, yaw: 0.6 }, ease: easeInOut },
          ]),
          ...face,
        }, t, 5, { talk: [[rel(m.L[3][0], 'e'), rel(m.L[3][1], 'e')]], calm: 0.6 });
    const pour = 1 - clamp((t - 14) / 10);
    const mom = alive({
      ...poseAt(t, [
        { f: 0, p: { ...at(M0), yaw: -0.25, look: -0.4, expr: 'happy', armR: { a: 70, b: 60 }, armL: { a: 30, b: -40 }, tilt: -3 } },
        { f: 14, p: { armR: { a: 70, b: 60 }, tilt: -3 } },
        { f: 24, p: { armR: { a: 24, b: -14 }, armL: { a: 60, b: 10 }, yaw: -0.4, look: -1, tilt: -2 }, ease: easeInOut },
        { f: push, p: { armL: { a: 64, b: 6 }, tilt: -3 } },
        { f: push + 14, p: { armL: { a: 98, b: -6 }, tilt: -12, headTilt: -6 }, ease: easeOut },
        { f: push + 32, p: { armL: { a: 26, b: -14 }, tilt: -6, headTilt: -12 }, ease: easeInOut },
        { f: len, p: { tilt: -7, headTilt: -15 } },
      ]),
    }, t, 2, { talk: [[say, said]], noBlink: true });
    const slide = easeOut(clamp((t - push) / 15));
    const wob = t > push + 15 ? Math.sin((t - push - 15) * 1.6) * 2 * Math.exp(-(t - push - 15) / 5) : 0;
    const plate = { x: lerp(PLATE_A.x, PLATE_B.x, slide), y: lerp(PLATE_A.y, PLATE_B.y, slide) + wob };
    const pot = handAt(mom, 'armR');
    return (
      <KitchenScene t={t} id="hee" t0={325} cam={cam} milk={push + 20}
        people={<g><Hero look={ANNE} pose={mom} rimId="rimL" shadow={0.4} /><Hero look={EGE} pose={me} rimId="rimR" shadow={0.4} /></g>}
        top={
          <g>
            <Plate x={plate.x} y={plate.y} s={0.6} />
            {pour > 0 ? (
              <g transform={`translate(${pot.x - 6} ${pot.y - 4}) rotate(${-28 * pour})`} opacity={clamp(pour * 3)}>
                <rect x={-30} y={-26} width={52} height={40} rx={10} fill="#3F7775" stroke="#161422" strokeWidth={4} />
                <path d="M -30 -14 l -22 -8 l 4 10 Z" fill="#3F7775" stroke="#161422" strokeWidth={4} strokeLinejoin="round" />
                <rect x={-14} y={-36} width={20} height={10} rx={4} fill="#E0A63A" stroke="#161422" strokeWidth={3} />
              </g>
            ) : null}
          </g>
        } />
    );
  };

  // f · Close on her. The smile holds, and then the eyes open.
  const f: React.FC<ShotProps> = ({ t, len }) => {
    const hy = M0.y - 172 * M0.scale;
    const cam = camAt(t, [[0, M0.x - 12, hy + 10, 3.2, 0], [len, M0.x - 18, hy, 4.5, 6]], 0.5, 6);
    const face = faceAt(t, [[0, 'happy'], [34, 'neutral']]);
    const mom = { ...alive({ ...basePose, ...at(M0), yaw: -0.3, look: -1, tilt: -7, headTilt: kf(t, [[0, -15], [len, -19]]), armR: { a: 24, b: -14 }, armL: { a: 26, b: -14 } }, t, 2, { noBlink: true, calm: 0.3 }), ...face };
    const flick = t >= 30 && t < 38 ? 0.16 * Math.abs(Math.sin(t * 2.3)) : 0;
    return <KitchenScene t={t} id="hef" t0={440} cam={cam} milk={-99} dark={kf(t, [[0, 0.04], [len, 0.3]]) + flick} people={<Hero look={ANNE} pose={mom} rimId="rimL" shadow={0.4} />} top={<Plate x={PLATE_B.x} y={PLATE_B.y} s={0.6} />} />;
  };

  // g · Under the table, his phone. Even the sender's name has turned. Then the message.
  const g: React.FC<ShotProps> = ({ t, len }) => {
    const MSG = 36;
    const rise = easeOut(clamp(t / 9));
    const pop = backOut(clamp((t - MSG) / 7));
    const buzz = (t >= 2 && t < 12) || (t >= MSG - 2 && t < MSG + 6) ? Math.sin(t * 3.1) * 5 : 0;
    const cam = camAt(t, [[0, 960, 600, 1.0, -5], [MSG, 960, 560, 1.08, -3], [len, 960, 520, 1.22, -1]], 0.9, 8, [[MSG, 5]]);
    return (
      <g>
        <g filter="url(#blur16)"><g transform="translate(960 540) scale(1.5) translate(-860 -640)"><Kitchen2 t={t + 500} id="heg" /><Table /></g></g>
        <rect x={0} y={0} width={1920} height={1080} fill="#0B0714" opacity={0.62} />
        <g transform={cam.transform}>
          <g transform={`translate(${buzz} ${(1 - rise) * 520})`}>
            <PovHand x={1020} y={920} fx={1270} fy={1530} s={1.35} rimId="rimBlue" look={EGE} />
            <rect x={738} y={176} width={444} height={760} rx={54} fill="#0A0C12" stroke="#8A93A0" strokeWidth={6} />
            <rect x={756} y={194} width={408} height={724} rx={40} fill="#10131B" />
            <rect x={900} y={208} width={120} height={22} rx={11} fill="#0A0C12" />
            <text x={960} y={300} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill="#8A93A0">07:12</text>
            <rect x={776} y={372} width={368} height={78 + 84 * clamp((t - MSG + 2) / 5)} rx={26} fill="#232838" stroke="#3A4258" strokeWidth={3} />
            <FlipWord x={960} y={412} from="BİLİNMEYEN NUMARA" to="UNKNOWN NUMBER" t={t} at={10} size={25} card="#2E3448" ink="#C9D2E8" every={1.2} />
            <g opacity={clamp((t - MSG) / 3)} transform={`translate(960 492) scale(${0.6 + 0.4 * pop}) translate(-960 -492)`}>
              <text x={960} y={506} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={38} fill="#FFFFFF">Don&apos;t answer her.</text>
            </g>
            <Glow x={960} y={520} r={440} kind="cool" o={0.22 + 0.22 * clamp((t - MSG) / 6)} />
          </g>
        </g>
      </g>
    );
  };

  // h · He reads it and looks up. She is at his end of the table now. Then the smile comes back.
  const h: React.FC<ShotProps> = ({ t, len }) => {
    const hy = E0.y - 160 * E0.scale;
    const cam = camAt(t, [[0, E0.x + 8, hy + 6, 2.7, -1], [44, E0.x + 20, hy + 4, 2.45, -1], [80, 866, 566, 1.75, -2.6], [len, 872, 560, 1.92, -3.8]], 0.8, 7, [[86, 4]]);
    const face = faceAt(t, [[0, 'worried'], [86, 'shock']]);
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: { ...at(E0), yaw: 0.15, look: 0, headTilt: 14, tilt: 2, armL: { a: 30, b: -58 }, armR: { a: 34, b: 62 } } },
        { f: 50, p: { headTilt: 14 } },
        { f: 62, p: { headTilt: 0, yaw: 0.55, look: 1 }, ease: easeInOut },
        { f: 86, p: { tilt: 0 } },
        { f: 92, p: { tilt: -7, headTilt: 5, squash: -0.03 }, ease: easeOut },
        { f: 100, p: { tilt: -5, squash: 0 } },
      ]),
      ...face,
    }, t, 5, { calm: 0.5 });
    const glide = easeInOut(clamp((t - 30) / 46));
    const ms = kitSpot(lerp(0.62, 0.49, glide), 0.33);
    const mface = faceAt(t, [[0, 'neutral'], [96, 'happy']]);
    const mom = { ...alive({ ...basePose, ...at(ms), yaw: -0.3, look: -1, tilt: -8 - 3 * glide, headTilt: -15 - 4 * glide, armR: { a: 24, b: -14 }, armL: { a: 26, b: -14 } }, t, 2, { noBlink: true, calm: 0.25 }), ...mface };
    return (
      <KitchenScene t={t} id="heh" t0={575} cam={cam} milk={-99} dark={kf(t, [[0, 0.18], [len, 0.36]])}
        people={<g><Hero look={ANNE} pose={mom} rimId="rimL" shadow={0.4} /><Hero look={EGE} pose={me} rimId="rimBlue" shadow={0.4} /></g>}
        top={<g><Plate x={PLATE_B.x} y={PLATE_B.y} s={0.6} /><Glow x={E0.x + 6} y={E0.y + 50} r={170} kind="cool" o={0.5 * clamp(1 - (t - 56) / 14)} /></g>} />
    );
  };

  return { a, b, c, d, e, f, g, h };
};
