class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Assets are preloaded in LoadingScene
        // Just create tile textures from the preloaded tileset
        this.createTileTextures();
    }
    
    
    createTileTextures() {
        console.log('GameScene: Creating tile textures...');
        
        // Check if tileset image exists
        if (!this.textures.exists('tileset')) {
            console.error('Tileset image not found!');
            return;
        }
        
        console.log('Tileset image found, creating spritesheet...');
        
        // Create individual tile textures from the 8x8 tileset (64 tiles total)
        const tileSize = 32; // Each tile is 32x32 pixels
        const tilesPerRow = 8; // 8 tiles per row in the tileset
        
        try {
            // Use addSpriteSheet to create individual tile textures
            this.textures.addSpriteSheet('tileset_sprites', this.textures.get('tileset').getSourceImage(), {
                frameWidth: tileSize,
                frameHeight: tileSize,
                startFrame: 0,
                endFrame: 63
            });
            
            console.log('GameScene: Created tileset spritesheet with 64 individual tile textures');
            console.log('Available textures:', Object.keys(this.textures.list));
        } catch (error) {
            console.error('Error creating tileset spritesheet:', error);
        }
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

        // Create background immediately
        this.createBackground();
        this.createDarkOverlay();
        
        // Set up world bounds FIRST
        this.setupWorldBounds();
        
        // Create tilemap system
        this.tilemapSystem = new TilemapSystem(this);
        
        // Load map data if available, otherwise use default
        this.loadMapData();
        
        // Create player immediately (will be repositioned when map loads)
        this.createPlayer();
        
        // Initialize enemies array to prevent race condition
        this.enemies = [];
        
        // Set up camera
        this.setupCamera();
        
        // Create UI
        this.createUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start background music
        this.startBackgroundMusic();
        
        // Initialize debug counter
        this.frameCount = 0;
    }

    loadMapData() {
        console.log('Starting map data load...');
        // Load default.json map file
        this.mapSystem.loadMapFromURL('maps/default.json')
            .then(mapData => {
                console.log('Loaded default map:', mapData.metadata.name);
                console.log('Map data size:', JSON.stringify(mapData).length, 'characters');
                console.log('TilemapSystem initialized:', !!this.tilemapSystem);
                console.log('TilemapSystem mapWidth:', this.tilemapSystem?.mapWidth);
                console.log('TilemapSystem mapHeight:', this.tilemapSystem?.mapHeight);
                
                this.mapData = mapData;
                // Load tile data immediately after map data is loaded
                console.log('Calling loadTileDataFromMap...');
                this.loadTileDataFromMap();
                console.log('Calling createCollisionBodies...');
                // Create collision bodies AFTER tile data is loaded
                this.tilemapSystem.createCollisionBodies();
                console.log('Calling createEnemies...');
                // Create enemies AFTER map data is loaded
                this.createEnemies();
                console.log('Calling createPortal...');
                // Create portal AFTER map data is loaded
                this.createPortal();
                console.log('Calling setupCollisions...');
                // Setup collisions AFTER collision bodies are created
                this.setupCollisions();
                console.log('Calling updateObjectsFromMapData...');
                // Reposition objects based on map data
                this.updateObjectsFromMapData();
                console.log('Map loading completed successfully');
            })
            .catch(error => {
                console.error('Failed to load default.json map file:', error.message);
                console.error('Game cannot start without a valid map file. Please ensure maps/default.json exists.');
                // Show error message to user
                this.add.text(600, 400, 'Map Loading Error', {
                    fontSize: '32px',
                    fill: '#ff4444',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                
                this.add.text(600, 450, 'Failed to load maps/default.json', {
                    fontSize: '18px',
                    fill: '#ffffff'
                }).setOrigin(0.5);
                
                this.add.text(600, 480, 'Please ensure the map file exists and is valid', {
                    fontSize: '16px',
                    fill: '#cccccc'
                }).setOrigin(0.5);
            });
    }

    loadTileDataFromMap() {
        // Load tile data from map
        if (this.mapData && this.mapData.tiles && Array.isArray(this.mapData.tiles)) {
            console.log('Loading tile data from map...');
            
            // Clear existing tiles first
            for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
                for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
                    this.tilemapSystem.setTile(x, y, TilemapSystem.TILE_TYPES.EMPTY);
                }
            }
            
            // Load tile data
            console.log(`Map data tiles length: ${this.mapData.tiles.length}`);
            console.log(`Tilemap system mapHeight: ${this.tilemapSystem.mapHeight}`);
            console.log(`Tilemap system mapWidth: ${this.tilemapSystem.mapWidth}`);
            
            for (let y = 0; y < Math.min(this.mapData.tiles.length, this.tilemapSystem.mapHeight); y++) {
                if (this.mapData.tiles[y] && Array.isArray(this.mapData.tiles[y])) {
                    console.log(`Row ${y} length: ${this.mapData.tiles[y].length}`);
                    for (let x = 0; x < Math.min(this.mapData.tiles[y].length, this.tilemapSystem.mapWidth); x++) {
                        const tileData = this.mapData.tiles[y][x];
                        
                        // Handle both old format (number) and new format (object)
                        if (typeof tileData === 'number') {
                            // Old format: just tile type
                            this.tilemapSystem.setTile(x, y, tileData);
                        } else if (tileData && typeof tileData === 'object') {
                            // New format: object with type and spriteIndex
                            this.tilemapSystem.setTile(x, y, tileData.type, tileData.spriteIndex);
                        }
                        
                        // Debug: Log specific tile (120, 13)
                        if (x === 120 && y === 13) {
                            console.log(`Loading tile at (120, 13): mapData=${JSON.stringify(tileData)}, tilemapSystem=${this.tilemapSystem.getTile(x, y)}`);
                        }
                    }
                }
            }
            
            console.log('Tile data loaded from map successfully');
            
            // Debug: Check specific tile (120, 13)
            const debugTile = this.tilemapSystem.getTile(120, 13);
            console.log(`Debug: Tile at (120, 13) = ${debugTile} (should be 3 for platform)`);
            
            // Debug: Count non-empty tiles
            let nonEmptyTiles = 0;
            for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
                for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
                    if (this.tilemapSystem.tiles[y][x] !== TilemapSystem.TILE_TYPES.EMPTY) {
                        nonEmptyTiles++;
                    }
                }
            }
            
            console.log(`Tile data loaded from map successfully. Non-empty tiles: ${nonEmptyTiles}`);
        } else {
            console.log('No tile data found in map, using default tilemap');
        }
    }

    setupWorldBounds() {
        const worldWidth = 4128; // Extended world to match tilemap width (129 tiles * 32 pixels)
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
        // Create player with default position (will be repositioned when map loads)
        let startX = 100; // Default starting position
        let startY = 688; // Default starting position
        
        // Paladin starts near the portal, other characters start at the beginning
        if (gameData.selectedCharacter === 'D') {
            startX = 3800; // Paladin starts close to portal (portal is at x=4000)
        }
        
        // Calculate ground level from tilemap (bottom 3 rows)
        const groundTileY = this.tilemapSystem.mapHeight - 3; // Ground starts at row 22
        const groundWorldY = groundTileY * this.tilemapSystem.tileSize; // Convert to world coordinates
        startY = groundWorldY - 66; // Spawn at yellow circle position (50px above ground + 16px offset)
        
        this.player = new Player(this, startX, startY, gameData.selectedCharacter);
        
        // Add player to physics groups for collision detection
        this.playerGroup = this.physics.add.group([this.player]);
        
        console.log(`Player created at position: (${startX}, ${startY})`);
    }

    repositionPlayer() {
        // Reposition player based on map data
        if (this.mapData && this.mapData.player && this.player) {
            const startX = this.mapData.player.startPosition.x;
            const startY = this.mapData.player.startPosition.y;
            
            this.player.setPosition(startX, startY);
            console.log(`Player repositioned to map position: (${startX}, ${startY})`);
        }
    }

    updateObjectsFromMapData() {
        // Update player position
        this.repositionPlayer();
        
        // Update portal position
        if (this.mapData && this.mapData.portal && this.portalSprite) {
            const portalX = this.mapData.portal.position.x;
            const portalY = this.mapData.portal.position.y;
            
            this.portalSprite.setPosition(portalX, portalY);
            console.log(`Portal repositioned to map position: (${portalX}, ${portalY})`);
        }
        
        // Note: Enemies are now created at correct positions, no need to reposition
    }

    // Helper function to find appropriate spawn position using tilemap
    findSpawnPosition(x, preferGround = true) {
        // Use tilemap system to find spawn position
        return this.tilemapSystem.findEnemySpawnPosition(preferGround);
    }

    createEnemies() {
        console.log('createEnemies() called');
        console.log('this.mapData exists:', !!this.mapData);
        console.log('this.mapData.enemies exists:', !!(this.mapData && this.mapData.enemies));
        console.log('enemies count:', this.mapData?.enemies?.length || 0);
        
        this.enemies = [];
        
        if (this.mapData && this.mapData.enemies) {
            console.log('Creating enemies from map data...');
            // Create enemies from map data
            this.mapData.enemies.forEach((enemyData, index) => {
                console.log(`Creating enemy ${index}:`, enemyData);
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
                console.log(`Enemy ${index} created at position:`, enemy.x, enemy.y);
            });
            
            console.log(`Created ${this.enemies.length} enemies from map data`);
        } else {
            console.warn('No enemy data found in map. No enemies will be created.');
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

    createPortal() {
        console.log('createPortal() called');
        console.log('this.mapData exists:', !!this.mapData);
        console.log('this.mapData.portal exists:', !!(this.mapData && this.mapData.portal));
        
        // Get portal position from map data
        let portalX = 4000;
        let portalY = 660;
        
        if (this.mapData && this.mapData.portal) {
            portalX = this.mapData.portal.position.x;
            portalY = this.mapData.portal.position.y;
            console.log('Using portal position from map data:', portalX, portalY);
        } else {
            // Default portal position
            const groundY = 760; // Ground level from platform creation
            portalY = groundY - 100; // Position portal above ground level
            console.log('Using default portal position:', portalX, portalY);
        }
        
        // Create animated portal sprite
        console.log('Creating portal sprite at:', portalX, portalY);
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
        this.characterNameText = this.add.text(50, 5, characterName, {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(100);

        // Calculate health bar position after character name
        const characterNameWidth = characterName.length * 12; // Approximate width
        const healthBarStartX = 50 + characterNameWidth + 30; // 30px spacing
        this.healthBarX = healthBarStartX + 100; // Store for updateHealthBar method

        // Health bar background (aligned with character name text)
        this.healthBarBg = this.add.rectangle(this.healthBarX, 15, 200, 20, 0x333333)
            .setScrollFactor(0).setDepth(100);
        
        // Health bar (aligned with character name text)
        this.healthBar = this.add.rectangle(this.healthBarX, 15, 200, 20, 0x00ff00)
            .setScrollFactor(0).setDepth(101);
        
        // Health text (aligned with character name text)
        this.healthText = this.add.text(this.healthBarX, 15, `${gameData.maxHealth}/${gameData.maxHealth}`, {
            fontSize: '14px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

        // Instructions
        this.add.text(500, 5, 'Arrow Keys: Move | Space: Jump', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0).setDepth(100);

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
            }).setScrollFactor(0).setDepth(100);
        }

        // Save and Load functionality is available via keyboard shortcuts (S and L keys)
        // No visible buttons needed

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
                        // Reload the map data without restarting the scene
                        this.reloadMapData();
                    })
                    .catch(error => {
                        console.error('Error loading map:', error);
                        alert('Error loading map: ' + error.message);
                    });
            }
        });
    }

    reloadMapData() {
        console.log('Reloading map data without scene restart...');
        
        // Clear existing enemies
        if (this.enemies) {
            this.enemies.forEach(enemy => enemy.destroy());
            this.enemies = [];
        }
        
        // Clear existing portal
        if (this.portalSprite) {
            this.portalSprite.destroy();
            this.portalSprite = null;
        }
        
        // Reload tile data
        this.loadTileDataFromMap();
        
        // Recreate collision bodies
        this.tilemapSystem.createCollisionBodies();
        
        // Recreate enemies
        this.createEnemies();
        
        // Recreate portal
        this.createPortal();
        
        // Update player position
        this.updateObjectsFromMapData();
        
        console.log('Map data reloaded successfully');
    }

    async saveCurrentMap() {
        if (this.mapSystem) {
            const currentMapData = this.mapSystem.createMapFromGameState();
            if (currentMapData) {
                const success = await this.mapSystem.saveMap(currentMapData);
                if (success) {
                    console.log('Current game state saved as map');
                } else {
                    console.log('Map save cancelled or failed');
                }
            }
        }
    }

    loadMapFromFile() {
        this.mapFileInput.click();
    }

    setupCamera() {
        // Set camera bounds for extended world with maximized playable area
        this.cameras.main.setBounds(0, 0, 4128, 800);
        
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
        if (this.enemies && Array.isArray(this.enemies)) {
            this.enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    enemy.update();
                }
            });
        }
        
        // Debug: Track player position every 60 frames (1 second) - DISABLED
        // if (this.player && this.frameCount % 60 === 0) {
        //     console.log(`Player position: (${this.player.x}, ${this.player.y})`);
        //     console.log(`Player velocity: (${this.player.body.velocity.x}, ${this.player.body.velocity.y})`);
        //     console.log(`Player touching ground: ${this.player.body.touching.down}`);
        // }
        this.frameCount++;
        
        if (this.enemies && Array.isArray(this.enemies)) {
            this.enemies.forEach(enemy => {
                if (enemy && enemy.body && enemy.body.velocity.y !== 0) {
                    enemy.body.setVelocityY(0);
                    enemy.body.setAllowGravity(false);
                }
            });
        }
        
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
        // Check if music is already initialized globally to prevent duplicates
        if (window.gameMusicInitialized) {
            console.log('Background music already initialized globally, skipping...');
            return;
        }
        
        window.gameMusicInitialized = true;
        
        // Audio is preloaded in LoadingScene
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

