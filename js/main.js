// Main game configuration
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#0a0a2e', // Dark cyberpunk blue
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [CharacterSelectScene, GameScene, GameOverScene, VictoryScene, MapEditorScene]
};

// Game data
const gameData = {
    selectedCharacter: null,
    playerHealth: 100,
    maxHealth: 100,
    scrollDirection: 'right' // Always scroll right
};

// Character definitions
const characters = {
    A: {
        name: 'Cyber Warrior',
        color: 0xff4444,
        scrollDirection: 'right'
    },
    B: {
        name: 'Quantum Mage',
        color: 0x8844ff,
        scrollDirection: 'right'
    },
    C: {
        name: 'Stealth Rogue',
        color: 0x2244aa,
        scrollDirection: 'right'
    },
    D: {
        name: 'Plasma Paladin',
        color: 0xffaa00,
        scrollDirection: 'right'
    }
};

// Start the game
const game = new Phaser.Game(config);

// Make game accessible globally for testing
window.game = game;
