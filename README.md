# 2D Side-Scrolling Platformer Game

A complete 2D platformer game built with Phaser.js featuring character selection, physics-based gameplay, enemies, and a scrolling world.

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
- **Physics**: Realistic gravity and collision detection
- **Camera**: Follows the player with smooth scrolling
- **Starting Positions**: Most characters start at the beginning, Plasma Paladin starts near the portal

### Game World

- **Platforms**: Multiple platforms at varying heights with neon-lit edges
- **Background**: Procedurally generated cyberpunk cityscape with:
  - Detailed building skyline with neon-lit windows
  - Atmospheric effects (floating particles, fog, rain)
  - Street lights and neon signs
  - Dark overlay for atmospheric depth
  - **Parallax scrolling** for enhanced depth perception
- **World Size**: Large 4100px wide world for exploration
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

### Audio Features

- **Background Music**: Continuous cyberpunk-themed music loop
- **Sound Effects**: Wilhelm scream sound effect on player damage
- **Audio Management**: Volume control and proper cleanup

## File Structure

```
├── index.html                    # Main HTML file
├── background_music.mp3          # Background music audio file
├── wilhelmscream.mp3            # Wilhelm scream sound effect
├── CHARACTER_SPRITE_BRIEFING.md # Character sprite specifications and requirements
├── img/
│   ├── char1/                   # Cyber Warrior character sprites
│   │   ├── metadata.json       # Character metadata and animation definitions
│   │   ├── rotations/          # 4-directional character sprites
│   │   └── animations/         # Character animation sequences
│   │       ├── breathing-idle/ # Idle breathing animation
│   │       ├── jumping-1/      # Jumping animation
│   │       └── walk/           # Walking animation
│   ├── char2/                   # Quantum Mage character sprites
│   │   ├── metadata.json       # Character metadata and animation definitions
│   │   ├── rotations/          # 4-directional character sprites
│   │   └── animations/         # Character animation sequences
│   ├── char3/                   # Stealth Rogue character sprites
│   │   ├── metadata.json       # Character metadata and animation definitions
│   │   ├── rotations/          # 4-directional character sprites
│   │   └── animations/         # Character animation sequences
│   ├── char4/                   # Plasma Paladin character sprites
│   │   ├── metadata.json       # Character metadata and animation definitions
│   │   ├── rotations/          # 4-directional character sprites
│   │   └── animations/         # Character animation sequences
│   └── portal/                  # Portal animation sprites
│       ├── portal_frame_01.png  # Portal animation frame 1
│       ├── portal_frame_02.png  # Portal animation frame 2
│       ├── portal_frame_03.png  # Portal animation frame 3
│       ├── portal_frame_04.png  # Portal animation frame 4
│       ├── portal_frame_05.png  # Portal animation frame 5
│       ├── portal_frame_06.png  # Portal animation frame 6
│       ├── portal_frame_07.png  # Portal animation frame 7
│       ├── portal_frame_08.png  # Portal animation frame 8
│       ├── portal_frame_09.png  # Portal animation frame 9
│       ├── portal_frame_10.png  # Portal animation frame 10
│       ├── portal_frame_11.png  # Portal animation frame 11
│       └── portal_frame_12.png  # Portal animation frame 12
├── js/
│   ├── main.js                  # Game configuration and data
│   ├── CharacterSelectScene.js  # Character selection screen
│   ├── GameScene.js             # Main gameplay scene
│   ├── GameOverScene.js         # Game over screen
│   ├── VictoryScene.js          # Victory screen
│   ├── Player.js                # Player class with movement and physics
│   ├── Enemy.js                 # Enemy class with different behaviors
│   ├── Platform.js              # Platform class for level generation
│   ├── HeroSpriteGenerator.js   # Procedural hero sprite generation (fallback)
│   ├── RobotSpriteGenerator.js  # Procedural robot enemy sprite generation
│   └── CyberpunkBackgroundGenerator.js # Procedural background generation
```

## How to Run

1. **Simple Setup**: Just open `index.html` in a web browser
   - Game runs in a larger 1200x800 window
2. **Local Server** (recommended for development):

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx http-server

   # Using PHP
   php -S localhost:8000
   ```

3. Navigate to `http://localhost:8000` in your browser

## Game Architecture

### Scene System

- **CharacterSelectScene**: Handles character selection with procedural sprite generation
- **GameScene**: Main gameplay with physics, collision, audio, and procedural content
- **GameOverScene**: End game state with restart option and character info
- **VictoryScene**: Victory celebration with particle effects and play again option

### Class Structure

- **Player**: Handles movement, jumping, health, collision, and visual effects
- **Enemy**: Different enemy types with AI behaviors and procedural sprites
- **Platform**: Platform generation with neon lighting and collision detection
- **HeroSpriteGenerator**: Creates unique character sprites procedurally
- **RobotSpriteGenerator**: Generates enemy robot sprites with different designs
- **CyberpunkBackgroundGenerator**: Creates detailed cityscape backgrounds

### Extensibility Features

- **Modular Design**: Easy to add new characters, enemies, or levels
- **Configuration**: Game data centralized in `main.js`
- **Event System**: Loose coupling between game components
- **Procedural Generation**: All sprites and backgrounds generated programmatically
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

1. Add character data to `characters` object in `main.js`
2. Create character sprite assets in `img/charX/` directory with:
   - `metadata.json` file defining animations and rotations
   - `rotations/` folder with 4-directional sprites (north, south, east, west)
   - `animations/` folder with animation sequences (walk, breathing-idle, jumping-1)
3. Update character selection UI in `CharacterSelectScene.js`
4. Add fallback sprite generation method in `HeroSpriteGenerator.js` if needed

### Adding New Enemy Types

1. Extend the `Enemy` class
2. Add new enemy sprite generation method in `RobotSpriteGenerator.js`
3. Add new enemy creation methods
4. Place enemies in `GameScene.createEnemies()`

### Adding New Levels

1. Modify platform generation in `GameScene.createPlatforms()`
2. Adjust world bounds in `setupWorldBounds()`
3. Add new enemy placements
4. Customize background elements in `CyberpunkBackgroundGenerator.js`

## Technical Details

- **Physics Engine**: Phaser Arcade Physics with gravity and collision detection
- **Rendering**: Canvas-based rendering with procedural sprite generation
- **Collision Detection**: Built-in Phaser collision system with damage cooldowns
- **Camera**: Smooth following with deadzone and world bounds
- **Parallax System**: Multi-layer scrolling with different speeds for depth effect
- **Window Size**: Larger 1200x800 display for better gameplay experience
- **Audio**: Web Audio API integration with background music and sound effects
- **Performance**: Optimized for 60fps gameplay with efficient sprite generation
- **Character Sprites**: High-quality pixel art character sprites with multiple animation states
- **Procedural Content**: Backgrounds and enemy sprites generated programmatically using Phaser Graphics
- **Sprite Sizes**: Characters and enemies use 64x64 pixel sprites for detailed visuals
- **Animated Sprites**: Portal uses clean 12-frame sprite animation, characters have walking/idle/jump animations
- **Memory Management**: Proper cleanup of generated textures and audio resources

## Browser Compatibility

- Modern browsers with Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (touch controls not implemented)

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
