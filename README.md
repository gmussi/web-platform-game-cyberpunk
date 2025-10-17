# 2D Side-Scrolling Platformer Game

A complete 2D platformer game built with **Next.js**, **Phaser.js**, and **TypeScript** featuring character selection, physics-based gameplay, enemies, and a scrolling world.

## 🎮 Live Demo

**Play the game online:** [https://web-platform-game-cyberpunk.vercel.app/](https://web-platform-game-cyberpunk.vercel.app/)

## Features

### Character Selection Screen

- Four unique characters with detailed pixel art sprites (64x64):
  - **Cyber Warrior** (Red) - Armored fighter with energy sword
  - **Quantum Mage** (Purple) - Mystical caster with quantum staff
  - **Stealth Rogue** (Blue) - Agile assassin with stealth field
  - **Plasma Paladin** (Gold) - Holy warrior with energy shield (starts near portal)
- Interactive character selection with hover effects
- **Animated Character Sprites**: Each character includes multiple animation states:
  - **Rotations**: 4-directional sprites (north, south, east, west)
  - **Walking Animations**: 6-frame walking cycles for east/west directions
  - **Breathing-Idle**: 4-frame idle breathing animation
  - **Jumping**: 9-frame jumping animation sequences
- High-quality pixel art sprites with cyberpunk aesthetic

### Core Gameplay

- **Controls**:
  - Arrow keys: Move left/right
  - Spacebar: Jump
  - Down + Spacebar: Drop through platforms (one-way)
- **Physics**: Realistic gravity and collision detection
- **Camera**: Follows the player with smooth scrolling
- **Starting Positions**: Most characters start at the beginning, Plasma Paladin starts near the portal

### Game World

- **Platforms**: Multiple platforms at varying heights with neon-lit edges
- **Background**: Disabled (no background images rendered)
- **World Size**: Large 4100px wide × 800px tall world for exploration
- **Maximized Playable Area**: Ground positioned at bottom of screen for maximum vertical space
- **Animated Portal**: Victory condition - reach the animated portal at the end of the level with smooth 12-frame sprite animation

### Enemies

- **Stationary Enemies**: Block paths and damage on contact
- **Moving Enemies**: Patrol left/right automatically
- **Patrol Enemies**: Move within specific ranges
- **Collision System**: 1-second cooldown between damage hits
- **Robot Sprites**: Procedurally generated futuristic robot enemies (64x64) with:
  - Glowing eyes and antenna lights
  - Circuit patterns and exhaust vents
  - Different designs for stationary vs moving types

### UI Elements

- **Character Display**: Shows selected character name
- **Health Bar**: Visual health indicator with color changes
- **Game Over Screen**: Restart functionality with character info
- **Victory Screen**: Celebration screen with floating particles and play again option
- **World Picker**: After selecting a character, choose which world JSON to load

### Audio Features

- **Background Music**: Continuous cyberpunk-themed music loop
- **Sound Effects**: Wilhelm scream sound effect on player damage
- **Audio Management**: Volume control and proper cleanup

### Map System & Editor

- **Map Editor**: Full-featured level editor accessible from the game
- **Tile-Based System**: 32x32 pixel tile system with collision detection
- **Custom Maps**: Save and load custom map files in JSON format
- **Real-Time Editing**: Place tiles, enemies, player spawn, and portal positions
- **Visual Tools**: Grid overlay, sprite picker, and coordinate display
- **Map Validation**: Automatic validation of map data structure and integrity
- **File System Integration**: Uses modern File System Access API with fallback
- **Map Management**: Built-in save/load functionality with keyboard shortcuts (S/L keys)
  - Platform tool: place platform tiles that are one-way in gameplay
  - Autotile behavior: platforms are treated as non-solid for solid-tile autotiling
  - With autotile ON, platform placement randomly picks tile index 49–52

## Recent Improvements

### File Structure Reorganization (Phase 1 & 2) ✅ COMPLETED

The project has been recently reorganized for better maintainability and developer experience:

- **Centralized Type System**: All TypeScript types consolidated in `src/types/` directory
- **Organized Assets**: Game assets restructured under `public/assets/` with logical subdirectories
- **Modular Architecture**: Source code reorganized into `core/`, `entities/`, `data/` directories
- **Enhanced Configuration**: Centralized game configuration and data management
- **Eliminated Duplication**: Removed duplicate files and consolidated imports

### Deployment Fixes (Latest) ✅ COMPLETED

Recent fixes to ensure proper deployment on Vercel:

- **Asset Path Correction**: Fixed all asset paths to use `/assets/` prefix for proper Vercel serving
- **Missing Assets Included**: Added audio files and map data that were previously ignored by git
- **Vercel Configuration**: Removed unnecessary `vercel.json` to allow automatic Next.js detection
- **Git Configuration**: Updated `.gitignore` to include all game assets while excluding test artifacts
- **Error Handling**: Added robust Phaser error handling for deployed environment

### Key Benefits

- ✅ Better maintainability with centralized types and configuration
- ✅ Improved developer experience with logical file organization
- ✅ Enhanced scalability with modular architecture
- ✅ Performance optimizations through reduced duplication
- ✅ **Deployment Ready**: All assets properly configured and included
- ✅ **Production Stable**: Game works correctly on Vercel deployment

## File Structure

```
├── src/                        # Source code directory
│   ├── pages/                  # Next.js pages directory
│   │   ├── index.tsx           # Main game page (hosts Phaser game)
│   │   ├── _app.tsx            # Next.js app wrapper with global styles
│   │   └── api/                # Next.js API routes
│   │       ├── health.ts       # Health check endpoint
│   │       └── game-info.ts    # Game information endpoint
│   ├── components/             # React components
│   │   └── GameComponent.tsx   # Phaser game wrapper component
│   ├── styles/                 # Global CSS styles
│   │   └── globals.css         # Global CSS reset and game styling
├── public/                      # Static assets (served by Next.js)
│   └── assets/                  # Organized game assets
│       ├── images/              # Game images and sprites
│       │   ├── characters/       # Character sprites (char1-4)
│       │   │   ├── char1/        # Cyber Warrior character sprites
│       │   │   │   ├── metadata.json # Character metadata and animation definitions
│       │   │   │   ├── rotations/    # 4-directional character sprites
│       │   │   │   └── animations/   # Character animation sequences
│       │   │   │       ├── breathing-idle/ # Idle breathing animation
│       │   │   │       ├── jumping-1/      # Jumping animation
│       │   │   │       └── walk/          # Walking animation
│       │   │   ├── char2/        # Quantum Mage character sprites
│       │   │   ├── char3/        # Stealth Rogue character sprites
│       │   │   └── char4/        # Plasma Paladin character sprites
│       │   ├── enemies/          # Enemy sprites
│       │   │   ├── enemy1/       # Enemy type 1 sprites
│       │   │   └── enemy2/       # Enemy type 2 sprites
│       │   ├── backgrounds/      # Background images
│       │   │   ├── background1.png # Custom cyberpunk background image 1
│       │   │   ├── background2.png # Custom cyberpunk background image 2
│       │   │   └── background3.png # Custom cyberpunk background image 3
│       │   ├── ui/               # UI elements
│       │   │   ├── homebg.png    # Home screen background image
│       │   │   ├── logo.png      # Game logo
│       │   │   └── portal/       # Portal animation sprites
│       │   └── tiles/            # Tile sprites
│       │       └── Tileset.png  # Tile sprites for map editor
│       ├── audio/                # Audio files
│       │   ├── music/            # Background music
│       │   │   └── background_music.mp3 # Background music audio file
│       │   └── sfx/              # Sound effects
│       │       └── wilhelmscream.mp3    # Wilhelm scream sound effect
│       └── maps/                 # Map data files
│           ├── default.json       # Default game map with platforms, enemies, and portal
│           └── default2.json      # Additional map file
├── src/                         # TypeScript source files (Phaser game code)
│   ├── components/              # React components
│   │   └── GameComponent.tsx    # Phaser game wrapper component
│   ├── core/                    # Core game systems
│   │   └── Game.ts              # Main game configuration and initialization
│   ├── entities/                # Game entities
│   │   ├── Player.ts            # Player class with movement and physics
│   │   ├── Enemy.ts             # Enemy class with different behaviors
│   │   └── Platform.ts          # Platform class for level generation
│   ├── scenes/                  # Game scene classes
│   │   ├── LoadingScene.ts      # Asset loading screen
│   │   ├── CharacterSelectScene.ts # Character selection screen
│   │   ├── GameScene.ts         # Main gameplay scene
│   │   ├── GameOverScene.ts    # Game over screen
│   │   ├── VictoryScene.ts     # Victory screen
│   │   └── MapEditorScene.ts   # Map editor for creating custom levels
│   ├── systems/                 # Game system classes
│   │   ├── MapSystem.ts        # Map loading, saving, and validation system
│   │   └── TilemapSystem.ts    # Tile-based level system with collision detection
│   ├── utils/                   # Utility classes
│   │   └── UIUtils.ts          # UI utility functions
│   ├── generators/              # Procedural generation classes
│   │   ├── SpriteGenerator.ts  # Procedural sprite generation
│   │   └── CyberpunkBackgroundGenerator.ts # Procedural background generation
│   ├── data/                    # Game data and configuration
│   │   ├── characters.ts        # Character definitions and game data
│   │   ├── config.ts           # Game configuration constants
│   │   ├── enemies.ts          # Enemy definitions and configurations
│   │   └── levels.ts           # Level definitions and map data
│   ├── types/                   # TypeScript type definitions
│   │   ├── index.ts            # Central type exports
│   │   ├── game.ts             # Game-specific types
│   │   ├── character.ts        # Character-related types
│   │   ├── enemy.ts            # Enemy-related types
│   │   ├── map.ts              # Map system types
│   │   └── phaser.ts           # Enhanced Phaser.js type declarations
│   └── server.ts               # Express server for development
├── docs/                        # Documentation files
│   ├── CHARACTER_SPRITE_BRIEFING.md # Character sprite specifications and requirements
│   ├── MAP_SYSTEM_README.md    # Map system documentation and usage guide
│   └── TESTING.md              # Comprehensive testing documentation
├── tests/                       # Playwright test directory
│   └── game-loading.spec.ts    # Game loading tests
├── package.json                 # Node.js dependencies and npm scripts
├── package-lock.json            # Locked dependency versions
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
├── next-env.d.ts               # Next.js TypeScript environment types
├── playwright.config.js         # Playwright test configuration
└── .gitignore                  # Git ignore file (includes Next.js build output)
```

## How to Run

### Prerequisites

- Node.js (for development and building)
- Modern web browser with ES6 support

### Development Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start Development Server**:

   ```bash
   # Start Next.js development server with hot reload
   npm run dev
   ```

3. Navigate to `http://localhost:3000` in your browser

### Production Deployment

1. **Build for Production**:

   ```bash
   npm run build
   ```

2. **Start Production Server**:

   ```bash
   npm start
   ```

3. **Deploy**: Next.js handles all static file serving and routing
4. **Environment**: Set `PORT` environment variable to change the server port (default: 3000)

### Available Scripts

- `npm run dev` - Start Next.js development server with hot reload
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm test` - Run Playwright tests
- `npm run test:ui` - Run tests with UI
- `npm run test:headed` - Run tests in headed mode
- `npm run test:debug` - Run tests in debug mode

## Testing

This project includes Playwright testing framework setup. The test files have been removed to implement a new testing methodology. For detailed testing information, see [docs/TESTING.md](docs/TESTING.md).

### Quick Test Commands

```bash
# Run all tests (when test files are added)
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug
```

The test framework is ready for:

- Game loading and initialization testing
- Player controls and movement testing
- Map editor functionality testing
- Cross-browser compatibility (Chromium, Firefox, WebKit)
- Mobile device testing

## Game Architecture

### Scene System

- **CharacterSelectScene**: Handles character selection with procedural sprite generation
- **GameScene**: Main gameplay with physics, collision, audio, and procedural content
- **MapEditorScene**: Full-featured map editor with tile placement and object management
- **GameOverScene**: End game state with restart option and character info
- **VictoryScene**: Victory celebration with particle effects and play again option

### Class Structure

- **Player**: Handles movement, jumping, health, collision, and visual effects
- **Enemy**: Different enemy types with AI behaviors and procedural sprites
- **Platform**: Platform generation with neon lighting and collision detection
- **MapSystem**: Map loading, saving, validation, and file management
- **TilemapSystem**: Tile-based level system with collision detection and rendering
- **HeroSpriteGenerator**: Creates unique character sprites procedurally
- **RobotSpriteGenerator**: Generates enemy robot sprites with different designs
- **CyberpunkBackgroundGenerator**: Procedural background generation system

### Extensibility Features

- **Modular Design**: Easy to add new characters, enemies, or levels
- **Configuration**: Game data centralized in `src/main.ts`
- **Event System**: Loose coupling between game components
- **Procedural Generation**: Enemy sprites generated programmatically, custom background images
- **Audio System**: Integrated sound management with volume control
- **Visual Effects**: Particle systems, glow effects, and atmospheric elements

## Character Sprite System

The game features a comprehensive character sprite system with high-quality pixel art assets:

### Sprite Structure

Each character (`char1` through `char4`) includes:

- **`metadata.json`**: Defines character properties, animation sequences, and file paths
- **`rotations/`**: Static sprites for 4 directions (north, south, east, west)
- **`animations/`**: Dynamic animation sequences:
  - **`walk/`**: 6-frame walking cycles for east/west directions
  - **`breathing-idle/`**: 4-frame idle breathing animation (south direction)
  - **`jumping-1/`**: 9-frame jumping animation for east/west directions

### Animation Specifications

- **Sprite Size**: 64x64 pixels for detailed character representation
- **Format**: PNG with transparent backgrounds
- **Style**: Clean pixel art with cyberpunk aesthetic
- **Frame Rates**: Optimized for smooth 60fps gameplay
- **Color Themes**: Each character has distinct color schemes matching their cyberpunk theme

### Integration Status

- ✅ **Character Sprites**: Complete pixel art assets for all 4 characters
- ✅ **Animation Sequences**: All walking, idle, and jumping animations ready
- ✅ **Metadata System**: Comprehensive animation definitions in JSON format
- 🔄 **Animation Integration**: Sprites are loaded but animation system needs implementation
- ✅ **Fallback System**: Procedural sprite generation available as backup

## Customization

### Adding New Characters

1. Add character data to `characters` object in `src/main.ts`
2. Create character sprite assets in `img/charX/` directory with:
   - `metadata.json` file defining animations and rotations
   - `rotations/` folder with 4-directional sprites (north, south, east, west)
   - `animations/` folder with animation sequences (walk, breathing-idle, jumping-1)
3. Update character selection UI in `src/scenes/CharacterSelectScene.ts`
4. Add fallback sprite generation method in `src/generators/SpriteGenerator.ts` if needed

### Adding New Enemy Types

1. Extend the `Enemy` class in `src/Enemy.ts`
2. Add new enemy sprite generation method in `src/generators/SpriteGenerator.ts`
3. Add new enemy creation methods
4. Place enemies in `src/scenes/GameScene.ts` `createEnemies()` method

### Using the Map Editor

1. **Access**: Press 'M' key in-game or click "Map Editor" button
2. **UI Layout**: Clean interface with editing area (80% left) and control panel (20% right)
3. **Tools**: Select from Player, Portal, Enemy1, Enemy2, Solid tiles, or Erase
4. **Tile Placement**: Click to place tiles, right-click to remove
5. **Sprite Selection**: Press 'T' to open sprite picker for solid tiles
6. **Navigation**: Use arrow keys or WASD to move around the map
7. **Saving**: Click "Save Map" to download your custom map
8. **Loading**: Click "Load Map" to load a custom map file
9. **Grid**: Press 'G' or click "Grid" button to toggle grid overlay
10. **Map Resizing**: Use +/- Row/Col buttons to adjust map dimensions

### Adding New Levels

1. **Using Map Editor**: Create custom levels with the built-in editor
2. **Manual Creation**: Modify platform generation in `src/scenes/GameScene.ts` `createPlatforms()` method
3. **Map Files**: Create JSON map files following the format in `maps/default.json`
4. **Validation**: Use `MapSystem.validateMapData()` to ensure proper structure
5. **Background**: Add custom background images to `img/` directory

## Technical Details

### Next.js Architecture

The project now uses **Next.js** as the web framework, providing:

- **Server-Side Rendering**: Enhanced performance and SEO
- **Static File Serving**: Automatic serving of assets from `public/` directory
- **API Routes**: Built-in API endpoints (`/api/health`, `/api/game-info`)
- **Hot Reload**: Fast development with automatic page refresh
- **TypeScript Integration**: Full TypeScript support with type checking
- **Production Optimization**: Automatic code splitting and optimization
- **React Integration**: Seamless integration with React components for UI

### Phaser.js Integration

The game engine is integrated into Next.js through:

- **GameComponent**: React wrapper component that initializes Phaser
- **Dynamic Imports**: Phaser is loaded dynamically to avoid SSR issues
- **Asset Management**: All game assets served from `public/` directory
- **Canvas Rendering**: Full-screen canvas with responsive scaling

### TypeScript Architecture

- **Language**: TypeScript with Next.js integration for better maintainability
- **Build System**: Next.js handles TypeScript compilation automatically
- **Type Safety**: Custom Phaser.js type declarations for enhanced IDE support
- **Module System**: ES6 modules with Next.js module resolution
- **Source Maps**: Enabled for debugging TypeScript source code
- **Build Output**: Next.js handles compilation and optimization automatically

### Game Engine & Physics

- **Physics Engine**: Phaser Arcade Physics with gravity and collision detection
- **Rendering**: Canvas-based rendering with procedural sprite generation
- **Collision Detection**: Built-in Phaser collision system with damage cooldowns
- **Camera**: Smooth following with deadzone and world bounds
- **Parallax System**: Multi-layer scrolling with different speeds for depth effect
- **Window Size**: Larger 1200x800 display with maximized 800px tall playable area

### Audio & Performance

- **Audio**: Web Audio API integration with background music and sound effects
- **Performance**: Optimized for 60fps gameplay with efficient sprite generation
- **Memory Management**: Proper cleanup of generated textures and audio resources

### Graphics & Assets

- **Character Sprites**: High-quality pixel art character sprites with multiple animation states
- **Background System**: Disabled (no background images rendered)
- **Sprite Sizes**: Characters and enemies use 64x64 pixel sprites for detailed visuals
- **Animated Sprites**: Portal uses clean 12-frame sprite animation, characters have walking/idle/jump animations

### Map System & File Management

- **Map System**: JSON-based map format with validation and file system integration
- **Tile System**: 32x32 pixel tile-based level system with collision detection
- **File System**: Modern File System Access API with fallback for map saving/loading

### Development & Testing

- **Testing**: Playwright test framework ready for comprehensive testing
- **Build Scripts**: Next.js scripts for development, building, and testing
- **Git Integration**: Proper `.gitignore` for Next.js build artifacts
- **Hot Reload**: Fast development with automatic page refresh
- **Type Checking**: Built-in TypeScript type checking

## Browser Compatibility

- Modern browsers with Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (touch controls not implemented)

## Deployment

This game is deployed on **Vercel** for optimal Next.js performance:

- **Live URL**: [https://web-platform-game-cyberpunk.vercel.app/](https://web-platform-game-cyberpunk.vercel.app/)
- **Platform**: Vercel (Next.js optimized)
- **Features**: Full Next.js support, API routes, automatic deployments
- **Performance**: CDN, edge functions, automatic optimizations
- **Status**: ✅ **Fully Working** - All assets load correctly, game runs smoothly

### Deployment Commands

```bash
# Manual deployment
npm run deploy

# Or using Vercel CLI directly
vercel --prod
```

### Deployment Notes

- **Asset Serving**: All game assets (images, audio, maps) are properly served from `/assets/` paths
- **Automatic Detection**: Vercel automatically detects Next.js projects without manual configuration
- **Git Integration**: All assets are committed to git and deployed automatically
- **Error Handling**: Robust error handling ensures stable gameplay in production

## Future Enhancements

- Character sprite animation integration (sprites are ready, need to implement animation system)
- Additional sound effects for different actions
- Power-ups and collectibles
- Multiple levels with different themes
- Touch controls for mobile devices
- Save/load system for progress tracking
- Score system and leaderboards
- Multiplayer support
- More complex enemy AI behaviors
- Weather effects and dynamic backgrounds
- Character-specific abilities and special moves
- Advanced map editor features (layers, scripting, triggers)
- Map sharing and community features
- Performance optimizations for larger maps
- Advanced tile types (water, lava, moving platforms)
- Map templates and presets
