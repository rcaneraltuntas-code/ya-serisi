import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, R1 } from './shots';
import { B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B17 } from '../son-insan-b1/shots';

// The first cut: the narrator tells it to "you". Same scenes as the short-film cut (son-insan-b1), laid on this take.
export const sonInsan01 = defineEpisode('SonInsan01', {
  timeline: timeline as Timeline,
  shots: { A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, R1, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B17 },
});
