import React from 'react';
import { defineEpisode, Timeline, LookDef, HudChip } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12 } from './shots';

// The power's look. DUY (hear): the picture cools a touch and a DUY chip blinks, placed inside the vertical
// frame's centre column. The rings and the thought bubble are drawn in the shots.
const hearLook: LookDef = {
  grade: (lv) => `saturate(${1 + 0.06 * lv}) hue-rotate(${-7 * lv}deg) brightness(${1 + 0.04 * lv})`,
  Overlay: ({ f }) => (
    <g transform="translate(704 222) scale(0.86)">
      <HudChip x={0} y={0} f={f} label="DUY" icon="dot" />
    </g>
  ),
};

export const dusunce = defineEpisode('Dusunce', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12 },
  looks: { hear: hearLook },
});
