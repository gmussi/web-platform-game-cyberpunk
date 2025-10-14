import { WorldData, WorldMapData } from "../types/map";
import { WorldLayoutSystem, LayoutResult } from "./WorldLayoutSystem";

export class WorldViewRenderer {
  private scene: Phaser.Scene;
  private worldData: WorldData;
  private layoutSystem: WorldLayoutSystem;
  private layoutResult: LayoutResult | null = null;
  private worldViewGroup: Phaser.GameObjects.Group | null = null;
  private isVisible: boolean = false;

  // Rendering settings
  private readonly BOX_SIZE = 80;
  private readonly BOX_SPACING = 20;
  private readonly CURRENT_MAP_COLOR = 0x00ff00; // Green for current map
  private readonly OTHER_MAP_COLOR = 0x0066ff; // Blue for other maps
  private readonly CONNECTION_COLOR = 0xffffff; // White for connections

  constructor(scene: Phaser.Scene, worldData: WorldData) {
    this.scene = scene;
    this.worldData = worldData;
    this.layoutSystem = new WorldLayoutSystem(worldData);
  }

  /**
   * Show the world view overlay
   */
  public show(): void {
    if (this.isVisible) return;

    this.calculateLayout();
    this.createWorldView();
    this.isVisible = true;
  }

  /**
   * Hide the world view overlay
   */
  public hide(): void {
    if (!this.isVisible) return;

    if (this.worldViewGroup) {
      this.worldViewGroup.destroy();
      this.worldViewGroup = null;
    }
    this.isVisible = false;
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

    this.hide();
    this.show();
  }

  /**
   * Calculate the layout for all maps
   */
  private calculateLayout(): void {
    this.layoutResult = this.layoutSystem.calculateLayout();
  }

  /**
   * Create the visual world view
   */
  private createWorldView(): void {
    if (!this.layoutResult) return;

    // Create group for all world view elements
    this.worldViewGroup = this.scene.add.group();
    this.worldViewGroup.setDepth(1000); // Above everything else

    // Calculate viewport center
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    // Calculate total world dimensions
    const totalWidth =
      this.layoutResult.totalWidth * (this.BOX_SIZE + this.BOX_SPACING);
    const totalHeight =
      this.layoutResult.totalHeight * (this.BOX_SIZE + this.BOX_SPACING);

    // Start position (top-left of world view)
    const startX = centerX - totalWidth / 2;
    const startY = centerY - totalHeight / 2;

    // Render connections first (so they appear behind boxes)
    this.renderConnections(startX, startY);

    // Render map boxes
    this.renderMapBoxes(startX, startY);

    // Add title
    this.addTitle(centerX, startY - 40);
  }

  /**
   * Render connections between maps
   */
  private renderConnections(startX: number, startY: number): void {
    if (!this.layoutResult) return;

    Object.keys(this.layoutResult.mapPositions).forEach((mapId) => {
      const mapData = this.worldData.maps[mapId];
      if (!mapData) return;

      const sourcePos = this.layoutResult!.mapPositions[mapId];
      const sourceX = startX + sourcePos.x * (this.BOX_SIZE + this.BOX_SPACING);
      const sourceY = startY + sourcePos.y * (this.BOX_SIZE + this.BOX_SPACING);

      // Draw connections for each exit
      mapData.exits.forEach((exit) => {
        const targetMapId = exit.targetMapId;
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
        line.beginPath();
        line.moveTo(connectionLine.startX, connectionLine.startY);
        line.lineTo(connectionLine.endX, connectionLine.endY);
        line.strokePath();
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
    if (!this.layoutResult) return;

    Object.keys(this.layoutResult.mapPositions).forEach((mapId) => {
      const mapData = this.worldData.maps[mapId];
      if (!mapData) return;

      const pos = this.layoutResult!.mapPositions[mapId];
      const size = this.layoutResult!.mapSizes[mapId];

      const boxX = startX + pos.x * (this.BOX_SIZE + this.BOX_SPACING);
      const boxY = startY + pos.y * (this.BOX_SIZE + this.BOX_SPACING);

      const boxWidth = this.BOX_SIZE * size.width;
      const boxHeight = this.BOX_SIZE * size.height;

      // Determine if this is the current map
      const isCurrentMap = mapId === this.worldData.startingMap;
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
          align: "center",
        }
      );
      nameText.setOrigin(0.5);
      nameText.setScrollFactor(0);
      nameText.setDepth(1003);

      this.worldViewGroup!.add(box);
      this.worldViewGroup!.add(nameText);
    });
  }

  /**
   * Add title to the world view
   */
  private addTitle(centerX: number, y: number): void {
    const title = this.scene.add.text(centerX, y, "World View", {
      fontSize: "16px",
      fill: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
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
}
