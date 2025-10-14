import { ASSET_PATHS, GAME_CONSTANTS } from "../data/config";

import { WorldSystem } from "../systems/WorldSystem";
import { TilemapSystem } from "../systems/TilemapSystem";
import { Enemy } from "../entities/Enemy";
import { ExitZone } from "../entities/ExitZone";
import {
  WorldMapData,
  SpawnPoint,
  ExitZone as ExitZoneData,
} from "../types/map";

// MapEditorScene interfaces
interface EnemyData {
  id: string;
  type: string;
  enemyType: string;
  position: { x: number; y: number };
  properties: {
    damage: number;
    health: number;
    speed?: number;
    patrolRange?: number;
  };
}

interface MapEditorData {
  version: string;
  metadata: {
    name: string;
    description: string;
    created: string;
    author: string;
  };
  world: {
    width: number;
    height: number;
    tileSize: number;
  };
  player: {
    startPosition: { x: number; y: number };
    character: string;
  };
  portal: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  enemies: EnemyData[];
  platforms: any[];
  collectibles: any[];
  checkpoints: any[];
  tiles: any[];
}

interface ToolButton {
  button: Phaser.GameObjects.Text;
  tool: { name: string; key: string; color: string };
}

interface SpriteButton {
  sprite: Phaser.GameObjects.Image;
  border: Phaser.GameObjects.Rectangle;
}

export class MapEditorScene extends Phaser.Scene {
  public worldSystem!: WorldSystem;
  public tilemapSystem!: TilemapSystem;
  public mapData!: WorldMapData;
  public backgroundImage!: Phaser.GameObjects.Image;
  public gridGraphics!: Phaser.GameObjects.Graphics;
  public gridVisible: boolean = true;
  public isLoadingCustomMap: boolean = false;
  public selectedTool: string | null = null;
  public selectedSpriteIndex: number | null = null;
  public toolButtons: ToolButton[] = [];
  public spritePicker: Phaser.GameObjects.Rectangle | null = null;
  public spriteButtons: SpriteButton[] = [];
  public mapSelector: Phaser.GameObjects.Rectangle | null = null;
  public mapSelectorButtons: Phaser.GameObjects.Text[] = [];
  public spawnPointSelector: Phaser.GameObjects.Rectangle | null = null;
  public spawnPointSelectorButtons: Phaser.GameObjects.Text[] = [];
  public saveButton!: Phaser.GameObjects.Text;
  public loadButton!: Phaser.GameObjects.Text;
  public clearButton!: Phaser.GameObjects.Text;
  public backButton!: Phaser.GameObjects.Text;
  public objectInfoText!: Phaser.GameObjects.Text;
  public coordinateText!: Phaser.GameObjects.Text;
  public gridToggleButton!: Phaser.GameObjects.Text;
  public autotileToggleButton!: Phaser.GameObjects.Text;
  public previewObjects: Phaser.GameObjects.GameObject[] = [];
  public gameObjects: Phaser.GameObjects.GameObject[] = [];
  public exitZones: ExitZone[] = [];
  public mouseIndicator!: Phaser.GameObjects.Circle;
  public cursors!: any;
  public wasdKeys!: any;
  public cameraSpeed: number = 10;
  public isDragging: boolean = false;

  // Viewport properties for 80% width layout
  public viewportWidth!: number;
  public viewportHeight!: number;
  public rightPanelWidth!: number;
  public uiCamera!: Phaser.Cameras.Scene2D.Camera;
  public rightPanelGraphics!: Phaser.GameObjects.Graphics;

  // Map list UI
  public mapListContainer!: Phaser.GameObjects.Container;
  public mapListButtons: Phaser.GameObjects.Text[] = [];
  public createMapButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MapEditorScene" });

