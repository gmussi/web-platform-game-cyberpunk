import { WorldMapData, ExitZone } from "../types/map";
import { createSeededRng, rngInt } from "../utils/seededRng";

export type Algorithm = "cave" | "outside" | "corridor";

export interface FillOptions {
  algorithm: Algorithm;
  seed: string;
}

type Grid = number[][]; // 0 = empty, 1 = solid

function dimsFromMap(map: WorldMapData): { w: number; h: number } {
  const tileSize = map.world.tileSize || 32;
  const w = Math.max(1, Math.floor(map.world.width / tileSize));
  const h = Math.max(1, Math.floor(map.world.height / tileSize));
  return { w, h };
}

function makeGrid(w: number, h: number, fill: number): Grid {
  const g: Grid = new Array(h);
  for (let y = 0; y < h; y++) {
    const row = new Array(w);
    for (let x = 0; x < w; x++) row[x] = fill;
    g[y] = row;
  }
  return g;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function carveRect(
  grid: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void {
  const w = grid[0].length;
  const h = grid.length;
  const sx = Math.max(0, Math.min(x0, x1));
  const ex = Math.min(w - 1, Math.max(x0, x1));
  const sy = Math.max(0, Math.min(y0, y1));
  const ey = Math.min(h - 1, Math.max(y0, y1));
  for (let y = sy; y <= ey; y++) {
    for (let x = sx; x <= ex; x++) grid[y][x] = 0;
  }
}

function fillRect(
  grid: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void {
  const w = grid[0].length;
  const h = grid.length;
  const sx = Math.max(0, Math.min(x0, x1));
  const ex = Math.min(w - 1, Math.max(x0, x1));
  const sy = Math.max(0, Math.min(y0, y1));
  const ey = Math.min(h - 1, Math.max(y0, y1));
  for (let y = sy; y <= ey; y++) {
    for (let x = sx; x <= ex; x++) grid[y][x] = 1;
  }
}

function carveLine(
  grid: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  halfWidth = 1
): void {
  let x = x0;
  let y = y0;
  const dx = Math.sign(x1 - x0);
  const dy = Math.sign(y1 - y0);
  while (x !== x1 || y !== y1) {
    carveRect(grid, x - halfWidth, y - halfWidth, x + halfWidth, y + halfWidth);
    if (x !== x1) x += dx;
    if (y !== y1) y += dy;
  }
  carveRect(
    grid,
    x1 - halfWidth,
    y1 - halfWidth,
    x1 + halfWidth,
    y1 + halfWidth
  );
}

function exitMidCell(
  exit: ExitZone,
  w: number,
  h: number
): { x: number; y: number } {
  const mid = Math.round((exit.tileStart + exit.tileEnd) / 2);
  switch (exit.edge) {
    case "left":
      return { x: 0, y: clamp(mid, 0, h - 1) };
    case "right":
      return { x: w - 1, y: clamp(mid, 0, h - 1) };
    case "top":
      return { x: clamp(mid, 0, w - 1), y: 0 };
    case "bottom":
      return { x: clamp(mid, 0, w - 1), y: h - 1 };
  }
}

function carveExitAperture(grid: Grid, exit: ExitZone, widthTiles = 2): void {
  const w = grid[0].length;
  const h = grid.length;
  if (exit.edge === "top" || exit.edge === "bottom") {
    const y = exit.edge === "top" ? 0 : h - 1;
    for (let x = exit.tileStart; x <= exit.tileEnd; x++) {
      for (let i = 0; i < widthTiles; i++) {
        const yy = exit.edge === "top" ? y + i : y - i;
        if (x >= 0 && x < w && yy >= 0 && yy < h) grid[yy][x] = 0;
      }
    }
  } else {
    const x = exit.edge === "left" ? 0 : w - 1;
    for (let y = exit.tileStart; y <= exit.tileEnd; y++) {
      for (let i = 0; i < widthTiles; i++) {
        const xx = exit.edge === "left" ? x + i : x - i;
        if (y >= 0 && y < h && xx >= 0 && xx < w) grid[y][xx] = 0;
      }
    }
  }
}

function connectExitsToCenter(
  grid: Grid,
  exits: ExitZone[],
  halfWidth = 1
): void {
  const w = grid[0].length;
  const h = grid.length;
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  for (const e of exits) {
    const m = exitMidCell(e, w, h);
    // move one tile inward before connecting
    const ix =
      e.edge === "left"
        ? clamp(m.x + 2, 0, w - 1)
        : e.edge === "right"
        ? clamp(m.x - 2, 0, w - 1)
        : m.x;
    const iy =
      e.edge === "top"
        ? clamp(m.y + 2, 0, h - 1)
        : e.edge === "bottom"
        ? clamp(m.y - 2, 0, h - 1)
        : m.y;
    carveLine(grid, ix, iy, cx, cy, halfWidth);
  }
  // hub opening
  carveRect(
    grid,
    cx - (halfWidth + 1),
    cy - (halfWidth + 1),
    cx + (halfWidth + 1),
    cy + (halfWidth + 1)
  );
}

// Cellular automata helpers for cave-like generation
function randomFillGrid(
  grid: Grid,
  rng: () => number,
  fillChance = 0.52
): void {
  const w = grid[0].length;
  const h = grid.length;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const isBorder = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      grid[y][x] = isBorder ? 1 : rng() < fillChance ? 1 : 0;
    }
  }
}

function countSolidNeighbors(grid: Grid, x: number, y: number): number {
  let c = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) {
        c++; // treat out-of-bounds as solid to favor closed caves
      } else if (grid[ny][nx] === 1) {
        c++;
      }
    }
  }
  return c;
}

