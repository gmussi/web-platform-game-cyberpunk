// Character-related types
export interface CharacterMetadata {
  name: string;
  color: number;
  scrollDirection: "right";
  animations: {
    walk: {
      east: string[];
      west: string[];
    };
    "breathing-idle": {
      south: string[];
    };
    "jumping-1": {
      east: string[];
      west: string[];
    };
  };
  rotations: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
}

export interface CharacterAnimation {
  key: string;
  frames: Array<{ key: string }>;
  frameRate: number;
  repeat: number;
}
