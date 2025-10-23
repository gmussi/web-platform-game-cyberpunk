import { GAME_CONSTANTS } from "../data/config";
import { Actor } from "./Actor";

export class Npc extends Actor {
  public scene: Phaser.Scene;
  public npcType: string; // e.g., "npc01".."npc12"
  public startX: number;
  private isRunningLoop: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, npcType: string) {
    const initialTexture = `${npcType}_idle`;
    super(scene, x, y, initialTexture);

    this.scene = scene;
    this.npcType = npcType;
    this.startX = x;

    // Visual scale similar to player
    this.setVisualScale(1.5);
    this.setDepth(15);

    // Physics body: non-colliding, no gravity
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);
      body.setImmovable(true);
      // Narrow hitbox aligned to bottom of nominal 48px frame
      this.setBodyBounds(
        { width: 24, height: 40 },
        { x: (48 - 24) / 2, y: 48 - 40 }
      );
      body.setVelocity(0, 0);
      body.setBounce(0, 0);
    }

    // Start in idle
    this.playAnim(`${this.npcType}_idle`);
  }

  public startBehaviorLoop(): void {
    if (this.isRunningLoop) return;
    this.isRunningLoop = true;
    const tile = GAME_CONSTANTS.TILE_SIZE;
    const dist = 3 * tile; // walk exactly 3 tiles

    const runCycle = async () => {
      if (!this.active || !this.scene) return;
      // Idle 3s, then special
      this.playAnim(`${this.npcType}_idle`);
      await this.wait(3000);
      await this.playSpecialOnce();

      // Idle 3s, then walk 3 tiles left/right (random)
      this.playAnim(`${this.npcType}_idle`);
      await this.wait(3000);
      const moveRight = Math.random() < 0.5;
      await this.walkBy(moveRight ? dist : -dist);

      // Idle 3s, then special
      this.playAnim(`${this.npcType}_idle`);
      await this.wait(3000);
      await this.playSpecialOnce();

      // Idle 3s, then walk back to original position
      this.playAnim(`${this.npcType}_idle`);
      await this.wait(3000);
      await this.walkTo(this.startX);
      if (this.active) runCycle();
    };

    runCycle();
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.scene.time.delayedCall(ms, () => resolve());
    });
  }

  private playSpecialOnce(): Promise<void> {
    return new Promise((resolve) => {
      const key = `${this.npcType}_special`;
      const onComplete = (
        anim: Phaser.Animations.Animation,
        frame: Phaser.Animations.AnimationFrame
      ) => {
        this.visual.off("animationcomplete", onComplete);
        this.playAnim(`${this.npcType}_idle`);
        resolve();
      };
      this.visual.on("animationcomplete", onComplete);
      this.playAnim(key);
    });
  }

  private walkBy(deltaX: number): Promise<void> {
    const targetX = this.x + deltaX;
    return this.walkTo(targetX);
  }

  private walkTo(targetX: number): Promise<void> {
    return new Promise((resolve) => {
      const durationPerPixel = 6; // ms per pixel (~128px -> ~768ms)
      const dx = targetX - this.x;
      // Update facing
      this.setFacingRight(dx >= 0);
      this.playAnim(`${this.npcType}_walk`);

      // Tween the physics sprite's x. Arcade body follows sprite x.
      this.scene.tweens.add({
        targets: this,
        x: targetX,
        duration: Math.max(300, Math.abs(dx) * durationPerPixel),
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.playAnim(`${this.npcType}_idle`);
          resolve();
        },
      });
    });
  }
}
