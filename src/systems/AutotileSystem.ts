import { findMatchingTile } from "../data/autotileConfig";

export class AutotileSystem {
  private scene: Phaser.Scene;
  private getTileCallback: (x: number, y: number) => number;
  private mapWidth: number;
  private mapHeight: number;
  private enabled: boolean = true;

  constructor(
    scene: Phaser.Scene,
    getTileCallback: (x: number, y: number) => number,
    mapWidth: number,
    mapHeight: number
  ) {
    this.scene = scene;
    this.getTileCallback = getTileCallback;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  // Update map dimensions when the map is resized
  public updateDimensions(width: number, height: number): void {
    this.mapWidth = width;
    this.mapHeight = height;
  }

  // Enable or disable autotiling
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Check if autotiling is enabled
  public isEnabled(): boolean {
    return this.enabled;
  }

  // Check if a tile is solid
  private isSolid(x: number, y: number): boolean {
    // Out of bounds tiles are treated as SOLID
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return true;
    }

    const tileType = this.getTileCallback(x, y);
    return tileType !== 0; // 0 = empty, anything else = solid
  }

  // Calculate the correct tile index for a position based on its neighbors
  public calculateTileIndex(x: number, y: number): number {
    if (!this.enabled) {
      // When autotiling is disabled, return the current tile's sprite index
      // This preserves manually placed tiles
      const currentTile = this.getTileCallback(x, y);
      if (currentTile === 0) {
        return 0; // Empty tile
      }
      // For solid tiles, we need to get the stored sprite index
      // This will be handled by the TilemapSystem when it calls this method
      return 0; // Will be overridden by TilemapSystem with stored sprite index
    }

    // Check if the current tile is solid (only solid tiles get autotiled)
    const currentTile = this.getTileCallback(x, y);
    if (currentTile === 0) {
      return 0; // Empty tile, no autotiling needed
    }

    // Check all 8 neighbors
    const north = this.isSolid(x, y - 1);
    const south = this.isSolid(x, y + 1);
    const east = this.isSolid(x + 1, y);
    const west = this.isSolid(x - 1, y);
    const northeast = this.isSolid(x + 1, y - 1);
    const southeast = this.isSolid(x + 1, y + 1);
    const southwest = this.isSolid(x - 1, y + 1);
    const northwest = this.isSolid(x - 1, y - 1);

    // Find the matching tile from the configuration
    return findMatchingTile(
      north,
      south,
      east,
      west,
      northeast,
      southeast,
      southwest,
      northwest
    );
  }

  // Get all tiles that need to be updated when a tile changes
  // This includes the tile itself and all 8 neighbors
  public getTilesToUpdate(x: number, y: number): { x: number; y: number }[] {
    const tilesToUpdate: { x: number; y: number }[] = [];

    // Add the tile itself
    tilesToUpdate.push({ x, y });

    // Add all 8 neighbors (even out of bounds ones will be filtered later)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip the center tile (already added)

        const nx = x + dx;
        const ny = y + dy;

        // Only add tiles that are within bounds
        if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
          tilesToUpdate.push({ x: nx, y: ny });
        }
      }
    }

    return tilesToUpdate;
  }
}
