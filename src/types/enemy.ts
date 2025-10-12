// Enemy-related types
export type EnemyType = "stationary" | "moving" | "patrol";

export interface EnemyConfig {
  type: EnemyType;
  x: number;
  y: number;
  range?: number; // For patrol enemies
  speed?: number;
  health?: number;
}

export interface EnemyMetadata {
  type: EnemyType;
  rotations: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
}
