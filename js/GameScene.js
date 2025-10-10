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
        // Initialize map system
        this.mapSystem = new MapSystem(this);
        
        // Set world bounds based on scroll direction
        this.setupWorldBounds();
        
        // Create character animations
        this.createCharacterAnimations();

        // Wait a bit for background images to fully load, then create background
        this.time.delayedCall(1000, () => {
            this.createBackground();
            this.createDarkOverlay();
        });
        
        // Create tilemap system
        this.tilemapSystem = new TilemapSystem(this);
        this.tilemapSystem.generateLevel();
        
        // Load map data if available, otherwise use default
        this.loadMapData();
        
        // Create collision bodies for the tilemap FIRST
        this.tilemapSystem.createCollisionBodies();
        
        // Create player AFTER collision bodies are created
        this.createPlayer();
        
        // Create enemies
        this.createEnemies();
        
        // Create portal
        this.createPortal();
        
        // Setup collisions AFTER everything is created
        this.setupCollisions();
        
        // Create UI
        this.createUI();
        
        // Set up camera
        this.setupCamera();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start background music
        this.startBackgroundMusic();
        
        // Initialize debug counter
        this.frameCount = 0;
    }

    loadMapData() {
        // Try to load example map, fallback to default if not available
        this.mapSystem.loadMapFromURL('maps/example_map.json')
            .then(mapData => {
                console.log('Loaded map:', mapData.metadata.name);
                this.mapData = mapData;
            })
            .catch(error => {
                console.log('Using default map data:', error.message);
                this.mapData = MapSystem.createMapData();
            });
    }

    setupWorldBounds() {
        const worldWidth = 4100; // Extended world to match tilemap width
        const worldHeight = 800; // Match tilemap height (25 tiles * 32 pixels)
        
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        console.log(`World bounds set: width=${worldWidth}, height=${worldHeight}`);
        console.log(`Player spawn at Y=688, world bottom at Y=${worldHeight}`);
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
        // Get player start position from map data
        let startX = 100; // Default starting position
        let startY = 688; // Default starting position
        
        if (this.mapData && this.mapData.player) {
            startX = this.mapData.player.startPosition.x;
            startY = this.mapData.player.startPosition.y;
        } else {
            // Paladin starts near the portal, other characters start at the beginning
            if (gameData.selectedCharacter === 'D') {
                startX = 3800; // Paladin starts close to portal (portal is at x=4000)
            }
            
            // Calculate ground level from tilemap (bottom 3 rows)
            const groundTileY = this.tilemapSystem.mapHeight - 3; // Ground starts at row 22
            const groundWorldY = groundTileY * this.tilemapSystem.tileSize; // Convert to world coordinates
            startY = groundWorldY - 66; // Spawn at yellow circle position (50px above ground + 16px offset)
        }
        
        this.player = new Player(this, startX, startY, gameData.selectedCharacter);
        
        // Add player to physics groups for collision detection
        this.playerGroup = this.physics.add.group([this.player]);
        
        console.log(`Player created at position: (${startX}, ${startY})`);
    }

    // Helper function to find appropriate spawn position using tilemap
    findSpawnPosition(x, preferGround = true) {
        // Use tilemap system to find spawn position
        return this.tilemapSystem.findEnemySpawnPosition(preferGround);
    }

    createEnemies() {
        this.enemies = [];
        
        if (this.mapData && this.mapData.enemies) {
            // Create enemies from map data
            this.mapData.enemies.forEach(enemyData => {
                let enemy;
                
                switch (enemyData.type) {
                    case 'stationary':
                        enemy = Enemy.createStationaryEnemy(this, enemyData.position.x, enemyData.position.y, enemyData.enemyType);
                        break;
                    case 'moving':
                        enemy = Enemy.createMovingEnemy(this, enemyData.position.x, enemyData.position.y, enemyData.enemyType);
                        break;
                    case 'patrol':
                        enemy = Enemy.createPatrolEnemy(this, enemyData.position.x, enemyData.position.y, enemyData.properties.patrolRange || 150, enemyData.enemyType);
                        break;
                    default:
                        enemy = Enemy.createStationaryEnemy(this, enemyData.position.x, enemyData.position.y, enemyData.enemyType);
                }
                
                // Apply properties from map data
                if (enemyData.properties) {
                    if (enemyData.properties.damage) enemy.damage = enemyData.properties.damage;
                    if (enemyData.properties.health) enemy.health = enemyData.properties.health;
                    if (enemyData.properties.maxHealth) enemy.maxHealth = enemyData.properties.maxHealth;
                    if (enemyData.properties.speed) enemy.speed = enemyData.properties.speed;
                    if (enemyData.properties.patrolRange) enemy.patrolRange = enemyData.properties.patrolRange;
                }
                
                this.enemies.push(enemy);
            });
            
            console.log(`Created ${this.enemies.length} enemies from map data`);
        } else {
            // Fallback to default enemy creation
            this.createDefaultEnemies();
        }
        
        // Add enemies to physics group
        this.enemyGroup = this.physics.add.group(this.enemies);
        
        // Debug: Log enemy positions
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

    createDefaultEnemies() {
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
        
        // Moving enemies (patrolling) - spawn on platforms
        const movingEnemies = [];
        
        // Try to spawn moving enemies on different platforms
        const targetMovingEnemies = 4;
        for (let i = 0; i < targetMovingEnemies; i++) {
            const spawnPos = this.findSpawnPosition(400 + i * 200, false);
            const enemyType = i % 2 === 0 ? 'enemy1' : 'enemy2';
            movingEnemies.push(Enemy.createMovingEnemy(this, spawnPos.x, spawnPos.y, enemyType));
        }
        
        // Patrol enemies with different ranges
        const patrolEnemies = [];
        const targetPatrolEnemies = 3;
        for (let i = 0; i < targetPatrolEnemies; i++) {
            const spawnPos = this.findSpawnPosition(600 + i * 300, false);
            const enemyType = i % 2 === 0 ? 'enemy1' : 'enemy2';
            patrolEnemies.push(Enemy.createPatrolEnemy(this, spawnPos.x, spawnPos.y, 150, enemyType));
        }
        
        this.enemies.push(...stationaryEnemies, ...movingEnemies, ...patrolEnemies);
    }

    createPortal() {
        // Get portal position from map data
        let portalX = 4000;
        let portalY = 660;
        
        if (this.mapData && this.mapData.portal) {
            portalX = this.mapData.portal.position.x;
            portalY = this.mapData.portal.position.y;
        } else {
            // Default portal position
            const groundY = 760; // Ground level from platform creation
            portalY = groundY - 100; // Position portal above ground level
        }
        
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
            frameRate: this.mapData?.portal?.animationSpeed || 12, // Use map data or default
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
        
        // Define portal area for collision checking
        this.portalArea = {
            x: portalX,
            y: portalY,
            width: this.mapData?.portal?.size?.width || 100,
            height: this.mapData?.portal?.size?.height || 100,
            buffer: 50 // Extra buffer around portal
        };
    }

    setupCollisions() {
        // Player vs Tilemap
        this.physics.add.collider(this.player, this.tilemapSystem.collisionGroup);
        
        // Also try individual collision bodies as backup
        this.tilemapSystem.collisionBodies.forEach((body, index) => {
            this.physics.add.collider(this.player, body);
        });
        
        // Player vs Enemies
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            // Collision handling is done in Enemy class
        });
        
        // Enemies vs Tilemap
        this.physics.add.collider(this.enemies, this.tilemapSystem.collisionGroup);
        
        // Player vs Portal - only the animated portal sprite
        this.physics.add.overlap(this.player, this.portalSprite, (player, portal) => {
            console.log('Portal collision detected! Starting victory scene...');
            this.stopBackgroundMusic();
            this.scene.start('VictoryScene');
        });
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

        // Map management UI
        this.createMapManagementUI();
    }

    createMapManagementUI() {
        // Map info display
        if (this.mapData && this.mapData.metadata) {
            this.mapInfoText = this.add.text(50, 70, `Map: ${this.mapData.metadata.name}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 1
            }).setScrollFactor(0);
        }

        // Save map button (for testing)
        this.saveMapButton = this.add.text(50, 100, 'Save Map (S)', {
            fontSize: '12px',
            fill: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0).setInteractive();

        this.saveMapButton.on('pointerdown', () => {
            this.saveCurrentMap();
        });

        // Load map button (for testing)
        this.loadMapButton = this.add.text(150, 100, 'Load Map (L)', {
            fontSize: '12px',
            fill: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0).setInteractive();

        this.loadMapButton.on('pointerdown', () => {
            this.loadMapFromFile();
        });

        // Create map input for file loading
        this.createMapFileInput();
    }

    createMapFileInput() {
        // Create hidden file input
        this.mapFileInput = document.createElement('input');
        this.mapFileInput.type = 'file';
        this.mapFileInput.accept = '.json';
        this.mapFileInput.style.display = 'none';
        document.body.appendChild(this.mapFileInput);

        this.mapFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.mapSystem.loadMap(file)
                    .then(mapData => {
                        console.log('Map loaded from file:', mapData.metadata.name);
                        this.mapData = mapData;
                        // Restart the scene with new map data
                        this.scene.restart();
                    })
                    .catch(error => {
                        console.error('Error loading map:', error);
                        alert('Error loading map: ' + error.message);
                    });
            }
        });
    }

    saveCurrentMap() {
        if (this.mapSystem) {
            const currentMapData = this.mapSystem.createMapFromGameState();
            if (currentMapData) {
                this.mapSystem.saveMap(currentMapData);
                console.log('Current game state saved as map');
            }
        }
    }

    loadMapFromFile() {
        this.mapFileInput.click();
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

        // Map management keyboard shortcuts
        this.mapSaveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.mapLoadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
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
        // Handle map management keyboard shortcuts
        if (Phaser.Input.Keyboard.JustDown(this.mapSaveKey)) {
            this.saveCurrentMap();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.mapLoadKey)) {
            this.loadMapFromFile();
        }

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
        
        // Debug: Track player position every 60 frames (1 second) - DISABLED
        // if (this.player && this.frameCount % 60 === 0) {
        //     console.log(`Player position: (${this.player.x}, ${this.player.y})`);
        //     console.log(`Player velocity: (${this.player.body.velocity.x}, ${this.player.body.velocity.y})`);
        //     console.log(`Player touching ground: ${this.player.body.touching.down}`);
        // }
        this.frameCount++;
        
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
        
        // Clean up map file input
        if (this.mapFileInput && this.mapFileInput.parentNode) {
            this.mapFileInput.parentNode.removeChild(this.mapFileInput);
        }
        
        super.shutdown();
    }
}
