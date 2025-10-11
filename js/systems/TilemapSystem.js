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
    
    // Get tile sprite index at coordinates
    getTileSpriteIndex(x, y) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            if (this.tileSpriteIndices && this.tileSpriteIndices[y] && this.tileSpriteIndices[y][x] !== undefined) {
                return this.tileSpriteIndices[y][x];
            }
        }
        return null;
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
                    }
                }
            }
        }
        
    }
    
    // Method to redraw tiles after textures are ready
    redrawTilesAfterTexturesReady() {
        if (this.scene.textures.exists('tileset_sprites')) {
            this.redrawVisualLayer();
        } else {
            // Retry after a short delay
            this.scene.time.delayedCall(100, () => {
                this.redrawTilesAfterTexturesReady();
            });
        }
    }
    
    // Create collision bodies for solid tiles using a single static group
    createCollisionBodies() {
        
        // Clear existing collision bodies
        this.collisionBodies = [];
        
        // Create a static group for all collision bodies
        this.collisionGroup = this.scene.physics.add.staticGroup();
        
        // No separate ground collision body - ground is created using individual solid tiles
        
        
        // Create individual collision bodies for ALL solid tiles (including ground)
        let solidTilesCount = 0;
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileType = this.tiles[y][x];
                
                // Create collision for ALL solid tiles (including ground level)
                if (this.isSolidTile(tileType)) {
                    const worldPos = this.tileToWorld(x, y);
                    const collisionBody = this.createTileCollisionBody(worldPos.x, worldPos.y, tileType);
                    this.collisionBodies.push(collisionBody);
                    this.collisionGroup.add(collisionBody);
                    solidTilesCount++;
                }
            }
        }
        
        
        // Total collision bodies created
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
        
        
        return tileBody;
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
