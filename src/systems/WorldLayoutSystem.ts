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
   * Calculate the grid layout for all maps based on their exit connections
   */
  public calculateLayout(): LayoutResult {
    const mapPositions: Record<string, GridPosition> = {};
    const mapSizes: Record<string, { width: number; height: number }> = {};
    const visited = new Set<string>();
    const queue: Array<{ mapId: string; gridX: number; gridY: number }> = [];

    // Start with the starting map at origin
    const startingMapId = this.worldData.startingMap;
    mapPositions[startingMapId] = { x: 0, y: 0 };
    queue.push({ mapId: startingMapId, gridX: 0, gridY: 0 });

    while (queue.length > 0) {
      const { mapId, gridX, gridY } = queue.shift()!;

      if (visited.has(mapId)) continue;
      visited.add(mapId);

      const mapData = this.worldData.maps[mapId];
      if (!mapData) continue;

      // Calculate map size based on exits
      const mapSize = this.calculateMapSize(mapData);
      mapSizes[mapId] = mapSize;

      // Process exits and place connected maps
      this.processMapExits(mapData, gridX, gridY, mapPositions, queue, visited);
    }

    // Calculate total dimensions
    const totalWidth = Math.max(
      ...Object.values(mapPositions).map(
        (pos) =>
          pos.x +
            mapSizes[
              Object.keys(mapPositions).find(
                (id) => mapPositions[id] === pos
              ) || ""
            ]?.width || 1
      )
    );
    const totalHeight = Math.max(
      ...Object.values(mapPositions).map(
        (pos) =>
          pos.y +
            mapSizes[
              Object.keys(mapPositions).find(
                (id) => mapPositions[id] === pos
              ) || ""
            ]?.height || 1
      )
    );

    return {
      mapPositions,
      mapSizes,
      totalWidth,
      totalHeight,
    };
  }

  /**
   * Calculate the size of a map based on its exits
   */
  private calculateMapSize(mapData: WorldMapData): {
    width: number;
    height: number;
  } {
    // Group exits by edge
    const exitsByEdge = this.groupExitsByEdge(mapData.exits);

    let width = 1; // Base width
    let height = 1; // Base height

    // Calculate height based on left/right exits
    const leftExits = exitsByEdge.left || [];
    const rightExits = exitsByEdge.right || [];
    const maxVerticalExits = Math.max(leftExits.length, rightExits.length);
    if (maxVerticalExits > 1) {
      height = maxVerticalExits;
    }

    // Calculate width based on top/bottom exits
    const topExits = exitsByEdge.top || [];
    const bottomExits = exitsByEdge.bottom || [];
    const maxHorizontalExits = Math.max(topExits.length, bottomExits.length);
    if (maxHorizontalExits > 1) {
      width = maxHorizontalExits;
    }

    return { width, height };
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
