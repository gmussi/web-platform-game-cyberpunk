// World generation types for abstract Metroidvania-style graphs

export type GateType = "key" | "ability";

export type GateRequirement = {
  type: GateType;
  id: string;
};

export interface PlacedItem {
  type: GateType;
  id: string;
  roomId: string;
}

export interface RoomNode {
  id: string;
  depth: number; // distance from start along the critical path or BFS depth
  label?: string; // optional label for visualization
  items?: string[]; // item ids available in this room (e.g., keys, abilities)
}

export interface Connection {
  from: string;
  to: string;
  gate?: GateRequirement; // if present, this edge requires the item/ability to traverse
}

export interface WorldGraphMeta {
  loopsRatio?: number;
  branchFactor?: number;
  gatingMode?: "keys" | "abilities" | "mixed";
}

export interface WorldGraph {
  nodes: RoomNode[];
  edges: Connection[];
  start: string;
  goal: string;
  seed: string; // normalized seed string used to generate this graph
  meta?: WorldGraphMeta;
}

export interface GenerateWorldOptions {
  rooms: number;
  seed?: string | number;
  style?: "metroidvania";
  loopsRatio?: number; // 0..1 fraction of potential extra edges to introduce as loops
  branchFactor?: number; // average branches per critical-path node (0..~3)
  gating?: {
    mode: "keys" | "abilities" | "mixed";
    gatesCount?: number; // hard count of gates to add (optional)
    gateFrequency?: number; // 0..1 probability an eligible edge is gated
  };
  difficultyCurve?: "flat" | "ramp";
}
