import { WorldGraph } from "../types/worldgen";
import { WorldData, WorldMapData, ExitZone } from "../types/map";
import { createSeededRng, rngInt } from "../utils/seededRng";

type RoomPos = { x: number; y: number };

// BFS-derived layout from starting map to reduce contradictory directions
function bfsLayout(graph: WorldGraph): Record<string, RoomPos> {
  const pos: Record<string, RoomPos> = {};
  const occupied = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const isFree = (x: number, y: number) => !occupied.has(key(x, y));
  const setPos = (id: string, x: number, y: number) => {
    pos[id] = { x, y };
    occupied.add(key(x, y));
  };

  const nodeDepth: Record<string, number> = Object.fromEntries(
    graph.nodes.map((n) => [n.id, n.depth])
  );
  const neighbors: Record<string, Set<string>> = {};
  for (const e of graph.edges) {
    (neighbors[e.from] ||= new Set()).add(e.to);
    (neighbors[e.to] ||= new Set()).add(e.from);
  }

  const start = graph.start;
  setPos(start, 0, 0);
  const visited = new Set<string>();
  const queue: string[] = [start];
  const siblingCount: Record<string, number> = {};

  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);

    const curPos = pos[cur];
    const curDepth = nodeDepth[cur] ?? 0;
    const neigh = Array.from(neighbors[cur] || []).sort();

    let horizIndex = 0;
    for (const nb of neigh) {
      if (pos[nb]) continue;
      const nbDepth = nodeDepth[nb] ?? curDepth;

      const candidates: RoomPos[] = [];
      if (nbDepth > curDepth) {
        const dx = 1 + horizIndex++;
        candidates.push({ x: curPos.x + dx, y: curPos.y });
        candidates.push({ x: curPos.x + dx, y: curPos.y + 1 });
        candidates.push({ x: curPos.x + dx, y: curPos.y - 1 });
      } else if (nbDepth < curDepth) {
        const dx = 1 + horizIndex++;
        candidates.push({ x: curPos.x - dx, y: curPos.y });
        candidates.push({ x: curPos.x - dx, y: curPos.y + 1 });
        candidates.push({ x: curPos.x - dx, y: curPos.y - 1 });
      } else {
        const idx = (siblingCount[cur] = (siblingCount[cur] || 0) + 1);
        const dy = idx;
        candidates.push({ x: curPos.x, y: curPos.y + dy });
        candidates.push({ x: curPos.x, y: curPos.y - dy });
      }

      let chosen: RoomPos | null = null;
      for (const c of candidates) {
        if (isFree(c.x, c.y)) {
          chosen = c;
          break;
        }
      }
      if (!chosen) {
        // fallback spiral
        for (let r = 1; r <= 12 && !chosen; r++) {
          for (let dx = -r; dx <= r && !chosen; dx++) {
            for (let dy = -r; dy <= r; dy++) {
              const x = curPos.x + dx;
              const y = curPos.y + dy;
              if (isFree(x, y)) {
                chosen = { x, y };
                break;
              }
            }
          }
        }
      }
      if (chosen) {
        setPos(nb, chosen.x, chosen.y);
        queue.push(nb);
      }
    }
  }
  return pos;
}

function chooseEdge(
  a: RoomPos,
  b: RoomPos
): "left" | "right" | "top" | "bottom" {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "bottom" : "top";
}

function neighborsFromEdges(graph: WorldGraph): Record<string, string[]> {
  const neighbors: Record<string, Set<string>> = {};
  for (const e of graph.edges) {
    neighbors[e.from] = neighbors[e.from] || new Set<string>();
    neighbors[e.to] = neighbors[e.to] || new Set<string>();
    neighbors[e.from].add(e.to);
    neighbors[e.to].add(e.from);
  }
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(neighbors)) out[k] = Array.from(neighbors[k]);
  return out;
}

