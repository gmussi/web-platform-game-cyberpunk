import { ASSET_PATHS, GAME_CONSTANTS } from "../data/config";
import { characters } from "../data/characters";
import { DEFAULT_MAP } from "../data/levels";

import { WorldSystem } from "../systems/WorldSystem";
import { TilemapSystem } from "../systems/TilemapSystem";
import { WorldViewRenderer } from "../systems/WorldViewRenderer";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Platform } from "../entities/Platform";
import { ExitZone } from "../entities/ExitZone";
import { gameData } from "../data/characters";
import { WorldMapData } from "../types/map";

// GameScene interfaces
interface MapData {
  metadata?: {
    name: string;
  };
  tiles?: number[][];
  player?: {
    startPosition: {
      x: number;
      y: number;
    };
  };
  portal?: {
    position: {
      x: number;
      y: number;
    };
    animationSpeed?: number;
    size?: {
      width: number;
      height: number;
    };
  };
  enemies?: EnemyData[];
}

export interface EnemyData {
  type: "stationary" | "moving" | "patrol";
  position: {
    x: number;
    y: number;
  };
  enemyType: "enemy1" | "enemy2";
  properties?: {
    damage?: number;
    health?: number;
    maxHealth?: number;
    speed?: number;
    patrolRange?: number;
  };
}

interface PortalArea {
  x: number;
  y: number;
  width: number;
  height: number;
  buffer: number;
}

export class GameScene extends Phaser.Scene {
  public worldSystem!: WorldSystem;
  public tilemapSystem!: TilemapSystem;
  public player!: Player;
  public enemies: Enemy[] = [];
  public enemyGroup!: Phaser.Physics.Arcade.Group;
  public playerGroup!: Phaser.Physics.Arcade.Group;
  public exitZones: ExitZone[] = [];
  public portalSprite!: Phaser.GameObjects.Sprite;
  public portalArea!: PortalArea;
  public mapData!: WorldMapData;
  public backgroundImage!: Phaser.GameObjects.Image;
  public darkOverlay!: Phaser.GameObjects.Rectangle;
  public characterNameText!: Phaser.GameObjects.Text;
  public healthBarX!: number;
  public healthBarBg!: Phaser.GameObjects.Rectangle;
  public healthBar!: Phaser.GameObjects.Rectangle;
  public healthText!: Phaser.GameObjects.Text;
  public mapInfoText!: Phaser.GameObjects.Text;
  public mapFileInput!: HTMLInputElement;
  public mapSaveKey!: Phaser.Input.Keyboard.Key;
  public mapLoadKey!: Phaser.Input.Keyboard.Key;
  public backgroundMusic!: Phaser.Sound.BaseSound;
  public wilhelmScream!: Phaser.Sound.BaseSound;
  public frameCount: number = 0;
  public upKey!: Phaser.Input.Keyboard.Key;
  public wKey!: Phaser.Input.Keyboard.Key;
  public transitionCooldown: number = 0;
  public readonly TRANSITION_COOLDOWN_MS = 1000; // 1 second grace period
  public worldViewRenderer!: WorldViewRenderer;
  private activeColliders: Phaser.Physics.Arcade.Collider[] = [];

  constructor() {
    super({ key: "GameScene" });
  }

  public preload(): void {
    // Assets are preloaded in LoadingScene
    // Just create tile textures from the preloaded tileset
    this.createTileTextures();
  }

  private createTileTextures(): void {
    // Check if tileset image exists
    if (!this.textures.exists("tileset")) {
      console.error("Tileset image not found!");
      return;
    }

    // Create individual tile textures from the 8x8 tileset (64 tiles total)
    const tileSize = 32; // Each tile is 32x32 pixels
    const tilesPerRow = 8; // 8 tiles per row in the tileset

    try {
      // Use addSpriteSheet to create individual tile textures
      this.textures.addSpriteSheet(
        "tileset_sprites",
        this.textures.get("tileset").getSourceImage(),
        {
          frameWidth: tileSize,
          frameHeight: tileSize,
          startFrame: 0,
          endFrame: 63,
        }
      );
    } catch (error) {
      console.error("Error creating tileset spritesheet:", error);
    }
  }

