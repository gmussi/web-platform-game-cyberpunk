import { ASSET_PATHS, GAME_CONSTANTS } from "../data/config";

import { WorldSystem } from "../systems/WorldSystem";
import { TilemapSystem } from "../systems/TilemapSystem";
import { WorldViewRenderer } from "../systems/WorldViewRenderer";
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

interface DetectedExit {
  edge: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tileStart: number;
  tileEnd: number;
  edgeStart: number;
  edgeEnd: number;
  edgePosition: number;
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
  public worldViewRenderer!: WorldViewRenderer;
  public tilemapSystem!: TilemapSystem;
  public mapData!: WorldMapData;
  public backgroundImage!: Phaser.GameObjects.GameObject;
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
  public worldSeedText?: Phaser.GameObjects.Text;
  public gridToggleButton!: Phaser.GameObjects.Text;
  public autotileToggleButton!: Phaser.GameObjects.Text;
  public layerToggleButtons: {
    bg: Phaser.GameObjects.Text;
    dec: Phaser.GameObjects.Text;
    game: Phaser.GameObjects.Text;
  } | null = null;
  public selectedLayer: "background" | "decoration" | "game" = "game";
  public generateWorldButton!: Phaser.GameObjects.Text;
  public previewObjects: Phaser.GameObjects.GameObject[] = [];
  public gameObjects: Phaser.GameObjects.GameObject[] = [];
  public exitZones: ExitZone[] = [];
  public mouseIndicator!: Phaser.GameObjects.Circle;
  public cursors!: any;
  public wasdKeys!: any;
  public toggleKey!: Phaser.Input.Keyboard.Key;
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

    // Initialize world view renderer (show all maps in editor)
    this.worldViewRenderer = new WorldViewRenderer(
      this,
      this.worldSystem.worldData,
      this.worldSystem.visitedMaps,
      () => this.worldSystem.currentMapId,
      true, // showAllMaps = true for map editor
      (mapId: string) => {
        if (mapId && mapId !== this.worldSystem.currentMapId) {
          this.switchToMap(mapId);
        }
      }
    );

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

        // Update world view renderer with loaded world data
        this.worldViewRenderer.setWorldData(worldData);

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

    // Also ignore background and decoration sprites
    if (
      (this.tilemapSystem as any).backgroundSprites &&
      (this.tilemapSystem as any).backgroundSprites.length > 0
    ) {
      (this.uiCamera as any).ignore(
        (this.tilemapSystem as any).backgroundSprites
      );
    }
    if (
      (this.tilemapSystem as any).decorationSprites &&
      (this.tilemapSystem as any).decorationSprites.length > 0
    ) {
      (this.uiCamera as any).ignore(
        (this.tilemapSystem as any).decorationSprites
      );
    }

