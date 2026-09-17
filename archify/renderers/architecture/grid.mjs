/** Grid placement for architecture IR (#8). Not auto-layout — fixed cell math only. */
import { SYSTEM_TOKENS } from '../shared/system-tokens.mjs';

export const DEFAULT_GRID = {
  mode: 'grid',
  origin: [40, 80],
  cols: 4,
  gapX: SYSTEM_TOKENS.gutter.empty, // 40: empty column gutter pairs the 260 card
  gapY: 40, // pinned: row rhythm unchanged
  cellW: SYSTEM_TOKENS.card.width, // 260: cells fit default cards exactly
  cellH: 64, // pinned: fits default 60px cards unchanged
};

export function gridLayout(arch) {
  const raw = arch.layout;
  if (!raw || raw.mode !== 'grid') return null;
  return { ...DEFAULT_GRID, ...raw };
}

export function resolveComponentPos(component, grid) {
  if (Array.isArray(component.pos) && component.pos.length === 2) {
    return component.pos;
  }
  if (!grid) return [NaN, NaN];
  if (!Number.isInteger(component.row) || !Number.isInteger(component.col)) {
    return [NaN, NaN];
  }
  const [ox, oy] = grid.origin;
  const stepX = grid.cellW + grid.gapX;
  const stepY = grid.cellH + grid.gapY;
  return [ox + component.col * stepX, oy + component.row * stepY];
}

export function validateGridPlacement(arch, grid, problems) {
  if (!grid) return;
  if (arch.layout !== undefined && arch.layout.mode !== 'grid') {
    problems.push('layout.mode must be "grid" when layout is set (free placement omits layout entirely).');
    return;
  }
  const seen = new Map();
  for (const c of arch.components ?? []) {
    const hasPos = Array.isArray(c.pos) && c.pos.length === 2;
    const hasCell = Number.isInteger(c.row) && Number.isInteger(c.col);
    if (hasPos) continue; // pos wins; row/col are optional hints only
    if (!hasPos && !hasCell) {
      problems.push(`Component "${c.id}" needs pos [x,y] or grid row/col when layout.mode is "grid".`);
      continue;
    }
    if (c.row < 0 || c.col < 0) {
      problems.push(`Component "${c.id}" row/col must be non-negative integers.`);
      continue;
    }
    if (c.col >= grid.cols) {
      problems.push(`Component "${c.id}" col ${c.col} exceeds layout.cols ${grid.cols} (valid: 0..${grid.cols - 1}).`);
    }
    const key = `${c.row},${c.col}`;
    if (seen.has(key)) {
      problems.push(`Components "${seen.get(key)}" and "${c.id}" share grid cell row ${c.row} col ${c.col}.`);
    } else {
      seen.set(key, c.id);
    }
  }
}
