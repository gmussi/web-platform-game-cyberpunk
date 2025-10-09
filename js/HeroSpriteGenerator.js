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
        const size = 64;
        
        // Body (red armor)
        graphics.fillStyle(0xff4444);
        graphics.fillRect(16, 24, 32, 40);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(20, 12, 24, 16);
        
        // Helmet visor (dark)
        graphics.fillStyle(0x222222);
        graphics.fillRect(22, 16, 20, 8);
        
        // Shoulder pads (darker red)
        graphics.fillStyle(0xcc2222);
        graphics.fillRect(12, 28, 12, 16);
        graphics.fillRect(40, 28, 12, 16);
        
        // Legs (dark red)
        graphics.fillStyle(0xaa1111);
        graphics.fillRect(20, 64, 12, 24);
        graphics.fillRect(32, 64, 12, 24);
        
        // Energy core (bright blue)
        graphics.fillStyle(0x00aaff);
        graphics.fillRect(28, 36, 8, 8);
        
        // Weapon (energy sword)
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(48, 16, 4, 32);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(50, 12, 2, 4);
        
        graphics.generateTexture('cyberWarrior', size, size);
        graphics.destroy();
        
        return 'cyberWarrior';
    }
    
    static createQuantumMage(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Body (purple robes)
        graphics.fillStyle(0x8844ff);
        graphics.fillRect(16, 24, 32, 40);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(20, 12, 24, 16);
        
        // Hood (darker purple)
        graphics.fillStyle(0x6622cc);
        graphics.fillRect(18, 8, 28, 12);
        
        // Eyes (glowing)
        graphics.fillStyle(0xffff00);
        graphics.fillRect(24, 16, 4, 4);
        graphics.fillRect(36, 16, 4, 4);
        
        // Arms (purple sleeves)
        graphics.fillStyle(0xaa66ff);
        graphics.fillRect(8, 28, 12, 24);
        graphics.fillRect(44, 28, 12, 24);
        
        // Legs (dark purple)
        graphics.fillStyle(0x4422aa);
        graphics.fillRect(20, 64, 12, 24);
        graphics.fillRect(32, 64, 12, 24);
        
        // Staff (quantum staff)
        graphics.fillStyle(0xcccccc);
        graphics.fillRect(4, 16, 4, 40);
        graphics.fillStyle(0xff00ff);
        graphics.fillRect(2, 12, 8, 8);
        
        // Orbiting particles
        graphics.fillStyle(0x00ffff);
        graphics.fillRect(52, 20, 4, 4);
        graphics.fillRect(56, 28, 4, 4);
        graphics.fillRect(52, 36, 4, 4);
        
        graphics.generateTexture('quantumMage', size, size);
        graphics.destroy();
        
        return 'quantumMage';
    }
    
    static createStealthRogue(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Body (dark blue stealth suit)
        graphics.fillStyle(0x2244aa);
        graphics.fillRect(16, 24, 32, 40);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(20, 12, 24, 16);
        
        // Mask (dark)
        graphics.fillStyle(0x112233);
        graphics.fillRect(20, 14, 24, 12);
        
        // Eyes (red)
        graphics.fillStyle(0xff0000);
        graphics.fillRect(24, 16, 4, 4);
        graphics.fillRect(36, 16, 4, 4);
        
        // Shoulder guards (silver)
        graphics.fillStyle(0xcccccc);
        graphics.fillRect(12, 28, 8, 16);
        graphics.fillRect(44, 28, 8, 16);
        
        // Legs (dark blue)
        graphics.fillStyle(0x112288);
        graphics.fillRect(20, 64, 12, 24);
        graphics.fillRect(32, 64, 12, 24);
        
        // Daggers (silver)
        graphics.fillStyle(0xaaaaaa);
        graphics.fillRect(4, 20, 2, 16);
        graphics.fillRect(58, 20, 2, 16);
        
        // Stealth field effect (semi-transparent)
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(48, 16, 4, 4);
        graphics.fillRect(52, 24, 4, 4);
        graphics.fillRect(48, 32, 4, 4);
        
        graphics.generateTexture('stealthRogue', size, size);
        graphics.destroy();
        
        return 'stealthRogue';
    }
    
    static createPlasmaPaladin(scene) {
        const graphics = scene.add.graphics();
        const size = 64;
        
        // Body (golden armor)
        graphics.fillStyle(0xffaa00);
        graphics.fillRect(16, 24, 32, 40);
        
        // Head (skin tone)
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(20, 12, 24, 16);
        
        // Helmet (golden)
        graphics.fillStyle(0xffcc44);
        graphics.fillRect(18, 8, 28, 16);
        
        // Visor (blue)
        graphics.fillStyle(0x0066ff);
        graphics.fillRect(22, 14, 20, 6);
        
        // Shoulder plates (golden)
        graphics.fillStyle(0xffdd66);
        graphics.fillRect(12, 28, 12, 16);
        graphics.fillRect(40, 28, 12, 16);
        
        // Legs (golden)
        graphics.fillStyle(0xcc8800);
        graphics.fillRect(20, 64, 12, 24);
        graphics.fillRect(32, 64, 12, 24);
        
        // Shield (energy shield)
        graphics.fillStyle(0x00ffff);
        graphics.fillRect(4, 24, 12, 24);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(6, 26, 8, 20);
        
        // Plasma sword
        graphics.fillStyle(0xff00ff);
        graphics.fillRect(48, 16, 4, 32);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(50, 12, 2, 4);
        
        // Energy aura
        graphics.fillStyle(0xffff00);
        graphics.fillRect(52, 20, 4, 4);
        graphics.fillRect(56, 28, 4, 4);
        graphics.fillRect(52, 36, 4, 4);
        
        graphics.generateTexture('plasmaPaladin', size, size);
        graphics.destroy();
        
        return 'plasmaPaladin';
    }
}
