import { GAME_CONSTANTS } from "../data/config";
import { MapTile } from "../types/map";
import { AutotileSystem } from "./AutotileSystem";

export class TilemapSystem {
  public scene: Phaser.Scene;
  public tileSize: number;
  public mapWidth: number;
  public mapHeight: number;
  public tiles: number[][];
  public collisionLayer: any;
  public visualLayer: Phaser.GameObjects.Graphics;
  public collisionBodies: any[];
  public collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
  public tileSpriteIndices: (number | null)[][];
  public tileSprites: Phaser.GameObjects.Image[];
  public autoTileSystem!: AutotileSystem;

  constructor(
    scene: Phaser.Scene,
    initialWidth: number = 129,
    initialHeight: number = 25
  ) {
    this.scene = scene;
    this.tileSize = 32; // 32x32 pixel tiles
    this.mapWidth = initialWidth; // Use provided width or default to 129 tiles
    this.mapHeight = initialHeight; // Use provided height or default to 25 tiles
    this.tiles = [];
    this.collisionLayer = null;
    this.visualLayer = null as any;

    // Initialize empty tilemap
    this.initializeTilemap();
  }

  private initializeTilemap(): void {
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
    this.tileSprites = [];

    // Initialize autotile system
    this.autoTileSystem = new AutotileSystem(
      this.scene,
      (x: number, y: number) => this.getTile(x, y),
      this.mapWidth,
      this.mapHeight
    );
  }

  // Tile types - simplified to only EMPTY and SOLID for now
  static TILE_TYPES = {
    EMPTY: 0,
    SOLID: 1, // All non-zero values are treated as SOLID tiles
  };

  // Tile image mapping - maps tile types to specific tileset indices
  static TILE_IMAGES = {
    [TilemapSystem.TILE_TYPES.SOLID]: {
      GROUND: 0, // First tile for ground
      WALL: 1, // Second tile for walls
      PLATFORM: 2, // Third tile for platforms
    },
  };

