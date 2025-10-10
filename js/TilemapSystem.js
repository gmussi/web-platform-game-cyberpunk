class TilemapSystem {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 32; // 32x32 pixel tiles
        this.mapWidth = 129; // 129 tiles wide (4128 pixels)
        this.mapHeight = 25; // 25 tiles tall (800 pixels)
        this.tiles = [];
        this.collisionLayer = null;
        this.visualLayer = null;
        
        // Initialize empty tilemap
        this.initializeTilemap();
    }
    
    initializeTilemap() {
        // Create 2D array for tile data
        this.tiles = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.tiles[y][x] = 0; // 0 = empty
            }
        }
        
        // Create visual layer
        this.visualLayer = this.scene.add.graphics();
        this.visualLayer.setDepth(4);
        this.visualLayer.setVisible(true);
        console.log('Visual layer created with depth 4');
        
        // Initialize collision bodies array
        this.collisionBodies = [];
    }
    
    // Tile types
    static TILE_TYPES = {
        EMPTY: 0,
        GROUND: 1,
        WALL: 2,
        PLATFORM: 3,
        SPIKE: 4,
        LADDER: 5,
        WATER: 6
    };
    
    // Set a tile at specific coordinates
    setTile(x, y, tileType) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            this.tiles[y][x] = tileType;
            this.updateTileVisual(x, y);
        }
    }
    
    // Get tile type at coordinates
    getTile(x, y) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            return this.tiles[y][x];
        }
        return TilemapSystem.TILE_TYPES.EMPTY;
    }
    
    // Convert world coordinates to tile coordinates
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }
    
    // Convert tile coordinates to world coordinates
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
        };
    }
    
    // Update visual representation of a single tile
    updateTileVisual(x, y) {
        const tileType = this.tiles[y][x];
        const worldPos = this.tileToWorld(x, y);
        
        // Clear existing visual for this tile
        this.clearTileVisual(x, y);
        
        if (tileType !== TilemapSystem.TILE_TYPES.EMPTY) {
            this.drawTileVisual(worldPos.x, worldPos.y, tileType);
        }
    }
    
    // Clear visual representation of a tile
    clearTileVisual(x, y) {
        const worldPos = this.tileToWorld(x, y);
        // We'll redraw the entire layer for simplicity
        this.redrawVisualLayer();
    }
    
    // Draw visual representation of a tile
    drawTileVisual(worldX, worldY, tileType) {
        const graphics = this.visualLayer;
        
        switch (tileType) {
            case TilemapSystem.TILE_TYPES.GROUND:
                // Brown ground tiles
                graphics.fillStyle(0x8B4513);
                graphics.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                graphics.lineStyle(1, 0x654321);
                graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
                break;
                
            case TilemapSystem.TILE_TYPES.WALL:
                // Gray wall tiles
                graphics.fillStyle(0x696969);
                graphics.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                graphics.lineStyle(1, 0x2F2F2F);
                graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
                break;
                
            case TilemapSystem.TILE_TYPES.PLATFORM:
                // White platform tiles
                graphics.fillStyle(0xFFFFFF);
                graphics.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                graphics.lineStyle(1, 0x00FFFF);
                graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
                break;
                
            case TilemapSystem.TILE_TYPES.SPIKE:
                // Red spike tiles
                graphics.fillStyle(0xFF0000);
                graphics.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                graphics.lineStyle(1, 0x8B0000);
                graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
                break;
                
            case TilemapSystem.TILE_TYPES.LADDER:
                // Blue ladder tiles
                graphics.fillStyle(0x0000FF);
                graphics.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                graphics.lineStyle(1, 0x000080);
                graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
                break;
                
            case TilemapSystem.TILE_TYPES.WATER:
                // Blue water tiles
                graphics.fillStyle(0x0066CC);
                graphics.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                graphics.lineStyle(1, 0x004499);
                graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
                break;
        }
    }
    
    // Redraw the entire visual layer
    redrawVisualLayer() {
        this.visualLayer.clear();
        
        let tilesDrawn = 0;
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileType = this.tiles[y][x];
                if (tileType !== TilemapSystem.TILE_TYPES.EMPTY) {
                    const worldPos = this.tileToWorld(x, y);
                    this.drawTileVisual(worldPos.x, worldPos.y, tileType);
                    tilesDrawn++;
                    
                    // Debug: Log specific tile (120, 13)
                    if (x === 120 && y === 13) {
                        console.log(`Drawing tile at (120, 13): type=${tileType}, worldPos=(${worldPos.x}, ${worldPos.y})`);
                    }
                }
            }
        }
        
        console.log(`RedrawVisualLayer: Drew ${tilesDrawn} tiles`);
    }
    
    // Create collision bodies for solid tiles using a single static group
    createCollisionBodies() {
        // Clear existing collision bodies
        this.collisionBodies = [];
        
        // Create a static group for all collision bodies
        this.collisionGroup = this.scene.physics.add.staticGroup();
        
        // Create a single large ground collision body instead of individual tiles
        const groundTileY = this.mapHeight - 3; // Ground starts at row 22
        const groundWorldY = groundTileY * this.tileSize; // Convert to world coordinates
        const groundWidth = this.mapWidth * this.tileSize; // Full width
        const groundHeight = 3 * this.tileSize; // 3 rows high
        
        // Create single ground collision body
        const groundBody = this.scene.add.rectangle(groundWidth/2, groundWorldY + groundHeight/2, groundWidth, groundHeight);
        this.scene.physics.add.existing(groundBody);
        groundBody.body.setImmovable(true);
        groundBody.body.setAllowGravity(false);
        groundBody.setVisible(false); // Invisible collision body
        
        this.collisionBodies.push(groundBody);
        this.collisionGroup.add(groundBody);
        
        console.log(`Created single ground collision body: width=${groundWidth}, height=${groundHeight}, y=${groundWorldY + groundHeight/2}`);
        
        // Create individual collision bodies for platforms and walls
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileType = this.tiles[y][x];
                
                // Only create collision for non-ground solid tiles
                if (this.isSolidTile(tileType) && tileType !== TilemapSystem.TILE_TYPES.GROUND) {
                    const worldPos = this.tileToWorld(x, y);
                    const collisionBody = this.createTileCollisionBody(worldPos.x, worldPos.y, tileType);
                    this.collisionBodies.push(collisionBody);
                    this.collisionGroup.add(collisionBody);
                }
            }
        }
        
        console.log(`Created ${this.collisionBodies.length} collision bodies for tilemap`);
        console.log(`Collision group size: ${this.collisionGroup.children.size}`);
        return this.collisionGroup;
    }
    
    // Check if a tile type is solid
    isSolidTile(tileType) {
        return tileType === TilemapSystem.TILE_TYPES.GROUND ||
               tileType === TilemapSystem.TILE_TYPES.WALL ||
               tileType === TilemapSystem.TILE_TYPES.PLATFORM;
    }
    
    // Create collision body for a tile
    createTileCollisionBody(worldX, worldY, tileType) {
        // Create physics body
        const tileBody = this.scene.add.rectangle(worldX + this.tileSize/2, worldY + this.tileSize/2, this.tileSize, this.tileSize);
        this.scene.physics.add.existing(tileBody);
        tileBody.body.setImmovable(true);
        tileBody.body.setAllowGravity(false);
        tileBody.setVisible(false); // Invisible collision body
        
        console.log(`Created collision body at (${worldX}, ${worldY}) for tile type ${tileType}`);
        
        return tileBody;
    }
    
    // Level generation methods
    generateGroundLevel() {
        const groundY = this.mapHeight - 3; // Ground at bottom 3 rows
        
        console.log(`Generating ground level at tile Y=${groundY} (world Y=${groundY * this.tileSize})`);
        
        for (let x = 0; x < this.mapWidth; x++) {
            // Create ground tiles
            this.setTile(x, groundY, TilemapSystem.TILE_TYPES.GROUND);
            this.setTile(x, groundY + 1, TilemapSystem.TILE_TYPES.GROUND);
            this.setTile(x, groundY + 2, TilemapSystem.TILE_TYPES.GROUND);
        }
        
        console.log(`Created ground tiles from X=0 to X=${this.mapWidth-1}`);
    }
    
    generatePlatforms() {
        // Create some floating platforms
        const platforms = [
            { x: 10, y: 15, width: 4, height: 1 },
            { x: 20, y: 12, width: 3, height: 1 },
            { x: 30, y: 18, width: 5, height: 1 },
            { x: 45, y: 14, width: 4, height: 1 },
            { x: 60, y: 16, width: 3, height: 1 },
            { x: 80, y: 13, width: 4, height: 1 },
            { x: 100, y: 17, width: 3, height: 1 }
        ];
        
        platforms.forEach(platform => {
            for (let x = platform.x; x < platform.x + platform.width; x++) {
                for (let y = platform.y; y < platform.y + platform.height; y++) {
                    this.setTile(x, y, TilemapSystem.TILE_TYPES.PLATFORM);
                }
            }
        });
    }
    
    generateWalls() {
        // Create some walls
        const walls = [
            { x: 15, y: 10, width: 1, height: 8 },
            { x: 25, y: 8, width: 1, height: 10 },
            { x: 40, y: 12, width: 1, height: 6 },
            { x: 70, y: 9, width: 1, height: 9 }
        ];
        
        walls.forEach(wall => {
            for (let x = wall.x; x < wall.x + wall.width; x++) {
                for (let y = wall.y; y < wall.y + wall.height; y++) {
                    this.setTile(x, y, TilemapSystem.TILE_TYPES.WALL);
                }
            }
        });
    }
    
    // Generate a complete level
    generateLevel() {
        this.generateGroundLevel();
        this.generatePlatforms();
        this.generateWalls();
        this.redrawVisualLayer();
        this.createCollisionBodies();
    }
    
    // Check collision at world coordinates
    checkCollision(worldX, worldY) {
        const tilePos = this.worldToTile(worldX, worldY);
        const tileType = this.getTile(tilePos.x, tilePos.y);
        return this.isSolidTile(tileType);
    }
    
    // Get spawn position for enemies (on ground or platforms)
    findEnemySpawnPosition(preferGround = true) {
        if (preferGround) {
            // Find ground spawn position
            const groundY = this.mapHeight - 3;
            const x = Math.floor(Math.random() * this.mapWidth);
            const worldPos = this.tileToWorld(x, groundY);
            return {
                x: worldPos.x + this.tileSize / 2,
                y: worldPos.y - 16 // Half tile above ground
            };
        } else {
            // Find platform spawn position
            const platforms = [];
            for (let y = 0; y < this.mapHeight; y++) {
                for (let x = 0; x < this.mapWidth; x++) {
                    if (this.tiles[y][x] === TilemapSystem.TILE_TYPES.PLATFORM) {
                        platforms.push({ x, y });
                    }
                }
            }
            
            if (platforms.length > 0) {
                const platform = platforms[Math.floor(Math.random() * platforms.length)];
                const worldPos = this.tileToWorld(platform.x, platform.y);
                return {
                    x: worldPos.x + this.tileSize / 2,
                    y: worldPos.y - 16 // Half tile above platform
                };
            }
        }
        
        // Fallback to ground spawn
        return this.findEnemySpawnPosition(true);
    }
}
