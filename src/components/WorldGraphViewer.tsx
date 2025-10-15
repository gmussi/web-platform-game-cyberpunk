import React from "react";
import { WorldGraph } from "../types/worldgen";
import { convertToWorldData } from "../generators/WorldGraphToWorldData";

type GridPos = { x: number; y: number };

function groupExitsByEdge(exits: Array<{ edge: string; edgePosition: number }>) {
  const grouped: Record<string, { edge: string; edgePosition: number }[]> = {
    left: [],
    right: [],
    top: [],
    bottom: [],
  };
  exits.forEach((e) => {
    if (grouped[e.edge]) grouped[e.edge].push(e as any);
  });
  Object.keys(grouped).forEach((k) => grouped[k].sort((a, b) => a.edgePosition - b.edgePosition));
  return grouped;
}

function calculateMapSize(exits: Array<{ edge: string; edgePosition: number }>) {
  const grouped = groupExitsByEdge(exits);
  const maxVertical = Math.max(grouped.left.length, grouped.right.length);
  const maxHorizontal = Math.max(grouped.top.length, grouped.bottom.length);
  return { width: Math.max(1, maxHorizontal), height: Math.max(1, maxVertical) };
}
function calculateLayoutFromWorld(world: any): {
  mapPositions: Record<string, GridPos>;
  mapSizes: Record<string, { width: number; height: number }>;
  totalWidth: number;
  totalHeight: number;
} {
  const mapPositions: Record<string, GridPos> = {};
  const mapSizes: Record<string, { width: number; height: number }> = {};
  const visited = new Set<string>();
  const queue: Array<{ mapId: string; gridX: number; gridY: number }> = [];

  // occupancy helpers for rectangular boxes in grid units
  const occupied = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const occupyRect = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) occupied.add(key(xx, yy));
    }
  };
  const isFreeRect = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) if (occupied.has(key(xx, yy))) return false;
    }
    return true;
  };
  const placeNear = (
    desiredX: number,
    desiredY: number,
    dir: "vertical" | "horizontal",
    w: number,
    h: number
  ): GridPos | null => {
    const maxRadius = 50;
    for (let r = 0; r <= maxRadius; r++) {
      const offsets = [0];
      for (let i = 1; i <= r; i++) offsets.push(i, -i);
      for (const off of offsets) {
        const x = dir === "horizontal" ? desiredX + off : desiredX;
        const y = dir === "vertical" ? desiredY + off : desiredY;
        if (isFreeRect(x, y, w, h)) return { x, y };
      }
    }
    return null;
  };

  // seed sizes
  Object.keys(world.maps).forEach((id) => {
    mapSizes[id] = calculateMapSize(world.maps[id].exits as any);
  });

  const startId: string = world.startingMap;
  mapPositions[startId] = { x: 0, y: 0 };
  occupyRect(0, 0, mapSizes[startId].width, mapSizes[startId].height);
  queue.push({ mapId: startId, gridX: 0, gridY: 0 });

  while (queue.length > 0) {
    const { mapId, gridX, gridY } = queue.shift()!;
    if (visited.has(mapId)) continue;
    visited.add(mapId);

    const mapData = world.maps[mapId];
    if (!mapData) continue;

    const exitsByEdge = groupExitsByEdge(mapData.exits as any);
    Object.keys(exitsByEdge).forEach((edge) => {
      const exits = exitsByEdge[edge];
      if (!exits || exits.length === 0) return;

      exits.forEach((exit: any, idx: number) => {
        const targetId: string = exit.targetMapId;
        if (!targetId || visited.has(targetId)) return;
        if (mapPositions[targetId]) return; // already placed
        const sourceSize = mapSizes[mapId] || { width: 1, height: 1 };
        const targetSize = mapSizes[targetId] || { width: 1, height: 1 };

        // Align exits along the same axis by matching edgePosition centers
        // Find back exit on target and its edgePosition; fallback to 0.5
        const targetMap = world.maps[targetId];
        const targetBackExit = targetMap?.exits?.find((e: any) => e.targetMapId === mapId);
        const backEdgePos = targetBackExit?.edgePosition ?? 0.5;
        const srcEdgePos = exit.edgePosition ?? 0.5;

        let desiredX = gridX;
        let desiredY = gridY;
        let dir: "vertical" | "horizontal" = "horizontal";
        if (edge === "right") {
          desiredX = gridX + sourceSize.width; // immediately to the right (can extend further if needed)
          // align vertical center of exit pips
          desiredY = Math.round(gridY + srcEdgePos * sourceSize.height - backEdgePos * targetSize.height);
          dir = "horizontal"; // search along x only to preserve y alignment
        } else if (edge === "left") {
          desiredX = gridX - targetSize.width; // to the left
          desiredY = Math.round(gridY + srcEdgePos * sourceSize.height - backEdgePos * targetSize.height);
          dir = "horizontal";
        } else if (edge === "bottom") {
          desiredY = gridY + sourceSize.height; // below
          desiredX = Math.round(gridX + srcEdgePos * sourceSize.width - backEdgePos * targetSize.width);
          dir = "vertical"; // search along y only to preserve x alignment
        } else if (edge === "top") {
          desiredY = gridY - targetSize.height; // above
          desiredX = Math.round(gridX + srcEdgePos * sourceSize.width - backEdgePos * targetSize.width);
          dir = "vertical";
        }

        const placed = placeNear(desiredX, desiredY, dir, targetSize.width, targetSize.height);
        if (placed) {
          mapPositions[targetId] = placed;
          occupyRect(placed.x, placed.y, targetSize.width, targetSize.height);
          queue.push({ mapId: targetId, gridX: placed.x, gridY: placed.y });
        }
      });
    });
  }

  // Calculate overall dimensions similar to WorldLayoutSystem
  const totalWidth = Math.max(
    ...Object.keys(mapPositions).map((id) => mapPositions[id].x + (mapSizes[id]?.width || 1))
  );
  const totalHeight = Math.max(
    ...Object.keys(mapPositions).map((id) => mapPositions[id].y + (mapSizes[id]?.height || 1))
  );

  return { mapPositions, mapSizes, totalWidth, totalHeight };
}

