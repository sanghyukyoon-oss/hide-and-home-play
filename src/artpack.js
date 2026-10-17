// Art packs ("looks"): everything you SEE that can be swapped without touching gameplay. Layouts, furniture types,
// opening parts, hiding spots and stories stay in stages.js / story.js; a look only changes how they are drawn.
//   ink & shading (ART)  ·  room palettes  ·  the ground the diorama stands on  ·  the backdrop  ·  UI skin (CSS vars)
// Pick one with ?look=<key> (QA) or save.settings.look; it must be applied before the world and thumbnails are built.
import { ART } from './gfx/style.js';
import { THEMES } from './stages.js';

export const LOOKS = {
  classic: { name: '지금 버전' },
};

let current = 'classic';
export function lookKey() { return current; }
export function look() { return LOOKS[current]; }

export function chooseLook(settings) {
  const q = new URLSearchParams(location.search).get('look');
  current = LOOKS[q] ? q : LOOKS[settings?.look] ? settings.look : 'classic';
  const L = LOOKS[current];
  if (L.art) Object.assign(ART, L.art);
  if (L.themes) for (const k in THEMES) Object.assign(THEMES[k], typeof L.themes === 'function' ? L.themes(k, THEMES[k]) : L.themes[k] || {});
  if (L.ui) for (const [k, v] of Object.entries(L.ui)) document.documentElement.style.setProperty(k, v);
  document.documentElement.dataset.look = current;
  return current;
}
