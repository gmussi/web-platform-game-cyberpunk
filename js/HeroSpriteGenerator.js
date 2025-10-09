// Futuristic Pixelated Hero Sprites Generator
// This creates 4 unique hero sprites using Phaser's graphics system

class HeroSpriteGenerator {
    static generateHeroSprites(scene) {
        const heroes = {};
        
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
    
    static createCyberWarrior(scene) {
        const graphics = scene.add.graphics();
        const size = 32;
        
        // Body (red armor)
        graphics.fillStyle(0xff4444);
        graphics.fillRect(8, 12, 16, 20);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(10, 6, 12, 8);
        
        // Helmet visor (dark)
        graphics.fillStyle(0x222222);
        graphics.fillRect(11, 8, 10, 4);
        
        // Shoulder pads (darker red)
        graphics.fillStyle(0xcc2222);
        graphics.fillRect(6, 14, 6, 8);
        graphics.fillRect(20, 14, 6, 8);
        
        // Legs (dark red)
        graphics.fillStyle(0xaa1111);
        graphics.fillRect(10, 32, 6, 12);
        graphics.fillRect(16, 32, 6, 12);
        
        // Energy core (bright blue)
        graphics.fillStyle(0x00aaff);
        graphics.fillRect(14, 18, 4, 4);
        
        // Weapon (energy sword)
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(24, 8, 2, 16);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(25, 6, 1, 2);
        
        graphics.generateTexture('cyberWarrior', size, size);
        graphics.destroy();
        
        return 'cyberWarrior';
    }
    
    static createQuantumMage(scene) {
        const graphics = scene.add.graphics();
        const size = 32;
        
        // Body (purple robes)
        graphics.fillStyle(0x8844ff);
        graphics.fillRect(8, 12, 16, 20);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(10, 6, 12, 8);
        
        // Hood (darker purple)
        graphics.fillStyle(0x6622cc);
        graphics.fillRect(9, 4, 14, 6);
        
        // Eyes (glowing)
        graphics.fillStyle(0xffff00);
        graphics.fillRect(12, 8, 2, 2);
        graphics.fillRect(18, 8, 2, 2);
        
        // Arms (purple sleeves)
        graphics.fillStyle(0xaa66ff);
        graphics.fillRect(4, 14, 6, 12);
        graphics.fillRect(22, 14, 6, 12);
        
        // Legs (dark purple)
        graphics.fillStyle(0x4422aa);
        graphics.fillRect(10, 32, 6, 12);
        graphics.fillRect(16, 32, 6, 12);
        
        // Staff (quantum staff)
        graphics.fillStyle(0xcccccc);
        graphics.fillRect(2, 8, 2, 20);
        graphics.fillStyle(0xff00ff);
        graphics.fillRect(1, 6, 4, 4);
        
        // Orbiting particles
        graphics.fillStyle(0x00ffff);
        graphics.fillRect(26, 10, 2, 2);
        graphics.fillRect(28, 14, 2, 2);
        graphics.fillRect(26, 18, 2, 2);
        
        graphics.generateTexture('quantumMage', size, size);
        graphics.destroy();
        
        return 'quantumMage';
    }
    
    static createStealthRogue(scene) {
        const graphics = scene.add.graphics();
        const size = 32;
        
        // Body (dark blue stealth suit)
        graphics.fillStyle(0x2244aa);
        graphics.fillRect(8, 12, 16, 20);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(10, 6, 12, 8);
        
        // Mask (dark)
        graphics.fillStyle(0x112233);
        graphics.fillRect(10, 7, 12, 6);
        
        // Eyes (red)
        graphics.fillStyle(0xff0000);
        graphics.fillRect(12, 8, 2, 2);
        graphics.fillRect(18, 8, 2, 2);
        
        // Shoulder guards (silver)
        graphics.fillStyle(0xcccccc);
        graphics.fillRect(6, 14, 4, 8);
        graphics.fillRect(22, 14, 4, 8);
        
        // Legs (dark blue)
        graphics.fillStyle(0x112288);
        graphics.fillRect(10, 32, 6, 12);
        graphics.fillRect(16, 32, 6, 12);
        
        // Daggers (silver)
        graphics.fillStyle(0xaaaaaa);
        graphics.fillRect(2, 10, 1, 8);
        graphics.fillRect(29, 10, 1, 8);
        
        // Stealth field effect (semi-transparent)
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(24, 8, 2, 2);
        graphics.fillRect(26, 12, 2, 2);
        graphics.fillRect(24, 16, 2, 2);
        
        graphics.generateTexture('stealthRogue', size, size);
        graphics.destroy();
        
        return 'stealthRogue';
    }
    
    static createPlasmaPaladin(scene) {
        const graphics = scene.add.graphics();
        const size = 32;
        
        // Body (golden armor)
        graphics.fillStyle(0xffaa00);
        graphics.fillRect(8, 12, 16, 20);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(10, 6, 12, 8);
        
        // Helmet (golden)
        graphics.fillStyle(0xffcc44);
        graphics.fillRect(9, 4, 14, 8);
        
        // Visor (blue)
        graphics.fillStyle(0x0066ff);
        graphics.fillRect(11, 7, 10, 3);
        
        // Shoulder plates (golden)
        graphics.fillStyle(0xffdd66);
        graphics.fillRect(6, 14, 6, 8);
        graphics.fillRect(20, 14, 6, 8);
        
        // Legs (golden)
        graphics.fillStyle(0xcc8800);
        graphics.fillRect(10, 32, 6, 12);
        graphics.fillRect(16, 32, 6, 12);
        
        // Shield (energy shield)
        graphics.fillStyle(0x00ffff);
        graphics.fillRect(2, 12, 6, 12);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(3, 13, 4, 10);
        
        // Plasma sword
        graphics.fillStyle(0xff00ff);
        graphics.fillRect(24, 8, 2, 16);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(25, 6, 1, 2);
        
        // Energy aura
        graphics.fillStyle(0xffff00);
        graphics.fillRect(26, 10, 2, 2);
        graphics.fillRect(28, 14, 2, 2);
        graphics.fillRect(26, 18, 2, 2);
        
        graphics.generateTexture('plasmaPaladin', size, size);
        graphics.destroy();
        
        return 'plasmaPaladin';
    }
}
