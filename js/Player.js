class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, characterKey) {
        // Get the appropriate character name
        const characterNames = {
            'A': 'cyberWarrior',
            'B': 'quantumMage', 
            'C': 'stealthRogue',
            'D': 'plasmaPaladin'
        };
        
        const charName = characterNames[characterKey];
        
        // Start with the breathing-idle animation first frame
        super(scene, x, y, `${charName}_breathing_idle_000`);
        
        this.scene = scene;
        this.characterKey = characterKey;
        this.characterData = characters[characterKey];
        this.charName = charName;
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        this.setDragX(300);
        
        // Set proper physics body size (smaller than sprite for better gameplay)
        this.body.setSize(32, 48); // Width: 32px, Height: 48px (smaller than 64x64 sprite)
        this.body.setOffset(16, 8); // Center horizontally, offset vertically to align with body
        
        // Set depth to appear above dark overlay and other elements
        this.setDepth(30);
        
        // Ensure player is always visible
        this.setVisible(true);
        this.setActive(true);
        
        
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
        this.currentAnimation = 'breathing_idle';
        this.isJumping = false;
        
        // Set initial facing direction (always right)
        this.setFlipX(false);
        
        // Start with breathing-idle animation
        this.play(`${charName}_breathing_idle`);
    }

    update() {
        this.handleMovement();
        this.handleJump();
        this.updateAnimation();
        
        // Ensure player stays visible
        this.setVisible(true);
        this.setActive(true);
        
        
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
        
        // Reset movement state
        this.isMoving = false;
        
        if (this.cursors.left.isDown && canMoveLeft) {
            this.setVelocityX(-this.speed);
            this.isMoving = true;
            this.facingRight = false;
        } else if (this.cursors.right.isDown && canMoveRight) {
            this.setVelocityX(this.speed);
            this.isMoving = true;
            this.facingRight = true;
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
        // Determine current state and play appropriate animation
        if (!this.isGrounded) {
            // Jumping animation - check if direction changed
            const direction = this.facingRight ? 'east' : 'west';
            const animationKey = `${this.charName}_jumping_${direction}`;
            
            if (this.currentAnimation !== 'jumping' || this.anims.currentAnim.key !== animationKey) {
                this.play(animationKey);
                this.currentAnimation = 'jumping';
                this.isJumping = true;
            }
        } else if (this.isMoving) {
            // Walking animation - check if direction changed
            const direction = this.facingRight ? 'east' : 'west';
            const animationKey = `${this.charName}_walk_${direction}`;
            
            if (this.currentAnimation !== 'walking' || this.anims.currentAnim.key !== animationKey) {
                this.play(animationKey);
                this.currentAnimation = 'walking';
                this.isJumping = false;
            }
        } else {
            // Idle breathing animation
            if (this.currentAnimation !== 'breathing_idle') {
                this.play(`${this.charName}_breathing_idle`);
                this.currentAnimation = 'breathing_idle';
                this.isJumping = false;
            }
        }
        
        // Don't flip sprites since we have separate east/west animations
        // The west sprites should already be facing the correct direction
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
