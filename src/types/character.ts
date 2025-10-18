// Character-related types
export interface CharacterMetadata {
  name: string;
  color: number;
  scrollDirection: "right";
}

export interface CharacterAnimation {
  key: string;
  frames: Array<{ key: string }>;
  frameRate: number;
  repeat: number;
}
