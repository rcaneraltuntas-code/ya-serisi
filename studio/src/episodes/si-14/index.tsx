import { buildEpisode } from '../son-insan/kit';
import ep from './episode.json';
import timeline from './timeline.json';

export const episode = buildEpisode(ep, timeline);
