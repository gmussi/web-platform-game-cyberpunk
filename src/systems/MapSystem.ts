import { MapData, MapValidationResult } from "../types/map";
import { ASSET_PATHS } from "../data/config";

// MapSystem interfaces
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
    startPosition: { x: number; y: number };
    character: string;
  };
  portal: {
    position: { x: number; y: number };
    size: { width: number; height: number };
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
  position: { x: number; y: number };
  properties: {
    damage: number;
    health: number;
    speed: number;
    patrolRange: number;
  };
}

interface FileHandle {
  createWritable(): Promise<WritableStream>;
}

interface WindowWithFilePicker extends Window {
  showSaveFilePicker(options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: { [key: string]: string[] };
    }>;
  }): Promise<FileHandle>;
}

export class MapSystem {
  public scene: Phaser.Scene;
  public mapData: MapData | null;
  public mapFileName: string;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.mapData = null;
    this.mapFileName = "default.json";
  }

  // Save current map data to file with custom filename
  public async saveMap(mapData: MapData | null = null): Promise<boolean> {
    const dataToSave = mapData || this.mapData;

    if (!dataToSave) {
      console.error("No map data available to save");
      return false;
    }

    try {
      // Try to use File System Access API for better file handling
      if ("showSaveFilePicker" in window) {
        return await this.saveMapWithFilePicker(dataToSave);
      } else {
        // Fallback to custom filename prompt
        return await this.saveMapWithPrompt(dataToSave);
      }
    } catch (error) {
      console.error("Error saving map:", error);
      return false;
    }
  }

  // Save map using File System Access API
  private async saveMapWithFilePicker(mapData: MapData): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(mapData, null, 2);

      // Show file picker
      const fileHandle = await (
        window as unknown as WindowWithFilePicker
      ).showSaveFilePicker({
        suggestedName: this.mapFileName,
        types: [
          {
            description: "JSON Map Files",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      // Write to file
      const writable = await fileHandle.createWritable();
      await (writable as any).write(jsonString);
      await (writable as any).close();

      return true;
    } catch (error: any) {
      if (error.name === "AbortError") {
        return false;
      }
      throw error;
    }
  }

  // Save map with custom filename prompt (fallback)
  private async saveMapWithPrompt(mapData: MapData): Promise<boolean> {
    const jsonString = JSON.stringify(mapData, null, 2);

    // Prompt for filename
    const filename = prompt("Enter filename for your map:", this.mapFileName);
    if (!filename) {
      return false;
    }

    // Ensure .json extension
    const finalFilename = filename.endsWith(".json")
      ? filename
      : filename + ".json";

    // Create a blob and download link
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    return true;
  }

  // Load map data from file
  public async loadMap(file: File): Promise<MapData> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const mapData = JSON.parse(event.target?.result as string);

          // Validate map data structure
          if (this.validateMapData(mapData)) {
            console.log(
              "📁 MapSystem: File loaded successfully:",
              mapData.metadata?.name,
              mapData.world?.width,
              "x",
              mapData.world?.height
            );
            this.mapData = mapData;
            resolve(mapData);
          } else {
            console.error("❌ MapSystem: Invalid map data format");
            reject(new Error("Invalid map data format"));
          }
        } catch (error: any) {
          reject(new Error("Error parsing map file: " + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsText(file);
    });
  }

  // Load map from URL (for example maps)
  public async loadMapFromURL(url: string): Promise<MapData> {
    try {
      // Add cache-busting parameter to prevent stale cache issues
      const cacheBuster = `?t=${Date.now()}`;
      const urlWithCacheBuster = url + cacheBuster;

      console.log(`🔄 Loading map from URL: ${urlWithCacheBuster}`);

      const response = await fetch(urlWithCacheBuster, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const mapData = await response.json();
      console.log(
        `✅ Map loaded successfully: ${mapData.metadata?.name || "Unknown"} (${
          mapData.world?.width
        }x${mapData.world?.height})`
      );

      if (this.validateMapData(mapData)) {
        this.mapData = mapData;
        return mapData;
      } else {
        throw new Error("Invalid map data format");
      }
    } catch (error) {
      console.error("Error loading map from URL:", error);
      throw error;
    }
  }

  // Validate map data structure
  private validateMapData(mapData: any): mapData is MapData {
    const requiredFields = [
      "version",
      "metadata",
      "world",
      "player",
      "portal",
      "enemies",
    ];

    for (const field of requiredFields) {
      if (!mapData[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate player data
    if (
      !mapData.player.startPosition ||
      typeof mapData.player.startPosition.x !== "number" ||
      typeof mapData.player.startPosition.y !== "number"
    ) {
      console.error("Invalid player start position");
      return false;
    }

    // Validate portal data
    if (
      !mapData.portal.position ||
      typeof mapData.portal.position.x !== "number" ||
      typeof mapData.portal.position.y !== "number"
    ) {
      console.error("Invalid portal position");
      return false;
    }

    // Validate enemies array
    if (!Array.isArray(mapData.enemies)) {
      console.error("Enemies must be an array");
      return false;
    }

    for (const enemy of mapData.enemies) {
      if (!enemy.id || !enemy.type || !enemy.position || !enemy.enemyType) {
        console.error("Invalid enemy data:", enemy);
        return false;
      }
    }

    return true;
  }

  // Get current map data
  public getMapData(): MapData | null {
    return this.mapData;
  }

  // Set map data
  public setMapData(mapData: MapData): boolean {
    if (this.validateMapData(mapData)) {
      this.mapData = mapData;
      return true;
    }
    return false;
  }

  // Create a map from current game state
  public createMapFromGameState(): MapData | null {
    const scene = this.scene as any; // Type assertion for scene with game objects

    if (!scene.player || !scene.portalSprite || !scene.enemies) {
      console.error("Cannot create map: missing game objects");
      return null;
    }

    // Create basic map structure
    const mapData: MapData = {
      version: "1.0",
      metadata: {
        name: "Generated Map",
        description: "Map generated from current game state",
        created: new Date().toISOString(),
        author: "Game System",
      },
      world: {
        width: 4100,
        height: 800,
        tileSize: 32,
      },
      player: {
        startPosition: { x: 0, y: 0 },
        character: "A",
      },
      portal: {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      },
      enemies: [],
      platforms: [],
      collectibles: [],
      checkpoints: [],
      tiles: [],
    };

    // Update player position
    mapData.player.startPosition.x = scene.player.x;
    mapData.player.startPosition.y = scene.player.y;
    mapData.player.character = scene.player.characterKey;

    // Update portal position
    mapData.portal.position.x = scene.portalSprite.x;
    mapData.portal.position.y = scene.portalSprite.y;

    // Update enemy positions
    mapData.enemies = [];
    scene.enemies.forEach((enemy: any, index: number) => {
      mapData.enemies.push({
        id: `enemy_${index + 1}`,
        type: enemy.type,
        enemyType: enemy.enemyType,
        position: { x: enemy.x, y: enemy.y },
        properties: {
          damage: enemy.damage,
          health: enemy.health,
          speed: enemy.speed,
          patrolRange: enemy.patrolRange || 150,
        },
      });
    });

    return mapData;
  }

  // Export map data as JSON string
  public exportMapData(mapData: MapData | null = null): string | null {
    const dataToExport = mapData || this.mapData;

    if (!dataToExport) {
      console.error("No map data available to export");
      return null;
    }

    return JSON.stringify(dataToExport, null, 2);
  }

  // Import map data from JSON string
  public importMapData(jsonString: string): boolean {
    try {
      const mapData = JSON.parse(jsonString);
      if (this.validateMapData(mapData)) {
        this.mapData = mapData;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error importing map data:", error);
      return false;
    }
  }
}
