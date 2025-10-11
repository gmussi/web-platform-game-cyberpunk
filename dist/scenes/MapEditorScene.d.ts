import { MapSystem } from "../systems/MapSystem";
import { TilemapSystem } from "../systems/TilemapSystem";
import { EnemyData } from "./GameScene";
interface MapEditorData {
    version: string;
    metadata: {
        name: string;
        description: string;
        created: string;
        author: string;
    };
    world: {
        width: number;
        height: number;
        tileSize: number;
    };
    player: {
        startPosition: {
            x: number;
            y: number;
        };
        character: string;
    };
    portal: {
        position: {
            x: number;
            y: number;
        };
        size: {
            width: number;
            height: number;
        };
    };
    enemies: EnemyData[];
    platforms: any[];
    collectibles: any[];
    checkpoints: any[];
    tiles: any[];
}
interface ToolButton {
    button: Phaser.GameObjects.Text;
    tool: {
        name: string;
        key: string;
        color: string;
    };
}
interface SpriteButton {
    sprite: Phaser.GameObjects.Image;
    border: Phaser.GameObjects.Rectangle;
}
export declare class MapEditorScene extends Phaser.Scene {
    mapSystem: MapSystem;
    tilemapSystem: TilemapSystem;
    mapData: MapEditorData;
    backgroundImage: Phaser.GameObjects.Image;
    darkOverlay: Phaser.GameObjects.Rectangle;
    gridGraphics: Phaser.GameObjects.Graphics;
    gridVisible: boolean;
    hudVisible: boolean;
    hudElements: Phaser.GameObjects.GameObject[];
    isLoadingCustomMap: boolean;
    selectedTool: string | null;
    selectedSpriteIndex: number | null;
    toolButtons: ToolButton[];
    solidButtonSprite: Phaser.GameObjects.Image;
    spritePicker: Phaser.GameObjects.Rectangle | null;
    spriteButtons: SpriteButton[];
    saveButton: Phaser.GameObjects.Text;
    loadButton: Phaser.GameObjects.Text;
    clearButton: Phaser.GameObjects.Text;
    backButton: Phaser.GameObjects.Text;
    objectInfoText: Phaser.GameObjects.Text;
    coordinateText: Phaser.GameObjects.Text;
    gridToggleButton: Phaser.GameObjects.Text;
    previewObjects: Phaser.GameObjects.GameObject[];
    gameObjects: Phaser.GameObjects.GameObject[];
    mouseIndicator: Phaser.GameObjects.Circle;
    cursors: any;
    wasdKeys: any;
    cameraSpeed: number;
    isDragging: boolean;
    constructor();
    preload(): void;
    private createTileTextures;
    create(): void;
    private loadDefaultMap;
    private createBackground;
    private createGridOverlay;
    private createEditorUI;
    private createToolSelection;
    private updateToolSelection;
    private openSpritePicker;
    private closeSpritePicker;
    toggleHUD(): void;
    toggleGrid(): void;
    private createMapButtons;
    private createObjectInfo;
    private createGridToggle;
    private setupCamera;
    private setupInput;
    private isClickOnUI;
    private createPreviewObjects;
    private placeObject;
    private removeObjectAt;
    private updatePlayerPosition;
    private updatePortalPosition;
    private addEnemy;
    private placeTile;
    private eraseTile;
    private updatePreviewObjects;
    private updateObjectInfo;
    saveMap(): Promise<void>;
    private saveTileDataToMap;
    private loadMap;
    loadMapFromURL(url: string): Promise<MapEditorData>;
    private loadTileDataFromMap;
    private clearAll;
    update(): void;
    private getTileTypeName;
}
export {};
//# sourceMappingURL=MapEditorScene.d.ts.map