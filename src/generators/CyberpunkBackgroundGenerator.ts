import { GAME_CONSTANTS } from "../data/config";

// Cyberpunk City Background Generator
// Creates a futuristic pixelated cityscape background

interface Building {
  x: number;
  width: number;
  height: number;
  color: number;
}

interface NeonSign {
  x: number;
  y: number;
  text: string;
  color: number;
}

export class CyberpunkBackgroundGenerator {
  static createBackground(scene: Phaser.Scene): string {
    const width = 4100; // Extended to cover full map width with buffer
    const height = 600;

    // Create main background
    const background = scene.add.graphics();

    // Dark sky gradient (dark blue to black)
    background.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x16213e, 0x16213e, 1);
    background.fillRect(0, 0, width, height);

    // Add some stars
    this.addStars(background, width, height);

    // Create city skyline
    this.createCitySkyline(background, width, height);

    // Add neon signs and lights
    this.addNeonLights(background, width, height);

    // Add atmospheric effects
    this.addAtmosphericEffects(background, width, height);

    background.generateTexture("cyberpunkBackground", width, height);
    background.destroy();

    return "cyberpunkBackground";
  }

  private static addStars(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number
  ): void {
    graphics.fillStyle(0xffffff);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.3;
      graphics.fillRect(x, y, 1, 1);
    }

    // Add some brighter stars
    graphics.fillStyle(0x00ffff);
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.2;
      graphics.fillRect(x, y, 2, 2);
    }
  }

  private static createCitySkyline(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number
  ): void {
    const groundY = height - 100;

    // Main city buildings - extended to cover full 4000px width
    const buildings: Building[] = [
      { x: 0, width: 80, height: 200, color: 0x1a1a2e },
      { x: 80, width: 60, height: 150, color: 0x16213e },
      { x: 140, width: 100, height: 300, color: 0x0f3460 },
      { x: 240, width: 70, height: 180, color: 0x1a1a2e },
      { x: 310, width: 90, height: 250, color: 0x16213e },
      { x: 400, width: 120, height: 350, color: 0x0f3460 },
      { x: 520, width: 80, height: 200, color: 0x1a1a2e },
      { x: 600, width: 100, height: 280, color: 0x16213e },
      { x: 700, width: 60, height: 160, color: 0x0f3460 },
      { x: 760, width: 90, height: 220, color: 0x1a1a2e },
      { x: 850, width: 110, height: 320, color: 0x16213e },
      { x: 960, width: 80, height: 190, color: 0x0f3460 },
      { x: 1040, width: 100, height: 260, color: 0x1a1a2e },
      { x: 1140, width: 70, height: 170, color: 0x16213e },
      { x: 1210, width: 90, height: 240, color: 0x0f3460 },
      { x: 1300, width: 120, height: 300, color: 0x1a1a2e },
      { x: 1420, width: 80, height: 200, color: 0x16213e },
      { x: 1500, width: 100, height: 280, color: 0x0f3460 },
      { x: 1600, width: 60, height: 160, color: 0x1a1a2e },
      { x: 1660, width: 90, height: 220, color: 0x16213e },
      { x: 1750, width: 110, height: 320, color: 0x0f3460 },
      { x: 1860, width: 80, height: 190, color: 0x1a1a2e },
      { x: 1940, width: 60, height: 150, color: 0x16213e },
      // Extended buildings for full coverage
      { x: 2000, width: 80, height: 200, color: 0x1a1a2e },
      { x: 2080, width: 60, height: 150, color: 0x16213e },
      { x: 2140, width: 100, height: 300, color: 0x0f3460 },
      { x: 2240, width: 70, height: 180, color: 0x1a1a2e },
      { x: 2310, width: 90, height: 250, color: 0x16213e },
      { x: 2400, width: 120, height: 350, color: 0x0f3460 },
      { x: 2520, width: 80, height: 200, color: 0x1a1a2e },
      { x: 2600, width: 100, height: 280, color: 0x16213e },
      { x: 2700, width: 60, height: 160, color: 0x0f3460 },
      { x: 2760, width: 90, height: 220, color: 0x1a1a2e },
      { x: 2850, width: 110, height: 320, color: 0x16213e },
      { x: 2960, width: 80, height: 190, color: 0x0f3460 },
      { x: 3040, width: 100, height: 260, color: 0x1a1a2e },
      { x: 3140, width: 70, height: 170, color: 0x16213e },
      { x: 3210, width: 90, height: 240, color: 0x0f3460 },
      { x: 3300, width: 120, height: 300, color: 0x1a1a2e },
      { x: 3420, width: 80, height: 200, color: 0x16213e },
      { x: 3500, width: 100, height: 280, color: 0x0f3460 },
      { x: 3600, width: 60, height: 160, color: 0x1a1a2e },
      { x: 3660, width: 90, height: 220, color: 0x16213e },
      { x: 3750, width: 110, height: 320, color: 0x0f3460 },
      { x: 3860, width: 80, height: 190, color: 0x1a1a2e },
      { x: 3940, width: 60, height: 150, color: 0x16213e },
      { x: 4000, width: 100, height: 200, color: 0x0f3460 },
    ];

    buildings.forEach((building) => {
      // Building base
      graphics.fillStyle(building.color);
      graphics.fillRect(
        building.x,
        groundY - building.height,
        building.width,
        building.height
      );

      // Building windows (neon lights)
      this.addBuildingWindows(graphics, building, groundY);
    });

    // Ground level
    graphics.fillStyle(0x0a0a0a);
    graphics.fillRect(0, groundY, width, height - groundY);

    // Add some ground details
    graphics.fillStyle(0x1a1a1a);
    graphics.fillRect(0, groundY, width, 20);
  }

  private static addBuildingWindows(
    graphics: Phaser.GameObjects.Graphics,
    building: Building,
    groundY: number
  ): void {
    const windowSize = 8;
    const spacing = 12;

    for (
      let x = building.x + 4;
      x < building.x + building.width - 4;
      x += spacing
    ) {
      for (
        let y = groundY - building.height + 10;
        y < groundY - 10;
        y += spacing
      ) {
        // Random chance for lit windows
        if (Math.random() > 0.3) {
          const colors = [0x00ff00, 0xff00ff, 0x00ffff, 0xffff00, 0xff0000];
          const color = colors[Math.floor(Math.random() * colors.length)];
          graphics.fillStyle(color);
          graphics.fillRect(x, y, windowSize, windowSize);
        }
      }
    }
  }

  private static addNeonLights(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number
  ): void {
    // Neon signs - extended to cover full width
    const neonSigns: NeonSign[] = [
      { x: 200, y: height - 150, text: "CYBER", color: 0xff00ff },
      { x: 500, y: height - 180, text: "NEON", color: 0x00ffff },
      { x: 800, y: height - 160, text: "CITY", color: 0x00ff00 },
      { x: 1200, y: height - 170, text: "FUTURE", color: 0xffff00 },
      { x: 1600, y: height - 140, text: "TECH", color: 0xff0000 },
      // Extended neon signs
      { x: 2200, y: height - 150, text: "GRID", color: 0xff00ff },
      { x: 2500, y: height - 180, text: "ZONE", color: 0x00ffff },
      { x: 2800, y: height - 160, text: "DATA", color: 0x00ff00 },
      { x: 3200, y: height - 170, text: "LINK", color: 0xffff00 },
      { x: 3600, y: height - 140, text: "CORE", color: 0xff0000 },
    ];

    neonSigns.forEach((sign) => {
      // Neon glow effect
      graphics.fillStyle(sign.color);
      graphics.fillRect(sign.x - 2, sign.y - 2, 40, 12);
      graphics.fillStyle(0xffffff);
      graphics.fillRect(sign.x, sign.y, 36, 8);
    });

    // Street lights
    for (let x = 50; x < width; x += 100) {
      graphics.fillStyle(0x444444);
      graphics.fillRect(x, height - 100, 4, 60);
      graphics.fillStyle(0xffff00);
      graphics.fillRect(x - 2, height - 110, 8, 8);
    }
  }

  private static addAtmosphericEffects(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number
  ): void {
    // Fog/smoke effects
    graphics.fillStyle(0x333333, 0.3);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = height - 50 + Math.random() * 30;
      const size = 20 + Math.random() * 30;
      graphics.fillRect(x, y, size, size * 0.5);
    }

    // Rain effect (subtle)
    graphics.fillStyle(0x00ffff, 0.5);
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      graphics.fillRect(x, y, 1, 3);
    }
  }
}
