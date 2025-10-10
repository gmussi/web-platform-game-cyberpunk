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
        
        // Initialize sprite indices storage
        this.tileSpriteIndices = [];
    }
    
    // Tile types - simplified to only EMPTY and SOLID for now
    static TILE_TYPES = {
        EMPTY: 0,
        SOLID: 1  // All non-zero values are treated as SOLID tiles
    };
    
    // Tile image mapping - maps tile types to specific tileset indices
    static TILE_IMAGES = {
        [TilemapSystem.TILE_TYPES.SOLID]: {
            GROUND: 0,    // First tile for ground
            WALL: 1,      // Second tile for walls  
            PLATFORM: 2   // Third tile for platforms
        }
    };
    
    // Set a tile at specific coordinates
    setTile(x, y, tileType, spriteIndex = null) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            this.tiles[y][x] = tileType;
            
            // Store sprite index for solid tiles
            if (tileType === TilemapSystem.TILE_TYPES.SOLID && spriteIndex !== null) {
                if (!this.tileSpriteIndices) {
                    this.tileSpriteIndices = [];
                }
                this.tileSpriteIndices[y] = this.tileSpriteIndices[y] || [];
                this.tileSpriteIndices[y][x] = spriteIndex;
            }
            
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
            // Get stored sprite index if available
            let spriteIndex = null;
            if (this.tileSpriteIndices && this.tileSpriteIndices[y] && this.tileSpriteIndices[y][x] !== undefined) {
                spriteIndex = this.tileSpriteIndices[y][x];
            }
            
            // Determine tile image based on context (fallback if no sprite index)
            let tileImage = 'ground'; // Default
            
            // For ground level tiles, use ground image
            if (y >= this.mapHeight - 3) {
                tileImage = 'ground';
            } else {
                // For other tiles, determine based on surrounding tiles
                const belowTile = this.getTile(x, y + 1);
                if (belowTile === TilemapSystem.TILE_TYPES.EMPTY) {
                    tileImage = 'platform'; // Floating tile
                } else {
                    tileImage = 'wall'; // Connected tile
                }
            }
            
            this.drawTileVisual(worldPos.x, worldPos.y, tileType, tileImage, spriteIndex);
        }
    }
    
    // Clear visual representation of a tile
    clearTileVisual(x, y) {
        // Find and destroy the specific tile sprite at this position
        if (this.tileSprites) {
            const worldPos = this.tileToWorld(x, y);
            const tileCenterX = worldPos.x + this.tileSize / 2;
            const tileCenterY = worldPos.y + this.tileSize / 2;
            
            // Find sprites at this position and destroy them
            for (let i = this.tileSprites.length - 1; i >= 0; i--) {
                const sprite = this.tileSprites[i];
                if (sprite && sprite.x === tileCenterX && sprite.y === tileCenterY) {
                    sprite.destroy();
                    this.tileSprites.splice(i, 1);
                }
            }
        }
    }
    
    // Draw visual representation of a tile using tileset textures
    drawTileVisual(worldX, worldY, tileType, tileImage = null, spriteIndex = null) {
        if (tileType === TilemapSystem.TILE_TYPES.EMPTY) {
            return;
        }
        
        // Check if tileset textures are ready
        if (!this.scene.textures.exists('tileset_sprites')) {
            console.warn('Tileset textures not ready yet, skipping tile visual');
            return;
        }
        
        console.log(`Drawing tile at (${worldX}, ${worldY}), type: ${tileType}, image: ${tileImage}, spriteIndex: ${spriteIndex}`);
        
        // Determine which tile image to use
        let tileIndex = 0; // Default to first tile
        
        if (tileType === TilemapSystem.TILE_TYPES.SOLID || tileType > 0) {
            // Use stored sprite index if available, otherwise determine by context
            if (spriteIndex !== null) {
                tileIndex = spriteIndex;
            } else if (tileImage === 'ground') {
                tileIndex = TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].GROUND;
            } else if (tileImage === 'wall') {
                tileIndex = TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].WALL;
            } else if (tileImage === 'platform') {
                tileIndex = TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].PLATFORM;
            } else {
                tileIndex = TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].GROUND; // Default
            }
        }
        
        console.log(`Using tileIndex: ${tileIndex} for tile at (${worldX}, ${worldY})`);
        
        // Create sprite for this tile using spritesheet frames
        const tileSprite = this.scene.add.image(worldX + this.tileSize/2, worldY + this.tileSize/2, 'tileset_sprites', tileIndex);
        tileSprite.setDisplaySize(this.tileSize, this.tileSize);
        tileSprite.setDepth(4); // Same depth as visual layer
        
        // Store reference for cleanup
        if (!this.tileSprites) {
            this.tileSprites = [];
        }
        this.tileSprites.push(tileSprite);
    }
    
    // Redraw the entire visual layer
    redrawVisualLayer() {
        // Clear existing tile sprites
        if (this.tileSprites) {
            this.tileSprites.forEach(sprite => sprite.destroy());
            this.tileSprites = [];
        }
        
        // Clear graphics layer (for any remaining graphics)
        this.visualLayer.clear();
        
        let tilesDrawn = 0;
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileType = this.tiles[y][x];
                if (tileType !== TilemapSystem.TILE_TYPES.EMPTY) {
                    const worldPos = this.tileToWorld(x, y);
                    
                    // Get stored sprite index if available
                    let spriteIndex = null;
                    if (this.tileSpriteIndices && this.tileSpriteIndices[y] && this.tileSpriteIndices[y][x] !== undefined) {
                        spriteIndex = this.tileSpriteIndices[y][x];
                    }
                    
                    // Determine tile image based on context (fallback if no sprite index)
                    let tileImage = 'ground'; // Default
                    
                    // For ground level tiles, use ground image
                    if (y >= this.mapHeight - 3) {
                        tileImage = 'ground';
                    } else {
                        // For other tiles, determine based on surrounding tiles
                        const belowTile = this.getTile(x, y + 1);
                        if (belowTile === TilemapSystem.TILE_TYPES.EMPTY) {
                            tileImage = 'platform'; // Floating tile
                        } else {
                            tileImage = 'wall'; // Connected tile
                        }
                    }
                    
                    this.drawTileVisual(worldPos.x, worldPos.y, tileType, tileImage, spriteIndex);
                    tilesDrawn++;
                    
                    // Debug: Log specific tile (120, 13)
                    if (x === 120 && y === 13) {
                        console.log(`Drawing tile at (120, 13): type=${tileType}, image=${tileImage}, spriteIndex=${spriteIndex}, worldPos=(${worldPos.x}, ${worldPos.y})`);
                    }
                }
            }
        }
        
        console.log(`RedrawVisualLayer: Drew ${tilesDrawn} tiles`);
    }
    
    // Method to redraw tiles after textures are ready
    redrawTilesAfterTexturesReady() {
        if (this.scene.textures.exists('tileset_sprites')) {
            console.log('Tileset textures ready, redrawing tiles...');
            this.redrawVisualLayer();
        } else {
            console.log('Tileset textures not ready yet, will retry...');
            // Retry after a short delay
            this.scene.time.delayedCall(100, () => {
                this.redrawTilesAfterTexturesReady();
            });
        }
    }
    
    // Create collision bodies for solid tiles using a single static group
    createCollisionBodies() {
        console.log('Creating collision bodies...');
        console.log(`Map dimensions: ${this.mapWidth}x${this.mapHeight}`);
        
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
        
        // Create individual collision bodies for solid tiles (excluding ground)
        let solidTilesCount = 0;
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileType = this.tiles[y][x];
                
                // Only create collision for solid tiles that are not part of the ground level
                if (this.isSolidTile(tileType) && y < this.mapHeight - 3) {
                    const worldPos = this.tileToWorld(x, y);
                    const collisionBody = this.createTileCollisionBody(worldPos.x, worldPos.y, tileType);
                    this.collisionBodies.push(collisionBody);
                    this.collisionGroup.add(collisionBody);
                    solidTilesCount++;
                }
            }
        }
        
        console.log(`Created ${solidTilesCount} individual collision bodies for solid tiles`);
        
        console.log(`Created ${this.collisionBodies.length} collision bodies for tilemap`);
        console.log(`Collision group size: ${this.collisionGroup.children.size}`);
        return this.collisionGroup;
    }
    
    // Check if a tile type is solid
    isSolidTile(tileType) {
        return tileType !== TilemapSystem.TILE_TYPES.EMPTY; // All non-zero values are solid
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
    
    // Level generation methods - DEPRECATED: Use loadTileDataFromMap instead
    generateGroundLevel() {
        console.warn('generateGroundLevel() is deprecated. Maps should be loaded from JSON files.');
        const groundY = this.mapHeight - 3; // Ground at bottom 3 rows
        
        console.log(`Generating ground level at tile Y=${groundY} (world Y=${groundY * this.tileSize})`);
        
        for (let x = 0; x < this.mapWidth; x++) {
            // Create ground tiles using SOLID type
            this.setTile(x, groundY, TilemapSystem.TILE_TYPES.SOLID);
            this.setTile(x, groundY + 1, TilemapSystem.TILE_TYPES.SOLID);
            this.setTile(x, groundY + 2, TilemapSystem.TILE_TYPES.SOLID);
        }
        
        console.log(`Created ground tiles from X=0 to X=${this.mapWidth-1}`);
    }
    
    generatePlatforms() {
        console.warn('generatePlatforms() is deprecated. Maps should be loaded from JSON files.');
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
                    this.setTile(x, y, TilemapSystem.TILE_TYPES.SOLID);
                }
            }
        });
    }
    
    generateWalls() {
        console.warn('generateWalls() is deprecated. Maps should be loaded from JSON files.');
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
                    this.setTile(x, y, TilemapSystem.TILE_TYPES.SOLID);
                }
            }
        });
    }
    
    // Generate a complete level - DEPRECATED: Use loadTileDataFromMap instead
    generateLevel() {
        console.warn('generateLevel() is deprecated. Maps should be loaded from JSON files.');
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
            // Find platform spawn position (solid tiles that are not ground)
            const platforms = [];
            for (let y = 0; y < this.mapHeight - 3; y++) { // Exclude ground level
                for (let x = 0; x < this.mapWidth; x++) {
                    if (this.tiles[y][x] === TilemapSystem.TILE_TYPES.SOLID) {
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
