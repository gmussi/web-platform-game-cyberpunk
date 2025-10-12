// Game-specific types
export interface GameData {
  selectedCharacter: string | null;
  playerHealth: number;
  maxHealth: number;
  scrollDirection: "right";
}

export interface Character {
  name: string;
  color: number;
  scrollDirection: "right";
}

export interface Characters {
  [key: string]: Character;
}

export interface EnemyData {
  type: "stationary" | "moving" | "patrol";
  x: number;
  y: number;
  range?: number; // For patrol enemies
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
  enemies: EnemyData[];
  playerSpawn: {
    x: number;
    y: number;
  };
  portal: {
    x: number;
    y: number;
  };
}
