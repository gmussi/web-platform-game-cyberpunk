/// <reference path="./phaser.d.ts" />
import { characters } from "../main.js";
export class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: "CharacterSelectScene" });
        this.characters = [];
    }
    preload() {
        // Assets are preloaded in LoadingScene
    }
    create() {
        // Create character animations for selection screen
        this.createCharacterAnimations();
        // Background
        this.add.image(600, 400, "homebg").setDisplaySize(1200, 800);
        // Logo positioned between top and title (40% of original size)
        this.add.image(600, 200, "logo").setScale(0.4);
        // Title (moved further down)
        this.add
            .text(600, 400, "Choose Your Cyber Hero", {
            fontSize: "32px",
            fill: "#00ffff",
            fontStyle: "bold",
        })
            .setOrigin(0.5);
        // Add some cyberpunk elements
        this.addCyberpunkElements();
        // Character selection area
        const characterKeys = ["A", "B", "C", "D"];
        const characterSize = 120;
        const spacing = 200; // Increased spacing for larger screen
        const totalWidth = (characterKeys.length - 1) * spacing;
        const startX = (1200 - totalWidth) / 2; // Center the characters
        const y = 520; // Moved further down to make more space
        // Create character options
        this.characters = [];
        characterKeys.forEach((key, index) => {
            const x = startX + index * spacing;
            const character = characters[key];
            // Dark rounded square background with yellowish border
            const borderSize = 126; // 10% smaller than 140 (140 * 0.9 = 126)
            const cornerRadius = 15; // Rounded corners
            // Create rounded rectangle using graphics
            const graphics = this.add.graphics();
            graphics.fillStyle(0x1a1a1a, 0.65); // Dark background with 65% transparency
            graphics.lineStyle(3, 0xffdd44); // Yellowish border
            graphics.fillRoundedRect(x - borderSize / 2, y - borderSize / 2, borderSize, borderSize, cornerRadius);
            graphics.strokeRoundedRect(x - borderSize / 2, y - borderSize / 2, borderSize, borderSize, cornerRadius);
            graphics.setDepth(0); // Behind character
            // Invisible interactive area covering the whole square
            const interactiveArea = this.add.rectangle(x, y, borderSize, borderSize);
            interactiveArea.setInteractive();
            interactiveArea.setDepth(0.5); // Between background and character
            // Character sprite (using breathing-idle animation)
            const charName = [
                "cyberWarrior",
                "quantumMage",
                "stealthRogue",
                "plasmaPaladin",
            ][index];
            const sprite = this.add.sprite(x, y, `${charName}_breathing_idle_000`);
            sprite.setDisplaySize(characterSize, characterSize);
            sprite.setScale(1.2); // Start at larger size
            sprite.setDepth(1); // Above background
            // Play breathing-idle animation
            sprite.play(`${charName}_breathing_idle`);
            // Character name
            this.add
                .text(x, y + 80, character.name, {
                fontSize: "18px",
                fill: "#ffffff",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 2,
            })
                .setOrigin(0.5);
            // Click handler on the interactive area
            interactiveArea.on("pointerdown", () => {
                this.selectCharacter(key);
            });
            // Hover effects on the interactive area
            interactiveArea.on("pointerover", () => {
                sprite.setTint(0xffff00); // Yellow glow on hover
                graphics.clear();
                graphics.fillStyle(0x1a1a1a, 0.65); // Dark background with 65% transparency
                graphics.lineStyle(5, 0xffff00); // Brighter border on hover
                graphics.fillRoundedRect(x - borderSize / 2, y - borderSize / 2, borderSize, borderSize, cornerRadius);
                graphics.strokeRoundedRect(x - borderSize / 2, y - borderSize / 2, borderSize, borderSize, cornerRadius);
            });
            interactiveArea.on("pointerout", () => {
                sprite.clearTint();
                graphics.clear();
                graphics.fillStyle(0x1a1a1a, 0.65); // Dark background with 65% transparency
                graphics.lineStyle(3, 0xffdd44); // Reset to normal border
                graphics.fillRoundedRect(x - borderSize / 2, y - borderSize / 2, borderSize, borderSize, cornerRadius);
                graphics.strokeRoundedRect(x - borderSize / 2, y - borderSize / 2, borderSize, borderSize, cornerRadius);
            });
            this.characters.push({
                key: key,
                sprite: sprite,
                data: character,
            });
        });
        // Instructions (moved down)
        this.add
            .text(600, 720, "Click on a hero to begin your cyberpunk adventure!", {
            fontSize: "16px",
            fill: "#00ffff",
        })
            .setOrigin(0.5);
        // Map Editor button
        this.mapEditorButton = this.add
            .text(600, 650, "Map Editor (E)", {
            fontSize: "18px",
            fill: "#00ff00",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 2,
        })
            .setOrigin(0.5)
            .setInteractive();
        this.mapEditorButton.on("pointerdown", () => {
            this.scene.start("MapEditorScene");
        });
        this.mapEditorButton.on("pointerover", () => {
            this.mapEditorButton.setFill("#ffffff");
        });
        this.mapEditorButton.on("pointerout", () => {
            this.mapEditorButton.setFill("#00ff00");
        });
        // Keyboard input
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }
    createCharacterAnimations() {
        const characterNames = [
            "cyberWarrior",
            "quantumMage",
            "stealthRogue",
            "plasmaPaladin",
        ];
        characterNames.forEach((charName) => {
            // Create breathing-idle animation for selection screen
            this.anims.create({
                key: `${charName}_breathing_idle`,
                frames: [
                    { key: `${charName}_breathing_idle_000` },
                    { key: `${charName}_breathing_idle_001` },
                    { key: `${charName}_breathing_idle_002` },
                    { key: `${charName}_breathing_idle_003` },
                ],
                frameRate: 8, // Slow breathing animation
                repeat: -1, // Loop infinitely
            });
        });
    }
    addCyberpunkElements() {
        // Add some floating particles
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(Math.random() * 1200, Math.random() * 800, 1 + Math.random() * 2, 0x00ffff, 0.5);
            this.tweens.add({
                targets: particle,
                y: particle.y + 50,
                duration: 2000 + Math.random() * 1000,
                repeat: -1,
                yoyo: true,
                ease: "Sine.easeInOut",
            });
        }
        // Add some neon lines
        for (let i = 0; i < 5; i++) {
            const line = this.add.rectangle(Math.random() * 1200, Math.random() * 800, 100 + Math.random() * 50, 2, 0xff00ff, 0.3);
            this.tweens.add({
                targets: line,
                alpha: 0.1,
                duration: 1500,
                repeat: -1,
                yoyo: true,
                ease: "Sine.easeInOut",
            });
        }
    }
    update() {
        // Handle keyboard input
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.scene.start("MapEditorScene");
        }
    }
    selectCharacter(characterKey) {
        // Store selected character data
        gameData.selectedCharacter = characterKey;
        gameData.playerHealth = gameData.maxHealth; // Reset health
        // Start the game scene
        this.scene.start("GameScene");
    }
}
//# sourceMappingURL=CharacterSelectScene.js.map