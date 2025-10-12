/// <reference path="./phaser.d.ts" />

import { characters, gameData } from "../gameData";

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: "VictoryScene" });
  }

  public preload(): void {
    // Assets are preloaded in LoadingScene
  }

  public create(): void {
    // Background
    this.add.image(600, 400, "homebg").setDisplaySize(1200, 800);

    // Victory text
    this.add
      .text(600, 200, "VICTORY!", {
        fontSize: "64px",
        fill: "#00ff88",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Character info
    const characterName = characters[gameData.selectedCharacter!].name;
    this.add
      .text(600, 280, `Congratulations, ${characterName}!`, {
        fontSize: "28px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Success message
    this.add
      .text(600, 340, "You have successfully reached the portal!", {
        fontSize: "20px",
        fill: "#00ff88",
      })
      .setOrigin(0.5);

    // Portal reached message
    this.add
      .text(600, 380, "Mission Complete", {
        fontSize: "24px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Play again button
    const playAgainButton = this.add.rectangle(600, 480, 200, 50, 0x00ff88);
    playAgainButton.setStrokeStyle(2, 0x00cc66);
    playAgainButton.setInteractive();

    this.add
      .text(600, 480, "Play Again", {
        fontSize: "20px",
        fill: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Button interactions
    playAgainButton.on("pointerdown", () => {
      this.scene.start("CharacterSelectScene");
    });

    playAgainButton.on("pointerover", () => {
      playAgainButton.setFillStyle(0x44ffaa);
    });

    playAgainButton.on("pointerout", () => {
      playAgainButton.setFillStyle(0x00ff88);
    });

    // Instructions
    this.add
      .text(600, 580, 'Click "Play Again" to return to character selection', {
        fontSize: "14px",
        fill: "#888888",
      })
      .setOrigin(0.5);

    // Add some victory effects
    this.addVictoryEffects();
  }

  private addVictoryEffects(): void {
    // Add floating particles for celebration
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Math.random() * 1200,
        Math.random() * 800,
        2 + Math.random() * 3,
        0x00ff88,
        0.8
      );

      // Animate particles
      this.tweens.add({
        targets: particle,
        y: particle.y - 100,
        alpha: 0,
        duration: 2000 + Math.random() * 1000,
        repeat: -1,
        ease: "Power2.easeOut",
      });
    }
  }
}
