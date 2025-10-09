class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'stationary') {
        // Generate robot sprites if not already done
        if (!scene.textures.exists('stationaryRobot')) {
            RobotSpriteGenerator.generateRobotSprites(scene);
        }
        
        // Get the appropriate robot sprite
        const robotSprites = {
            'stationary': 'stationaryRobot',
            'moving': 'movingRobot'
        };
        
        const textureKey = robotSprites[type];
        
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.type = type; // 'stationary' or 'moving'
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.setCollideWorldBounds(false);
        this.body.setGravityY(0); // Remove gravity for enemies
        this.body.setAllowGravity(false); // Explicitly disable gravity
        this.body.setVelocityY(0); // Stop any vertical movement
        
        // For moving enemies, allow movement but prevent falling
        if (type === 'moving') {
            this.setImmovable(false); // Allow movement for patrol enemies
        } else {
            this.setImmovable(true); // Stationary enemies stay put
        }
        
        // Enemy properties
        this.damage = 20;
        this.speed = 50;
        this.health = 50;
        this.maxHealth = 50;
        
        // Set depth to appear above dark overlay
        this.setDepth(20);
        
        // Add robot-specific glow effects (visual only, no physics)
        if (type === 'stationary') {
            // Red glow for stationary robots
            this.glowEffect = scene.add.circle(x, y, 12, 0xff0000, 0.4);
            this.glowEffect.setDepth(21);
            
            // Outer glow ring
            this.outerGlow = scene.add.circle(x, y, 16, 0xff4444, 0.2);
            this.outerGlow.setDepth(22);
        } else {
            // Blue glow for moving robots
            this.glowEffect = scene.add.circle(x, y, 12, 0x0088ff, 0.4);
            this.glowEffect.setDepth(21);
            
            // Outer glow ring
            this.outerGlow = scene.add.circle(x, y, 16, 0x4488ff, 0.2);
            this.outerGlow.setDepth(22);
        }
        
        // Animate glow effects
        scene.tweens.add({
            targets: this.glowEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.2,
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        scene.tweens.add({
            targets: this.outerGlow,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.1,
            duration: 1200,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        // Movement properties for moving enemies
        this.moveDirection = 1; // 1 for right, -1 for left
        this.moveDistance = 100;
        this.startX = x;
        this.patrolRange = 150;
        
        // Collision detection
        this.lastCollisionTime = 0;
        this.collisionCooldown = 1000; // 1 second cooldown
        
        this.setupBehavior();
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
            this.setFlipX(this.moveDirection < 0);
        }
        
        // Check for walls or platforms
        if (this.body.blocked.left || this.body.blocked.right) {
            this.moveDirection *= -1;
            this.setVelocityX(this.speed * this.moveDirection);
            this.setFlipX(this.moveDirection < 0);
        }
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
    static createStationaryEnemy(scene, x, y) {
        return new Enemy(scene, x, y, 'stationary');
    }

    static createMovingEnemy(scene, x, y) {
        return new Enemy(scene, x, y, 'moving');
    }

    static createPatrolEnemy(scene, x, y, patrolRange = 150) {
        const enemy = new Enemy(scene, x, y, 'moving');
        enemy.patrolRange = patrolRange;
        return enemy;
    }
}
