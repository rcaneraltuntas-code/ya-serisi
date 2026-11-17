import React from 'react';
import { Hero, Pose, basePose, poseAt, faceAt, kf, clamp, lerp, easeOut, easeInOut, backOut, walkPose, reachAngle, Plate, Glow, AlarmClock, PovHand, FONT, ShotProps, rnd } from '../../engine';
import { camAt, alive, handAt, Whip, CamKey } from '../herkes/act';
import { EGE, ANNE, FlipWord, Bedroom, BedFront, BED_SIT, CLOCK_AT, PHONE_AT, Hall, HALL, Kitchen2, Table, tableTop, kitSpot, CARTON, GLASS, SPILL, TeaGlass, Teapot, spoutOf, Hud } from '../herkes/world';

// 07.00, bölüm 1. He accepts the app at 23:59; then the same morning three times.
//   a  night     in bed, the phone's light on his face
//   b  phone     the app: LEARN ENGLISH IN ONE DAY. He doesn't read the terms. ACCEPT. "Good luck."
//   c  bedroom   LOOP 1: the alarm, the slap, the yawn
//   d  hall      he walks to the kitchen; behind his back the day board turns to MONDAY
//   e  kitchen   she pours the tea (a little spills), turns, and says it in English
//   f  kitchen   close on him
//   g  kitchen   "Anne?"
//   h  kitchen   everything stops but him. TRY AGAIN. The morning runs backwards.
//   i  bedroom   LOOP 2: the same alarm; this time he is up before it ends
//   j  kitchen   the same pour, the same spill, the same line
//   k  table     the spill, exactly where it was
//   l  kitchen   "Anne, ne oluyor?"
//   m  kitchen   stops again; back again
//   n  bedroom   LOOP 3: he works the rule out
//   o  phone     the app: RULE 1, and the line he has to answer
//   p  card
// One story drives every kitchen shot (see `story`): where she is, how full the glass is and where the tea has
// spilled depend only on the time since he walked in, so the shots always agree with each other, and the morning
// can be run backwards.

type Marks = { L: [number, number][]; N: [number, number][]; cut: Record<string, number>; env?: number[] };
const at = (s: { x: number; y: number; scale: number }): Partial<Pose> => ({ x: s.x, y: s.y, scale: s.scale });
const M0 = kitSpot(0.62, 0.33); // her place behind the table
const E0 = kitSpot(0.37, 0.33); // his
const PLATE = tableTop(0.39, 0.3);
const HEAD_E = { x: E0.x, y: E0.y - 176 * E0.scale };
const BED_HEAD = { x: BED_SIT.x, y: BED_SIT.y - 176 * BED_SIT.scale };
const INK = '#161422';

// ---------- the kitchen, as a function of the time since he came in ----------
type StoryIn = { tt: number; say: number; dur: number; loop: 1 | 2; voice?: number; tw?: number };
const story = ({ tt, say, dur, loop, voice = 0, tw = tt }: StoryIn) => {
  const tau = tt - say; // time from her first word
  // her: pours, straightens, turns to him, says it with a hand out to the table, and holds the smile
  const mom0: Pose = {
    ...poseAt(tau, [
      { f: -80, p: { ...basePose, ...at(M0), yaw: -0.12, look: -0.3, headTilt: 8, tilt: -3, armR: { a: 35, b: -127 }, armL: { a: 14, b: -12 }, blink: 0.5 } },
      { f: -36, p: { tilt: -3, blink: 0.5 } },
      { f: -24, p: { armR: { a: 30, b: -104 }, tilt: 0, headTilt: 0, blink: 0 }, ease: easeInOut },
      { f: -8, p: { yaw: -0.45, look: -1, headTilt: -10, tilt: -4 }, ease: easeInOut },
      { f: 4, p: { armL: { a: 14, b: -12 } } },
      { f: 16, p: { armL: { a: 78, b: -14 }, tilt: -7, headTilt: -13 }, ease: easeOut },
      { f: dur + 6, p: { armL: { a: 74, b: -10 } } },
      { f: dur + 22, p: { armL: { a: 16, b: -12 }, tilt: -5, headTilt: -14 }, ease: easeInOut },
    ]),
  };
  const mf = faceAt(tau, [[-999, 'smile'], [-10, 'happy']]);
  mom0.expr = mf.expr;
  mom0.blink = Math.max(mom0.blink, mf.blink); // her lids stay lowered while she watches the glass
  const mom = alive(mom0, tw, 2, { noBlink: true, calm: 0.4 });
  if (tau >= -1 && tau <= dur + 2) mom.talk = Math.max(0.1, voice);
  const tip = kf(tau, [[-82, 0], [-74, 30], [-40, 34], [-31, 0]]);
  const hand = handAt(mom, 'armR');
  const spout = spoutOf(hand.x, hand.y, tip, 0.8);
  const level = kf(tau, [[-76, 0.2], [-42, 1]]);
  const stream = tau > -73 && tau < -38;
  const drop = clamp((tau + 44) / 8); // a drop runs over the rim and down
  const puddle = clamp((tau + 38) / 10);
  // him: walks in along the table, stops at his plate; then what he hears lands on his face
  const tin = loop === 1 ? 34 : 16;
  let me: Pose;
  if (tt < tin) {
    const s0 = kitSpot(lerp(loop === 1 ? 0.2 : 0.27, 0.37, clamp(tt / tin)), 0.33);
    me = walkPose(s0.x, tt * 0.6, s0.floor, s0.scale, { yaw: 0.6, look: 1, expr: loop === 1 ? 'smile' : 'worried', tilt: 3 }, 1);
  } else {
    const face = loop === 1 ? faceAt(tau, [[-999, 'smile'], [12, 'neutral'], [26, 'worried']]) : faceAt(tau, [[-999, 'worried'], [-32, 'shock'], [6, 'worried']]);
    me = alive({
      ...poseAt(tt, loop === 1
        ? [
            { f: tin, p: { ...basePose, ...at(E0), yaw: 0.55, look: 1, tilt: 4, armR: { a: 14, b: -10 }, armL: { a: 12, b: -10 } } },
            { f: tin + 8, p: { tilt: 0 }, ease: easeOut },
            { f: say + 22, p: { tilt: 0, headTilt: 0 } },
            { f: say + 32, p: { tilt: -4, headTilt: 7 }, ease: easeOut },
          ]
        : [
            { f: tin, p: { ...basePose, ...at(E0), yaw: 0.6, look: 1, tilt: 4, armR: { a: 14, b: -10 }, armL: { a: 12, b: -10 } } },
            { f: say - 34, p: { tilt: 4, headTilt: 0 } },
            { f: say - 24, p: { tilt: 9, headTilt: 10 }, ease: easeOut },
            { f: say - 4, p: { tilt: 9, headTilt: 10 } },
            { f: say + 10, p: { tilt: 0, headTilt: 0 }, ease: easeInOut },
          ]),
      ...face,
    }, tw, 5, { calm: 0.6 });
  }
  return { tau, mom, me, hand, tip, spout, level, stream, drop, puddle, milkAt: say + 42, tw };
};
type St = ReturnType<typeof story>;

