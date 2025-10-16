import {
  createSeededRng,
  rngChoice,
  rngInt,
  rngShuffle,
} from "../utils/seededRng";
import {
  Connection,
  GenerateWorldOptions,
  GateRequirement,
  RoomNode,
  WorldGraph,
} from "../types/worldgen";
import { isGraphSolvable, solveProgression } from "./ProgressionSolver";

function normalizeSeed(seed?: string | number): string {
  return String(seed ?? "metroidvania");
}

function createRoomId(index: number): string {
  return `room_${index + 1}`;
}

// Generate a linear critical path of N nodes
function buildCriticalPath(length: number): {
  nodes: RoomNode[];
  edges: Connection[];
} {
  const nodes: RoomNode[] = [];
  const edges: Connection[] = [];
  for (let i = 0; i < length; i++) {
    nodes.push({ id: createRoomId(i), depth: i });
    if (i > 0) {
      edges.push({ from: createRoomId(i - 1), to: createRoomId(i) });
    }
  }
  return { nodes, edges };
}

function addBranches(
  rng: () => number,
  baseNodes: RoomNode[],
  baseEdges: Connection[],
  totalRooms: number,
  branchFactor: number
) {
  const nodes = baseNodes.slice();
  const edges = baseEdges.slice();
  let nextIndex = nodes.length;

  // target total rooms
  while (nodes.length < totalRooms) {
    // pick an attachment point biased toward mid-to-late path
    const attachIdx = rngInt(
      rng,
      Math.floor(nodes.length * 0.3),
      nodes.length - 1
    );
    const branches = Math.max(1, Math.round(branchFactor));
    for (let b = 0; b < branches && nodes.length < totalRooms; b++) {
      const newId = createRoomId(nextIndex++);
      const depth = (nodes[attachIdx]?.depth ?? 0) + 1;
      nodes.push({ id: newId, depth });
      edges.push({ from: nodes[attachIdx].id, to: newId });
    }
  }
  return { nodes, edges };
}

function addLoops(
  rng: () => number,
  nodes: RoomNode[],
  edges: Connection[],
  loopsRatio: number
) {
  const candidates: Array<{ from: string; to: string }> = [];
  const nodeIds = nodes.map((n) => n.id);
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 2; j < nodeIds.length; j++) {
      // avoid redundant immediate neighbors
      candidates.push({ from: nodeIds[i], to: nodeIds[j] });
    }
  }
  const shuffled = rngShuffle(rng, candidates);
  const toAdd = Math.floor(
    shuffled.length * Math.min(Math.max(loopsRatio, 0), 1) * 0.05
  );
  for (let i = 0; i < toAdd; i++) {
    const c = shuffled[i];
    edges.push({ from: c.from, to: c.to });
  }
}

function placeGatesAndKeys(
  rng: () => number,
  nodes: RoomNode[],
  edges: Connection[],
  mode: "keys" | "abilities" | "mixed",
  gateFrequency: number
) {
  const itemPrefix = mode === "abilities" ? "ability" : "key";
  let gateCounter = 0;

  // Avoid gating edges from the start node directly too often
  const startId = nodes[0].id;
  const eligibleEdges = edges.filter((e) => e.from !== startId);
  const gateCount = Math.floor(eligibleEdges.length * gateFrequency);
  const shuffled = rngShuffle(rng, eligibleEdges).slice(0, gateCount);

  for (const edge of shuffled) {
    const itemId = `${itemPrefix}_${++gateCounter}`;
    // gate the edge
    edge.gate = {
      type: itemPrefix === "ability" ? "ability" : "key",
      id: itemId,
    } as GateRequirement;

    // place the item in an earlier reachable node (approx.: pick a node with smaller depth)
    const fromNode = nodes.find((n) => n.id === edge.from)!;
    const candidates = nodes.filter(
      (n) => n.depth <= fromNode.depth && n.id !== edge.to
    );
    const chosen =
      candidates.length > 0 ? rngChoice(rng, candidates) : nodes[0];
    chosen.items = chosen.items || [];
    chosen.items.push(`${edge.gate.type}:${itemId}`);
  }
}

export function generateWorldGraph(options: GenerateWorldOptions): WorldGraph {
  const seedStr = normalizeSeed(options.seed);
  const rng = createSeededRng(seedStr);
  const rooms = Math.max(4, Math.floor(options.rooms));
  const loopsRatio = options.loopsRatio ?? 0.3;
  const branchFactor = options.branchFactor ?? 1.2;
  const gatingMode = options.gating?.mode ?? "keys";
  const gateFrequency = Math.min(
    Math.max(options.gating?.gateFrequency ?? 0.25, 0),
    0.9
  );

  // 1) critical path ~ 40-60% of rooms
  const pathLen = Math.max(3, Math.floor(rooms * 0.5));
  const { nodes: pathNodes, edges: pathEdges } = buildCriticalPath(pathLen);

  // 2) branches to fill remaining rooms
  let { nodes, edges } = addBranches(
    rng,
    pathNodes,
    pathEdges,
    rooms,
    branchFactor
  );

  // 3) optional loops
  addLoops(rng, nodes, edges, loopsRatio);

  // 4) gates and items
  placeGatesAndKeys(rng, nodes, edges, gatingMode, gateFrequency);

  // 5) ensure solvable; simple repair loop limited attempts
  let attempt = 0;
  while (attempt < 5) {
    const solvable = isGraphSolvable({
      nodes,
      edges,
      start: nodes[0].id,
      goal: nodes[pathLen - 1].id,
      seed: seedStr,
    });
    if (solvable) break;

    // basic repair: remove a random gate
    const gated = edges.filter((e) => e.gate);
    if (gated.length === 0) break;
    const victim = rngChoice(rng, gated);
    victim.gate = undefined;
    attempt++;
  }

  return {
    nodes,
    edges,
    start: nodes[0].id,
    goal: nodes[pathLen - 1].id,
    seed: seedStr,
    meta: {
      loopsRatio,
      branchFactor,
      gatingMode,
    },
  };
}
