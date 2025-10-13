import { ASSET_PATHS } from "../data/config";

export class LoadingScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBarBg!: Phaser.GameObjects.Rectangle;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;
  private loadingDots!: Phaser.GameObjects.Text;
  private dotAnimation!: Phaser.Tweens.Tween;

  constructor() {
    super({ key: "LoadingScene" });
  }

  public preload(): void {
    // Create loading UI
    this.createLoadingUI();

    // Load all game assets
    this.loadAssets();
  }

  private createLoadingUI(): void {
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

  private loadAssets(): void {
    // Set up progress tracking
    this.load.on("progress", (progress: number) => {
      this.updateProgress(progress);
    });

    this.load.on("complete", () => {
      this.onLoadComplete();
    });

    this.load.on("loaderror", (file: any) => {
      console.error("Failed to load asset:", file.key, file.url);
      this.loadingText.setText("Loading Error - Some assets failed to load");
    });

    // Load tileset (needed for GameScene)
    this.load.image("tileset", `${ASSET_PATHS.tiles}/Tileset.png`);

    // Load background images
    this.loadBackgrounds();

    // Load UI images
    this.load.image("homebg", `${ASSET_PATHS.ui}/homebg.png`);
    this.load.image("logo", `${ASSET_PATHS.ui}/logo.png`);

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

  private loadBackgrounds(): void {
    // Load background images (optimized smaller files ~800KB each, 1728x576px)
    this.load.image(
      "background1",
      `${ASSET_PATHS.backgrounds}/background1.png`
    );
    this.load.image(
      "background2",
      `${ASSET_PATHS.backgrounds}/background2.png`
    );
    this.load.image(
      "background3",
      `${ASSET_PATHS.backgrounds}/background3.png`
    );
  }

  private loadCharacterSprites(): void {
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
      this.load.image(
        `${charName}_south`,
        `${ASSET_PATHS.characters}/${char}/rotations/south.png`
      );
      this.load.image(
        `${charName}_west`,
        `${ASSET_PATHS.characters}/${char}/rotations/west.png`
      );
      this.load.image(
        `${charName}_east`,
        `${ASSET_PATHS.characters}/${char}/rotations/east.png`
      );
      this.load.image(
        `${charName}_north`,
        `${ASSET_PATHS.characters}/${char}/rotations/north.png`
      );

      // Load breathing-idle animation frames
      for (let i = 0; i < 4; i++) {
        const frameNumber = i.toString().padStart(3, "0");
        this.load.image(
          `${charName}_breathing_idle_${frameNumber}`,
          `${ASSET_PATHS.characters}/${char}/animations/breathing-idle/south/frame_${frameNumber}.png`
        );
      }

      // Load walk animation frames (east and west)
      ["east", "west"].forEach((direction) => {
        for (let i = 0; i < 6; i++) {
          const frameNumber = i.toString().padStart(3, "0");
          this.load.image(
            `${charName}_walk_${direction}_${frameNumber}`,
            `${ASSET_PATHS.characters}/${char}/animations/walk/${direction}/frame_${frameNumber}.png`
          );
        }
      });

      // Load jumping animation frames (east and west)
      ["east", "west"].forEach((direction) => {
        for (let i = 0; i < 9; i++) {
          const frameNumber = i.toString().padStart(3, "0");
          this.load.image(
            `${charName}_jumping_${direction}_${frameNumber}`,
            `${ASSET_PATHS.characters}/${char}/animations/jumping-1/${direction}/frame_${frameNumber}.png`
          );
        }
      });
    });
  }

  private loadEnemySprites(): void {
    // Load enemy rotation sprites
    const enemies = ["enemy1", "enemy2"];
    const rotations = ["north", "south", "east", "west"];

    enemies.forEach((enemy) => {
      rotations.forEach((rotation) => {
        this.load.image(
          `${enemy}_${rotation}`,
          `${ASSET_PATHS.enemies}/${enemy}/rotations/${rotation}.png`
        );
      });
    });
  }

  private loadPortalSprites(): void {
    // Load portal animation frames
    for (let i = 1; i <= 12; i++) {
      const frameNumber = i.toString().padStart(2, "0");
      this.load.image(
        `portal_frame_${frameNumber}`,
        `${ASSET_PATHS.ui}/portal/portal_clean_frame_${frameNumber}.png`
      );
    }
  }

  private loadAudio(): void {
    // Load background music
    this.load.audio(
      "backgroundMusic",
      `${ASSET_PATHS.audio.music}/background_music.mp3`
    );

    // Load sound effects
    this.load.audio(
      "wilhelmScream",
      `${ASSET_PATHS.audio.sfx}/wilhelmscream.mp3`
    );
  }

  private loadMapData(): void {
    // Load default map
    this.load.json("defaultWorld", `${ASSET_PATHS.maps}/default_world.json`);
  }

  private updateProgress(progress: number): void {
    const percentage = Math.round(progress * 100);

    // Update progress bar
    this.progressBar.width = 400 * progress;

    // Update progress text
    this.progressText.setText(`${percentage}%`);

    // Update loading text based on progress
    if (percentage < 25) {
      this.loadingText.setText("Loading Backgrounds...");
    } else if (percentage < 50) {
      this.loadingText.setText("Loading Character Sprites...");
    } else if (percentage < 75) {
      this.loadingText.setText("Loading Game Assets...");
    } else if (percentage < 100) {
      this.loadingText.setText("Finalizing...");
    }
  }

  private onLoadComplete(): void {
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
