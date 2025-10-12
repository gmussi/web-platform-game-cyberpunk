import { LoadingScene } from "../scenes/LoadingScene";
import { CharacterSelectScene } from "../scenes/CharacterSelectScene";
import { GameScene } from "../scenes/GameScene";
import { GameOverScene } from "../scenes/GameOverScene";
import { VictoryScene } from "../scenes/VictoryScene";
import { MapEditorScene } from "../scenes/MapEditorScene";
import { GAME_CONFIG } from "../data/config";

// Main game configuration
const config: any = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: "game-container",
  backgroundColor: GAME_CONFIG.backgroundColor,
  physics: GAME_CONFIG.physics,
  scene: [
    LoadingScene,
    CharacterSelectScene,
    GameScene,
    GameOverScene,
    VictoryScene,
    MapEditorScene,
  ],
  scale: GAME_CONFIG.scale,
  render: GAME_CONFIG.render,
};

// Start the game
const game = new Phaser.Game(config);

// Make game accessible globally for testing
(window as any).game = game;

export { game };
