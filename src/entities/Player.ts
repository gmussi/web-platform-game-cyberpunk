import { GAME_CONSTANTS } from "../data/config";
import { characters, gameData } from "../data/characters";
import { Character } from "../types/game";
import { Actor } from "./Actor";

// Jump phase type
type JumpPhase = "none" | "start" | "ascending" | "falling" | "landing";

// Animation state type
type AnimationState = "idle" | "running" | "jumping";

export class Player extends Actor {
  public scene: Phaser.Scene;
  public characterKey: string;
  public characterData: Character;
  public charName: string;
  public cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  public spaceKey: Phaser.Input.Keyboard.Key;
  public speed: number;
  public jumpPower: number;
  public isGrounded: boolean;
  public health: number;
  public maxHealth: number;
  public isMoving: boolean;
  public currentAnimation: AnimationState;
  public isJumping: boolean;
  public jumpPhase: JumpPhase;
  public jumpStartTime: number;
  public jumpFrameIndex: number;
  public isDroppingThrough?: boolean;
  public dropThroughUntil?: number;

  constructor(scene: Phaser.Scene, x: number, y: number, characterKey: string) {
    // Character key is now the character name directly (biker, punk, cyborg)
    const charName = characterKey;

    // Start with the idle animation first frame
    const initialTexture = `${charName}_idle`;

    super(scene, x, y, initialTexture);

    this.scene = scene;
    this.characterKey = characterKey;
    this.characterData = characters[characterKey]!;
    this.charName = charName!;

    // Scale visual sprite to 150% (48px -> 72px display size)
    this.setVisualScale(1.5);

    // Set up physics body
    this.setCollideWorldBounds(false); // Disable world bounds - we use custom edge walls instead
    this.setBounce(0.2);
    this.setDragX(300);

    // Set proper physics body size (smaller than sprite for better gameplay)
    // Sprite is 48x48, body should be narrower and aligned to bottom (where feet are)
    const bodyWidth = 32;
    const bodyHeight = 44;
    // Centered hitbox with feet aligned to bottom of nominal 48px frame
    this.setBodyBounds(
      { width: bodyWidth, height: bodyHeight },
      { x: (48 - bodyWidth) / 2, y: 48 - bodyHeight }
    );

    // Set depth to appear above dark overlay and other elements
    this.setDepth(30);

    // Ensure player is always visible (visual only)
    this.visual.setVisible(true);

    // Input handling
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Player properties
    this.speed = 200;
    this.jumpPower = 400;
    this.isGrounded = false;
    this.health = gameData.maxHealth;
    this.maxHealth = gameData.maxHealth;

    // Animation states
    this.isMoving = false;
    this.setFacingRight(true);
    this.currentAnimation = "idle";
    this.isJumping = false;

    // Jump animation phases
    this.jumpPhase = "none"; // 'none', 'start', 'ascending', 'falling', 'landing'
    this.jumpStartTime = 0;
    this.jumpFrameIndex = 0;

    // Visual starts unflipped; set optional visual X offset from character data
    if (typeof this.characterData.visualOffsetX === "number") {
      this.setVisualOffsets(this.characterData.visualOffsetX, 0);
    }

    // Start with idle animation
    this.playAnim(`${charName}_idle`);

    // Player created successfully
  }

  public update(): void {
    this.handleMovement();
    this.handleJump();
    this.updateAnimation();

    // Ensure player stays visible (visual only)
    this.setVisible(true);

    // Ensure player depth is maintained
    this.setDepth(30);
  }

  private handleMovement(): void {
    const wasMoving = this.isMoving;

    // Ensure player is visible before movement
    this.setVisible(true);
    this.setActive(true);

    // Get screen boundaries (camera view)
    const camera = this.scene.cameras.main;
    const screenLeft = camera.worldView.x;
    const screenRight = camera.worldView.x + camera.worldView.width;
    const playerHalfWidth = this.width / 2;

    // Check if player can move left (not at left edge)
    const canMoveLeft = this.x - playerHalfWidth > screenLeft;
    // Check if player can move right (not at right edge)
    const canMoveRight = this.x + playerHalfWidth < screenRight;

    // Reset movement state
    this.isMoving = false;

    if (this.cursors.left!.isDown && canMoveLeft) {
      console.log("🧠 Player moving left");
      this.setVelocityX(-this.speed);
      // Only set isMoving to true if not jumping
      if (this.jumpPhase === "none") {
        this.isMoving = true;
      }
      this.setFacingRight(false);
    } else if (this.cursors.right!.isDown && canMoveRight) {
      console.log("🧠 Player moving right");
      this.setVelocityX(this.speed);
      // Only set isMoving to true if not jumping
      if (this.jumpPhase === "none") {
        this.isMoving = true;
      }
      this.setFacingRight(true);
    } else {
      this.setVelocityX(0);
      this.isMoving = false;
    }

    // Ensure player stays visible after movement (visual only)
    this.setVisible(true);

    // Check if movement state changed
    if (wasMoving !== this.isMoving) {
      this.scene.events.emit("playerMovementChanged", this.isMoving);
    }
  }