/** The kitchen drawn from a story state. ege: his pose (the story's by default); grey: 0..1 the world loses its colour, he doesn't. */
const Kitchen: React.FC<{ st: St; tt: number; id: string; cam: { transform: string }; ege?: Pose; grey?: number; ghost?: number; dark?: number }> = ({ st, tt, id, cam, ege, grey = 0, ghost = 0, dark = 0 }) => {
  const gf = grey > 0.01 ? `url(#${id}gr)` : undefined;
  return (
    <g>
      {grey > 0.01 ? (
        <defs>
          <filter id={`${id}gr`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values={(1 - 0.9 * grey).toFixed(3)} />
          </filter>
        </defs>
      ) : null}
      <g transform={cam.transform}>
        <g filter={gf}>
          <Kitchen2 t={st.tw + 300} id={id} />
          <Hero look={ANNE} pose={st.mom} rimId="rimL" shadow={0.4} />
          <Teapot x={st.hand.x} y={st.hand.y} tip={st.tip} s={0.8} />
          {st.stream ? <path d={`M ${st.spout.x} ${st.spout.y} Q ${st.spout.x - 3} ${st.spout.y + 8} ${GLASS.x} ${GLASS.y - 24}`} stroke="#B5461E" strokeWidth={4} fill="none" strokeLinecap="round" /> : null}
        </g>
        <Hero look={EGE} pose={ege ?? st.me} rimId="rimR" shadow={0.4} />
        <g filter={gf}>
          <Table label={<FlipWord x={CARTON.x} y={CARTON.y + 39} from="SÜT" to="MILK" t={tt} at={st.milkAt} size={15} card="#4F8F8C" every={3} />}>
            <Plate x={PLATE.x} y={PLATE.y} s={0.6} />
            {st.puddle > 0 ? <ellipse cx={SPILL.x} cy={SPILL.y} rx={17 * st.puddle} ry={5.5 * st.puddle} fill="#B5461E" opacity={0.85} /> : null}
            {st.puddle > 0.5 ? <ellipse cx={SPILL.x - 4} cy={SPILL.y - 1.5} rx={6} ry={1.6} fill="#FFFFFF" opacity={0.45} /> : null}
            {ghost > 0 ? (
              <g opacity={ghost}>
                <ellipse cx={SPILL.x} cy={SPILL.y} rx={25} ry={9.5} fill="none" stroke="#FFE08A" strokeWidth={1.6} strokeDasharray="4 3" />
                <path d={`M ${SPILL.x - 6} ${SPILL.y + 10} l -4 9`} stroke="#FFE08A" strokeWidth={1.4} strokeLinecap="round" />
                <rect x={SPILL.x - 34} y={SPILL.y + 20} width={48} height={14} rx={7} fill="#0E1118" stroke="#FFE08A" strokeWidth={1} />
                <text x={SPILL.x - 10} y={SPILL.y + 30.2} textAnchor="middle" fontFamily={FONT.ui} fontSize={8} fill="#FFE08A" letterSpacing={0.6}>LOOP 1</text>
              </g>
            ) : null}
            <TeaGlass x={GLASS.x} y={GLASS.y} level={st.level} steam={st.level > 0.6 ? 1 : 0} tw={st.tw} />
            {st.drop > 0 && st.drop < 1 ? <circle cx={lerp(GLASS.x - 13, SPILL.x + 6, st.drop)} cy={lerp(GLASS.y - 40, SPILL.y - 2, st.drop * st.drop)} r={3} fill="#B5461E" /> : null}
          </Table>
        </g>
      </g>
      {dark > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#0B0714" opacity={dark} /> : null}
    </g>
  );
};

/** The app's verdict, pinned to the top of the picture: it glitches in, then holds. t: frames since it appeared. */
const TryAgain: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0) return null;
  const g = t < 9 ? 1 - t / 9 : 0;
  const jx = g * 14 * Math.sin(t * 5.3);
  const big = { fontFamily: FONT.title, fontWeight: 800, fontSize: 92, textAnchor: 'middle' as const, letterSpacing: 2 };
  return (
    <g opacity={clamp(t / 2)}>
      <rect x={600} y={214} width={720} height={236} fill="#07060C" opacity={0.6} />
      <rect x={770} y={236} width={380} height={44} rx={22} fill="#D8342C" />
      <text x={960} y={267} textAnchor="middle" fontFamily={FONT.ui} fontSize={23} fill="#FFFFFF" letterSpacing={3}>TURKISH DETECTED</text>
      <text x={960 - 7 * g - jx} y={372} {...big} fill="#34E6FF" opacity={0.8 * g}>TRY AGAIN</text>
      <text x={960 + 7 * g + jx} y={372} {...big} fill="#FF3B5C" opacity={0.8 * g}>TRY AGAIN</text>
      <text x={960 + jx * 0.3} y={372} {...big} fill="#FFFFFF" stroke="#0B0912" strokeWidth={8} style={{ paintOrder: 'stroke' }}>TRY AGAIN</text>
      <text x={960} y={424} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={36} fill="#F6EFE3" opacity={clamp((t - 10) / 6)}>Tekrar dene.</text>
    </g>
  );
};

/** Tape running backwards: bars of noise across the picture and the rewind mark. k: 0..1 through the rewind. */
const Rewind: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const y = ((t * (37 + i * 11) + i * 290) % 1180) - 50;
      return <rect key={i} x={0} y={y} width={1920} height={10 + i * 6} fill="#FFFFFF" opacity={0.16} />;
    })}
    <rect x={0} y={0} width={1920} height={1080} fill="#20306A" opacity={0.16} />
    <g transform="translate(960 300)" opacity={0.92}>
      <path d="M -10 -34 L -62 0 L -10 34 Z M 56 -34 L 4 0 L 56 34 Z" fill="#FFFFFF" stroke="#0B0912" strokeWidth={6} strokeLinejoin="round" />
    </g>
  </g>
);

/** A white flash: `up` 0..1 covers the picture. */
const Flash: React.FC<{ o: number }> = ({ o }) => (o > 0.01 ? <rect x={0} y={0} width={1920} height={1080} fill="#FFFFFF" opacity={clamp(o)} /> : null);

