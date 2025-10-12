import { GAME_CONSTANTS } from "../data/config";

// UI Utilities and Constants
// Centralized styling and utility functions for consistent UI across all scenes

export class UIUtils {
  // Common text styles
  static TEXT_STYLES = {
    title: {
      fontSize: "32px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    },
    subtitle: {
      fontSize: "24px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 1,
    },
    button: {
      fontSize: "18px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      fontStyle: "bold",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    },
    ui: {
      fontSize: "16px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 1,
    },
    debug: {
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
      color: "#ffff00",
      fontStyle: "bold",
    },
    loading: {
      fontSize: "20px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 1,
    },
  };

  // Common colors
  static COLORS = {
    primary: "#ffffff",
    secondary: "#cccccc",
    accent: "#00ff00",
    danger: "#ff0000",
    warning: "#ffff00",
    background: "#333333",
    transparent: "rgba(0, 0, 0, 0.5)",
  };

  // Helper method to create styled text
  static createText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: keyof typeof UIUtils.TEXT_STYLES = "ui"
  ): Phaser.GameObjects.Text {
    const textStyle = this.TEXT_STYLES[style] || this.TEXT_STYLES.ui;
    return scene.add.text(x, y, text, textStyle);
  }

  // Helper method to create styled button
  static createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
    style: keyof typeof UIUtils.TEXT_STYLES = "button"
  ): Phaser.GameObjects.Text {
    const buttonStyle = this.TEXT_STYLES[style] || this.TEXT_STYLES.button;
    const button = scene.add.text(x, y, text, buttonStyle);

    (button as any).setInteractive({ useHandCursor: true });
    button.on("pointerdown", callback);

    return button;
  }

  // Helper method to create health bar
  static createHealthBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 200,
    height: number = 20
  ): { bg: Phaser.GameObjects.Rectangle; bar: Phaser.GameObjects.Rectangle } {
    const bg = scene.add.rectangle(x, y, width, height, 0x333333);
    const bar = scene.add.rectangle(x, y, width, height, 0x00ff00);

    bg.setDepth(10);
    bar.setDepth(11);

    return { bg, bar };
  }

  // Helper method to update health bar
  static updateHealthBar(
    healthBar: {
      bg: Phaser.GameObjects.Rectangle;
      bar: Phaser.GameObjects.Rectangle;
    },
    currentHealth: number,
    maxHealth: number
  ): void {
    const percentage = currentHealth / maxHealth;
    const newWidth = healthBar.bar.width * percentage;
    healthBar.bar.width = newWidth;
  }
}
