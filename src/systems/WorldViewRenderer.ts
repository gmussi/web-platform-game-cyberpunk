import { WorldData, WorldMapData } from "../types/map";
import { WorldLayoutSystem, LayoutResult } from "./WorldLayoutSystem";

export class WorldViewRenderer {
  private scene: Phaser.Scene;
  private worldData: WorldData | null;
  private layoutSystem: WorldLayoutSystem | null = null;
  private layoutResult: LayoutResult | null = null;
  private worldViewGroup: Phaser.GameObjects.Group | null = null;
  private isVisible: boolean = false;
  private visitedMaps: Set<string>; // Track which maps to display
  private getCurrentMapId: () => string | null; // Function to get current map ID
  private showAllMaps: boolean; // Whether to show all maps regardless of visited status
  private onMapClick?: (mapId: string) => void; // Optional click handler
  private zoomScale: number = 1; // Zoom factor for rendering
  private readonly MIN_ZOOM = 0.25;
  private readonly MAX_ZOOM = 3;
  private wheelHandler?: (
    pointer: any,
    gameObjects: any,
    deltaX: number,
    deltaY: number,
    deltaZ: number
  ) => void;
  private panX: number = 0; // pan offset in pixels (render space)
  private panY: number = 0;

  // Rendering settings
  private readonly BOX_SIZE = 80;
  private readonly BOX_SPACING = 20;
  private readonly CURRENT_MAP_COLOR = 0x00ff00; // Green for current map
  private readonly OTHER_MAP_COLOR = 0x0066ff; // Blue for other maps
  private readonly CONNECTION_COLOR = 0xffffff; // White for connections
  private readonly EXIT_INDICATOR_COLOR = 0xff0000; // Red for exit indicators
  private readonly EXIT_INDICATOR_THICKNESS = 4; // Line thickness in pixels

  constructor(
    scene: Phaser.Scene,
    worldData: WorldData | null,
    visitedMaps?: Set<string>,
    getCurrentMapId?: () => string | null,
    showAllMaps: boolean = false,
    onMapClick?: (mapId: string) => void
  ) {
    this.scene = scene;
    this.worldData = worldData;
    this.visitedMaps = visitedMaps || new Set<string>();
    this.getCurrentMapId =
      getCurrentMapId || (() => worldData?.startingMap || null);
    this.showAllMaps = showAllMaps;
    this.onMapClick = onMapClick;
    // Lazy initialize layoutSystem when worldData is available
  }

