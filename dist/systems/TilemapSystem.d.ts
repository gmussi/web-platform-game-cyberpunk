export declare class TilemapSystem {
    scene: Phaser.Scene;
    tileSize: number;
    mapWidth: number;
    mapHeight: number;
    tiles: number[][];
    collisionLayer: any;
    visualLayer: Phaser.GameObjects.Graphics;
    collisionBodies: any[];
    collisionGroup: Phaser.Physics.Arcade.StaticGroup;
    tileSpriteIndices: (number | null)[][];
    tileSprites: Phaser.GameObjects.Image[];
    constructor(scene: Phaser.Scene);
    private initializeTilemap;
    static TILE_TYPES: {
        EMPTY: number;
        SOLID: number;
    };
    static TILE_IMAGES: {
        [TilemapSystem.TILE_TYPES.SOLID]: {
            GROUND: number;
            WALL: number;
            PLATFORM: number;
        };
    };
    setTile(x: number, y: number, tileType: number, spriteIndex?: number | null): void;
    getTile(x: number, y: number): number;
    getTileSpriteIndex(x: number, y: number): number | null;
    worldToTile(worldX: number, worldY: number): {
        x: number;
        y: number;
    };
    tileToWorld(tileX: number, tileY: number): {
        x: number;
        y: number;
    };
    private updateTileVisual;
    private clearTileVisual;
    private drawTileVisual;
    redrawVisualLayer(): void;
    redrawTilesAfterTexturesReady(): void;
    createCollisionBodies(): Phaser.Physics.Arcade.StaticGroup;
    private isSolidTile;
    private createTileCollisionBody;
    checkCollision(worldX: number, worldY: number): boolean;
    findEnemySpawnPosition(preferGround?: boolean): {
        x: number;
        y: number;
    };
}
//# sourceMappingURL=TilemapSystem.d.ts.map