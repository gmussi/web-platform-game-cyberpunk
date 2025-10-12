/// <reference path="./phaser.d.ts" />

// Unified Sprite Generator
// Consolidates hero and robot sprite generation into a single utility class

export class SpriteGenerator {
  // Generate all hero sprites
  static generateHeroSprites(scene: Phaser.Scene): { [key: string]: string } {
    const heroes: { [key: string]: string } = {};

    // Hero A: Cyber Warrior
    heroes.A = this.createCyberWarrior(scene);

    // Hero B: Quantum Mage
    heroes.B = this.createQuantumMage(scene);

    // Hero C: Stealth Rogue
    heroes.C = this.createStealthRogue(scene);

    // Hero D: Plasma Paladin
    heroes.D = this.createPlasmaPaladin(scene);

    return heroes;
  }

  // Generate all robot sprites
  static generateRobotSprites(scene: Phaser.Scene): { [key: string]: string } {
    const robots: { [key: string]: string } = {};

    // Stationary Robot
    robots.stationary = this.createStationaryRobot(scene);

    // Moving Robot
    robots.moving = this.createMovingRobot(scene);

    return robots;
  }

  // Generate all sprites (heroes + robots)
  static generateAllSprites(scene: Phaser.Scene): {
    heroes: { [key: string]: string };
    robots: { [key: string]: string };
  } {
    return {
      heroes: this.generateHeroSprites(scene),
      robots: this.generateRobotSprites(scene),
    };
  }

  // Hero A: Cyber Warrior
  static createCyberWarrior(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 64;

    // Body (red armor)
    graphics.fillStyle(0xff4444);
    graphics.fillRect(20, 20, 24, 32);

    // Helmet (red)
    graphics.fillStyle(0xcc3333);
    graphics.fillRect(22, 8, 20, 16);

    // Shoulder plates (red)
    graphics.fillStyle(0xaa2222);
    graphics.fillRect(16, 24, 8, 12);
    graphics.fillRect(40, 24, 8, 12);

    // Legs (red)
    graphics.fillStyle(0xdd3333);
    graphics.fillRect(24, 52, 8, 12);
    graphics.fillRect(32, 52, 8, 12);

    // Eyes (blue glowing)
    graphics.fillStyle(0x0088ff);
    graphics.fillRect(26, 12, 4, 4);
    graphics.fillRect(34, 12, 4, 4);

    // Weapon (energy sword)
    graphics.fillStyle(0x00ffff);
    graphics.fillRect(48, 16, 4, 24);

    graphics.generateTexture("cyberWarrior_breathing_idle_000", size, size);
    graphics.destroy();

    return "cyberWarrior_breathing_idle_000";
  }

  // Hero B: Quantum Mage
  static createQuantumMage(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 64;

    // Body (purple robes)
    graphics.fillStyle(0x8844ff);
    graphics.fillRect(20, 20, 24, 32);

    // Helmet (purple)
    graphics.fillStyle(0x6633cc);
    graphics.fillRect(22, 8, 20, 16);

    // Shoulder plates (purple)
    graphics.fillStyle(0x5522aa);
    graphics.fillRect(16, 24, 8, 12);
    graphics.fillRect(40, 24, 8, 12);

    // Legs (purple)
    graphics.fillStyle(0x9933dd);
    graphics.fillRect(24, 52, 8, 12);
    graphics.fillRect(32, 52, 8, 12);

    // Eyes (purple glowing)
    graphics.fillStyle(0xaa44ff);
    graphics.fillRect(26, 12, 4, 4);
    graphics.fillRect(34, 12, 4, 4);

    // Staff (energy staff)
    graphics.fillStyle(0xff44ff);
    graphics.fillRect(48, 12, 4, 32);

    graphics.generateTexture("quantumMage_breathing_idle_000", size, size);
    graphics.destroy();

    return "quantumMage_breathing_idle_000";
  }

