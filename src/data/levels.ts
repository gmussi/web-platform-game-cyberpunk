// Level definitions and configurations
import { MapData } from "../types/map";

export const DEFAULT_MAP: MapData = {
  width: 4100,
  height: 800,
  platforms: [
    { x: 0, y: 750, width: 200, height: 50 },
    { x: 300, y: 650, width: 200, height: 50 },
    { x: 600, y: 550, width: 200, height: 50 },
    { x: 900, y: 450, width: 200, height: 50 },
    { x: 1200, y: 350, width: 200, height: 50 },
    { x: 1500, y: 250, width: 200, height: 50 },
    { x: 1800, y: 150, width: 200, height: 50 },
    { x: 2100, y: 250, width: 200, height: 50 },
    { x: 2400, y: 350, width: 200, height: 50 },
    { x: 2700, y: 450, width: 200, height: 50 },
    { x: 3000, y: 550, width: 200, height: 50 },
    { x: 3300, y: 650, width: 200, height: 50 },
    { x: 3600, y: 750, width: 500, height: 50 },
  ],
  enemies: [
    { type: "stationary", x: 400, y: 600 },
    { type: "moving", x: 700, y: 500 },
    { type: "patrol", x: 1000, y: 400, range: 100 },
    { type: "stationary", x: 1300, y: 300 },
    { type: "moving", x: 1600, y: 200 },
    { type: "patrol", x: 1900, y: 100, range: 80 },
    { type: "stationary", x: 2200, y: 200 },
    { type: "moving", x: 2500, y: 300 },
    { type: "patrol", x: 2800, y: 400, range: 120 },
    { type: "stationary", x: 3100, y: 500 },
    { type: "moving", x: 3400, y: 600 },
  ],
  playerSpawn: {
    x: 100,
    y: 700,
  },
  portal: {
    x: 3800,
    y: 700,
  },
};

export const LEVELS = {
  DEFAULT: DEFAULT_MAP,
} as const;