function smoothCave(grid: Grid, iterations = 5): void {
  const w = grid[0].length;
  const h = grid.length;
  for (let it = 0; it < iterations; it++) {
    const copy = grid.map((row) => row.slice());
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = countSolidNeighbors(copy, x, y);
        grid[y][x] = n > 4 ? 1 : n < 4 ? 0 : grid[y][x];
      }
    }
  }
  // enforce border walls
  for (let x = 0; x < w; x++) {
    grid[0][x] = 1;
    grid[h - 1][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    grid[y][0] = 1;
    grid[y][w - 1] = 1;
  }
}

function algorithmCave(map: WorldMapData, seed: string): Grid {
  const { w, h } = dimsFromMap(map);
  const rng = createSeededRng(seed);
  const grid = makeGrid(w, h, 1);

  // 1) Random initial fill (walls) then smooth to form cave shapes
  randomFillGrid(grid, rng, 0.55);
  smoothCave(grid, 5);

  // 2) Ensure a stronger floor band to support traversal
  const floorBand = Math.max(2, Math.floor(h * 0.05));
  fillRect(grid, 0, h - floorBand, w - 1, h - 1);

  // 3) Carve exit apertures and connect to center with tunnels
  for (const e of map.exits || []) carveExitAperture(grid, e, 3);
  connectExitsToCenter(grid, map.exits || [], 1);

  // 4) If cave became too open, add reinforcement strips
  const solidCount = grid.reduce(
    (acc, row) => acc + row.filter((v) => v === 1).length,
    0
  );
  const total = w * h;
  if (solidCount / total < 0.35) {
    // add horizontal ribs
    for (let yb = 3; yb < h - 3; yb += 5) {
      for (let x = 2; x < w - 2; x++) if (rng() < 0.65) grid[yb][x] = 1;
    }
  }

  // 5) Final smoothing pass to clean artifacts, keep borders
  smoothCave(grid, 1);

  ensureNoSingleEmptyGaps(grid);
  ensureConnectivity(grid, map.exits || []);
  return grid;
}

function algorithmOutside(map: WorldMapData, seed: string): Grid {
  const { w, h } = dimsFromMap(map);
  const grid = makeGrid(w, h, 0);
  const rng = createSeededRng(seed);
  // Baseline ground
  let y = Math.floor(h * 0.75);
  const minY = Math.floor(h * 0.55);
  const maxY = Math.floor(h * 0.9);
  const heights = new Array(w);
  for (let x = 0; x < w; x++) {
    y += rngInt(rng, -1, 1);
    y = clamp(y, minY, maxY);
    heights[x] = y;
    for (let yy = y; yy < h; yy++) grid[yy][x] = 1;
  }
  // A few floating platforms
  const plats = 8;
  for (let i = 0; i < plats; i++) {
    const len = rngInt(rng, 3, 8);
    const px = rngInt(rng, 2, w - len - 2);
    const py = clamp(
      rngInt(rng, Math.floor(h * 0.25), Math.floor(h * 0.65)),
      2,
      h - 3
    );
    fillRect(grid, px, py, px + len, py);
  }
  // Carve exits apertures at edges
  for (const e of map.exits || []) carveExitAperture(grid, e, 3);
  // Ensure a gentle ramp near top/bottom exits
  for (const e of map.exits || []) {
    if (e.edge === "bottom") {
      // make a small stair up from the bottom exit inward
      for (let i = 0; i < 4; i++)
        carveRect(
          grid,
          clamp(e.tileStart - i, 0, w - 1),
          h - 1 - i,
          clamp(e.tileEnd + i, 0, w - 1),
          h - 1 - i
        );
    }
    if (e.edge === "top") {
      // clear a well below top exit
      carveRect(
        grid,
        clamp(e.tileStart - 1, 0, w - 1),
        0,
        clamp(e.tileEnd + 1, 0, w - 1),
        4
      );
    }
  }
  ensureNoSingleEmptyGaps(grid);
  ensureConnectivity(grid, map.exits || []);
  return grid;
}