// ---------- the bedroom ----------
const LUMP = { x: BED_SIT.x - 6, y: BED_SIT.y - 30 };
const Bed: React.FC<{ t: number; id: string; cam: { transform: string }; me: Pose | null; lump?: number; ring?: boolean; sq?: number; clock?: string; arm?: number; armDown?: boolean; buzz?: number; children?: React.ReactNode }> = ({ t, id, cam, me, lump = 0, ring = false, sq = 0, clock = '07:00', arm = 0, armDown = false, buzz = 0, children }) => {
  const hand = { x: lerp(LUMP.x + 96, CLOCK_AT.x - 20, easeOut(arm)), y: lerp(LUMP.y, CLOCK_AT.y - 42 + (armDown ? 10 : 0), easeOut(arm)) };
  return (
    <g transform={cam.transform}>
      <Bedroom t={t} id={id} />
      {me ? <Hero look={EGE} pose={me} rimId="rimR" shadow={0} /> : null}
      <BedFront lump={lump} />
      {arm > 0.02 ? (
        <g>
          <path d={`M ${LUMP.x + 84} ${LUMP.y + 4} Q ${(LUMP.x + 84 + hand.x) / 2} ${LUMP.y - 46} ${hand.x} ${hand.y}`} stroke={INK} strokeWidth={21} fill="none" strokeLinecap="round" />
          <path d={`M ${LUMP.x + 84} ${LUMP.y + 4} Q ${(LUMP.x + 84 + hand.x) / 2} ${LUMP.y - 46} ${hand.x} ${hand.y}`} stroke={EGE.limb} strokeWidth={14} fill="none" strokeLinecap="round" />
          <ellipse cx={hand.x} cy={hand.y} rx={13} ry={10} fill={EGE.hand} stroke={INK} strokeWidth={3.5} />
        </g>
      ) : null}
      {/* his phone, face down on the nightstand */}
      <g transform={`translate(${PHONE_AT.x + (buzz > 0 ? Math.sin(t * 3.3) * 2.4 * buzz : 0)} ${PHONE_AT.y - 4}) rotate(${buzz > 0 ? Math.sin(t * 2.7) * 3 * buzz : 0})`}>
        <rect x={-24} y={-5} width={48} height={9} rx={3.5} fill="#1A1D26" stroke={INK} strokeWidth={3} />
        {buzz > 0 ? <ellipse cx={0} cy={-2} rx={46} ry={16} fill="#9FC0FF" opacity={0.35 * buzz} style={{ mixBlendMode: 'screen' }} /> : null}
      </g>
      <g transform={`translate(${CLOCK_AT.x + (ring ? Math.sin(t * 2.9) * 4 : 0)} ${CLOCK_AT.y}) rotate(${ring ? Math.sin(t * 2.3) * 5 : 0}) scale(${1 + sq * 0.5} ${1 - sq})`}>
        <AlarmClock x={0} y={0} s={0.3} text={clock} on={ring ? (Math.floor(t / 4) % 2 ? 1 : 0.5) : 1} />
        {ring ? [-1, 1].map((k) => <path key={k} d={`M ${k * 46} -40 q ${k * 12} -10 ${k * 6} -24 M ${k * 56} -30 q ${k * 16} -8 ${k * 12} -26`} stroke="#FFE08A" strokeWidth={4} fill="none" strokeLinecap="round" opacity={Math.floor(t / 3) % 2 ? 1 : 0.3} />) : null}
      </g>
      {children}
    </g>
  );
};
const squash = (t: number, slap: number) => (t >= slap && t < slap + 8 ? 0.35 * Math.exp(-(t - slap) / 3) : 0);
/** Leaning over to flatten the alarm: the arm's angle that puts the hand on the clock. */
const slapArm = (pose: Pose) => ({ a: reachAngle(pose, { x: CLOCK_AT.x - 22, y: CLOCK_AT.y - 40 }), b: 0 });

// ---------- a phone held up, seen over his arm ----------
const PhoneFrame: React.FC<{ t: number; rise: number; buzz?: number; children: React.ReactNode; glow?: number }> = ({ t, rise, buzz = 0, children, glow = 0.3 }) => (
  <g transform={`translate(${buzz} ${(1 - rise) * 520})`}>
    <PovHand x={1020} y={920} fx={1270} fy={1530} s={1.35} rimId="rimBlue" look={EGE} />
    <rect x={738} y={176} width={444} height={760} rx={54} fill="#0A0C12" stroke="#8A93A0" strokeWidth={6} />
    <rect x={756} y={194} width={408} height={724} rx={40} fill="#10131B" />
    {children}
    <rect x={900} y={208} width={120} height={22} rx={11} fill="#0A0C12" />
    <Glow x={960} y={520} r={440} kind="cool" o={glow} />
  </g>
);
const AppIcon: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-34} y={-34} width={68} height={68} rx={18} fill="#FFE08A" />
    <circle cx={0} cy={0} r={20} fill="none" stroke="#10131B" strokeWidth={5} />
    <path d={`M 0 0 L 0 -13 M 0 0 L ${10 * Math.cos(t / 6)} ${10 * Math.sin(t / 6)}`} stroke="#10131B" strokeWidth={4.5} strokeLinecap="round" />
  </g>
);

