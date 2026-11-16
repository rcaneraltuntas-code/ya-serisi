import React from 'react';
import { Hero, Pose, basePose, poseAt, faceAt, kf, clamp, lerp, easeOut, easeInOut, LOOKS, Kitchen, KitchenIsland, islandTop, Mug, Plate, Glow, ShotProps } from '../../engine';
import { camAt, alive, handAt, spot, walkTo, backOf, Whip, CamKey } from '../herkes/act';

// HERKES İNGİLİZCE, bölüm 1: "Kahvaltı". One morning in the kitchen, staged and keyed by hand: she cooks with her
// back to us, he walks in half asleep and mouths her line before she says it, and then she says it in English.
// Places are fixed for the whole part: she starts at the counter (C) and ends at the island (I), he stands at the
// island's right end (H), the mug stays where it is and the plate ends in front of him.

const MOM = LOOKS.mom;
const ME = LOOKS.pipHood;
const C = spot(0.37, 0.1);
const I = spot(0.41, 0.4);
const H = spot(0.617, 0.4);
const MUG = islandTop(0.5, 0.5);
const PLATE0 = islandTop(0.445, 0.4);
const PLATE1 = islandTop(0.6, 0.55);
const at = (s: { x: number; y: number; scale: number }): Partial<Pose> => ({ x: s.x, y: s.y, scale: s.scale });

type Marks = { L: [number, number][]; N: [number, number][]; cut: Record<string, number> };

