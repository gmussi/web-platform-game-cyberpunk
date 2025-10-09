// Robot Enemy Sprite Generator
// Creates futuristic robot sprites for enemies

class RobotSpriteGenerator {
    static generateRobotSprites(scene) {
        const robots = {};
        
        // Stationary Robot
        robots.stationary = this.createStationaryRobot(scene);
        
        // Moving Robot
        robots.moving = this.createMovingRobot(scene);
        
        return robots;
    }
    
    static createStationaryRobot(scene) {
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
        
        // Eye glow effect
        graphics.fillStyle(0xff4444, 0.5);
        graphics.fillRect(18, 8, 4, 4);
        graphics.fillRect(26, 8, 4, 4);
        
        // Antenna
        graphics.fillStyle(0x666666);
        graphics.fillRect(22, 4, 4, 6);
        
        // Antenna tip (blinking light)
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(22, 2, 4, 2);
        
        // Arms (extended outward)
        graphics.fillStyle(0x555555);
        graphics.fillRect(8, 20, 8, 4);
        graphics.fillRect(32, 20, 8, 4);
        
        // Hands (claws)
        graphics.fillStyle(0x222222);
        graphics.fillRect(4, 18, 4, 8);
        graphics.fillRect(40, 18, 4, 8);
        
        // Legs
        graphics.fillStyle(0x444444);
        graphics.fillRect(18, 40, 4, 8);
        graphics.fillRect(26, 40, 4, 8);
        
        // Feet
        graphics.fillStyle(0x333333);
        graphics.fillRect(16, 48, 6, 4);
        graphics.fillRect(26, 48, 6, 4);
        
        // Chest panel (circuit pattern)
        graphics.fillStyle(0x00ffff);
        graphics.fillRect(20, 20, 2, 2);
        graphics.fillRect(24, 20, 2, 2);
        graphics.fillRect(22, 24, 2, 2);
        
        graphics.generateTexture('stationaryRobot', size, size);
        graphics.destroy();
        
        return 'stationaryRobot';
    }
    
    static createMovingRobot(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Robot body (slightly different color)
        graphics.fillStyle(0x555555);
        graphics.fillRect(16, 16, 16, 24);
        
        // Robot head (more angular)
        graphics.fillStyle(0x444444);
        graphics.fillRect(18, 8, 12, 12);
        
        // Eyes (blue glowing)
        graphics.fillStyle(0x0088ff);
        graphics.fillRect(20, 10, 2, 2);
        graphics.fillRect(26, 10, 2, 2);
        
        // Eye glow effect
        graphics.fillStyle(0x4488ff, 0.5);
        graphics.fillRect(18, 8, 4, 4);
        graphics.fillRect(26, 8, 4, 4);
        
        // Antenna (longer)
        graphics.fillStyle(0x777777);
        graphics.fillRect(22, 2, 4, 8);
        
        // Antenna tip (pulsing light)
        graphics.fillStyle(0xff8800);
        graphics.fillRect(22, 0, 4, 2);
        
        // Arms (more dynamic)
        graphics.fillStyle(0x666666);
        graphics.fillRect(6, 18, 10, 4);
        graphics.fillRect(32, 18, 10, 4);
        
        // Hands (more detailed claws)
        graphics.fillStyle(0x333333);
        graphics.fillRect(2, 16, 4, 12);
        graphics.fillRect(42, 16, 4, 12);
        
        // Legs (jointed)
        graphics.fillStyle(0x555555);
        graphics.fillRect(18, 40, 4, 8);
        graphics.fillRect(26, 40, 4, 8);
        
        // Knee joints
        graphics.fillStyle(0x777777);
        graphics.fillRect(16, 36, 8, 4);
        graphics.fillRect(24, 36, 8, 4);
        
        // Feet (larger)
        graphics.fillStyle(0x444444);
        graphics.fillRect(14, 48, 8, 4);
        graphics.fillRect(26, 48, 8, 4);
        
        // Chest panel (more complex circuit)
        graphics.fillStyle(0xff00ff);
        graphics.fillRect(20, 20, 2, 2);
        graphics.fillRect(24, 20, 2, 2);
        graphics.fillRect(22, 24, 2, 2);
        graphics.fillStyle(0xffff00);
        graphics.fillRect(20, 24, 2, 2);
        graphics.fillRect(24, 24, 2, 2);
        
        // Exhaust vents
        graphics.fillStyle(0x222222);
        graphics.fillRect(14, 28, 2, 4);
        graphics.fillRect(32, 28, 2, 4);
        
        graphics.generateTexture('movingRobot', size, size);
        graphics.destroy();
        
        return 'movingRobot';
    }
}
