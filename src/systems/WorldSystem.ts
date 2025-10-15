import { WorldData, WorldMapData, SpawnPoint, ExitZone } from "../types/map";

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

export class WorldSystem {
  public scene: Phaser.Scene;
  public worldData: WorldData | null;
  public currentMapId: string | null;
  public worldFileName: string;
  public visitedMaps: Set<string>; // Track which maps the player has visited

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.worldData = null;
    this.currentMapId = null;
    this.worldFileName = "default_world.json";
    this.visitedMaps = new Set<string>();
  }

  // Load world data from file
  public async loadWorld(file: File): Promise<WorldData> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const worldData = JSON.parse(event.target?.result as string);

          if (this.validateWorldData(worldData)) {
            this.worldData = worldData;
            // Set current map to starting map
            this.currentMapId = worldData.startingMap;
            // Mark starting map as visited
            this.visitedMaps.add(worldData.startingMap);
            resolve(worldData);
          } else {
            reject(new Error("Invalid world data format"));
          }
        } catch (error: any) {
          reject(new Error("Error parsing world file: " + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsText(file);
    });
  }

  // Load world from URL
  public async loadWorldFromURL(url: string): Promise<WorldData> {
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const urlWithCacheBuster = url + cacheBuster;

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

      const worldData = await response.json();

      if (this.validateWorldData(worldData)) {
        this.worldData = worldData;
        this.currentMapId = worldData.startingMap;
        // Mark starting map as visited
        this.visitedMaps.add(worldData.startingMap);
        return worldData;
      } else {
        throw new Error("Invalid world data format");
      }
    } catch (error) {
      console.error("Error loading world from URL:", error);
      throw error;
    }
  }

  // Save world to file
  public async saveWorld(worldData: WorldData | null = null): Promise<boolean> {
    const dataToSave = worldData || this.worldData;

    if (!dataToSave) {
      console.error("No world data available to save");
      return false;
    }

    try {
      if ("showSaveFilePicker" in window) {
        return await this.saveWorldWithFilePicker(dataToSave);
      } else {
        return await this.saveWorldWithPrompt(dataToSave);
      }
    } catch (error) {
      console.error("Error saving world:", error);
      return false;
    }
  }

  // Save world using File System Access API
  private async saveWorldWithFilePicker(
    worldData: WorldData
  ): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(worldData, null, 2);

      const fileHandle = await (
        window as unknown as WindowWithFilePicker
      ).showSaveFilePicker({
        suggestedName: this.worldFileName,
        types: [
          {
            description: "JSON World Files",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

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

  // Save world with prompt (fallback)
  private async saveWorldWithPrompt(worldData: WorldData): Promise<boolean> {
    const jsonString = JSON.stringify(worldData, null, 2);

    const filename = prompt(
      "Enter filename for your world:",
      this.worldFileName
    );
    if (!filename) {
      return false;
    }

    const finalFilename = filename.endsWith(".json")
      ? filename
      : filename + ".json";

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return true;
  }

  // Validate world data structure
  private validateWorldData(worldData: any): worldData is WorldData {
    if (!worldData.version || !worldData.metadata || !worldData.maps) {
      console.error("Missing required world fields");
      return false;
    }

    if (!worldData.startingMap || !worldData.startingSpawn) {
      console.error("Missing starting map or spawn point");
      return false;
    }

    // Validate that starting map exists
    if (!worldData.maps[worldData.startingMap]) {
      console.error(`Starting map ${worldData.startingMap} does not exist`);
      return false;
    }

    // Validate each map
    for (const mapId in worldData.maps) {
      const map = worldData.maps[mapId];
      if (!this.validateMapData(map)) {
        console.error(`Invalid map data for map: ${mapId}`);
        return false;
      }
    }

    return true;
  }

  // Validate individual map data
  private validateMapData(mapData: any): mapData is WorldMapData {
    const requiredFields = [
      "id",
      "version",
      "metadata",
      "world",
      "spawnPoints",
      "exits",
      "enemies",
      "tiles",
    ];

    for (const field of requiredFields) {
      if (mapData[field] === undefined) {
        console.error(`Missing required map field: ${field}`);
        return false;
      }
    }

    // Validate spawn points
    if (!Array.isArray(mapData.spawnPoints)) {
      console.error("Spawn points must be an array");
      return false;
    }

    // Validate exits
    if (!Array.isArray(mapData.exits)) {
      console.error("Exits must be an array");
      return false;
    }

    return true;
  }

  // Get current map data
  public getCurrentMap(): WorldMapData | null {
    if (!this.worldData || !this.currentMapId) {
      return null;
    }
    return this.worldData.maps[this.currentMapId] || null;
  }

  // Get spawn point by ID from current map
  public getSpawnPoint(spawnId: string): SpawnPoint | null {
    if (!this.worldData) {
      return null;
    }

    const currentMap = this.getCurrentMap();
    if (!currentMap || !currentMap.spawnPoints) {
      return null;
    }

    return currentMap.spawnPoints.find((spawn) => spawn.id === spawnId) || null;
  }

  // Get map by ID
  public getMap(mapId: string): WorldMapData | null {
    if (!this.worldData) {
      return null;
    }
    return this.worldData.maps[mapId] || null;
  }

  // Switch to a different map
  public switchMap(mapId: string, spawnId: string | null): boolean {
    if (!this.worldData) {
      console.error("No world data loaded");
      return false;
    }

    const targetMap = this.worldData.maps[mapId];
    if (!targetMap) {
      console.error(`Map ${mapId} does not exist`);
      return false;
    }

    // No spawn point validation needed for edge-based system
    this.currentMapId = mapId;
    // Mark this map as visited
    this.visitedMaps.add(mapId);
    return true;
  }

  // Create a new empty map
  public createNewMap(name: string = "New Map"): WorldMapData {
    if (!this.worldData) {
      throw new Error("No world data loaded. Cannot create map.");
    }

    const newId = this.getNextMapId();
    const newMap: WorldMapData = {
      id: newId,
      version: "2.0",
      metadata: {
        name: name,
        description: "A new map",
        created: new Date().toISOString(),
        author: "Map Editor",
      },
      world: {
        width: 4100,
        height: 800,
        tileSize: 32,
      },
      exits: [],
      portal: null,
      enemies: [],
      platforms: [],
      collectibles: [],
      checkpoints: [],
      tiles: [],
    };

    this.worldData.maps[newId] = newMap;
    return newMap;
  }

  // Delete a map from the world
  public deleteMap(mapId: string): boolean {
    if (!this.worldData) {
      console.error("No world data loaded");
      return false;
    }

    // Don't allow deleting the starting map
    if (mapId === this.worldData.startingMap) {
      console.error("Cannot delete the starting map");
      return false;
    }

    // Don't allow deleting if it's the only map
    if (Object.keys(this.worldData.maps).length <= 1) {
      console.error("Cannot delete the only map in the world");
      return false;
    }

    delete this.worldData.maps[mapId];

    // If we deleted the current map, switch to starting map
    if (this.currentMapId === mapId) {
      this.currentMapId = this.worldData.startingMap;
    }

    return true;
  }

  // Generate next sequential map ID
  public getNextMapId(): string {
    if (!this.worldData) {
      return "map_1";
    }

    const mapIds = Object.keys(this.worldData.maps);
    const numbers = mapIds
      .filter((id) => id.startsWith("map_"))
      .map((id) => parseInt(id.replace("map_", ""), 10))
      .filter((n) => !isNaN(n));

    if (numbers.length === 0) {
      return "map_1";
    }

    const maxNumber = Math.max(...numbers);
    return `map_${maxNumber + 1}`;
  }

  // Get all map IDs
  public getAllMapIds(): string[] {
    if (!this.worldData) {
      return [];
    }
    return Object.keys(this.worldData.maps);
  }

  // Update current map data
  public updateCurrentMap(mapData: WorldMapData): boolean {
    if (!this.worldData || !this.currentMapId) {
      console.error("No world or current map loaded");
      return false;
    }

    this.worldData.maps[this.currentMapId] = mapData;
    return true;
  }

  // Create a new empty world
  public createEmptyWorld(name: string = "New World"): WorldData {
    const worldData: WorldData = {
      version: "2.0",
      metadata: {
        name: name,
        description: "A new world",
        author: "World Editor",
        created: new Date().toISOString(),
      },
      startingMap: "map_1",
      startingPosition: { x: 100, y: 688 },
      maps: {
        map_1: {
          id: "map_1",
          version: "2.0",
          metadata: {
            name: "First Map",
            description: "The starting map",
            created: new Date().toISOString(),
            author: "Map Editor",
          },
          world: {
            width: 4100,
            height: 800,
            tileSize: 32,
          },
          exits: [],
          portal: null,
          enemies: [],
          platforms: [],
          collectibles: [],
          checkpoints: [],
          tiles: [],
        },
      },
    };

    this.worldData = worldData;
    this.currentMapId = "map_1";
    return worldData;
  }
}