const Room: React.FC<{ t: number; id: string; cam: { transform: string }; people: React.ReactNode; top?: React.ReactNode; dark?: number; veil?: number; t0?: number }> = ({ t, id, cam, people, top, dark = 0, veil = 0.3, t0 = 0 }) => (
  <g>
    <g transform={cam.transform}>
      <Kitchen t={t + t0} id={id} veil={veil} />
      {people}
      <KitchenIsland />
      <Mug x={MUG.x} y={MUG.y} rot={0} steam={1} f={t + t0} />
      {top}
    </g>
    {dark > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#05040C" opacity={dark} /> : null}
  </g>
);

export const make = (m: Marks): Record<string, React.FC<ShotProps>> => {
  const rel = (frame: number, shot: string) => frame - m.cut[shot];

  // a · She cooks, humming, her back to us. The camera pulls back off the steaming mug as he shuffles in and yawns.
  const a: React.FC<ShotProps> = ({ t, len }) => {
    const keys: CamKey[] = [[0, MUG.x + 6, MUG.y - 34, 3.1, -3], [56, 948, 588, 1.28, 0], [len, 964, 574, 1.44, 0.6]];
    const cam = camAt(t, keys, 0.7, 1);
    const stir = t / 3.1;
    const mom = alive({ ...basePose, ...at(C), tilt: 2.4 * Math.sin(t / 8), headTilt: 4 * Math.sin(t / 6.5), armR: { a: 40 + 9 * Math.sin(stir), b: -80 + 9 * Math.cos(stir) }, armL: { a: 16, b: -24 }, sway: 4 * Math.sin(t / 8) }, t, 2, { noBlink: true });
    const walk = walkTo(t, 34, 74, [0.86, 0.4], [0.617, 0.4], { expr: 'tired' });
    const me = walk ?? alive({
      ...poseAt(t, [
        { f: 74, p: { ...at(H), yaw: -0.2, expr: 'tired', armL: { a: 12, b: -8 }, armR: { a: 12, b: -8 } } },
        { f: 86, p: { armL: { a: 150, b: 22 }, armR: { a: 158, b: -14 }, tilt: -4, headTilt: -9, blink: 1, squash: -0.03 }, ease: easeOut },
        { f: 102, p: { armL: { a: 156, b: 30 }, armR: { a: 150, b: -6 }, tilt: 3, headTilt: -6, blink: 1, squash: -0.04 } },
        { f: 116, p: { armL: { a: 14, b: -10 }, armR: { a: 14, b: -10 }, tilt: 0, headTilt: 0, blink: 0, squash: 0, yaw: -0.55, look: -1, expr: 'neutral' }, ease: easeInOut },
      ]),
    }, t, 5, { noBlink: t < 112 });
    return (
      <Room t={t} id="hea" cam={cam} people={
        <g>
          <Hero look={backOf(MOM)} pose={mom} rimId="rimL" shadow={0.5} />
          {t >= 34 ? <Hero look={ME} pose={me} rimId="rimR" shadow={0.5} /> : null}
        </g>
      } />
    );
  };

  // b · He knows the line by heart: he says it along with her before she does, finger wagging.
  const b: React.FC<ShotProps> = ({ t, len }) => {
    const cam = camAt(t, [[0, H.x + 4, H.y - 150, 2.2, 0], [len, H.x - 4, H.y - 156, 2.5, -1.2]], 0.6, 2);
    const me = alive({ ...basePose, ...at(H), yaw: -0.3, look: -0.6, expr: 'smug', tilt: -2, headTilt: 5 * Math.sin(t * 0.5), armR: { a: 98, b: 66 + 15 * Math.sin(t * 0.95) }, handR: 'point', armL: { a: 14, b: -10 } }, t, 5, { talk: [[2, len - 4]] });
    return <Room t={t} id="heb" t0={140} cam={cam} people={<g><Hero look={backOf(MOM)} pose={{ ...basePose, ...at(C) }} rimId="rimL" shadow={0.5} /><Hero look={ME} pose={me} rimId="rimR" shadow={0.5} /></g>} />;
  };

  // c · The camera whips to her as she spins round with the plate. The line is the right one. The language isn't.
  const c: React.FC<ShotProps> = ({ t, len }) => {
    const hy = C.y - 150 * C.scale;
    const cam = camAt(t, [[0, H.x - 30, H.y - 150, 2.2, -1], [6, C.x + 8, hy + 6, 2.15, 0, 'out'], [len, C.x + 4, hy, 2.6, -3.5]], 0.6, 3);
    const say = rel(m.N[0][0], 'c');
    const turned = t >= 4;
    const mom = alive({
      ...poseAt(t, [
        { f: 0, p: { ...at(C), tilt: -5, armR: { a: 40, b: -70 }, armL: { a: 16, b: -24 } } },
        { f: 4, p: { tilt: 0, squash: 0.05, armR: { a: 62, b: 38 }, armL: { a: 22, b: -30 } } },
        { f: 9, p: { tilt: 7, headTilt: 9, squash: -0.02, expr: 'happy' }, ease: easeOut },
        { f: 15, p: { tilt: 2, headTilt: 5, squash: 0 } },
        { f: len, p: { tilt: 3, headTilt: 9 } },
      ]),
    }, t, 2, { talk: [[say, say + (m.N[0][1] - m.N[0][0])]], noBlink: true });
    const hand = handAt(mom, 'armR');
    return (
      <Whip id="hecw" on={t < 6 ? Math.sin((Math.PI * t) / 6) : 0}>
        <Room t={t} id="hec" t0={175} cam={cam} people={
          <g>
            <Hero look={turned ? MOM : backOf(MOM)} pose={{ ...mom, expr: turned ? 'happy' : 'neutral' }} rimId="rimL" shadow={0.5} />
            {turned ? <Plate x={hand.x + 4} y={hand.y - 8} s={0.62 * C.scale} /> : null}
            <Hero look={ME} pose={{ ...basePose, ...at(H), yaw: -0.55, look: -1, expr: 'smug' }} rimId="rimR" shadow={0.5} />
          </g>
        } />
      </Whip>
    );
  };

  // d · His finger is still in the air. The grin goes first.
  const d: React.FC<ShotProps> = ({ t, len }) => {
    const cam = camAt(t, [[0, H.x - 6, H.y - 140, 1.7, 0], [7, H.x, H.y - 150, 2.35, 0, 'out'], [len, H.x + 3, H.y - 154, 2.6, 2]], 0.8, 4, [[5, 5]]);
    const face = faceAt(t, [[0, 'smug'], [5, 'shock'], [46, 'worried']]);
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: { ...at(H), yaw: -0.3, look: -0.6, headTilt: 4, tilt: -2, armR: { a: 98, b: 70 }, handR: 'point', armL: { a: 14, b: -10 } } },
        { f: 6, p: { yaw: -0.75, look: -1, headTilt: -4, tilt: 4, squash: -0.03 }, ease: easeOut },
        { f: 12, p: { tilt: 2, squash: 0 } },
        { f: 30, p: { armR: { a: 80, b: 60 } } },
        { f: 54, p: { armR: { a: 14, b: -10 }, handR: 'open', tilt: 0, headTilt: 0 }, ease: easeInOut },
        { f: 62, p: { squash: 0.04 } },
        { f: 68, p: { squash: 0 } },
      ]),
      ...face,
    }, t, 5, { calm: 0.5 });
    return <Room t={t} id="hed" t0={245} cam={cam} people={<Hero look={ME} pose={me} rimId="rimR" shadow={0.5} />} />;
  };

  // e · "Anne?" She comes to the island, sets the plate down and slides it across to him. The smile never moves.
  const e: React.FC<ShotProps> = ({ t, len }) => {
    const say = rel(m.N[1][0], 'e');
    const said = say + (m.N[1][1] - m.N[1][0]);
    const push = say + 2;
    const cam = camAt(t, [[0, 966, 582, 1.28, 0], [26, 940, 596, 1.42, -0.6], [push + 16, 1004, 606, 1.5, 0.4], [len, 986, 598, 1.46, 1.2]], 0.7, 5, [[push + 15, 3]]);
    const carry = { armR: { a: 62, b: 38 }, armL: { a: 22, b: -30 }, expr: 'happy' as const };
    const walk = walkTo(t, 0, 24, [0.37, 0.1], [0.41, 0.4], { ...carry, yaw: 0.2, tilt: 2 });
    const mom = alive(walk ?? {
      ...poseAt(t, [
        { f: 24, p: { ...at(I), ...carry, yaw: 0.25, look: 1, tilt: 2 } },
        { f: 31, p: { armR: { a: 76, b: 4 }, tilt: 5 }, ease: easeOut },
        { f: push, p: { armR: { a: 78, b: 2 }, tilt: 5 } },
        { f: push + 14, p: { armR: { a: 97, b: -6 }, tilt: 11, headTilt: 6 }, ease: easeOut },
        { f: push + 30, p: { armR: { a: 26, b: -14 }, tilt: 6, headTilt: 12 }, ease: easeInOut },
        { f: len, p: { tilt: 7, headTilt: 14 } },
      ]),
    }, t, 2, { talk: [[say, said]], noBlink: true });
    const hand = handAt(mom, 'armR');
    const down = clamp((t - 26) / 6);
    const slide = easeOut(clamp((t - push) / 15));
    const plate = t < 26 ? { x: hand.x + 4, y: hand.y - 8 } : { x: lerp(lerp(hand.x + 4, PLATE0.x, down), PLATE1.x, slide), y: lerp(lerp(hand.y - 8, PLATE0.y, down), PLATE1.y, slide) + (t > push + 15 ? Math.sin((t - push - 15) * 1.6) * 2 * Math.exp(-(t - push - 15) / 5) : 0) };
    const face = faceAt(t, [[0, 'worried'], [push + 20, 'shock'], [push + 46, 'worried']]);
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: { ...at(H), yaw: -0.7, look: -1, tilt: -7, headTilt: 2, armL: { a: 30, b: 40 }, armR: { a: 14, b: -10 } } },
        { f: push + 8, p: { tilt: -4 } },
        { f: push + 18, p: { tilt: 3, headTilt: -12, look: -0.3 }, ease: easeOut },
        { f: push + 44, p: { tilt: 1, headTilt: 0, look: -1 }, ease: easeInOut },
      ]),
      ...face,
    }, t, 5, { talk: [[2, 15]], calm: 0.6 });
    return (
      <Room t={t} id="hee" t0={325} cam={cam} people={<g><Hero look={MOM} pose={mom} rimId="rimL" shadow={0.5} /><Hero look={ME} pose={me} rimId="rimR" shadow={0.5} /></g>}
        top={<Plate x={plate.x} y={plate.y} s={t < 26 ? 0.62 * lerp(C.scale, I.scale, clamp(t / 24)) : 0.66} />} />
    );
  };

  // f · Close on her. The smile holds, and then the eyes open.
  const f: React.FC<ShotProps> = ({ t, len }) => {
    const hy = I.y - 172 * I.scale;
    const cam = camAt(t, [[0, I.x + 10, hy + 10, 3.2, 0], [len, I.x + 14, hy, 4.6, -6]], 0.5, 6);
    const face = faceAt(t, [[0, 'happy'], [34, 'neutral']]);
    const mom = { ...alive({ ...basePose, ...at(I), yaw: 0.25, look: 1, tilt: 7, headTilt: kf(t, [[0, 13], [len, 17]]), armR: { a: 26, b: -14 }, armL: { a: 22, b: -30 } }, t, 2, { noBlink: true, calm: 0.3 }), ...face };
    const flick = t >= 30 && t < 38 ? 0.16 * Math.abs(Math.sin(t * 2.3)) : 0;
    return <Room t={t} id="hef" t0={440} cam={cam} dark={kf(t, [[0, 0.04], [len, 0.3]]) + flick} people={<Hero look={MOM} pose={mom} rimId="rimL" shadow={0.5} />} top={<Plate x={PLATE1.x} y={PLATE1.y} s={0.66} />} />;
  };

  // h · He reads it, and looks up. She has come round the island without a sound.
  const h: React.FC<ShotProps> = ({ t, len }) => {
    const cam = camAt(t, [[0, H.x + 6, H.y - 150, 2.7, 1], [44, H.x - 20, H.y - 148, 2.45, 1], [80, 1000, 566, 1.72, 2.6], [len, 992, 560, 1.9, 3.6]], 0.8, 7, [[84, 4]]);
    const face = faceAt(t, [[0, 'worried'], [84, 'shock']]);
    const me = alive({
      ...poseAt(t, [
        { f: 0, p: { ...at(H), yaw: -0.15, look: 0, headTilt: -14, tilt: -2, armL: { a: 34, b: 62 }, armR: { a: 30, b: -58 } } },
        { f: 50, p: { headTilt: -14 } },
        { f: 62, p: { headTilt: 0, yaw: -0.55, look: -1 }, ease: easeInOut },
        { f: 84, p: { tilt: 0 } },
        { f: 90, p: { tilt: 6, headTilt: -5, squash: -0.03 }, ease: easeOut },
        { f: 98, p: { tilt: 4, squash: 0 } },
      ]),
      ...face,
    }, t, 5, { calm: 0.5 });
    const glide = easeInOut(clamp((t - 30) / 46));
    const mface = faceAt(t, [[0, 'neutral'], [94, 'happy']]);
    const mom = { ...alive({ ...basePose, ...at(I), x: I.x + 96 * glide, yaw: 0.3, look: 1, tilt: 8 + 3 * glide, headTilt: 15 + 4 * glide, armR: { a: 26, b: -14 }, armL: { a: 22, b: -30 } }, t, 2, { noBlink: true, calm: 0.25 }), ...mface };
    return (
      <Room t={t} id="heh" t0={575} cam={cam} dark={kf(t, [[0, 0.2], [len, 0.36]])} people={<g><Hero look={MOM} pose={mom} rimId="rimL" shadow={0.5} /><Hero look={ME} pose={me} rimId="rimBlue" shadow={0.5} /></g>}
        top={<g><Plate x={PLATE1.x} y={PLATE1.y} s={0.66} /><Glow x={H.x - 6} y={H.y + 40} r={170} kind="cool" o={0.5 * clamp(1 - (t - 56) / 14)} /></g>} />
    );
  };

  return { a, b, c, d, e, f, h };
};
