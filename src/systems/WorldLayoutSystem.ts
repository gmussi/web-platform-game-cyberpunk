import { WorldData, WorldMapData, ExitZone } from "../types/map";

export interface GridPosition {
  x: number;
  y: number;
}

export interface LayoutResult {
  mapPositions: Record<string, GridPosition>;
  mapSizes: Record<string, { width: number; height: number }>;
  totalWidth: number;
  totalHeight: number;
}

export class WorldLayoutSystem {
  private worldData: WorldData;

  constructor(worldData: WorldData) {
    this.worldData = worldData;
  }

  /**
   * Recursively compute the required width/height (in grid units) for each map
   * so that all exit stacks can fit adjacent to the parent without overlap.
   */
  private computeRequiredSizes(): Record<
    string,
    { width: number; height: number }
  > {
    const baseSizes: Record<string, { width: number; height: number }> = {};
    const result: Record<string, { width: number; height: number }> = {};

    // Base sizes derived from world dimensions -> 9-tile units
    Object.keys(this.worldData.maps).forEach((id) => {
      const m = this.worldData.maps[id];
      const tileSize = Math.max(m.world?.tileSize || 32, 1);
      const widthTiles = Math.max(
        1,
        Math.round((m.world?.width || tileSize) / tileSize)
      );
      const heightTiles = Math.max(
        1,
        Math.round((m.world?.height || tileSize) / tileSize)
      );
      const unit = 9;
      const widthUnits = Math.max(1, Math.ceil(widthTiles / unit));
      const heightUnits = Math.max(1, Math.ceil(heightTiles / unit));
      baseSizes[id] = { width: widthUnits, height: heightUnits };
    });

    const exitsByEdgeCache: Record<string, Record<string, ExitZone[]>> = {};
    const getExitsByEdge = (mapId: string): Record<string, ExitZone[]> => {
      if (exitsByEdgeCache[mapId]) return exitsByEdgeCache[mapId];
      const map = this.worldData.maps[mapId];
      const grouped = this.groupExitsByEdge(map?.exits || []);
      exitsByEdgeCache[mapId] = grouped;
      return grouped;
    };

    const visiting = new Set<string>();
    const memo: Record<string, { width: number; height: number }> = {};

    const dfs = (mapId: string): { width: number; height: number } => {
      if (memo[mapId]) return memo[mapId];
      if (visiting.has(mapId)) return baseSizes[mapId]; // break cycles if any
      visiting.add(mapId);

      const exits = getExitsByEdge(mapId);
      const exitCount =
        (exits.left?.length || 0) +
        (exits.right?.length || 0) +
        (exits.top?.length || 0) +
        (exits.bottom?.length || 0);
      // Leaf-like rooms (0 or 1 exits) stay minimal; parents expand just enough
      // to accommodate stacked children on each side, not the full world size.
      const own = { width: 1, height: 1 };

      // Adaptive stacking logic: if an edge has multiple exits, stack (sum) children on that edge;
      // if it has 0 or 1 exit, only the tallest/widest child impacts size (no unnecessary sum).
      // Ignore back-edges to any ancestor currently in the recursion stack to
      // avoid cycle fallback to baseSizes inflating dimensions.
      const heightsLeft = (exits.left || [])
        .filter((e) => !visiting.has(e.targetMapId))
        .map((e) => dfs(e.targetMapId).height);
      const heightsRight = (exits.right || [])
        .filter((e) => !visiting.has(e.targetMapId))
        .map((e) => dfs(e.targetMapId).height);
      const widthsTop = (exits.top || [])
        .filter((e) => !visiting.has(e.targetMapId))
        .map((e) => dfs(e.targetMapId).width);
      const widthsBottom = (exits.bottom || [])
        .filter((e) => !visiting.has(e.targetMapId))
        .map((e) => dfs(e.targetMapId).width);

      const stackOrMax = (vals: number[], count: number) => {
        if (count <= 0) return 0;
        if (count === 1) return 1; // single neighbor on a side should not inflate parent size
        return vals.reduce((a, b) => a + b, 0);
      };

      const leftStack = stackOrMax(heightsLeft, heightsLeft.length);
      const rightStack = stackOrMax(heightsRight, heightsRight.length);

      // Only let a single top/bottom child dictate width if there is also
      // at least one horizontal neighbor (left or right). Use RAW exits to detect
      // presence so ancestors still count as neighbors, but keep size sums filtered.
      const hasHorizontalNeighbor =
        (exits.left?.length || 0) + (exits.right?.length || 0) > 0;

      const topStack =
        widthsTop.length === 0
          ? 0
          : widthsTop.length === 1
          ? hasHorizontalNeighbor
            ? widthsTop[0]
            : 1
          : widthsTop.reduce((a, b) => a + b, 0);
      const bottomStack =
        widthsBottom.length === 0
          ? 0
          : widthsBottom.length === 1
          ? hasHorizontalNeighbor
            ? widthsBottom[0]
            : 1
          : widthsBottom.reduce((a, b) => a + b, 0);

      // Height should not sum left+right; take the max so the parent isn't taller than necessary
      const requiredHeight = Math.max(
        own.height,
        Math.max(leftStack, rightStack)
      );
      // Width should mirror height logic: do not add top and bottom stacks together.
      // Taking the max avoids unnecessarily wide parents when there are exits on both edges.
      let requiredWidth = Math.max(own.width, Math.max(topStack, bottomStack));

      // Bridge rule: if this map has a vertical relation (top or bottom) AND also
      // at least one horizontal neighbor, widen by +1 to span over/under the child stack.
      // This lets a parent (e.g., room_4) extend to sit above/below its child (e.g., room_14).
      const hasTop = widthsTop.length > 0;
      const hasBottom = widthsBottom.length > 0;
      const hasLeft = heightsLeft.length > 0;
      const hasRight = heightsRight.length > 0;
      if (hasLeft || hasRight) {
        if (hasTop) requiredWidth = Math.max(requiredWidth, 1 + topStack);
        if (hasBottom) requiredWidth = Math.max(requiredWidth, 1 + bottomStack);
      }

      const size = { width: requiredWidth, height: requiredHeight };
      memo[mapId] = size;
      visiting.delete(mapId);
      return size;
    };

    // Seed from starting map to ensure connectivity dominance
    const startId = this.worldData.startingMap;
    dfs(startId);

    // Fill result for all maps (in case of isolated components)
    Object.keys(this.worldData.maps).forEach((id) => {
      result[id] = memo[id] || baseSizes[id];
    });

    return result;
  }