  // Hero C: Stealth Rogue
  static createStealthRogue(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 64;

    // Body (blue armor)
    graphics.fillStyle(0x2244aa);
    graphics.fillRect(20, 20, 24, 32);

    // Helmet (blue)
    graphics.fillStyle(0x1133aa);
    graphics.fillRect(22, 8, 20, 16);

    // Shoulder plates (blue)
    graphics.fillStyle(0x0022aa);
    graphics.fillRect(16, 24, 8, 12);
    graphics.fillRect(40, 24, 8, 12);

    // Legs (blue)
    graphics.fillStyle(0x3355bb);
    graphics.fillRect(24, 52, 8, 12);
    graphics.fillRect(32, 52, 8, 12);

    // Eyes (blue glowing)
    graphics.fillStyle(0x4488ff);
    graphics.fillRect(26, 12, 4, 4);
    graphics.fillRect(34, 12, 4, 4);

    // Daggers (blue energy)
    graphics.fillStyle(0x44aaff);
    graphics.fillRect(48, 20, 3, 16);
    graphics.fillRect(52, 20, 3, 16);

    graphics.generateTexture("stealthRogue_breathing_idle_000", size, size);
    graphics.destroy();

    return "stealthRogue_breathing_idle_000";
  }

  // Hero D: Plasma Paladin
  static createPlasmaPaladin(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 64;

    // Body (golden armor)
    graphics.fillStyle(0xffaa00);
    graphics.fillRect(20, 20, 24, 32);

    // Helmet (golden)
    graphics.fillStyle(0xcc8800);
    graphics.fillRect(22, 8, 20, 16);

    // Shoulder plates (golden)
    graphics.fillStyle(0xaa6600);
    graphics.fillRect(16, 24, 8, 12);
    graphics.fillRect(40, 24, 8, 12);

    // Legs (golden)
    graphics.fillStyle(0xdd9900);
    graphics.fillRect(24, 52, 8, 12);
    graphics.fillRect(32, 52, 8, 12);

    // Eyes (golden glowing)
    graphics.fillStyle(0xffcc00);
    graphics.fillRect(26, 12, 4, 4);
    graphics.fillRect(34, 12, 4, 4);

    // Shield (golden energy)
    graphics.fillStyle(0xffdd44);
    graphics.fillRect(48, 16, 8, 20);

    graphics.generateTexture("plasmaPaladin_breathing_idle_000", size, size);
    graphics.destroy();

    return "plasmaPaladin_breathing_idle_000";
  }

  // Stationary Robot
  static createStationaryRobot(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 64;

    // Robot body (dark gray)
    graphics.fillStyle(0x444444);
    graphics.fillRect(16, 16, 16, 24);

    // Robot head (square)
    graphics.fillStyle(0x333333);
    graphics.fillRect(18, 8, 12, 12);

    // Eyes (red glowing)
    graphics.fillStyle(0xff0000);
    graphics.fillRect(20, 10, 2, 2);
    graphics.fillRect(26, 10, 2, 2);

    // Arms (dark gray)
    graphics.fillStyle(0x444444);
    graphics.fillRect(8, 20, 8, 12);
    graphics.fillRect(32, 20, 8, 12);

    // Legs (dark gray)
    graphics.fillStyle(0x444444);
    graphics.fillRect(18, 40, 6, 16);
    graphics.fillRect(24, 40, 6, 16);

    // Chest panel (lighter gray)
    graphics.fillStyle(0x666666);
    graphics.fillRect(20, 18, 8, 8);

    graphics.generateTexture("stationaryRobot", size, size);
    graphics.destroy();

    return "stationaryRobot";
  }

  // Moving Robot
  static createMovingRobot(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 64;

    // Robot body (dark gray)
    graphics.fillStyle(0x444444);
    graphics.fillRect(16, 16, 16, 24);

    // Robot head (square)
    graphics.fillStyle(0x333333);
    graphics.fillRect(18, 8, 12, 12);

    // Eyes (blue glowing)
    graphics.fillStyle(0x0088ff);
    graphics.fillRect(20, 10, 2, 2);
    graphics.fillRect(26, 10, 2, 2);

    // Arms (dark gray)
    graphics.fillStyle(0x444444);
    graphics.fillRect(8, 20, 8, 12);
    graphics.fillRect(32, 20, 8, 12);

    // Legs (dark gray)
    graphics.fillStyle(0x444444);
    graphics.fillRect(18, 40, 6, 16);
    graphics.fillRect(24, 40, 6, 16);

    // Chest panel (lighter gray)
    graphics.fillStyle(0x666666);
    graphics.fillRect(20, 18, 8, 8);

    // Wheels (dark)
    graphics.fillStyle(0x222222);
    graphics.fillRect(16, 56, 4, 4);
    graphics.fillRect(28, 56, 4, 4);

    graphics.generateTexture("movingRobot", size, size);
    graphics.destroy();

    return "movingRobot";
  }
}
