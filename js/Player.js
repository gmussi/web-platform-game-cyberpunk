class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, characterKey) {
        // Generate hero sprites if not already done
        if (!scene.textures.exists('cyberWarrior')) {
            HeroSpriteGenerator.generateHeroSprites(scene);
        }
        
        // Get the appropriate hero sprite
        const heroSprites = {
            'A': 'cyberWarrior',
            'B': 'quantumMage', 
            'C': 'stealthRogue',
            'D': 'plasmaPaladin'
        };
        
        const textureKey = heroSprites[characterKey];
        
        // Ensure texture exists before creating sprite
        if (!scene.textures.exists(textureKey)) {
            console.error(`Texture ${textureKey} not found!`);
            // Create a fallback texture
            const graphics = scene.add.graphics();
            graphics.fillStyle(0xff0000);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture(textureKey, 32, 32);
            graphics.destroy();
        }
        
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.characterKey = characterKey;
        this.characterData = characters[characterKey];
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        this.setDragX(300);
        
        // Set depth to appear above dark overlay and other elements
        this.setDepth(30);
        
        // Ensure player is always visible
        this.setVisible(true);
        this.setActive(true);
        
        // Add a subtle glow effect to make player more visible (visual only, no physics)
        this.playerGlow = scene.add.circle(x, y, 20, 0xffffff, 0.2);
        this.playerGlow.setDepth(31); // Above player
        
        // Animate player glow
        scene.tweens.add({
            targets: this.playerGlow,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.1,
            duration: 2000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        // Input handling
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Player properties
        this.speed = 200;
        this.jumpPower = 400;
        this.isGrounded = false;
        this.health = gameData.maxHealth;
        this.maxHealth = gameData.maxHealth;
        
        // Animation states
        this.isMoving = false;
        this.facingRight = true; // Always face right
        
        // Set initial facing direction (always right)
        this.setFlipX(false);
    }

    update() {
        this.handleMovement();
        this.handleJump();
        this.updateAnimation();
        
        // Ensure player stays visible and glow follows
        this.setVisible(true);
        this.setActive(true);
        
        // Update glow position to follow player
        if (this.playerGlow) {
            this.playerGlow.setPosition(this.x, this.y);
        }
        
        // Ensure player depth is maintained
        this.setDepth(30);
    }

    handleMovement() {
        const wasMoving = this.isMoving;
        
        // Ensure player is visible before movement
        this.setVisible(true);
        this.setActive(true);
        
        // Get screen boundaries (camera view)
        const camera = this.scene.cameras.main;
        const screenLeft = camera.worldView.x;
        const screenRight = camera.worldView.x + camera.worldView.width;
        const playerHalfWidth = this.width / 2;
        
        // Check if player can move left (not at left edge)
        const canMoveLeft = this.x - playerHalfWidth > screenLeft;
        // Check if player can move right (not at right edge)
        const canMoveRight = this.x + playerHalfWidth < screenRight;
        
        if (this.cursors.left.isDown && canMoveLeft) {
            this.setVelocityX(-this.speed);
            this.isMoving = true;
            this.facingRight = false;
            this.setFlipX(true);
        } else if (this.cursors.right.isDown && canMoveRight) {
            this.setVelocityX(this.speed);
            this.isMoving = true;
            this.facingRight = true;
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
            this.isMoving = false;
        }
        
        // Ensure player stays visible after movement
        this.setVisible(true);
        this.setActive(true);
        
        // Check if movement state changed
        if (wasMoving !== this.isMoving) {
            this.scene.events.emit('playerMovementChanged', this.isMoving);
        }
    }

    handleJump() {
        // Check if player is on ground
        this.isGrounded = this.body.touching.down;
        
        if (this.isGrounded && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.setVelocityY(-this.jumpPower);
            this.scene.events.emit('playerJumped');
        }
    }

    updateAnimation() {
        // Simple visual feedback for movement
        if (this.isMoving && this.isGrounded) {
            // Could add walking animation here
            this.setTint(this.characterData.color);
        } else if (!this.isGrounded) {
            // Jumping - slightly different tint
            this.setTint(Phaser.Display.Color.GetColor(
                this.characterData.color >> 16,
                (this.characterData.color >> 8) & 0xFF,
                this.characterData.color & 0xFF
            ));
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Visual feedback for damage
        this.setTint(0xff0000); // Red flash
        this.scene.time.delayedCall(200, () => {
            this.setTint(this.characterData.color);
        });
        
        // Emit damage event
        this.scene.events.emit('playerDamaged', this.health);
        
        // Check for game over
        if (this.health <= 0) {
            this.scene.events.emit('playerDied');
        }
    }

    heal(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        
        // Visual feedback for healing
        this.setTint(0x00ff00); // Green flash
        this.scene.time.delayedCall(200, () => {
            this.setTint(this.characterData.color);
        });
        
        this.scene.events.emit('playerHealed', this.health);
    }

    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }

    getCharacterName() {
        return this.characterData.name;
    }
}
