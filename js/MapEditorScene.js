class MapEditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapEditorScene' });
        
        // Initialize HUD visibility
        this.hudVisible = true;
        this.hudElements = [];
        
        // Flag to prevent default map override during custom map loading
        this.isLoadingCustomMap = false;
    }

    preload() {
        // Assets are preloaded in LoadingScene
        // Just create tile textures from the preloaded tileset
        this.createTileTextures();
    }

    
    createTileTextures() {
        // Check if tileset_sprites already exists to prevent duplicate texture creation
        if (this.textures.exists('tileset_sprites')) {
            return; // Texture already exists, skip creation
        }
        
        // Create individual tile textures from the 8x8 tileset (64 tiles total)
        const tileSize = 32; // Each tile is 32x32 pixels
        const tilesPerRow = 8; // 8 tiles per row in the tileset
        
        // Use addSpriteSheet to create individual tile textures
        this.textures.addSpriteSheet('tileset_sprites', this.textures.get('tileset').getSourceImage(), {
            frameWidth: tileSize,
            frameHeight: tileSize,
            startFrame: 0,
            endFrame: 63
        });
        
    }

    create() {
        console.log(`🗺️ MapEditorScene started!`);
        
        // Initialize map system
        this.mapSystem = new MapSystem(this);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, 4128, 800);
        
        // Create background
        this.createBackground();
        
        // Create tilemap system
        this.tilemapSystem = new TilemapSystem(this);
        this.tilemapSystem.createCollisionBodies();
        
        // Create grid overlay for tile editing
        this.createGridOverlay();
        
        // Load default map data
        this.loadDefaultMap();
        
        // Create UI
        this.createEditorUI();
        
        // Set up camera
        this.setupCamera();
        
        // Set up input
        this.setupInput();
        
        // Create preview objects
        this.createPreviewObjects();
    }

    loadDefaultMap() {
        // Don't load default map if we're currently loading a custom map
        if (this.isLoadingCustomMap) {
            return;
        }
        
        // TEMPORARY: Always skip default map loading to test if this is the issue
        return;
        
        // Try to load default.json map file
        this.mapSystem.loadMapFromURL('maps/default.json')
            .then(mapData => {
                // Double-check flag in case it changed during async operation
                if (this.isLoadingCustomMap) {
                    return;
                }
                
                this.mapData = mapData;
                this.loadTileDataFromMap();
                this.updatePreviewObjects();
            })
            .catch(error => {
                // Create a new empty map if default.json doesn't exist
                this.mapData = {
                    version: "1.0",
                    metadata: {
                        name: "New Map",
                        description: "A new map created in the editor",
                        created: new Date().toISOString(),
                        author: "Map Editor"
                    },
                    world: {
                        width: 4100,
                        height: 800,
                        tileSize: 32
                    },
                    player: {
                        startPosition: { x: 100, y: 688 },
                        character: "A"
                    },
                    portal: {
                        position: { x: 4000, y: 660 },
                        size: { width: 100, height: 100 }
                    },
                    enemies: [],
                    platforms: [],
                    collectibles: [],
                    checkpoints: [],
                    tiles: []
                };
                this.updatePreviewObjects();
            });
    }

    createBackground() {
        const backgroundKeys = ['background1', 'background2', 'background3'];
        const selectedBackground = backgroundKeys[0]; // Use first background for editor
        
        const worldWidth = 4100;
        const worldHeight = 800;
        const imageWidth = this.textures.get(selectedBackground).source[0].width;
        const imageHeight = this.textures.get(selectedBackground).source[0].height;
        
        const scaleX = worldWidth / imageWidth;
        const scaleY = worldHeight / imageHeight;
        const scale = Math.max(scaleX, scaleY);
        
        this.backgroundImage = this.add.image(imageWidth * scale / 2, worldHeight / 2, selectedBackground);
        this.backgroundImage.setScrollFactor(0.3);
        this.backgroundImage.setDepth(-10);
        this.backgroundImage.setScale(scale);
        
        // Dark overlay
        this.darkOverlay = this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x000000, 0.4);
        this.darkOverlay.setScrollFactor(0.2);
        this.darkOverlay.setDepth(1);
    }

    createGridOverlay() {
        // Create grid overlay for tile editing
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.setDepth(5);
        
        // Draw grid lines
        this.gridGraphics.lineStyle(1, 0x00ff00, 0.3);
        
        const tileSize = this.tilemapSystem.tileSize;
        const mapWidth = this.tilemapSystem.mapWidth;
        const mapHeight = this.tilemapSystem.mapHeight;
        
        // Vertical lines
        for (let x = 0; x <= mapWidth; x++) {
            const worldX = x * tileSize;
            this.gridGraphics.moveTo(worldX, 0);
            this.gridGraphics.lineTo(worldX, mapHeight * tileSize);
        }
        
        // Horizontal lines
        for (let y = 0; y <= mapHeight; y++) {
            const worldY = y * tileSize;
            this.gridGraphics.moveTo(0, worldY);
            this.gridGraphics.lineTo(mapWidth * tileSize, worldY);
        }
        
        this.gridGraphics.strokePath();
    }

    createEditorUI() {
        // Title
        this.add.text(50, 30, 'Map Editor', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);

        // Instructions
        this.add.text(50, 60, 'Select a tool first, then click to place objects | Right-click to remove | Drag to paint tiles', {
            fontSize: '12px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);

        // Tool selection
        this.createToolSelection();
        
        // Map management buttons
        this.createMapButtons();
        
        // Object info display
        this.createObjectInfo();
        
        // Grid toggle
        this.createGridToggle();
        
        // Add keyboard shortcut hint
        const shortcutHint = this.add.text(50, 280, 'Press T to open tile selector', {
            fontSize: '12px',
            fill: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        // Add H key hint
        const hudHint = this.add.text(50, 300, 'Press H to hide/show HUD', {
            fontSize: '12px',
            fill: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        // Register hints with HUD system
        this.hudElements.push(shortcutHint, hudHint);
    }

    createToolSelection() {
        const tools = [
            { name: 'Player', key: 'player', color: '#00ff00' },
            { name: 'Portal', key: 'portal', color: '#ff00ff' },
            { name: 'Enemy1', key: 'enemy1', color: '#ff0000' },
            { name: 'Enemy2', key: 'enemy2', color: '#ff8800' },
            { name: 'Solid', key: 'solid', color: '#8B4513' },
            { name: 'Erase', key: 'erase', color: '#000000' }
        ];

        this.selectedTool = null; // Start with no tool selected
        this.selectedSpriteIndex = null; // Track selected sprite for solid tiles
        this.toolButtons = [];

        tools.forEach((tool, index) => {
            const button = this.add.text(50 + (index % 4) * 120, 100 + Math.floor(index / 4) * 30, tool.name, {
                fontSize: '12px',
                fill: '#ffffff', // Always white text
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
                backgroundColor: this.selectedTool === tool.key ? tool.color : '#444444',
                padding: { x: 8, y: 4 }
            }).setScrollFactor(0).setInteractive();

            button.on('pointerdown', () => {
                if (tool.key === 'solid') {
                    this.openSpritePicker();
                } else {
                    this.selectedTool = tool.key;
                    this.selectedSpriteIndex = null;
                    this.updateToolSelection();
                }
            });

            // Add sprite preview for solid button
            if (tool.key === 'solid') {
                this.solidButtonSprite = this.add.image(button.x + 50, button.y, 'tileset_sprites', 0);
                this.solidButtonSprite.setScrollFactor(0);
                this.solidButtonSprite.setDisplaySize(24, 24);
                this.solidButtonSprite.setDepth(button.depth + 1);
            }

            this.toolButtons.push({ button, tool });
        });
        
        // Register tool buttons with HUD system
        this.toolButtons.forEach(({ button }) => {
            this.hudElements.push(button);
        });
        
        // Register solid button sprite with HUD system
        if (this.solidButtonSprite) {
            this.hudElements.push(this.solidButtonSprite);
        }
    }

    updateToolSelection() {
        this.toolButtons.forEach(({ button, tool }) => {
            button.setFill('#ffffff'); // Always white text
            button.setBackgroundColor(this.selectedTool === tool.key ? tool.color : '#444444');
        });
    }

    openSpritePicker() {
        // Close existing sprite picker if open
        if (this.spritePicker) {
            this.closeSpritePicker();
            return;
        }

        // Create sprite picker background
        this.spritePicker = this.add.rectangle(600, 300, 400, 500, 0x000000, 0.8);
        this.spritePicker.setScrollFactor(0);
        this.spritePicker.setDepth(1000);

        // Create title
        this.add.text(600, 100, 'Select Sprite', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(1001).setOrigin(0.5);

        // Create sprite grid (8x8 = 64 sprites)
        this.spriteButtons = [];
        const spriteSize = 32;
        const spacing = 40;
        const startX = 600 - (4 * spacing);
        const startY = 150;

        for (let i = 0; i < 64; i++) {
            const x = startX + (i % 8) * spacing;
            const y = startY + Math.floor(i / 8) * spacing;

            // Create sprite preview
            const spriteButton = this.add.image(x, y, 'tileset_sprites', i);
            spriteButton.setScrollFactor(0);
            spriteButton.setDepth(1001);
            spriteButton.setDisplaySize(spriteSize, spriteSize);
            spriteButton.setInteractive();

            // Add border
            const border = this.add.rectangle(x, y, spriteSize + 4, spriteSize + 4, 0xffffff, 0.3);
            border.setScrollFactor(0);
            border.setDepth(1000);

            spriteButton.on('pointerdown', () => {
                this.selectedSpriteIndex = i;
                this.selectedTool = 'solid';
                this.updateToolSelection();
                
                // Update solid button sprite preview
                if (this.solidButtonSprite) {
                    this.solidButtonSprite.setFrame(i);
                }
                
                this.closeSpritePicker();
            });

            spriteButton.on('pointerover', () => {
                border.setFillStyle(0x00ff00, 0.5);
            });

            spriteButton.on('pointerout', () => {
                border.setFillStyle(0xffffff, 0.3);
            });

            this.spriteButtons.push({ sprite: spriteButton, border });
        }

        // Add close button
        const closeButton = this.add.text(600, 450, 'Close', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#aa0000',
            padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setDepth(1001).setOrigin(0.5).setInteractive();

        closeButton.on('pointerdown', () => {
            this.closeSpritePicker();
        });
    }

    closeSpritePicker() {
        if (this.spritePicker) {
            this.spritePicker.destroy();
            this.spritePicker = null;
        }

        if (this.spriteButtons) {
            this.spriteButtons.forEach(({ sprite, border }) => {
                sprite.destroy();
                border.destroy();
            });
            this.spriteButtons = [];
        }

        // Destroy close button
        const closeButton = this.children.list.find(child => 
            child.text === 'Close' && child.depth === 1001
        );
        if (closeButton) {
            closeButton.destroy();
        }

        // Destroy title
        const title = this.children.list.find(child => 
            child.text === 'Select Sprite' && child.depth === 1001
        );
        if (title) {
            title.destroy();
        }
    }

    toggleHUD() {
        this.hudVisible = !this.hudVisible;
        
        // Toggle visibility of all HUD elements
        this.hudElements.forEach(element => {
            if (element) {
                element.setVisible(this.hudVisible);
            }
        });
        
    }
    
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        this.gridGraphics.setVisible(this.gridVisible);
        this.gridToggleButton.setText(`Grid: ${this.gridVisible ? 'ON' : 'OFF'}`);
        this.gridToggleButton.setBackgroundColor(this.gridVisible ? '#00aa00' : '#aa0000');
    }

    createMapButtons() {
        // Save button
        this.saveButton = this.add.text(50, 180, 'Save Map', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#00aa00',
            padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setInteractive();

        this.saveButton.on('pointerdown', () => {
            this.saveMap();
        });

        // Load button
        this.loadButton = this.add.text(150, 180, 'Load Map', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#0066aa',
            padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setInteractive();

        this.loadButton.on('pointerdown', () => {
            this.loadMap();
        });

        // Clear button
        this.clearButton = this.add.text(250, 180, 'Clear All', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#aa0000',
            padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setInteractive();

        this.clearButton.on('pointerdown', () => {
            this.clearAll();
        });

        // Back to game button
        this.backButton = this.add.text(350, 180, 'Back to Game', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#0066cc',
            padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setInteractive();

        this.backButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        // Register map buttons with HUD system
        this.hudElements.push(this.saveButton, this.loadButton, this.clearButton, this.backButton);
    }

    createObjectInfo() {
        this.objectInfoText = this.add.text(50, 220, 'Selected: None - Select a tool', {
            fontSize: '12px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);

        this.coordinateText = this.add.text(50, 240, 'Position: (0, 0)', {
            fontSize: '12px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        // Register object info with HUD system
        this.hudElements.push(this.objectInfoText, this.coordinateText);
    }

    createGridToggle() {
        this.gridVisible = true;
        this.gridToggleButton = this.add.text(50, 250, 'Grid: ON', {
            fontSize: '12px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#00aa00',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0).setInteractive();

        this.gridToggleButton.on('pointerdown', () => {
            this.gridVisible = !this.gridVisible;
            this.gridGraphics.setVisible(this.gridVisible);
            this.gridToggleButton.setText(`Grid: ${this.gridVisible ? 'ON' : 'OFF'}`);
            this.gridToggleButton.setBackgroundColor(this.gridVisible ? '#00aa00' : '#aa0000');
        });
        
        // Register grid toggle with HUD system
        this.hudElements.push(this.gridToggleButton);
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, 4100, 800);
        this.cameras.main.setZoom(0.8);
        
        // Center the camera initially
        this.cameras.main.centerOn(2050, 400);
        
        // Enable camera controls
        this.cameras.main.setZoom(0.8);
    }

    setupInput() {
        // Mouse input
        this.input.on('pointerdown', (pointer) => {
            // Check if click is on UI elements first
            const isOnUI = this.isClickOnUI(pointer);
            
            if (isOnUI) {
                return; // Don't process placement if clicking on UI
            }
            
            // Use Phaser's camera methods for proper coordinate conversion
            const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
            const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
            
            if (pointer.rightButtonDown()) {
                this.removeObjectAt(worldX, worldY);
            } else {
                this.placeObject(worldX, worldY);
                // Start dragging for tile tools
                if (this.selectedTool && ['ground', 'platform', 'wall', 'solid', 'erase'].includes(this.selectedTool)) {
                    this.isDragging = true;
                }
            }
        });

        // Handle mouse move for dragging
        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && pointer.isDown) {
                const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
                const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
                this.placeObject(worldX, worldY);
            }
        });

        // Handle mouse up to stop dragging
        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D');
        
        // Add T key handler for tile selector
        this.input.keyboard.on('keydown-T', () => {
            this.openSpritePicker();
        });
        
        // Add H key handler for HUD toggle
        this.input.keyboard.on('keydown-H', () => {
            this.toggleHUD();
        });
        
        // Add G key handler for grid toggle
        this.input.keyboard.on('keydown-G', () => {
            this.toggleGrid();
        });
        
        // Camera controls
        this.cameraSpeed = 10; // Increased speed for better navigation
    }

    isClickOnUI(pointer) {
        // If HUD is hidden, don't block any clicks
        if (!this.hudVisible) {
            return false;
        }
        
        // Check if click is within UI button areas - using generous bounds
        const uiBounds = [
            // Tool buttons area - expanded
            { x: 40, y: 90, width: 500, height: 80 },
            // Map management buttons area - expanded
            { x: 40, y: 170, width: 420, height: 30 },
            // Object info area - expanded
            { x: 40, y: 210, width: 300, height: 50 },
            // Grid toggle area - much more generous bounds
            { x: 40, y: 240, width: 300, height: 80 }
        ];
        
        for (const bounds of uiBounds) {
            if (pointer.x >= bounds.x && pointer.x <= bounds.x + bounds.width &&
                pointer.y >= bounds.y && pointer.y <= bounds.y + bounds.height) {
                return true;
            }
        }
        
        return false;
    }

    createPreviewObjects() {
        this.previewObjects = [];
        this.gameObjects = [];
        
        // Create mouse cursor indicator
        this.mouseIndicator = this.add.circle(0, 0, 5, 0xffffff, 0.8);
        this.mouseIndicator.setDepth(100);
        this.mouseIndicator.setVisible(false);
    }

    placeObject(x, y) {
        // Check if a tool is selected
        if (!this.selectedTool) {
            return;
        }
        
        
        switch (this.selectedTool) {
            case 'player':
                this.updatePlayerPosition(x, y);
                break;
            case 'portal':
                this.updatePortalPosition(x, y);
                break;
            case 'enemy1':
            case 'enemy2':
                this.addEnemy(x, y, this.selectedTool);
                break;
            case 'ground':
            case 'platform':
            case 'wall':
            case 'solid':
                // All solid tiles now use the same SOLID type with selected sprite
                this.placeTile(x, y, TilemapSystem.TILE_TYPES.SOLID, this.selectedSpriteIndex);
                break;
            case 'erase':
                this.eraseTile(x, y);
                break;
        }
        
        this.updateObjectInfo();
    }

    removeObjectAt(x, y) {
        // Remove enemies near the click position
        this.mapData.enemies = this.mapData.enemies.filter(enemy => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.position.x, enemy.position.y);
            return distance > 50; // Keep enemies that are more than 50 pixels away
        });
        
        this.updatePreviewObjects();
    }

    updatePlayerPosition(x, y) {
        this.mapData.player.startPosition.x = Math.round(x);
        this.mapData.player.startPosition.y = Math.round(y);
        this.updatePreviewObjects();
    }

    updatePortalPosition(x, y) {
        this.mapData.portal.position.x = Math.round(x);
        this.mapData.portal.position.y = Math.round(y);
        this.updatePreviewObjects();
    }

    addEnemy(x, y, enemyType) {
        const enemyId = `enemy_${Date.now()}`;
        const enemy = {
            id: enemyId,
            type: 'stationary',
            enemyType: enemyType,
            position: { x: Math.round(x), y: Math.round(y) },
            properties: {
                damage: 20,
                health: 50,
                maxHealth: 50,
                collisionCooldown: 1000
            }
        };
        
        this.mapData.enemies.push(enemy);
        this.updatePreviewObjects();
    }

    placeTile(x, y, tileType, spriteIndex = null) {
        // Convert world coordinates to tile coordinates
        const tilePos = this.tilemapSystem.worldToTile(x, y);
        
        // Check if coordinates are within bounds
        if (tilePos.x >= 0 && tilePos.x < this.tilemapSystem.mapWidth && 
            tilePos.y >= 0 && tilePos.y < this.tilemapSystem.mapHeight) {
            
            this.tilemapSystem.setTile(tilePos.x, tilePos.y, tileType, spriteIndex);
        }
    }

    eraseTile(x, y) {
        // Convert world coordinates to tile coordinates
        const tilePos = this.tilemapSystem.worldToTile(x, y);
        
        // Check if coordinates are within bounds
        if (tilePos.x >= 0 && tilePos.x < this.tilemapSystem.mapWidth && 
            tilePos.y >= 0 && tilePos.y < this.tilemapSystem.mapHeight) {
            
            this.tilemapSystem.setTile(tilePos.x, tilePos.y, TilemapSystem.TILE_TYPES.EMPTY);
        }
    }

    updatePreviewObjects() {
        // Clear existing preview objects
        this.previewObjects.forEach(obj => obj.destroy());
        this.previewObjects = [];
        
        // Create player preview
        const playerPos = this.mapData.player.startPosition;
        const playerPreview = this.add.circle(playerPos.x, playerPos.y, 20, 0x00ff00, 0.7);
        playerPreview.setDepth(50);
        this.previewObjects.push(playerPreview);
        
        // Create portal preview
        const portalPos = this.mapData.portal.position;
        const portalPreview = this.add.circle(portalPos.x, portalPos.y, 30, 0xff00ff, 0.7);
        portalPreview.setDepth(50);
        this.previewObjects.push(portalPreview);
        
        // Create enemy previews
        this.mapData.enemies.forEach(enemy => {
            const enemyColor = enemy.enemyType === 'enemy1' ? 0xff0000 : 0xff8800;
            const enemyPreview = this.add.circle(enemy.position.x, enemy.position.y, 15, enemyColor, 0.7);
            enemyPreview.setDepth(50);
            this.previewObjects.push(enemyPreview);
        });
    }

    updateObjectInfo() {
        this.objectInfoText.setText(`Selected: ${this.selectedTool || 'None - Select a tool'}`);
    }

    async saveMap() {
        // Save tile data to map
        this.saveTileDataToMap();
        
        const success = await this.mapSystem.saveMap(this.mapData);
        if (success) {
        } else {
        }
    }

    saveTileDataToMap() {
        // Convert tilemap data to map format
        if (!this.mapData.tiles) {
            this.mapData.tiles = [];
        }
        
        // Clear existing tile data
        this.mapData.tiles = [];
        
        // Save tile data with sprite indices
        for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
            this.mapData.tiles[y] = [];
            for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
                const tileType = this.tilemapSystem.getTile(x, y);
                const spriteIndex = this.tilemapSystem.getTileSpriteIndex(x, y);
                
                // Store both tile type and sprite index
                this.mapData.tiles[y][x] = {
                    type: tileType,
                    spriteIndex: spriteIndex
                };
            }
        }
        
    }

    loadMap() {
        // Create file input for loading
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.isLoadingCustomMap = true; // Set flag to prevent default map override
                
                this.mapSystem.loadMap(file)
                    .then(mapData => {
                        this.mapData = mapData;
                        this.loadTileDataFromMap();
                        this.updatePreviewObjects();
                        this.isLoadingCustomMap = false; // Clear flag
                    })
                    .catch(error => {
                        console.error('Error loading map:', error);
                        alert('Error loading map: ' + error.message);
                        this.isLoadingCustomMap = false; // Clear flag on error
                    });
            }
            document.body.removeChild(fileInput);
        });

        fileInput.click();
    }

    // Method to load a specific map file programmatically (for testing)
    async loadMapFromURL(url) {
        console.log(`🔄 Loading map from URL: ${url}`);
        this.isLoadingCustomMap = true;
        
        try {
            const mapData = await this.mapSystem.loadMapFromURL(url);
            this.mapData = mapData;
            this.loadTileDataFromMap();
            this.updatePreviewObjects();
            this.isLoadingCustomMap = false;
            console.log(`✅ Map loaded successfully from URL: ${url}`);
            return mapData;
        } catch (error) {
            console.error('Error loading map from URL:', error);
            this.isLoadingCustomMap = false;
            throw error;
        }
    }

    loadTileDataFromMap() {
        console.log(`🗺️ Loading tile data from map: ${this.mapData.metadata?.name || 'Unknown'}`);
        
        // Load tile data from map
        if (this.mapData.tiles && Array.isArray(this.mapData.tiles)) {
            // Clear existing tiles
            for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
                for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
                    this.tilemapSystem.setTile(x, y, TilemapSystem.TILE_TYPES.EMPTY);
                }
            }
            
            // Load tile data
            for (let y = 0; y < Math.min(this.mapData.tiles.length, this.tilemapSystem.mapHeight); y++) {
                if (this.mapData.tiles[y] && Array.isArray(this.mapData.tiles[y])) {
                    for (let x = 0; x < Math.min(this.mapData.tiles[y].length, this.tilemapSystem.mapWidth); x++) {
                        const tileData = this.mapData.tiles[y][x];
                        
                        // Handle both old format (number) and new format (object)
                        if (typeof tileData === 'number') {
                            // Old format: just tile type
                            this.tilemapSystem.setTile(x, y, tileData);
                        } else if (tileData && typeof tileData === 'object') {
                            // New format: object with type and spriteIndex
                            this.tilemapSystem.setTile(x, y, tileData.type, tileData.spriteIndex);
                            
                            // Log tile changes for first column, last row
                            if (x === 0 && y === this.tilemapSystem.mapHeight - 1) {
                                console.log(`🔧 Tile changed at first column, last row (${x}, ${y}): type=${tileData.type}, spriteIndex=${tileData.spriteIndex}`);
                            }
                        }
                    }
                }
            }
            
            console.log(`✅ Tile data loaded successfully. Map dimensions: ${this.mapData.tiles.length} rows x ${this.mapData.tiles[0]?.length || 0} columns`);
        }
    }

    clearAll() {
        this.mapData.enemies = [];
        
        // Clear all tiles
        for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
            for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
                this.tilemapSystem.setTile(x, y, TilemapSystem.TILE_TYPES.EMPTY);
            }
        }
        
        this.updatePreviewObjects();
    }

    update() {
        // Camera movement
        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            this.cameras.main.scrollX -= this.cameraSpeed;
        }
        if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            this.cameras.main.scrollX += this.cameraSpeed;
        }
        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
            this.cameras.main.scrollY -= this.cameraSpeed;
        }
        if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
            this.cameras.main.scrollY += this.cameraSpeed;
        }
        
        // Update coordinate display
        const mouseX = this.input.mousePointer.x;
        const mouseY = this.input.mousePointer.y;
        const worldX = this.cameras.main.getWorldPoint(mouseX, mouseY).x;
        const worldY = this.cameras.main.getWorldPoint(mouseX, mouseY).y;
        
        // Convert world coordinates to tile coordinates
        const tileX = Math.floor(worldX / this.tilemapSystem.tileSize);
        const tileY = Math.floor(worldY / this.tilemapSystem.tileSize);
        
        // Get tile type at current position
        const tileType = this.tilemapSystem.getTile(tileX, tileY);
        const tileTypeName = this.getTileTypeName(tileType);
        
        this.coordinateText.setText(`Position: (${Math.round(worldX)}, ${Math.round(worldY)}) | Tile: (${tileX}, ${tileY}) [${tileTypeName}]`);
        
        // Update mouse indicator
        if (this.mouseIndicator) {
            this.mouseIndicator.setPosition(worldX, worldY);
            this.mouseIndicator.setVisible(true);
        }
    }
    
    getTileTypeName(tileType) {
        switch (tileType) {
            case TilemapSystem.TILE_TYPES.EMPTY:
                return 'Empty';
            case TilemapSystem.TILE_TYPES.GROUND:
                return 'Ground';
            case TilemapSystem.TILE_TYPES.WALL:
                return 'Wall';
            case TilemapSystem.TILE_TYPES.PLATFORM:
                return 'Platform';
            case TilemapSystem.TILE_TYPES.SPIKE:
                return 'Spike';
            case TilemapSystem.TILE_TYPES.LADDER:
                return 'Ladder';
            case TilemapSystem.TILE_TYPES.WATER:
                return 'Water';
            default:
                return `Unknown(${tileType})`;
        }
    }
}
