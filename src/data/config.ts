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
  characters: "/assets/images/characters",
  enemies: "/assets/images/enemies",
  backgrounds: "/assets/images/backgrounds",
  ui: "/assets/images/ui",
  tiles: "/assets/images/tiles",
  audio: {
    music: "/assets/audio/music",
    sfx: "/assets/audio/sfx",
  },
  maps: "/assets/maps",
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
