import { buildEpisode } from '../son-insan/kit';
import ep from './episode.json';
import timeline from './timeline.json';
import * as custom from './shots';

export const episode = buildEpisode(ep, timeline, custom);
