class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'stationary', enemyType = 'enemy1') {
        // Use actual enemy sprites instead of procedural generation
        const enemySprites = {
            'enemy1': 'enemy1_south',
            'enemy2': 'enemy2_south'
        };
        
        const textureKey = enemySprites[enemyType];
        
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.type = type; // 'stationary' or 'moving'
        this.enemyType = enemyType; // 'enemy1' or 'enemy2'
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.setCollideWorldBounds(false);
        // Enemies now affected by gravity like the player
        
        // Set proper physics body size (smaller than sprite for better gameplay)
        this.body.setSize(32, 48); // Width: 32px, Height: 48px (smaller than 64x64 sprite)
        this.body.setOffset(16, 8); // Center horizontally, offset vertically to align with body
        
        // All enemies need to be movable to collide with platforms properly
        this.setImmovable(false); // Allow collision with platforms
        
        // Enemy properties
        this.damage = 20;
        this.speed = 50;
        this.health = 50;
        this.maxHealth = 50;
        
        // Set depth to appear above dark overlay
        this.setDepth(20);
        
        // Movement properties for moving enemies
        this.moveDirection = 1; // 1 for right, -1 for left
        this.moveDistance = 100;
        this.startX = x;
        this.patrolRange = 150;
        
        // Collision detection
        this.lastCollisionTime = 0;
        this.collisionCooldown = 1000; // 1 second cooldown
        
        // Set initial facing direction (south for stationary enemies)
        this.facingDirection = 'south';
        this.updateSprite();
        
        this.setupBehavior();
    }

    updateSprite() {
        // Update sprite based on facing direction
        const spriteKey = `${this.enemyType}_${this.facingDirection}`;
        if (this.scene.textures.exists(spriteKey)) {
            this.setTexture(spriteKey);
        }
    }

    setupBehavior() {
        if (this.type === 'moving') {
            this.setVelocityX(this.speed * this.moveDirection);
        } else {
            this.setVelocityX(0);
        }
    }

    update() {
        if (this.type === 'moving') {
            this.handlePatrol();
        }
        
        this.checkPlayerCollision();
    }

    handlePatrol() {
        // Check if enemy has moved too far from start position
        const distanceFromStart = Math.abs(this.x - this.startX);
        
        if (distanceFromStart >= this.patrolRange) {
            this.moveDirection *= -1;
            this.setVelocityX(this.speed * this.moveDirection);
            this.updateFacingDirection();
        }
        
        // Check for walls or platforms
        if (this.body.blocked.left || this.body.blocked.right) {
            this.moveDirection *= -1;
            this.setVelocityX(this.speed * this.moveDirection);
            this.updateFacingDirection();
        }
    }
    
    updateFacingDirection() {
        // Update facing direction based on movement
        if (this.moveDirection > 0) {
            this.facingDirection = 'east';
        } else {
            this.facingDirection = 'west';
        }
        this.updateSprite();
    }

    checkPlayerCollision() {
        const player = this.scene.player;
        if (!player) return;
        
        // Check if enough time has passed since last collision
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
            return;
        }
        
        // Check collision with player
        if (this.scene.physics.overlap(this, player)) {
            this.lastCollisionTime = currentTime;
            player.takeDamage(this.damage);
            
            // Play Wilhelm scream sound effect
            this.scene.playWilhelmScream();
            
            // Visual feedback
            this.setTint(0xffaa00); // Orange flash
            this.scene.time.delayedCall(200, () => {
                this.setTint(0xff0000);
            });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
            this.scene.events.emit('enemyDestroyed', this);
        }
    }

    // Static method to create different types of enemies
    static createStationaryEnemy(scene, x, y, enemyType = 'enemy1') {
        return new Enemy(scene, x, y, 'stationary', enemyType);
    }

    static createMovingEnemy(scene, x, y, enemyType = 'enemy1') {
        return new Enemy(scene, x, y, 'moving', enemyType);
    }

    static createPatrolEnemy(scene, x, y, patrolRange = 150, enemyType = 'enemy1') {
        const enemy = new Enemy(scene, x, y, 'moving', enemyType);
        enemy.patrolRange = patrolRange;
        return enemy;
    }
}
