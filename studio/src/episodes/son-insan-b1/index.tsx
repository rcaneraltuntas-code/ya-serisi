import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { A2, A3, A4, A6, A7, A8, A9, A10 } from '../son-insan-01/shots';
import { B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17 } from './shots';

export const sonInsanB1 = defineEpisode('SonInsanB1', {
  timeline: timeline as Timeline,
  shots: { A2, A3, A4, A6, A7, A8, A9, A10, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17 },
});
