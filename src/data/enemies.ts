// Enemy definitions and configurations
import { EnemyConfig, EnemyType } from "../types/enemy";

export const ENEMY_TYPES: Record<string, EnemyType> = {
  STATIONARY: "stationary",
  MOVING: "moving",
  PATROL: "patrol",
} as const;

export const ENEMY_CONFIGS: Record<string, Partial<EnemyConfig>> = {
  STATIONARY: {
    type: "stationary",
    health: 1,
  },
  MOVING: {
    type: "moving",
    speed: 50,
    health: 1,
  },
  PATROL: {
    type: "patrol",
    speed: 30,
    range: 100,
    health: 1,
  },
} as const;

export const ENEMY_SPRITES = {
  ENEMY1: "enemy1",
  ENEMY2: "enemy2",
} as const;
