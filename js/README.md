# JavaScript Game Code Structure

This document describes the organized structure of the JavaScript game code.

## Directory Structure

```
js/
├── main.js                    # Main game configuration and initialization
├── Player.js                  # Player character class
├── Enemy.js                   # Enemy character class
├── Platform.js                # Platform object class
├── scenes/                    # Game scenes
│   ├── LoadingScene.js        # Asset loading screen
│   ├── CharacterSelectScene.js # Character selection screen
│   ├── GameScene.js           # Main game play scene
│   ├── GameOverScene.js       # Game over screen
│   ├── VictoryScene.js        # Victory screen
│   └── MapEditorScene.js      # Map editor scene
├── systems/                   # Game systems
│   ├── TilemapSystem.js       # Tilemap management system
│   └── MapSystem.js           # Map data management system
├── generators/                 # Asset generators
│   ├── SpriteGenerator.js     # Unified sprite generation (heroes + robots)
│   └── CyberpunkBackgroundGenerator.js # Background generation
└── utils/                      # Utility classes
    └── UIUtils.js             # UI styling and utility functions
```

## File Organization Principles

### Scenes (`js/scenes/`)

- All Phaser scene classes
- Each scene handles a specific game state
- Scenes are loaded in order defined in `main.js`

### Systems (`js/systems/`)

- Core game systems that manage game state
- TilemapSystem: Handles tile-based map rendering and collision
- MapSystem: Manages map data loading and saving

### Generators (`js/generators/`)

- Classes that generate game assets programmatically
- SpriteGenerator: Creates hero and robot sprites
- CyberpunkBackgroundGenerator: Creates procedural backgrounds

### Utils (`js/utils/`)

- Utility classes and helper functions
- UIUtils: Centralized UI styling and helper methods

### Root Level (`js/`)

- Core game classes (Player, Enemy, Platform)
- Main game configuration and initialization

## Benefits of This Structure

1. **Clear Separation of Concerns**: Each directory has a specific purpose
2. **Easy Navigation**: Developers can quickly find relevant code
3. **Scalability**: Easy to add new scenes, systems, or utilities
4. **Maintainability**: Related code is grouped together
5. **Modularity**: Systems can be easily modified or replaced

## Usage Guidelines

- Add new scenes to `js/scenes/`
- Add new game systems to `js/systems/`
- Add new asset generators to `js/generators/`
- Add utility functions to `js/utils/`
- Keep core game classes at the root level