function buildExitsForRoom(
  roomId: string,
  neighbors: Array<{
    target: string;
    edge: "left" | "right" | "top" | "bottom";
  }>,
  mapWidthTiles: number,
  mapHeightTiles: number,
  tileSize: number
): ExitZone[] {
  const byEdge: Record<
    "left" | "right" | "top" | "bottom",
    { target: string }[]
  > = {
    left: [],
    right: [],
    top: [],
    bottom: [],
  };
  neighbors.forEach((n) => byEdge[n.edge].push({ target: n.target }));
  const exits: ExitZone[] = [];

  const makeExit = (
    edge: "left" | "right" | "top" | "bottom",
    targetMapId: string,
    slotIndex: number,
    slotsCount: number
  ): ExitZone => {
    const edgePos = (slotIndex + 1) / (slotsCount + 1); // 0..1
    const thickness = 1; // tiles
    if (edge === "top" || edge === "bottom") {
      const col = Math.max(
        0,
        Math.min(mapWidthTiles - 1, Math.round(edgePos * mapWidthTiles))
      );
      const tileStart = Math.max(0, col - 1);
      const tileEnd = Math.min(mapWidthTiles - 1, col + 1);
      const yTile = edge === "top" ? 0 : mapHeightTiles - 1;
      return {
        id: `${roomId}_to_${targetMapId}_${edge}_${slotIndex}`,
        x: tileStart * tileSize,
        y: yTile * tileSize,
        width: (tileEnd - tileStart + 1) * tileSize,
        height: thickness * tileSize,
        edge,
        edgePosition: edgePos,
        edgeStart: tileStart / mapWidthTiles,
        edgeEnd: tileEnd / mapWidthTiles,
        tileStart,
        tileEnd,
        targetMapId,
      };
    } else {
      const row = Math.max(
        0,
        Math.min(mapHeightTiles - 1, Math.round(edgePos * mapHeightTiles))
      );
      const tileStart = Math.max(0, row - 1);
      const tileEnd = Math.min(mapHeightTiles - 1, row + 1);
      const xTile = edge === "left" ? 0 : mapWidthTiles - 1;
      return {
        id: `${roomId}_to_${targetMapId}_${edge}_${slotIndex}`,
        x: xTile * tileSize,
        y: tileStart * tileSize,
        width: thickness * tileSize,
        height: (tileEnd - tileStart + 1) * tileSize,
        edge,
        edgePosition: edgePos,
        edgeStart: tileStart / mapHeightTiles,
        edgeEnd: tileEnd / mapHeightTiles,
        tileStart,
        tileEnd,
        targetMapId,
      };
    }
  };

  [
    "top" as const,
    "bottom" as const,
    "left" as const,
    "right" as const,
  ].forEach((ed) => {
    const list = byEdge[ed];
    list.forEach((n, i) => exits.push(makeExit(ed, n.target, i, list.length)));
  });

  return exits;
}

export function convertToWorldData(
  graph: WorldGraph,
  opts?: {
    tileSize?: number;
    roomWidthTiles?: number; // ignored in adaptive sizing; kept for backwards compat
    roomHeightTiles?: number; // ignored in adaptive sizing; kept for backwards compat
    author?: string;
  }
): WorldData {
  const tileSize = opts?.tileSize ?? 32;
  const author = opts?.author ?? "WorldGen";

  const layout = bfsLayout(graph);
  const neighborMap: Record<string, string[]> = (function () {
    return neighborsFromEdges(graph);
  })();

  const maps: Record<string, WorldMapData> = {};
  for (const n of graph.nodes) {
    const pos = layout[n.id];
    const neigh = (neighborMap[n.id] || []).map((t) => ({
      target: t,
      edge: chooseEdge(pos, layout[t]),
    }));

    // Adaptive room sizing based on exits
    // Derive per-room RNG from world seed and room id for reproducible variety
    const rng = createSeededRng(`${String(graph.seed)}-roomsize-${n.id}`);
    let widthTiles = 25; // start size width (columns)
    let heightTiles = 10; // start size height (rows)

    const counts = { top: 0, bottom: 0, left: 0, right: 0 } as Record<
      "top" | "bottom" | "left" | "right",
      number
    >;
    for (const nb of neigh) counts[nb.edge]++;

    // If at least one top and one bottom exit, add 25-50 rows (height)
    if (counts.top > 0 && counts.bottom > 0) {
      heightTiles += rngInt(rng, 10, 25);
    }
    if (counts.left > 0 && counts.right > 0) {
      widthTiles += rngInt(rng, 10, 25);
    }
    // For each top and bottom exit, add 25-50 columns (width)
    for (let i = 0; i < counts.top; i++) widthTiles += rngInt(rng, 10, 25);
    for (let i = 0; i < counts.bottom; i++) widthTiles += rngInt(rng, 10, 25);
    // For each left and right exit, add 25-50 rows (height)
    for (let i = 0; i < counts.left; i++) heightTiles += rngInt(rng, 10, 25);
    for (let i = 0; i < counts.right; i++) heightTiles += rngInt(rng, 10, 25);

    const exits = buildExitsForRoom(
      n.id,
      neigh,
      widthTiles,
      heightTiles,
      tileSize
    );

    maps[n.id] = {
      id: n.id,
      version: "2.0",
      metadata: {
        name: n.label ?? n.id,
        description: `Auto-generated from seed ${graph.seed}`,
        created: new Date().toISOString(),
        author,
      },
      world: {
        width: widthTiles * tileSize,
        height: heightTiles * tileSize,
        tileSize,
      },
      exits,
      portal: null,
      enemies: [],
      platforms: [],
      collectibles: [],
      checkpoints: [],
      tiles: [],
      walls: [] as any,
      decoration: [] as any,
      gridPosition: { x: pos.x, y: pos.y },
      gridHeight: 1,
    };
  }

  const world: WorldData = {
    version: "2.0",
    metadata: {
      name: `World ${graph.seed}`,
      description: `Generated ${graph.nodes.length} rooms (tool output)`,
      author,
      created: new Date().toISOString(),
    },
    seed: String(graph.seed),
    startingMap: graph.start,
    startingSpawn: "default",
    startingPosition: {
      x: 100,
      y: (maps[graph.start]?.world?.height || 25 * tileSize) - 112,
    },
    maps,
  };

  return world;
}

export function exportWorldData(world: WorldData): string {
  return JSON.stringify(world, null, 2);
}