export const make = (m: Marks): Record<string, React.FC<ShotProps>> => {
  const rel = (frame: number, shot: string) => frame - m.cut[shot];
  const env = (f: number) => m.env?.[Math.max(0, Math.round(f))] ?? 0;
  const N = (k: number, shot: string) => ({ say: rel(m.N[k][0], shot), dur: m.N[k][1] - m.N[k][0] });
  const speaks = (f: number, k: number) => (f >= m.L[k][0] - 1 && f <= m.L[k][1] + 1 ? Math.max(0.1, env(f)) : 0);

  // a · Night. In bed, the phone's light on his face. He scrolls; something makes him smile.
  const a: React.FC<ShotProps> = ({ t, len }) => {
    const cam = camAt(t, [[0, BED_SIT.x + 46, BED_SIT.y - 96, 1.55, 1.4], [len, BED_SIT.x + 22, BED_SIT.y - 124, 2.15, 0]], 0.5, 11);
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: { ...basePose, ...at(BED_SIT), headTilt: 0, armL: { a: 26, b: -122 }, armR: { a: 26, b: -122 }, look: 0, yaw: 0, tilt: -3 } },
        { f: 70, p: { tilt: -3 } },
        { f: 82, p: { tilt: 2, headTilt: 4 }, ease: easeOut },
      ]),
      ...faceAt(t, [[0, 'tired'], [78, 'smile']]),
    }, t, 5, { calm: 0.7 });
    const hl = handAt(me, 'armL');
    const hr = handAt(me, 'armR');
    const ph = { x: (hl.x + hr.x) / 2, y: (hl.y + hr.y) / 2 - 12 };
    const scroll = Math.sin(t / 5) * 2;
    return (
      <g>
        <Bed t={t} id="hea" cam={cam} me={me} clock="23:59">
          <rect x={300} y={100} width={1400} height={900} fill="#060A22" opacity={0.7} />
          {/* the phone from behind, and its light on him */}
          <rect x={ph.x - 15} y={ph.y - 25 + scroll * 0.3} width={30} height={50} rx={6} fill="#0A0C12" stroke="#5A6680" strokeWidth={2.5} />
          <circle cx={ph.x - 6} cy={ph.y - 15} r={3} fill="#2A3144" />
          <Glow x={BED_HEAD.x} y={BED_HEAD.y + 26} r={170} kind="cool" o={0.75 + 0.06 * Math.sin(t / 3)} />
          <Glow x={BED_HEAD.x} y={BED_HEAD.y + 10} r={90} kind="cool" o={0.5} />
          <g transform={`translate(${CLOCK_AT.x} ${CLOCK_AT.y})`}><AlarmClock x={0} y={0} s={0.3} text="23:59" on={1} /></g>
        </Bed>
      </g>
    );
  };

  // b · The app. The terms run past unread. His thumb comes down on ACCEPT. "Good luck."
  const b: React.FC<ShotProps> = ({ t, len }) => {
    const TAP = rel(m.L[2][1], 'b') + 10;
    const done = t >= TAP + 4;
    const rise = easeOut(clamp(t / 9));
    const cam = camAt(t, [[0, 960, 600, 1.0, -4], [TAP, 960, 566, 1.1, -2], [len, 960, 540, 1.2, -1]], 0.8, 12, [[TAP, 6]]);
    const press = t >= TAP && t < TAP + 5 ? 1 : 0;
    const th = clamp((t - (TAP - 12)) / 12) * (1 - clamp((t - TAP - 5) / 8));
    const thumb = { x: lerp(1110, 990, easeOut(th)), y: lerp(1010, 742, easeOut(th)) };
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill="#060A1C" />
        <g opacity={0.5}><Glow x={960} y={560} r={700} kind="cool" o={0.35} /></g>
        <g transform={cam.transform}>
          <PhoneFrame t={t} rise={rise} glow={done ? 0.5 : 0.3}>
            {!done ? (
              <g>
                <text x={960} y={262} textAnchor="middle" fontFamily={FONT.ui} fontSize={22} fill="#8A93A0">23:59</text>
                <AppIcon x={960} y={318} t={t} />
                <text x={960} y={384} textAnchor="middle" fontFamily={FONT.ui} fontSize={19} fill="#9AA6C0" letterSpacing={7}>ONE DAY</text>
                <text x={960} y={440} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={44} fill="#FFFFFF" letterSpacing={1}>LEARN ENGLISH</text>
                <text x={960} y={494} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={54} fill="#FFE08A" letterSpacing={1}>IN ONE DAY</text>
                <rect x={786} y={520} width={348} height={144} rx={14} fill="#171B26" stroke="#2A3144" strokeWidth={3} />
                <clipPath id="hebterms"><rect x={790} y={524} width={340} height={136} rx={10} /></clipPath>
                <g clipPath="url(#hebterms)">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const y = 548 + i * 15 - t * 4.2;
                    if (y < 512 || y > 672) return null;
                    return i === 24
                      ? <text key={i} x={802} y={y + 6} fontFamily={FONT.ui} fontSize={15} fill="#C9D2E8">7.3 Days may repeat.</text>
                      : <rect key={i} x={802} y={y} width={120 + rnd(3, i) * 190} height={5} rx={2.5} fill="#3A4258" />;
                  })}
                </g>
                <text x={1120} y={540} textAnchor="end" fontFamily={FONT.ui} fontSize={12} fill="#5A6680" letterSpacing={2}>TERMS</text>
                <g transform={`translate(960 716) scale(${1 - 0.07 * press}) translate(-960 -716)`}>
                  <rect x={806} y={683} width={308} height={66} rx={33} fill={press ? '#2FB56C' : '#3DDC84'} />
                  <text x={960} y={727} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill="#0B2A18" letterSpacing={3}>ACCEPT</text>
                </g>
                {t >= TAP ? <circle cx={960} cy={716} r={(t - TAP) * 46} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={clamp(1 - (t - TAP) / 5)} /> : null}
              </g>
            ) : (
              <g>
                <FlipWord x={960} y={256} from="23:59" to="00:00" t={t} at={TAP + 12} size={22} card="#1C2130" ink="#C9D2E8" every={2} />
                <AppIcon x={960} y={382} s={1.2} t={t * 3} />
                <text x={960} y={500} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={58} fill="#FFFFFF" opacity={clamp((t - TAP - 5) / 5)}>Good luck.</text>
                <text x={960} y={556} textAnchor="middle" fontFamily={FONT.ui} fontSize={23} fill="#9AA6C0" letterSpacing={3} opacity={clamp((t - TAP - 12) / 6)}>SEE YOU AT 07:00</text>
              </g>
            )}
            {th > 0.02 ? (
              <g transform={`translate(${thumb.x} ${thumb.y}) rotate(-24)`}>
                <rect x={-34} y={-30} width={68} height={300} rx={34} fill={EGE.hand} stroke={INK} strokeWidth={6} />
                <path d="M -18 -8 Q 0 -22 18 -8" stroke={INK} strokeWidth={3} fill="none" opacity={0.35} strokeLinecap="round" />
              </g>
            ) : null}
          </PhoneFrame>
        </g>
        <rect x={0} y={0} width={1920} height={1080} fill="#000" opacity={clamp((t - (len - 10)) / 9)} />
      </g>
    );
  };

  // c · LOOP 1. The alarm. A hand comes out of the duvet and flattens it. He sits up, yawns, scratches his head.
  const c: React.FC<ShotProps> = ({ t, len }) => {
    const SLAP = 34;
    const ring = t < SLAP;
    const kicks: [number, number][] = [[SLAP, 9]];
    for (let k = 0; k < SLAP; k += 5) kicks.push([k, 2.2]);
    const keys: CamKey[] = [[0, CLOCK_AT.x - 6, CLOCK_AT.y - 30, 3.3, 4], [SLAP + 2, CLOCK_AT.x - 12, CLOCK_AT.y - 28, 3.05, 3], [SLAP + 12, BED_SIT.x + 36, BED_SIT.y - 118, 1.85, 0, 'out'], [len, BED_SIT.x + 26, BED_SIT.y - 132, 2.25, -1.2]];
    const cam = camAt(t, keys, 0.7, 1, kicks);
    const rise = backOut(clamp((t - 42) / 12));
    const me = alive({
      ...poseAt(t, [
        { f: 42, p: { ...basePose, ...at(BED_SIT), y: BED_SIT.y + 130, tilt: -10, headTilt: -8, armL: { a: 20, b: -10 }, armR: { a: 20, b: -10 } } },
        { f: 54, p: { y: BED_SIT.y, tilt: 0, headTilt: 6 }, ease: backOut },
        { f: 62, p: { armL: { a: 20, b: -10 }, armR: { a: 20, b: -10 }, headTilt: 4 } },
        { f: 74, p: { armL: { a: 152, b: 24 }, armR: { a: 158, b: -16 }, tilt: -5, headTilt: -10, squash: -0.04 }, ease: easeOut },
        { f: 90, p: { armL: { a: 158, b: 32 }, armR: { a: 150, b: -8 }, tilt: 4, headTilt: -7, squash: -0.05 } },
        { f: 102, p: { armL: { a: 18, b: -10 }, armR: { a: 130, b: 118 }, tilt: 0, headTilt: 9, squash: 0 }, ease: easeInOut },
        { f: 122, p: { armR: { a: 130, b: 118 }, headTilt: 9 } },
        { f: 134, p: { armR: { a: 16, b: -10 }, headTilt: 0, yaw: 0.45, look: 1 }, ease: easeInOut },
      ]),
      ...faceAt(t, [[0, 'tired'], [104, 'neutral'], [128, 'smile']]),
      blink: t < 98 ? 1 : 0,
    }, t, 5, { noBlink: t < 104 });
    // the yawn, and the hand scratching in his hair
    me.talk = t >= 62 && t < 98 ? Math.sin((Math.PI * (t - 62)) / 36) : 0;
    if (t >= 102 && t < 122) me.armR = { a: 130 + Math.sin(t * 1.3) * 5, b: 118 + Math.cos(t * 1.3) * 6 };
    const arm = clamp((t - 24) / 9) * (1 - clamp((t - 38) / 6));
    return (
      <g>
        <Whip id="hecw" on={t > SLAP + 2 && t < SLAP + 11 ? Math.sin((Math.PI * (t - SLAP - 2)) / 9) : 0}>
          <Bed t={t} id="hec" cam={cam} me={t >= 42 ? me : null} lump={1 - rise} ring={ring} sq={squash(t, SLAP)} arm={arm} armDown={t >= SLAP} />
        </Whip>
        <Hud loop={1} t={t} at={SLAP + 14} />
        <rect x={0} y={0} width={1920} height={1080} fill="#000" opacity={clamp(1 - t / 5)} />
      </g>
    );
  };

  // d · Down the hall to the kitchen, without a care. Behind his back the day board turns over, letter by letter.
  const d: React.FC<ShotProps> = ({ t, len }) => {
    const x = 690 + t * 7.4;
    const FLIP = rel(m.L[4][0], 'd') - 8;
    const cam = camAt(t, [[0, x + 70, 590, 1.5, -1, 'lin'], [FLIP, 690 + FLIP * 7.4 + 40, 560, 1.5, -0.4, 'lin'], [FLIP + 20, HALL.board.x + 30, 470, 1.75, 0, 'io'], [len, HALL.board.x + 16, 430, 2.05, 0.8]], 0.9, 2, [[FLIP, 2.5]]);
    const me = { ...walkPose(x, t * 0.62, HALL.floor, 1, { yaw: 0.6, expr: 'smile', look: 0.6 }, 1), headTilt: 5 * Math.sin(t * 0.31) };
    return (
      <g>
        <g transform={cam.transform}>
          <Hall t={t} board={<FlipWord x={HALL.board.x} y={HALL.board.y + 14} from="PAZARTESİ" to="MONDAY" t={t} at={FLIP} size={34} every={2.4} />}>
            <Hero look={EGE} pose={me} rimId="rimR" shadow={0.7} />
          </Hall>
        </g>
        <Hud loop={1} t={t} />
      </g>
    );
  };

  // e · The kitchen. He comes in along the table. She pours his tea, a little spills, she turns: "Breakfast is ready."
  const e: React.FC<ShotProps> = ({ t, len, f }) => {
    const { say, dur } = N(0, 'e');
    const st = story({ tt: t, say, dur, loop: 1, voice: env(f) });
    const cam = camAt(t, [[0, 880, 592, 1.3, 0], [say - 46, 956, 590, 1.32, 0], [say - 34, 1070, 630, 2.0, -0.5, 'out'], [say - 12, 1070, 628, 2.1, -0.5], [say - 1, 1046, 574, 1.62, -0.6, 'io'], [say + dur + 8, 1050, 572, 1.7, -0.8], [say + dur + 26, 944, 588, 1.36, 0.4, 'io'], [len, 952, 586, 1.42, 0.8]], 0.7, 5);
    return (
      <g>
        <Kitchen st={st} tt={t} id="hee" cam={cam} />
        <Hud loop={1} t={t} />
      </g>
    );
  };

  // f · Close on him. He looks at her, then at the carton, then back.
  const fS: React.FC<ShotProps> = ({ t, len }) => {
    const { say, dur } = N(0, 'e');
    const st = story({ tt: t + rel(m.cut.f, 'e'), say, dur, loop: 1 });
    const cam = camAt(t, [[0, HEAD_E.x + 26, HEAD_E.y + 14, 2.5, -1], [len, HEAD_E.x + 20, HEAD_E.y + 10, 2.95, -2]], 0.6, 6);
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: { ...basePose, ...at(E0), yaw: 0.55, look: 1, tilt: -4, headTilt: 7, armR: { a: 14, b: -10 }, armL: { a: 12, b: -10 } } },
        { f: 20, p: { look: 1, headTilt: 7 } },
        { f: 28, p: { look: 0.5, headTilt: 15, yaw: 0.4 }, ease: easeInOut },
        { f: 44, p: { look: 0.5, headTilt: 15 } },
        { f: 54, p: { look: 1, headTilt: 5, yaw: 0.6 }, ease: easeInOut },
      ]),
      expr: 'worried',
    }, t, 5, { calm: 0.5 });
    return (
      <g>
        <Kitchen st={st} tt={t + rel(m.cut.f, 'e')} id="hef" cam={cam} ege={me} dark={0.06} />
        <Hud loop={1} t={t} />
      </g>
    );
  };

  /** How he stands when he speaks to her in loop 1: a step in, a hand half up. */
  const askPose = (t: number): Pose => poseAt(t, [
    { f: 0, p: { ...basePose, ...at(E0), yaw: 0.55, look: 1, tilt: -2, headTilt: 5, armR: { a: 14, b: -10 }, armL: { a: 12, b: -10 }, expr: 'worried' } },
    { f: 10, p: { tilt: 7, headTilt: 3, armR: { a: 58, b: -26 } }, ease: easeOut },
  ]);

  // g · "Anne?"
  const g: React.FC<ShotProps> = ({ t, len, f }) => {
    const { say, dur } = N(0, 'e');
    const tt = t + rel(m.cut.g, 'e');
    const st = story({ tt, say, dur, loop: 1 });
    const cam = camAt(t, [[0, 950, 586, 1.4, 0.4], [len, 958, 580, 1.52, 0]], 0.9, 7);
    const me = alive(askPose(t), t, 5, { talk: [[rel(m.L[6][0], 'g'), rel(m.L[6][1], 'g')]], calm: 0.6 });
    me.talk = speaks(f, 6);
    return (
      <g>
        <Kitchen st={st} tt={tt} id="heg" cam={cam} ege={me} />
        <Hud loop={1} t={t} />
      </g>
    );
  };

  // h · Everything stops but him: her smile, the steam, the lamp. TRY AGAIN. Then the whole morning runs backwards.
  const h: React.FC<ShotProps> = ({ t, len }) => {
    const { say, dur } = N(0, 'e');
    const FR = rel(m.cut.h, 'e'); // the moment the kitchen froze
    const SHOW = rel(m.N[1][0], 'h') - 2;
    const RW = Math.min(len - 46, rel(m.N[1][1], 'h') + 16);
    const back = clamp((t - RW) / 36);
    const tt = t < RW ? FR : lerp(FR, 0, easeInOut(back));
    const st = story({ tt, say, dur, loop: 1, tw: tt });
    const cam = camAt(t, [[0, 958, 580, 1.52, 0], [26, 950, 540, 1.34, 0.6, 'out'], [RW, 944, 536, 1.4, -0.6], [RW + 10, 952, 590, 1.3, 0, 'out'], [len, 952, 590, 1.3, 0]], t < RW ? 0.5 : 0.2, 8, [[0, 7], [SHOW, 6]]);
    // he is the only thing moving: he waves a hand in front of her, looks up at the words, looks round
    const live = alive({
      ...poseAt(t, [
        { f: 0, p: { ...askPose(99) } },
        { f: 10, p: { tilt: 2, armR: { a: 30, b: -20 } }, ease: easeOut },
        { f: 20, p: { armR: { a: 96, b: -8 }, tilt: 8, headTilt: 2 }, ease: easeOut },
        { f: SHOW - 2, p: { armR: { a: 96, b: -8 }, tilt: 8 } },
        { f: SHOW + 6, p: { armR: { a: 16, b: -10 }, tilt: -3, yaw: 0.1, look: 0, headTilt: -14, squash: -0.03 }, ease: easeOut },
        { f: SHOW + 24, p: { headTilt: -14, squash: 0 } },
        { f: SHOW + 34, p: { yaw: -0.55, look: -1, headTilt: -3, tilt: -2 }, ease: easeInOut },
        { f: SHOW + 46, p: { yaw: 0.55, look: 1, headTilt: -2, tilt: 2 }, ease: easeInOut },
        { f: SHOW + 58, p: { yaw: 0.2, look: 0.4, headTilt: 3, tilt: 0 }, ease: easeInOut },
      ]),
      ...faceAt(t, [[0, 'worried'], [SHOW + 3, 'shock']]),
    }, t, 5, { calm: 0.8 });
    if (t >= 20 && t < SHOW - 2) live.armR = { a: 96 + Math.sin(t * 1.25) * 13, b: -8 };
    const grey = kf(t, [[0, 0], [8, 1]]);
    return (
      <g>
        <Whip id="hehw" on={t >= RW && back < 1 ? 0.22 + 0.2 * Math.sin(Math.PI * back) : 0}>
          <Kitchen st={st} tt={tt} id="heh" cam={cam} ege={t < RW ? live : undefined} grey={grey} />
        </Whip>
        <rect x={0} y={0} width={1920} height={1080} fill="#27407A" opacity={0.14 * grey} />
        {t >= RW && back < 1 ? <Rewind t={t} /> : null}
        {t < RW - 3 ? <TryAgain t={t - SHOW} /> : null}
        <Hud loop={2} from={1} at={RW + 22} t={t} />
        <Flash o={(t - (len - 9)) / 8} />
      </g>
    );
  };

  // i · LOOP 2. The same alarm. He is sitting up before it has rung twice, and looks at his own hands.
  const i: React.FC<ShotProps> = ({ t, len }) => {
    const SLAP = 29;
    const ring = t < SLAP;
    const kicks: [number, number][] = [[SLAP, 8]];
    for (let k = 0; k < SLAP; k += 5) kicks.push([k, 2.2]);
    const cam = camAt(t, [[0, CLOCK_AT.x - 6, CLOCK_AT.y - 30, 3.3, 4], [5, CLOCK_AT.x - 10, CLOCK_AT.y - 28, 3.1, 3], [14, BED_SIT.x + 60, BED_SIT.y - 104, 1.7, 0, 'out'], [SLAP + 12, BED_SIT.x + 50, BED_SIT.y - 110, 1.78, 0], [len, BED_SIT.x + 20, BED_SIT.y - 136, 2.3, -1.4]], 0.8, 3, kicks);
    const rise = backOut(clamp((t - 5) / 8));
    const up: Pose = { ...basePose, ...at(BED_SIT), yaw: 0.6, look: 1, headTilt: 4, armL: { a: 20, b: -10 }, armR: { a: 20, b: -10 } };
    const lean: Pose = { ...up, tilt: 25, headTilt: -6 };
    const me = alive({
      ...poseAt(t, [
        { f: 5, p: { ...up, y: BED_SIT.y + 130, tilt: -8 } },
        { f: 13, p: { y: BED_SIT.y, tilt: 0 }, ease: backOut },
        { f: 20, p: { tilt: 0 } },
        { f: SLAP - 1, p: { tilt: 25, headTilt: -6, armR: slapArm(lean) }, ease: easeOut },
        { f: SLAP + 3, p: { tilt: 25 } },
        { f: SLAP + 14, p: { tilt: 0, headTilt: 0, armR: { a: 20, b: -10 }, yaw: 0.2, look: 0.3 }, ease: easeInOut },
        { f: SLAP + 26, p: { armL: { a: 42, b: -104 }, armR: { a: 42, b: -104 }, headTilt: 14, yaw: 0, look: 0, tilt: 2 }, ease: easeInOut },
        { f: 84, p: { headTilt: 14 } },
        { f: 96, p: { armL: { a: 18, b: -10 }, armR: { a: 18, b: -10 }, headTilt: 0, yaw: 0.6, look: 1, tilt: 0 }, ease: easeInOut },
      ]),
      ...faceAt(t, [[0, 'shock'], [SLAP + 20, 'worried']]),
    }, t, 5, { calm: 0.7 });
    return (
      <g>
        <Whip id="heiw" on={t > 5 && t < 14 ? Math.sin((Math.PI * (t - 5)) / 9) : 0}>
          <Bed t={t} id="hei" cam={cam} me={t >= 5 ? me : null} lump={1 - rise} ring={ring} sq={squash(t, SLAP)} />
        </Whip>
        <Hud loop={2} t={t} />
        <Flash o={1 - t / 6} />
      </g>
    );
  };

  // j · The kitchen again. The same pour, the same drop over the rim, the same turn, the same line.
  const j: React.FC<ShotProps> = ({ t, len, f }) => {
    const { say, dur } = N(2, 'j');
    const st = story({ tt: t, say, dur, loop: 2, voice: env(f) });
    const cam = camAt(t, [[0, 1000, 604, 1.5, 0.6], [say - 40, 1070, 630, 2.0, -0.4, 'out'], [say - 14, 1070, 628, 2.12, -0.4], [say - 2, 1046, 574, 1.62, -0.6, 'io'], [say + dur + 6, 1050, 572, 1.7, -0.8], [len, 950, 586, 1.4, 0.4, 'io']], 0.9, 9, [[say - 38, 3]]);
    return (
      <g>
        <Kitchen st={st} tt={t} id="hej" cam={cam} />
        <Hud loop={2} t={t} />
      </g>
    );
  };

  // k · The tea on the table, exactly where it was the first time.
  const k: React.FC<ShotProps> = ({ t, len }) => {
    const { say, dur } = N(2, 'j');
    const tt = t + rel(m.cut.k, 'j');
    const st = story({ tt, say, dur, loop: 2 });
    const cam = camAt(t, [[0, SPILL.x + 22, SPILL.y + 40, 3.3, -1], [len, SPILL.x + 16, SPILL.y + 36, 3.8, 1]], 0.6, 10);
    return (
      <g>
        <Kitchen st={st} tt={tt} id="hek" cam={cam} ghost={clamp((t - 10) / 8) * (0.75 + 0.25 * Math.sin(t / 3))} dark={0.1} />
        <Hud loop={2} t={t} />
      </g>
    );
  };

  /** Loop 2: both hands up, asking. */
  const pleadPose = (t: number): Pose => poseAt(t, [
    { f: 0, p: { ...basePose, ...at(E0), yaw: 0.6, look: 1, tilt: 0, headTilt: 0, armR: { a: 14, b: -10 }, armL: { a: 12, b: -10 }, expr: 'worried' } },
    { f: 10, p: { x: E0.x + 34, tilt: 8, headTilt: 4, armR: { a: 48, b: 82 }, armL: { a: 44, b: 78 } }, ease: easeOut },
    { f: 26, p: { tilt: 6, armR: { a: 56, b: 70 }, armL: { a: 50, b: 70 } } },
    { f: 40, p: { tilt: 9, armR: { a: 46, b: 86 }, armL: { a: 42, b: 82 } } },
  ]);

  // l · "Anne, ne oluyor?"
  const l: React.FC<ShotProps> = ({ t, len, f }) => {
    const { say, dur } = N(2, 'j');
    const tt = t + rel(m.cut.l, 'j');
    const st = story({ tt, say, dur, loop: 2 });
    const cam = camAt(t, [[0, 950, 586, 1.38, -0.4], [len, 966, 578, 1.56, 0.4]], 1.1, 13);
    const me = alive(pleadPose(t), t, 5, { talk: [[rel(m.L[9][0], 'l'), rel(m.L[9][1], 'l')]], calm: 0.6 });
    me.talk = speaks(f, 9);
    return (
      <g>
        <Kitchen st={st} tt={tt} id="hel" cam={cam} ege={me} />
        <Hud loop={2} t={t} />
      </g>
    );
  };

  // m · It stops again. He knows what comes next, and covers his face. Back to 07:00.
  const mS: React.FC<ShotProps> = ({ t, len }) => {
    const { say, dur } = N(2, 'j');
    const FR = rel(m.cut.m, 'j');
    const SHOW = rel(m.N[3][0], 'm') - 2;
    const RW = Math.min(len - 36, rel(m.N[3][1], 'm') + 8);
    const back = clamp((t - RW) / 28);
    const tt = t < RW ? FR : lerp(FR, 0, easeInOut(back));
    const st = story({ tt, say, dur, loop: 2, tw: tt });
    const cam = camAt(t, [[0, 966, 578, 1.56, 0.4], [18, 952, 540, 1.36, 0, 'out'], [RW, 948, 536, 1.4, 0], [RW + 8, 952, 590, 1.3, 0, 'out'], [len, 952, 590, 1.3, 0]], t < RW ? 0.5 : 0.2, 14, [[0, 7], [SHOW, 5]]);
    const live = alive({
      ...poseAt(t, [
        { f: 0, p: { ...pleadPose(99) } },
        { f: SHOW + 2, p: { tilt: 9 } },
        { f: SHOW + 12, p: { tilt: 0, headTilt: -12, yaw: 0.1, look: 0, armR: { a: 20, b: -10 }, armL: { a: 16, b: -10 } }, ease: easeOut },
        { f: SHOW + 22, p: { headTilt: -12 } },
        { f: SHOW + 32, p: { headTilt: 14, armR: { a: 132, b: 122 }, tilt: 3, yaw: 0 }, ease: easeInOut },
      ]),
      ...faceAt(t, [[0, 'worried'], [SHOW + 3, 'shock'], [SHOW + 26, 'tired']]),
    }, t, 5, { calm: 0.7 });
    if (t >= SHOW + 30) live.blink = 1;
    const grey = kf(t, [[0, 0], [6, 1]]);
    return (
      <g>
        <Whip id="hemw" on={t >= RW && back < 1 ? 0.22 + 0.2 * Math.sin(Math.PI * back) : 0}>
          <Kitchen st={st} tt={tt} id="hem" cam={cam} ege={t < RW ? live : undefined} grey={grey} />
        </Whip>
        <rect x={0} y={0} width={1920} height={1080} fill="#27407A" opacity={0.14 * grey} />
        {t >= RW && back < 1 ? <Rewind t={t} /> : null}
        {t < RW - 3 ? <TryAgain t={t - SHOW} /> : null}
        <Hud loop={3} from={2} at={RW + 16} t={t} />
        <Flash o={(t - (len - 9)) / 8} />
      </g>
    );
  };

  // n · LOOP 3. He is awake before the alarm, flattens it without looking, and thinks it through.
  const n: React.FC<ShotProps> = ({ t, len }) => {
    const SLAP = 28;
    const ring = t < SLAP;
    const L10 = rel(m.L[10][0], 'n');
    const L11 = rel(m.L[11][0], 'n');
    const L11e = rel(m.L[11][1], 'n');
    const BUZZ = L11e + 14;
    const kicks: [number, number][] = [[SLAP, 8]];
    for (let q = 0; q < SLAP; q += 5) kicks.push([q, 1.6]);
    const cam = camAt(t, [[0, BED_SIT.x + 60, BED_SIT.y - 100, 1.62, 1], [SLAP + 10, BED_SIT.x + 52, BED_SIT.y - 106, 1.7, 0.6], [L10 + 8, BED_SIT.x + 24, BED_SIT.y - 132, 2.2, 0, 'io'], [L11 - 12, BED_SIT.x + 22, BED_SIT.y - 136, 2.3, -0.6], [L11 + 6, BED_SIT.x + 50, BED_SIT.y - 200, 1.6, 0, 'io'], [L11e + 8, BED_SIT.x + 52, BED_SIT.y - 202, 1.66, 0.6], [BUZZ + 12, 968, 618, 1.9, -1, 'io'], [len, 980, 628, 2.05, -1.6]], 0.7, 15, kicks);
    const sit: Pose = { ...basePose, ...at(BED_SIT), yaw: 0, look: 0, armL: { a: 16, b: -10 }, armR: { a: 16, b: -10 } };
    const lean: Pose = { ...sit, tilt: 25 };
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: sit },
        { f: 16, p: sit },
        { f: SLAP - 1, p: { tilt: 25, armR: slapArm(lean) }, ease: easeOut },
        { f: SLAP + 3, p: { tilt: 25 } },
        { f: SLAP + 16, p: { tilt: 0, armR: { a: 16, b: -10 } }, ease: easeInOut },
        { f: L10 - 6, p: { tilt: 0 } },
        { f: L10 + 8, p: { armR: { a: 80, b: 173 }, armL: { a: -10, b: -70 }, headTilt: 8, yaw: 0.2, look: 0.5 }, ease: easeInOut },
        { f: L11 + 16, p: { headTilt: 8 } },
        { f: L11 + 28, p: { armR: { a: 152, b: 14 }, armL: { a: 16, b: -10 }, headTilt: -5, yaw: 0, look: 0, squash: -0.04, handR: 'point' }, ease: easeOut },
        { f: L11 + 36, p: { squash: 0 } },
        { f: BUZZ - 2, p: { armR: { a: 152, b: 14 } } },
        { f: BUZZ + 10, p: { armR: { a: 18, b: -10 }, handR: 'open', yaw: 0.75, look: 1, headTilt: 8 }, ease: easeInOut },
      ]),
      ...faceAt(t, [[0, 'tired'], [L10 + 4, 'worried'], [L11 + 24, 'shock'], [L11 + 50, 'smug'], [BUZZ + 4, 'neutral']]),
    }, t, 5, { calm: 0.7 });
    const bt = t - (L11 + 4);
    const bub = { x: BED_HEAD.x + 56, y: BED_HEAD.y - 158 };
    const gone = clamp((t - BUZZ) / 5);
    return (
      <g>
        <Bed t={t} id="hen" cam={cam} me={me} ring={ring} sq={squash(t, SLAP)} buzz={t >= BUZZ ? 1 : 0}>
          {bt > 0 && gone < 1 ? (
            <g opacity={clamp(bt / 3) * (1 - gone)} transform={`translate(${bub.x} ${bub.y}) scale(${0.6 + 0.4 * backOut(clamp(bt / 9))})`}>
              <circle cx={-120} cy={104} r={8} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
              <circle cx={-98} cy={78} r={14} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
              <rect x={-150} y={-58} width={300} height={116} rx={58} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
              <text x={-70} y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill={INK}>TÜRKÇE</text>
              <g opacity={clamp((bt - 22) / 5)}>
                <path d="M -6 0 L 26 0 M 16 -9 L 27 0 L 16 9" stroke="#D8342C" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <rect x={40} y={-24} width={96} height={48} rx={12} fill="#24202C" />
                <text x={88} y={10} textAnchor="middle" fontFamily={FONT.ui} fontSize={26} fill="#FF5A4A">07:00</text>
                <path d={`M 88 -44 a 14 14 0 1 0 14 14`} stroke="#D8342C" strokeWidth={4} fill="none" strokeLinecap="round" transform={`rotate(${-bt * 9} 88 -30)`} />
              </g>
            </g>
          ) : null}
        </Bed>
        <Hud loop={3} t={t} />
        <Flash o={1 - t / 6} />
      </g>
    );
  };

  // o · His phone. The app has been keeping count. RULE 1. And the line he has to answer.
  const o: React.FC<ShotProps> = ({ t, len }) => {
    const rise = easeOut(clamp(t / 9));
    const buzz = t >= 2 && t < 12 ? Math.sin(t * 3.1) * 5 : 0;
    const cam = camAt(t, [[0, 960, 600, 1.0, -5], [60, 960, 560, 1.1, -3], [len, 960, 530, 1.2, -1]], 0.9, 16, [[26, 4], [58, 4]]);
    const card = (a0: number) => ({ opacity: clamp((t - a0) / 4), transform: `translate(0 ${(1 - easeOut(clamp((t - a0) / 7))) * 26})` });
    return (
      <g>
        <g filter="url(#blur16)"><g transform="translate(960 540) scale(1.5) translate(-900 -640)"><Bedroom t={t + 500} id="heo" /></g></g>
        <rect x={0} y={0} width={1920} height={1080} fill="#0B0714" opacity={0.62} />
        <g transform={cam.transform}>
          <PhoneFrame t={t} rise={rise} buzz={buzz} glow={0.34}>
            <text x={960} y={258} textAnchor="middle" fontFamily={FONT.ui} fontSize={22} fill="#8A93A0">07:01</text>
            <AppIcon x={820} y={302} s={0.62} t={t} />
            <text x={852} y={310} fontFamily={FONT.ui} fontSize={19} fill="#9AA6C0" letterSpacing={6}>ONE DAY</text>
            <g {...card(8)}>
              <rect x={1010} y={282} width={124} height={40} rx={20} fill="#D8342C" />
              <text x={1072} y={310} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={24} fill="#FFFFFF" letterSpacing={1}>LOOP 3</text>
            </g>
            <g {...card(26)}>
              <rect x={782} y={340} width={356} height={120} rx={22} fill="#232838" stroke="#3A4258" strokeWidth={3} />
              <text x={806} y={374} fontFamily={FONT.ui} fontSize={19} fill="#FFE08A" letterSpacing={4}>RULE 1</text>
              <text x={806} y={418} fontFamily={FONT.title} fontWeight={800} fontSize={40} fill="#FFFFFF">English only.</text>
              <text x={806} y={446} fontFamily={FONT.title} fontWeight={600} fontSize={21} fill="#9AA6C0">Sadece İngilizce.</text>
            </g>
            <g {...card(58)}>
              <rect x={782} y={474} width={356} height={136} rx={22} fill="#232838" stroke="#3A4258" strokeWidth={3} />
              <text x={806} y={508} fontFamily={FONT.ui} fontSize={19} fill="#FFE08A" letterSpacing={4}>SHE SAYS</text>
              <text x={806} y={552} fontFamily={FONT.title} fontWeight={800} fontSize={34} fill="#FFFFFF">Breakfast is ready.</text>
              <text x={806} y={590} fontFamily={FONT.title} fontWeight={700} fontSize={26} fill="#9FD3C1">= Kahvaltın hazır.</text>
            </g>
            <g {...card(84)}>
              <rect x={782} y={624} width={356} height={58} rx={18} fill="#10131B" stroke="#FFE08A" strokeWidth={3} />
              <text x={806} y={661} fontFamily={FONT.ui} fontSize={19} fill="#FFE08A" letterSpacing={3}>YOU SAY</text>
              <rect x={930} y={640} width={4} height={27} fill="#FFFFFF" opacity={Math.floor(t / 8) % 2 ? 1 : 0.15} />
            </g>
          </PhoneFrame>
        </g>
      </g>
    );
  };

  // p · The card: the line, and the question.
  const p: React.FC<ShotProps> = ({ t }) => (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#000" />
      <g opacity={clamp((t - 4) / 8)}>
        <text x={960} y={392} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={52} fill="#FFE08A">Breakfast is ready.</text>
        <text x={960} y={452} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={32} fill="#F6EFE3" opacity={0.85}>= Kahvaltın hazır.</text>
        <text x={960} y={540} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={46} fill="#FFFFFF" opacity={clamp((t - 22) / 8) * (0.75 + 0.25 * Math.sin(t / 5))}>Cevabı ne olmalı?</text>
        <g opacity={clamp((t - 34) / 8)}>
          <rect x={860} y={616} width={200} height={84} rx={18} fill="#24202C" stroke="#3A3446" strokeWidth={3} />
          <text x={960} y={676} textAnchor="middle" fontFamily={FONT.ui} fontSize={52} fill="#FF5A4A" opacity={Math.floor(t / 15) % 2 ? 1 : 0.7}>07:00</text>
          <text x={960} y={748} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill="#F6EFE3" letterSpacing={6} opacity={0.7}>LOOP 3 · DEVAMI 2. BÖLÜMDE</text>
        </g>
      </g>
    </g>
  );

  return { a, b, c, d, e, f: fS, g, h, i, j, k, l, m: mS, n, o, p };
};
