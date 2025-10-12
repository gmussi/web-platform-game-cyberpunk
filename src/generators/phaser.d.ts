declare namespace Phaser {
  interface Scene {
    // Add properties that are dynamically added to Phaser.Scene instances
    // For example, if you add a 'player' property in GameScene:
    player: any; // Or a more specific type if Player class is defined
    enemies: any[]; // Array of Enemy instances
    portalSprite: any; // Phaser.GameObjects.Sprite for the portal
    mapSystem: any; // Instance of MapSystem
    tilemapSystem: any; // Instance of TilemapSystem
    backgroundMusic: any; // Phaser.Sound.BaseSound
    wilhelmScream: any; // Phaser.Sound.BaseSound
    mapData: any; // Map data object
    mapFileInput: HTMLInputElement; // HTML file input element
    mapSaveKey: Phaser.Input.Keyboard.Key;
    mapLoadKey: Phaser.Input.Keyboard.Key;
    // Add any other properties you dynamically attach to scenes
    playWilhelmScream(): void;
    stopBackgroundMusic(): void;
  }
}
// Declare global variables if they are used without explicit imports
declare const gameData: {
  selectedCharacter: string | null;
  playerHealth: number;
  maxHealth: number;
  scrollDirection: string;
};
declare const characters: {
  [key: string]: {
    name: string;
    color: number;
    scrollDirection: string;
  };
};
