interface MapData {
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
interface EnemyData {
    id: string;
    type: string;
    enemyType: string;
    position: {
        x: number;
        y: number;
    };
    properties: {
        damage: number;
        health: number;
        speed: number;
        patrolRange: number;
    };
}
export declare class MapSystem {
    scene: Phaser.Scene;
    mapData: MapData | null;
    mapFileName: string;
    constructor(scene: Phaser.Scene);
    saveMap(mapData?: MapData | null): Promise<boolean>;
    private saveMapWithFilePicker;
    private saveMapWithPrompt;
    loadMap(file: File): Promise<MapData>;
    loadMapFromURL(url: string): Promise<MapData>;
    private validateMapData;
    getMapData(): MapData | null;
    setMapData(mapData: MapData): boolean;
    createMapFromGameState(): MapData | null;
    exportMapData(mapData?: MapData | null): string | null;
    importMapData(jsonString: string): boolean;
}
export {};
//# sourceMappingURL=MapSystem.d.ts.map