import { ASSET_PATHS } from "../data/config";
import { characters, gameData } from "../data/characters";
import { Character } from "../types/game";

// Character selection interface
interface CharacterSelection {
  key: string;
  sprite: Phaser.GameObjects.Sprite;
  data: Character;
}

export class CharacterSelectScene extends Phaser.Scene {
  private characters: CharacterSelection[] = [];
  private mapEditorButton!: Phaser.GameObjects.Text;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "CharacterSelectScene" });
  }

  public preload(): void {
    // Assets are preloaded in LoadingScene
  }

  public create(): void {
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
    const characterKeys = ["biker", "punk", "cyborg"];
    const characterSize = 120;
    const spacing = 250; // Increased spacing for 3 characters
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
      graphics.fillRoundedRect(
        x - borderSize / 2,
        y - borderSize / 2,
        borderSize,
        borderSize,
        cornerRadius
      );
      graphics.strokeRoundedRect(
        x - borderSize / 2,
        y - borderSize / 2,
        borderSize,
        borderSize,
        cornerRadius
      );
      graphics.setDepth(0); // Behind character

      // Invisible interactive area covering the whole square
      const interactiveArea = this.add.rectangle(x, y, borderSize, borderSize);
      interactiveArea.setInteractive();
      interactiveArea.setDepth(0.5); // Between background and character

      // Character sprite (using idle animation)
      const charKey = characterKeys[index];
      const sprite = this.add.sprite(x, y, `${charKey}_idle`);
      sprite.setScale(1.8); // 50% larger than gameplay (1.2 * 1.5)
      sprite.setDepth(1); // Above background

      // Play idle animation
      sprite.play(`${charKey}_idle`);

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
        graphics.fillRoundedRect(
          x - borderSize / 2,
          y - borderSize / 2,
          borderSize,
          borderSize,
          cornerRadius
        );
        graphics.strokeRoundedRect(
          x - borderSize / 2,
          y - borderSize / 2,
          borderSize,
          borderSize,
          cornerRadius
        );
      });

      interactiveArea.on("pointerout", () => {
        sprite.clearTint();
        graphics.clear();
        graphics.fillStyle(0x1a1a1a, 0.65); // Dark background with 65% transparency
        graphics.lineStyle(3, 0xffdd44); // Reset to normal border
        graphics.fillRoundedRect(
          x - borderSize / 2,
          y - borderSize / 2,
          borderSize,
          borderSize,
          cornerRadius
        );
        graphics.strokeRoundedRect(
          x - borderSize / 2,
          y - borderSize / 2,
          borderSize,
          borderSize,
          cornerRadius
        );
      });

      this.characters.push({
        key: key,
        sprite: sprite,
        data: character,
      });
    });

    // Set up attack animation timers for each character
    this.setupAttackAnimations();

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
      console.log("🧠 Clicking map editor button");
      this.scene.start("MapEditorScene");
    });

    this.mapEditorButton.on("pointerover", () => {
      this.mapEditorButton.setFill("#ffffff");
    });

    this.mapEditorButton.on("pointerout", () => {
      this.mapEditorButton.setFill("#00ff00");
    });

    // Keyboard input
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private createCharacterAnimations(): void {
    const characterKeys = ["biker", "punk", "cyborg"];

    characterKeys.forEach((charKey) => {
      // Create idle animation for selection screen
      this.anims.create({
        key: `${charKey}_idle`,
        frames: this.anims.generateFrameNumbers(`${charKey}_idle`, {
          start: 0,
          end: 3,
        }),
        frameRate: 8, // Slow idle animation
        repeat: -1, // Loop infinitely
      });

      // Create attack3 animation for selection screen
      this.anims.create({
        key: `${charKey}_attack3`,
        frames: this.anims.generateFrameNumbers(`${charKey}_attack3`, {
          start: 0,
          end: -1,
        }),
        frameRate: 12,
        repeat: 0, // Play once
      });
    });
  }

  private addCyberpunkElements(): void {
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
        ease: "Sine.easeInOut",
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
        ease: "Sine.easeInOut",
      });
    }
  }

  public update(): void {
    // Handle keyboard input
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      console.log("🧠 Pressing E key to open map editor");
      this.scene.start("MapEditorScene");
    }
  }

  private setupAttackAnimations(): void {
    // Set up timers for each character to play attack3 animation every 3 seconds
    this.characters.forEach((character) => {
      this.time.addEvent({
        delay: 3000, // 3 seconds
        callback: () => {
          // Play attack3 animation
          character.sprite.play(`${character.key}_attack3`);

          // When attack3 finishes, return to idle
          character.sprite.once("animationcomplete", () => {
            character.sprite.play(`${character.key}_idle`);
          });
        },
        loop: true,
      });
    });
  }

  private selectCharacter(characterKey: string): void {
    console.log("🧠 Selecting character:", characterKey);
    // Store selected character data
    gameData.selectedCharacter = characterKey;
    gameData.playerHealth = gameData.maxHealth; // Reset health

    console.log("🧠 Transitioning to GameScene");
    // Start the game scene
    this.scene.start("GameScene", { showWorldPicker: true });
  }
}
