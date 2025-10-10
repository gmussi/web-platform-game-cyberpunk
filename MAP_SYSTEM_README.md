# Map System Documentation

## Overview

The game now includes a comprehensive map system that allows you to save and load game levels with all their components including player starting position, portal location, enemy positions, and more.

## Features

### Map Data Structure

The map system uses a JSON format that includes:

- **Player starting position** - Where the player spawns
- **Portal location** - The end goal position
- **Enemy positions** - All enemies with their types and properties
- **Platforms** - Ground and floating platforms
- **Collectibles** - Health packs and powerups
- **Checkpoints** - Save points throughout the level
- **Hazards** - Spikes and lasers
- **Secrets** - Hidden areas with rewards
- **Objectives** - Level goals and completion criteria

### Map Management

#### In-Game Map Management

While playing the game, you can:

- **Save Map (S key)** - Save the current game state as a map file
- **Load Map (L key)** - Load a map from a JSON file
- **View Map Info** - See the current map name and details

#### Map Editor

Access the map editor from the character selection screen:

- **Click "Map Editor" button** or press **E key**
- **Visual editor** with real-time preview
- **Tool selection** - Choose what to place (Player, Portal, Enemies)
- **Click to place** objects at cursor position
- **Right-click to remove** objects
- **Camera controls** - Use arrow keys or WASD to move around
- **Save/Load** - Export and import map files

### Example Map

The system includes a comprehensive default map (`maps/default.json`) with:

- **15 enemies** of different types (stationary, moving, patrol)
- **Multiple platforms** for varied gameplay
- **10 health packs** strategically placed
- **7 checkpoints** for progression
- **4 powerups** with different effects
- **Hazards and secrets** for added challenge
- **Clear objectives** for completion

## Usage

### Creating Maps

1. **Start the Map Editor** from the character selection screen
2. **Select a tool** (Player, Portal, Enemy1, Enemy2)
3. **Click to place** objects on the map
4. **Use camera controls** to navigate around
5. **Save your map** when finished

### Loading Maps

1. **In-game**: Press L key and select a JSON file
2. **In editor**: Click "Load Map" and select a JSON file
3. **Automatic**: The game loads `maps/default.json` by default

### Map File Format

```json
{
  "version": "1.0",
  "metadata": {
    "name": "Map Name",
    "description": "Map description",
    "created": "2024-01-15T10:00:00.000Z",
    "author": "Your Name"
  },
  "player": {
    "startPosition": { "x": 100, "y": 688 },
    "character": "A"
  },
  "portal": {
    "position": { "x": 4000, "y": 660 },
    "size": { "width": 100, "height": 100 }
  },
  "enemies": [
    {
      "id": "enemy_1",
      "type": "stationary",
      "enemyType": "enemy1",
      "position": { "x": 400, "y": 688 },
      "properties": {
        "damage": 20,
        "health": 50
      }
    }
  ]
}
```

## Technical Details

### MapSystem Class

The `MapSystem` class handles:

- **Map validation** - Ensures map data is properly formatted
- **File I/O** - Loading and saving map files
- **Data conversion** - Converting between game state and map format
- **Error handling** - Graceful fallbacks for missing data

### Integration

The map system is integrated into:

- **GameScene** - Loads map data and creates game objects
- **MapEditorScene** - Visual editor for creating maps
- **CharacterSelectScene** - Access point for the map editor

### File Structure

```
maps/
├── default.json              # Default game map
js/
├── MapSystem.js             # Core map management system
├── MapEditorScene.js        # Visual map editor
├── GameScene.js             # Modified to use map data
└── CharacterSelectScene.js  # Added map editor access
```

## Controls

### In-Game Map Management

- **S** - Save current map
- **L** - Load map from file

### Map Editor

- **Mouse** - Click to place, right-click to remove
- **Arrow Keys / WASD** - Move camera
- **Tool buttons** - Select what to place
- **Save/Load buttons** - File operations

### Character Selection

- **E** - Open map editor

## Future Enhancements

Potential improvements to the map system:

- **Visual tileset editor** - Edit platform layouts visually
- **Enemy AI customization** - Set patrol patterns and behaviors
- **Collectible placement** - Add health packs and powerups
- **Hazard configuration** - Place spikes and lasers
- **Multiplayer support** - Shared map editing
- **Map sharing** - Upload/download community maps
- **Version control** - Track map changes over time

## Troubleshooting

### Common Issues

1. **Map won't load** - Check JSON format and file path
2. **Objects not appearing** - Verify coordinates are within world bounds
3. **Editor not responding** - Ensure all assets are loaded
4. **Save fails** - Check browser permissions for file downloads

### Debug Information

The console will show:

- Map loading progress
- Object creation details
- Error messages for invalid data
- Performance metrics

## Conclusion

The map system provides a powerful foundation for level creation and management. It's designed to be extensible and user-friendly, allowing both technical and non-technical users to create engaging game levels.
