import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13 } from './shots';

export const sonInsan01 = defineEpisode('SonInsan01', {
  timeline: timeline as Timeline,
  shots: { A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13 },
});