  /**
   * Calculate the grid layout for all maps based on their exit connections
   */
  public calculateLayout(): LayoutResult {
    const mapPositions: Record<string, GridPosition> = {};
    // Global per-column (absolute grid X) baseline to avoid vertical overlaps across parents
    const globalColumnBottom: Record<number, number> = {};
    // First pass: recursively compute required sizes so exits align on the grid
    const mapSizes: Record<string, { width: number; height: number }> =
      this.computeRequiredSizes();
    const visited = new Set<string>();
    const queue: Array<{ mapId: string; gridX: number; gridY: number }> = [];

    // --- Occupancy helpers for rectangular placement (avoid overlaps) ---
    const occupied = new Set<string>();
    const key = (x: number, y: number) => `${x},${y}`;
    const occupyRect = (x: number, y: number, w: number, h: number) => {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) occupied.add(key(xx, yy));
      }
    };
    const isFreeRect = (x: number, y: number, w: number, h: number) => {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++)
          if (occupied.has(key(xx, yy))) return false;
      }
      return true;
    };
    const placeNear = (
      desiredX: number,
      desiredY: number,
      dir: "vertical" | "horizontal",
      w: number,
      h: number
    ): GridPosition | null => {
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

    // Sizes precomputed above

    // Start with the starting map at origin
    const startingMapId = this.worldData.startingMap;
    mapPositions[startingMapId] = { x: 0, y: 0 };
    const startSize = mapSizes[startingMapId] || { width: 1, height: 1 };
    occupyRect(0, 0, startSize.width, startSize.height);
    queue.push({ mapId: startingMapId, gridX: 0, gridY: 0 });

    while (queue.length > 0) {
      const { mapId, gridX, gridY } = queue.shift()!;

      if (visited.has(mapId)) continue;
      visited.add(mapId);

      const mapData = this.worldData.maps[mapId];
      if (!mapData) continue;

      // Process exits and place connected maps with size-aware offsets using precomputed sizes
      const exitsByEdge = this.groupExitsByEdge(mapData.exits || []);
      // Ensure parents with vertical child and horizontal neighbor extend one extra column
      // so they visually sit above/below that child (e.g., room_5 above room_6)
      {
        const hasBottom = (exitsByEdge.bottom?.length || 0) > 0;
        const hasTop = (exitsByEdge.top?.length || 0) > 0;
        const hasHorizontal =
          (exitsByEdge.left?.length || 0) + (exitsByEdge.right?.length || 0) >
          0;
        if (hasHorizontal && (hasBottom || hasTop)) {
          const cur = mapSizes[mapId] || { width: 1, height: 1 };
          if (cur.width < 2) {
            mapSizes[mapId] = { width: 2, height: cur.height };
          }
        }
      }
      let currentSize = mapSizes[mapId] || { width: 1, height: 1 };
      // Reserve parent's precomputed area
      occupyRect(gridX, gridY, currentSize.width, currentSize.height);

      Object.keys(exitsByEdge).forEach((edge) => {
        const exits = exitsByEdge[edge];
        if (!exits || exits.length === 0) return;

        // Build list of targets with sizes (sorted to keep vertical/horizontal alignment stable)
        const targets = exits
          .map((e) => ({ id: e.targetMapId, size: mapSizes[e.targetMapId] }))
          .filter(
            (t) => t.id && t.size && !visited.has(t.id!) && !mapPositions[t.id!]
          ) as Array<{
          id: string;
          size: { width: number; height: number };
        }>;
        // For right/left edges, sort by descending height so tallest go nearest to parent anchor
        // For top/bottom edges, sort by descending width for symmetry
        if (edge === "right" || edge === "left") {
          targets.sort((a, b) => b.size.height - a.size.height);
        } else {
          targets.sort((a, b) => b.size.width - a.size.width);
        }
        if (targets.length === 0) return;

        // Compute starting anchor and total span required for this edge
        const anchorX = gridX;
        const anchorY = gridY;
        const currentW = currentSize.width;
        const currentH = currentSize.height;

        // Function to test if a whole stacked group fits at a given start position
        const groupFitsAt = (startX: number, startY: number): boolean => {
          // Simulate actual placement for the given edge
          let cx = startX;
          let cy = startY;
          for (const t of targets) {
            const w = t.size.width;
            const h = t.size.height;
            let px = cx;
            let py = cy;
            if (edge === "left") {
              // Abut to left of parent
              px = anchorX - w;
              py = cy;
            } else if (edge === "top") {
              // Abut on top of parent
              px = cx;
              py = anchorY - h;
            }

            if (!isFreeRect(px, py, w, h)) return false;

            if (edge === "right" || edge === "left") {
              cy += h; // stack vertically
            } else {
              cx += w; // stack horizontally
            }
          }
          return true;
        };

        // Sibling ordering with spacing for right-edge groups
        if (edge === "right") {
          const childIds = new Set<string>(targets.map((t) => t.id));
          // Build directional relation flags for pairs
          const rightFlags: Record<string, { ab: boolean; ba: boolean }> = {};
          const key = (a: string, b: string) => `${a}|${b}`;
          const addRight = (a: string, b: string) => {
            const k = key(a, b);
            rightFlags[k] = rightFlags[k] || { ab: false, ba: false };
            rightFlags[k].ab = true;
          };
          const addRightReverse = (a: string, b: string) => {
            const k = key(b, a);
            rightFlags[k] = rightFlags[k] || { ab: false, ba: false };
            rightFlags[k].ba = true;
          };
          // Scan exits among children to infer A left of B constraints
          targets.forEach((t) => {
            const m = this.worldData.maps[t.id];
            (m?.exits || []).forEach((e) => {
              if (!e.targetMapId || !childIds.has(e.targetMapId)) return;
              if (e.edge === "right") {
                // t is left of target
                addRight(t.id, e.targetMapId);
              } else if (e.edge === "left") {
                // target is left of t => t is right of target -> target left of t
                addRightReverse(t.id, e.targetMapId);
              }
            });
          });
          // Build weighted constraints
          type Constraint = { from: string; to: string; w: number };
          const constraints: Constraint[] = [];
          Object.keys(rightFlags).forEach((k) => {
            const [a, b] = k.split("|");
            const flags = rightFlags[k];
            const weight = 1 + (flags.ba ? 1 : 0); // mutual => add a spacer (gap)
            if (flags.ab) constraints.push({ from: a, to: b, w: weight });
          });
          // Compute minimal non-negative integer offsets via relaxation
          const ids = targets.map((t) => t.id);
          const offset: Record<string, number> = {};
          ids.forEach((id) => (offset[id] = 0));
          const iterations = Math.max(1, ids.length - 1);
          for (let i = 0; i < iterations; i++) {
            let changed = false;
            for (const c of constraints) {
              const next = Math.max(offset[c.to], offset[c.from] + c.w);
              if (next !== offset[c.to]) {
                offset[c.to] = Math.min(next, 50); // clamp for safety
                changed = true;
              }
            }
            if (!changed) break;
          }

          // Place children by column offset; for each child, scan vertically for a free slot
          const baseX = anchorX + currentW;
          // Stable order: by offset asc, then by height desc
          const ordered = targets.slice().sort((a, b) => {
            const da = offset[a.id] - offset[b.id];
            if (da !== 0) return da;
            return b.size.height - a.size.height;
          });
          ordered.forEach((t) => {
            const planned = Math.max(0, offset[t.id] || 0);
            const w = mapSizes[t.id]?.width || t.size.width;
            const hInitial = mapSizes[t.id]?.height || t.size.height;
            let placed = false;
            // Try columns starting from planned, increasing until a vertical slot fits
            for (let extra = 0; extra <= 50 && !placed; extra++) {
              const off = planned + extra;
              const px = baseX + off;
              // Optional height bump when pushed >= 2 columns (to visually bridge)
              if (off >= 2) {
                const cur = mapSizes[t.id] || { width: w, height: hInitial };
                cur.height = Math.max(cur.height, 2);
                mapSizes[t.id] = cur;
              }
              const h = mapSizes[t.id]?.height || hInitial;
              // Scan vertically from max(anchorY, global column baseline)
              let py: number | null = null;
              for (let radius = 0; radius <= 100 && py === null; radius++) {
                const baseY = Math.max(
                  anchorY,
                  globalColumnBottom[px] ?? anchorY
                );
                const candidates =
                  radius === 0 ? [baseY] : [baseY + radius, baseY - radius];
                for (const testY of candidates) {
                  if (isFreeRect(px, testY, w, h)) {
                    py = testY;
                    break;
                  }
                }
              }
              if (py !== null) {
                mapPositions[t.id] = { x: px, y: py };
                occupyRect(px, py, w, h);
                globalColumnBottom[px] = Math.max(
                  globalColumnBottom[px] || py,
                  py + h
                );
                queue.push({ mapId: t.id, gridX: px, gridY: py });
                placed = true;
              }
            }
            if (!placed) {
              // Fallback far-right placement at anchorY
              const px = baseX + planned + 51;
              const h = mapSizes[t.id]?.height || hInitial;
              mapPositions[t.id] = { x: px, y: anchorY };
              occupyRect(px, anchorY, w, h);
              globalColumnBottom[px] = Math.max(
                globalColumnBottom[px] || anchorY,
                anchorY + h
              );
              queue.push({ mapId: t.id, gridX: px, gridY: anchorY });
            }
          });
        } else {
          // Default placement using group-level scanning to keep stacks aligned
          // Determine initial desired group origin per edge
          let desiredGroupX = anchorX;
          let desiredGroupY = anchorY;
          if (edge === "right") {
            desiredGroupX = anchorX + currentW;
          } else if (edge === "left") {
            desiredGroupX = anchorX; // abut per target
          } else if (edge === "bottom") {
            desiredGroupY = anchorY + currentH;
          } else if (edge === "top") {
            desiredGroupY = anchorY;
          }

          // Shift the entire group along the perpendicular direction until all fit
          if (edge === "right" || edge === "left") {
            // vertical stacking; scan Y to keep adjacency in X
            let yUp = anchorY;
            let yDown = anchorY;
            let placedGroup = false;
            if (groupFitsAt(desiredGroupX, anchorY)) {
              desiredGroupY = anchorY;
              placedGroup = true;
            } else {
              for (let radius = 1; radius <= 100 && !placedGroup; radius++) {
                yDown = anchorY + radius;
                if (groupFitsAt(desiredGroupX, yDown)) {
                  desiredGroupY = yDown;
                  placedGroup = true;
                  break;
                }
                yUp = anchorY - radius;
                if (groupFitsAt(desiredGroupX, yUp)) {
                  desiredGroupY = yUp;
                  placedGroup = true;
                  break;
                }
              }
            }
            if (!placedGroup) {
              let x = desiredGroupX;
              while (!groupFitsAt(x, anchorY)) x += 1;
              desiredGroupX = x;
              desiredGroupY = anchorY;
            }
          } else {
            // horizontal stacking; scan X to keep adjacency in Y
            let xRight = anchorX;
            let xLeft = anchorX;
            let placedGroup = false;
            if (groupFitsAt(anchorX, desiredGroupY)) {
              desiredGroupX = anchorX;
              placedGroup = true;
            } else {
              for (let radius = 1; radius <= 100 && !placedGroup; radius++) {
                xRight = anchorX + radius;
                if (groupFitsAt(xRight, desiredGroupY)) {
                  desiredGroupX = xRight;
                  placedGroup = true;
                  break;
                }
                xLeft = anchorX - radius;
                if (groupFitsAt(xLeft, desiredGroupY)) {
                  desiredGroupX = xLeft;
                  placedGroup = true;
                  break;
                }
              }
            }
            if (!placedGroup) {
              let y = desiredGroupY;
              while (!groupFitsAt(anchorX, y)) y += 1;
              desiredGroupY = y;
              desiredGroupX = anchorX;
            }
          }

          // Place sequentially after locating group origin
          let placeX = desiredGroupX;
          let placeY = desiredGroupY;
          targets.forEach((t) => {
            const w = t.size.width;
            const h = t.size.height;
            const px = edge === "left" ? anchorX - w : placeX;
            const py = edge === "top" ? anchorY - h : placeY;
            mapPositions[t.id] = { x: px, y: py };
            occupyRect(px, py, w, h);
            globalColumnBottom[px] = Math.max(
              globalColumnBottom[px] || py,
              py + h
            );
            queue.push({ mapId: t.id, gridX: px, gridY: py });
            if (edge === "right" || edge === "left") {
              placeY += h;
            } else {
              placeX += w;
            }
          });
        }
      });
    }

    // Calculate total dimensions (bounds)
    let maxRight = 0;
    let maxBottom = 0;
    Object.keys(mapPositions).forEach((id) => {
      const pos = mapPositions[id];
      const size = mapSizes[id] || { width: 1, height: 1 };
      maxRight = Math.max(maxRight, pos.x + size.width);
      maxBottom = Math.max(maxBottom, pos.y + size.height);
    });

    return {
      mapPositions,
      mapSizes,
      totalWidth: maxRight,
      totalHeight: maxBottom,
    };
  }

  /**
   * Calculate the size of a map based on its exits
   */
  private calculateMapSize(mapData: WorldMapData): {
    width: number;
    height: number;
  } {
    // Use actual map world dimensions to derive relative size in 9x9 tile units
    const tileSize = Math.max(mapData.world?.tileSize || 32, 1);
    const widthTiles = Math.max(
      1,
      Math.round((mapData.world?.width || tileSize) / tileSize)
    );
    const heightTiles = Math.max(
      1,
      Math.round((mapData.world?.height || tileSize) / tileSize)
    );
    const unit = 9; // 9 tiles per grid unit
    const widthUnits = Math.max(1, Math.ceil(widthTiles / unit));
    const heightUnits = Math.max(1, Math.ceil(heightTiles / unit));
    return { width: widthUnits, height: heightUnits };
  }

  /**
   * Group exits by their edge
   */
  private groupExitsByEdge(exits: ExitZone[]): Record<string, ExitZone[]> {
    const grouped: Record<string, ExitZone[]> = {
      left: [],
      right: [],
      top: [],
      bottom: [],
    };

    exits.forEach((exit) => {
      if (grouped[exit.edge]) {
        grouped[exit.edge].push(exit);
      }
    });

    // Sort exits within each edge by their position
    Object.keys(grouped).forEach((edge) => {
      grouped[edge].sort((a, b) => a.edgePosition - b.edgePosition);
    });

    return grouped;
  }

  /**
   * Process exits for a map and place connected maps
   */
  private processMapExits(
    mapData: WorldMapData,
    gridX: number,
    gridY: number,
    mapPositions: Record<string, GridPosition>,
    queue: Array<{ mapId: string; gridX: number; gridY: number }>,
    visited: Set<string>
  ): void {
    const exitsByEdge = this.groupExitsByEdge(mapData.exits);

    // Process each edge
    Object.keys(exitsByEdge).forEach((edge) => {
      const exits = exitsByEdge[edge];
      if (exits.length === 0) return;

      // Calculate target positions for this edge
      const targetPositions = this.calculateTargetPositions(
        edge,
        gridX,
        gridY,
        exits.length
      );

      exits.forEach((exit, index) => {
        const targetMapId = exit.targetMapId;
        if (!targetMapId || visited.has(targetMapId)) return;

        const targetPos = targetPositions[index];
        if (!targetPos) return;

        // Check if position is already occupied
        const existingMap = Object.keys(mapPositions).find(
          (id) =>
            mapPositions[id].x === targetPos.x &&
            mapPositions[id].y === targetPos.y
        );

        if (existingMap) {
          // Position conflict - find alternative
          const alternativePos = this.findAlternativePosition(
            targetPos,
            mapPositions
          );
          if (alternativePos) {
            mapPositions[targetMapId] = alternativePos;
            queue.push({
              mapId: targetMapId,
              gridX: alternativePos.x,
              gridY: alternativePos.y,
            });
          }
        } else {
          mapPositions[targetMapId] = targetPos;
          queue.push({
            mapId: targetMapId,
            gridX: targetPos.x,
            gridY: targetPos.y,
          });
        }
      });
    });
  }

  /**
   * Calculate target positions for exits on a specific edge
   */
  private calculateTargetPositions(
    edge: string,
    gridX: number,
    gridY: number,
    exitCount: number
  ): GridPosition[] {
    const positions: GridPosition[] = [];

    switch (edge) {
      case "right":
        // Right exits lead to maps to the right
        for (let i = 0; i < exitCount; i++) {
          positions.push({
            x: gridX + 1,
            y: gridY + i,
          });
        }
        break;

      case "left":
        // Left exits lead to maps to the left
        for (let i = 0; i < exitCount; i++) {
          positions.push({
            x: gridX - 1,
            y: gridY + i,
          });
        }
        break;

      case "bottom":
        // Bottom exits lead to maps below
        for (let i = 0; i < exitCount; i++) {
          positions.push({
            x: gridX + i,
            y: gridY + 1,
          });
        }
        break;

      case "top":
        // Top exits lead to maps above
        for (let i = 0; i < exitCount; i++) {
          positions.push({
            x: gridX + i,
            y: gridY - 1,
          });
        }
        break;
    }

    return positions;
  }

  /**
   * Find an alternative position when there's a conflict
   */
  private findAlternativePosition(
    preferredPos: GridPosition,
    mapPositions: Record<string, GridPosition>
  ): GridPosition | null {
    // Try positions in a spiral pattern around the preferred position
    const directions = [
      { x: 0, y: 1 }, // Down
      { x: 1, y: 0 }, // Right
      { x: 0, y: -1 }, // Up
      { x: -1, y: 0 }, // Left
    ];

    for (let radius = 1; radius <= 5; radius++) {
      for (let i = 0; i < directions.length; i++) {
        const direction = directions[i];
        const testPos = {
          x: preferredPos.x + direction.x * radius,
          y: preferredPos.y + direction.y * radius,
        };

        const isOccupied = Object.values(mapPositions).some(
          (pos) => pos.x === testPos.x && pos.y === testPos.y
        );

        if (!isOccupied) {
          return testPos;
        }
      }
    }

    return null; // No alternative found
  }

  /**
   * Update world data with calculated grid positions
   */
  public updateWorldDataWithLayout(): void {
    const layout = this.calculateLayout();

    Object.keys(layout.mapPositions).forEach((mapId) => {
      const mapData = this.worldData.maps[mapId];
      if (mapData) {
        mapData.gridPosition = layout.mapPositions[mapId];
        mapData.gridHeight = layout.mapSizes[mapId]?.height || 1;
      }
    });
  }
}