    // Also ignore the tilemap visual layer
    if (this.tilemapSystem.visualLayer) {
      (this.uiCamera as any).ignore(this.tilemapSystem.visualLayer);
    }
  }

  private createBackground(): void {
    const worldWidth = this.tilemapSystem
      ? this.tilemapSystem.getWorldWidth()
      : 4100;
    const worldHeight = this.tilemapSystem
      ? this.tilemapSystem.getWorldHeight()
      : 800;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, worldWidth as number, worldHeight as number);
    bg.setScrollFactor(1);
    bg.setDepth(-10);

    this.backgroundImage = bg as unknown as Phaser.GameObjects.GameObject;
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

    // Layer selector and visibility toggles
    yOffset = this.createLayerControls(panelPadding, yOffset);

    // Tool selection
    yOffset = this.createToolSelection(panelPadding, yOffset, panelWidth);

    // Map management buttons
    yOffset = this.createMapButtons(panelPadding, yOffset, panelWidth);

    // Generate World button
    yOffset = this.createGenerateWorldButton(panelPadding, yOffset);

    // Regenerate room buttons (algorithms)
    yOffset = this.createRegenerateButtons(panelPadding, yOffset, panelWidth);

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

  private createLayerControls(x: number, y: number): number {
    const label = this.add.text(x, y, "Layer:", {
      fontSize: "11px",
      fill: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    let currentY = y + 16;

    const makeBtn = (txt: string, onClick: () => void, bg: string) => {
      const t = this.add.text(x, currentY, txt, {
        fontSize: "10px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: bg,
        padding: { x: 6, y: 3 },
      });
      t.setInteractive();
      t.on("pointerdown", onClick);
      currentY += 22;
      return t;
    };

    const selectColor = (layer: string) =>
      this.selectedLayer === layer ? "#1e88e5" : "#444444";
    const btnBg = makeBtn(
      `Background (select)`,
      () => {
        this.selectedLayer = "background";
        this.updateLayerButtons();
      },
      selectColor("background")
    );
    const btnDec = makeBtn(
      `Decoration (select)`,
      () => {
        this.selectedLayer = "decoration";
        this.updateLayerButtons();
      },
      selectColor("decoration")
    );
    const btnGame = makeBtn(
      `Game (select)`,
      () => {
        this.selectedLayer = "game";
        this.updateLayerButtons();
      },
      selectColor("game")
    );

    // Visibility toggles row
    const makeVis = (
      labelTxt: string,
      layer: "background" | "decoration" | "game"
    ) => {
      const vis = this.add.text(
        x + 140,
        currentY -
          66 +
          (layer === "decoration" ? 22 : layer === "game" ? 44 : 0),
        `${labelTxt}: ON`,
        {
          fontSize: "10px",
          fill: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
          backgroundColor: "#00aa00",
          padding: { x: 6, y: 3 },
        }
      );
      vis.setInteractive();
      vis.on("pointerdown", () => {
        // toggle
        const current = (this.tilemapSystem as any)[`${layer}Visible`];
        this.tilemapSystem.setLayerVisible(layer, !current);
        vis.setText(`${labelTxt}: ${!current ? "ON" : "OFF"}`);
        vis.setBackgroundColor(!current ? "#00aa00" : "#aa0000");
      });
      return vis;
    };

    const visBg = makeVis("BG", "background");
    const visDec = makeVis("DEC", "decoration");
    const visGame = makeVis("GAME", "game");
    this.layerToggleButtons = { bg: visBg, dec: visDec, game: visGame };

    return currentY;
  }

  private updateLayerButtons(): void {
    // Update the background of the three selection buttons (search by text)
    const setBg = (textVal: string, active: boolean) => {
      const btn = (this.children as any).list.find(
        (c: any) => c.text === textVal
      );
      if (btn) btn.setBackgroundColor(active ? "#1e88e5" : "#444444");
    };
    setBg("Background (select)", this.selectedLayer === "background");
    setBg("Decoration (select)", this.selectedLayer === "decoration");
    setBg("Game (select)", this.selectedLayer === "game");
  }

  private createGenerateWorldButton(x: number, y: number): number {
    this.generateWorldButton = this.add
      .text(x, y, "Generate World", {
        fontSize: "11px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#4b0082",
        padding: { x: 8, y: 4 },
      })
      .setInteractive();

    this.generateWorldButton.on("pointerdown", () => this.openWorldGenModal());

    return y + 25 + 10;
  }

  private openWorldGenModal(): void {
    // Ensure the world viewer is closed before showing the modal
    if (this.worldViewRenderer && this.worldViewRenderer.getIsVisible()) {
      this.worldViewRenderer.hide();
    }

    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    const modalBg = this.add.rectangle(
      centerX,
      centerY,
      420,
      260,
      0x000000,
      0.9
    );
    modalBg.setScrollFactor(0);
    modalBg.setDepth(1000);

    const title = this.add
      .text(centerX, centerY - 110, "Generate World", {
        fontSize: "18px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(1001);

    const labelSeed = this.add
      .text(centerX - 160, centerY - 60, "Seed:", {
        fontSize: "12px",
        fill: "#ffffff",
      })
      .setOrigin(0, 0.5);
    labelSeed.setScrollFactor(0);
    labelSeed.setDepth(1001);

    const labelRooms = this.add
      .text(centerX - 160, centerY - 20, "Rooms:", {
        fontSize: "12px",
        fill: "#ffffff",
      })
      .setOrigin(0, 0.5);
    labelRooms.setScrollFactor(0);
    labelRooms.setDepth(1001);

    const labelGates = this.add
      .text(centerX - 160, centerY + 20, "Gate Freq (0-1):", {
        fontSize: "12px",
        fill: "#ffffff",
      })
      .setOrigin(0, 0.5);
    labelGates.setScrollFactor(0);
    labelGates.setDepth(1001);

    const seedInput = document.createElement("input");
    seedInput.type = "text";
    seedInput.value = "1760562930795";
    const roomsInput = document.createElement("input");
    roomsInput.type = "number";
    roomsInput.min = "4";
    roomsInput.value = "16";
    const gateInput = document.createElement("input");
    gateInput.type = "number";
    gateInput.step = "0.05";
    gateInput.min = "0";
    gateInput.max = "1";
    gateInput.value = "0.25";

    const positionInput = (
      el: HTMLInputElement,
      x: number,
      y: number,
      w = 160
    ) => {
      el.style.position = "fixed";
      el.style.left = `${x - w / 2}px`;
      el.style.top = `${y - 10}px`;
      el.style.width = `${w}px`;
      el.style.zIndex = "10000";
      document.body.appendChild(el);
    };

    const canvasBounds = (
      this.sys.game.canvas as unknown as HTMLCanvasElement
    ).getBoundingClientRect();
    positionInput(
      seedInput,
      canvasBounds.left + centerX + 10,
      canvasBounds.top + centerY - 60
    );
    positionInput(
      roomsInput,
      canvasBounds.left + centerX + 10,
      canvasBounds.top + centerY - 20
    );
    positionInput(
      gateInput,
      canvasBounds.left + centerX + 10,
      canvasBounds.top + centerY + 20
    );

    const applyBtn = this.add
      .text(centerX - 50, centerY + 90, "Generate", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#00aa00",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive();
    applyBtn.setScrollFactor(0);
    applyBtn.setDepth(1001);

    const cancelBtn = this.add
      .text(centerX + 50, centerY + 90, "Cancel", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#aa0000",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive();
    cancelBtn.setScrollFactor(0);
    cancelBtn.setDepth(1001);

    const cleanup = () => {
      [
        modalBg,
        title,
        labelSeed,
        labelRooms,
        labelGates,
        applyBtn,
        cancelBtn,
      ].forEach((o) => o.destroy());
      document.body.contains(seedInput) && document.body.removeChild(seedInput);
      document.body.contains(roomsInput) &&
        document.body.removeChild(roomsInput);
      document.body.contains(gateInput) && document.body.removeChild(gateInput);
    };

    applyBtn.on("pointerdown", () => {
      const seed = seedInput.value || "metroidvania";
      const rooms = Math.max(4, parseInt(roomsInput.value || "16", 10));
      const gateFrequency = Math.min(
        1,
        Math.max(0, parseFloat(gateInput.value || "0.25"))
      );
      cleanup();
      this.generateAndLoadWorld({ seed, rooms, gateFrequency });
    });

    cancelBtn.on("pointerdown", () => {
      cleanup();
    });
  }

  private generateAndLoadWorld(params: {
    seed: string | number;
    rooms: number;
    gateFrequency: number;
  }): void {
    // Lazy import to avoid bundling cost in non-editor contexts
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { generateWorldGraph } = require("../generators/WorldGenerator");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {
        convertToWorldData,
      } = require("../generators/WorldGraphToWorldData");

      const graph = generateWorldGraph({
        rooms: params.rooms,
        seed: params.seed,
        loopsRatio: 0.3,
        branchFactor: 1.2,
        gating: { mode: "keys", gateFrequency: params.gateFrequency },
      });

      const worldData = convertToWorldData(graph, {
        tileSize: 32,
        roomWidthTiles: 128,
        roomHeightTiles: 25,
        author: "Map Editor",
      });

      // Load into WorldSystem directly
      (this.worldSystem as any).worldData = worldData;
      (this.worldSystem as any).currentMapId = worldData.startingMap;
      this.worldSystem.visitedMaps.clear();
      this.worldSystem.visitedMaps.add(worldData.startingMap);

      // Update renderer and current map
      this.worldViewRenderer.setWorldData(worldData);
      const currentMap = this.worldSystem.getCurrentMap();
      if (currentMap) {
        this.mapData = currentMap;
        this.loadTileDataFromMap();
        this.updatePreviewObjects();
        this.updateMapList();
        this.setupCameraIgnoreLists();
        if (this.worldSeedText && (this.worldSystem as any).worldData?.seed) {
          const seedStr = String((this.worldSystem as any).worldData.seed);
          this.worldSeedText.setText(`Seed: ${seedStr}`);
        }
      }
    } catch (e) {
      console.error("World generation failed:", e);
      alert("World generation failed. See console for details.");
    }
  }

  private createToolSelection(
    x: number,
    y: number,
    panelWidth: number
  ): number {
    const tools = [
      { name: "Left", key: "exit_left", color: "#00ffff" },
      { name: "Right", key: "exit_right", color: "#ff00ff" },
      { name: "Top", key: "exit_top", color: "#ffff00" },
      { name: "Bottom", key: "exit_bottom", color: "#ff8800" },
      { name: "Portal", key: "portal", color: "#ff00ff" },
      { name: "Enemy1", key: "enemy1", color: "#ff0000" },
      { name: "Enemy2", key: "enemy2", color: "#ff8800" },
      { name: "Solid", key: "solid", color: "#8B4513" },
      { name: "Erase", key: "erase", color: "#000000" },
      { name: "Remove", key: "remove", color: "#ff0000" },
      { name: "Resize", key: "resize", color: "#0066aa" },
    ];

    this.selectedTool = null; // Start with no tool selected
    this.selectedSpriteIndex = null; // Track selected sprite for solid tiles
    this.toolButtons = [];

    // Grid layout: 3 rows x 4 columns (10 tools)
    const cols = 4;
    const rows = 3;
    const buttonWidth = 60;
    const buttonHeight = 25;
    const spacingX = 0;
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
        } else if (tool.key === "resize") {
          this.openResizeModal();
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

  private createRegenerateButtons(
    x: number,
    y: number,
    panelWidth: number
  ): number {
    const makeButton = (
      label: string,
      onClick: () => void,
      bx: number,
      by: number
    ) => {
      const t = this.add.text(bx, by, label, {
        fontSize: "11px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#1e88e5",
        padding: { x: 8, y: 4 },
      });
      t.setInteractive();
      t.on("pointerdown", onClick);
      return t;
    };

    // Lazy import inside handlers to avoid editor load overhead
    const handler = (
      algorithm:
        | "cave"
        | "outside"
        | "corridor"
        | "bsp"
        | "drunkard"
        | "terrace"
    ) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod: any = require("../generators/RoomTileFiller");
        const fillRoom: any =
          (mod && (mod.fillRoom || (mod.default && mod.default.fillRoom))) ||
          mod.default ||
          mod.fillRoom;
        if (typeof fillRoom !== "function") {
          console.error("RoomTileFiller.fillRoom not found in module:", mod);
          return;
        }

        if (!this.mapData) return;
        const tileSize = this.mapData.world.tileSize || 32;
        const w = Math.floor(this.mapData.world.width / tileSize);
        const h = Math.floor(this.mapData.world.height / tileSize);

        // Clear tiles to empty
        this.mapData.tiles = Array.from({ length: h }, () =>
          Array.from({ length: w }, () => 0)
        );

        const worldSeed = (this.worldSystem as any).worldData?.seed || "seed";
        (this as any).regenCount = ((this as any).regenCount || 0) + 1;
        const seed = `${worldSeed}-${this.mapData.id}-${algorithm}-$${
          (this as any).regenCount
        }`;

        // Fill using chosen algorithm
        this.mapData.tiles = fillRoom(this.mapData, { algorithm, seed });

        // Refresh visuals and collisions
        this.loadTileDataFromMap();
        this.tilemapSystem.createCollisionBodies();
        if ((this as any).updatePreviewObjects) {
          (this as any).updatePreviewObjects();
        }
      } catch (e) {
        console.error("Regeneration failed: ", e);
      }
    };

    // Section title + seed label (if available)
    this.add.text(x, y, "Regenerate Tiles", {
      fontSize: "12px",
      fill: "#ffffaa",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    y += 20;

    const seed = String((this.worldSystem as any).worldData?.seed || "-");
    this.worldSeedText = this.add.text(x, y, `Seed: ${seed}`, {
      fontSize: "10px",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 1,
    });
    y += 16;

    // 3x2 grid (3 rows x 2 columns)
    const buttons: Array<{ label: string; algo: any }> = [
      { label: "Cave/Basement", algo: "cave" },
      { label: "Outside", algo: "outside" },
      { label: "Corridor", algo: "corridor" },
      { label: "BSP", algo: "bsp" },
      { label: "Drunkard Walk", algo: "drunkard" },
      { label: "Terraced", algo: "terrace" },
    ];
    const cols = 2;
    const rows = 3;
    const buttonWidth = Math.max(100, Math.floor(panelWidth / cols) - 6);
    const buttonHeight = 25;
    const spacingX = 6;
    const spacingY = 6;

    buttons.forEach((b, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const bx = x + col * (buttonWidth + spacingX);
      const by = y + row * (buttonHeight + spacingY);
      makeButton(b.label, () => handler(b.algo), bx, by);
    });

    return y + rows * (buttonHeight + spacingY);
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

    // Compute grid and modal sizing based on layer
    const spriteSize = 32;
    const spacing = 40;
    const cols =
      this.selectedLayer === "background" || this.selectedLayer === "decoration"
        ? 19
        : 8;
    const modalWidth = (cols - 1) * spacing + spriteSize + 80; // padding
    const modalHeight = 520;

    // Create sprite picker background
    this.spritePicker = this.add.rectangle(
      centerX,
      centerY,
      modalWidth,
      modalHeight,
      0x000000,
      0.8
    );
    this.spritePicker.setScrollFactor(0);
    this.spritePicker.setDepth(1000);

    // Create title
    const pickerTitle = this.add.text(centerX, centerY - 200, "Select Sprite", {
      fontSize: "18px",
      fill: "#ffffff",
      fontStyle: "bold",
    });
    pickerTitle.setScrollFactor(0);
    pickerTitle.setDepth(1001);
    pickerTitle.setOrigin(0.5);

    // Create sprite grid (select source by selectedLayer)
    this.spriteButtons = [];
    const startX = centerX - Math.floor(cols / 2) * spacing;
    const startY = centerY - 150;

    let total = 64;
    let textureKey = "tileset_sprites";
    if (
      this.selectedLayer === "background" &&
      this.textures.exists("background_sprites")
    ) {
      textureKey = "background_sprites";
      total = (this.textures.get(textureKey) as any).getFrameNames().length;
    } else if (
      this.selectedLayer === "decoration" &&
      this.textures.exists("decoration_sprites")
    ) {
      textureKey = "decoration_sprites";
      total = (this.textures.get(textureKey) as any).getFrameNames().length;
    }

    const toIgnore: Phaser.GameObjects.GameObject[] = [
      this.spritePicker,
      pickerTitle,
    ];
    for (let i = 0; i < total; i++) {
      const x = startX + (i % cols) * spacing;
      const y = startY + Math.floor(i / cols) * spacing;

      // Create sprite preview
      const spriteButton = this.add.image(x, y, textureKey, i);
      spriteButton.setScrollFactor(0);
      spriteButton.setDepth(1001);
      spriteButton.setDisplaySize(spriteSize, spriteSize);
      spriteButton.setInteractive();
      toIgnore.push(spriteButton);

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
      toIgnore.push(border as unknown as Phaser.GameObjects.GameObject);

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
    toIgnore.push(closeButton);

    // Ensure the UI camera (right panel) ignores the picker elements
    if (this.uiCamera) {
      (this.uiCamera as any).ignore(toIgnore);
    }

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

    // No spawn point validation needed for edge-based system

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

    // Spawn points no longer exist in edge-based system
    const startY = centerY - 160;
    const itemHeight = 40;
    const maxVisibleItems = 8;

    // Spawn points no longer exist in edge-based system
    // Spawn points no longer exist in edge-based system
    // The entire forEach loop has been removed

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

  private openResizeModal(afterResize?: () => void): void {
    // Prevent multiple modals
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    const modalBg = this.add.rectangle(
      centerX,
      centerY,
      360,
      200,
      0x000000,
      0.9
    );
    modalBg.setScrollFactor(0);
    modalBg.setDepth(1000);

    const title = this.add
      .text(centerX, centerY - 70, "Resize Map (tiles)", {
        fontSize: "16px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(1001);

    const labelW = this.add
      .text(centerX - 120, centerY - 25, "Width:", {
        fontSize: "12px",
        fill: "#ffffff",
      })
      .setOrigin(0, 0.5);
    labelW.setScrollFactor(0);
    labelW.setDepth(1001);

    const labelH = this.add
      .text(centerX - 120, centerY + 15, "Height:", {
        fontSize: "12px",
        fill: "#ffffff",
      })
      .setOrigin(0, 0.5);
    labelH.setScrollFactor(0);
    labelH.setDepth(1001);

    // Simple HTML inputs overlay for ease
    const inputWidth = document.createElement("input");
    inputWidth.type = "number";
    inputWidth.min = "1";
    inputWidth.value = String(this.tilemapSystem.mapWidth);
    const inputHeight = document.createElement("input");
    inputHeight.type = "number";
    inputHeight.min = "1";
    inputHeight.value = String(this.tilemapSystem.mapHeight);

    const positionInput = (el: HTMLInputElement, x: number, y: number) => {
      el.style.position = "fixed";
      el.style.left = `${x - 40}px`;
      el.style.top = `${y - 10}px`;
      el.style.width = "80px";
      el.style.zIndex = "10000";
      document.body.appendChild(el);
    };

    // Convert scene coords to page coords approximately
    const canvasBounds = (
      this.sys.game.canvas as unknown as HTMLCanvasElement
    ).getBoundingClientRect();
    positionInput(
      inputWidth,
      canvasBounds.left + centerX + 10,
      canvasBounds.top + centerY - 25
    );
    positionInput(
      inputHeight,
      canvasBounds.left + centerX + 10,
      canvasBounds.top + centerY + 15
    );

    const applyBtn = this.add
      .text(centerX - 40, centerY + 60, "Apply", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#00aa00",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive();
    applyBtn.setScrollFactor(0);
    applyBtn.setDepth(1001);

    const cancelBtn = this.add
      .text(centerX + 40, centerY + 60, "Cancel", {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#aa0000",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive();
    cancelBtn.setScrollFactor(0);
    cancelBtn.setDepth(1001);

    const cleanup = () => {
      [modalBg, title, labelW, labelH, applyBtn, cancelBtn].forEach((o) =>
        o.destroy()
      );
      document.body.contains(inputWidth) &&
        document.body.removeChild(inputWidth);
      document.body.contains(inputHeight) &&
        document.body.removeChild(inputHeight);
    };

    applyBtn.on("pointerdown", () => {
      const newW = Math.max(1, parseInt(inputWidth.value || "1", 10));
      const newH = Math.max(1, parseInt(inputHeight.value || "1", 10));
      if (
        newW !== this.tilemapSystem.mapWidth ||
        newH !== this.tilemapSystem.mapHeight
      ) {
        this.tilemapSystem.resizeMap(newW, newH);
        this.updateMapAfterResize();
      }
      cleanup();
      afterResize && afterResize();
    });

    cancelBtn.on("pointerdown", () => {
      cleanup();
    });
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
    // Grid layout: 3 rows x 2 columns (5 buttons)
    const cols = 2;
    const rows = 3;
    const buttonWidth = 85;
    const buttonHeight = 25;
    const spacingX = 5;
    const spacingY = 5;

    const buttons = [
      { name: "Save Map", color: "#00aa00", action: () => this.saveMap() },
      { name: "Load Map", color: "#0066aa", action: () => this.loadMap() },
      {
        name: "Configure Exits",
        color: "#ff8800",
        action: () => this.configureExits(),
      },
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
    currentY += 12;

    // No on-panel resize button; use the Resize tool instead
    return currentY + 10;
  }

  private setupCamera(): void {
    // Center the camera on the current map within the editor viewport
    const worldW = this.tilemapSystem
      ? this.tilemapSystem.getWorldWidth()
      : 4100;
    const worldH = this.tilemapSystem
      ? this.tilemapSystem.getWorldHeight()
      : 800;

    // Set camera viewport to only use the left 80% of the screen
    (this.cameras.main as any).setViewport(
      0,
      0,
      this.viewportWidth,
      this.viewportHeight
    );

    // Keep existing zoom behavior
    const zoomX = this.viewportWidth / 1200;
    const zoomY = this.viewportHeight / 800;
    const zoom = Math.min(zoomX, zoomY) * 0.8;
    this.cameras.main.setZoom(zoom);

    // Pad bounds to allow centering small maps within the viewport
    const viewWorldW = this.viewportWidth / zoom;
    const viewWorldH = this.viewportHeight / zoom;
    const offsetX = Math.max(0, (viewWorldW - worldW) / 2);
    const offsetY = Math.max(0, (viewWorldH - worldH) / 2);
    this.cameras.main.setBounds(
      -offsetX,
      -offsetY,
      worldW + offsetX * 2,
      worldH + offsetY * 2
    );

    // Center camera on the map
    this.cameras.main.centerOn(worldW / 2, worldH / 2);
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

    // Toggle key (Tab) and prevent browser focus change
    this.toggleKey = this.input.keyboard.addKey(
      (Phaser.Input.Keyboard as any).KeyCodes.TAB
    );
    this.input.keyboard.on("keydown-TAB", (event: KeyboardEvent) => {
      event.preventDefault();
    });

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
      case "exit_left":
        this.placeExitTile(x, y, TilemapSystem.TILE_TYPES.EXIT_LEFT);
        break;
      case "exit_right":
        this.placeExitTile(x, y, TilemapSystem.TILE_TYPES.EXIT_RIGHT);
        break;
      case "exit_top":
        this.placeExitTile(x, y, TilemapSystem.TILE_TYPES.EXIT_TOP);
        break;
      case "exit_bottom":
        this.placeExitTile(x, y, TilemapSystem.TILE_TYPES.EXIT_BOTTOM);
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
        // Route based on selected layer
        if (this.selectedLayer === "game") {
          this.placeTile(
            x,
            y,
            TilemapSystem.TILE_TYPES.SOLID,
            this.selectedSpriteIndex
          );
        } else if (this.selectedLayer === "background") {
          const t = this.tilemapSystem.worldToTile(x, y);
          this.tilemapSystem.setBackground(
            t.x,
            t.y,
            this.selectedSpriteIndex ?? 0
          );
        } else if (this.selectedLayer === "decoration") {
          const t = this.tilemapSystem.worldToTile(x, y);
          this.tilemapSystem.setDecoration(
            t.x,
            t.y,
            this.selectedSpriteIndex ?? 0
          );
        }
        break;
      case "erase":
        this.eraseTile(x, y);
        break;
      case "remove":
        this.removeObjectAt(x, y);
        break;
      case "resize":
        this.openResizeModal();
        break;
    }

    this.updateObjectInfo();
  }

  private placeExitTile(x: number, y: number, tileType: number): void {
    // Convert world coordinates to tile coordinates
    const tilePos = this.tilemapSystem.worldToTile(x, y);

    // Check if coordinates are within bounds
    if (
      tilePos.x >= 0 &&
      tilePos.x < this.tilemapSystem.mapWidth &&
      tilePos.y >= 0 &&
      tilePos.y < this.tilemapSystem.mapHeight
    ) {
      this.tilemapSystem.setTile(tilePos.x, tilePos.y, tileType);
      console.log(
        `Placed exit tile type ${tileType} at (${tilePos.x}, ${tilePos.y})`
      );
    }
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

    // Spawn points no longer exist in edge-based system

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
        // Spawn points no longer exist in edge-based system
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

  // Spawn points no longer exist in edge-based system

  private addExitZone(x: number, y: number): void {
    // Auto-generate sequential exit ID
    const nextIndex = this.mapData.exits.length + 1;
    const exitId = `exit_${nextIndex}`;

    // Step 1: Select target map
    this.openMapSelector((targetMapId) => {
      if (!targetMapId) {
        return; // User cancelled
      }

      // Create new exit with selected values (no spawn point needed)
      this.mapData.exits.push({
        id: exitId,
        x: Math.round(x),
        y: Math.round(y),
        width: 100,
        height: 100,
        edge: "right", // Default edge, will be updated by tile detection
        edgePosition: 0.5,
        edgeStart: 0.4,
        edgeEnd: 0.6,
        tileStart: 0,
        tileEnd: 1,
        targetMapId: targetMapId,
      });

      console.log(`✅ Created exit "${exitId}" → map "${targetMapId}"`);
      this.updatePreviewObjects();
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
      if (this.selectedLayer === "game") {
        this.tilemapSystem.setTile(
          tilePos.x,
          tilePos.y,
          TilemapSystem.TILE_TYPES.EMPTY
        );
      } else if (this.selectedLayer === "background") {
        this.tilemapSystem.setBackground(tilePos.x, tilePos.y, null);
      } else if (this.selectedLayer === "decoration") {
        this.tilemapSystem.setDecoration(tilePos.x, tilePos.y, null);
      }
    }
  }

  private updatePreviewObjects(): void {
    // Clear existing preview objects
    this.previewObjects.forEach((obj) => obj.destroy());
    this.previewObjects = [];

    // Clear existing exit zones
    this.exitZones.forEach((exit) => exit.destroy());
    this.exitZones = [];

    // Spawn points no longer exist in edge-based system

    console.log(
      `🎨 Updating preview objects. Exit zones to create: ${this.mapData.exits.length}`
    );

    // Create exit zone previews
    this.mapData.exits.forEach((exitData) => {
      console.log(
        `  Creating ExitZone visual for ${exitData.edge} at (${exitData.x}, ${exitData.y}) size ${exitData.width}x${exitData.height}`
      );
      const exitZone = new ExitZone(this, exitData);
      console.log(
        `  ExitZone created at position: (${exitZone.x}, ${exitZone.y})`
      );
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
    try {
      const worldData = (this.worldSystem as any).worldData;
      if (!worldData) throw new Error("No world data to save");
      const seed = String(worldData.seed || "world");
      const res = await fetch("/api/worlds/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, world: worldData }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const data = await res.json();
      console.log(`World saved as ${data.file}`);
      // Update seed label if needed
      if (this.worldSeedText) this.worldSeedText.setText(`Seed: ${seed}`);
      alert(`Saved: ${data.file}`);
    } catch (e: any) {
      console.error("Save error:", e);
      alert(`Save failed: ${e?.message || e}`);
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
    this.mapData.background = [] as any;
    this.mapData.decoration = [] as any;

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
        // Persist background and decoration frames
        (this.mapData.background as any)[y] =
          (this.mapData.background as any)[y] || [];
        (this.mapData.decoration as any)[y] =
          (this.mapData.decoration as any)[y] || [];
        (this.mapData.background as any)[y][x] =
          this.tilemapSystem.getBackground(x, y);
        (this.mapData.decoration as any)[y][x] =
          this.tilemapSystem.getDecoration(x, y);
      }
    }
  }

  private loadMap(): void {
    this.openWorldPicker();
  }

  private async openWorldPicker(): Promise<void> {
    try {
      const res = await fetch("/api/worlds/list");
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data = await res.json();
      const files: string[] = (data?.files || []).filter((f: string) =>
        f.endsWith(".json")
      );

      // Modal UI
      const centerX = this.viewportWidth / 2;
      const centerY = this.viewportHeight / 2;
      const modalBg = this.add.rectangle(
        centerX,
        centerY,
        420,
        520,
        0x000000,
        0.85
      );
      modalBg.setScrollFactor(0);
      modalBg.setDepth(1000);

      const title = this.add
        .text(centerX, centerY - 230, "Load World", {
          fontSize: "16px",
          fill: "#ffffff",
          fontStyle: "bold",
        })
        .setScrollFactor(0)
        .setDepth(1001)
        .setOrigin(0.5);

      const buttons: Phaser.GameObjects.Text[] = [];
      const listStartY = centerY - 190;
      const lineHeight = 24;
      files.slice(0, 16).forEach((file, idx) => {
        const by = listStartY + idx * lineHeight;
        const btn = this.add
          .text(centerX, by, file, {
            fontSize: "12px",
            fill: "#ffffff",
            backgroundColor: "#444444",
            padding: { x: 6, y: 3 },
          })
          .setScrollFactor(0)
          .setDepth(1001)
          .setOrigin(0.5)
          .setInteractive();
        btn.on("pointerdown", async () => {
          await this.loadWorldFromFile(file);
          cleanup();
        });
        btn.on("pointerover", () => btn.setBackgroundColor("#666666"));
        btn.on("pointerout", () => btn.setBackgroundColor("#444444"));
        buttons.push(btn);
      });

      const cancelBtn = this.add
        .text(centerX, centerY + 230, "Cancel", {
          fontSize: "12px",
          fill: "#ffffff",
          backgroundColor: "#aa0000",
          padding: { x: 10, y: 6 },
        })
        .setScrollFactor(0)
        .setDepth(1001)
        .setOrigin(0.5)
        .setInteractive();
      cancelBtn.on("pointerdown", () => cleanup());

      const cleanup = () => {
        modalBg.destroy();
        title.destroy();
        cancelBtn.destroy();
        buttons.forEach((b) => b.destroy());
      };
    } catch (e: any) {
      console.error("Failed to list worlds:", e);
      alert(`Failed to list worlds: ${e?.message || e}`);
    }
  }

  private async loadWorldFromFile(fileName: string): Promise<void> {
    try {
      const url = `${ASSET_PATHS.maps}/${fileName}?v=${Date.now()}`;
      const worldData = await this.worldSystem.loadWorldFromURL(url);
      this.worldViewRenderer.setWorldData(worldData);
      const currentMap = this.worldSystem.getCurrentMap();
      if (currentMap) {
        this.mapData = currentMap;
        this.loadTileDataFromMap();
        this.updatePreviewObjects();
        this.updateMapList();
        this.setupCameraIgnoreLists();
        if (this.worldSeedText && (this.worldSystem as any).worldData?.seed) {
          const seedStr = String((this.worldSystem as any).worldData.seed);
          this.worldSeedText.setText(`Seed: ${seedStr}`);
        }
      }
    } catch (e: any) {
      console.error("Error loading world:", e);
      alert(`Error loading world: ${e?.message || e}`);
    }
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
            // Apply background/decoration
            const bg = (this.mapData.background as any)?.[y]?.[x] ?? null;
            const dec = (this.mapData.decoration as any)?.[y]?.[x] ?? null;
            this.tilemapSystem.setBackground(x, y, bg);
            this.tilemapSystem.setDecoration(x, y, dec);
          }
        }
      }

      console.log(
        `✅ Tile data loaded successfully. Map dimensions: ${
          this.mapData.tiles.length
        } rows x ${this.mapData.tiles[0]?.length || 0} columns`
      );

      // Redraw all layers and then create collision bodies
      this.tilemapSystem.redrawAllLayers();
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

    // Update camera bounds and recentre on the map with padding so small maps center
    const zoom = (this.cameras.main as any).zoom || 1;
    const viewWorldW = this.viewportWidth / zoom;
    const viewWorldH = this.viewportHeight / zoom;
    const worldW = this.tilemapSystem.getWorldWidth();
    const worldH = this.tilemapSystem.getWorldHeight();
    const offsetX = Math.max(0, (viewWorldW - worldW) / 2);
    const offsetY = Math.max(0, (viewWorldH - worldH) / 2);
    this.cameras.main.setBounds(
      -offsetX,
      -offsetY,
      worldW + offsetX * 2,
      worldH + offsetY * 2
    );
    this.cameras.main.centerOn(worldW / 2, worldH / 2);

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
    // If world view is visible, use arrows to pan world view instead of moving map camera
    if (this.worldViewRenderer && this.worldViewRenderer.getIsVisible()) {
      const panStep = 20; // pixels per frame; independent from tilemap camera speed
      let dx = 0;
      let dy = 0;
      if (this.cursors.left.isDown) dx += panStep;
      if (this.cursors.right.isDown) dx -= panStep;
      if (this.cursors.up.isDown) dy += panStep;
      if (this.cursors.down.isDown) dy -= panStep;
      if (dx !== 0 || dy !== 0) {
        (this.worldViewRenderer as any).panBy(dx, dy);
      }
    } else {
      // Camera movement (arrows only)
      if (this.cursors.left.isDown) {
        this.cameras.main.scrollX -= this.cameraSpeed;
      }
      if (this.cursors.right.isDown) {
        this.cameras.main.scrollX += this.cameraSpeed;
      }
      if (this.cursors.up.isDown) {
        this.cameras.main.scrollY -= this.cameraSpeed;
      }
      if (this.cursors.down.isDown) {
        this.cameras.main.scrollY += this.cameraSpeed;
      }
    }

    // Handle world view toggle (Tab)
    if (Phaser.Input.Keyboard.JustDown(this.toggleKey)) {
      this.worldViewRenderer.toggle();
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
      case TilemapSystem.TILE_TYPES.EXIT_LEFT:
        return "Left Exit";
      case TilemapSystem.TILE_TYPES.EXIT_RIGHT:
        return "Right Exit";
      case TilemapSystem.TILE_TYPES.EXIT_TOP:
        return "Top Exit";
      case TilemapSystem.TILE_TYPES.EXIT_BOTTOM:
        return "Bottom Exit";
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

    // Position and render only the "New Map" button
    const panelPadding = 10;
    const yOffset = this.viewportHeight - 60;

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
    this.createMapButton.setScrollFactor(0);

    this.createMapButton.on("pointerdown", () => {
      this.createNewMap();
    });

    this.mapListButtons.push(this.createMapButton);

    // Ensure these UI elements are only rendered by the UI camera
    if (this.uiCamera) {
      this.setupCameraIgnoreLists();
    }
  }

  // Switch to a different map
  private switchToMap(mapId: string): void {
    // Close any open modals/selectors to prevent stray UI (map picker, sprite picker, etc.)
    if (this.mapSelector) {
      this.closeMapSelector();
    }
    if (this.spawnPointSelector) {
      this.closeSpawnPointSelector();
    }
    // Exit config modal (if any)
    try {
      this.closeExitConfigModal();
    } catch (e) {
      // ignore if not open
    }
    // Sprite picker (if open)
    if (this.spritePicker) {
      this.closeSpritePicker();
    }

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

    // If world view is visible, refresh it to reflect the newly selected map
    if (this.worldViewRenderer) {
      this.worldViewRenderer.setVisitedMaps(this.worldSystem.visitedMaps);
      if (this.worldViewRenderer.getIsVisible()) {
        this.worldViewRenderer.update();
      }
    }
  }

  // Create a new map
  private createNewMap(): void {
    // Auto-generate map name based on number of maps
    const mapCount = this.worldSystem.getAllMapIds().length;
    const mapName = `Map ${mapCount + 1}`;

    // Create new map in world
    const newMap = this.worldSystem.createNewMap(mapName);

    // Set initial size to 9x9 tiles
    const tileSize = this.tilemapSystem?.tileSize ?? 32;
    newMap.world.tileSize = tileSize;
    newMap.world.width = 9 * tileSize;
    newMap.world.height = 9 * tileSize;

    console.log(`✅ Created new map: ${newMap.id} (${mapName})`);

    // Switch to the new map
    this.switchToMap(newMap.id);
  }

  // Exit detection from tiles
  detectExitZonesFromTiles(): DetectedExit[] {
    const detected: DetectedExit[] = [];
    const tileSize = this.tilemapSystem.tileSize;
    const mapWidth = this.tilemapSystem.mapWidth;
    const mapHeight = this.tilemapSystem.mapHeight;

    console.log(`🔍 Detecting exits on map ${mapWidth}x${mapHeight}`);

    const edges = [
      { name: "left", tileType: 100, x: 0 },
      { name: "right", tileType: 101, x: mapWidth - 1 },
      { name: "top", tileType: 102, y: 0 },
      { name: "bottom", tileType: 103, y: mapHeight - 1 },
    ];

    edges.forEach((edge) => {
      let inExit = false;
      let exitStart = -1;
      let exitTilesFound = 0;
      const isHorizontal = edge.name === "top" || edge.name === "bottom";
      const length = isHorizontal ? mapWidth : mapHeight;

      for (let i = 0; i < length; i++) {
        const [x, y] = isHorizontal ? [i, edge.y!] : [edge.x!, i];
        const tile = this.tilemapSystem.getTile(x, y);

        if (tile === edge.tileType) {
          exitTilesFound++;
          if (!inExit) {
            inExit = true;
            exitStart = i;
            console.log(`  Found ${edge.name} exit starting at tile ${i}`);
          }
        } else if (inExit) {
          const exit = this.createDetectedExit(
            edge.name,
            exitStart,
            i - 1,
            tileSize
          );
          detected.push(exit);
          console.log(
            `  Created ${edge.name} exit from tile ${exitStart} to ${i - 1}`
          );
          inExit = false;
        }
      }

      if (inExit) {
        const exit = this.createDetectedExit(
          edge.name,
          exitStart,
          length - 1,
          tileSize
        );
        detected.push(exit);
        console.log(
          `  Created ${edge.name} exit from tile ${exitStart} to ${length - 1}`
        );
      }

      if (exitTilesFound > 0) {
        console.log(`  Total ${edge.name} exit tiles found: ${exitTilesFound}`);
      }
    });

    console.log(`✅ Total exits detected: ${detected.length}`);
    return detected;
  }

  private createDetectedExit(
    edgeName: string,
    tileStart: number,
    tileEnd: number,
    tileSize: number
  ): DetectedExit {
    const mapWidthTiles = this.tilemapSystem.mapWidth;
    const mapHeightTiles = this.tilemapSystem.mapHeight;
    const mapWidth = mapWidthTiles * tileSize;
    const mapHeight = mapHeightTiles * tileSize;
    const isHorizontal = edgeName === "top" || edgeName === "bottom";

    let x: number, y: number, width: number, height: number;
    let edgeStart: number, edgeEnd: number, edgePosition: number;

    if (isHorizontal) {
      // Top or bottom edge
      x = tileStart * tileSize;
      y = edgeName === "top" ? 0 : (mapHeightTiles - 1) * tileSize;
      width = (tileEnd - tileStart + 1) * tileSize;
      height = tileSize;
      edgeStart = tileStart / mapWidthTiles;
      edgeEnd = (tileEnd + 1) / mapWidthTiles;
      edgePosition = (edgeStart + edgeEnd) / 2;
    } else {
      // Left or right edge
      x = edgeName === "left" ? 0 : (mapWidthTiles - 1) * tileSize;
      y = tileStart * tileSize;
      width = tileSize;
      height = (tileEnd - tileStart + 1) * tileSize;
      edgeStart = tileStart / mapHeightTiles;
      edgeEnd = (tileEnd + 1) / mapHeightTiles;
      edgePosition = (edgeStart + edgeEnd) / 2;
    }

    console.log(`  📍 Exit position: (${x}, ${y}) size: ${width}x${height}`);

    return {
      edge: edgeName,
      x,
      y,
      width,
      height,
      tileStart,
      tileEnd,
      edgeStart,
      edgeEnd,
      edgePosition,
    };
  }

  // Configure exits from detected tiles
  private configureExits(): void {
    const detectedExits = this.detectExitZonesFromTiles();

    if (detectedExits.length === 0) {
      alert("No exit tiles detected. Paint exit tiles on map edges first.");
      return;
    }

    // Create configuration modal
    this.createExitConfigModal(detectedExits);
  }

  private createExitConfigModal(detectedExits: DetectedExit[]): void {
    // Center the modal in the left viewport
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    // Create modal background
    const modalBg = this.add.rectangle(
      centerX,
      centerY,
      500,
      600,
      0x000000,
      0.9
    );
    modalBg.setScrollFactor(0);
    modalBg.setDepth(1000);

    // Create title
    const title = this.add.text(centerX, centerY - 250, "Configure Exits", {
      fontSize: "20px",
      fill: "#ffffff",
      fontStyle: "bold",
    });
    title.setScrollFactor(0);
    title.setDepth(1001);
    title.setOrigin(0.5);

    // Create exit configuration items
    const startY = centerY - 200;
    const itemHeight = 60;
    const mapIds = this.worldSystem.getAllMapIds();

    detectedExits.forEach((exit, index) => {
      const yPos = startY + index * itemHeight;

      // Exit info
      const exitInfo = this.add.text(
        centerX - 200,
        yPos,
        `${exit.edge.toUpperCase()} Exit (Tiles ${exit.tileStart}-${
          exit.tileEnd
        })`,
        {
          fontSize: "14px",
          fill: "#ffffff",
          fontStyle: "bold",
        }
      );
      exitInfo.setScrollFactor(0);
      exitInfo.setDepth(1001);
      exitInfo.setOrigin(0.5);

      // Target map selector
      const mapSelector = this.add.text(centerX, yPos, "Select Target Map", {
        fontSize: "12px",
        fill: "#ffffff",
        backgroundColor: "#444444",
        padding: { x: 10, y: 5 },
      });
      mapSelector.setScrollFactor(0);
      mapSelector.setDepth(1001);
      mapSelector.setOrigin(0.5);
      mapSelector.setInteractive();

      // Store exit data for later use
      (mapSelector as any).exitData = exit;
      (mapSelector as any).targetMapId = null;

      mapSelector.on("pointerdown", () => {
        this.openMapSelectorForExit(mapSelector, exit);
      });
    });

    // Apply button
    const applyButton = this.add.text(centerX - 50, centerY + 250, "Apply", {
      fontSize: "16px",
      fill: "#ffffff",
      fontStyle: "bold",
      backgroundColor: "#00aa00",
      padding: { x: 15, y: 8 },
    });
    applyButton.setScrollFactor(0);
    applyButton.setDepth(1001);
    applyButton.setOrigin(0.5);
    applyButton.setInteractive();

    applyButton.on("pointerdown", () => {
      this.applyExitConfigurations(detectedExits);
      this.closeExitConfigModal();
    });

    // Cancel button
    const cancelButton = this.add.text(centerX + 50, centerY + 250, "Cancel", {
      fontSize: "16px",
      fill: "#ffffff",
      fontStyle: "bold",
      backgroundColor: "#aa0000",
      padding: { x: 15, y: 8 },
    });
    cancelButton.setScrollFactor(0);
    cancelButton.setDepth(1001);
    cancelButton.setOrigin(0.5);
    cancelButton.setInteractive();

    cancelButton.on("pointerdown", () => {
      this.closeExitConfigModal();
    });
  }

  private openMapSelectorForExit(
    mapSelector: Phaser.GameObjects.Text,
    exit: DetectedExit
  ): void {
    const mapIds = this.worldSystem.getAllMapIds();

    // Simple map selection for now - just cycle through maps
    const currentIndex = mapIds.indexOf((mapSelector as any).targetMapId || "");
    const nextIndex = (currentIndex + 1) % mapIds.length;
    const selectedMapId = mapIds[nextIndex];

    (mapSelector as any).targetMapId = selectedMapId;
    mapSelector.setText(`Target: ${selectedMapId}`);
  }

  private applyExitConfigurations(detectedExits: DetectedExit[]): void {
    // Convert detected exits to ExitZone objects
    const exitZones: ExitZoneData[] = [];

    console.log(`🔧 Applying ${detectedExits.length} exit configurations`);

    detectedExits.forEach((detected, index) => {
      // Find the target map for this exit (stored in the UI)
      const targetMapId = `map_${index + 2}`; // Simple assignment for now

      const exitZone: ExitZoneData = {
        id: `exit_${index + 1}`,
        x: detected.x,
        y: detected.y,
        width: detected.width,
        height: detected.height,
        edge: detected.edge as "left" | "right" | "top" | "bottom",
        edgePosition: detected.edgePosition,
        edgeStart: detected.edgeStart,
        edgeEnd: detected.edgeEnd,
        tileStart: detected.tileStart,
        tileEnd: detected.tileEnd,
        targetMapId: targetMapId,
      };

      console.log(
        `  Creating ExitZoneData: ${detected.edge} at (${exitZone.x}, ${exitZone.y}) size ${exitZone.width}x${exitZone.height}`
      );
      exitZones.push(exitZone);
    });

    // Update map data
    this.mapData.exits = exitZones;
    this.updatePreviewObjects();

    console.log(`✅ Configured ${exitZones.length} exits`);
  }

  private closeExitConfigModal(): void {
    // Find and destroy all modal elements
    const modalElements = (this.children as any).list.filter(
      (child: any) => child.depth === 1000 || child.depth === 1001
    );

    modalElements.forEach((element: any) => {
      if (element.destroy) {
        element.destroy();
      }
    });
  }
}