  // Set a tile at specific coordinates
  public setTile(
    x: number,
    y: number,
    tileType: number,
    spriteIndex: number | null = null
  ): void {
    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      this.tiles[y][x] = tileType;

      // Handle sprite index storage based on autotiling state
      if (tileType === TilemapSystem.TILE_TYPES.SOLID) {
        if (!this.tileSpriteIndices) {
          this.tileSpriteIndices = [];
        }
        this.tileSpriteIndices[y] = this.tileSpriteIndices[y] || [];

        if (this.autoTileSystem?.isEnabled()) {
          // Autotiling enabled: clear manual sprite index, let autotile system handle it
          this.tileSpriteIndices[y][x] = null;
        } else {
          // Autotiling disabled: store the provided sprite index (manual mode)
          this.tileSpriteIndices[y][x] = spriteIndex;
        }
      }

      // Update this tile and all neighbors
      if (this.autoTileSystem?.isEnabled()) {
        const tilesToUpdate = this.autoTileSystem.getTilesToUpdate(x, y);
        tilesToUpdate.forEach((tile) => {
          this.updateTileVisual(tile.x, tile.y);
        });
      } else {
        this.updateTileVisual(x, y);
      }
    } else {
      console.warn(
        `⚠️ setTile: Coordinates (${x}, ${y}) out of bounds (${this.mapWidth}, ${this.mapHeight})`
      );
    }
  }

  // Get tile type at coordinates
  public getTile(x: number, y: number): number {
    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      return this.tiles[y][x];
    }
    return TilemapSystem.TILE_TYPES.EMPTY;
  }

  // Get tile sprite index at coordinates
  public getTileSpriteIndex(x: number, y: number): number | null {
    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      if (
        this.tileSpriteIndices &&
        this.tileSpriteIndices[y] &&
        this.tileSpriteIndices[y][x] !== undefined
      ) {
        return this.tileSpriteIndices[y][x];
      }
    }
    return null;
  }

  // Convert world coordinates to tile coordinates
  public worldToTile(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize),
    };
  }

  // Convert tile coordinates to world coordinates
  public tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * this.tileSize,
      y: tileY * this.tileSize,
    };
  }

  // Update visual representation of a single tile
  private updateTileVisual(x: number, y: number): void {
    const tileType = this.tiles[y][x];
    const worldPos = this.tileToWorld(x, y);

    // Clear existing visual for this tile
    this.clearTileVisual(x, y);

    if (tileType !== TilemapSystem.TILE_TYPES.EMPTY) {
      let spriteIndex: number | null = null;

      // Use autotile system if enabled, otherwise use stored sprite index
      if (this.autoTileSystem?.isEnabled()) {
        spriteIndex = this.autoTileSystem.calculateTileIndex(x, y);
      } else {
        // Get stored sprite index if available (manual mode)
        if (
          this.tileSpriteIndices &&
          this.tileSpriteIndices[y] &&
          this.tileSpriteIndices[y][x] !== undefined
        ) {
          spriteIndex = this.tileSpriteIndices[y][x];
        }
      }

      // Determine tile image based on context (fallback if no sprite index)
      let tileImage: string = "ground"; // Default

      // For ground level tiles, use ground image
      if (y >= this.mapHeight - 3) {
        tileImage = "ground";
      } else {
        // For other tiles, determine based on surrounding tiles
        const belowTile = this.getTile(x, y + 1);
        if (belowTile === TilemapSystem.TILE_TYPES.EMPTY) {
          tileImage = "platform"; // Floating tile
        } else {
          tileImage = "wall"; // Connected tile
        }
      }

      this.drawTileVisual(
        worldPos.x,
        worldPos.y,
        tileType,
        tileImage,
        spriteIndex
      );
    }
  }

  // Clear visual representation of a tile
  private clearTileVisual(x: number, y: number): void {
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
  private drawTileVisual(
    worldX: number,
    worldY: number,
    tileType: number,
    tileImage: string | null = null,
    spriteIndex: number | null = null
  ): void {
    if (tileType === TilemapSystem.TILE_TYPES.EMPTY) {
      return;
    }

    // Check if tileset textures are ready
    if (!this.scene.textures.exists("tileset_sprites")) {
      console.warn("Tileset textures not ready yet, skipping tile visual");
      return;
    }

    // Determine which tile image to use
    let tileIndex = 0; // Default to first tile

    if (tileType === TilemapSystem.TILE_TYPES.SOLID || tileType > 0) {
      // Use stored sprite index if available, otherwise determine by context
      if (spriteIndex !== null) {
        tileIndex = spriteIndex;
      } else if (tileImage === "ground") {
        tileIndex =
          TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].GROUND;
      } else if (tileImage === "wall") {
        tileIndex =
          TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].WALL;
      } else if (tileImage === "platform") {
        tileIndex =
          TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].PLATFORM;
      } else {
        tileIndex =
          TilemapSystem.TILE_IMAGES[TilemapSystem.TILE_TYPES.SOLID].GROUND; // Default
      }
    }

    // Create sprite for this tile using spritesheet frames
    const tileSprite = this.scene.add.image(
      worldX + this.tileSize / 2,
      worldY + this.tileSize / 2,
      "tileset_sprites",
      tileIndex
    );
    tileSprite.setDisplaySize(this.tileSize, this.tileSize);
    tileSprite.setDepth(4); // Same depth as visual layer

    // Store reference for cleanup
    if (!this.tileSprites) {
      this.tileSprites = [];
    }
    this.tileSprites.push(tileSprite);
  }

  // Redraw the entire visual layer
  public redrawVisualLayer(): void {
    // Clear existing tile sprites
    if (this.tileSprites) {
      this.tileSprites.forEach((sprite) => sprite.destroy());
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
          let spriteIndex: number | null = null;
          if (
            this.tileSpriteIndices &&
            this.tileSpriteIndices[y] &&
            this.tileSpriteIndices[y][x] !== undefined
          ) {
            spriteIndex = this.tileSpriteIndices[y][x];
          }

          // If autotiling is disabled and we have a stored sprite index, use it
          if (!this.autoTileSystem?.isEnabled() && spriteIndex !== null) {
            // Use the stored sprite index for manual tiles
          } else if (this.autoTileSystem?.isEnabled()) {
            // Use autotile system to calculate sprite index
            spriteIndex = this.autoTileSystem.calculateTileIndex(x, y);
          }

          // Determine tile image based on context (fallback if no sprite index)
          let tileImage: string = "ground"; // Default

          // For ground level tiles, use ground image
          if (y >= this.mapHeight - 3) {
            tileImage = "ground";
          } else {
            // For other tiles, determine based on surrounding tiles
            const belowTile = this.getTile(x, y + 1);
            if (belowTile === TilemapSystem.TILE_TYPES.EMPTY) {
              tileImage = "platform"; // Floating tile
            } else {
              tileImage = "wall"; // Connected tile
            }
          }

          this.drawTileVisual(
            worldPos.x,
            worldPos.y,
            tileType,
            tileImage,
            spriteIndex
          );
          tilesDrawn++;
        }
      }
    }
  }

  // Method to redraw tiles after textures are ready
  public redrawTilesAfterTexturesReady(): void {
    if (this.scene.textures.exists("tileset_sprites")) {
      this.redrawVisualLayer();
    } else {
      // Retry after a short delay
      this.scene.time.delayedCall(100, () => {
        this.redrawTilesAfterTexturesReady();
      });
    }
  }

  // Create collision bodies for solid tiles using a single static group
  public createCollisionBodies(): Phaser.Physics.Arcade.StaticGroup {
    // Clear existing collision bodies
    this.collisionBodies = [];

    // Create a static group for all collision bodies
    this.collisionGroup = this.scene.physics.add.staticGroup();

    // Create individual collision bodies for ALL solid tiles (including ground)
    let solidTilesCount = 0;
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = this.tiles[y][x];

        // Create collision for ALL solid tiles (including ground level)
        if (this.isSolidTile(tileType)) {
          const worldPos = this.tileToWorld(x, y);
          const collisionBody = this.createTileCollisionBody(
            worldPos.x,
            worldPos.y,
            tileType
          );
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
  private isSolidTile(tileType: number): boolean {
    return tileType !== TilemapSystem.TILE_TYPES.EMPTY; // All non-zero values are solid
  }

  // Create collision body for a tile
  private createTileCollisionBody(
    worldX: number,
    worldY: number,
    tileType: number
  ): any {
    // Create physics body
    const tileBody = this.scene.add.rectangle(
      worldX + this.tileSize / 2,
      worldY + this.tileSize / 2,
      this.tileSize,
      this.tileSize
    );
    this.scene.physics.add.existing(tileBody);
    tileBody.body.setImmovable(true);
    tileBody.body.setAllowGravity(false);
    tileBody.setVisible(false); // Invisible collision body

    return tileBody;
  }

  // Check collision at world coordinates
  public checkCollision(worldX: number, worldY: number): boolean {
    const tilePos = this.worldToTile(worldX, worldY);
    const tileType = this.getTile(tilePos.x, tilePos.y);
    return this.isSolidTile(tileType);
  }

  // Get spawn position for enemies (on ground or platforms)
  public findEnemySpawnPosition(preferGround: boolean = true): {
    x: number;
    y: number;
  } {
    if (preferGround) {
      // Find ground spawn position
      const groundY = this.mapHeight - 3;
      const x = Math.floor(Math.random() * this.mapWidth);
      const worldPos = this.tileToWorld(x, groundY);
      return {
        x: worldPos.x + this.tileSize / 2,
        y: worldPos.y - 16, // Half tile above ground
      };
    } else {
      // Find platform spawn position (solid tiles that are not ground)
      const platforms: { x: number; y: number }[] = [];
      for (let y = 0; y < this.mapHeight - 3; y++) {
        // Exclude ground level
        for (let x = 0; x < this.mapWidth; x++) {
          if (this.tiles[y][x] === TilemapSystem.TILE_TYPES.SOLID) {
            platforms.push({ x, y });
          }
        }
      }

      if (platforms.length > 0) {
        const platform =
          platforms[Math.floor(Math.random() * platforms.length)];
        const worldPos = this.tileToWorld(platform.x, platform.y);
        return {
          x: worldPos.x + this.tileSize / 2,
          y: worldPos.y - 16, // Half tile above platform
        };
      }
    }

    // Fallback to ground spawn
    return this.findEnemySpawnPosition(true);
  }

  // Resize the tilemap to new dimensions
  public resizeMap(newWidth: number, newHeight: number): void {
    const oldWidth = this.mapWidth;
    const oldHeight = this.mapHeight;

    // Create new tile arrays
    const newTiles: number[][] = [];
    const newTileSpriteIndices: (number | null)[][] = [];

    // Initialize new arrays
    for (let y = 0; y < newHeight; y++) {
      newTiles[y] = [];
      newTileSpriteIndices[y] = [];
      for (let x = 0; x < newWidth; x++) {
        newTiles[y][x] = TilemapSystem.TILE_TYPES.EMPTY;
        newTileSpriteIndices[y][x] = null;
      }
    }

    // Copy existing tile data
    for (let y = 0; y < Math.min(oldHeight, newHeight); y++) {
      for (let x = 0; x < Math.min(oldWidth, newWidth); x++) {
        newTiles[y][x] = this.tiles[y][x];
        if (
          this.tileSpriteIndices[y] &&
          this.tileSpriteIndices[y][x] !== undefined
        ) {
          newTileSpriteIndices[y][x] = this.tileSpriteIndices[y][x];
        }
      }
    }

    // Update dimensions
    this.mapWidth = newWidth;
    this.mapHeight = newHeight;
    this.tiles = newTiles;
    this.tileSpriteIndices = newTileSpriteIndices;

    // Update autotile system dimensions
    if (this.autoTileSystem) {
      this.autoTileSystem.updateDimensions(newWidth, newHeight);
    }

    // Clear existing visuals and collision bodies
    this.clearAllVisuals();
    this.clearCollisionBodies();

    // Redraw everything
    this.redrawVisualLayer();
    this.createCollisionBodies();
  }

  // Clear all visual elements
  private clearAllVisuals(): void {
    if (this.tileSprites) {
      this.tileSprites.forEach((sprite) => sprite.destroy());
      this.tileSprites = [];
    }
    if (this.visualLayer) {
      this.visualLayer.clear();
    }
  }

  // Clear collision bodies
  private clearCollisionBodies(): void {
    if (this.collisionGroup) {
      this.collisionGroup.clear(false, true);
    }
    this.collisionBodies = [];
  }

  // Get world dimensions in pixels
  public getWorldWidth(): number {
    return this.mapWidth * this.tileSize;
  }

  // Get world height in pixels
  public getWorldHeight(): number {
    return this.mapHeight * this.tileSize;
  }
}