export function WorldGraphViewer({ graph }: { graph: WorldGraph }) {
  // Convert abstract graph into WorldData with exits
  const world = React.useMemo(() => convertToWorldData(graph, {
    tileSize: 32,
    roomWidthTiles: 128,
    roomHeightTiles: 25,
    author: "WorldGen",
  }), [graph]);

  // Build layout similar to WorldLayoutSystem (grid positions derived from exits)
  const BOX_SIZE = 80;
  const BOX_SPACING = 20;

  // Compute layout from exits starting at the starting room
  const layout = React.useMemo(() => calculateLayoutFromWorld(world), [world]);
  const mapPositions = layout.mapPositions as Record<string, GridPos>;
  const mapSizes = layout.mapSizes;

  // Compute bounds
  let minGX = Infinity, minGY = Infinity, maxGX = -Infinity, maxGY = -Infinity;
  Object.values(mapPositions).forEach((p) => {
    minGX = Math.min(minGX, p.x);
    minGY = Math.min(minGY, p.y);
    maxGX = Math.max(maxGX, p.x);
    maxGY = Math.max(maxGY, p.y);
  });
  const totalWidth = (layout.totalWidth - minGX) * (BOX_SIZE + BOX_SPACING);
  const totalHeight = (layout.totalHeight - minGY) * (BOX_SIZE + BOX_SPACING);

  const margin = 80;
  const width = Math.max(600, Math.ceil(totalWidth + margin * 2));
  const height = Math.max(400, Math.ceil(totalHeight + margin * 2));
  const originX = margin - minGX * (BOX_SIZE + BOX_SPACING);
  const originY = margin - minGY * (BOX_SIZE + BOX_SPACING);

  return (
    <div
      style={{
        width: "100%",
        maxHeight: "75vh",
        overflow: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#ffffff",
      }}
    >
      <svg width={width} height={height}>
        {/* Connections (lines between exit dots) */}
        {Object.keys(world.maps).map((mapId) => {
          const m = world.maps[mapId];
          const pos = mapPositions[mapId];
          if (!pos) return null;
          const boxX = originX + pos.x * (BOX_SIZE + BOX_SPACING);
          const boxY = originY + pos.y * (BOX_SIZE + BOX_SPACING);
          const size = mapSizes[mapId] || { width: 1, height: 1 };
          const boxWidth = BOX_SIZE * size.width;
          const boxHeight = BOX_SIZE * size.height;

          const exitAnchor = (bx: number, by: number, bw: number, bh: number, exit: any) => {
            if (exit.edge === "left") return { x: bx, y: by + exit.edgePosition * bh };
            if (exit.edge === "right") return { x: bx + bw, y: by + exit.edgePosition * bh };
            if (exit.edge === "top") return { x: bx + exit.edgePosition * bw, y: by };
            // bottom
            return { x: bx + exit.edgePosition * bw, y: by + bh };
          };

          return m.exits.map((exit, idx) => {
            // Avoid double-drawing lines by ordering by id
            if (mapId > exit.targetMapId) return null;
            const tPos = mapPositions[exit.targetMapId];
            if (!tPos) return null;
            const tBoxX = originX + tPos.x * (BOX_SIZE + BOX_SPACING);
            const tBoxY = originY + tPos.y * (BOX_SIZE + BOX_SPACING);
            const tSize = mapSizes[exit.targetMapId] || { width: 1, height: 1 };
            const tBoxWidth = BOX_SIZE * tSize.width;
            const tBoxHeight = BOX_SIZE * tSize.height;

            // Source anchor is this exit's dot
            const a = exitAnchor(boxX, boxY, boxWidth, boxHeight, exit);
            // Try to find a back exit in target that links to current
            const back = world.maps[exit.targetMapId].exits.find((x: any) => x.targetMapId === mapId);
            const b = back
              ? exitAnchor(tBoxX, tBoxY, tBoxWidth, tBoxHeight, back)
              : // fallback: opposite edge center
                (function () {
                  const opp = { right: "left", left: "right", top: "bottom", bottom: "top" } as const;
                  const fake = { edge: (opp as any)[exit.edge], edgePosition: 0.5 };
                  return exitAnchor(tBoxX, tBoxY, tBoxWidth, tBoxHeight, fake);
                })();

            return (
              <line
                key={`${mapId}-to-${exit.targetMapId}-${idx}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#9ca3af"
                strokeWidth={2}
                opacity={0.9}
              />
            );
          });
        })}

        {/* Boxes and exit indicators */}
        {Object.keys(world.maps).map((mapId) => {
          const m = world.maps[mapId];
          const pos = mapPositions[mapId];
          const size = mapSizes[mapId] || { width: 1, height: 1 };
          if (!pos) return null;
          const boxX = originX + pos.x * (BOX_SIZE + BOX_SPACING);
          const boxY = originY + pos.y * (BOX_SIZE + BOX_SPACING);
          const boxWidth = BOX_SIZE * size.width;
          const boxHeight = BOX_SIZE * size.height;
          const isStart = mapId === graph.start;
          const isGoal = mapId === graph.goal;

          return (
            <g key={`box-${mapId}`}>
              <rect
                x={boxX}
                y={boxY}
                width={boxWidth}
                height={boxHeight}
                fill={isStart ? "#10b981" : isGoal ? "#ef4444" : "#3b82f6"}
                fillOpacity={0.8}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text x={boxX + boxWidth / 2} y={boxY + boxHeight / 2} fontSize={12} fill="#ffffff" textAnchor="middle">
                {m.metadata.name}
              </text>

              {m.exits.map((exit, i) => {
                // Draw short indicator segment (existing)
                let sx = boxX, sy = boxY, ex = boxX, ey = boxY;
                if (exit.edge === "left" || exit.edge === "right") {
                  const x = exit.edge === "left" ? boxX : boxX + boxWidth;
                  sx = x; ex = x;
                  sy = boxY + exit.edgeStart * boxHeight;
                  ey = boxY + exit.edgeEnd * boxHeight;
                } else {
                  const y = exit.edge === "top" ? boxY : boxY + boxHeight;
                  sy = y; ey = y;
                  sx = boxX + exit.edgeStart * boxWidth;
                  ex = boxX + exit.edgeEnd * boxWidth;
                }
                const cx = exit.edge === "left" || exit.edge === "right"
                  ? sx
                  : boxX + exit.edgePosition * boxWidth;
                const cy = exit.edge === "left" || exit.edge === "right"
                  ? boxY + exit.edgePosition * boxHeight
                  : sy;
                return (
                  <g key={`exit-${mapId}-${i}`}>
                    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#ef4444" strokeWidth={4} />
                    {/* Red dot at the center position */}
                    <circle cx={cx} cy={cy} r={4} fill="#ef4444" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Legend */}
        <g>
          <rect x={width - 260} y={20} width={240} height={90} fill="#ffffff" stroke="#e5e7eb" />
          <text x={width - 240} y={40} fontSize={12} fill="#111827">Legend</text>
          <rect x={width - 240} y={52} width={18} height={12} fill="#10b981" />
          <text x={width - 216} y={62} fontSize={11}>Start</text>
          <rect x={width - 180} y={52} width={18} height={12} fill="#ef4444" />
          <text x={width - 156} y={62} fontSize={11}>Goal</text>
          <line x1={width - 240} y1={80} x2={width - 210} y2={80} stroke="#9ca3af" strokeWidth={2} />
          <text x={width - 204} y={84} fontSize={11}>Connection</text>
          <line x1={width - 140} y1={80} x2={width - 110} y2={80} stroke="#ef4444" strokeWidth={4} />
          <text x={width - 104} y={84} fontSize={11}>Exit</text>
        </g>
      </svg>
    </div>
  );
}

export default WorldGraphViewer;


