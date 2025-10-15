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
      const own =
        exitCount <= 1
          ? { width: 1, height: 1 }
          : {
              width: Math.max(
                1,
                Math.max(exits.top?.length || 0, exits.bottom?.length || 0)
              ),
              height: Math.max(
                1,
                Math.max(exits.left?.length || 0, exits.right?.length || 0)
              ),
            };

      // Sum of stacks along each edge using descendant sizes
      const sumHeights = (list: ExitZone[]) =>
        list.map((e) => dfs(e.targetMapId).height).reduce((a, b) => a + b, 0);
      const sumWidths = (list: ExitZone[]) =>
        list.map((e) => dfs(e.targetMapId).width).reduce((a, b) => a + b, 0);

      const requiredHeight = Math.max(
        own.height,
        sumHeights(exits.left || []),
        sumHeights(exits.right || [])
      );
      const requiredWidth = Math.max(
        own.width,
        sumWidths(exits.top || []),
        sumWidths(exits.bottom || [])
      );

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
      const currentSize = mapSizes[mapId] || { width: 1, height: 1 };
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

        // Determine initial desired group origin per edge (align group so that
        // tallest/ widest stacks share the parent’s anchor reference line)
        let desiredGroupX = anchorX;
        let desiredGroupY = anchorY;
        if (edge === "right") {
          desiredGroupX = anchorX + currentW;
        } else if (edge === "left") {
          // We'll compute px per target to abut parent; X anchor not used for fit
          desiredGroupX = anchorX; // keep for interface
        } else if (edge === "bottom") {
          desiredGroupY = anchorY + currentH;
        } else if (edge === "top") {
          // We'll compute py per target to abut parent; Y anchor not used for fit
          desiredGroupY = anchorY;
        }

        // Shift the entire group along the perpendicular direction until all fit
        if (edge === "right" || edge === "left") {
          // vertical stacking; scan Y to keep adjacency in X
          let yUp = anchorY;
          let yDown = anchorY;
          let placed = false;
          // Try current anchor first, then expand downward/upward alternately
          if (groupFitsAt(desiredGroupX, anchorY)) {
            desiredGroupY = anchorY;
            placed = true;
          } else {
            for (let radius = 1; radius <= 100 && !placed; radius++) {
              yDown = anchorY + radius;
              if (groupFitsAt(desiredGroupX, yDown)) {
                desiredGroupY = yDown;
                placed = true;
                break;
              }
              yUp = anchorY - radius;
              if (groupFitsAt(desiredGroupX, yUp)) {
                desiredGroupY = yUp;
                placed = true;
                break;
              }
            }
          }
          // If still not placed (extreme congestion), fallback to scanning X to the right
          if (!placed) {
            let x = desiredGroupX;
            while (!groupFitsAt(x, anchorY)) x += 1;
            desiredGroupX = x;
            desiredGroupY = anchorY;
          }
        } else {
          // horizontal stacking; scan X to keep adjacency in Y
          let xRight = anchorX;
          let xLeft = anchorX;
          let placed = false;
          if (groupFitsAt(anchorX, desiredGroupY)) {
            desiredGroupX = anchorX;
            placed = true;
          } else {
            for (let radius = 1; radius <= 100 && !placed; radius++) {
              xRight = anchorX + radius;
              if (groupFitsAt(xRight, desiredGroupY)) {
                desiredGroupX = xRight;
                placed = true;
                break;
              }
              xLeft = anchorX - radius;
              if (groupFitsAt(xLeft, desiredGroupY)) {
                desiredGroupX = xLeft;
                placed = true;
                break;
              }
            }
          }
          if (!placed) {
            let y = desiredGroupY;
            while (!groupFitsAt(anchorX, y)) y += 1;
            desiredGroupY = y;
            desiredGroupX = anchorX;
          }
        }

        // Place and occupy each target sequentially
        let placeX = desiredGroupX;
        let placeY = desiredGroupY;
        targets.forEach((t) => {
          const w = t.size.width;
          const h = t.size.height;
          // Compute per-target position, abutting parent for left/top
          const px = edge === "left" ? anchorX - w : placeX;
          const py = edge === "top" ? anchorY - h : placeY;
          mapPositions[t.id] = { x: px, y: py };
          occupyRect(px, py, w, h);
          queue.push({ mapId: t.id, gridX: px, gridY: py });

          if (edge === "right" || edge === "left") {
            placeY += h;
          } else {
            placeX += w;
          }
        });
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
