// Map-related types
export interface MapTile {
  x: number;
  y: number;
  type: "solid" | "empty";
  sprite?: string;
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