  private createCharacterAnimations(): void {
    const characterNames = [
      "cyberWarrior",
      "quantumMage",
      "stealthRogue",
      "plasmaPaladin",
    ];

    characterNames.forEach((charName) => {
      // Check if all required textures exist before creating animations
      const requiredTextures = [
        `${charName}_breathing_idle_000`,
        `${charName}_breathing_idle_001`,
        `${charName}_breathing_idle_002`,
        `${charName}_breathing_idle_003`,
        `${charName}_walk_east_000`,
        `${charName}_walk_west_000`,
        `${charName}_jumping_east_000`,
        `${charName}_jumping_west_000`,
      ];

      const missingTextures = requiredTextures.filter(
        (textureKey) => !this.textures.exists(textureKey)
      );
      if (missingTextures.length > 0) {
        console.warn(`Missing textures for ${charName}:`, missingTextures);
        return; // Skip animation creation for this character
      }
      // Create breathing-idle animation with error handling
      try {
        this.anims.create({
          key: `${charName}_breathing_idle`,
          frames: [
            { key: `${charName}_breathing_idle_000` },
            { key: `${charName}_breathing_idle_001` },
            { key: `${charName}_breathing_idle_002` },
            { key: `${charName}_breathing_idle_003` },
          ],
          frameRate: 8, // Slow breathing animation
          repeat: -1, // Loop infinitely
        });
      } catch (error) {
        console.warn(
          `Failed to create breathing animation for ${charName}:`,
          error
        );
      }

      // Create walk animations for east and west
      ["east", "west"].forEach((direction) => {
        try {
          this.anims.create({
            key: `${charName}_walk_${direction}`,
            frames: [
              { key: `${charName}_walk_${direction}_000` },
              { key: `${charName}_walk_${direction}_001` },
              { key: `${charName}_walk_${direction}_002` },
              { key: `${charName}_walk_${direction}_003` },
              { key: `${charName}_walk_${direction}_004` },
              { key: `${charName}_walk_${direction}_005` },
            ],
            frameRate: 12, // Smooth walking animation
            repeat: -1, // Loop infinitely
          });
        } catch (error) {
          console.warn(
            `Failed to create walk animation for ${charName} ${direction}:`,
            error
          );
        }
      });

      // Create jumping animations for east and west
      ["east", "west"].forEach((direction) => {
        try {
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
              { key: `${charName}_jumping_${direction}_008` },
            ],
            frameRate: 15, // Quick jumping animation
            repeat: 0, // Play once
          });
        } catch (error) {
          console.warn(
            `Failed to create jumping animation for ${charName} ${direction}:`,
            error
          );
        }
      });
    });
  }

  public create(): void {
    // Initialize world system
    this.worldSystem = new WorldSystem(this as any);

    // Initialize world view renderer
    this.worldViewRenderer = new WorldViewRenderer(
      this as any,
      this.worldSystem.worldData
    );

    // Create character animations
    this.createCharacterAnimations();

    // Create tilemap system with correct initial dimensions for default map
    this.tilemapSystem = new TilemapSystem(this as any, 128, 31);

    // Set world bounds based on scroll direction (after tilemap system is created)
    this.setupWorldBounds();

    // Create background immediately
    this.createBackground();
    this.createDarkOverlay();

    // Load world data if available, otherwise use default
    this.loadWorldData();

    // Create player immediately (will be repositioned when map loads)
    this.createPlayer();

    // Initialize enemies and exit zones arrays to prevent race condition
    this.enemies = [];
    this.exitZones = [];

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

  private loadWorldData(): void {
    // Load default world file
    this.worldSystem
      .loadWorldFromURL(
        `${ASSET_PATHS.maps}/default_world.json?v=${Date.now()}`
      )
      .then((worldData) => {
        console.log(
          "🎯 GameScene: World data loaded:",
          worldData.metadata?.name
        );

        // Update world view renderer with loaded world data
        this.worldViewRenderer.setWorldData(worldData);

        // Load the starting map
        const currentMap = this.worldSystem.getCurrentMap();
        if (!currentMap) {
          throw new Error("Starting map not found in world");
        }

        console.log(
          "🗺️ Loading map:",
          currentMap.metadata?.name,
          currentMap.world?.width,
          "x",
          currentMap.world?.height
        );

        this.mapData = currentMap;

        // Get the starting spawn point
        const startingSpawn = this.worldSystem.getSpawnPoint(
          worldData.startingSpawn
        );
        if (startingSpawn) {
          console.log(
            "📍 Starting at spawn point:",
            startingSpawn.id,
            `(${startingSpawn.x}, ${startingSpawn.y})`
          );
        }

        // Load tile data immediately after map data is loaded
        this.loadTileDataFromMap();
        // Create collision bodies AFTER tile data is loaded
        this.tilemapSystem.createCollisionBodies();
        // Create enemies AFTER map data is loaded
        this.createEnemies();
        // Create exit zones AFTER map data is loaded
        this.createExitZones();
        // Create portal AFTER map data is loaded
        this.createPortal();
        // Setup collisions AFTER collision bodies are created
        this.setupCollisions();
        // Reposition objects based on map data (including spawn point)
        this.updateObjectsFromMapData(startingSpawn);
      })
      .catch((error: Error) => {
        console.error("Failed to load world file:", error.message);
        console.error(
          "Game cannot start without a valid world file. Please ensure default_world.json exists in the maps directory."
        );
        // Show error message to user
        this.add
          .text(600, 400, "World Loading Error", {
            fontSize: "32px",
            fill: "#ff4444",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        this.add
          .text(600, 450, "Failed to load default world", {
            fontSize: "18px",
            fill: "#ffffff",
          })
          .setOrigin(0.5);

        this.add
          .text(600, 480, "Please ensure the world file exists and is valid", {
            fontSize: "16px",
            fill: "#cccccc",
          })
          .setOrigin(0.5);
      });
  }

  private loadTileDataFromMap(): void {
    // Load tile data from map
    if (
      this.mapData &&
      this.mapData.tiles &&
      Array.isArray(this.mapData.tiles)
    ) {
      console.log(
        `🗺️ Tile data found: ${this.mapData.tiles.length} rows, first row has ${
          this.mapData.tiles[0]?.length || 0
        } columns`
      );
      // Check if we need to resize the tilemap system to match the loaded map dimensions
      if (this.mapData.world) {
        const mapWidthInTiles = Math.floor(
          this.mapData.world.width / this.tilemapSystem.tileSize
        );
        const mapHeightInTiles = Math.floor(
          this.mapData.world.height / this.tilemapSystem.tileSize
        );

        console.log(
          `🔍 Map dimensions check: loaded map is ${mapWidthInTiles}×${mapHeightInTiles} tiles, tilemap is ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight} tiles`
        );

        if (
          mapWidthInTiles !== this.tilemapSystem.mapWidth ||
          mapHeightInTiles !== this.tilemapSystem.mapHeight
        ) {
          console.log(
            `🔄 Resizing tilemap from ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight} to ${mapWidthInTiles}×${mapHeightInTiles}`
          );
          this.tilemapSystem.resizeMap(mapWidthInTiles, mapHeightInTiles);
          this.setupWorldBounds();
          this.createBackground();
          this.setupCamera();
        } else {
          console.log("✅ No resizing needed - dimensions match");
        }
      }

      // Clear existing tiles first
      for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
        for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
          this.tilemapSystem.setTile(x, y, TilemapSystem.TILE_TYPES.EMPTY);
        }
      }

      // Load tile data
      let tilesLoaded = 0;
      for (
        let y = 0;
        y < Math.min(this.mapData.tiles.length, this.tilemapSystem.mapHeight);
        y++
      ) {
        if (this.mapData.tiles[y] && Array.isArray(this.mapData.tiles[y])) {
          for (
            let x = 0;
            x <
            Math.min(this.mapData.tiles[y].length, this.tilemapSystem.mapWidth);
            x++
          ) {
            const tileData = this.mapData.tiles[y][x];

            // Handle tile data format
            if (tileData && typeof tileData === "object") {
              // Object format: type and spriteIndex
              this.tilemapSystem.setTile(
                x,
                y,
                (tileData as any).type,
                (tileData as any).spriteIndex
              );
              tilesLoaded++;
            } else if (typeof tileData === "number") {
              // Number format: just tile type
              this.tilemapSystem.setTile(x, y, tileData);
              tilesLoaded++;
            }
          }
        }
      }
      console.log(`🧱 Loaded ${tilesLoaded} tiles from map data`);
    } else {
      // No tile data found in map, using default tilemap
    }
  }

  private setupWorldBounds(): void {
    if (!this.tilemapSystem) {
      console.warn(
        "setupWorldBounds called before tilemapSystem was created, using default bounds"
      );
      this.physics.world.setBounds(
        0,
        0,
        GAME_CONSTANTS.WORLD_WIDTH,
        GAME_CONSTANTS.WORLD_HEIGHT
      );
      return;
    }

    const worldWidth = this.tilemapSystem.getWorldWidth();
    const worldHeight = this.tilemapSystem.getWorldHeight();

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  }

  private createBackground(): void {
    // Randomly select one of the three background images
    const backgroundKeys = ["background1", "background2", "background3"];
    const selectedBackground =
      backgroundKeys[Math.floor(Math.random() * backgroundKeys.length)];

    // Create the background image
    if (this.textures.exists(selectedBackground)) {
      // Create a single background image that covers the entire world
      const worldWidth = this.tilemapSystem
        ? this.tilemapSystem.getWorldWidth()
        : GAME_CONSTANTS.WORLD_WIDTH;
      const worldHeight = this.tilemapSystem
        ? this.tilemapSystem.getWorldHeight()
        : GAME_CONSTANTS.WORLD_HEIGHT;
      const imageWidth = this.textures.get(selectedBackground).source[0].width;
      const imageHeight =
        this.textures.get(selectedBackground).source[0].height;

      // Calculate scale to cover the full world width (may stretch vertically)
      // New images are 1728x576px, world is 4100x800px
      const scaleX = worldWidth / imageWidth; // 4100 / 1728 ≈ 2.37
      const scaleY = worldHeight / imageHeight; // 800 / 576 ≈ 1.39

      // Use the larger scale to ensure full coverage of world width
      const scale = Math.max(scaleX, scaleY);

      // Background images have empty space in first 6 columns (at 32px per tile = 192px)
      // Shift the background left to hide the empty space
      const emptySpaceWidth = 192; // 6 tiles * 32px
      const offsetX = -(emptySpaceWidth * scale) / 2;

      // Position the background to start from the left edge of the world, adjusted for empty space
      this.backgroundImage = this.add.image(
        (imageWidth * scale) / 2 + offsetX,
        worldHeight / 2,
        selectedBackground
      );
      this.backgroundImage.setScrollFactor(0.3);
      this.backgroundImage.setDepth(-10);
      this.backgroundImage.setScale(scale);
    } else {
      // Background texture not found, using fallback
      this.createFallbackBackground();
    }

    // Add some additional atmospheric elements with different parallax speeds
    this.addAtmosphericElements();
  }

  private createDarkOverlay(): void {
    // Create a dark overlay to make the background darker
    const worldWidth = this.tilemapSystem
      ? this.tilemapSystem.getWorldWidth()
      : GAME_CONSTANTS.WORLD_WIDTH;
    const worldHeight = this.tilemapSystem
      ? this.tilemapSystem.getWorldHeight()
      : GAME_CONSTANTS.WORLD_HEIGHT;

    // Calculate the same offset as the background to align with it
    const selectedBackground = "background1"; // Assume any background for scale calculation
    if (this.textures.exists(selectedBackground)) {
      const imageWidth = this.textures.get(selectedBackground).source[0].width;
      const imageHeight =
        this.textures.get(selectedBackground).source[0].height;
      const scaleX = worldWidth / imageWidth;
      const scaleY = worldHeight / imageHeight;
      const scale = Math.max(scaleX, scaleY);

      // Background images have empty space in first 6 columns (at 32px per tile = 192px)
      const emptySpaceWidth = 192; // 6 tiles * 32px
      const offsetX = -(emptySpaceWidth * scale) / 2;

      // Create a semi-transparent dark rectangle covering the entire world, shifted to match background
      this.darkOverlay = this.add.rectangle(
        worldWidth / 2 + offsetX,
        worldHeight / 2,
        worldWidth,
        worldHeight,
        0x000000,
        0.4
      );
    } else {
      // Fallback if textures not available
      this.darkOverlay = this.add.rectangle(
        worldWidth / 2,
        worldHeight / 2,
        worldWidth,
        worldHeight,
        0x000000,
        0.4
      );
    }

    this.darkOverlay.setScrollFactor(0.2); // Slight parallax effect
    this.darkOverlay.setDepth(1); // Above background but below game elements
  }

  private createFallbackBackground(): void {
    // Create a simple colored background as fallback
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0a0a2e);
    graphics.fillRect(0, 0, 4100, 600);
    graphics.generateTexture("fallbackBackground", 4100, 600);
    graphics.destroy();

    this.backgroundImage = this.add.image(2050, 300, "fallbackBackground");
  }

  private addAtmosphericElements(): void {
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
        ease: "Sine.easeInOut",
      });
    }
  }

  // Helper method to check if a position conflicts with the portal area
  private checkPortalCollision(
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    if (!this.portalArea) return false;

    const portalLeft =
      this.portalArea.x - this.portalArea.width / 2 - this.portalArea.buffer;
    const portalRight =
      this.portalArea.x + this.portalArea.width / 2 + this.portalArea.buffer;
    const portalTop =
      this.portalArea.y - this.portalArea.height / 2 - this.portalArea.buffer;
    const portalBottom =
      this.portalArea.y + this.portalArea.height / 2 + this.portalArea.buffer;

    const platformLeft = x - width / 2;
    const platformRight = x + width / 2;
    const platformTop = y - height / 2;
    const platformBottom = y + height / 2;

    // Check if platform overlaps with portal area
    return !(
      platformRight < portalLeft ||
      platformLeft > portalRight ||
      platformBottom < portalTop ||
      platformTop > portalBottom
    );
  }

  private createPlayer(): void {
    // Get starting position from world data or use default
    const startingPos = this.getStartingPlayerPosition();

    this.player = new Player(
      this as any,
      startingPos.x,
      startingPos.y,
      gameData.selectedCharacter ?? 0
    );

    // Add player to physics groups for collision detection
    this.playerGroup = this.physics.add.group([this.player]);
  }

  private getStartingPlayerPosition(): { x: number; y: number } {
    // Check if world data is loaded
    if (!this.worldSystem.worldData) {
      // Fallback to center if world data not loaded yet
      return {
        x: 400, // Default center position
        y: 300,
      };
    }

    // Check if world has a default starting position
    if (this.worldSystem.worldData.startingPosition) {
      return this.worldSystem.worldData.startingPosition;
    }

    // Otherwise use first exit on left edge, or center
    if (this.mapData && this.mapData.exits) {
      const leftExit = this.mapData.exits.find((e) => e.edge === "left");
      if (leftExit) {
        return {
          x: leftExit.x + leftExit.width / 2 + 64,
          y: leftExit.y + leftExit.height / 2,
        };
      }
    }

    // Fallback to center
    return {
      x: this.mapData?.world?.width ? this.mapData.world.width / 2 : 400,
      y: this.mapData?.world?.height ? this.mapData.world.height / 2 : 300,
    };
  }

  private repositionPlayer(): void {
    // Reposition player based on map data
    if (this.mapData && this.mapData.player && this.player) {
      const startX = this.mapData.player.startPosition.x;
      const startY = this.mapData.player.startPosition.y;

      this.player.setPosition(startX, startY);
    }
  }

  private updateObjectsFromMapData(spawnPoint?: {
    x: number;
    y: number;
  }): void {
    // Update player position (use spawn point if provided)
    if (spawnPoint && this.player) {
      this.player.setPosition(spawnPoint.x, spawnPoint.y);
      console.log(`Player spawned at (${spawnPoint.x}, ${spawnPoint.y})`);
    } else {
      this.repositionPlayer();
    }

    // Update portal position
    if (this.mapData && this.mapData.portal && this.portalSprite) {
      const portalX = this.mapData.portal.position.x;
      const portalY = this.mapData.portal.position.y;

      this.portalSprite.setPosition(portalX, portalY);
    }

    // Note: Enemies and exit zones are now created at correct positions, no need to reposition
  }

  // Helper function to find appropriate spawn position using tilemap
  private findSpawnPosition(
    x: number,
    preferGround: boolean = true
  ): { x: number; y: number } {
    // Use tilemap system to find spawn position
    return this.tilemapSystem.findEnemySpawnPosition(preferGround);
  }

  private createEnemies(): void {
    this.enemies = [];

    if (this.mapData && this.mapData.enemies) {
      // Create enemies from map data
      this.mapData.enemies.forEach((enemyData: EnemyData, index: number) => {
        let enemy: Enemy;

        switch (enemyData.type) {
          case "stationary":
            enemy = Enemy.createStationaryEnemy(
              this as any,
              enemyData.position.x,
              enemyData.position.y,
              enemyData.enemyType
            );
            break;
          case "moving":
            enemy = Enemy.createMovingEnemy(
              this as any,
              enemyData.position.x,
              enemyData.position.y,
              enemyData.enemyType
            );
            break;
          case "patrol":
            enemy = Enemy.createPatrolEnemy(
              this as any,
              enemyData.position.x,
              enemyData.position.y,
              enemyData.properties?.patrolRange || 150,
              enemyData.enemyType
            );
            break;
          default:
            enemy = Enemy.createStationaryEnemy(
              this as any,
              enemyData.position.x,
              enemyData.position.y,
              enemyData.enemyType
            );
        }

        // Apply properties from map data
        if (enemyData.properties) {
          if (enemyData.properties.damage)
            enemy.damage = enemyData.properties.damage;
          if (enemyData.properties.health)
            enemy.health = enemyData.properties.health;
          if (enemyData.properties.maxHealth)
            enemy.maxHealth = enemyData.properties.maxHealth;
          if (enemyData.properties.speed)
            enemy.speed = enemyData.properties.speed;
          if (enemyData.properties.patrolRange)
            enemy.patrolRange = enemyData.properties.patrolRange;
        }

        this.enemies.push(enemy);
      });
    } else {
      console.warn("No enemy data found in map. No enemies will be created.");
    }

    // Add enemies to physics group
    this.enemyGroup = this.physics.add.group(this.enemies);
  }

  private createExitZones(): void {
    // Clear existing exit zones
    this.exitZones.forEach((exit) => exit.destroy());
    this.exitZones = [];

    if (this.mapData && this.mapData.exits) {
      // Create exit zones from map data
      this.mapData.exits.forEach((exitData) => {
        const exitZone = new ExitZone(this, exitData);
        this.exitZones.push(exitZone);
      });
      console.log(`Created ${this.exitZones.length} exit zones`);
    } else {
      console.warn("No exit data found in map. No exit zones will be created.");
    }
  }

  private createPortal(): void {
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
    this.portalSprite = this.add.sprite(portalX, portalY, "portal_frame_01");
    this.portalSprite.setDepth(25);

    // Create portal animation
    this.anims.create({
      key: "portalAnimation",
      frames: [
        { key: "portal_frame_01" },
        { key: "portal_frame_02" },
        { key: "portal_frame_03" },
        { key: "portal_frame_04" },
        { key: "portal_frame_05" },
        { key: "portal_frame_06" },
        { key: "portal_frame_07" },
        { key: "portal_frame_08" },
        { key: "portal_frame_09" },
        { key: "portal_frame_10" },
        { key: "portal_frame_11" },
        { key: "portal_frame_12" },
      ],
      frameRate: this.mapData?.portal?.animationSpeed || 12, // Use map data or default
      repeat: -1, // Loop infinitely
    });

    // Start the animation
    this.portalSprite.play("portalAnimation");

    // Add physics body for collision detection
    this.physics.add.existing(this.portalSprite);
    this.portalSprite.body.setSize(100, 100);
    this.portalSprite.body.setImmovable(true);
    this.portalSprite.body.setAllowGravity(false);
    this.portalSprite.body.setVelocity(0, 0);
    this.portalSprite.body.enable = true;

    // Define portal area for collision checking
    this.portalArea = {
      x: portalX,
      y: portalY,
      width: this.mapData?.portal?.size?.width || 100,
      height: this.mapData?.portal?.size?.height || 100,
      buffer: 50, // Extra buffer around portal
    };
  }

  private setupCollisions(): void {
    // Clean up any existing colliders first
    this.cleanupColliders();

    // Player vs Tilemap
    const playerTilemapCollider = this.physics.add.collider(
      this.player,
      this.tilemapSystem.collisionGroup
    );
    this.activeColliders.push(playerTilemapCollider);

    // Also try individual collision bodies as backup
    this.tilemapSystem.collisionBodies.forEach((body: any, index: number) => {
      const collider = this.physics.add.collider(this.player, body);
      this.activeColliders.push(collider);
    });

    // Player vs Enemies
    const playerEnemyOverlap = this.physics.add.overlap(
      this.player,
      this.enemies,
      (player: Player, enemy: Enemy) => {
        // Collision handling is done in Enemy class
      }
    );
    this.activeColliders.push(playerEnemyOverlap);

    // Enemies vs Tilemap - use individual collision bodies
    console.log(
      `Setting up enemy collisions with ${this.tilemapSystem.collisionBodies.length} collision bodies`
    );
    this.tilemapSystem.collisionBodies.forEach((body: any, index: number) => {
      const collider = this.physics.add.collider(this.enemies, body);
      this.activeColliders.push(collider);
      console.log(`Added collision for enemies with body ${index}:`, {
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
      });
    });

    // Player vs Portal - only the animated portal sprite
    const portalOverlap = this.physics.add.overlap(
      this.player,
      this.portalSprite,
      (player: Player, portal: Phaser.GameObjects.Sprite) => {
        console.log("🧠 Portal collision detected! Starting victory scene...");
        this.stopBackgroundMusic();
        this.scene.start("VictoryScene");
      }
    );
    this.activeColliders.push(portalOverlap);
  }

  private cleanupColliders(): void {
    // Remove all active colliders from the physics world
    this.activeColliders.forEach((collider) => {
      if (collider) {
        // Disable the collider using type assertion
        (collider as any).active = false;
        // Phaser will automatically clean up disabled colliders
      }
    });
    this.activeColliders = [];
  }

  private createUI(): void {
    // Character name display with error handling
    const selectedCharacterKey = gameData.selectedCharacter ?? "A";
    const selectedCharacter = characters[selectedCharacterKey];

    // Fallback to first character if selected character doesn't exist
    const characterName =
      selectedCharacter?.name ?? characters["A"]?.name ?? "Unknown Character";

    // Ensure gameData.selectedCharacter is valid
    if (
      !gameData.selectedCharacter ||
      !characters[gameData.selectedCharacter]
    ) {
      gameData.selectedCharacter = "A";
    }
    this.characterNameText = this.add
      .text(50, 5, characterName, {
        fontSize: "20px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(100);

    // Calculate health bar position after character name
    const characterNameWidth = characterName.length * 12; // Approximate width
    const healthBarStartX = 50 + characterNameWidth + 30; // 30px spacing
    this.healthBarX = healthBarStartX + 100; // Store for updateHealthBar method

    // Health bar background (aligned with character name text)
    this.healthBarBg = this.add
      .rectangle(this.healthBarX, 15, 200, 20, 0x333333)
      .setScrollFactor(0)
      .setDepth(100);

    // Health bar (aligned with character name text)
    this.healthBar = this.add
      .rectangle(this.healthBarX, 15, 200, 20, 0x00ff00)
      .setScrollFactor(0)
      .setDepth(101);

    // Health text (aligned with character name text)
    this.healthText = this.add
      .text(
        this.healthBarX,
        15,
        `${gameData.maxHealth}/${gameData.maxHealth}`,
        {
          fontSize: "14px",
          fill: "#fff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    // Instructions
    this.add
      .text(500, 5, "Arrow Keys: Move | Space: Jump", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setScrollFactor(0)
      .setDepth(100);

    // Map management UI
    this.createMapManagementUI();
  }

  private createMapManagementUI(): void {
    // Map info display
    if (this.mapData && this.mapData.metadata) {
      this.mapInfoText = this.add
        .text(50, 70, `Map: ${this.mapData.metadata.name}`, {
          fontSize: "14px",
          fill: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 1,
        })
        .setScrollFactor(0)
        .setDepth(100);
    }

    // Save and Load functionality is available via keyboard shortcuts (S and L keys)
    // No visible buttons needed

    // Create map input for file loading
    this.createMapFileInput();
  }

  private createMapFileInput(): void {
    // Create hidden file input
    this.mapFileInput = document.createElement("input");
    this.mapFileInput.type = "file";
    this.mapFileInput.accept = ".json";
    this.mapFileInput.style.display = "none";
    document.body.appendChild(this.mapFileInput);

    this.mapFileInput.addEventListener("change", (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.mapSystem
          .loadMap(file)
          .then((mapData: any) => {
            console.log(
              "🎯 Manual map loaded from file:",
              mapData.metadata?.name,
              mapData.world?.width,
              "x",
              mapData.world?.height
            );
            this.mapData = mapData;
            // Reload the map data without restarting the scene
            this.reloadMapData();
          })
          .catch((error: Error) => {
            console.error("Error loading map:", error);
            alert("Error loading map: " + error.message);
          });
      }
    });
  }

  private reloadMapData(): void {
    console.log("🔄 Reloading map data without scene restart...");
    console.log(
      "📊 Current mapData:",
      this.mapData?.metadata?.name,
      this.mapData?.world?.width,
      "x",
      this.mapData?.world?.height
    );

    // Clear existing enemies
    if (this.enemies) {
      this.enemies.forEach((enemy) => enemy.destroy());
      this.enemies = [];
    }

    // Clear existing portal
    if (this.portalSprite) {
      this.portalSprite.destroy();
      this.portalSprite = null as any;
    }

    // Follow the exact same sequence as loadMapData()
    // Load tile data immediately after map data is loaded
    this.loadTileDataFromMap();
    // Create collision bodies AFTER tile data is loaded
    this.tilemapSystem.createCollisionBodies();
    // Create enemies AFTER map data is loaded
    this.createEnemies();
    // Create portal AFTER map data is loaded
    this.createPortal();
    // Setup collisions AFTER collision bodies are created
    this.setupCollisions();
    // Setup camera bounds and follow player
    this.setupCamera();
    // Reposition objects based on map data
    this.updateObjectsFromMapData();

    console.log("Map data reloaded successfully");
  }

  public async saveCurrentMap(): Promise<void> {
    if (this.mapSystem) {
      const currentMapData = this.mapSystem.createMapFromGameState();
      if (currentMapData) {
        const success = await this.mapSystem.saveMap(currentMapData);
        if (success) {
          console.log("Current game state saved as map");
        } else {
          console.log("Map save cancelled or failed");
        }
      }
    }
  }

  private loadMapFromFile(): void {
    this.mapFileInput.click();
  }

  private setupCamera(): void {
    // Set camera bounds for extended world with maximized playable area
    const worldWidth = this.tilemapSystem
      ? this.tilemapSystem.getWorldWidth()
      : 4128;
    const worldHeight = this.tilemapSystem
      ? this.tilemapSystem.getWorldHeight()
      : 800;

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start camera following player
    this.cameras.main.startFollow(this.player);

    // Set camera deadzone for smoother following
    this.cameras.main.setDeadzone(100, 50);

    // Set camera zoom
    this.cameras.main.setZoom(1);
  }

  private setupEventListeners(): void {
    // Player events
    this.events.on("playerDamaged", (health: number) => {
      this.updateHealthBar(health);
    });

    this.events.on("playerDied", () => {
      this.scene.start("GameOverScene");
    });

    this.events.on("enemyDestroyed", (enemy: Enemy) => {
      // Remove enemy from groups
      this.enemies = this.enemies.filter((e) => e !== enemy);
    });

    // Map management keyboard shortcuts
    this.mapSaveKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    this.mapLoadKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.L
    );

    // Exit zone interaction keys
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  }

  private updateHealthBar(health: number): void {
    if (isNaN(health) || health === undefined) {
      console.error("Invalid health value:", health);
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

  public update(): void {
    // Handle map management keyboard shortcuts
    if (Phaser.Input.Keyboard.JustDown(this.mapSaveKey)) {
      this.saveCurrentMap();
    }

    if (Phaser.Input.Keyboard.JustDown(this.mapLoadKey)) {
      this.loadMapFromFile();
    }

    // Handle world view toggle
    if (Phaser.Input.Keyboard.JustDown(this.wKey)) {
      this.worldViewRenderer.toggle();
    }

    // Update player
    if (this.player) {
      this.player.update();
    }

    // Update enemies
    if (this.enemies && Array.isArray(this.enemies)) {
      this.enemies.forEach((enemy) => {
        if (enemy && enemy.active) {
          enemy.update();
        }
      });
    }

    this.frameCount++;

    // Update health bar
    if (this.player) {
      this.updateHealthBar(this.player.health);
    }

    // Check for automatic edge transitions
    this.checkEdgeTransition();

    // Manual portal collision check (backup) - only checks animated portal sprite
    if (this.player && this.portalSprite) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.portalSprite.x,
        this.portalSprite.y
      );
      if (distance < 60) {
        console.log("🧠 Manual portal collision detected! Distance:", distance);
        this.stopBackgroundMusic();
        this.scene.start("VictoryScene");
      }
    }
  }

  private checkEdgeTransition(): void {
    if ((this as any).isTransitioning) return;

    // Check if map data is loaded
    if (!this.mapData || !this.mapData.world) {
      return;
    }

    // Check cooldown (prevents immediate re-transition after spawning)
    if (this.transitionCooldown > 0) {
      this.transitionCooldown -= this.game.loop.delta;
      return;
    }

    const px = this.player.x;
    const py = this.player.y;
    const threshold = 32;

    // Detect edge
    let edge: string | null = null;
    if (px < threshold) edge = "left";
    else if (px > this.mapData.world.width - threshold) edge = "right";
    else if (py < threshold) edge = "top";
    else if (py > this.mapData.world.height - threshold) edge = "bottom";

    if (!edge) return;

    // Find matching exit zone
    const exit = this.findExitAtPlayerPosition(edge, px, py);

    if (exit) {
      console.log(
        `🚪 Exit found at ${edge} edge, transitioning to ${exit.targetMapId}`
      );
      this.transitionToMap(exit.targetMapId, exit);
    } else {
      console.log(`⚠️ Player at ${edge} edge (${px}, ${py}) but no exit found`);
    }
  }

  private findExitAtPlayerPosition(
    edge: string,
    px: number,
    py: number
  ): any | null {
    console.log(
      `🔍 Looking for ${edge} exit at player pos (${px}, ${py}), total exits:`,
      this.mapData.exits.length
    );
    return this.mapData.exits.find((e: any) => {
      if (e.edge !== edge) return false;

      const isHorizontal = edge === "top" || edge === "bottom";
      const playerPos = isHorizontal ? px : py;
      const mapSize = isHorizontal
        ? this.mapData.world.width
        : this.mapData.world.height;
      const playerNormalized = playerPos / mapSize;

      return playerNormalized >= e.edgeStart && playerNormalized <= e.edgeEnd;
    });
  }

  private transitionToMap(targetMapId: string, fromExit: any): void {
    if ((this as any).isTransitioning) return;
    (this as any).isTransitioning = true;

    const playerHealth = this.player?.health || gameData.maxHealth;

    console.log(
      `🌀 Transitioning to map ${targetMapId}, health: ${playerHealth}`
    );

    // Switch map
    const success = this.worldSystem.switchMap(targetMapId, null); // No spawn ID needed

    if (!success) {
      console.error(`Failed to switch to map ${targetMapId}`);
      (this as any).isTransitioning = false;
      return;
    }

    // Get new map
    const newMapData = this.worldSystem.getCurrentMap();
    if (!newMapData) {
      console.error(`Failed to get map data for ${targetMapId}`);
      (this as any).isTransitioning = false;
      return;
    }

    // Calculate spawn position on opposite edge
    const spawnPos = this.calculateOppositeEdgeSpawn(fromExit, newMapData);

    this.mapData = newMapData;

    // Reload map content
    this.cleanupMapContent();
    this.loadTileDataFromMap();
    this.tilemapSystem.createCollisionBodies();
    this.createEnemies();
    this.createExitZones();
    this.createPortal();

    // Spawn player at calculated position
    this.player.setPosition(spawnPos.x, spawnPos.y);
    this.player.health = playerHealth;

    this.setupCollisions();
    this.setupWorldBounds();
    this.setupCamera();

    // Set transition cooldown to prevent immediate re-transition
    this.transitionCooldown = this.TRANSITION_COOLDOWN_MS;

    (this as any).isTransitioning = false;
    console.log(`✅ Transition to map ${targetMapId} complete`);
  }

  private calculateOppositeEdgeSpawn(
    fromExit: any,
    targetMap: any
  ): { x: number; y: number } {
    // Map edge to opposite edge
    const oppositeEdge = {
      left: "right",
      right: "left",
      top: "bottom",
      bottom: "top",
    }[fromExit.edge];

    // Find matching exit on opposite edge with similar position
    const targetExit = targetMap.exits.find((e: any) => {
      if (e.edge !== oppositeEdge) return false;

      // Check if exit ranges overlap (allows some flexibility)
      const overlap = !(
        e.edgeEnd < fromExit.edgeStart || e.edgeStart > fromExit.edgeEnd
      );
      return overlap;
    });

    if (!targetExit) {
      console.warn(
        `No matching exit found on ${oppositeEdge} edge of ${targetMap.id}`
      );
      // Fallback: spawn at map center
      return {
        x: targetMap.world.width / 2,
        y: targetMap.world.height / 2,
      };
    }

    // Calculate spawn position at center of target exit
    const spawnX = targetExit.x + targetExit.width / 2;
    const spawnY = targetExit.y + targetExit.height / 2;

    // Offset slightly inward from edge
    const offset = 64; // 2 tiles
    if (targetExit.edge === "left") return { x: spawnX + offset, y: spawnY };
    if (targetExit.edge === "right") return { x: spawnX - offset, y: spawnY };
    if (targetExit.edge === "top") return { x: spawnX, y: spawnY + offset };
    if (targetExit.edge === "bottom") return { x: spawnX, y: spawnY - offset };

    return { x: spawnX, y: spawnY };
  }

  private cleanupMapContent(): void {
    // Clean up old objects
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.exitZones.forEach((exit) => exit.destroy());
    this.exitZones = [];
    if (this.portalSprite) {
      this.portalSprite.destroy();
    }
  }

  private startBackgroundMusic(): void {
    // Check if music is already initialized globally to prevent duplicates
    if ((window as any).gameMusicInitialized) {
      console.log("Background music already initialized globally, skipping...");
      return;
    }

    (window as any).gameMusicInitialized = true;

    // Audio is preloaded in LoadingScene
    // Create background music sound
    this.backgroundMusic = this.sound.add("backgroundMusic", {
      volume: 0.3, // Lower volume so it doesn't overpower gameplay
      loop: true, // Loop the music continuously
      fadeIn: {
        duration: 2000, // Fade in over 2 seconds
        from: 0,
        to: 0.3,
      },
    });

    // Start playing the music
    this.backgroundMusic.play();
    console.log("Background music started");
    console.log("Wilhelm scream sound loaded");
  }

  public playWilhelmScream(): void {
    // Create and play Wilhelm scream sound effect
    if (!this.wilhelmScream) {
      this.wilhelmScream = this.sound.add("wilhelmScream", {
        volume: 0.7, // Higher volume for impact
        loop: false, // Play once only
      });
    }

    if (this.wilhelmScream) {
      this.wilhelmScream.play();
    }
  }

  public stopBackgroundMusic(): void {
    // Stop the background music
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic.destroy();
      this.backgroundMusic = null as any;
    }

    console.log("Background music stopped");
  }

  public shutdown(): void {
    // Clean up background music when scene is destroyed
    this.stopBackgroundMusic();

    // Clean up colliders
    this.cleanupColliders();

    // Clean up map file input
    if (this.mapFileInput && this.mapFileInput.parentNode) {
      this.mapFileInput.parentNode.removeChild(this.mapFileInput);
    }

    super.shutdown();
  }
}
