class MapEditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapEditorScene' });
    }

    preload() {
        // Load the same assets as GameScene
        for (let i = 1; i <= 12; i++) {
            const frameNumber = i.toString().padStart(2, '0');
            this.load.image(`portal_frame_${frameNumber}`, `img/portal/portal_clean_frame_${frameNumber}.png`);
        }
        
        this.load.image('background1', 'img/background1.png');
        this.load.image('background2', 'img/background2.png');
        this.load.image('background3', 'img/background3.png');
        
        // Load character sprites
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
        });
    }

    loadEnemySprites() {
        const enemies = ['enemy1', 'enemy2'];
        
        enemies.forEach(enemy => {
            this.load.image(`${enemy}_south`, `img/${enemy}/rotations/south.png`);
            this.load.image(`${enemy}_west`, `img/${enemy}/rotations/west.png`);
            this.load.image(`${enemy}_east`, `img/${enemy}/rotations/east.png`);
            this.load.image(`${enemy}_north`, `img/${enemy}/rotations/north.png`);
        });
    }

    create() {
        // Initialize map system
        this.mapSystem = new MapSystem(this);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, 4100, 800);
        
        // Create background
        this.createBackground();
        
        // Create tilemap system
        this.tilemapSystem = new TilemapSystem(this);
        this.tilemapSystem.generateLevel();
        this.tilemapSystem.createCollisionBodies();
        
        // Create grid overlay for tile editing
        this.createGridOverlay();
        
        // Initialize map data
        this.mapData = MapSystem.createMapData();
        
        // Create UI
        this.createEditorUI();
        
        // Set up camera
        this.setupCamera();
        
        // Set up input
        this.setupInput();
        
        // Create preview objects
        this.createPreviewObjects();
        
        // Initialize preview objects from map data
        this.updatePreviewObjects();
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
    }

    createToolSelection() {
        const tools = [
            { name: 'Player', key: 'player', color: '#00ff00' },
            { name: 'Portal', key: 'portal', color: '#ff00ff' },
            { name: 'Enemy1', key: 'enemy1', color: '#ff0000' },
            { name: 'Enemy2', key: 'enemy2', color: '#ff8800' },
            { name: 'Ground', key: 'ground', color: '#8B4513' },
            { name: 'Platform', key: 'platform', color: '#FFFFFF' },
            { name: 'Wall', key: 'wall', color: '#696969' },
            { name: 'Erase', key: 'erase', color: '#000000' }
        ];

        this.selectedTool = null; // Start with no tool selected
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
                this.selectedTool = tool.key;
                this.updateToolSelection();
            });

            this.toolButtons.push({ button, tool });
        });
    }

    updateToolSelection() {
        this.toolButtons.forEach(({ button, tool }) => {
            button.setFill('#ffffff'); // Always white text
            button.setBackgroundColor(this.selectedTool === tool.key ? tool.color : '#444444');
        });
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
            console.log(`Click at (${pointer.x}, ${pointer.y}), isOnUI: ${isOnUI}`);
            
            if (isOnUI) {
                console.log('Click detected on UI - skipping object placement');
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
                if (this.selectedTool && ['ground', 'platform', 'wall', 'erase'].includes(this.selectedTool)) {
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
        
        // Camera controls
        this.cameraSpeed = 10; // Increased speed for better navigation
    }

    isClickOnUI(pointer) {
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
                console.log(`Click detected in UI bounds: (${bounds.x}, ${bounds.y}) to (${bounds.x + bounds.width}, ${bounds.y + bounds.height})`);
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
            console.log('No tool selected. Please select a tool first.');
            return;
        }
        
        console.log(`Placing ${this.selectedTool} at world coordinates: (${Math.round(x)}, ${Math.round(y)})`);
        
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
                this.placeTile(x, y, TilemapSystem.TILE_TYPES.GROUND);
                break;
            case 'platform':
                this.placeTile(x, y, TilemapSystem.TILE_TYPES.PLATFORM);
                break;
            case 'wall':
                this.placeTile(x, y, TilemapSystem.TILE_TYPES.WALL);
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

    placeTile(x, y, tileType) {
        // Convert world coordinates to tile coordinates
        const tilePos = this.tilemapSystem.worldToTile(x, y);
        
        // Check if coordinates are within bounds
        if (tilePos.x >= 0 && tilePos.x < this.tilemapSystem.mapWidth && 
            tilePos.y >= 0 && tilePos.y < this.tilemapSystem.mapHeight) {
            
            this.tilemapSystem.setTile(tilePos.x, tilePos.y, tileType);
            console.log(`Placed tile type ${tileType} at tile coordinates: (${tilePos.x}, ${tilePos.y})`);
        }
    }

    eraseTile(x, y) {
        // Convert world coordinates to tile coordinates
        const tilePos = this.tilemapSystem.worldToTile(x, y);
        
        // Check if coordinates are within bounds
        if (tilePos.x >= 0 && tilePos.x < this.tilemapSystem.mapWidth && 
            tilePos.y >= 0 && tilePos.y < this.tilemapSystem.mapHeight) {
            
            this.tilemapSystem.setTile(tilePos.x, tilePos.y, TilemapSystem.TILE_TYPES.EMPTY);
            console.log(`Erased tile at tile coordinates: (${tilePos.x}, ${tilePos.y})`);
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

    saveMap() {
        // Save tile data to map
        this.saveTileDataToMap();
        
        this.mapSystem.saveMap(this.mapData);
        console.log('Map saved from editor');
    }

    saveTileDataToMap() {
        // Convert tilemap data to map format
        if (!this.mapData.tiles) {
            this.mapData.tiles = [];
        }
        
        // Clear existing tile data
        this.mapData.tiles = [];
        
        // Save tile data
        for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
            this.mapData.tiles[y] = [];
            for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
                this.mapData.tiles[y][x] = this.tilemapSystem.getTile(x, y);
            }
        }
        
        console.log('Tile data saved to map');
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
                this.mapSystem.loadMap(file)
                    .then(mapData => {
                        this.mapData = mapData;
                        this.loadTileDataFromMap();
                        this.updatePreviewObjects();
                        console.log('Map loaded in editor:', mapData.metadata.name);
                    })
                    .catch(error => {
                        console.error('Error loading map:', error);
                        alert('Error loading map: ' + error.message);
                    });
            }
            document.body.removeChild(fileInput);
        });

        fileInput.click();
    }

    loadTileDataFromMap() {
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
                        this.tilemapSystem.setTile(x, y, this.mapData.tiles[y][x]);
                    }
                }
            }
            
            console.log('Tile data loaded from map');
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
        console.log('All objects and tiles cleared');
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
        
        this.coordinateText.setText(`Position: (${Math.round(worldX)}, ${Math.round(worldY)})`);
        
        // Update mouse indicator
        if (this.mouseIndicator) {
            this.mouseIndicator.setPosition(worldX, worldY);
            this.mouseIndicator.setVisible(true);
        }
    }
}
