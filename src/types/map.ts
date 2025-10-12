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
