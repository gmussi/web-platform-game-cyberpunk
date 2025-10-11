interface Character {
    name: string;
    color: number;
    scrollDirection: string;
}
type JumpPhase = "none" | "start" | "ascending" | "falling" | "landing";
type AnimationState = "breathing_idle" | "walking" | "jumping_start" | "jumping_ascending" | "jumping_falling" | "jumping_landing";
export declare class Player extends Phaser.Physics.Arcade.Sprite {
    scene: Phaser.Scene;
    characterKey: string;
    characterData: Character;
    charName: string;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    spaceKey: Phaser.Input.Keyboard.Key;
    speed: number;
    jumpPower: number;
    isGrounded: boolean;
    health: number;
    maxHealth: number;
    isMoving: boolean;
    facingRight: boolean;
    currentAnimation: AnimationState;
    isJumping: boolean;
    jumpPhase: JumpPhase;
    jumpStartTime: number;
    jumpFrameIndex: number;
    constructor(scene: Phaser.Scene, x: number, y: number, characterKey: string);
    update(): void;
    private handleMovement;
    private handleJump;
    private updateAnimation;
    private handleJumpAnimation;
    takeDamage(amount: number): void;
    heal(amount: number): void;
    getHealthPercentage(): number;
    getCharacterName(): string;
}
export {};
//# sourceMappingURL=Player.d.ts.map