  private setZoom(next: number): void {
    const clamped = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, next));
    if (Math.abs(clamped - this.zoomScale) < 0.0001) return;
    this.zoomScale = clamped;
    this.update();
  }

  private computeInitialZoom(): void {
    if (!this.layoutResult) return;
    const cam = this.scene.cameras.main as any;
    const viewW = cam.width;
    const viewH = cam.height;

    const totalUnitsW = this.layoutResult.totalWidth;
    const totalUnitsH = this.layoutResult.totalHeight;
    const baseBox = this.BOX_SIZE;
    const baseSpace = this.BOX_SPACING;

    const neededW = totalUnitsW * (baseBox + baseSpace);
    const neededH = totalUnitsH * (baseBox + baseSpace);

    const scaleW = viewW / Math.max(neededW, 1);
    const scaleH = viewH / Math.max(neededH, 1);
    const fit = Math.min(scaleW, scaleH);
    // Start slightly smaller than fit to add padding; clamp to range
    this.zoomScale = Math.max(
      this.MIN_ZOOM,
      Math.min(this.MAX_ZOOM, fit * 0.9)
    );
  }

  /**
   * Show the world view overlay
   */
  public show(): void {
    if (this.isVisible) return;

    // Check if world data is available
    if (!this.worldData) {
      console.warn("World data not yet loaded. Cannot show world view.");
      return;
    }

    // Lazy initialize layout system if needed
    if (!this.layoutSystem) {
      this.layoutSystem = new WorldLayoutSystem(this.worldData);
    }

    this.calculateLayout();
    this.computeInitialZoom();
    this.createWorldView();
    this.isVisible = true;

    // Enable mouse wheel zoom when visible
    this.wheelHandler = (
      _pointer: any,
      _objects: any,
      _dx: number,
      dy: number
    ) => {
      if (!this.isVisible) return;
      const factor = dy > 0 ? 0.9 : 1.1; // scroll down = zoom out
      this.setZoom(this.zoomScale * factor);
    };
    // Phaser input emits (pointer, gameObjects, deltaX, deltaY, deltaZ)
    (this.scene.input as any).on("wheel", this.wheelHandler);
  }

  /**
   * Hide the world view overlay
   */
  public hide(): void {
    if (!this.isVisible) return;

    if (this.worldViewGroup) {
      (this.worldViewGroup as any).children.each((child: any) =>
        child.destroy()
      );
      (this.worldViewGroup as any).destroy(true);
      this.worldViewGroup = null;
    }
    this.isVisible = false;

    // Disable wheel handler
    if (this.wheelHandler) {
      (this.scene.input as any).off("wheel", this.wheelHandler);
      this.wheelHandler = undefined;
    }
  }

  /**
   * Toggle the world view visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update the world view (call when current map changes)
   */
  public update(): void {
    if (!this.isVisible) return;

    // Re-render without resetting zoom or handlers
    if (this.worldViewGroup) {
      (this.worldViewGroup as any).children.each((child: any) =>
        child.destroy()
      );
      (this.worldViewGroup as any).destroy(true);
      this.worldViewGroup = null;
    }
    this.calculateLayout();
    this.createWorldView();
  }

  /**
   * Calculate the layout for all maps
   */
  private calculateLayout(): void {
    if (!this.layoutSystem) {
      console.error("Layout system not initialized");
      return;
    }
    this.layoutResult = this.layoutSystem.calculateLayout();
  }

  /**
   * Create the visual world view
   */
  private createWorldView(): void {
    if (!this.layoutResult) return;

    // Create group for all world view elements
    this.worldViewGroup = this.scene.add.group();

    // Render only in the main (left) camera viewport
    const mainCam = this.scene.cameras.main as Phaser.Cameras.Scene2D.Camera;

    // Calculate viewport center within the main camera
    const centerX = (mainCam as any).width / 2;
    const centerY = (mainCam as any).height / 2;

    // Calculate total world dimensions with zoom
    const sBox = this.BOX_SIZE * this.zoomScale;
    const sSpace = this.BOX_SPACING * this.zoomScale;
    const totalWidth = this.layoutResult.totalWidth * (sBox + sSpace);
    const totalHeight = this.layoutResult.totalHeight * (sBox + sSpace);

    // Start position (top-left of world view)
    const startX = centerX - totalWidth / 2 + this.panX;
    const startY = centerY - totalHeight / 2 + this.panY;

    // Connections disabled per request

    // Render map boxes
    this.renderMapBoxesScaled(startX, startY, sBox, sSpace);

    // Add title
    this.addTitle(centerX, startY - 40);

    // Ensure the right UI camera ignores these elements so they don't render in the panel
    const uiCam = (this.scene as any).uiCamera as
      | Phaser.Cameras.Scene2D.Camera
      | undefined;
    if (uiCam && this.worldViewGroup) {
      const children = (this.worldViewGroup as any).getChildren
        ? (this.worldViewGroup as any).getChildren()
        : [];
      if (children.length > 0) {
        (uiCam as any).ignore(children);
      }
    }
  }

  /**
   * Pan the world view by the specified pixel offsets.
   */
  public panBy(dx: number, dy: number): void {
    if (!this.isVisible) return;
    this.panX += dx;
    this.panY += dy;
    this.update();
  }

  /**
   * Render connections between maps
   */
  private renderConnections(startX: number, startY: number): void {
    if (!this.layoutResult || !this.worldData) return;

    Object.keys(this.layoutResult.mapPositions).forEach((mapId) => {
      // Only show connections from visited maps (unless showAllMaps is true)
      if (!this.showAllMaps && !this.visitedMaps.has(mapId)) return;

      const mapData = this.worldData!.maps[mapId];
      if (!mapData) return;

      const sourcePos = this.layoutResult!.mapPositions[mapId];
      const sourceX = startX + sourcePos.x * (this.BOX_SIZE + this.BOX_SPACING);
      const sourceY = startY + sourcePos.y * (this.BOX_SIZE + this.BOX_SPACING);

      // Draw connections for each exit
      mapData.exits.forEach((exit) => {
        const targetMapId = exit.targetMapId;
        // Only show connection if target map has also been visited (unless showAllMaps is true)
        if (!this.showAllMaps && !this.visitedMaps.has(targetMapId)) return;

        const targetPos = this.layoutResult!.mapPositions[targetMapId];

        if (!targetPos) return;

        const targetX =
          startX + targetPos.x * (this.BOX_SIZE + this.BOX_SPACING);
        const targetY =
          startY + targetPos.y * (this.BOX_SIZE + this.BOX_SPACING);

        // Calculate connection line based on exit edge
        const connectionLine = this.calculateConnectionLine(
          sourceX,
          sourceY,
          targetX,
          targetY,
          exit.edge
        );

        // Draw connection line
        const line = this.scene.add.graphics();
        line.lineStyle(2, this.CONNECTION_COLOR, 0.8);
        (line as any).lineBetween(
          connectionLine.startX,
          connectionLine.startY,
          connectionLine.endX,
          connectionLine.endY
        );
        line.setScrollFactor(0);
        line.setDepth(1001);

        this.worldViewGroup!.add(line);
      });
    });
  }

  /**
   * Calculate connection line between two maps
   */
  private calculateConnectionLine(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    edge: string
  ): { startX: number; startY: number; endX: number; endY: number } {
    const halfBox = this.BOX_SIZE / 2;

    let startX = sourceX + halfBox;
    let startY = sourceY + halfBox;
    let endX = targetX + halfBox;
    let endY = targetY + halfBox;

    // Adjust start point based on exit edge
    switch (edge) {
      case "right":
        startX = sourceX + this.BOX_SIZE;
        break;
      case "left":
        startX = sourceX;
        break;
      case "bottom":
        startY = sourceY + this.BOX_SIZE;
        break;
      case "top":
        startY = sourceY;
        break;
    }

    // Adjust end point based on opposite edge
    const oppositeEdge = {
      right: "left",
      left: "right",
      top: "bottom",
      bottom: "top",
    }[edge];

    switch (oppositeEdge) {
      case "right":
        endX = targetX + this.BOX_SIZE;
        break;
      case "left":
        endX = targetX;
        break;
      case "bottom":
        endY = targetY + this.BOX_SIZE;
        break;
      case "top":
        endY = targetY;
        break;
    }

    return { startX, startY, endX, endY };
  }

  /**
   * Render map boxes
   */
  private renderMapBoxes(startX: number, startY: number): void {
    const sBox = this.BOX_SIZE * this.zoomScale;
    const sSpace = this.BOX_SPACING * this.zoomScale;
    this.renderMapBoxesScaled(startX, startY, sBox, sSpace);
  }

  private renderMapBoxesScaled(
    startX: number,
    startY: number,
    boxSize: number,
    spacing: number
  ): void {
    if (!this.layoutResult || !this.worldData) return;
    const debugLayout: Array<{
      id: string;
      name: string;
      gridX: number;
      gridY: number;
      widthUnits: number;
      heightUnits: number;
      boxX: number;
      boxY: number;
      boxWidth: number;
      boxHeight: number;
    }> = [];

    Object.keys(this.layoutResult.mapPositions).forEach((mapId) => {
      // Only show visited maps (unless showAllMaps is true)
      if (!this.showAllMaps && !this.visitedMaps.has(mapId)) return;

      const mapData = this.worldData!.maps[mapId];
      if (!mapData) return;

      const pos = this.layoutResult!.mapPositions[mapId];
      const size = this.layoutResult!.mapSizes[mapId];

      const boxX = startX + pos.x * (boxSize + spacing);
      const boxY = startY + pos.y * (boxSize + spacing);

      // Include intra-unit spacing inside the box size so parents visually cover
      // their stacked children (e.g., a width of 2 spans one spacing unit between them)
      const boxWidth =
        boxSize * size.width + spacing * Math.max(0, size.width - 1);
      const boxHeight =
        boxSize * size.height + spacing * Math.max(0, size.height - 1);

      // Collect debug info
      debugLayout.push({
        id: mapId,
        name: mapData.metadata.name,
        gridX: pos.x,
        gridY: pos.y,
        widthUnits: size.width,
        heightUnits: size.height,
        boxX,
        boxY,
        boxWidth,
        boxHeight,
      });

      // Determine if this is the current map
      const currentMapId = this.getCurrentMapId();
      const isCurrentMap = mapId === currentMapId;
      const color = isCurrentMap
        ? this.CURRENT_MAP_COLOR
        : this.OTHER_MAP_COLOR;

      // Create map box
      const box = this.scene.add.rectangle(
        boxX + boxWidth / 2,
        boxY + boxHeight / 2,
        boxWidth,
        boxHeight,
        color,
        0.8
      );
      box.setStrokeStyle(2, 0xffffff, 1);
      box.setScrollFactor(0);
      box.setDepth(1002);
      if (this.onMapClick) {
        box.setInteractive();
        box.on("pointerdown", () => this.onMapClick!(mapId));
      }

      // Add map name
      const mapName = mapData.metadata.name;
      const nameText = this.scene.add.text(
        boxX + boxWidth / 2,
        boxY + boxHeight / 2,
        mapName,
        {
          fontSize: "12px",
          fill: "#ffffff",
          fontStyle: "bold",
        }
      );
      nameText.setOrigin(0.5);
      nameText.setScrollFactor(0);
      nameText.setDepth(1003);
      if (this.onMapClick) {
        nameText.setInteractive();
        nameText.on("pointerdown", () => this.onMapClick!(mapId));
      }

      this.worldViewGroup!.add(box);
      this.worldViewGroup!.add(nameText);

      // Render exit indicators on the box edges
      this.renderExitIndicators(mapData, boxX, boxY, boxWidth, boxHeight);
    });

    // Emit a consolidated JSON snapshot for debugging the layout
    try {
      // Use a distinctive prefix for easy grepping in console
      console.log(
        "🧭 WorldView layout boxes JSON:",
        JSON.stringify(debugLayout)
      );
    } catch (e) {
      // no-op if JSON serialization fails
    }
  }

  /**
   * Render exit indicators on map boxes
   */
  private renderExitIndicators(
    mapData: WorldMapData,
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number
  ): void {
    if (!mapData.exits || mapData.exits.length === 0) return;

    mapData.exits.forEach((exit) => {
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(
        this.EXIT_INDICATOR_THICKNESS,
        this.EXIT_INDICATOR_COLOR,
        1
      );
      graphics.setScrollFactor(0);
      graphics.setDepth(1004);

      let startX: number, startY: number, endX: number, endY: number;

      switch (exit.edge) {
        case "left":
          // Vertical line on left edge
          startX = boxX;
          endX = boxX;
          startY = boxY + exit.edgeStart * boxHeight;
          endY = boxY + exit.edgeEnd * boxHeight;
          break;

        case "right":
          // Vertical line on right edge
          startX = boxX + boxWidth;
          endX = boxX + boxWidth;
          startY = boxY + exit.edgeStart * boxHeight;
          endY = boxY + exit.edgeEnd * boxHeight;
          break;

        case "top":
          // Horizontal line on top edge
          startX = boxX + exit.edgeStart * boxWidth;
          endX = boxX + exit.edgeEnd * boxWidth;
          startY = boxY;
          endY = boxY;
          break;

        case "bottom":
          // Horizontal line on bottom edge
          startX = boxX + exit.edgeStart * boxWidth;
          endX = boxX + exit.edgeEnd * boxWidth;
          startY = boxY + boxHeight;
          endY = boxY + boxHeight;
          break;

        default:
          return;
      }

      (graphics as any).lineBetween(startX, startY, endX, endY);

      this.worldViewGroup!.add(graphics);
    });
  }

  /**
   * Add title to the world view
   */
  private addTitle(centerX: number, y: number): void {
    const title = this.scene.add.text(
      centerX,
      y,
      "World View  (Scroll to zoom)",
      {
        fontSize: "16px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      }
    );
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(1004);

    this.worldViewGroup!.add(title);
  }

  /**
   * Get the current layout result
   */
  public getLayoutResult(): LayoutResult | null {
    return this.layoutResult;
  }

  /**
   * Check if the world view is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Update the world data reference (call after world data is loaded)
   */
  public setWorldData(worldData: WorldData): void {
    this.worldData = worldData;
    // Reset layout system to pick up new data
    this.layoutSystem = null;
    this.layoutResult = null;
  }

  /**
   * Update the visited maps set (call this to sync with WorldSystem)
   */
  public setVisitedMaps(visitedMaps: Set<string>): void {
    this.visitedMaps = visitedMaps;
  }
}
