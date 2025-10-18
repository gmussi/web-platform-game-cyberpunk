import { GAME_CONSTANTS } from "../data/config";

// Unified Sprite Generator
// Consolidates hero and robot sprite generation into a single utility class

export class SpriteGenerator {
  // Generate all hero sprites
  static generateHeroSprites(scene: Phaser.Scene): { [key: string]: string } {
    const heroes: { [key: string]: string } = {};

    // Hero: Biker
    heroes.biker = this.createBiker(scene);

    // Hero: Punk
    heroes.punk = this.createPunk(scene);

    // Hero: Cyborg
    heroes.cyborg = this.createCyborg(scene);

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

  // Hero: Biker
  static createBiker(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 48;

    // Body (red leather jacket)
    graphics.fillStyle(0xff4444);
    graphics.fillRect(14, 14, 20, 24);

    // Helmet
    graphics.fillStyle(0x333333);
    graphics.fillRect(16, 6, 16, 12);

    // Visor (red tinted)
    graphics.fillStyle(0xff6666);
    graphics.fillRect(18, 8, 12, 4);

    // Shoulder pads
    graphics.fillStyle(0xaa2222);
    graphics.fillRect(12, 16, 6, 8);
    graphics.fillRect(30, 16, 6, 8);

    // Legs (dark pants)
    graphics.fillStyle(0x222222);
    graphics.fillRect(18, 38, 6, 10);
    graphics.fillRect(24, 38, 6, 10);

    graphics.generateTexture("biker_idle", size, size);
    graphics.destroy();

    return "biker_idle";
  }

  // Hero: Punk
  static createPunk(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 48;

    // Body (punk jacket)
    graphics.fillStyle(0xff00ff);
    graphics.fillRect(14, 14, 20, 24);

    // Mohawk
    graphics.fillStyle(0xff00aa);
    graphics.fillRect(20, 2, 8, 10);

    // Face
    graphics.fillStyle(0xffddaa);
    graphics.fillRect(18, 10, 12, 8);

    // Eyes (piercing)
    graphics.fillStyle(0x00ffff);
    graphics.fillRect(20, 12, 2, 2);
    graphics.fillRect(26, 12, 2, 2);

    // Legs (torn pants)
    graphics.fillStyle(0x444444);
    graphics.fillRect(18, 38, 6, 10);
    graphics.fillRect(24, 38, 6, 10);

    graphics.generateTexture("punk_idle", size, size);
    graphics.destroy();

    return "punk_idle";
  }

  // Hero: Cyborg
  static createCyborg(scene: Phaser.Scene): string {
    const graphics = scene.add.graphics();
    const size = 48;

    // Body (metallic)
    graphics.fillStyle(0x00ffff);
    graphics.fillRect(14, 14, 20, 24);

    // Head (robotic)
    graphics.fillStyle(0x0088aa);
    graphics.fillRect(16, 6, 16, 12);

    // Eyes (glowing cyan)
    graphics.fillStyle(0x00ffff);
    graphics.fillRect(18, 8, 4, 4);
    graphics.fillRect(26, 8, 4, 4);

    // Shoulder plates (metallic)
    graphics.fillStyle(0x006688);
    graphics.fillRect(12, 16, 6, 8);
    graphics.fillRect(30, 16, 6, 8);

    // Legs (metallic)
    graphics.fillStyle(0x0099bb);
    graphics.fillRect(18, 38, 6, 10);
    graphics.fillRect(24, 38, 6, 10);

    // Chest panel (glowing)
    graphics.fillStyle(0x00ccff);
    graphics.fillRect(20, 20, 8, 8);

    graphics.generateTexture("cyborg_idle", size, size);
    graphics.destroy();

    return "cyborg_idle";
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
