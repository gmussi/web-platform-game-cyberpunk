export declare class Platform extends Phaser.Physics.Arcade.Sprite {
    scene: Phaser.Scene;
    width: number;
    height: number;
    neonEdge: Phaser.GameObjects.Rectangle;
    innerBorder: Phaser.GameObjects.Rectangle;
    isSolid: boolean;
    constructor(scene: Phaser.Scene, x: number, y: number, width?: number, height?: number);
    static createSmall(scene: Phaser.Scene, x: number, y: number): Platform;
    static createMedium(scene: Phaser.Scene, x: number, y: number): Platform;
    static createLarge(scene: Phaser.Scene, x: number, y: number): Platform;
    static createWide(scene: Phaser.Scene, x: number, y: number): Platform;
    static checkPlatformCollision(x: number, y: number, width: number, height: number, existingPlatforms: Platform[], minDistance?: number): boolean;
    static createPlatformSequence(scene: Phaser.Scene, startX: number, startY: number, count: number, spacing?: number, heightVariation?: number, existingPlatforms?: Platform[], portalCollisionCheck?: ((x: number, y: number, width: number, height: number) => boolean) | null): Platform[];
    static createGround(scene: Phaser.Scene, startX: number, y: number, width: number, count?: number): Platform[];
    static createFloatingPlatforms(scene: Phaser.Scene, startX: number, baseY: number, count: number, spacing?: number, existingPlatforms?: Platform[], portalCollisionCheck?: ((x: number, y: number, width: number, height: number) => boolean) | null): Platform[];
}
//# sourceMappingURL=Platform.d.ts.map