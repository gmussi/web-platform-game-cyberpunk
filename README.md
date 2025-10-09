# 2D Side-Scrolling Platformer Game

A complete 2D platformer game built with Phaser.js featuring character selection, physics-based gameplay, enemies, and a scrolling world.

## Features

### Character Selection Screen

- Four unique characters (Warrior, Mage, Rogue, Paladin) with different colors
- Each character has a different scroll direction:
  - **Warrior & Mage**: Game scrolls to the right
  - **Rogue & Paladin**: Game scrolls to the left
- Interactive character selection with hover effects

### Core Gameplay

- **Controls**:
  - Arrow keys: Move left/right
  - Spacebar: Jump
- **Physics**: Realistic gravity and collision detection
- **Camera**: Follows the player with smooth scrolling

### Game World

- **Platforms**: Multiple platforms at varying heights
- **Background**: Layered sky and ground with clouds for depth
- **World Size**: Large 2000px wide world for exploration

### Enemies

- **Stationary Enemies**: Block paths and damage on contact
- **Moving Enemies**: Patrol left/right automatically
- **Patrol Enemies**: Move within specific ranges
- **Collision System**: 1-second cooldown between damage hits

### UI Elements

- **Character Display**: Shows selected character name
- **Health Bar**: Visual health indicator with color changes
- **Game Over Screen**: Restart functionality

## File Structure

```
├── index.html              # Main HTML file
├── js/
│   ├── main.js            # Game configuration and data
│   ├── CharacterSelectScene.js  # Character selection screen
│   ├── GameScene.js       # Main gameplay scene
│   ├── GameOverScene.js   # Game over screen
│   ├── Player.js          # Player class with movement and physics
│   ├── Enemy.js           # Enemy class with different behaviors
│   └── Platform.js        # Platform class for level generation
```

## How to Run

1. **Simple Setup**: Just open `index.html` in a web browser
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

- **CharacterSelectScene**: Handles character selection
- **GameScene**: Main gameplay with physics and collision
- **GameOverScene**: End game state with restart option

### Class Structure

- **Player**: Handles movement, jumping, health, and collision
- **Enemy**: Different enemy types with AI behaviors
- **Platform**: Platform generation and collision detection

### Extensibility Features

- **Modular Design**: Easy to add new characters, enemies, or levels
- **Configuration**: Game data centralized in `main.js`
- **Event System**: Loose coupling between game components
- **Asset Ready**: Designed to easily replace placeholder graphics

## Customization

### Adding New Characters

1. Add character data to `characters` object in `main.js`
2. Update character selection UI in `CharacterSelectScene.js`

### Adding New Enemy Types

1. Extend the `Enemy` class
2. Add new enemy creation methods
3. Place enemies in `GameScene.createEnemies()`

### Adding New Levels

1. Modify platform generation in `GameScene.createPlatforms()`
2. Adjust world bounds in `setupWorldBounds()`
3. Add new enemy placements

## Technical Details

- **Physics Engine**: Phaser Arcade Physics
- **Rendering**: Canvas-based rendering
- **Collision Detection**: Built-in Phaser collision system
- **Camera**: Smooth following with deadzone
- **Performance**: Optimized for 60fps gameplay

## Browser Compatibility

- Modern browsers with Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (touch controls not implemented)

## Future Enhancements

- Sprite animations
- Sound effects and music
- Power-ups and collectibles
- Multiple levels
- Touch controls for mobile
- Save/load system
- Score system
