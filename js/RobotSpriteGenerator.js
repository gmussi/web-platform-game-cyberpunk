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
        const size = 24;
        
        // Robot body (dark gray)
        graphics.fillStyle(0x444444);
        graphics.fillRect(8, 8, 8, 12);
        
        // Robot head (square)
        graphics.fillStyle(0x333333);
        graphics.fillRect(9, 4, 6, 6);
        
        // Eyes (red glowing)
        graphics.fillStyle(0xff0000);
        graphics.fillRect(10, 5, 1, 1);
        graphics.fillRect(13, 5, 1, 1);
        
        // Eye glow effect
        graphics.fillStyle(0xff4444, 0.5);
        graphics.fillRect(9, 4, 2, 2);
        graphics.fillRect(13, 4, 2, 2);
        
        // Antenna
        graphics.fillStyle(0x666666);
        graphics.fillRect(11, 2, 2, 3);
        
        // Antenna tip (blinking light)
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(11, 1, 2, 1);
        
        // Arms (extended outward)
        graphics.fillStyle(0x555555);
        graphics.fillRect(4, 10, 4, 2);
        graphics.fillRect(16, 10, 4, 2);
        
        // Hands (claws)
        graphics.fillStyle(0x222222);
        graphics.fillRect(2, 9, 2, 4);
        graphics.fillRect(20, 9, 2, 4);
        
        // Legs
        graphics.fillStyle(0x444444);
        graphics.fillRect(9, 20, 2, 4);
        graphics.fillRect(13, 20, 2, 4);
        
        // Feet
        graphics.fillStyle(0x333333);
        graphics.fillRect(8, 24, 3, 2);
        graphics.fillRect(13, 24, 3, 2);
        
        // Chest panel (circuit pattern)
        graphics.fillStyle(0x00ffff);
        graphics.fillRect(10, 10, 1, 1);
        graphics.fillRect(12, 10, 1, 1);
        graphics.fillRect(11, 12, 1, 1);
        
        graphics.generateTexture('stationaryRobot', size, size);
        graphics.destroy();
        
        return 'stationaryRobot';
    }
    
    static createMovingRobot(scene) {
        const graphics = scene.add.graphics();
        const size = 24;
        
        // Robot body (slightly different color)
        graphics.fillStyle(0x555555);
        graphics.fillRect(8, 8, 8, 12);
        
        // Robot head (more angular)
        graphics.fillStyle(0x444444);
        graphics.fillRect(9, 4, 6, 6);
        
        // Eyes (blue glowing)
        graphics.fillStyle(0x0088ff);
        graphics.fillRect(10, 5, 1, 1);
        graphics.fillRect(13, 5, 1, 1);
        
        // Eye glow effect
        graphics.fillStyle(0x4488ff, 0.5);
        graphics.fillRect(9, 4, 2, 2);
        graphics.fillRect(13, 4, 2, 2);
        
        // Antenna (longer)
        graphics.fillStyle(0x777777);
        graphics.fillRect(11, 1, 2, 4);
        
        // Antenna tip (pulsing light)
        graphics.fillStyle(0xff8800);
        graphics.fillRect(11, 0, 2, 1);
        
        // Arms (more dynamic)
        graphics.fillStyle(0x666666);
        graphics.fillRect(3, 9, 5, 2);
        graphics.fillRect(16, 9, 5, 2);
        
        // Hands (more detailed claws)
        graphics.fillStyle(0x333333);
        graphics.fillRect(1, 8, 2, 6);
        graphics.fillRect(21, 8, 2, 6);
        
        // Legs (jointed)
        graphics.fillStyle(0x555555);
        graphics.fillRect(9, 20, 2, 4);
        graphics.fillRect(13, 20, 2, 4);
        
        // Knee joints
        graphics.fillStyle(0x777777);
        graphics.fillRect(8, 18, 4, 2);
        graphics.fillRect(12, 18, 4, 2);
        
        // Feet (larger)
        graphics.fillStyle(0x444444);
        graphics.fillRect(7, 24, 4, 2);
        graphics.fillRect(13, 24, 4, 2);
        
        // Chest panel (more complex circuit)
        graphics.fillStyle(0xff00ff);
        graphics.fillRect(10, 10, 1, 1);
        graphics.fillRect(12, 10, 1, 1);
        graphics.fillRect(11, 12, 1, 1);
        graphics.fillStyle(0xffff00);
        graphics.fillRect(10, 12, 1, 1);
        graphics.fillRect(12, 12, 1, 1);
        
        // Exhaust vents
        graphics.fillStyle(0x222222);
        graphics.fillRect(7, 14, 1, 2);
        graphics.fillRect(16, 14, 1, 2);
        
        graphics.generateTexture('movingRobot', size, size);
        graphics.destroy();
        
        return 'movingRobot';
    }
}
