import { MapSystem } from "../systems/MapSystem";
import { TilemapSystem } from "../systems/TilemapSystem";
import { Player } from "../Player";
import { Enemy } from "../Enemy";
interface MapData {
    metadata?: {
        name: string;
    };
    tiles?: number[][];
    player?: {
        startPosition: {
            x: number;
            y: number;
        };
    };
    portal?: {
        position: {
            x: number;
            y: number;
        };
        animationSpeed?: number;
        size?: {
            width: number;
            height: number;
        };
    };
    enemies?: EnemyData[];
}
export interface EnemyData {
    type: "stationary" | "moving" | "patrol";
    position: {
        x: number;
        y: number;
    };
    enemyType: "enemy1" | "enemy2";
    properties?: {
        damage?: number;
        health?: number;
        maxHealth?: number;
        speed?: number;
        patrolRange?: number;
    };
}
interface PortalArea {
    x: number;
    y: number;
    width: number;
    height: number;
    buffer: number;
}
export declare class GameScene extends Phaser.Scene {
    mapSystem: MapSystem;
    tilemapSystem: TilemapSystem;
    player: Player;
    enemies: Enemy[];
    enemyGroup: Phaser.Physics.Arcade.Group;
    playerGroup: Phaser.Physics.Arcade.Group;
    portalSprite: Phaser.GameObjects.Sprite;
    portalArea: PortalArea;
    mapData: MapData;
    backgroundImage: Phaser.GameObjects.Image;
    darkOverlay: Phaser.GameObjects.Rectangle;
    characterNameText: Phaser.GameObjects.Text;
    healthBarX: number;
    healthBarBg: Phaser.GameObjects.Rectangle;
    healthBar: Phaser.GameObjects.Rectangle;
    healthText: Phaser.GameObjects.Text;
    mapInfoText: Phaser.GameObjects.Text;
    mapFileInput: HTMLInputElement;
    mapSaveKey: Phaser.Input.Keyboard.Key;
    mapLoadKey: Phaser.Input.Keyboard.Key;
    backgroundMusic: Phaser.Sound.BaseSound;
    wilhelmScream: Phaser.Sound.BaseSound;
    frameCount: number;
    constructor();
    preload(): void;
    private createTileTextures;
    private createCharacterAnimations;
    create(): void;
    private loadMapData;
    private loadTileDataFromMap;
    private setupWorldBounds;
    private createBackground;
    private createDarkOverlay;
    private createFallbackBackground;
    private addAtmosphericElements;
    private checkPortalCollision;
    private createPlayer;
    private repositionPlayer;
    private updateObjectsFromMapData;
    private findSpawnPosition;
    private createEnemies;
    private createPortal;
    private setupCollisions;
    private createUI;
    private createMapManagementUI;
    private createMapFileInput;
    private reloadMapData;
    saveCurrentMap(): Promise<void>;
    private loadMapFromFile;
    private setupCamera;
    private setupEventListeners;
    private updateHealthBar;
    update(): void;
    private startBackgroundMusic;
    playWilhelmScream(): void;
    stopBackgroundMusic(): void;
    shutdown(): void;
}
export {};
//# sourceMappingURL=GameScene.d.ts.map