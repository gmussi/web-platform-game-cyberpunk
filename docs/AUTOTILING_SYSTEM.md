# Autotiling System Documentation

## Overview

The autotiling system automatically selects the correct tile sprite based on its neighboring tiles, creating smooth terrain transitions using an 8-way blob-style approach. This system is integrated into the map editor and automatically updates tiles as you place or remove them.

## Features

- **Automatic tile replacement**: Tiles update instantly when placed or removed
- **8-way neighbor detection**: Considers all 8 surrounding tiles (N, NE, E, SE, S, SW, W, NW)
- **Smart diagonal handling**: Diagonals only matter when both adjacent cardinals are solid
- **Toggle on/off**: Can be disabled for manual tile control
- **Edge handling**: Out-of-bounds tiles are treated as solid for proper edge rendering

## How It Works

### Neighbor Detection

For each tile, the system checks all 8 neighbors:

```
NW  N  NE
 W  █  E
SW  S  SE
```

### Tile Matching Rules

Each tile in the autotile set specifies exact neighbor requirements:

- **Listed neighbors without `?`**: MUST be solid
- **Listed neighbors with `?`**: Don't care (can be solid or empty)
- **Not listed neighbors**: MUST be empty

Example: `1,1: S, E, SE, SW?, NE?`

- S must be solid
- E must be solid
- SE must be solid
- SW can be either (don't care)
- NE can be either (don't care)
- N, W, NW must be empty (not listed)

### Tile Mapping

The system uses tiles 0-29 from the tileset (first 4 rows, first 6 columns):

- **Index 27** (4,4): Isolated tile (no neighbors)
- **Index 9** (2,2): Fully surrounded (all 8 neighbors solid)
- **Index 24-26** (4,1-3): Horizontal connections
- **Index 0-2** (1,1-3): Top edge variations
- **Index 16-18** (3,1-3): Bottom edge variations

## Usage in Map Editor

### Keyboard Controls

- Press **A** to toggle autotiling on/off
- Press **T** to open tile selector
- Press **G** to toggle grid

### UI Controls

- **Autotile Button**: Green (ON) or Red (OFF) button in the right panel
- When ON: Tiles automatically adjust to neighbors
- When OFF: You can manually select specific tile sprites

### Placement Behavior

1. **With Autotiling ON**:

   - Place solid tiles - they automatically choose the correct sprite
   - Remove tiles - neighbors automatically update
   - No manual sprite selection needed

2. **With Autotiling OFF**:
   - Use tile selector (T key) to choose specific sprites
   - Tiles stay as selected, no automatic updates
   - Useful for decorative or special tiles

## Technical Implementation

### Files Created

- `src/systems/AutotileSystem.ts` - Core autotiling logic
- `src/data/autotileConfig.ts` - Tile mapping configuration

### Files Modified

- `src/systems/TilemapSystem.ts` - Integration with tile system
- `src/scenes/MapEditorScene.ts` - UI controls and toggle

### Key Classes

#### AutotileSystem

```typescript
// Calculate tile index based on neighbors
calculateTileIndex(x: number, y: number): number

// Get all tiles that need updating
getTilesToUpdate(x: number, y: number): {x, y}[]

// Enable/disable autotiling
setEnabled(enabled: boolean): void
```

#### TilemapSystem Integration

- `setTile()` triggers autotiling and updates neighbors
- `updateTileVisual()` uses autotile-calculated sprite indices
- `resizeMap()` updates autotile system dimensions

## Edge Cases

### Map Boundaries

Out-of-bounds positions are treated as **solid tiles**. This ensures proper edge rendering:

- Top edge tiles correctly show as terrain edges
- Side edge tiles blend naturally with the "solid" boundary
- Bottom edge tiles appear as ground edges

### Empty Tiles

Empty tiles (type 0) are not autotiled - they remain empty.

### Manual Override

When autotiling is disabled, manually selected sprite indices are preserved in the map data.

### Exact Matching

The autotiling system uses exact pattern matching:

- All 8 neighbors are checked against the tile rules
- Listed neighbors must match exactly (solid or empty as specified)
- Only `?` marked neighbors are flexible (don't care)
- If no exact match is found, falls back to tile 27 (isolated tile)

## Examples

### Example 1: Placing a Single Tile

```
Before:  . . .      After:   . . .
         . . .               . █ .
         . . .               . . .
```

Result: Tile uses index 27 (isolated tile)

### Example 2: Placing Adjacent Tiles

```
Before:  . █ .      After:   . █ .
         . . .               . █ .
         . . .               . . .
```

Result: Top tile updates to show connection below, new tile shows connection above

### Example 3: Creating a Platform

```
Before:  . . . .    After:   . . . .
         . . . .             █ █ █ █
         . . . .             . . . .
```

Result:

- Left tile: Shows right connection
- Middle tiles: Show left and right connections
- Right tile: Shows left connection
- All show no vertical connections (floating platform)

### Example 4: Map Edge

```
[Boundary]
. . . .
█ █ █ █  <- Top edge tiles
█ █ █ █
. . . .
```

Result: Top row tiles show connection above (to boundary) and below

## Performance

The autotiling system is optimized for real-time editing:

- Only affected tiles are updated (the changed tile + 8 neighbors)
- Calculations are done on-demand during rendering
- No performance impact when autotiling is disabled

## Future Enhancements

Possible improvements:

- Multiple autotile sets for different terrain types
- Custom autotile rules per tile type
- Preview mode showing autotile grid before placement
- Autotile groups that don't connect to each other
