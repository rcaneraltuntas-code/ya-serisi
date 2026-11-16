import React from 'react';
import { LOOKS, Look } from './rig';

// First-person shots: the camera is the hero's eyes, so all we ever see of them is a hand and a sleeve coming in
// from the edge of frame, and their eyelids.

/**
 * The hero's arm reaching into frame: a sleeve from (fx, fy) (off frame, usually below) to the mitten at (x, y).
 * `s` scales the whole arm (1 = a hand about 100 wide, for a shot at zoom 1; divide by the camera zoom inside one).
 */
export const PovHand: React.FC<{ x: number; y: number; fx: number; fy: number; s?: number; look?: Look; rimId?: string; point?: boolean }> = ({ x, y, fx, fy, s = 1, look = LOOKS.pipHood, rimId = 'rimR', point = false }) => {
  const rot = (Math.atan2(x - fx, -(y - fy)) * 180) / Math.PI;
  const len = Math.hypot(x - fx, y - fy) || 1;
  const wx = x - ((x - fx) / len) * 60 * s;
  const wy = y - ((y - fy) / len) * 60 * s;
  return (
    <g filter={`url(#${rimId})`}>
      <path d={`M ${wx} ${wy} L ${fx} ${fy}`} stroke={look.line} strokeWidth={122 * s} strokeLinecap="round" />
      <path d={`M ${wx} ${wy} L ${fx} ${fy}`} stroke={look.limb} strokeWidth={104 * s} strokeLinecap="round" />
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${4.6 * s})`}>
        <rect x={-4} y={10} width={8} height={24} rx={4} fill={look.hand} stroke={look.line} strokeWidth={2.4} />
        <path d="M -11 -2 Q -14 14 -6 18 L 7 18 Q 14 14 11 -2 Z" fill={look.hand} stroke={look.line} strokeWidth={2.6} strokeLinejoin="round" />
        {point ? <rect x={-3.5} y={-16} width={7} height={18} rx={3.5} fill={look.hand} stroke={look.line} strokeWidth={2.4} /> : null}
        <ellipse cx={-10} cy={6} rx={4.5} ry={7} fill={look.hand} stroke={look.line} strokeWidth={2.4} />
      </g>
    </g>
  );
};

/** Eyelids over the whole frame (screen units): open 0 is shut, 1 fully open. Draw it last. */
export const Eyelids: React.FC<{ open: number }> = ({ open }) => {
  if (open >= 1) return null;
  const top = 540 - open * 760;
  const bot = 540 + open * 760;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#000" opacity={(1 - open) * 0.45} />
      <path d={`M -200 -400 L 2120 -400 L 2120 ${top} Q 960 ${top - 380 * open} -200 ${top} Z`} fill="#050308" />
      <path d={`M -200 1480 L 2120 1480 L 2120 ${bot} Q 960 ${bot + 380 * open} -200 ${bot} Z`} fill="#050308" />
    </g>
  );
};
