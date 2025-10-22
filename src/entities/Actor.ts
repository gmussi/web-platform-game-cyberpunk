import { GAME_CONSTANTS } from "../data/config";

export class Actor extends Phaser.Physics.Arcade.Sprite {
  public scene: Phaser.Scene;
  public visual: Phaser.GameObjects.Sprite;
  public facingRight: boolean;
  private visualOffsetRightX: number;
  private visualOffsetY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    initialTextureKey: string
  ) {
    super(scene, x, y, initialTextureKey);

    this.scene = scene;

    // Add physics body (this sprite) but keep it visually hidden; visuals are drawn by a separate sprite
    scene.add.existing(this);
    scene.physics.add.existing(this);
    super.setVisible(false);

    // Create visual sprite that mirrors this physics body's position
    this.visual = scene.add.sprite(x, y, initialTextureKey);
    // Align visual's bottom to the physics body's bottom by default
    this.visual.setOrigin(0.5, 1);
    this.visual.setDepth(this.depth);

    // Default orientation/offsets
    this.facingRight = true;
    this.visualOffsetRightX = 0;
    this.visualOffsetY = 0;
  }

  // Keep visual aligned every frame
  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const offsetX = this.facingRight
      ? this.visualOffsetRightX
      : -this.visualOffsetRightX;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      const centerX = body.x + body.width / 2;
      const bottomY = body.y + body.height;
      this.visual.x = centerX + offsetX;
      this.visual.y = bottomY + this.visualOffsetY;
    } else {
      this.visual.x = this.x + offsetX;
      this.visual.y = this.y + this.visualOffsetY;
    }
  }

  public override setDepth(value: number): this {
    super.setDepth(value);
    if (this.visual) this.visual.setDepth(value);
    return this;
  }

  public override setVisible(visible: boolean): this {
    // Physics sprite stays hidden; only visual toggles visibility
    super.setVisible(false);
    if (this.visual) this.visual.setVisible(visible);
    return this;
  }

  public override setPosition(
    x?: number,
    y?: number,
    z?: number,
    w?: number
  ): this {
    super.setPosition(x, y, z, w);
    if (this.visual) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const offsetX = this.facingRight
        ? this.visualOffsetRightX
        : -this.visualOffsetRightX;
      if (body) {
        const centerX = body.x + body.width / 2;
        const bottomY = body.y + body.height;
        this.visual.setPosition(
          centerX + offsetX,
          bottomY + this.visualOffsetY
        );
      } else {
        this.visual.setPosition(this.x + offsetX, this.y + this.visualOffsetY);
      }
    }
    return this;
  }

  public setVisualScale(scale: number): this {
    this.visual.setScale(scale);
    return this;
  }

  public setVisualOffsets(offsetRightX: number, offsetY: number = 0): this {
    this.visualOffsetRightX = offsetRightX;
    this.visualOffsetY = offsetY;
    return this;
  }

  public setFacingRight(isRight: boolean): this {
    this.facingRight = isRight;
    if (this.visual) this.visual.setFlipX(!isRight);
    return this;
  }

  public playAnim(key: string): this {
    this.visual.play(key);
    return this;
  }

  public setBodyBounds(
    size: { width: number; height: number },
    offset: { x: number; y: number }
  ): this {
    (this.body as Phaser.Physics.Arcade.Body).setSize(size.width, size.height);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(offset.x, offset.y);
    return this;
  }

  public setVisualTint(color: number): this {
    this.visual.setTint(color);
    return this;
  }

  public clearVisualTint(): this {
    this.visual.clearTint();
    return this;
  }

  public override destroy(fromScene?: boolean): void {
    if (this.visual) {
      this.visual.destroy();
    }
    super.destroy(fromScene);
  }
}
