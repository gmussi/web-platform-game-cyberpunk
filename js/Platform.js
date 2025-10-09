class Platform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, width = 200, height = 20) {
        // Create a texture key based on size (reuse textures for same sizes)
        const textureKey = `platformTexture_${width}_${height}`;
        
        // Only create texture if it doesn't exist
        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.add.graphics();
            graphics.fillStyle(0xffffff);
            graphics.fillRect(0, 0, width, height);
            graphics.generateTexture(textureKey, width, height);
            graphics.destroy();
        }
        
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.width = width;
        this.height = height;
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.setImmovable(true);
        this.body.setGravityY(0); // Remove gravity for platforms
        this.body.setAllowGravity(false); // Explicitly disable gravity
        this.body.setVelocityY(0); // Stop any vertical movement
        
        // Visual representation - bright white platform with neon border
        this.setTint(0xffffff); // Bright white base
        
        // Set depth to appear above dark overlay
        this.setDepth(10);
        
        // Add bright neon border effect (visual only, no physics)
        this.neonEdge = scene.add.rectangle(x, y, width, height, 0x00ffff, 0.8);
        this.neonEdge.setDisplaySize(width, height);
        this.neonEdge.setDepth(11); // Above platform
        
        // Add inner border for extra visibility (visual only, no physics)
        this.innerBorder = scene.add.rectangle(x, y, width - 4, height - 4, 0xff00ff, 0.6);
        this.innerBorder.setDisplaySize(width - 4, height - 4);
        this.innerBorder.setDepth(12); // Above neon edge
        
        // Animate neon edges
        scene.tweens.add({
            targets: this.neonEdge,
            alpha: 0.3,
            duration: 1500,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        scene.tweens.add({
            targets: this.innerBorder,
            alpha: 0.2,
            duration: 2000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        // Platform properties
        this.isSolid = true;
    }

    // Static method to create platforms of different sizes
    static createSmall(scene, x, y) {
        return new Platform(scene, x, y, 100, 20);
    }

    static createMedium(scene, x, y) {
        return new Platform(scene, x, y, 200, 20);
    }

    static createLarge(scene, x, y) {
        return new Platform(scene, x, y, 300, 20);
    }

    static createWide(scene, x, y) {
        return new Platform(scene, x, y, 400, 20);
    }

    // Method to create a series of platforms for level generation
    static createPlatformSequence(scene, startX, startY, count, spacing = 150, heightVariation = 50) {
        const platforms = [];
        
        for (let i = 0; i < count; i++) {
            const x = startX + (i * spacing);
            // Ensure platforms are never above Y=100 to avoid UI overlap
            const y = Math.max(100, startY + (Math.sin(i * 0.5) * heightVariation));
            
            // Vary platform sizes
            let platform;
            const sizeRoll = Math.random();
            if (sizeRoll < 0.3) {
                platform = Platform.createSmall(scene, x, y);
            } else if (sizeRoll < 0.7) {
                platform = Platform.createMedium(scene, x, y);
            } else {
                platform = Platform.createLarge(scene, x, y);
            }
            
            platforms.push(platform);
        }
        
        return platforms;
    }

    // Method to create ground platforms
    static createGround(scene, startX, y, width, count = 1) {
        const platforms = [];
        const platformWidth = 200;
        
        // Calculate how many platforms we need to cover the full width
        // Ensure we have enough platforms to cover the entire width
        const platformsNeeded = Math.ceil(width / platformWidth);
        console.log(`Creating ground platforms: startX=${startX}, width=${width}, platformsNeeded=${platformsNeeded}`);
        
        for (let i = 0; i < platformsNeeded; i++) {
            const x = startX + (i * platformWidth);
            // Make sure the last platform extends to cover the full width
            const currentPlatformWidth = (i === platformsNeeded - 1) ? 
                Math.max(platformWidth, width - x) : platformWidth;
            
            const platform = new Platform(scene, x, y, currentPlatformWidth, 40);
            platform.setTint(0xcccccc); // Light gray for ground platforms
            platforms.push(platform);
            console.log(`Ground platform ${i}: x=${x}, y=${y}, width=${currentPlatformWidth}`);
        }
        
        return platforms;
    }

    // Method to create floating platforms at different heights
    static createFloatingPlatforms(scene, startX, baseY, count, spacing = 200) {
        const platforms = [];
        
        for (let i = 0; i < count; i++) {
            const x = startX + (i * spacing);
            // Ensure platforms are never above Y=100 to avoid UI overlap
            const y = Math.max(100, baseY - (Math.random() * 200 + 100));
            
            const platform = Platform.createMedium(scene, x, y);
            platforms.push(platform);
        }
        
        return platforms;
    }
}
