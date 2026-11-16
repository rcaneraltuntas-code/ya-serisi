import { continueRender, delayRender } from 'remotion';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/fragment-mono/400.css';
import '@fontsource/kalam/400.css';
import '@fontsource/kalam/700.css';

// Three faces, bundled locally (fontsource) so renders work offline and Turkish glyphs (latin-ext) are covered.
const SAMPLE = 'AaĞğİıŞşÇçÖöÜü0123?';
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(
    ['600 40px "Bricolage Grotesque"', '700 40px "Bricolage Grotesque"', '800 40px "Bricolage Grotesque"', '400 40px "Fragment Mono"', '400 40px "Kalam"', '700 40px "Kalam"'].map((f) =>
      document.fonts.load(f, SAMPLE),
    ),
  )
    .then(() => document.fonts.ready)
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
}

export const FONT = {
  title: 'Bricolage Grotesque',
  ui: 'Fragment Mono',
  hand: 'Kalam',
};
