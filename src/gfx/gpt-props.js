// Isolated modeling catalog. Existing builder keys and target pools stay intact.
import { registerFurniture } from './furniture.js';
import { ITEMS } from './items.js';
import { GPT_ITEMS } from './gpt-items.js';
import { GPT_FURNITURE_BUILDERS, GPT_FURNITURE_INFO } from './gpt-furniture.js';
import { GPT_VEHICLE_BUILDERS, GPT_VEHICLE_INFO } from './gpt-vehicles.js';

export { GPT_ITEMS };
export const GPT_BUILDERS = { ...GPT_FURNITURE_BUILDERS, ...GPT_VEHICLE_BUILDERS };
export const GPT_INFO = { ...GPT_FURNITURE_INFO, ...GPT_VEHICLE_INFO };
export function registerGptProps({ items = true } = {}) {
  registerFurniture(GPT_BUILDERS, Object.fromEntries(Object.entries(GPT_INFO).map(([k, v]) => [k, { ...v, hidden: true }])));
  if (items) Object.assign(ITEMS, GPT_ITEMS);
}

// Opt-in comparison at the exact original footprint. No stage file is rewritten.
export function applyGptVehiclePreview(layouts, mode = 'new') {
  const replace = { firetruck: 'gpt_firetruck', patrolcar: 'gpt_policecar' };
  for (const key of ['firestation', 'policefront', 'firehouse']) {
    const layout = layouts[key];
    if (!layout) continue;
    layout.furniture = layout.furniture.filter(fd => !(mode === 'pair' && fd.type === 'bike2')).flatMap(fd => {
      const type = replace[fd.type];
      if (!type) return [fd];
      // "pair" uses the open front apron, separated from the old vehicle.
      if (mode === 'pair') return [fd, { ...fd, type, i: key === 'policefront' ? 5 : 1, j: 4 }];
      return [{ ...fd, type }];
    });
  }
}
