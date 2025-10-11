/// <reference path="./phaser.d.ts" />

import { LoadingScene } from "./scenes/LoadingScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { MapEditorScene } from "./scenes/MapEditorScene";

// Game data interface
interface GameData {
  selectedCharacter: string | null;
  playerHealth: number;
  maxHealth: number;
  scrollDirection: "right";
}

// Character interface
interface Character {
  name: string;
  color: number;
  scrollDirection: "right";
}

// Characters type
interface Characters {
  [key: string]: Character;
}

// Main game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  parent: "game-container",
  backgroundColor: "#0a0a2e", // Dark cyberpunk blue
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [
    LoadingScene,
    CharacterSelectScene,
    GameScene,
    GameOverScene,
    VictoryScene,
    MapEditorScene,
  ] as any,
};

// Game data
export const gameData: GameData = {
  selectedCharacter: null,
  playerHealth: 100,
  maxHealth: 100,
  scrollDirection: "right", // Always scroll right
};

// Character definitions
export const characters: Characters = {
  A: {
    name: "Cyber Warrior",
    color: 0xff4444,
    scrollDirection: "right",
  },
  B: {
    name: "Quantum Mage",
    color: 0x8844ff,
    scrollDirection: "right",
  },
  C: {
    name: "Stealth Rogue",
    color: 0x2244aa,
    scrollDirection: "right",
  },
  D: {
    name: "Plasma Paladin",
    color: 0xffaa00,
    scrollDirection: "right",
  },
};

// Start the game
const game = new Phaser.Game(config);

// Make game accessible globally for testing
(window as any).game = game;
