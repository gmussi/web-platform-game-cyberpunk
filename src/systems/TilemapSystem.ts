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
  public platformBodies: any[];
  public platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  public tileSpriteIndices: (number | null)[][];
  public tileSprites: Phaser.GameObjects.GameObject[];
  public autoTileSystem!: AutotileSystem;
  // Additional layers
  public wallsIndices: (number | null)[][] = [];
  public decorationIndices: (number | null)[][] = [];
  public wallsSprites: Phaser.GameObjects.Image[] = [];
  public decorationSprites: Phaser.GameObjects.Image[] = [];
  public wallsVisible: boolean = true;
  public decorationVisible: boolean = true;
  public gameVisible: boolean = true;
  // City background layers (parallax)
  public cityBackSprite: Phaser.GameObjects.TileSprite | null = null;
  public cityFrontSprite: Phaser.GameObjects.TileSprite | null = null;
  public cityVariant: string | null = null;

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
    this.platformBodies = [];

    // Initialize sprite indices storage
    this.tileSpriteIndices = [];
    this.tileSprites = [];

    // Initialize extra layer storages
    for (let y = 0; y < this.mapHeight; y++) {
      this.wallsIndices[y] = [];
      this.decorationIndices[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        this.wallsIndices[y][x] = null;
        this.decorationIndices[y][x] = null;
      }
    }

    // Initialize autotile system
    this.autoTileSystem = new AutotileSystem(
      this.scene,
      (x: number, y: number) => this.getTile(x, y),
      this.mapWidth,
      this.mapHeight
    );
  }

  public setLayerVisible(
    layer: "walls" | "decoration" | "game",
    visible: boolean
  ): void {
    if (layer === "walls") {
      this.wallsVisible = visible;
      this.wallsSprites.forEach((s) => s.setVisible(visible));
    } else if (layer === "decoration") {
      this.decorationVisible = visible;
      this.decorationSprites.forEach((s) => s.setVisible(visible));
    } else if (layer === "game") {
      this.gameVisible = visible;
      this.tileSprites.forEach((s) => s.setVisible(visible));
      this.visualLayer.setVisible(visible);
    }
  }

  public setWalls(x: number, y: number, frame: number | null): void {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return;
    this.wallsIndices[y][x] = frame;
    this.updateWallsVisual(x, y);
  }

  public getWalls(x: number, y: number): number | null {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight)
      return null;
    return this.wallsIndices[y]?.[x] ?? null;
  }

  public setDecoration(x: number, y: number, frame: number | null): void {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return;
    this.decorationIndices[y][x] = frame;
    this.updateDecorationVisual(x, y);
  }

  public getDecoration(x: number, y: number): number | null {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight)
      return null;
    return this.decorationIndices[y]?.[x] ?? null;
  }

  /**
   * Set city background with parallax layers
   * Depth layers:
   * 0: City background (back) - scrollFactor 0.2
   * 0.5: City background (front) - scrollFactor 0.5
   * 1: Walls/Background tiles - scrollFactor 1.0
   * 3: Decoration tiles - scrollFactor 1.0
   * 4: Game collision tiles - scrollFactor 1.0
   */
  public setCityBackground(variant: string | null): void {
    console.log(`🏙️ setCityBackground called with variant: ${variant}`);

    // Clear existing city backgrounds
    this.clearCityBackground();

    if (!variant) {
      this.cityVariant = null;
      console.log(`🏙️ No variant specified, city background cleared`);
      return;
    }

    this.cityVariant = variant;
    const worldWidth = this.getWorldWidth();
    const worldHeight = this.getWorldHeight();
    console.log(`🏙️ World dimensions: ${worldWidth}x${worldHeight}`);

    // Get camera reference for debug logging later
    const camera = this.scene.cameras.main;

    // Check if textures exist
    const backTextureKey = `${variant}_back`;
    const frontTextureKey = `${variant}_front`;
    console.log(
      `🏙️ Looking for textures: ${backTextureKey}, ${frontTextureKey}`
    );

    if (!this.scene.textures.exists(backTextureKey)) {
      console.warn(`❌ City back texture not found: ${backTextureKey}`);
      return;
    }
    if (!this.scene.textures.exists(frontTextureKey)) {
      console.warn(`❌ City front texture not found: ${frontTextureKey}`);
      return;
    }
    console.log(`✅ Both textures found`);

    // Get texture dimensions
    const backTexture = this.scene.textures.get(backTextureKey);
    const frontTexture = this.scene.textures.get(frontTextureKey);
    const backWidth = backTexture.source[0].width;
    const backHeight = backTexture.source[0].height;
    const frontWidth = frontTexture.source[0].width;
    const frontHeight = frontTexture.source[0].height;
    console.log(`🏙️ Back texture size: ${backWidth}x${backHeight}`);
    console.log(`🏙️ Front texture size: ${frontWidth}x${frontHeight}`);

    // Create back layer (deeper parallax)
    // Size to ONLY cover the tile grid area (worldWidth x worldHeight)
    // Position centered in the tile grid to fill from (0,0) to (worldWidth, worldHeight)
    this.cityBackSprite = this.scene.add.tileSprite(
      worldWidth / 2,
      worldHeight / 2,
      worldWidth,
      worldHeight,
      backTextureKey
    );
    this.cityBackSprite.setOrigin(0.5, 0.5);
    this.cityBackSprite.setDepth(0);
    this.cityBackSprite.setScrollFactor(1.0); // Move with camera (stay aligned with tiles)
    // Tile horizontally only (width=1), no vertical tiling needed
    this.cityBackSprite.setTileScale(1, 1);
    // Store for parallax updates in game loop
    (this.cityBackSprite as any).parallaxFactor = 0.2; // Texture scrolls at 20% speed
    console.log(
      `🏙️ Back sprite created at (${worldWidth / 2}, ${
        worldHeight / 2
      }), size: ${worldWidth}x${worldHeight}, depth: 0, scrollFactor: 1.0, parallaxFactor: 0.2`
    );
    console.log(
      `🏙️ Back sprite position: (${this.cityBackSprite.x}, ${this.cityBackSprite.y}), origin: (${this.cityBackSprite.originX}, ${this.cityBackSprite.originY})`
    );
    console.log(
      `🏙️ Back sprite visible: ${this.cityBackSprite.visible}, active: ${this.cityBackSprite.active}`
    );
    console.log(
      `🏙️ Back sprite displayWidth: ${this.cityBackSprite.displayWidth}, displayHeight: ${this.cityBackSprite.displayHeight}`
    );
    console.log(
      `🏙️ Back sprite tilePositionX: ${this.cityBackSprite.tilePositionX}, tilePositionY: ${this.cityBackSprite.tilePositionY}`
    );

    // Create front layer (moderate parallax)
    // Front layer uses natural height and is positioned at bottom (ground level)
    // Width matches tile grid width for horizontal coverage
    const frontSpriteHeight = Math.min(frontHeight, worldHeight);
    const frontYPosition = worldHeight - frontSpriteHeight / 2;
    this.cityFrontSprite = this.scene.add.tileSprite(
      worldWidth / 2,
      frontYPosition,
      worldWidth,
      frontSpriteHeight,
      frontTextureKey
    );
    this.cityFrontSprite.setOrigin(0.5, 0.5);
    this.cityFrontSprite.setDepth(0.5);
    this.cityFrontSprite.setScrollFactor(1.0); // Move with camera (stay aligned with tiles)
    // Tile horizontally only (width=1), no vertical tiling needed
    this.cityFrontSprite.setTileScale(1, 1);
    // Store for parallax updates in game loop
    (this.cityFrontSprite as any).parallaxFactor = 0.5; // Texture scrolls at 50% speed
    console.log(
      `🏙️ Front sprite created at (${
        worldWidth / 2
      }, ${frontYPosition}), size: ${worldWidth}x${frontSpriteHeight}, depth: 0.5, scrollFactor: 1.0, parallaxFactor: 0.5`
    );
    console.log(
      `🏙️ Front sprite position: (${this.cityFrontSprite.x}, ${this.cityFrontSprite.y}), origin: (${this.cityFrontSprite.originX}, ${this.cityFrontSprite.originY})`
    );
    console.log(
      `🏙️ Front sprite visible: ${this.cityFrontSprite.visible}, active: ${this.cityFrontSprite.active}`
    );
    console.log(
      `🏙️ Front sprite displayWidth: ${this.cityFrontSprite.displayWidth}, displayHeight: ${this.cityFrontSprite.displayHeight}`
    );
    console.log(
      `🏙️ Front sprite tilePositionX: ${this.cityFrontSprite.tilePositionX}, tilePositionY: ${this.cityFrontSprite.tilePositionY}`
    );

    // Log camera and world bounds info (reusing camera variable from above)
    console.log(`🎥 Camera position: (${camera.scrollX}, ${camera.scrollY})`);
    console.log(
      `🎥 Camera bounds: x=${camera.x}, y=${camera.y}, width=${camera.width}, height=${camera.height}`
    );
    console.log(`🎥 Camera zoom: ${camera.zoom}`);
    const physicsWorld = this.scene.physics.world;
    console.log(
      `🌍 Physics world bounds: x=${physicsWorld.bounds.x}, y=${physicsWorld.bounds.y}, width=${physicsWorld.bounds.width}, height=${physicsWorld.bounds.height}`
    );
    console.log(
      `🗺️ Map dimensions (tiles): ${this.mapWidth}x${this.mapHeight}`
    );
    console.log(`🗺️ Tile size: ${this.tileSize}px`);
    console.log(`🗺️ Map dimensions (pixels): ${worldWidth}x${worldHeight}`);

    console.log(`✅ City background set: ${variant}`);
  }

  public clearCityBackground(): void {
    console.log(`🏙️ clearCityBackground called`);
    if (this.cityBackSprite) {
      console.log(`🏙️ Destroying back sprite`);
      this.cityBackSprite.destroy();
      this.cityBackSprite = null;
    }
    if (this.cityFrontSprite) {
      console.log(`🏙️ Destroying front sprite`);
      this.cityFrontSprite.destroy();
      this.cityFrontSprite = null;
    }
    this.cityVariant = null;
    console.log(`🏙️ City background cleared`);
  }

  public updateCityBackgroundParallax(): void {
    const camera = this.scene.cameras.main;

    if (this.cityBackSprite && (this.cityBackSprite as any).parallaxFactor) {
      const parallaxFactor = (this.cityBackSprite as any).parallaxFactor;
      // Offset the texture position based on camera scroll and parallax factor
      // The further back (smaller parallaxFactor), the slower it scrolls
      this.cityBackSprite.tilePositionX = camera.scrollX * (1 - parallaxFactor);
      this.cityBackSprite.tilePositionY = camera.scrollY * (1 - parallaxFactor);
    }

    if (this.cityFrontSprite && (this.cityFrontSprite as any).parallaxFactor) {
      const parallaxFactor = (this.cityFrontSprite as any).parallaxFactor;
      // Offset the texture position based on camera scroll and parallax factor
      this.cityFrontSprite.tilePositionX =
        camera.scrollX * (1 - parallaxFactor);
      this.cityFrontSprite.tilePositionY =
        camera.scrollY * (1 - parallaxFactor);
    }
  }

  private updateWallsVisual(x: number, y: number): void {
    // Clear existing sprite at this cell
    this.clearLayerSpriteAt(this.wallsSprites, x, y);
    const frame = this.wallsIndices[y][x];
    if (frame === null || !this.wallsVisible) return;
    if (!this.scene.textures.exists("background_sprites")) return;
    const world = this.tileToWorld(x, y);
    const sprite = this.scene.add.image(
      world.x + this.tileSize / 2,
      world.y + this.tileSize / 2,
      "background_sprites",
      frame
    );
    sprite.setDisplaySize(this.tileSize, this.tileSize);
    sprite.setDepth(1);
    this.wallsSprites.push(sprite);
  }

  private updateDecorationVisual(x: number, y: number): void {
    // Clear existing sprite at this cell
    this.clearLayerSpriteAt(this.decorationSprites, x, y);
    const frame = this.decorationIndices[y][x];
    if (frame === null || !this.decorationVisible) return;
    if (!this.scene.textures.exists("decoration_sprites")) return;
    const world = this.tileToWorld(x, y);
    const sprite = this.scene.add.image(
      world.x + this.tileSize / 2,
      world.y + this.tileSize / 2,
      "decoration_sprites",
      frame
    );
    sprite.setDisplaySize(this.tileSize, this.tileSize);
    sprite.setDepth(3);
    this.decorationSprites.push(sprite);
  }

  private clearLayerSpriteAt(
    list: Phaser.GameObjects.Image[],
    x: number,
    y: number
  ): void {
    const world = this.tileToWorld(x, y);
    const cx = world.x + this.tileSize / 2;
    const cy = world.y + this.tileSize / 2;
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i];
      if (s && s.x === cx && s.y === cy) {
        s.destroy();
        list.splice(i, 1);
      }
    }
  }

  // Tile types - including exit tiles for edge-based transitions
  static TILE_TYPES = {
    EMPTY: 0,
    SOLID: 1, // All non-zero values are treated as SOLID tiles
    PLATFORM: 2,
    EXIT_LEFT: 100,
    EXIT_RIGHT: 101,
    EXIT_TOP: 102,
    EXIT_BOTTOM: 103,
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
      if (
        tileType === TilemapSystem.TILE_TYPES.SOLID ||
        tileType === TilemapSystem.TILE_TYPES.PLATFORM
      ) {
        if (!this.tileSpriteIndices) {
          this.tileSpriteIndices = [];
        }
        this.tileSpriteIndices[y] = this.tileSpriteIndices[y] || [];
        if (tileType === TilemapSystem.TILE_TYPES.PLATFORM) {
          // Always store sprite index for PLATFORM (we don't autotile platforms)
          this.tileSpriteIndices[y][x] = spriteIndex;
        } else {
          if (this.autoTileSystem?.isEnabled()) {
            // Autotiling enabled: clear manual sprite index, let autotile system handle it
            this.tileSpriteIndices[y][x] = null;
          } else {
            // Autotiling disabled: store the provided sprite index (manual mode)
            this.tileSpriteIndices[y][x] = spriteIndex;
          }
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
    // ensure walls and decoration are drawn beneath
    this.updateWallsVisual(x, y);
    this.updateDecorationVisual(x, y);
    const tileType = this.tiles[y][x];
    const worldPos = this.tileToWorld(x, y);

    // Clear existing visual for this tile
    this.clearTileVisual(x, y);

    // Only render solid tiles (empty tiles and special tiles like exits don't get visuals)
    if (this.isSolidTile(tileType) && this.gameVisible) {
      let spriteIndex: number | null = null;
      // Platforms: always use stored sprite index (no autotile)
      if (tileType === TilemapSystem.TILE_TYPES.PLATFORM) {
        if (
          this.tileSpriteIndices &&
          this.tileSpriteIndices[y] &&
          this.tileSpriteIndices[y][x] !== undefined
        ) {
          spriteIndex = this.tileSpriteIndices[y][x];
        }
        if (spriteIndex === null) {
          // Fallback frame for platform
          spriteIndex = 49;
        }
      } else {
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
        tileType === TilemapSystem.TILE_TYPES.PLATFORM ? null : tileImage,
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

    // Skip exit tiles in GameScene (invisible in gameplay)
    const sceneKey = (this.scene as any).scene?.key;
    if (sceneKey === "GameScene" && tileType >= 100 && tileType <= 103) {
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

    // Add colored overlay for exit tiles in MapEditorScene
    if (sceneKey === "MapEditorScene" && tileType >= 100 && tileType <= 103) {
      const exitColors = {
        [TilemapSystem.TILE_TYPES.EXIT_LEFT]: 0x00ffff, // Cyan
        [TilemapSystem.TILE_TYPES.EXIT_RIGHT]: 0xff00ff, // Magenta
        [TilemapSystem.TILE_TYPES.EXIT_TOP]: 0xffff00, // Yellow
        [TilemapSystem.TILE_TYPES.EXIT_BOTTOM]: 0xff8800, // Orange
      };

      const overlay = this.scene.add.rectangle(
        worldX + this.tileSize / 2,
        worldY + this.tileSize / 2,
        this.tileSize,
        this.tileSize,
        exitColors[tileType],
        0.5
      );
      overlay.setDepth(5); // Above the tile sprite
      overlay.setStrokeStyle(2, 0xffffff, 0.8); // White border

      // Store overlay reference for cleanup
      this.tileSprites.push(overlay);
    }

    // Store reference for cleanup
    if (!this.tileSprites) {
      this.tileSprites = [];
    }
    this.tileSprites.push(tileSprite);
  }

  // Redraw the entire visual layer
  public redrawVisualLayer(): void {
    // First clear walls/decoration
    this.wallsSprites.forEach((s) => s.destroy());
    this.wallsSprites = [];
    this.decorationSprites.forEach((s) => s.destroy());
    this.decorationSprites = [];
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
        // draw walls/dec first
        this.updateWallsVisual(x, y);
        this.updateDecorationVisual(x, y);
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

          // Platforms: always use stored sprite index
          if (tileType !== TilemapSystem.TILE_TYPES.PLATFORM) {
            // If autotiling is disabled and we have a stored sprite index, use it
            if (!this.autoTileSystem?.isEnabled() && spriteIndex !== null) {
              // Use the stored sprite index for manual tiles
            } else if (this.autoTileSystem?.isEnabled()) {
              // Use autotile system to calculate sprite index
              spriteIndex = this.autoTileSystem.calculateTileIndex(x, y);
            }
          } else if (spriteIndex === null) {
            spriteIndex = 49;
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
            tileType === TilemapSystem.TILE_TYPES.PLATFORM ? null : tileImage,
            spriteIndex
          );
          tilesDrawn++;
        }
      }
    }
  }

  public redrawAllLayers(): void {
    this.redrawVisualLayer();
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
    this.platformBodies = [];

    // Create a static group for all collision bodies
    this.collisionGroup = this.scene.physics.add.staticGroup();
    this.platformGroup = this.scene.physics.add.staticGroup();

    // Create individual collision bodies for ALL solid tiles (including ground)
    let solidTilesCount = 0;
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = this.tiles[y][x];

        // Create collision for ALL solid tiles (including ground level)
        if (tileType === TilemapSystem.TILE_TYPES.SOLID) {
          const worldPos = this.tileToWorld(x, y);
          const collisionBody = this.createTileCollisionBody(
            worldPos.x,
            worldPos.y,
            tileType
          );
          this.collisionBodies.push(collisionBody);
          this.collisionGroup.add(collisionBody);
          solidTilesCount++;
        } else if (tileType === TilemapSystem.TILE_TYPES.PLATFORM) {
          const worldPos = this.tileToWorld(x, y);
          const platformBody = this.createTileCollisionBody(
            worldPos.x,
            worldPos.y,
            tileType
          );
          // Configure as one-way: collide only from above
          (platformBody.body as any).checkCollision = {
            up: true,
            down: false,
            left: false,
            right: false,
          };
          this.platformBodies.push(platformBody);
          this.platformGroup.add(platformBody);
        }
      }
    }

    // Total collision bodies created
    return this.collisionGroup;
  }

  // Check if a tile type is solid
  private isSolidTile(tileType: number): boolean {
    const isSolid =
      tileType === TilemapSystem.TILE_TYPES.SOLID ||
      tileType === TilemapSystem.TILE_TYPES.PLATFORM;
    if (tileType >= 100 && tileType <= 103) {
      console.log(
        `🔍 isSolidTile check: exit tile type ${tileType} -> ${isSolid}`
      );
    }
    return isSolid;
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
    const newBg: (number | null)[][] = [];
    const newDec: (number | null)[][] = [];

    // Initialize new arrays
    for (let y = 0; y < newHeight; y++) {
      newTiles[y] = [];
      newTileSpriteIndices[y] = [];
      newBg[y] = [];
      newDec[y] = [];
      for (let x = 0; x < newWidth; x++) {
        newTiles[y][x] = TilemapSystem.TILE_TYPES.EMPTY;
        newTileSpriteIndices[y][x] = null;
        newBg[y][x] = null;
        newDec[y][x] = null;
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
        if (this.wallsIndices[y] && this.wallsIndices[y][x] !== undefined) {
          newBg[y][x] = this.wallsIndices[y][x];
        }
        if (
          this.decorationIndices[y] &&
          this.decorationIndices[y][x] !== undefined
        ) {
          newDec[y][x] = this.decorationIndices[y][x];
        }
      }
    }

    // Update dimensions
    this.mapWidth = newWidth;
    this.mapHeight = newHeight;
    this.tiles = newTiles;
    this.tileSpriteIndices = newTileSpriteIndices;
    this.wallsIndices = newBg;
    this.decorationIndices = newDec;

    // Update autotile system dimensions
    if (this.autoTileSystem) {
      this.autoTileSystem.updateDimensions(newWidth, newHeight);
    }

    // Clear existing visuals and collision bodies
    this.clearAllVisuals();
    this.wallsSprites.forEach((s) => s.destroy());
    this.wallsSprites = [];
    this.decorationSprites.forEach((s) => s.destroy());
    this.decorationSprites = [];
    this.clearCollisionBodies();

    // Recreate city background if one was set
    const currentCityVariant = this.cityVariant;
    if (currentCityVariant) {
      this.setCityBackground(currentCityVariant);
    }

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
      (this.collisionGroup as any).clear(true);
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