  private handleJump(): void {
    // Only update grounded state if not in a jump sequence
    if (this.jumpPhase === "none") {
      this.isGrounded = this.body.touching.down;
    } else {
      // During jump, keep grounded false until landing is complete
      this.isGrounded = false;
    }

    // Drop-through: down + jump while grounded
    if (
      this.isGrounded &&
      this.cursors.down?.isDown &&
      Phaser.Input.Keyboard.JustDown(this.spaceKey)
    ) {
      this.isDroppingThrough = true;
      this.dropThroughUntil = this.scene.time.now + 300;
      // Nudge downward to ensure separation starts
      this.setVelocityY(60);
      // Enter falling phase immediately and start on frame 005
      this.isGrounded = false;
      this.isJumping = true;
      this.jumpPhase = "falling";
      this.jumpStartTime = this.scene.time.now;
      this.jumpFrameIndex = 0;
      this.scene.events.emit("playerDropThrough");
      return;
    }

    if (this.isGrounded && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      console.log("🧠 Player jumping");
      // Player jumped
      this.setVelocityY(-this.jumpPower);
      this.scene.events.emit("playerJumped");

      // Start jump animation sequence
      this.jumpPhase = "start";
      this.jumpStartTime = this.scene.time.now;
      this.jumpFrameIndex = 0;
      this.isJumping = true;
      this.isGrounded = false; // Ensure we're not grounded during jump
    }

    // Update jump phase based on velocity and physics
    if (this.jumpPhase !== "none") {
      if (this.jumpPhase === "start") {
        // Check if we've finished the start animation (frames 000-003)
        const timeSinceStart = this.scene.time.now - this.jumpStartTime;
        if (timeSinceStart > 200) {
          // 200ms for start animation
          this.jumpPhase = "ascending";
        }
      } else if (this.jumpPhase === "ascending" && this.body.velocity.y >= 0) {
        // Switch to falling when velocity becomes positive
        this.jumpPhase = "falling";
      } else if (this.jumpPhase === "falling" && this.body.touching.down) {
        // Player landed, start landing animation
        this.jumpPhase = "landing";
        this.jumpStartTime = this.scene.time.now;
        this.jumpFrameIndex = 0;
      }
    }
  }

  private updateAnimation(): void {
    // Handle jump animation phases
    if (this.jumpPhase !== "none") {
      this.handleJumpAnimation();
      return;
    }

    // Handle ground animations
    if (this.isMoving) {
      // Running animation
      const animationKey = `${this.charName}_run`;
      if (this.currentAnimation !== "running") {
        this.playAnim(animationKey);
        this.currentAnimation = "running";
      }
    } else {
      // Idle animation
      if (this.currentAnimation !== "idle") {
        this.playAnim(`${this.charName}_idle`);
        this.currentAnimation = "idle";
      }
    }
  }

  private handleJumpAnimation(): void {
    // Play jump animation if not already playing
    if (this.currentAnimation !== "jumping") {
      this.playAnim(`${this.charName}_jump`);
      this.currentAnimation = "jumping";
    }

    // Check if we've landed and the jump animation has finished
    if (this.jumpPhase === "landing") {
      const timeSinceStart = this.scene.time.now - this.jumpStartTime;
      // Finish landing after a short delay
      if (timeSinceStart > 150) {
        this.jumpPhase = "none";
        this.isJumping = false;
      }
    }
  }

  public takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) this.health = 0;

    // Visual feedback for damage
    this.setVisualTint(0xff0000); // Red flash
    this.scene.time.delayedCall(200, () => {
      this.setVisualTint(this.characterData.color);
    });

    // Emit damage event
    this.scene.events.emit("playerDamaged", this.health);

    // Check for game over
    if (this.health <= 0) {
      this.scene.events.emit("playerDied");
    }
  }

  public heal(amount: number): void {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;

    // Visual feedback for healing
    this.setVisualTint(0x00ff00); // Green flash
    this.scene.time.delayedCall(200, () => {
      this.setVisualTint(this.characterData.color);
    });

    this.scene.events.emit("playerHealed", this.health);
  }

  public getHealthPercentage(): number {
    return (this.health / this.maxHealth) * 100;
  }

  public getCharacterName(): string {
    return this.characterData.name;
  }
}
