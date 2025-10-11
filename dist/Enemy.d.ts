type EnemyType = "stationary" | "moving";
type EnemySpriteType = "enemy1" | "enemy2";
type FacingDirection = "south" | "east" | "west";
export declare class Enemy extends Phaser.Physics.Arcade.Sprite {
    scene: Phaser.Scene;
    type: EnemyType;
    enemyType: EnemySpriteType;
    damage: number;
    speed: number;
    health: number;
    maxHealth: number;
    moveDirection: 1 | -1;
    moveDistance: number;
    startX: number;
    patrolRange: number;
    lastCollisionTime: number;
    collisionCooldown: number;
    facingDirection: FacingDirection;
    constructor(scene: Phaser.Scene, x: number, y: number, type?: EnemyType, enemyType?: EnemySpriteType);
    private updateSprite;
    private setupBehavior;
    update(): void;
    private handlePatrol;
    private updateFacingDirection;
    private checkPlayerCollision;
    takeDamage(amount: number): void;
    static createStationaryEnemy(scene: Phaser.Scene, x: number, y: number, enemyType?: EnemySpriteType): Enemy;
    static createMovingEnemy(scene: Phaser.Scene, x: number, y: number, enemyType?: EnemySpriteType): Enemy;
    static createPatrolEnemy(scene: Phaser.Scene, x: number, y: number, patrolRange?: number, enemyType?: EnemySpriteType): Enemy;
}
export {};
//# sourceMappingURL=Enemy.d.ts.map