/// <reference path="./phaser.d.ts" />

import { LoadingScene } from "./scenes/LoadingScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { MapEditorScene } from "./scenes/MapEditorScene";

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

// Start the game
const game = new Phaser.Game(config);

// Make game accessible globally for testing
(window as any).game = game;
