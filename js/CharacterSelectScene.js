class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    create() {
        // Generate hero sprites
        this.heroSprites = HeroSpriteGenerator.generateHeroSprites(this);
        
        // Background
        this.add.rectangle(400, 300, 800, 600, 0x0a0a2e); // Dark cyberpunk background
        
        // Title
        this.add.text(400, 100, 'Choose Your Cyber Hero', {
            fontSize: '32px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add some cyberpunk elements
        this.addCyberpunkElements();

        // Character selection area
        const characterKeys = ['A', 'B', 'C', 'D'];
        const characterSize = 120;
        const spacing = 160; // Reduced spacing
        const totalWidth = (characterKeys.length - 1) * spacing;
        const startX = (800 - totalWidth) / 2; // Center the characters
        const y = 300;

        // Create character options
        this.characters = [];
        
        characterKeys.forEach((key, index) => {
            const x = startX + (index * spacing);
            const character = characters[key];
            
            // Character sprite (now using generated pixel art)
            const sprite = this.add.image(x, y, this.heroSprites[key]);
            sprite.setDisplaySize(characterSize, characterSize);
            sprite.setScale(1.2); // Start at larger size
            sprite.setInteractive();
            
            // Character name
            this.add.text(x, y + 80, character.name, {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            
            // Click handler
            sprite.on('pointerdown', () => {
                this.selectCharacter(key);
            });
            
            // Hover effects
            sprite.on('pointerover', () => {
                sprite.setTint(0xffff00); // Yellow glow on hover
            });
            
            sprite.on('pointerout', () => {
                sprite.clearTint();
            });
            
            this.characters.push({
                key: key,
                sprite: sprite,
                data: character
            });
        });

        // Instructions
        this.add.text(400, 500, 'Click on a hero to begin your cyberpunk adventure!', {
            fontSize: '16px',
            fill: '#00ffff'
        }).setOrigin(0.5);
    }
    
    addCyberpunkElements() {
        // Add some floating particles
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                Math.random() * 800,
                Math.random() * 600,
                1 + Math.random() * 2,
                0x00ffff,
                0.5
            );
            
            this.tweens.add({
                targets: particle,
                y: particle.y + 50,
                duration: 2000 + Math.random() * 1000,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Add some neon lines
        for (let i = 0; i < 5; i++) {
            const line = this.add.rectangle(
                Math.random() * 800,
                Math.random() * 600,
                100 + Math.random() * 50,
                2,
                0xff00ff,
                0.3
            );
            
            this.tweens.add({
                targets: line,
                alpha: 0.1,
                duration: 1500,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }

    selectCharacter(characterKey) {
        // Store selected character data
        gameData.selectedCharacter = characterKey;
        gameData.playerHealth = gameData.maxHealth; // Reset health
        
        // Start the game scene
        this.scene.start('GameScene');
    }
}
