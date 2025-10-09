class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        // Background
        this.add.rectangle(600, 400, 1200, 800, 0x2c3e50); // Dark background
        
        // Game Over text
        this.add.text(600, 250, 'Game Over', {
            fontSize: '48px',
            fill: '#e74c3c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Character info
        const characterName = characters[gameData.selectedCharacter].name;
        this.add.text(600, 350, `You played as: ${characterName}`, {
            fontSize: '24px',
            fill: '#ecf0f1'
        }).setOrigin(0.5);

        // Final score or stats could go here
        this.add.text(600, 400, 'Better luck next time!', {
            fontSize: '18px',
            fill: '#bdc3c7'
        }).setOrigin(0.5);

        // Restart button
        const restartButton = this.add.rectangle(600, 500, 200, 50, 0x3498db);
        restartButton.setStrokeStyle(2, 0x2980b9);
        restartButton.setInteractive();
        
        this.add.text(600, 500, 'Play Again', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button interactions
        restartButton.on('pointerdown', () => {
            this.scene.start('CharacterSelectScene');
        });

        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x5dade2);
        });

        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x3498db);
        });

        // Instructions
        this.add.text(600, 650, 'Click "Play Again" to return to character selection', {
            fontSize: '14px',
            fill: '#95a5a6'
        }).setOrigin(0.5);
    }
}
