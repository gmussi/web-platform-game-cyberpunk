class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load portal animation frames
        for (let i = 1; i <= 12; i++) {
            const frameNumber = i.toString().padStart(2, '0');
            this.load.image(`portal_frame_${frameNumber}`, `img/portal/portal_frame_${frameNumber}.png`);
        }
    }

    create() {
        // Set world bounds based on scroll direction
        this.setupWorldBounds();
        
        // Create background layers
        this.createBackground();
        
        // Create platforms
        this.createPlatforms();
        
        // Create player
        this.createPlayer();
        
        // Create enemies
        this.createEnemies();
        
        // Create portal
        this.createPortal();
        
        // Set up collisions
        this.setupCollisions();
        
        // Create UI
        this.createUI();
        
        // Set up camera
        this.setupCamera();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start background music
        this.startBackgroundMusic();
        
        // Ensure platforms and enemies stay in place
        this.time.delayedCall(100, () => {
            this.platforms.forEach(platform => {
                if (platform && platform.body) {
                    platform.body.setAllowGravity(false);
                    platform.body.setVelocityY(0);
                    platform.body.setImmovable(true);
                }
            });
            
            this.enemies.forEach(enemy => {
                if (enemy && enemy.body) {
                    enemy.body.setAllowGravity(false);
                    enemy.body.setVelocityY(0);
                }
            });
        });
    }

    setupWorldBounds() {
        const worldWidth = 4100; // Extended world to match ground coverage with buffer
        const worldHeight = 600;
        
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    }

    createBackground() {
        // Generate cyberpunk background
        const backgroundTexture = CyberpunkBackgroundGenerator.createBackground(this);
        
        // Add the background with parallax effect (moves slower than camera)
        this.backgroundImage = this.add.image(2050, 300, backgroundTexture);
        this.backgroundImage.setScrollFactor(0.3); // Moves at 30% of camera speed
        
        // Add dark overlay layer to make background darker (also with parallax)
        this.darkOverlay = this.add.rectangle(2050, 300, 4100, 600, 0x000000, 0.4);
        this.darkOverlay.setDepth(1); // Above background but below game elements
        this.darkOverlay.setScrollFactor(0.3); // Moves at 30% of camera speed
        
        // Add some additional atmospheric elements with different parallax speeds
        this.addAtmosphericElements();
    }
    
    addAtmosphericElements() {
        // Add floating particles with parallax effect
        for (let i = 0; i < 65; i++) {
            const particle = this.add.circle(
                Math.random() * 4100,
                Math.random() * 600,
                1 + Math.random() * 2,
                0x00ffff,
                0.5
            );
            particle.setDepth(2); // Above dark overlay but below game elements
            particle.setScrollFactor(0.5); // Moves at 50% of camera speed (between background and foreground)
            
            // Animate particles
            this.tweens.add({
                targets: particle,
                y: particle.y + 100,
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
        
    }

    createPlatforms() {
        this.platforms = [];
        
        // Ground platforms - extend to 4100px to ensure full coverage with buffer
        const groundPlatforms = Platform.createGround(this, 0, 560, 4100);
        console.log('Ground platforms created:', groundPlatforms.length);
        console.log('Ground platform positions:', groundPlatforms.map(p => p.x));
        this.platforms.push(...groundPlatforms);
        
        // Floating platforms with better spacing and distribution
        // Pass existing platforms to ensure no collisions
        const floatingPlatforms1 = Platform.createFloatingPlatforms(this, 300, 500, 6, 400, this.platforms);
        this.platforms.push(...floatingPlatforms1);
        
        const floatingPlatforms2 = Platform.createFloatingPlatforms(this, 800, 450, 5, 450, this.platforms);
        this.platforms.push(...floatingPlatforms2);
        
        const floatingPlatforms3 = Platform.createFloatingPlatforms(this, 1400, 400, 6, 400, this.platforms);
        this.platforms.push(...floatingPlatforms3);
        
        const floatingPlatforms4 = Platform.createFloatingPlatforms(this, 2000, 480, 5, 450, this.platforms);
        this.platforms.push(...floatingPlatforms4);
        
        // Create platform sequences with better spacing
        // Pass existing platforms to ensure no collisions
        const sequence1 = Platform.createPlatformSequence(this, 600, 450, 4, 300, 80, this.platforms);
        this.platforms.push(...sequence1);
        
        const sequence2 = Platform.createPlatformSequence(this, 1600, 400, 4, 350, 100, this.platforms);
        this.platforms.push(...sequence2);
        
        const sequence3 = Platform.createPlatformSequence(this, 2400, 420, 3, 400, 90, this.platforms);
        this.platforms.push(...sequence3);
    }

    createPlayer() {
        // Paladin starts near the portal, other characters start at the beginning
        let startX = 100; // Default starting position
        if (gameData.selectedCharacter === 'D') {
            startX = 3800; // Paladin starts close to portal (portal is at x=4000)
        }
        
        this.player = new Player(this, startX, 500, gameData.selectedCharacter);
        
        console.log('Player created at:', startX, 500, 'Character:', gameData.selectedCharacter);
        console.log('Player visible:', this.player.visible);
        console.log('Player active:', this.player.active);
        
        // Add player to physics groups for collision detection
        this.playerGroup = this.physics.add.group([this.player]);
    }

    createEnemies() {
        this.enemies = [];
        
        // Stationary enemies (blocking paths) - position them on ground platforms
        const stationaryEnemies = [
            Enemy.createStationaryEnemy(this, 400, 520), // On ground
            Enemy.createStationaryEnemy(this, 800, 520),  // On ground
            Enemy.createStationaryEnemy(this, 1200, 520), // On ground
            Enemy.createStationaryEnemy(this, 1600, 520)  // On ground
        ];
        
        // Moving enemies (patrolling) - position them on floating platforms
        const movingEnemies = [
            Enemy.createMovingEnemy(this, 300, 480),  // On floating platform
            Enemy.createMovingEnemy(this, 700, 330),   // On floating platform
            Enemy.createMovingEnemy(this, 1100, 280),  // On floating platform
            Enemy.createMovingEnemy(this, 1500, 230)   // On floating platform
        ];
        
        // Patrol enemies with different ranges - position them on platforms
        const patrolEnemies = [
            Enemy.createPatrolEnemy(this, 600, 430),   // On platform
            Enemy.createPatrolEnemy(this, 1000, 380),  // On platform
            Enemy.createPatrolEnemy(this, 1400, 330)   // On platform
        ];
        
        this.enemies.push(...stationaryEnemies, ...movingEnemies, ...patrolEnemies);
        
        // Add enemies to physics group
        this.enemyGroup = this.physics.add.group(this.enemies);
    }

    createPortal() {
        // Create portal at the end of the map (near x=4000)
        const portalX = 4000;
        const portalY = 500; // On the ground level
        
        // Create animated portal sprite
        this.portalSprite = this.add.sprite(portalX, portalY, 'portal_frame_01');
        this.portalSprite.setDepth(25);
        
        // Create portal animation
        this.anims.create({
            key: 'portalAnimation',
            frames: [
                { key: 'portal_frame_01' },
                { key: 'portal_frame_02' },
                { key: 'portal_frame_03' },
                { key: 'portal_frame_04' },
                { key: 'portal_frame_05' },
                { key: 'portal_frame_06' },
                { key: 'portal_frame_07' },
                { key: 'portal_frame_08' },
                { key: 'portal_frame_09' },
                { key: 'portal_frame_10' },
                { key: 'portal_frame_11' },
                { key: 'portal_frame_12' }
            ],
            frameRate: 12, // 12 fps for smooth animation
            repeat: -1 // Loop infinitely
        });
        
        // Start the animation
        this.portalSprite.play('portalAnimation');
        
        console.log('Animated portal sprite created at:', portalX, portalY);
        console.log('Portal sprite:', this.portalSprite);
        
        // Add physics body for collision detection
        this.physics.add.existing(this.portalSprite);
        this.portalSprite.body.setSize(100, 100);
        this.portalSprite.body.setImmovable(true);
        this.portalSprite.body.setAllowGravity(false);
        this.portalSprite.body.setVelocity(0, 0);
        this.portalSprite.body.enable = true;
        
        console.log('Portal physics body:', this.portalSprite.body);
        console.log('Portal body enabled:', this.portalSprite.body.enable);
        console.log('Portal body size:', this.portalSprite.body.width, this.portalSprite.body.height);
        
        // Portal is now just the animated sprite - no additional effects needed
    }

    setupCollisions() {
        // Player vs Platforms
        this.physics.add.collider(this.player, this.platforms);
        
        // Player vs Enemies
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            // Collision handling is done in Enemy class
        });
        
        // Player vs Portal - only the animated portal sprite
        console.log('Setting up portal collision detection...');
        console.log('Player:', this.player);
        console.log('Portal sprite:', this.portalSprite);
        
        this.physics.add.overlap(this.player, this.portalSprite, (player, portal) => {
            console.log('Portal collision detected! Starting victory scene...');
            this.stopBackgroundMusic();
            this.scene.start('VictoryScene');
        });
        
        // Enemies vs Platforms (so they don't fall through)
        this.physics.add.collider(this.enemyGroup, this.platforms);
    }

    createUI() {
        // Character name display
        const characterName = characters[gameData.selectedCharacter].name;
        this.characterNameText = this.add.text(50, 30, characterName, {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);

        // Calculate health bar position after character name
        const characterNameWidth = characterName.length * 12; // Approximate width
        const healthBarStartX = 50 + characterNameWidth + 30; // 30px spacing
        this.healthBarX = healthBarStartX + 100; // Store for updateHealthBar method

        // Health bar background (aligned with character name text)
        this.healthBarBg = this.add.rectangle(this.healthBarX, 40, 200, 20, 0x333333)
            .setScrollFactor(0);
        
        // Health bar (aligned with character name text)
        this.healthBar = this.add.rectangle(this.healthBarX, 40, 200, 20, 0x00ff00)
            .setScrollFactor(0);
        
        // Health text (aligned with character name text)
        this.healthText = this.add.text(this.healthBarX, 40, `${gameData.maxHealth}/${gameData.maxHealth}`, {
            fontSize: '14px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        // Instructions
        this.add.text(500, 30, 'Arrow Keys: Move | Space: Jump', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);
    }

    setupCamera() {
        // Set camera bounds for extended world
        this.cameras.main.setBounds(0, 0, 4100, 600);
        
        // Start camera following player
        this.cameras.main.startFollow(this.player);
        
        // Set camera deadzone for smoother following
        this.cameras.main.setDeadzone(100, 50);
        
        // Set camera zoom
        this.cameras.main.setZoom(1);
    }

    setupEventListeners() {
        // Player events
        this.events.on('playerDamaged', (health) => {
            this.updateHealthBar(health);
        });

        this.events.on('playerDied', () => {
            this.scene.start('GameOverScene');
        });

        this.events.on('enemyDestroyed', (enemy) => {
            // Remove enemy from groups
            this.enemies = this.enemies.filter(e => e !== enemy);
        });
    }

    updateHealthBar(health) {
        if (isNaN(health) || health === undefined) {
            console.error('Invalid health value:', health);
            return;
        }
        
        const percentage = (health / gameData.maxHealth) * 100;
        this.healthBar.setDisplaySize(200 * (percentage / 100), 20);
        
        // Change color based on health
        if (percentage > 60) {
            this.healthBar.setFillStyle(0x00ff00); // Green
        } else if (percentage > 30) {
            this.healthBar.setFillStyle(0xffff00); // Yellow
        } else {
            this.healthBar.setFillStyle(0xff0000); // Red
        }
        
        this.healthText.setText(`${Math.round(health)}/${gameData.maxHealth}`);
    }

    update() {
        // Update player
        if (this.player) {
            this.player.update();
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                enemy.update();
            }
        });
        
        // Ensure platforms and enemies stay in place (continuous check)
        this.platforms.forEach(platform => {
            if (platform && platform.body && platform.body.velocity.y !== 0) {
                platform.body.setVelocityY(0);
                platform.body.setAllowGravity(false);
            }
        });
        
        this.enemies.forEach(enemy => {
            if (enemy && enemy.body && enemy.body.velocity.y !== 0) {
                enemy.body.setVelocityY(0);
                enemy.body.setAllowGravity(false);
            }
        });
        
        // Update health bar
        if (this.player) {
            this.updateHealthBar(this.player.health);
        }
        
        // Manual portal collision check (backup) - only checks animated portal sprite
        if (this.player && this.portalSprite) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.portalSprite.x, this.portalSprite.y
            );
            if (distance < 60) {
                console.log('Manual portal collision detected! Distance:', distance);
                this.stopBackgroundMusic();
                this.scene.start('VictoryScene');
            }
        }
    }
    
    startBackgroundMusic() {
        // Load and play the background music MP3 from local file
        this.load.audio('backgroundMusic', 'background_music.mp3');
        // Load Wilhelm scream sound effect
        this.load.audio('wilhelmScream', 'wilhelmscream.mp3');
        
        this.load.once('complete', () => {
            // Create background music sound
            this.backgroundMusic = this.sound.add('backgroundMusic', {
                volume: 0.3, // Lower volume so it doesn't overpower gameplay
                loop: true,   // Loop the music continuously
                fadeIn: {
                    duration: 2000, // Fade in over 2 seconds
                    from: 0,
                    to: 0.3
                }
            });
            
            // Start playing the music
            this.backgroundMusic.play();
            console.log('Background music started');
            console.log('Wilhelm scream sound loaded');
        });
        
        this.load.start();
    }
    
    playWilhelmScream() {
        // Create and play Wilhelm scream sound effect
        if (!this.wilhelmScream) {
            this.wilhelmScream = this.sound.add('wilhelmScream', {
                volume: 0.7, // Higher volume for impact
                loop: false   // Play once only
            });
        }
        
        if (this.wilhelmScream) {
            this.wilhelmScream.play();
        }
    }
    
    stopBackgroundMusic() {
        // Stop the background music
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic.destroy();
            this.backgroundMusic = null;
        }
        
        console.log('Background music stopped');
    }
    
    shutdown() {
        // Clean up background music when scene is destroyed
        this.stopBackgroundMusic();
        super.shutdown();
    }
}
