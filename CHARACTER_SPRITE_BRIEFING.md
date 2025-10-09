# Character Sprite Generation Briefing for ChatGPT

## Project Overview

You are creating pixel art character sprites for a 2D side-scrolling cyberpunk platformer game built with Phaser.js. The game features 4 unique characters with distinct themes and abilities.

## Technical Specifications

### Sprite Requirements

- **Size**: 64x64 pixels (exactly)
- **Format**: PNG with transparent background
- **Style**: Pixel art with clean, sharp edges
- **Color Palette**: Cyberpunk/futuristic theme with neon accents
- **Animation Sequences**: Multiple sprites per character for smooth animations
- **Transparency**: Use transparent background, not solid color
- **Total Sprites Needed**: 24+ sprites (4 characters × 6+ animation states)

### Character Specifications

## 1. Cyber Warrior (Character A)

- **Theme**: Armored fighter with energy weapons
- **Primary Color**: Red (#ff4444)
- **Description**: Futuristic soldier in red armor with energy sword

### Animation States:

- **Idle Base**: Standing upright, sword held at side, energy core pulsing
- **Idle Look Up**: Head tilted up, scanning surroundings, sword still at side
- **Idle Weapon Spin**: Sword spinning/flourishing, showing off combat skills
- **Walking Frame 1**: Left leg forward, right arm swinging back
- **Walking Frame 2**: Right leg forward, left arm swinging back
- **Walking Frame 3**: Mid-stride, both legs centered
- **Jump Up**: Legs bent/knees up, arms raised for balance, sword pointing forward
- **Jump Down**: Legs extended down, arms spread for landing, sword ready

### Key Elements:

- Red armored body (main torso)
- Skin tone head (#ffdbac)
- Dark helmet visor (#222222)
- Darker red shoulder pads (#cc2222)
- Dark red legs (#aa1111)
- Bright blue energy core on chest (#00aaff)
- Green energy sword extending from right side (#00ff00)
- White sword tip/hilt (#ffffff)

## 2. Quantum Mage (Character B)

- **Theme**: Mystical caster with quantum powers
- **Primary Color**: Purple (#8844ff)
- **Description**: Hooded mage with glowing eyes and quantum staff

### Animation States:

- **Idle Base**: Standing with staff planted, hood flowing, particles orbiting slowly
- **Idle Look Up**: Head tilted up, staff raised slightly, particles swirling upward
- **Idle Staff Spin**: Staff spinning with magical energy, particles following the motion
- **Walking Frame 1**: Left leg forward, staff used as walking stick
- **Walking Frame 2**: Right leg forward, staff planted ahead
- **Walking Frame 3**: Mid-stride, staff centered, robes flowing
- **Jump Up**: Staff raised high, robes billowing upward, particles swirling around
- **Jump Down**: Staff pointing down for landing, robes flowing down, particles trailing

### Key Elements:

- Purple robes/body (#8844ff)
- Skin tone head (#ffdbac)
- Darker purple hood (#6622cc)
- Glowing yellow eyes (#ffff00)
- Purple sleeves/arms (#aa66ff)
- Dark purple legs (#4422aa)
- Gray quantum staff on left side (#cccccc)
- Magenta staff orb (#ff00ff)
- Cyan orbiting particles around character (#00ffff)

## 3. Stealth Rogue (Character C)

- **Theme**: Agile assassin with stealth technology
- **Primary Color**: Blue (#2244aa)
- **Description**: Masked rogue in dark blue stealth suit

### Animation States:

- **Idle Base**: Crouched slightly, daggers ready, stealth field active
- **Idle Look Up**: Head tilted up, scanning for targets, daggers still ready
- **Idle Dagger Spin**: Daggers spinning/flourishing, showing off agility
- **Walking Frame 1**: Left leg forward, agile stride, daggers drawn
- **Walking Frame 2**: Right leg forward, stealthy movement
- **Walking Frame 3**: Mid-stride, balanced and ready
- **Jump Up**: Arms spread wide, daggers extended, stealth field trailing upward
- **Jump Down**: Daggers pointing down for landing, stealth field trailing down

### Key Elements:

- Dark blue stealth suit body (#2244aa)
- Skin tone head (#ffdbac)
- Dark mask covering face (#112233)
- Red glowing eyes (#ff0000)
- Silver shoulder guards (#cccccc)
- Dark blue legs (#112288)
- Silver daggers on both sides (#aaaaaa)
- Green stealth field effects (#00ff00)

## 4. Plasma Paladin (Character D)

- **Theme**: Holy warrior with energy shield and plasma sword
- **Primary Color**: Gold (#ffaa00)
- **Description**: Golden armored paladin with energy weapons

### Animation States:

- **Idle Base**: Standing proud, shield raised, sword at ready, aura glowing
- **Idle Look Up**: Head tilted up, shield still raised, sword ready
- **Idle Weapon Flourish**: Sword and shield spinning/flourishing, aura flaring
- **Walking Frame 1**: Left leg forward, marching stride, shield forward
- **Walking Frame 2**: Right leg forward, sword swinging, shield ready
- **Walking Frame 3**: Mid-stride, both weapons ready, aura pulsing
- **Jump Up**: Shield and sword raised high, aura flaring, golden armor gleaming
- **Jump Down**: Shield and sword pointing down for landing, aura trailing

### Key Elements:

- Golden armor body (#ffaa00)
- Skin tone head (#ffdbac)
- Golden helmet (#ffcc44)
- Blue visor (#0066ff)
- Golden shoulder plates (#ffdd66)
- Golden legs (#cc8800)
- Cyan energy shield on left side (#00ffff)
- White shield center (#ffffff)
- Magenta plasma sword on right side (#ff00ff)
- Yellow energy aura particles (#ffff00)

## Design Guidelines

### Pixel Art Style

- Use clean, sharp pixel edges
- Avoid anti-aliasing or smooth gradients
- Each pixel should be clearly defined
- Use limited color palette for each character
- Maintain consistent lighting (top-down)

### Composition

- Character should be centered in the 32x32 canvas
- Weapons and accessories should extend slightly beyond the main body
- Ensure character is recognizable at small size
- Maintain good contrast between elements

### Color Usage

- Use the specified hex colors as primary references
- Add subtle variations for depth (darker/lighter shades)
- Neon colors should be bright and vibrant
- Darker colors for shadows and depth

### Animation Guidelines

#### Idle Animations (3 frames per character)

- **Idle Base**: Character's default standing pose, ready for action
- **Idle Look Up**: Head tilted upward, scanning surroundings or looking for threats
- **Idle Weapon Spin**: Character showing off their weapon/skills with spinning/flourishing motions

#### Walking Animation (3 frames per character)

- **Walking Frame 1**: Left leg forward, opposite arm swinging back
- **Walking Frame 2**: Right leg forward, opposite arm swinging back
- **Walking Frame 3**: Mid-stride position, balanced and centered
- Create smooth transition between frames for fluid movement

#### Jump Animations (2 frames per character)

- **Jump Up**: Character ascending, legs bent/knees up, arms raised for balance
- **Jump Down**: Character descending, legs extended down, arms spread for landing
- Show clear difference between ascending and descending states

### Animation Consistency

- Maintain same character silhouette across all states
- Keep proportions consistent (64x64 canvas)
- Ensure weapons and accessories remain recognizable
- Color schemes should be identical across all states
- Each character should have unique movement style reflecting their personality

### Technical Considerations

- Ensure sprites work well against dark backgrounds
- Maintain readability at game resolution
- Avoid too many small details that won't be visible
- Keep design simple but distinctive

## File Naming Convention

- `cyber_warrior_idle_base.png`, `cyber_warrior_idle_lookup.png`, `cyber_warrior_idle_spin.png` (Idle animations)
- `cyber_warrior_walk1.png`, `cyber_warrior_walk2.png`, `cyber_warrior_walk3.png` (Walking frames)
- `cyber_warrior_jump_up.png`, `cyber_warrior_jump_down.png` (Jump states)

- `quantum_mage_idle_base.png`, `quantum_mage_idle_lookup.png`, `quantum_mage_idle_spin.png` (Idle animations)
- `quantum_mage_walk1.png`, `quantum_mage_walk2.png`, `quantum_mage_walk3.png` (Walking frames)
- `quantum_mage_jump_up.png`, `quantum_mage_jump_down.png` (Jump states)

- `stealth_rogue_idle_base.png`, `stealth_rogue_idle_lookup.png`, `stealth_rogue_idle_spin.png` (Idle animations)
- `stealth_rogue_walk1.png`, `stealth_rogue_walk2.png`, `stealth_rogue_walk3.png` (Walking frames)
- `stealth_rogue_jump_up.png`, `stealth_rogue_jump_down.png` (Jump states)

- `plasma_paladin_idle_base.png`, `plasma_paladin_idle_lookup.png`, `plasma_paladin_idle_spin.png` (Idle animations)
- `plasma_paladin_walk1.png`, `plasma_paladin_walk2.png`, `plasma_paladin_walk3.png` (Walking frames)
- `plasma_paladin_jump_up.png`, `plasma_paladin_jump_down.png` (Jump states)

## Additional Notes

- These sprites will be used in a Phaser.js game
- Characters should look futuristic and cyberpunk-themed
- Each character should have a unique silhouette
- Consider the game's dark cyberpunk aesthetic
- Sprites should convey the character's role/abilities at a glance

## Reference Context

The game features:

- Dark cyberpunk cityscape backgrounds
- Neon-lit platforms
- Robot enemies
- Energy effects and particles
- 2D side-scrolling platformer gameplay

Please create 4 distinct, high-quality pixel art sprites that capture the essence of each character while maintaining the technical specifications outlined above.
