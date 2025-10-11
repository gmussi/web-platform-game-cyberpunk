/// <reference path="./phaser.d.ts" />
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: "LoadingScene" });
    }
    preload() {
        // Create loading UI
        this.createLoadingUI();
        // Load all game assets
        this.loadAssets();
    }
    createLoadingUI() {
        // Background
        this.add.rectangle(600, 400, 1200, 800, 0x0a0a2e);
        // Loading text
        this.loadingText = this.add
            .text(600, 350, "Loading Assets...", {
            fontSize: "24px",
            fill: "#ffffff",
            fontStyle: "bold",
        })
            .setOrigin(0.5);
        // Progress bar background
        this.progressBarBg = this.add
            .rectangle(600, 450, 400, 20, 0x333333)
            .setOrigin(0.5);
        // Progress bar
        this.progressBar = this.add
            .rectangle(400, 450, 0, 20, 0x00ffff)
            .setOrigin(0, 0.5);
        // Progress text
        this.progressText = this.add
            .text(600, 500, "0%", {
            fontSize: "18px",
            fill: "#ffffff",
            fontStyle: "bold",
        })
            .setOrigin(0.5);
        // Loading animation
        this.loadingDots = this.add
            .text(600, 550, "...", {
            fontSize: "20px",
            fill: "#00ffff",
        })
            .setOrigin(0.5);
        // Animate loading dots
        this.dotAnimation = this.tweens.add({
            targets: this.loadingDots,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
        });
    }
    loadAssets() {
        // Set up progress tracking
        this.load.on("progress", (progress) => {
            this.updateProgress(progress);
        });
        this.load.on("complete", () => {
            this.onLoadComplete();
        });
        this.load.on("loaderror", (file) => {
            console.error("Failed to load asset:", file.key, file.url);
            this.loadingText.setText("Loading Error - Some assets failed to load");
        });
        // Load tileset (needed for GameScene)
        this.load.image("tileset", "img/Tileset.png");
        // Load background images
        this.loadBackgrounds();
        // Load UI images
        this.load.image("homebg", "img/homebg.png");
        this.load.image("logo", "img/logo.png");
        // Load character sprites
        this.loadCharacterSprites();
        // Load enemy sprites
        this.loadEnemySprites();
        // Load portal sprites
        this.loadPortalSprites();
        // Load audio
        this.loadAudio();
        // Load map data
        this.loadMapData();
        // Start loading
        this.load.start();
    }
    loadBackgrounds() {
        // Load background images (optimized smaller files ~800KB each, 1728x576px)
        this.load.image("background1", "img/background1.png");
        this.load.image("background2", "img/background2.png");
        this.load.image("background3", "img/background3.png");
    }
    loadCharacterSprites() {
        const characters = ["char1", "char2", "char3", "char4"];
        const characterNames = [
            "cyberWarrior",
            "quantumMage",
            "stealthRogue",
            "plasmaPaladin",
        ];
        characters.forEach((char, index) => {
            const charName = characterNames[index];
            // Load rotation sprites
            this.load.image(`${charName}_south`, `img/${char}/rotations/south.png`);
            this.load.image(`${charName}_west`, `img/${char}/rotations/west.png`);
            this.load.image(`${charName}_east`, `img/${char}/rotations/east.png`);
            this.load.image(`${charName}_north`, `img/${char}/rotations/north.png`);
            // Load breathing-idle animation frames
            for (let i = 0; i < 4; i++) {
                const frameNumber = i.toString().padStart(3, "0");
                this.load.image(`${charName}_breathing_idle_${frameNumber}`, `img/${char}/animations/breathing-idle/south/frame_${frameNumber}.png`);
            }
            // Load walk animation frames (east and west)
            ["east", "west"].forEach((direction) => {
                for (let i = 0; i < 6; i++) {
                    const frameNumber = i.toString().padStart(3, "0");
                    this.load.image(`${charName}_walk_${direction}_${frameNumber}`, `img/${char}/animations/walk/${direction}/frame_${frameNumber}.png`);
                }
            });
            // Load jumping animation frames (east and west)
            ["east", "west"].forEach((direction) => {
                for (let i = 0; i < 9; i++) {
                    const frameNumber = i.toString().padStart(3, "0");
                    this.load.image(`${charName}_jumping_${direction}_${frameNumber}`, `img/${char}/animations/jumping-1/${direction}/frame_${frameNumber}.png`);
                }
            });
        });
    }
    loadEnemySprites() {
        // Load enemy rotation sprites
        const enemies = ["enemy1", "enemy2"];
        const rotations = ["north", "south", "east", "west"];
        enemies.forEach((enemy) => {
            rotations.forEach((rotation) => {
                this.load.image(`${enemy}_${rotation}`, `img/${enemy}/rotations/${rotation}.png`);
            });
        });
    }
    loadPortalSprites() {
        // Load portal animation frames
        for (let i = 1; i <= 12; i++) {
            const frameNumber = i.toString().padStart(2, "0");
            this.load.image(`portal_frame_${frameNumber}`, `img/portal/portal_clean_frame_${frameNumber}.png`);
        }
    }
    loadAudio() {
        // Load background music
        this.load.audio("backgroundMusic", "audio/background_music.mp3");
        // Load sound effects
        this.load.audio("wilhelmScream", "audio/wilhelmscream.mp3");
    }
    loadMapData() {
        // Load default map
        this.load.json("defaultMap", "maps/default.json");
    }
    updateProgress(progress) {
        const percentage = Math.round(progress * 100);
        // Update progress bar
        this.progressBar.width = 400 * progress;
        // Update progress text
        this.progressText.setText(`${percentage}%`);
        // Update loading text based on progress
        if (percentage < 25) {
            this.loadingText.setText("Loading Backgrounds...");
        }
        else if (percentage < 50) {
            this.loadingText.setText("Loading Character Sprites...");
        }
        else if (percentage < 75) {
            this.loadingText.setText("Loading Game Assets...");
        }
        else if (percentage < 100) {
            this.loadingText.setText("Finalizing...");
        }
    }
    onLoadComplete() {
        // Stop dot animation
        this.dotAnimation.stop();
        // Update UI for completion
        this.loadingText.setText("Loading Complete!");
        this.progressText.setText("100%");
        this.loadingDots.setText("");
        // Add a brief delay before transitioning
        this.time.delayedCall(1000, () => {
            this.scene.start("CharacterSelectScene");
        });
    }
}
//# sourceMappingURL=LoadingScene.js.map