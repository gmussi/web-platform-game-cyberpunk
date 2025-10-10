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

    // Helper method to check if a platform would collide with existing platforms
    static checkPlatformCollision(x, y, width, height, existingPlatforms, minDistance = 15) {
        for (const platform of existingPlatforms) {
            // Calculate distance between platform centers
            const distanceX = Math.abs(x - platform.x);
            const distanceY = Math.abs(y - platform.y);
            
            // Calculate minimum required distance (half width of each platform + minDistance)
            const minDistanceX = (width / 2) + (platform.width / 2) + minDistance;
            const minDistanceY = (height / 2) + (platform.height / 2) + minDistance;
            
            // Check if platforms are too close
            if (distanceX < minDistanceX && distanceY < minDistanceY) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }

    // Method to create a series of platforms for level generation
    static createPlatformSequence(scene, startX, startY, count, spacing = 150, heightVariation = 50, existingPlatforms = [], portalCollisionCheck = null) {
        const platforms = [];
        
        for (let i = 0; i < count; i++) {
            let x = startX + (i * spacing);
            // Ensure platforms are never above Y=100 to avoid UI overlap
            let y = Math.max(100, startY + (Math.sin(i * 0.5) * heightVariation));
            
            // Vary platform sizes
            let platformWidth, platformHeight;
            const sizeRoll = Math.random();
            if (sizeRoll < 0.3) {
                platformWidth = 100;
                platformHeight = 20;
            } else if (sizeRoll < 0.7) {
                platformWidth = 200;
                platformHeight = 20;
            } else {
                platformWidth = 300;
                platformHeight = 20;
            }
            
            // Check for collisions and adjust position if needed
            let attempts = 0;
            const maxAttempts = 20;
            while ((Platform.checkPlatformCollision(x, y, platformWidth, platformHeight, [...existingPlatforms, ...platforms]) || 
                   (portalCollisionCheck && portalCollisionCheck(x, y, platformWidth, platformHeight))) && attempts < maxAttempts) {
                // Try adjusting X position first
                x += spacing * 0.3;
                attempts++;
                
                // If X adjustment doesn't work, try Y adjustment
                if (attempts > 5) {
                    y += heightVariation * 0.5;
                }
                
                // If still colliding, try a completely new position
                if (attempts > 10) {
                    x = startX + (i * spacing) + (Math.random() - 0.5) * spacing;
                    y = Math.max(100, startY + (Math.sin(i * 0.5) * heightVariation) + (Math.random() - 0.5) * heightVariation);
                }
            }
            
            // Create platform with determined size
            let platform;
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
        
        for (let i = 0; i < platformsNeeded; i++) {
            const x = startX + (i * platformWidth);
            // Make sure the last platform extends to cover the full width
            const currentPlatformWidth = (i === platformsNeeded - 1) ? 
                Math.max(platformWidth, width - x) : platformWidth;
            
            const platform = new Platform(scene, x, y, currentPlatformWidth, 40);
            platform.setTint(0xcccccc); // Light gray for ground platforms
            platforms.push(platform);
        }
        
        return platforms;
    }

    // Method to create floating platforms at different heights
    static createFloatingPlatforms(scene, startX, baseY, count, spacing = 200, existingPlatforms = [], portalCollisionCheck = null) {
        const platforms = [];
        
        for (let i = 0; i < count; i++) {
            let x = startX + (i * spacing);
            // Ensure platforms are never above Y=100 to avoid UI overlap
            let y = Math.max(100, baseY - (Math.random() * 200 + 100));
            
            // Platform dimensions for collision checking
            const platformWidth = 200;
            const platformHeight = 20;
            
            // Check for collisions and adjust position if needed
            let attempts = 0;
            const maxAttempts = 20;
            while ((Platform.checkPlatformCollision(x, y, platformWidth, platformHeight, [...existingPlatforms, ...platforms]) || 
                   (portalCollisionCheck && portalCollisionCheck(x, y, platformWidth, platformHeight))) && attempts < maxAttempts) {
                // Try adjusting X position first
                x += spacing * 0.3;
                attempts++;
                
                // If X adjustment doesn't work, try Y adjustment
                if (attempts > 5) {
                    y += 50; // Move down a bit
                }
                
                // If still colliding, try a completely new position
                if (attempts > 10) {
                    x = startX + (i * spacing) + (Math.random() - 0.5) * spacing;
                    y = Math.max(100, baseY - (Math.random() * 200 + 100));
                }
            }
            
            const platform = Platform.createMedium(scene, x, y);
            platforms.push(platform);
        }
        
        return platforms;
    }
}
