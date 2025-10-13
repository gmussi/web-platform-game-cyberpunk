import { ExitZone as ExitZoneData } from "../types/map";

export class ExitZone extends Phaser.GameObjects.Container {
  public scene: Phaser.Scene;
  public exitData: ExitZoneData;
  public zoneBorder: Phaser.GameObjects.Rectangle;
  public zoneFill: Phaser.GameObjects.Rectangle;
  public labelText: Phaser.GameObjects.Text;
  public promptText: Phaser.GameObjects.Text | null = null;
  public physicsBody: Phaser.Physics.Arcade.Body;
  private glowTween: Phaser.Tweens.Tween | null = null;
  private isPlayerNear: boolean = false;

  constructor(scene: Phaser.Scene, exitData: ExitZoneData) {
    super(scene, exitData.x, exitData.y);

    this.scene = scene;
    this.exitData = exitData;

    // Create visual representation
    this.createVisuals();

    // Add to scene
    scene.add.existing(this);

    // Add physics body
    scene.physics.add.existing(this);
    this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setSize(exitData.width, exitData.height);
    this.physicsBody.setAllowGravity(false);
    this.physicsBody.setImmovable(true);

    this.setDepth(25);
  }

  private createVisuals(): void {
    // Create fill (semi-transparent)
    this.zoneFill = this.scene.add.rectangle(
      0,
      0,
      this.exitData.width,
      this.exitData.height,
      this.getColorForMap(this.exitData.targetMapId),
      0.3
    );
    this.add(this.zoneFill);

    // Create border (more visible)
    this.zoneBorder = this.scene.add.rectangle(
      0,
      0,
      this.exitData.width,
      this.exitData.height
    );
    this.zoneBorder.setStrokeStyle(
      3,
      this.getColorForMap(this.exitData.targetMapId),
      0.8
    );
    this.add(this.zoneBorder);

    // Create label
    this.labelText = this.scene.add.text(
      0,
      0,
      `→ ${this.exitData.targetMapId}`,
      {
        fontSize: "12px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#000000aa",
        padding: { x: 4, y: 2 },
      }
    );
    this.labelText.setOrigin(0.5);
    this.add(this.labelText);

    // Add pulsing glow effect
    this.glowTween = this.scene.tweens.add({
      targets: this.zoneFill,
      alpha: { from: 0.3, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Get a consistent color for each map ID
  private getColorForMap(mapId: string): number {
    const colors = [
      0x00ffff, // Cyan
      0xff00ff, // Magenta
      0xffff00, // Yellow
      0x00ff00, // Green
      0xff8800, // Orange
      0x8800ff, // Purple
      0xff0088, // Pink
      0x00ff88, // Teal
    ];

    // Simple hash function to get consistent color for map ID
    let hash = 0;
    for (let i = 0; i < mapId.length; i++) {
      hash = mapId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  // Check if player is overlapping and show prompt
  public checkPlayerOverlap(player: Phaser.Physics.Arcade.Sprite): boolean {
    const isOverlapping = this.scene.physics.overlap(player, this);

    if (isOverlapping && !this.isPlayerNear) {
      this.showPrompt();
      this.isPlayerNear = true;
    } else if (!isOverlapping && this.isPlayerNear) {
      this.hidePrompt();
      this.isPlayerNear = false;
    }

    return isOverlapping;
  }

  // Show "Press UP to enter" prompt
  private showPrompt(): void {
    if (this.promptText) {
      return;
    }

    this.promptText = this.scene.add.text(
      this.x,
      this.y - this.exitData.height / 2 - 30,
      "Press ↑ to enter",
      {
        fontSize: "14px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
        backgroundColor: "#000000cc",
        padding: { x: 8, y: 4 },
      }
    );
    this.promptText.setOrigin(0.5);
    this.promptText.setDepth(100);
    this.promptText.setScrollFactor(1);

    // Add bouncing animation
    this.scene.tweens.add({
      targets: this.promptText,
      y: this.promptText.y - 5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Hide prompt
  private hidePrompt(): void {
    if (this.promptText) {
      this.promptText.destroy();
      this.promptText = null;
    }
  }

  // Get target map and spawn
  public getTargetInfo(): { mapId: string; spawnId: string } {
    return {
      mapId: this.exitData.targetMapId,
      spawnId: this.exitData.targetSpawnId,
    };
  }

  // Update exit data
  public updateExitData(exitData: ExitZoneData): void {
    this.exitData = exitData;
    this.x = exitData.x;
    this.y = exitData.y;
    this.physicsBody.setSize(exitData.width, exitData.height);

    // Update visuals
    this.zoneFill.setSize(exitData.width, exitData.height);
    this.zoneBorder.setSize(exitData.width, exitData.height);
    this.labelText.setText(`→ ${exitData.targetMapId}`);

    const color = this.getColorForMap(exitData.targetMapId);
    this.zoneFill.setFillStyle(color, 0.3);
    this.zoneBorder.setStrokeStyle(3, color, 0.8);
  }

  // Clean up
  public destroy(fromScene?: boolean): void {
    if (this.glowTween) {
      this.glowTween.stop();
      this.glowTween = null;
    }

    if (this.promptText) {
      this.promptText.destroy();
      this.promptText = null;
    }

    super.destroy(fromScene);
  }
}