function algorithmCorridor(map: WorldMapData, seed: string): Grid {
  const { w, h } = dimsFromMap(map);
  const grid = makeGrid(w, h, 0);
  // Enclose borders
  fillRect(grid, 0, 0, w - 1, 0);
  fillRect(grid, 0, h - 1, w - 1, h - 1);
  fillRect(grid, 0, 0, 0, h - 1);
  fillRect(grid, w - 1, 0, w - 1, h - 1);
  // Main floor and thin ceiling
  const floorY = h - 3;
  fillRect(grid, 1, floorY, w - 2, floorY);
  fillRect(grid, 1, 2, w - 2, 2);

  // Carve exits apertures through borders
  for (const e of map.exits || []) carveExitAperture(grid, e, 3);

  // Ensure paths from exits to a walkway near mid height
  const connectY = Math.floor(h * 0.6);
  for (const e of map.exits || []) {
    const m = exitMidCell(e, w, h);
    const ix =
      e.edge === "left"
        ? clamp(m.x + 2, 1, w - 2)
        : e.edge === "right"
        ? clamp(m.x - 2, 1, w - 2)
        : m.x;
    const iy =
      e.edge === "top"
        ? clamp(m.y + 2, 1, h - 2)
        : e.edge === "bottom"
        ? clamp(m.y - 2, 1, h - 2)
        : m.y;
    carveLine(grid, ix, iy, clamp(ix, 2, w - 3), connectY, 1);
  }
  // Some mid-air platforms
  const rng = createSeededRng(seed);
  for (let i = 0; i < 5; i++) {
    const len = rngInt(rng, 4, 10);
    const px = rngInt(rng, 2, w - len - 2);
    const py = clamp(
      rngInt(rng, Math.floor(h * 0.35), Math.floor(h * 0.55)),
      3,
      h - 4
    );
    fillRect(grid, px, py, px + len, py);
  }
  ensureNoSingleEmptyGaps(grid);
  ensureConnectivity(grid, map.exits || []);
  return grid;
}

export function fillRoom(map: WorldMapData, opts: FillOptions): number[][] {
  const seed = opts.seed || `${map.id}-seed`;
  switch (opts.algorithm) {
    case "cave":
      return algorithmCave(map, seed);
    case "outside":
      return algorithmOutside(map, seed);
    case "corridor":
      return algorithmCorridor(map, seed);
    default:
      return algorithmCorridor(map, seed);
  }
}

// Default export for safer dynamic requires
export default { fillRoom };

// Post-process: eliminate single empty gaps between solids horizontally/vertically
function ensureNoSingleEmptyGaps(grid: Grid): void {
  const w = grid[0].length;
  const h = grid.length;

  for (let pass = 0; pass < 3; pass++) {
    let changed = false;

    // Horizontal patterns: [1,0,1] -> expand to at least two empties
    for (let y = 0; y < h; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (grid[y][x - 1] === 1 && grid[y][x] === 0 && grid[y][x + 1] === 1) {
          if (x + 2 < w && grid[y][x + 2] === 0) {
            grid[y][x + 1] = 0;
          } else if (x - 2 >= 0 && grid[y][x - 2] === 0) {
            grid[y][x - 1] = 0;
          } else if (x + 1 < w) {
            grid[y][x + 1] = 0;
          }
          changed = true;
        }
      }
    }

    // Vertical patterns
    for (let x = 0; x < w; x++) {
      for (let y = 1; y < h - 1; y++) {
        if (grid[y - 1][x] === 1 && grid[y][x] === 0 && grid[y + 1][x] === 1) {
          if (y + 2 < h && grid[y + 2][x] === 0) {
            grid[y + 1][x] = 0;
          } else if (y - 2 >= 0 && grid[y - 2][x] === 0) {
            grid[y - 1][x] = 0;
          } else if (y + 1 < h) {
            grid[y + 1][x] = 0;
          }
          changed = true;
        }
      }
    }

    if (!changed) break;
  }
}

// Ensure all empty spaces are connected to the playable region (exits/hub)
function ensureConnectivity(grid: Grid, exits: ExitZone[] = []): void {
  const w = grid[0].length;
  const h = grid.length;

  const visited: boolean[][] = new Array(h);
  for (let y = 0; y < h; y++) visited[y] = new Array(w).fill(false);

  const queue: Array<{ x: number; y: number }> = [];

  function pushSeed(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    if (grid[y][x] !== 0) return;
    if (visited[y][x]) return;
    visited[y][x] = true;
    queue.push({ x, y });
  }

  // Center hub
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  pushSeed(cx, cy);

  // Exit midpoints and one step inward
  for (const e of exits) {
    const m = exitMidCell(e, w, h);
    pushSeed(m.x, m.y);
    const ix =
      e.edge === "left"
        ? Math.min(m.x + 1, w - 1)
        : e.edge === "right"
        ? Math.max(m.x - 1, 0)
        : m.x;
    const iy =
      e.edge === "top"
        ? Math.min(m.y + 1, h - 1)
        : e.edge === "bottom"
        ? Math.max(m.y - 1, 0)
        : m.y;
    pushSeed(ix, iy);
  }

  // Flood fill over empty cells (4-neighborhood)
  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];
    for (const n of neighbors) {
      if (n.x < 0 || n.y < 0 || n.x >= w || n.y >= h) continue;
      if (visited[n.y][n.x]) continue;
      if (grid[n.y][n.x] !== 0) continue;
      visited[n.y][n.x] = true;
      queue.push(n);
    }
  }

  // Convert unreachable empties into solid to remove inaccessible pockets
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 0 && !visited[y][x]) {
        grid[y][x] = 1;
      }
    }
  }
}
