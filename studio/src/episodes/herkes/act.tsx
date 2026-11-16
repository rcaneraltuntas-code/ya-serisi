import React from 'react';
import { Pose, Look, clamp, lerp, easeInOut, easeOut, rnd, joints, toWorld, stand, KITCHEN, LEG_LEN, walkPose } from '../../engine';

// HERKES İNGİLİZCE: acting and camera helpers for hand-animated shots (people seen from outside, a camera that
// moves). A shot keys its camera and its actors' poses; these add the life in between.

export type CamKey = [f: number, cx: number, cy: number, zoom: number, rot?: number, ease?: 'io' | 'out' | 'lin'];

/** The camera at frame t from its keys, as an SVG transform. hand: 0..1 handheld drift; kick: [frame, amp] shakes. */
export const camAt = (t: number, keys: CamKey[], hand = 0.5, seed = 1, kick: [number, number][] = []) => {
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i][0] && t <= keys[i + 1][0]) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }
  if (t <= keys[0][0]) b = a = keys[0];
  if (t >= keys[keys.length - 1][0]) a = b = keys[keys.length - 1];
  const raw = b[0] === a[0] ? 1 : clamp((t - a[0]) / (b[0] - a[0]));
  const k = b[5] === 'lin' ? raw : b[5] === 'out' ? easeOut(raw) : easeInOut(raw);
  let cx = lerp(a[1], b[1], k);
  let cy = lerp(a[2], b[2], k);
  const z = lerp(a[3], b[3], k);
  let r = lerp(a[4] ?? 0, b[4] ?? 0, k);
  // a hand on the camera: two slow sines per axis, never quite repeating
  cx += (Math.sin(t / 19 + seed) + 0.5 * Math.sin(t / 7.7 + seed * 2.3)) * 3.2 * hand / Math.sqrt(z);
  cy += (Math.sin(t / 23 + seed * 1.7) + 0.5 * Math.sin(t / 9.1 + seed * 0.6)) * 2.6 * hand / Math.sqrt(z);
  r += Math.sin(t / 31 + seed * 3.1) * 0.22 * hand;
  for (const [f0, amp] of kick) {
    const d = t - f0;
    if (d >= 0 && d < 10) {
      cx += Math.sin(d * 2.4) * amp * (1 - d / 10);
      cy += Math.cos(d * 3.1) * amp * 0.7 * (1 - d / 10);
    }
  }
  return { cx, cy, z, r, transform: `translate(960 540) rotate(${r.toFixed(3)}) scale(${z.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})` };
};

/**
 * Life on top of a keyed pose: breathing, blinks at an uneven pace, a head that is never quite still, and while
 * the character speaks (talk: [from, to] frames of the shot) a bob on each syllable.
 */
export const alive = (pose: Pose, t: number, seed: number, o: { talk?: [number, number][]; calm?: number; noBlink?: boolean } = {}): Pose => {
  const calm = o.calm ?? 1;
  const br = Math.sin(t / 11 + seed * 2.1);
  const period = 64 + Math.floor(rnd(seed, 3) * 40);
  const ph = (t + Math.floor(rnd(seed, 7) * period)) % period;
  const blink = !o.noBlink && (ph < 3 || (rnd(seed, Math.floor(t / period)) > 0.6 && ph >= 8 && ph < 11)) ? 1 : 0;
  const talking = (o.talk ?? []).some(([a, b]) => t >= a && t <= b);
  const syl = talking ? Math.abs(Math.sin(t * 0.62)) : 0;
  return {
    ...pose,
    y: pose.y + br * 1.3 * pose.scale * calm - syl * 3.2 * pose.scale,
    headTilt: pose.headTilt + Math.sin(t / 17 + seed) * 1.1 * calm + (talking ? Math.sin(t * 0.47) * 2.6 : 0),
    tilt: pose.tilt + (talking ? Math.sin(t * 0.31) * 1.2 : 0),
    armL: { a: pose.armL.a + br * 1.1 * calm, b: pose.armL.b },
    armR: { a: pose.armR.a + br * 1.1 * calm + (talking ? Math.sin(t * 0.5) * 2 : 0), b: pose.armR.b },
    blink: Math.max(pose.blink, blink),
    sway: pose.sway + br * 2,
  };
};

/** Where a hand is in the world. */
export const handAt = (pose: Pose, side: 'armL' | 'armR') => toWorld(pose, joints(pose)[side].end);

/** A standing spot on the kitchen floor: u across, w toward the camera (the counter is at about 0.1, the island 0.4). */
export const spot = (u: number, w: number) => {
  const q = stand(KITCHEN, u, w);
  return { x: q.x, y: q.y, scale: q.scale, floor: q.y + LEG_LEN * q.scale };
};

/** Walking across the floor from one spot to another between frames f0 and f1 (a pose; still before and after). */
export const walkTo = (t: number, f0: number, f1: number, from: [number, number], to: [number, number], extra: Partial<Pose> = {}): Pose | null => {
  if (t < f0 || t > f1) return null;
  const k = easeInOut((t - f0) / (f1 - f0));
  const s = spot(lerp(from[0], to[0], k), lerp(from[1], to[1], k));
  const side = to[0] === from[0] ? 0 : to[0] > from[0] ? 1 : -1;
  const p = walkPose(s.x, (t - f0) * 0.62, s.floor, s.scale, {}, side === 0 ? 1 : (side as 1 | -1));
  return { ...p, ...(side === 0 ? { yaw: 0, tilt: 0 } : {}), ...extra };
};

/** A look seen from behind: the face takes the hood's (or the hair's) colour. */
export const backOf = (l: Look): Look => ({ ...l, skin: l.extra === 'hood' ? l.jacket : l.hair, skinShade: l.extra === 'hood' ? l.jacketShade : l.hair, face: l.extra === 'hood' ? l.jacket : l.hair });

/** A fast pan's smear: wrap the scene in this for the frames the camera whips. */
export const Whip: React.FC<{ id: string; on: number; children: React.ReactNode }> = ({ id, on, children }) =>
  on > 0.02 ? (
    <g>
      <defs>
        <filter id={id} x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation={`${(34 * on).toFixed(1)} 0`} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  ) : (
    <g>{children}</g>
  );
