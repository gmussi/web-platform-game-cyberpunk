class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load portal animation frames
        for (let i = 1; i <= 12; i++) {
            const frameNumber = i.toString().padStart(2, '0');
            this.load.image(`portal_frame_${frameNumber}`, `img/portal/portal_clean_frame_${frameNumber}.png`);
        }
        
        // Load background images (optimized smaller files ~800KB each, 1728x576px)
        this.load.image('background1', 'img/background1.png');
        this.load.image('background2', 'img/background2.png');
        this.load.image('background3', 'img/background3.png');
        
        // Add timeout for loading
        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
        });
        
        this.load.on('progress', (progress) => {
            console.log('Loading progress:', Math.round(progress * 100) + '%');
        });
        
        // Load character sprites and animations
        this.loadCharacterSprites();
        
        // Load enemy sprites
        this.loadEnemySprites();
    }
    
    loadCharacterSprites() {
        const characters = ['char1', 'char2', 'char3', 'char4'];
        const characterNames = ['cyberWarrior', 'quantumMage', 'stealthRogue', 'plasmaPaladin'];
        
        characters.forEach((char, index) => {
            const charName = characterNames[index];
            
            // Load rotation sprites
            this.load.image(`${charName}_south`, `img/${char}/rotations/south.png`);
            this.load.image(`${charName}_west`, `img/${char}/rotations/west.png`);
            this.load.image(`${charName}_east`, `img/${char}/rotations/east.png`);
            this.load.image(`${charName}_north`, `img/${char}/rotations/north.png`);
            
            // Load breathing-idle animation frames
            for (let i = 0; i < 4; i++) {
                const frameNumber = i.toString().padStart(3, '0');
                this.load.image(`${charName}_breathing_idle_${frameNumber}`, `img/${char}/animations/breathing-idle/south/frame_${frameNumber}.png`);
            }
            
            // Load walk animation frames (east and west)
            ['east', 'west'].forEach(direction => {
                for (let i = 0; i < 6; i++) {
                    const frameNumber = i.toString().padStart(3, '0');
                    this.load.image(`${charName}_walk_${direction}_${frameNumber}`, `img/${char}/animations/walk/${direction}/frame_${frameNumber}.png`);
                }
            });
            
            // Load jumping animation frames (east and west)
            ['east', 'west'].forEach(direction => {
                for (let i = 0; i < 9; i++) {
                    const frameNumber = i.toString().padStart(3, '0');
                    this.load.image(`${charName}_jumping_${direction}_${frameNumber}`, `img/${char}/animations/jumping-1/${direction}/frame_${frameNumber}.png`);
                }
            });
        });
    }
    
    loadEnemySprites() {
        const enemies = ['enemy1', 'enemy2'];
        
        enemies.forEach(enemy => {
            // Load rotation sprites for each enemy
            this.load.image(`${enemy}_south`, `img/${enemy}/rotations/south.png`);
            this.load.image(`${enemy}_west`, `img/${enemy}/rotations/west.png`);
            this.load.image(`${enemy}_east`, `img/${enemy}/rotations/east.png`);
            this.load.image(`${enemy}_north`, `img/${enemy}/rotations/north.png`);
        });
    }
    
    createCharacterAnimations() {
        const characterNames = ['cyberWarrior', 'quantumMage', 'stealthRogue', 'plasmaPaladin'];
        
        characterNames.forEach(charName => {
            // Create breathing-idle animation
            this.anims.create({
                key: `${charName}_breathing_idle`,
                frames: [
                    { key: `${charName}_breathing_idle_000` },
                    { key: `${charName}_breathing_idle_001` },
                    { key: `${charName}_breathing_idle_002` },
                    { key: `${charName}_breathing_idle_003` }
                ],
                frameRate: 8, // Slow breathing animation
                repeat: -1 // Loop infinitely
            });
            
            // Create walk animations for east and west
            ['east', 'west'].forEach(direction => {
                this.anims.create({
                    key: `${charName}_walk_${direction}`,
                    frames: [
                        { key: `${charName}_walk_${direction}_000` },
                        { key: `${charName}_walk_${direction}_001` },
                        { key: `${charName}_walk_${direction}_002` },
                        { key: `${charName}_walk_${direction}_003` },
                        { key: `${charName}_walk_${direction}_004` },
                        { key: `${charName}_walk_${direction}_005` }
                    ],
                    frameRate: 12, // Smooth walking animation
                    repeat: -1 // Loop infinitely
                });
            });
            
            // Create jumping animations for east and west
            ['east', 'west'].forEach(direction => {
                this.anims.create({
                    key: `${charName}_jumping_${direction}`,
                    frames: [
                        { key: `${charName}_jumping_${direction}_000` },
                        { key: `${charName}_jumping_${direction}_001` },
                        { key: `${charName}_jumping_${direction}_002` },
                        { key: `${charName}_jumping_${direction}_003` },
                        { key: `${charName}_jumping_${direction}_004` },
                        { key: `${charName}_jumping_${direction}_005` },
                        { key: `${charName}_jumping_${direction}_006` },
                        { key: `${charName}_jumping_${direction}_007` },
                        { key: `${charName}_jumping_${direction}_008` }
                    ],
                    frameRate: 15, // Quick jumping animation
                    repeat: 0 // Play once
                });
            });
        });
    }
    
    create() {
        // Set world bounds based on scroll direction
        this.setupWorldBounds();
        
        // Create character animations
        this.createCharacterAnimations();
        
        // Wait a bit for background images to fully load, then create background
        this.time.delayedCall(1000, () => {
            this.createBackground();
            this.createDarkOverlay();
        });
        
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
        // Randomly select one of the three background images
        const backgroundKeys = ['background1', 'background2', 'background3'];
        const selectedBackground = backgroundKeys[Math.floor(Math.random() * backgroundKeys.length)];
        
        console.log('Selected background:', selectedBackground);
        
        // Create the background image
        if (this.textures.exists(selectedBackground)) {
            // Create a single background image that covers the entire world
            const worldWidth = 4100;
            const worldHeight = 800;
            const imageWidth = this.textures.get(selectedBackground).source[0].width;
            const imageHeight = this.textures.get(selectedBackground).source[0].height;
            
            // Calculate scale to cover the full world width (may stretch vertically)
            // New images are 1728x576px, world is 4100x800px
            const scaleX = worldWidth / imageWidth;  // 4100 / 1728 ≈ 2.37
            const scaleY = worldHeight / imageHeight; // 800 / 576 ≈ 1.39
            
            // Use the larger scale to ensure full coverage of world width
            const scale = Math.max(scaleX, scaleY);
            
            console.log('Image dimensions:', imageWidth, 'x', imageHeight);
            console.log('Scale factors - X:', scaleX.toFixed(2), 'Y:', scaleY.toFixed(2), 'Using:', scale.toFixed(2));
            
            // Position the background to start from the left edge of the world
            this.backgroundImage = this.add.image(imageWidth * scale / 2, worldHeight / 2, selectedBackground);
            this.backgroundImage.setScrollFactor(0.3);
            this.backgroundImage.setDepth(-10);
            this.backgroundImage.setScale(scale);
            
            console.log('Single background created');
            console.log('Image size:', imageWidth, 'x', imageHeight);
            console.log('World size:', worldWidth, 'x', worldHeight);
            console.log('Scale used:', scale);
            console.log('Background positioned at:', this.backgroundImage.x, this.backgroundImage.y);
            
        } else {
            console.log('Background texture not found, using fallback');
            this.createFallbackBackground();
        }
        
        // Test rectangles removed - background is working!
        
        // Add some additional atmospheric elements with different parallax speeds
        this.addAtmosphericElements();
    }
    
    createDarkOverlay() {
        // Create a dark overlay to make the background darker
        const worldWidth = 4100;
        const worldHeight = 800;
        
        // Create a semi-transparent dark rectangle covering the entire world
        this.darkOverlay = this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x000000, 0.4);
        this.darkOverlay.setScrollFactor(0.2); // Slight parallax effect
        this.darkOverlay.setDepth(1); // Above background but below game elements
        
        console.log('Dark overlay created');
    }
    
    createFallbackBackground() {
        // Create a simple colored background as fallback
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a0a2e);
        graphics.fillRect(0, 0, 4100, 600);
        graphics.generateTexture('fallbackBackground', 4100, 600);
        graphics.destroy();
        
        this.backgroundImage = this.add.image(2050, 300, 'fallbackBackground');
        console.log('Created fallback background');
    }
    
    addAtmosphericElements() {
        // Add floating particles with parallax effect - reduced count to see background
        for (let i = 0; i < 10; i++) {
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
        
        // Define portal area to avoid (portal is at x=4000, y=660, size 100x100)
        this.portalArea = {
            x: 4000,
            y: 660,
            width: 100,
            height: 100,
            buffer: 50 // Extra buffer around portal
        };
        
        // Ground platforms - extend to 4100px to ensure full coverage with buffer
        // Move ground down to maximize playable area (screen height 800px, world height 600px)
        const groundPlatforms = Platform.createGround(this, 0, 760, 4100);
        console.log('Ground platforms created:', groundPlatforms.length);
        console.log('Ground platform positions:', groundPlatforms.map(p => p.x));
        this.platforms.push(...groundPlatforms);
        
        // Floating platforms with increased spacing and fewer platforms
        // Adjust all platform heights relative to new ground level (760px)
        // Pass existing platforms to ensure no collisions
        const floatingPlatforms1 = Platform.createFloatingPlatforms(this, 400, 700, 3, 600, this.platforms, (x, y, w, h) => this.checkPortalCollision(x, y, w, h));
        this.platforms.push(...floatingPlatforms1);
        
        const floatingPlatforms2 = Platform.createFloatingPlatforms(this, 1200, 650, 3, 600, this.platforms, (x, y, w, h) => this.checkPortalCollision(x, y, w, h));
        this.platforms.push(...floatingPlatforms2);
        
        const floatingPlatforms3 = Platform.createFloatingPlatforms(this, 2000, 600, 3, 600, this.platforms, (x, y, w, h) => this.checkPortalCollision(x, y, w, h));
        this.platforms.push(...floatingPlatforms3);
        
        const floatingPlatforms4 = Platform.createFloatingPlatforms(this, 2800, 680, 3, 600, this.platforms, (x, y, w, h) => this.checkPortalCollision(x, y, w, h));
        this.platforms.push(...floatingPlatforms4);
        
        // Create platform sequences with increased spacing
        // Pass existing platforms to ensure no collisions
        const sequence1 = Platform.createPlatformSequence(this, 800, 650, 3, 500, 80, this.platforms, (x, y, w, h) => this.checkPortalCollision(x, y, w, h));
        this.platforms.push(...sequence1);
        
        const sequence2 = Platform.createPlatformSequence(this, 2000, 600, 3, 600, 100, this.platforms, (x, y, w, h) => this.checkPortalCollision(x, y, w, h));
        this.platforms.push(...sequence2);
        
        const sequence3 = Platform.createPlatformSequence(this, 3200, 620, 2, 700, 90, this.platforms, (x, y, w, h) => this.checkPortalCollision(x, y, w, h));
        this.platforms.push(...sequence3);
    }

    // Helper method to check if a position conflicts with the portal area
    checkPortalCollision(x, y, width, height) {
        if (!this.portalArea) return false;
        
        const portalLeft = this.portalArea.x - this.portalArea.width / 2 - this.portalArea.buffer;
        const portalRight = this.portalArea.x + this.portalArea.width / 2 + this.portalArea.buffer;
        const portalTop = this.portalArea.y - this.portalArea.height / 2 - this.portalArea.buffer;
        const portalBottom = this.portalArea.y + this.portalArea.height / 2 + this.portalArea.buffer;
        
        const platformLeft = x - width / 2;
        const platformRight = x + width / 2;
        const platformTop = y - height / 2;
        const platformBottom = y + height / 2;
        
        // Check if platform overlaps with portal area
        return !(platformRight < portalLeft || 
                platformLeft > portalRight || 
                platformBottom < portalTop || 
                platformTop > portalBottom);
    }

    createPlayer() {
        // Paladin starts near the portal, other characters start at the beginning
        let startX = 100; // Default starting position
        if (gameData.selectedCharacter === 'D') {
            startX = 3800; // Paladin starts close to portal (portal is at x=4000)
        }
        
        this.player = new Player(this, startX, 700, gameData.selectedCharacter);
        
        console.log('Player created at:', startX, 700, 'Character:', gameData.selectedCharacter);
        console.log('Player visible:', this.player.visible);
        console.log('Player active:', this.player.active);
        
        // Add player to physics groups for collision detection
        this.playerGroup = this.physics.add.group([this.player]);
    }

    // Helper function to find appropriate spawn position on ground or platforms
    findSpawnPosition(x, preferGround = true) {
        const groundY = 760; // Ground level from platform creation
        const enemySpriteHeight = 64; // Enemy sprite size is 64x64
        const enemyPhysicsHeight = 48; // Enemy physics body height
        const enemyPhysicsOffsetY = 8; // Enemy physics body vertical offset
        const groundPlatformHeight = 40; // Ground platform height from Platform.createGround
        
        if (preferGround) {
            // Position enemy so their feet touch the ground platform surface
            // Ground platform top is at: groundY - groundPlatformHeight/2
            // Enemy physics body bottom should be at platform top
            // Enemy center should be at: platform top - (enemyPhysicsHeight/2 - enemyPhysicsOffsetY)
            const groundPlatformTop = groundY - groundPlatformHeight / 2;
            const enemyCenterY = groundPlatformTop - (enemyPhysicsHeight / 2 - enemyPhysicsOffsetY) - 3;
            return { x: x, y: enemyCenterY };
        }
        
        // For floating enemies, find the best platform to spawn on
        let bestPlatform = null;
        let bestScore = -1;
        
        for (const platform of this.platforms) {
            if (!platform || !platform.active) continue;
            
            // Skip ground platforms (they have Y around 760)
            if (platform.y > 700) continue;
            
            // Calculate how good this platform is for spawning
            const distanceFromTarget = Math.abs(platform.x - x);
            const platformWidth = platform.width || 200;
            
            // Score based on proximity and whether the platform is in the right area
            let score = 0;
            
            // Prefer platforms that are close to the target X
            if (distanceFromTarget < platformWidth) {
                score += 100; // High score for platforms at the target X
            } else if (distanceFromTarget < platformWidth * 2) {
                score += 50; // Medium score for nearby platforms
            } else if (distanceFromTarget < platformWidth * 3) {
                score += 25; // Low score for somewhat nearby platforms
            }
            
            // Prefer platforms that are not too high (avoid UI overlap)
            if (platform.y > 150 && platform.y < 600) {
                score += 20;
            }
            
            // Choose the platform with the best score
            if (score > bestScore) {
                bestScore = score;
                bestPlatform = platform;
            }
        }
        
        // If we found a good platform, spawn on it
        if (bestPlatform && bestScore > 0) {
            // Position enemy so their feet touch the platform surface
            const platformTop = bestPlatform.y - bestPlatform.height / 2;
            const enemyCenterY = platformTop - (enemyPhysicsHeight / 2 - enemyPhysicsOffsetY) - 3;
            return { 
                x: bestPlatform.x, 
                y: enemyCenterY
            };
        }
        
        // Fallback to ground if no suitable platform found
        console.warn(`No suitable platform found for X=${x}, falling back to ground`);
        const groundPlatformTop = groundY - groundPlatformHeight / 2;
        const enemyCenterY = groundPlatformTop - (enemyPhysicsHeight / 2 - enemyPhysicsOffsetY) - 3;
        return { x: x, y: enemyCenterY };
    }

    createEnemies() {
        this.enemies = [];
        
        // Stationary enemies (blocking paths) - position them on ground platforms
        const stationaryPositions = [
            { x: 400, preferGround: true },
            { x: 800, preferGround: true },
            { x: 1200, preferGround: true },
            { x: 1600, preferGround: true }
        ];
        
        const stationaryEnemies = stationaryPositions.map((pos, index) => {
            const spawnPos = this.findSpawnPosition(pos.x, pos.preferGround);
            const enemyType = index % 2 === 0 ? 'enemy1' : 'enemy2';
            return Enemy.createStationaryEnemy(this, spawnPos.x, spawnPos.y, enemyType);
        });
        
        // Moving enemies (patrolling) - find good floating platforms to spawn on
        const movingEnemies = [];
        const floatingPlatforms = this.platforms.filter(p => p.y < 700); // Only floating platforms
        
        // Try to spawn moving enemies on different floating platforms
        const targetMovingEnemies = 4;
        for (let i = 0; i < targetMovingEnemies && i < floatingPlatforms.length; i++) {
            const platform = floatingPlatforms[i];
            const enemyType = i % 2 === 0 ? 'enemy1' : 'enemy2';
            const spawnPos = this.findSpawnPosition(platform.x, false);
            movingEnemies.push(Enemy.createMovingEnemy(this, spawnPos.x, spawnPos.y, enemyType));
        }
        
        // Patrol enemies with different ranges - find platforms for them too
        const patrolEnemies = [];
        const targetPatrolEnemies = 3;
        for (let i = targetMovingEnemies; i < targetMovingEnemies + targetPatrolEnemies && i < floatingPlatforms.length; i++) {
            const platform = floatingPlatforms[i];
            const enemyType = i % 2 === 0 ? 'enemy1' : 'enemy2';
            const spawnPos = this.findSpawnPosition(platform.x, false);
            patrolEnemies.push(Enemy.createPatrolEnemy(this, spawnPos.x, spawnPos.y, 150, enemyType));
        }
        
        this.enemies.push(...stationaryEnemies, ...movingEnemies, ...patrolEnemies);
        
        // Add enemies to physics group
        this.enemyGroup = this.physics.add.group(this.enemies);
        
        // Debug: Log enemy positions and platform info
        console.log('Floating platforms available:', floatingPlatforms.length);
        console.log('Floating platform positions:', floatingPlatforms.map(p => `x=${p.x}, y=${p.y}`));
        console.log('Enemies spawned at positions:');
        this.enemies.forEach((enemy, index) => {
            console.log(`Enemy ${index}: x=${enemy.x}, y=${enemy.y}, type=${enemy.type}`);
            console.log(`Enemy ${index} physics body: x=${enemy.body.x}, y=${enemy.body.y}, width=${enemy.body.width}, height=${enemy.body.height}`);
        });
        
        // Debug: Log player physics body info
        if (this.player) {
            console.log(`Player physics body: x=${this.player.body.x}, y=${this.player.body.y}, width=${this.player.body.width}, height=${this.player.body.height}`);
            console.log(`Player sprite: x=${this.player.x}, y=${this.player.y}, width=${this.player.width}, height=${this.player.height}`);
        }
    }

    createPortal() {
        // Create portal at the end of the map (near x=4000)
        const portalX = 4000;
        const groundY = 760; // Ground level from platform creation
        const portalY = groundY - 100; // Position portal above ground level
        
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
        // Set camera bounds for extended world with maximized playable area
        this.cameras.main.setBounds(0, 0, 4100, 800);
        
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
