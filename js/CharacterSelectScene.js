class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    preload() {
        // Load character sprites for selection screen
        this.loadCharacterSprites();
    }
    
    loadCharacterSprites() {
        const characters = ['char1', 'char2', 'char3', 'char4'];
        const characterNames = ['cyberWarrior', 'quantumMage', 'stealthRogue', 'plasmaPaladin'];
        
        characters.forEach((char, index) => {
            const charName = characterNames[index];
            
            // Load breathing-idle animation frames for character selection
            for (let i = 0; i < 4; i++) {
                const frameNumber = i.toString().padStart(3, '0');
                this.load.image(`${charName}_breathing_idle_${frameNumber}`, `img/${char}/animations/breathing-idle/south/frame_${frameNumber}.png`);
            }
        });
    }

    create() {
        // Create character animations for selection screen
        this.createCharacterAnimations();
        
        // Background
        this.add.rectangle(600, 400, 1200, 800, 0x0a0a2e); // Dark cyberpunk background
        
        // Title
        this.add.text(600, 150, 'Choose Your Cyber Hero', {
            fontSize: '32px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add some cyberpunk elements
        this.addCyberpunkElements();

        // Character selection area
        const characterKeys = ['A', 'B', 'C', 'D'];
        const characterSize = 120;
        const spacing = 200; // Increased spacing for larger screen
        const totalWidth = (characterKeys.length - 1) * spacing;
        const startX = (1200 - totalWidth) / 2; // Center the characters
        const y = 400;

        // Create character options
        this.characters = [];
        
        characterKeys.forEach((key, index) => {
            const x = startX + (index * spacing);
            const character = characters[key];
            
            // Character sprite (using breathing-idle animation)
            const charName = ['cyberWarrior', 'quantumMage', 'stealthRogue', 'plasmaPaladin'][index];
            const sprite = this.add.sprite(x, y, `${charName}_breathing_idle_000`);
            sprite.setDisplaySize(characterSize, characterSize);
            sprite.setScale(1.2); // Start at larger size
            sprite.setInteractive();
            
            // Play breathing-idle animation
            sprite.play(`${charName}_breathing_idle`);
            
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
        this.add.text(600, 650, 'Click on a hero to begin your cyberpunk adventure!', {
            fontSize: '16px',
            fill: '#00ffff'
        }).setOrigin(0.5);
    }
    
    createCharacterAnimations() {
        const characterNames = ['cyberWarrior', 'quantumMage', 'stealthRogue', 'plasmaPaladin'];
        
        characterNames.forEach(charName => {
            // Create breathing-idle animation for selection screen
            this.anims.create({
                key: `${charName}_breathing_idle`,
                frames: [
                    { key: `${charName}_breathing_idle_000` },
                    { key: `${charName}_breathing_idle_001` },
                    { key: `${charName}_breathing_idle_002` },
                    { key: `${charName}_breathing_idle_003` }
                ],
                frameRate: 8, // Slow breathing animation
                repeat: -1 // Loop infinitely
            });
        });
    }
    
    addCyberpunkElements() {
        // Add some floating particles
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                Math.random() * 1200,
                Math.random() * 800,
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
                Math.random() * 1200,
                Math.random() * 800,
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