    // Flag to prevent default map override during custom map loading
    this.isLoadingCustomMap = false;
  }

  public preload(): void {
    // Assets are preloaded in LoadingScene
    // Just create tile textures from the preloaded tileset
    this.createTileTextures();
  }

  private createTileTextures(): void {
    // Check if tileset_sprites already exists to prevent duplicate texture creation
    if (this.textures.exists("tileset_sprites")) {
      return; // Texture already exists, skip creation
    }

    // Create individual tile textures from the 8x8 tileset (64 tiles total)
    const tileSize = 32; // Each tile is 32x32 pixels
    const tilesPerRow = 8; // 8 tiles per row in the tileset

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
  }

  public create(): void {
    console.log(`🗺️ MapEditorScene started!`);

    // Calculate viewport dimensions (80% of screen width)
    const gameWidth = (this as any).sys.game.scale.width;
    const gameHeight = (this as any).sys.game.scale.height;
    this.viewportWidth = Math.floor(gameWidth * 0.8);
    this.viewportHeight = gameHeight;
    this.rightPanelWidth = gameWidth - this.viewportWidth;

    console.log(
      `📐 Viewport: ${this.viewportWidth}x${this.viewportHeight}, Right panel: ${this.rightPanelWidth}px`
    );

    // Create black background for the right panel
    this.createRightPanelBackground();

    // Initialize world system
    this.worldSystem = new WorldSystem(this);

    // Set world bounds (adjusted for viewport)
    this.physics.world.setBounds(0, 0, 4128, 800);

    // Create background (only in the left viewport)
    this.createBackground();

    // Create tilemap system with correct initial dimensions for default map
    this.tilemapSystem = new TilemapSystem(this, 128, 31);

    // Create grid overlay for tile editing
    this.createGridOverlay();

    // Load default map data
    this.loadDefaultMap();

    // Create UI
    this.createEditorUI();

    // Create map list
    this.updateMapList();

    // Set up camera
    this.setupCamera();

    // Set up input
    this.setupInput();

    // Create preview objects
    this.createPreviewObjects();

    // Set up camera ignore lists (must be done after all objects are created)
    this.setupCameraIgnoreLists();
  }

  private loadDefaultMap(): void {
    // Don't load default world if we're currently loading a custom world
    if (this.isLoadingCustomMap) {
      return;
    }

    // Try to load default world file
    this.worldSystem
      .loadWorldFromURL(
        `${ASSET_PATHS.maps}/default_world.json?v=${Date.now()}`
      )
      .then((worldData) => {
        // Double-check flag in case it changed during async operation
        if (this.isLoadingCustomMap) {
          return;
        }

        const currentMap = this.worldSystem.getCurrentMap();
        if (currentMap) {
          this.mapData = currentMap;
          this.loadTileDataFromMap();
          this.updatePreviewObjects();
          this.updateMapList();

          // Make sure UI camera ignores all tile sprites after loading
          if (this.uiCamera) {
            this.setupCameraIgnoreLists();
          }
        }
      })
      .catch((error: Error) => {
        console.log("No default world found, creating new empty world");
        // Create a new empty world
        const worldData = this.worldSystem.createEmptyWorld("New World");
        const currentMap = this.worldSystem.getCurrentMap();
        if (currentMap) {
          this.mapData = currentMap;
          this.updatePreviewObjects();
          this.updateMapList();
        }
      });
  }

  private createRightPanelBackground(): void {
    // Create a second camera for the right panel UI (20% on the right)
    this.uiCamera = (this.cameras as any).add(
      this.viewportWidth, // x position (starts at 80% of screen width)
      0, // y position
      this.rightPanelWidth, // width (20% of screen)
      this.viewportHeight // height (full screen height)
    );

    // Make the UI camera not scroll
    this.uiCamera.scrollX = 0;
    this.uiCamera.scrollY = 0;

    // Create graphics object for the right panel background
    this.rightPanelGraphics = this.add.graphics();
    this.rightPanelGraphics.fillStyle(0x2a2a2a, 1.0);

    // Draw the dark grey background at coordinates (0, 0) relative to the UI camera
    // Since the UI camera's viewport starts at viewportWidth, we draw at (0,0) within that camera
    this.rightPanelGraphics.fillRect(
      0,
      0,
      this.rightPanelWidth,
      this.viewportHeight
    );

    // Make it stay fixed on screen (doesn't scroll with camera)
    this.rightPanelGraphics.setScrollFactor(0);

    // Make the main camera ignore the right panel graphics
    // So it's only rendered by the UI camera
    (this.cameras.main as any).ignore(this.rightPanelGraphics);

    // Make the UI camera ignore all objects EXCEPT the right panel graphics
    // This needs to be done after ALL objects are created, so we'll set up a method
    // to be called at the end of create()
  }

  private setupCameraIgnoreLists(): void {
    // Get all children in the scene
    const allChildren = (this.children as any).list || [];

    // Collect UI elements (those we want rendered by UI camera only)
    const uiElements = [
      this.rightPanelGraphics,
      ...this.toolButtons.map((tb) => tb.button),
      ...this.mapListButtons,
      this.saveButton,
      this.loadButton,
      this.clearButton,
      this.backButton,
      this.objectInfoText,
      this.coordinateText,
      this.gridToggleButton,
      this.autotileToggleButton,
    ].filter((el) => el !== undefined);

    // Also include all text elements in the right panel (titles, instructions, hints, etc.)
    const allTextElements = allChildren.filter(
      (child: any) => child.type === "Text"
    );
    uiElements.push(...allTextElements);

    // Make main camera ignore all UI elements
    if (uiElements.length > 0) {
      (this.cameras.main as any).ignore(uiElements);
    }

    // Make UI camera ignore everything EXCEPT UI elements and right panel graphics
    const mapElements = allChildren.filter(
      (child: any) => !uiElements.includes(child)
    );

    if (mapElements.length > 0) {
      (this.uiCamera as any).ignore(mapElements);
    }

    // Ignore tilemap sprites from UI camera
    this.ignoreTilemapSprites();

    // Ignore grid graphics from UI camera
    if (this.gridGraphics) {
      (this.uiCamera as any).ignore(this.gridGraphics);
    }

    // Ignore background image from UI camera
    if (this.backgroundImage) {
      (this.uiCamera as any).ignore(this.backgroundImage);
    }

    console.log(
      `🎥 Camera setup: Main camera ignoring ${uiElements.length} UI elements, UI camera ignoring ${mapElements.length} map elements`
    );
  }

  private ignoreTilemapSprites(): void {
    if (!this.uiCamera || !this.tilemapSystem) {
      return;
    }

    // Ignore all tilemap sprites (these are created dynamically)
    if (
      this.tilemapSystem.tileSprites &&
      this.tilemapSystem.tileSprites.length > 0
    ) {
      (this.uiCamera as any).ignore(this.tilemapSystem.tileSprites);
    }

    // Also ignore the tilemap visual layer
    if (this.tilemapSystem.visualLayer) {
      (this.uiCamera as any).ignore(this.tilemapSystem.visualLayer);
    }
  }

  private createBackground(): void {
    const backgroundKeys = ["background1", "background2", "background3"];
    const selectedBackground = backgroundKeys[0]; // Use first background for editor

    const worldWidth = 4100;
    const worldHeight = 800;
    const imageWidth = this.textures.get(selectedBackground).source[0].width;
    const imageHeight = this.textures.get(selectedBackground).source[0].height;

    const scaleX = worldWidth / imageWidth;
    const scaleY = worldHeight / imageHeight;
    const scale = Math.max(scaleX, scaleY);

    // Background images have empty space in first 6 columns (at 32px per tile = 192px)
    // Shift the background left to hide the empty space
    const emptySpaceWidth = 192; // 6 tiles * 32px
    const offsetX = -(emptySpaceWidth * scale) / 2;

    this.backgroundImage = this.add.image(
      (imageWidth * scale) / 2 + offsetX,
      worldHeight / 2,
      selectedBackground
    );
    this.backgroundImage.setScrollFactor(0.3);
    this.backgroundImage.setDepth(-10);
    this.backgroundImage.setScale(scale);
  }

  private createGridOverlay(): void {
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

  private createEditorUI(): void {
    // All UI elements are positioned relative to the right panel (UI camera)
    // The UI camera viewport starts at viewportWidth, but we position at 0 within that camera
    const panelPadding = 10;
    const panelWidth = this.rightPanelWidth;
    let yOffset = 20;

    // Title
    this.add.text(panelPadding, yOffset, "Map Editor", {
      fontSize: "20px",
      fill: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    yOffset += 30;

    // Instructions (wrapped for narrow panel)
    this.add.text(
      panelPadding,
      yOffset,
      "Click to place\nRight-click to remove\nDrag to paint tiles",
      {
        fontSize: "10px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      }
    );
    yOffset += 45;

    // Tool selection
    yOffset = this.createToolSelection(panelPadding, yOffset, panelWidth);

    // Map management buttons
    yOffset = this.createMapButtons(panelPadding, yOffset, panelWidth);

    // Object info display
    yOffset = this.createObjectInfo(panelPadding, yOffset, panelWidth);

    // Grid toggle
    yOffset = this.createGridToggle(panelPadding, yOffset, panelWidth);

    // Autotile toggle
    yOffset = this.createAutotileToggle(panelPadding, yOffset, panelWidth);

    // Keyboard shortcut hint
    this.add.text(
      panelPadding,
      yOffset,
      "Press T for tile selector\nPress G for grid toggle\nPress A for autotile",
      {
        fontSize: "10px",
        fill: "#ffff00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      }
    );
    yOffset += 45;

    // Create map resize controls
    this.createMapResizeControls(panelPadding, yOffset, panelWidth);
  }

  private createToolSelection(
    x: number,
    y: number,
    panelWidth: number
  ): number {
    const tools = [
      { name: "Spawn", key: "spawn", color: "#00ffff" },
      { name: "Exit", key: "exit", color: "#ffff00" },
      { name: "Portal", key: "portal", color: "#ff00ff" },
      { name: "Enemy1", key: "enemy1", color: "#ff0000" },
      { name: "Enemy2", key: "enemy2", color: "#ff8800" },
      { name: "Solid", key: "solid", color: "#8B4513" },
      { name: "Erase", key: "erase", color: "#000000" },
      { name: "Remove", key: "remove", color: "#ff0000" },
    ];

    this.selectedTool = null; // Start with no tool selected
    this.selectedSpriteIndex = null; // Track selected sprite for solid tiles
    this.toolButtons = [];

    // Grid layout: 3 rows x 3 columns (7 tools + 2 empty)
    const cols = 3;
    const rows = 3;
    const buttonWidth = 60;
    const buttonHeight = 25;
    const spacingX = 5;
    const spacingY = 5;

    tools.forEach((tool, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const buttonX = x + col * (buttonWidth + spacingX);
      const buttonY = y + row * (buttonHeight + spacingY);

      const button = this.add
        .text(buttonX, buttonY, tool.name, {
          fontSize: "10px",
          fill: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
          backgroundColor:
            this.selectedTool === tool.key ? tool.color : "#444444",
          padding: { x: 5, y: 3 },
        })
        .setInteractive();

      button.on("pointerdown", () => {
        if (tool.key === "solid") {
          this.openSpritePicker();
        } else {
          this.selectedTool = tool.key;
          this.selectedSpriteIndex = null;
          this.updateToolSelection();
        }
      });

      this.toolButtons.push({ button, tool });
    });

    // Return the Y position after the grid
    return y + rows * (buttonHeight + spacingY) + 10;
  }

  private updateToolSelection(): void {
    this.toolButtons.forEach(({ button, tool }) => {
      button.setFill("#ffffff"); // Always white text
      button.setBackgroundColor(
        this.selectedTool === tool.key ? tool.color : "#444444"
      );
    });
  }

  private openSpritePicker(): void {
    // Close existing sprite picker if open
    if (this.spritePicker) {
      this.closeSpritePicker();
      return;
    }

    // Center the sprite picker in the left viewport (80% of screen)
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    // Create sprite picker background
    this.spritePicker = this.add.rectangle(
      centerX,
      centerY,
      400,
      500,
      0x000000,
      0.8
    );
    this.spritePicker.setScrollFactor(0);
    this.spritePicker.setDepth(1000);

    // Create title
    this.add
      .text(centerX, centerY - 200, "Select Sprite", {
        fontSize: "18px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0.5);

    // Create sprite grid (8x8 = 64 sprites)
    this.spriteButtons = [];
    const spriteSize = 32;
    const spacing = 40;
    const startX = centerX - 4 * spacing;
    const startY = centerY - 150;

    for (let i = 0; i < 64; i++) {
      const x = startX + (i % 8) * spacing;
      const y = startY + Math.floor(i / 8) * spacing;

      // Create sprite preview
      const spriteButton = this.add.image(x, y, "tileset_sprites", i);
      spriteButton.setScrollFactor(0);
      spriteButton.setDepth(1001);
      spriteButton.setDisplaySize(spriteSize, spriteSize);
      spriteButton.setInteractive();

      // Add border
      const border = this.add.rectangle(
        x,
        y,
        spriteSize + 4,
        spriteSize + 4,
        0xffffff,
        0.3
      );
      border.setScrollFactor(0);
      border.setDepth(1000);

      spriteButton.on("pointerdown", () => {
        // Delay close to let the click handler finish first
        this.time.delayedCall(1, () => {
          this.selectedSpriteIndex = i;
          this.selectedTool = "solid";
          this.updateToolSelection();
          this.closeSpritePicker();
        });
      });

      spriteButton.on("pointerover", () => {
        border.setFillStyle(0x00ff00, 0.5);
      });

      spriteButton.on("pointerout", () => {
        border.setFillStyle(0xffffff, 0.3);
      });

      this.spriteButtons.push({ sprite: spriteButton, border });
    }

    // Add close button
    const closeButton = this.add
      .text(centerX, centerY + 220, "Close", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#aa0000",
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0.5)
      .setInteractive();

    closeButton.on("pointerdown", () => {
      // Delay close to let the click handler finish first
      this.time.delayedCall(1, () => {
        this.closeSpritePicker();
      });
    });
  }

  private closeSpritePicker(): void {
    // Hide and destroy sprite buttons and borders
    if (this.spriteButtons && this.spriteButtons.length > 0) {
      this.spriteButtons.forEach(({ sprite, border }) => {
        if (sprite && sprite.scene) {
          sprite.setVisible(false);
          sprite.setActive(false);
          sprite.destroy();
        }
        if (border && border.scene) {
          border.setVisible(false);
          border.setActive(false);
          border.destroy();
        }
      });
      this.spriteButtons = [];
    }

    // Hide and destroy the background
    if (this.spritePicker && this.spritePicker.scene) {
      this.spritePicker.setVisible(false);
      this.spritePicker.setActive(false);
      this.spritePicker.destroy();
      this.spritePicker = null;
    }

    // Destroy close button
    const closeButton = (this.children as any).list.find(
      (child: any) => child.text === "Close" && child.depth === 1001
    );
    if (closeButton) {
      closeButton.setVisible(false);
      closeButton.destroy();
    }

    // Destroy title
    const title = (this.children as any).list.find(
      (child: any) => child.text === "Select Sprite" && child.depth === 1001
    );
    if (title) {
      title.setVisible(false);
      title.destroy();
    }
  }

  private openMapSelector(callback: (mapId: string | null) => void): void {
    // Close existing selector if open
    if (this.mapSelector) {
      this.closeMapSelector();
      return;
    }

    // Center the selector in the left viewport (80% of screen)
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    // Create selector background
    this.mapSelector = this.add.rectangle(
      centerX,
      centerY,
      400,
      500,
      0x000000,
      0.8
    );
    this.mapSelector.setScrollFactor(0);
    this.mapSelector.setDepth(1000);

    // Create title
    const title = this.add
      .text(centerX, centerY - 220, "Select Target Map", {
        fontSize: "18px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0.5);

    this.mapSelectorButtons.push(title);

    // Get all available maps
    const mapIds = this.worldSystem.getAllMapIds();
    const startY = centerY - 180;
    const itemHeight = 40;
    const maxVisibleItems = 8;

    // Create scrollable list of maps
    mapIds.forEach((mapId, index) => {
      const map = this.worldSystem.getMap(mapId);
      if (!map) return;

      const yPos = startY + index * itemHeight;

      // Only show items that fit in the visible area
      if (index < maxVisibleItems) {
        const mapName = map.metadata.name || mapId;
        const isCurrentMap = mapId === this.worldSystem.currentMapId;
        const displayText = `${mapId} - ${mapName}${
          isCurrentMap ? " (current)" : ""
        }`;

        const button = this.add
          .text(centerX, yPos, displayText, {
            fontSize: "12px",
            fill: isCurrentMap ? "#00ff00" : "#ffffff",
            fontStyle: "bold",
            backgroundColor: "#444444",
            padding: { x: 10, y: 5 },
          })
          .setScrollFactor(0)
          .setDepth(1001)
          .setOrigin(0.5)
          .setInteractive();

        button.on("pointerdown", () => {
          // Delay close to let the click handler finish first
          this.time.delayedCall(1, () => {
            this.closeMapSelector();
            callback(mapId);
          });
        });

        button.on("pointerover", () => {
          button.setBackgroundColor("#666666");
        });

        button.on("pointerout", () => {
          button.setBackgroundColor("#444444");
        });

        this.mapSelectorButtons.push(button);
      }
    });

    // Add cancel button
    const cancelButton = this.add
      .text(centerX, centerY + 220, "Cancel", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#aa0000",
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0.5)
      .setInteractive();

    cancelButton.on("pointerdown", () => {
      console.log("Map selector cancelled");
      // Delay close to let the click handler finish first
      this.time.delayedCall(1, () => {
        this.closeMapSelector();
        callback(null);
      });
    });

    cancelButton.on("pointerover", () => {
      cancelButton.setBackgroundColor("#cc0000");
    });

    cancelButton.on("pointerout", () => {
      cancelButton.setBackgroundColor("#aa0000");
    });

    this.mapSelectorButtons.push(cancelButton);
  }

  private closeMapSelector(): void {
    console.log("Closing map selector...", {
      hasSelector: !!this.mapSelector,
      buttonsCount: this.mapSelectorButtons?.length,
    });

    // Hide and disable all buttons
    if (this.mapSelectorButtons && this.mapSelectorButtons.length > 0) {
      this.mapSelectorButtons.forEach((button, index) => {
        if (button && button.scene) {
          console.log(`Hiding button ${index}`);
          button.setVisible(false);
          button.setActive(false);
          button.destroy();
        }
      });
      this.mapSelectorButtons = [];
    }

    // Hide and disable the background
    if (this.mapSelector && this.mapSelector.scene) {
      console.log("Hiding selector background");
      this.mapSelector.setVisible(false);
      this.mapSelector.setActive(false);
      this.mapSelector.destroy();
      this.mapSelector = null;
    }

    console.log("Map selector closed");
  }

  private openSpawnPointSelector(
    mapId: string,
    callback: (spawnId: string | null) => void
  ): void {
    // Close existing selector if open
    if (this.spawnPointSelector) {
      this.closeSpawnPointSelector();
      return;
    }

    // Get the target map
    const targetMap = this.worldSystem.getMap(mapId);
    if (!targetMap) {
      console.error(`Map ${mapId} not found`);
      callback(null);
      return;
    }

    // Check if map has spawn points
    if (!targetMap.spawnPoints || targetMap.spawnPoints.length === 0) {
      alert(
        `Map "${mapId}" has no spawn points. Please add spawn points to that map first.`
      );
      callback(null);
      return;
    }

    // Center the selector in the left viewport (80% of screen)
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    // Create selector background
    this.spawnPointSelector = this.add.rectangle(
      centerX,
      centerY,
      400,
      500,
      0x000000,
      0.8
    );
    this.spawnPointSelector.setScrollFactor(0);
    this.spawnPointSelector.setDepth(1000);

    // Create title
    const mapName = targetMap.metadata.name || mapId;
    const title = this.add
      .text(centerX, centerY - 220, `Select Spawn Point\n(${mapName})`, {
        fontSize: "16px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0.5);

    this.spawnPointSelectorButtons.push(title);

    // Get all spawn points
    const spawnPoints = targetMap.spawnPoints;
    const startY = centerY - 160;
    const itemHeight = 40;
    const maxVisibleItems = 8;

    // Create scrollable list of spawn points
    spawnPoints.forEach((spawn, index) => {
      const yPos = startY + index * itemHeight;

      // Only show items that fit in the visible area
      if (index < maxVisibleItems) {
        const displayText = `${spawn.id} (${Math.round(spawn.x)}, ${Math.round(
          spawn.y
        )})`;

        const button = this.add
          .text(centerX, yPos, displayText, {
            fontSize: "12px",
            fill: "#ffffff",
            fontStyle: "bold",
            backgroundColor: "#444444",
            padding: { x: 10, y: 5 },
          })
          .setScrollFactor(0)
          .setDepth(1001)
          .setOrigin(0.5)
          .setInteractive();

        button.on("pointerdown", () => {
          // Delay close to let the click handler finish first
          this.time.delayedCall(1, () => {
            this.closeSpawnPointSelector();
            callback(spawn.id);
          });
        });

        button.on("pointerover", () => {
          button.setBackgroundColor("#666666");
        });

        button.on("pointerout", () => {
          button.setBackgroundColor("#444444");
        });

        this.spawnPointSelectorButtons.push(button);
      }
    });

    // Add cancel button
    const cancelButton = this.add
      .text(centerX, centerY + 220, "Cancel", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#aa0000",
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0.5)
      .setInteractive();

    cancelButton.on("pointerdown", () => {
      console.log("Spawn point selector cancelled");
      // Delay close to let the click handler finish first
      this.time.delayedCall(1, () => {
        this.closeSpawnPointSelector();
        callback(null);
      });
    });

    cancelButton.on("pointerover", () => {
      cancelButton.setBackgroundColor("#cc0000");
    });

    cancelButton.on("pointerout", () => {
      cancelButton.setBackgroundColor("#aa0000");
    });

    this.spawnPointSelectorButtons.push(cancelButton);
  }

  private closeSpawnPointSelector(): void {
    console.log("Closing spawn point selector...", {
      hasSelector: !!this.spawnPointSelector,
      buttonsCount: this.spawnPointSelectorButtons?.length,
    });

    // Hide and disable all buttons
    if (
      this.spawnPointSelectorButtons &&
      this.spawnPointSelectorButtons.length > 0
    ) {
      this.spawnPointSelectorButtons.forEach((button, index) => {
        if (button && button.scene) {
          console.log(`Hiding spawn button ${index}`);
          button.setVisible(false);
          button.setActive(false);
          button.destroy();
        }
      });
      this.spawnPointSelectorButtons = [];
    }

    // Hide and disable the background
    if (this.spawnPointSelector && this.spawnPointSelector.scene) {
      console.log("Hiding spawn point selector background");
      this.spawnPointSelector.setVisible(false);
      this.spawnPointSelector.setActive(false);
      this.spawnPointSelector.destroy();
      this.spawnPointSelector = null;
    }

    console.log("Spawn point selector closed");
  }

  public toggleGrid(): void {
    this.gridVisible = !this.gridVisible;
    this.gridGraphics.setVisible(this.gridVisible);
    this.gridToggleButton.setText(`Grid: ${this.gridVisible ? "ON" : "OFF"}`);
    this.gridToggleButton.setBackgroundColor(
      this.gridVisible ? "#00aa00" : "#aa0000"
    );
  }

  public toggleAutotile(): void {
    const currentState =
      this.tilemapSystem.autoTileSystem?.isEnabled() ?? false;
    const newState = !currentState;

    if (this.tilemapSystem.autoTileSystem) {
      this.tilemapSystem.autoTileSystem.setEnabled(newState);
    }

    if (this.autotileToggleButton) {
      this.autotileToggleButton.setText(`Autotile: ${newState ? "ON" : "OFF"}`);
      this.autotileToggleButton.setBackgroundColor(
        newState ? "#00aa00" : "#aa0000"
      );
    }

    // Don't redraw existing tiles - autotiling toggle only affects new tile placement
    // Existing tiles should remain unchanged
  }

  private createMapButtons(x: number, y: number, panelWidth: number): number {
    // Grid layout: 2 rows x 2 columns
    const cols = 2;
    const rows = 2;
    const buttonWidth = 85;
    const buttonHeight = 25;
    const spacingX = 5;
    const spacingY = 5;

    const buttons = [
      { name: "Save Map", color: "#00aa00", action: () => this.saveMap() },
      { name: "Load Map", color: "#0066aa", action: () => this.loadMap() },
      { name: "Clear All", color: "#aa0000", action: () => this.clearAll() },
      {
        name: "Back",
        color: "#0066cc",
        action: () => this.scene.start("CharacterSelectScene"),
      },
    ];

    buttons.forEach((buttonData, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const buttonX = x + col * (buttonWidth + spacingX);
      const buttonY = y + row * (buttonHeight + spacingY);

      const button = this.add
        .text(buttonX, buttonY, buttonData.name, {
          fontSize: "10px",
          fill: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
          backgroundColor: buttonData.color,
          padding: { x: 6, y: 4 },
        })
        .setInteractive();

      button.on("pointerdown", buttonData.action);

      // Store button references
      if (index === 0) this.saveButton = button;
      else if (index === 1) this.loadButton = button;
      else if (index === 2) this.clearButton = button;
      else if (index === 3) this.backButton = button;
    });

    // Return the Y position after the grid
    return y + rows * (buttonHeight + spacingY) + 10;
  }

  private createObjectInfo(x: number, y: number, panelWidth: number): number {
    let currentY = y;

    this.objectInfoText = this.add.text(x, currentY, "Selected: None", {
      fontSize: "9px",
      fill: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 1,
    });
    currentY += 12;

    this.coordinateText = this.add.text(x, currentY, "W:(0, 0) T:(0,0) Empty", {
      fontSize: "9px",
      fill: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 1,
    });
    currentY += 12;

    return currentY + 10;
  }

  private createGridToggle(x: number, y: number, panelWidth: number): number {
    this.gridVisible = true;
    this.gridToggleButton = this.add
      .text(x, y, "Grid: ON", {
        fontSize: "11px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#00aa00",
        padding: { x: 8, y: 4 },
      })
      .setInteractive();

    this.gridToggleButton.on("pointerdown", () => {
      this.gridVisible = !this.gridVisible;
      this.gridGraphics.setVisible(this.gridVisible);
      this.gridToggleButton.setText(`Grid: ${this.gridVisible ? "ON" : "OFF"}`);
      this.gridToggleButton.setBackgroundColor(
        this.gridVisible ? "#00aa00" : "#aa0000"
      );
    });

    return y + 25 + 10;
  }

  private createAutotileToggle(
    x: number,
    y: number,
    panelWidth: number
  ): number {
    const autotileEnabled =
      this.tilemapSystem.autoTileSystem?.isEnabled() ?? true;
    this.autotileToggleButton = this.add
      .text(x, y, `Autotile: ${autotileEnabled ? "ON" : "OFF"}`, {
        fontSize: "11px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: autotileEnabled ? "#00aa00" : "#aa0000",
        padding: { x: 8, y: 4 },
      })
      .setInteractive();

    this.autotileToggleButton.on("pointerdown", () => {
      const currentState =
        this.tilemapSystem.autoTileSystem?.isEnabled() ?? false;
      const newState = !currentState;

      if (this.tilemapSystem.autoTileSystem) {
        this.tilemapSystem.autoTileSystem.setEnabled(newState);
      }

      this.autotileToggleButton.setText(`Autotile: ${newState ? "ON" : "OFF"}`);
      this.autotileToggleButton.setBackgroundColor(
        newState ? "#00aa00" : "#aa0000"
      );

      // Don't redraw existing tiles - autotiling toggle only affects new tile placement
      // Existing tiles should remain unchanged
    });

    return y + 25 + 10;
  }

  private createMapResizeControls(
    x: number,
    y: number,
    panelWidth: number
  ): number {
    let currentY = y;

    // Map size display
    const mapSizeText = this.add.text(
      x,
      currentY,
      `Map: ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight}`,
      {
        fontSize: "10px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      }
    );
    currentY += 20;

    // Add row button
    const addRowButton = this.add
      .text(x, currentY, "+ Row", {
        fontSize: "10px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#00aa00",
        padding: { x: 6, y: 3 },
      })
      .setInteractive();

    addRowButton.on("pointerdown", () => {
      this.tilemapSystem.resizeMap(
        this.tilemapSystem.mapWidth,
        this.tilemapSystem.mapHeight + 1
      );
      this.updateMapAfterResize();
      mapSizeText.setText(
        `Map: ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight}`
      );
    });

    // Remove row button
    const removeRowButton = this.add
      .text(x + 50, currentY, "- Row", {
        fontSize: "10px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#aa0000",
        padding: { x: 6, y: 3 },
      })
      .setInteractive();

    removeRowButton.on("pointerdown", () => {
      if (this.tilemapSystem.mapHeight > 1) {
        this.tilemapSystem.resizeMap(
          this.tilemapSystem.mapWidth,
          this.tilemapSystem.mapHeight - 1
        );
        this.updateMapAfterResize();
        mapSizeText.setText(
          `Map: ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight}`
        );
      }
    });
    currentY += 22;

    // Add column button
    const addColumnButton = this.add
      .text(x, currentY, "+ Col", {
        fontSize: "10px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#00aa00",
        padding: { x: 6, y: 3 },
      })
      .setInteractive();

    addColumnButton.on("pointerdown", () => {
      this.tilemapSystem.resizeMap(
        this.tilemapSystem.mapWidth + 1,
        this.tilemapSystem.mapHeight
      );
      this.updateMapAfterResize();
      mapSizeText.setText(
        `Map: ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight}`
      );
    });

    // Remove column button
    const removeColumnButton = this.add
      .text(x + 50, currentY, "- Col", {
        fontSize: "10px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#aa0000",
        padding: { x: 6, y: 3 },
      })
      .setInteractive();

    removeColumnButton.on("pointerdown", () => {
      if (this.tilemapSystem.mapWidth > 1) {
        this.tilemapSystem.resizeMap(
          this.tilemapSystem.mapWidth - 1,
          this.tilemapSystem.mapHeight
        );
        this.updateMapAfterResize();
        mapSizeText.setText(
          `Map: ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight}`
        );
      }
    });
    currentY += 22;

    return currentY + 10;
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, 4100, 800);

    // Set camera viewport to only use the left 80% of the screen
    (this.cameras.main as any).setViewport(
      0,
      0,
      this.viewportWidth,
      this.viewportHeight
    );

    // Calculate zoom to fit the viewport properly
    const zoomX = this.viewportWidth / 1200; // Original width was 1200
    const zoomY = this.viewportHeight / 800; // Original height was 800
    const zoom = Math.min(zoomX, zoomY) * 0.8; // Keep the original 0.8 factor

    this.cameras.main.setZoom(zoom);

    // Center the camera initially
    this.cameras.main.centerOn(2050, 400);
  }

  private setupInput(): void {
    // Mouse input
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
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
        // Start dragging for tile tools and remove tool
        if (
          this.selectedTool &&
          ["ground", "platform", "wall", "solid", "erase", "remove"].includes(
            this.selectedTool
          )
        ) {
          this.isDragging = true;
        }
      }
    });

    // Handle mouse move for dragging
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && pointer.isDown) {
        const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
        const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
        this.placeObject(worldX, worldY);
      }
    });

    // Handle mouse up to stop dragging
    this.input.on("pointerup", () => {
      this.isDragging = false;
    });

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys("W,S,A,D");

    // Add T key handler for tile selector
    this.input.keyboard.on("keydown-T", () => {
      this.openSpritePicker();
    });

    // Add G key handler for grid toggle
    this.input.keyboard.on("keydown-G", () => {
      this.toggleGrid();
    });

    // Add A key handler for autotile toggle
    this.input.keyboard.on("keydown-A", () => {
      this.toggleAutotile();
    });

    // Camera controls
    this.cameraSpeed = 10; // Increased speed for better navigation
  }

  private isClickOnUI(pointer: Phaser.Input.Pointer): boolean {
    // Check if click is on the right panel (where all UI is located)
    // Right panel starts at viewportWidth (80% of screen width)
    if (pointer.x >= this.viewportWidth) {
      return true;
    }

    // Check if any modal is open
    if (this.spritePicker || this.mapSelector || this.spawnPointSelector) {
      return true; // Block all map interactions when a modal is open
    }

    return false;
  }

  private createPreviewObjects(): void {
    this.previewObjects = [];
    this.gameObjects = [];

    // Create mouse cursor indicator
    this.mouseIndicator = this.add.circle(0, 0, 5, 0xffffff, 0.8);
    this.mouseIndicator.setDepth(100);
    this.mouseIndicator.setVisible(false);
  }

  private placeObject(x: number, y: number): void {
    // Check if a tool is selected
    if (!this.selectedTool) {
      return;
    }

    switch (this.selectedTool) {
      case "spawn":
        this.addSpawnPoint(x, y);
        break;
      case "exit":
        this.addExitZone(x, y);
        break;
      case "player":
        this.updatePlayerPosition(x, y);
        break;
      case "portal":
        this.updatePortalPosition(x, y);
        break;
      case "enemy1":
      case "enemy2":
        this.addEnemy(x, y, this.selectedTool);
        break;
      case "ground":
      case "platform":
      case "wall":
      case "solid":
        // All solid tiles now use the same SOLID type with selected sprite
        this.placeTile(
          x,
          y,
          TilemapSystem.TILE_TYPES.SOLID,
          this.selectedSpriteIndex
        );
        break;
      case "erase":
        this.eraseTile(x, y);
        break;
      case "remove":
        this.removeObjectAt(x, y);
        break;
    }

    this.updateObjectInfo();
  }

  private removeObjectAt(x: number, y: number): void {
    // Try to find and remove the closest object to the click position
    // Only remove one object per click

    let closestObject: {
      type: string;
      distance: number;
      index: number;
    } | null = null;

    // Check enemies
    this.mapData.enemies.forEach((enemy, index) => {
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        enemy.position.x,
        enemy.position.y
      );
      if (distance <= 50) {
        if (!closestObject || distance < closestObject.distance) {
          closestObject = { type: "enemy", distance, index };
        }
      }
    });

    // Check spawn points
    this.mapData.spawnPoints.forEach((spawn, index) => {
      const distance = Phaser.Math.Distance.Between(x, y, spawn.x, spawn.y);
      if (distance <= 50) {
        if (!closestObject || distance < closestObject.distance) {
          closestObject = { type: "spawn", distance, index };
        }
      }
    });

    // Check exit zones
    this.mapData.exits.forEach((exit, index) => {
      // Check if click is within the exit zone bounds
      const isInside =
        x >= exit.x &&
        x <= exit.x + exit.width &&
        y >= exit.y &&
        y <= exit.y + exit.height;
      // Also check distance from center for easier selection
      const centerX = exit.x + exit.width / 2;
      const centerY = exit.y + exit.height / 2;
      const distance = Phaser.Math.Distance.Between(x, y, centerX, centerY);

      if (isInside || distance <= 75) {
        if (!closestObject || distance < closestObject.distance) {
          closestObject = { type: "exit", distance, index };
        }
      }
    });

    // Remove only the closest object
    if (closestObject) {
      switch (closestObject.type) {
        case "enemy":
          this.mapData.enemies.splice(closestObject.index, 1);
          console.log("Removed enemy");
          break;
        case "spawn":
          this.mapData.spawnPoints.splice(closestObject.index, 1);
          console.log("Removed spawn point");
          break;
        case "exit":
          this.mapData.exits.splice(closestObject.index, 1);
          console.log("Removed exit zone");
          break;
      }
      this.updatePreviewObjects();
    }
  }

  private updatePlayerPosition(x: number, y: number): void {
    this.mapData.player.startPosition.x = Math.round(x);
    this.mapData.player.startPosition.y = Math.round(y);
    this.updatePreviewObjects();
  }

  private updatePortalPosition(x: number, y: number): void {
    this.mapData.portal.position.x = Math.round(x);
    this.mapData.portal.position.y = Math.round(y);
    this.updatePreviewObjects();
  }

  private addEnemy(x: number, y: number, enemyType: string): void {
    const enemyId = `enemy_${Date.now()}`;
    const enemy = {
      id: enemyId,
      type: "stationary",
      enemyType: enemyType,
      position: { x: Math.round(x), y: Math.round(y) },
      properties: {
        damage: 20,
        health: 50,
        maxHealth: 50,
        collisionCooldown: 1000,
      },
    };

    this.mapData.enemies.push(enemy as any);
    this.updatePreviewObjects();
  }

  private addSpawnPoint(x: number, y: number): void {
    // Auto-generate sequential spawn point ID
    const nextIndex = this.mapData.spawnPoints.length + 1;
    const spawnId = `spawn_${nextIndex}`;

    // Create new spawn point
    this.mapData.spawnPoints.push({
      id: spawnId,
      x: Math.round(x),
      y: Math.round(y),
    });

    console.log(
      `Created spawn point "${spawnId}" at (${Math.round(x)}, ${Math.round(y)})`
    );
    this.updatePreviewObjects();
  }

  private addExitZone(x: number, y: number): void {
    // Auto-generate sequential exit ID
    const nextIndex = this.mapData.exits.length + 1;
    const exitId = `exit_${nextIndex}`;

    // Step 1: Select target map
    this.openMapSelector((targetMapId) => {
      if (!targetMapId) {
        return; // User cancelled
      }

      // Step 2: Select spawn point in that map
      this.openSpawnPointSelector(targetMapId, (targetSpawnId) => {
        if (!targetSpawnId) {
          return; // User cancelled
        }

        // Create new exit with selected values
        this.mapData.exits.push({
          id: exitId,
          x: Math.round(x),
          y: Math.round(y),
          width: 100,
          height: 100,
          targetMapId: targetMapId,
          targetSpawnId: targetSpawnId,
        });

        console.log(
          `✅ Created exit "${exitId}" → map "${targetMapId}" spawn "${targetSpawnId}"`
        );
        this.updatePreviewObjects();
      });
    });
  }

  private placeTile(
    x: number,
    y: number,
    tileType: number,
    spriteIndex: number | null = null
  ): void {
    // Convert world coordinates to tile coordinates
    const tilePos = this.tilemapSystem.worldToTile(x, y);

    // Check if coordinates are within bounds
    if (
      tilePos.x >= 0 &&
      tilePos.x < this.tilemapSystem.mapWidth &&
      tilePos.y >= 0 &&
      tilePos.y < this.tilemapSystem.mapHeight
    ) {
      this.tilemapSystem.setTile(tilePos.x, tilePos.y, tileType, spriteIndex);
    }
  }

  private eraseTile(x: number, y: number): void {
    // Convert world coordinates to tile coordinates
    const tilePos = this.tilemapSystem.worldToTile(x, y);

    // Check if coordinates are within bounds
    if (
      tilePos.x >= 0 &&
      tilePos.x < this.tilemapSystem.mapWidth &&
      tilePos.y >= 0 &&
      tilePos.y < this.tilemapSystem.mapHeight
    ) {
      this.tilemapSystem.setTile(
        tilePos.x,
        tilePos.y,
        TilemapSystem.TILE_TYPES.EMPTY
      );
    }
  }

  private updatePreviewObjects(): void {
    // Clear existing preview objects
    this.previewObjects.forEach((obj) => obj.destroy());
    this.previewObjects = [];

    // Clear existing exit zones
    this.exitZones.forEach((exit) => exit.destroy());
    this.exitZones = [];

    // Create spawn point previews
    this.mapData.spawnPoints.forEach((spawn) => {
      const spawnPreview = this.add.circle(spawn.x, spawn.y, 15, 0x00ffff, 0.7);
      spawnPreview.setDepth(50);
      this.previewObjects.push(spawnPreview);

      // Add label
      const label = this.add.text(spawn.x, spawn.y - 25, spawn.id, {
        fontSize: "10px",
        fill: "#00ffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#000000aa",
        padding: { x: 3, y: 2 },
      });
      label.setOrigin(0.5);
      label.setDepth(50);
      this.previewObjects.push(label);
    });

    // Create exit zone previews
    this.mapData.exits.forEach((exitData) => {
      const exitZone = new ExitZone(this, exitData);
      this.exitZones.push(exitZone);
    });

    // Create player preview if it exists
    if (this.mapData.player) {
      const playerPos = this.mapData.player.startPosition;
      const playerPreview = this.add.circle(
        playerPos.x,
        playerPos.y,
        20,
        0x00ff00,
        0.7
      );
      playerPreview.setDepth(50);
      this.previewObjects.push(playerPreview);
    }

    // Create portal preview if it exists
    if (this.mapData.portal) {
      const portalPos = this.mapData.portal.position;
      const portalPreview = this.add.circle(
        portalPos.x,
        portalPos.y,
        30,
        0xff00ff,
        0.7
      );
      portalPreview.setDepth(50);
      this.previewObjects.push(portalPreview);
    }

    // Create enemy previews
    this.mapData.enemies.forEach((enemy) => {
      const enemyColor = enemy.enemyType === "enemy1" ? 0xff0000 : 0xff8800;
      const enemyPreview = this.add.circle(
        enemy.position.x,
        enemy.position.y,
        15,
        enemyColor,
        0.7
      );
      enemyPreview.setDepth(50);
      this.previewObjects.push(enemyPreview);
    });

    // Make sure UI camera ignores all preview objects and exit zones
    if (this.uiCamera) {
      if (this.previewObjects.length > 0) {
        (this.uiCamera as any).ignore(this.previewObjects);
      }
      if (this.exitZones.length > 0) {
        (this.uiCamera as any).ignore(this.exitZones);
      }
    }
  }

  private updateObjectInfo(): void {
    this.objectInfoText.setText(`Selected: ${this.selectedTool || "None"}`);
  }

  public async saveMap(): Promise<void> {
    // Save tile data to current map
    this.saveTileDataToMap();

    // Update current map in world system
    this.worldSystem.updateCurrentMap(this.mapData);

    // Save entire world
    const success = await this.worldSystem.saveWorld();
    if (success) {
      console.log("World saved successfully");
    } else {
      console.log("World save cancelled or failed");
    }
  }

  private saveTileDataToMap(): void {
    // Convert tilemap data to map format
    if (!this.mapData.tiles) {
      this.mapData.tiles = [];
    }

    // Update world dimensions to match tilemap dimensions
    this.mapData.world.width =
      this.tilemapSystem.mapWidth * this.tilemapSystem.tileSize;
    this.mapData.world.height =
      this.tilemapSystem.mapHeight * this.tilemapSystem.tileSize;

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
          spriteIndex: spriteIndex,
        };
      }
    }
  }

  private loadMap(): void {
    // Create file input for loading
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.isLoadingCustomMap = true; // Set flag to prevent default world override

        this.worldSystem
          .loadWorld(file)
          .then((worldData) => {
            const currentMap = this.worldSystem.getCurrentMap();
            if (currentMap) {
              this.mapData = currentMap;
              this.loadTileDataFromMap();
              this.updatePreviewObjects();
              this.updateMapList();
            }
            this.isLoadingCustomMap = false; // Clear flag
          })
          .catch((error: Error) => {
            console.error("Error loading world:", error);
            alert("Error loading world: " + error.message);
            this.isLoadingCustomMap = false; // Clear flag on error
          });
      }
      document.body.removeChild(fileInput);
    });

    fileInput.click();
  }

  private loadTileDataFromMap(): void {
    console.log(
      `🗺️ Loading tile data from map: ${
        this.mapData.metadata?.name || "Unknown"
      }`
    );

    // If map has world dimensions, resize tilemap to match
    if (this.mapData.world) {
      const mapWidthInTiles = Math.floor(
        this.mapData.world.width / this.tilemapSystem.tileSize
      );
      const mapHeightInTiles = Math.floor(
        this.mapData.world.height / this.tilemapSystem.tileSize
      );

      if (
        mapWidthInTiles !== this.tilemapSystem.mapWidth ||
        mapHeightInTiles !== this.tilemapSystem.mapHeight
      ) {
        console.log(
          `🔄 Resizing tilemap from ${this.tilemapSystem.mapWidth}×${this.tilemapSystem.mapHeight} to ${mapWidthInTiles}×${mapHeightInTiles}`
        );
        this.tilemapSystem.resizeMap(mapWidthInTiles, mapHeightInTiles);
        this.updateMapAfterResize();
      }
    }

    // Load tile data from map
    if (this.mapData.tiles && Array.isArray(this.mapData.tiles)) {
      // Clear existing tiles
      for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
        for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
          this.tilemapSystem.setTile(x, y, TilemapSystem.TILE_TYPES.EMPTY);
        }
      }

      // Load tile data
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
                tileData.type,
                tileData.spriteIndex
              );
            } else if (typeof tileData === "number") {
              // Number format: just tile type
              this.tilemapSystem.setTile(x, y, tileData);
            }
          }
        }
      }

      console.log(
        `✅ Tile data loaded successfully. Map dimensions: ${
          this.mapData.tiles.length
        } rows x ${this.mapData.tiles[0]?.length || 0} columns`
      );

      // Create collision bodies AFTER tile data is loaded (same as GameScene)
      this.tilemapSystem.createCollisionBodies();
    }
  }

  private clearAll(): void {
    this.mapData.enemies = [];

    // Clear all tiles
    for (let y = 0; y < this.tilemapSystem.mapHeight; y++) {
      for (let x = 0; x < this.tilemapSystem.mapWidth; x++) {
        this.tilemapSystem.setTile(x, y, TilemapSystem.TILE_TYPES.EMPTY);
      }
    }

    this.updatePreviewObjects();
  }

  private updateMapAfterResize(): void {
    // Update world bounds
    this.physics.world.setBounds(
      0,
      0,
      this.tilemapSystem.getWorldWidth(),
      this.tilemapSystem.getWorldHeight()
    );

    // Update camera bounds
    this.cameras.main.setBounds(
      0,
      0,
      this.tilemapSystem.getWorldWidth(),
      this.tilemapSystem.getWorldHeight()
    );

    // Update background
    this.backgroundImage.destroy();
    this.createBackground();

    // Update grid
    this.gridGraphics.destroy();
    this.createGridOverlay();

    // Make sure UI camera ignores the new grid and background
    if (this.uiCamera) {
      if (this.gridGraphics) {
        (this.uiCamera as any).ignore(this.gridGraphics);
      }
      if (this.backgroundImage) {
        (this.uiCamera as any).ignore(this.backgroundImage);
      }
    }

    // Update map data world dimensions
    if (this.mapData) {
      this.mapData.world.width = this.tilemapSystem.getWorldWidth();
      this.mapData.world.height = this.tilemapSystem.getWorldHeight();
    }
  }

  public update(): void {
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

    this.coordinateText.setText(
      `W:(${Math.round(worldX)}, ${Math.round(
        worldY
      )}) T:(${tileX},${tileY}) ${tileTypeName}`
    );

    // Update mouse indicator
    if (this.mouseIndicator) {
      this.mouseIndicator.setPosition(worldX, worldY);
      this.mouseIndicator.setVisible(true);
    }

    // Continuously ensure UI camera ignores all tilemap sprites
    // (needed because tiles are created dynamically during editing)
    this.ignoreTilemapSprites();
  }

  private getTileTypeName(tileType: number): string {
    switch (tileType) {
      case TilemapSystem.TILE_TYPES.EMPTY:
        return "Empty";
      case TilemapSystem.TILE_TYPES.SOLID:
        return "Solid";
      default:
        return `Unknown(${tileType})`;
    }
  }

  // Update map list in the right panel
  private updateMapList(): void {
    // Clear existing map list
    this.mapListButtons.forEach((button) => button.destroy());
    this.mapListButtons = [];

    if (this.createMapButton) {
      this.createMapButton.destroy();
    }

    // Position for map list in right panel
    const panelPadding = 10;
    let yOffset = this.viewportHeight - 250; // Start from bottom of panel

    // Title
    const title = this.add.text(panelPadding, yOffset, "Maps", {
      fontSize: "14px",
      fill: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.mapListButtons.push(title);
    yOffset += 20;

    // Get all maps from world
    const mapIds = this.worldSystem.getAllMapIds();
    const currentMapId = this.worldSystem.currentMapId;

    // Create button for each map
    mapIds.forEach((mapId) => {
      const map = this.worldSystem.getMap(mapId);
      if (!map) return;

      const isActive = mapId === currentMapId;
      const button = this.add
        .text(
          panelPadding,
          yOffset,
          `${isActive ? "● " : "  "}${mapId}\n  ${map.metadata.name}`,
          {
            fontSize: "10px",
            fill: isActive ? "#00ff00" : "#ffffff",
            fontStyle: isActive ? "bold" : "normal",
            stroke: "#000000",
            strokeThickness: 1,
            backgroundColor: isActive ? "#00330044" : "#44444444",
            padding: { x: 4, y: 2 },
          }
        )
        .setInteractive();

      button.on("pointerdown", () => {
        this.switchToMap(mapId);
      });

      this.mapListButtons.push(button);
      yOffset += 30;
    });

    // Create "New Map" button
    this.createMapButton = this.add
      .text(panelPadding, yOffset, "+ New Map", {
        fontSize: "11px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#0066aa",
        padding: { x: 8, y: 4 },
      })
      .setInteractive();

    this.createMapButton.on("pointerdown", () => {
      this.createNewMap();
    });

    this.mapListButtons.push(this.createMapButton);
  }

  // Switch to a different map
  private switchToMap(mapId: string): void {
    // Save current map data before switching
    this.saveTileDataToMap();
    this.worldSystem.updateCurrentMap(this.mapData);

    // Load new map
    const newMap = this.worldSystem.getMap(mapId);
    if (!newMap) {
      console.error(`Map ${mapId} not found`);
      return;
    }

    this.worldSystem.currentMapId = mapId;
    this.mapData = newMap;

    // Reload the map
    this.loadTileDataFromMap();
    this.updatePreviewObjects();
    this.updateMapList();
  }

  // Create a new map
  private createNewMap(): void {
    // Auto-generate map name based on number of maps
    const mapCount = this.worldSystem.getAllMapIds().length;
    const mapName = `Map ${mapCount + 1}`;

    // Create new map in world
    const newMap = this.worldSystem.createNewMap(mapName);

    console.log(`✅ Created new map: ${newMap.id} (${mapName})`);

    // Switch to the new map
    this.switchToMap(newMap.id);
  }
}
