import {
  Connection,
  GateRequirement,
  RoomNode,
  WorldGraph,
} from "../types/worldgen";

export interface ProgressionResult {
  reachableRooms: Set<string>;
  obtainedItems: Set<string>;
  goalReachable: boolean;
}

function canTraverse(
  gate: GateRequirement | undefined,
  obtained: Set<string>
): boolean {
  if (!gate) return true;
  // Items/abilities are represented by their id in obtained
  return obtained.has(`${gate.type}:${gate.id}`);
}

export function solveProgression(graph: WorldGraph): ProgressionResult {
  const nodeById: Record<string, RoomNode> = Object.fromEntries(
    graph.nodes.map((n) => [n.id, n])
  );

  const adjacency: Record<string, Connection[]> = {};
  for (const e of graph.edges) {
    adjacency[e.from] = adjacency[e.from] || [];
    adjacency[e.from].push(e);
  }

  const reachableRooms = new Set<string>();
  const obtainedItems = new Set<string>();

  // Add items present in start room first
  const startNode = nodeById[graph.start];
  if (startNode?.items) {
    for (const item of startNode.items) obtainedItems.add(item);
  }

  let changed = true;
  // Iteratively expand reachability while collecting new items
  while (changed) {
    changed = false;

    const frontier = new Set<string>([graph.start, ...reachableRooms]);

    // BFS from all currently reachable rooms
    const queue: string[] = Array.from(frontier);
    const visited = new Set<string>(frontier);

    while (queue.length > 0) {
      const roomId = queue.shift()!;
      reachableRooms.add(roomId);

      const node = nodeById[roomId];
      if (node?.items) {
        for (const item of node.items) {
          if (!obtainedItems.has(item)) {
            obtainedItems.add(item);
            changed = true;
          }
        }
      }

      const edges = adjacency[roomId] || [];
      for (const edge of edges) {
        if (!visited.has(edge.to) && canTraverse(edge.gate, obtainedItems)) {
          visited.add(edge.to);
          queue.push(edge.to);
        }
      }
    }
  }

  const goalReachable = reachableRooms.has(graph.goal);
  return { reachableRooms, obtainedItems, goalReachable };
}

export function isGraphSolvable(graph: WorldGraph): boolean {
  const result = solveProgression(graph);
  return result.goalReachable;
}
