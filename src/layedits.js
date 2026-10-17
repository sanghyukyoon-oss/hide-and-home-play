// 배치 편집: the player's own fixes to the stage rooms — furniture, wall pieces, wallpaper and floor — kept on this
// device and applied by layoutFor() to every stage that uses that room. "내보내기" copies them as JSON so they can be
// baked into stages.js for everyone. Stored apart from the save, so a bad edit can never touch coins or progress.
//   EDITS[roomKey] = { furniture: [...], decor: [...], door, theme: {...} }            (a single room)
//   EDITS[mapKey]  = { rooms: [{ furniture, decor, door }, ...], theme: {...} }        (a wide map, room by room)
const KEY = 'sumbakkokjip.layouts';
export const EDITS = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
export function saveEdits() { try { localStorage.setItem(KEY, JSON.stringify(EDITS)); } catch {} }

const clone = o => JSON.parse(JSON.stringify(o));
const pick = L => ({ furniture: clone(L.furniture || []), decor: clone(L.decor || []), ...(L.door ? { door: clone(L.door) } : {}) });
const put = (L, e) => { if (!e) return; if (e.furniture) L.furniture = clone(e.furniture); if (e.decor) L.decor = clone(e.decor); if (e.door) L.door = clone(e.door); };

// the edit for a built layout (single room, or a map's rooms in order)
export function editOf(lay) {
  const theme = lay.editTheme ? clone(lay.editTheme) : undefined;
  return lay.rooms ? { rooms: lay.rooms.map(r => pick(r.layout)), theme } : { ...pick(lay), theme };
}
// lay this key's edit over a fresh layout (in place); returns the layout
export function applyEdit(key, lay, e = EDITS[key]) {
  if (!e) return lay;
  // an edited room stands exactly as the editor placed it: no automatic tidying of its wall pieces
  if (lay.rooms) {
    (e.rooms || []).forEach((er, i) => { if (lay.rooms[i]) { lay.rooms[i].layout = { ...lay.rooms[i].layout, exact: true }; put(lay.rooms[i].layout, er); } });
    if (e.theme) { lay.theme = { ...(lay.theme || {}), ...e.theme }; lay.rooms.forEach(r => { r.layout.theme = { ...(r.layout.theme || {}), ...e.theme }; }); }
  } else {
    put(lay, e); lay.exact = true;
    if (e.theme) lay.theme = { ...(lay.theme || {}), ...e.theme };
  }
  if (e.theme) lay.editTheme = clone(e.theme);
  return lay;
}
