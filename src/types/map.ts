// Map-related types
export interface MapTile {
  x: number;
  y: number;
  type: "solid" | "empty";
  sprite?: string;
}

export interface MapData {
  width: number;
  height: number;
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  enemies: Array<{
    type: "stationary" | "moving" | "patrol";
    x: number;
    y: number;
    range?: number;
  }>;
  playerSpawn: {
    x: number;
    y: number;
  };
  portal: {
    x: number;
    y: number;
  };
}

export interface MapConfig {
  width: number;
  height: number;
  tileSize: number;
  tiles: MapTile[];
  objects: MapObject[];
}

export interface MapObject {
  type: "player" | "portal" | "enemy1" | "enemy2";
  x: number;
  y: number;
  properties?: Record<string, any>;
}

export interface MapValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// World System Types (v2.0)
export interface SpawnPoint {
  id: string;
  x: number;
  y: number;
}

export interface ExitZone {
  id: string;
  x: number; // World position (calculated from tiles)
  y: number;
  width: number; // Dimensions (calculated from tile count)
  height: number;
  edge: "left" | "right" | "top" | "bottom";
  edgePosition: number; // Center position along edge (0.0-1.0)
  edgeStart: number; // Start position along edge (0.0-1.0)
  edgeEnd: number; // End position along edge (0.0-1.0)
  tileStart: number; // Start tile index
  tileEnd: number; // End tile index
  targetMapId: string; // Which map this leads to
}

export interface WorldMapData {
  id: string;
  version: string;
  metadata: {
    name: string;
    description: string;
    created: string;
    author: string;
  };
  world: {
    width: number;
    height: number;
    tileSize: number;
  };
  exits: ExitZone[];
  player?: {
    startPosition: { x: number; y: number };
    character: string;
  };
  portal: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    animationSpeed?: number;
  } | null;
  enemies: Array<{
    id: string;
    type: "stationary" | "moving" | "patrol";
    enemyType: string;
    position: { x: number; y: number };
    properties: {
      damage: number;
      health: number;
      speed?: number;
      patrolRange?: number;
    };
  }>;
  platforms?: any[];
  collectibles?: any[];
  checkpoints?: any[];
  tiles: any[];
  gridPosition?: { x: number; y: number }; // Calculated by layout system
  gridHeight?: number; // Height in grid units
}

export interface WorldData {
  version: string;
  metadata: {
    name: string;
    description: string;
    author: string;
    created: string;
  };
  startingMap: string;
  startingPosition?: { x: number; y: number }; // Optional starting position
  maps: Record<string, WorldMapData>;
}
