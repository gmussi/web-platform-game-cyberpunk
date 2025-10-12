// Game configuration
export const GAME_CONFIG = {
  width: 1200,
  height: 800,
  backgroundColor: "#0a0a2e", // Dark cyberpunk blue
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scale: {
    mode: "FIT" as const,
    autoCenter: "CENTER_BOTH" as const,
  },
  render: {
    antialias: true,
  },
} as const;

// Asset paths
export const ASSET_PATHS = {
  characters: "/images/characters",
  enemies: "/images/enemies",
  backgrounds: "/images/backgrounds",
  ui: "/images/ui",
  tiles: "/images/tiles",
  audio: {
    music: "/audio/music",
    sfx: "/audio/sfx",
  },
  maps: "/maps",
} as const;

// Game constants
export const GAME_CONSTANTS = {
  WORLD_WIDTH: 4100,
  WORLD_HEIGHT: 800,
  TILE_SIZE: 32,
  CHARACTER_SIZE: 64,
  ENEMY_SIZE: 64,
  PORTAL_SIZE: 64,
  MAX_HEALTH: 100,
  DAMAGE_COOLDOWN: 1000, // 1 second
} as const;
