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
        this.setCollideWorldBounds(false); // Disable world bounds collision to prevent interference
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
        
        // Jump animation phases
        this.jumpPhase = 'none'; // 'none', 'start', 'ascending', 'falling', 'landing'
        this.jumpStartTime = 0;
        this.jumpFrameIndex = 0;
        
        // Set initial facing direction (always right)
        this.setFlipX(false);
        
        // Start with breathing-idle animation
        this.play(`${charName}_breathing_idle`);
        
        console.log(`👤 Player created! Character: ${charName}, Ready for input`);
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
            // Only set isMoving to true if not jumping
            if (this.jumpPhase === 'none') {
                this.isMoving = true;
            }
            this.facingRight = false;
        } else if (this.cursors.right.isDown && canMoveRight) {
            this.setVelocityX(this.speed);
            // Only set isMoving to true if not jumping
            if (this.jumpPhase === 'none') {
                this.isMoving = true;
            }
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
        // Only update grounded state if not in a jump sequence
        if (this.jumpPhase === 'none') {
            this.isGrounded = this.body.touching.down;
        } else {
            // During jump, keep grounded false until landing is complete
            this.isGrounded = false;
        }
        
        if (this.isGrounded && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            console.log(`🚀 Player jumped! Character: ${this.charName}`);
            this.setVelocityY(-this.jumpPower);
            this.scene.events.emit('playerJumped');
            
            // Start jump animation sequence
            this.jumpPhase = 'start';
            this.jumpStartTime = this.scene.time.now;
            this.jumpFrameIndex = 0;
            this.isJumping = true;
            this.isGrounded = false; // Ensure we're not grounded during jump
        }
        
        // Update jump phase based on velocity and physics
        if (this.jumpPhase !== 'none') {
            if (this.jumpPhase === 'start') {
                // Check if we've finished the start animation (frames 000-003)
                const timeSinceStart = this.scene.time.now - this.jumpStartTime;
                if (timeSinceStart > 200) { // 200ms for start animation
                    this.jumpPhase = 'ascending';
                }
            } else if (this.jumpPhase === 'ascending' && this.body.velocity.y >= 0) {
                // Switch to falling when velocity becomes positive
                this.jumpPhase = 'falling';
            } else if (this.jumpPhase === 'falling' && this.body.touching.down) {
                // Player landed, start landing animation
                this.jumpPhase = 'landing';
                this.jumpStartTime = this.scene.time.now;
                this.jumpFrameIndex = 0;
            }
        }
    }

    updateAnimation() {
        const direction = this.facingRight ? 'east' : 'west';
        
        // Handle jump animation phases
        if (this.jumpPhase !== 'none') {
            this.handleJumpAnimation(direction);
            return;
        }
        
        // Handle ground animations
        if (this.isMoving) {
            // Walking animation
            const animationKey = `${this.charName}_walk_${direction}`;
            if (this.currentAnimation !== 'walking' || this.anims.currentAnim.key !== animationKey) {
                this.play(animationKey);
                this.currentAnimation = 'walking';
            }
        } else {
            // Idle breathing animation
            if (this.currentAnimation !== 'breathing_idle') {
                this.play(`${this.charName}_breathing_idle`);
                this.currentAnimation = 'breathing_idle';
            }
        }
    }
    
    handleJumpAnimation(direction) {
        const timeSinceStart = this.scene.time.now - this.jumpStartTime;
        
        switch (this.jumpPhase) {
            case 'start':
                // Play frames 000-003 in sequence
                const startFrame = Math.min(3, Math.floor(timeSinceStart / 50)); // 50ms per frame
                const startFrameKey = `${this.charName}_jumping_${direction}_${startFrame.toString().padStart(3, '0')}`;
                if (this.currentAnimation !== 'jumping_start' || this.texture.key !== startFrameKey) {
                    this.setTexture(startFrameKey);
                    this.currentAnimation = 'jumping_start';
                }
                break;
                
            case 'ascending':
                // Show frame 004
                const ascendingFrameKey = `${this.charName}_jumping_${direction}_004`;
                if (this.currentAnimation !== 'jumping_ascending' || this.texture.key !== ascendingFrameKey) {
                    this.setTexture(ascendingFrameKey);
                    this.currentAnimation = 'jumping_ascending';
                }
                break;
                
            case 'falling':
                // Show frame 005
                const fallingFrameKey = `${this.charName}_jumping_${direction}_005`;
                if (this.currentAnimation !== 'jumping_falling' || this.texture.key !== fallingFrameKey) {
                    this.setTexture(fallingFrameKey);
                    this.currentAnimation = 'jumping_falling';
                }
                break;
                
            case 'landing':
                // Play frames 006-008 in sequence
                const landingFrame = Math.min(2, Math.floor(timeSinceStart / 50)); // 50ms per frame
                const landingFrameKey = `${this.charName}_jumping_${direction}_${(landingFrame + 6).toString().padStart(3, '0')}`;
                if (this.currentAnimation !== 'jumping_landing' || this.texture.key !== landingFrameKey) {
                    this.setTexture(landingFrameKey);
                    this.currentAnimation = 'jumping_landing';
                }
                
                // Finish landing animation after 150ms
                if (timeSinceStart > 150) {
                    this.jumpPhase = 'none';
                    this.isJumping = false;
                }
                break;
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
