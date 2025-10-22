import { GAME_CONSTANTS } from "../data/config";
import { EnemyType, EnemySpriteType } from "../types/enemy";
import { Actor } from "./Actor";
type FacingDirection = "south" | "east" | "west";

export class Enemy extends Actor {
  public scene: Phaser.Scene;
  public type: EnemyType;
  public enemyType: EnemySpriteType;
  public damage: number;
  public speed: number;
  public health: number;
  public maxHealth: number;
  public moveDirection: 1 | -1;
  public moveDistance: number;
  public startX: number;
  public patrolRange: number;
  public lastCollisionTime: number;
  public collisionCooldown: number;
  public facingDirection: FacingDirection;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType = "stationary",
    enemyType: EnemySpriteType = "enemy1"
  ) {
    // Use actual enemy sprites instead of procedural generation
    const enemySprites: { [key in EnemySpriteType]: string } = {
      enemy1: "enemy1_south",
      enemy2: "enemy2_south",
    };

    const textureKey = enemySprites[enemyType];

    super(scene, x, y, textureKey);

    this.scene = scene;
    this.type = type; // 'stationary' or 'moving'
    this.enemyType = enemyType; // 'enemy1' or 'enemy2'

    // Set up physics body
    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(false);
    // Enemies now affected by gravity like the player

    // Centered hitbox (assume nominal 64x64 enemy frames -> align bottom to 64)
    this.setBodyBounds(
      { width: 32, height: 48 },
      { x: (64 - 32) / 2, y: 64 - 48 }
    );

    // All enemies need to be movable to collide with platforms properly
    (this.body as Phaser.Physics.Arcade.Body).setImmovable(false); // Allow collision with platforms

    // Enemy properties
    this.damage = 20;
    this.speed = 50;
    this.health = 50;
    this.maxHealth = 50;

    // Set depth to appear above dark overlay
    this.setDepth(20);

    // Movement properties for moving enemies
    this.moveDirection = 1; // 1 for right, -1 for left
    this.moveDistance = 100;
    this.startX = x;
    this.patrolRange = 150;

    // Collision detection
    this.lastCollisionTime = 0;
    this.collisionCooldown = 1000; // 1 second cooldown

    // Set initial facing direction (south for stationary enemies)
    this.facingDirection = "south";
    this.updateSprite();

    this.setupBehavior();
  }

  private updateSprite(): void {
    // Update visual based on facing direction
    const spriteKey = `${this.enemyType}_${this.facingDirection}`;
    if (this.scene.textures.exists(spriteKey)) {
      this.visual.setTexture(spriteKey);
    }
    // Flip horizontally for east/west using Actor's API
    if (this.facingDirection === "east") this.setFacingRight(true);
    if (this.facingDirection === "west") this.setFacingRight(false);
  }

  private setupBehavior(): void {
    if (this.type === "moving") {
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(
        this.speed * this.moveDirection
      );
    } else {
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    }
  }

  public update(): void {
    if (this.type === "moving") {
      this.handlePatrol();
    }

    this.checkPlayerCollision();
  }

  private handlePatrol(): void {
    // Check if enemy has moved too far from start position
    const distanceFromStart = Math.abs(this.x - this.startX);

    if (distanceFromStart >= this.patrolRange) {
      this.moveDirection *= -1;
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(
        this.speed * this.moveDirection
      );
      this.updateFacingDirection();
    }

    // Check for walls or platforms
    if (
      (this.body as Phaser.Physics.Arcade.Body).blocked.left ||
      (this.body as Phaser.Physics.Arcade.Body).blocked.right
    ) {
      this.moveDirection *= -1;
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(
        this.speed * this.moveDirection
      );
      this.updateFacingDirection();
    }
  }

  private updateFacingDirection(): void {
    // Update facing direction based on movement
    if (this.moveDirection > 0) {
      this.facingDirection = "east";
    } else {
      this.facingDirection = "west";
    }
    this.updateSprite();
  }

  private checkPlayerCollision(): void {
    const player = (this.scene as any).player;
    if (!player) return;

    // Check if enough time has passed since last collision
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
      return;
    }

    // Check collision with player
    if (this.scene.physics.overlap(this, player)) {
      this.lastCollisionTime = currentTime;
      player.takeDamage(this.damage);

      // Play Wilhelm scream sound effect
      (this.scene as any).playWilhelmScream();

      // Visual feedback
      this.setVisualTint(0xffaa00); // Orange flash
      this.scene.time.delayedCall(200, () => {
        this.setVisualTint(0xff0000);
      });
    }
  }

  public takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
      this.scene.events.emit("enemyDestroyed", this);
    }
  }

  // Static method to create different types of enemies
  public static createStationaryEnemy(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyType: EnemySpriteType = "enemy1"
  ): Enemy {
    return new Enemy(scene, x, y, "stationary", enemyType);
  }

  public static createMovingEnemy(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyType: EnemySpriteType = "enemy1"
  ): Enemy {
    return new Enemy(scene, x, y, "moving", enemyType);
  }

  public static createPatrolEnemy(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolRange: number = 150,
    enemyType: EnemySpriteType = "enemy1"
  ): Enemy {
    const enemy = new Enemy(scene, x, y, "moving", enemyType);
    enemy.patrolRange = patrolRange;
    return enemy;
  }
}
