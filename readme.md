# Pixel Guardians: Earth's Last Stand

A unique cyberpunk space defense game that reimagines the classic arcade shooter with modern gameplay mechanics, built with vanilla JavaScript and HTML5 Canvas.

## Overview

Pixel Guardians transforms the traditional space shooter into a dynamic combat experience featuring swarm AI enemies, full directional movement, and atmospheric synthesized music. Players defend Earth using advanced ship capabilities including dash mechanics and power-ups while facing increasingly intelligent enemy formations.

## Core Features

### Gameplay Innovation
- **Full 8-directional movement** - Move freely in the bottom 50% of the screen
- **Dash ability** - Quick evasion with brief invincibility (double-tap or Shift/X)
- **Dynamic enemy AI** - Enemies use swarm behavior with flocking, attacking, and flanking patterns
- **Multiple formation types** - Face swarms, V-formations, circles, and flanking maneuvers

### Visual & Audio
- **Unique cyberpunk aesthetic** - Neon colors, glowing effects, custom pixel art
- **Atmospheric soundtrack** - Dorian mode arpeggiator on menu/game over screens
- **Advanced particle effects** - Ship disintegration, engine trails, shockwaves
- **Screen shake** - Dynamic camera effects for impacts

### Game Systems
- **4 enemy types** with varying health, behavior, and point values
- **Boss battles** every 3 waves with multiple attack patterns
- **Power-up system** - Triple Shot, Rapid Fire, Shield (20% drop rate)
- **Extra life system** - Bonus ship at 10K points, then every 20K
- **Mobile-first controls** - Virtual joystick for movement, tap to shoot
- **Persistent high scores** stored locally

## How to Play

### Controls

**Mobile:**
- **Left side of screen**: Virtual joystick for 8-directional movement
- **Right side of screen**: Tap to shoot continuously
- **Double-tap right side**: Activate dash ability

**Desktop:**
- **WASD/Arrow keys**: 8-directional movement
- **Mouse**: Aim direction
- **Spacebar**: Shoot
- **Shift/X**: Dash
- **M**: Toggle sound/music
- **ESC**: Pause game

### Advanced Mechanics

1. **Movement**: Your ship can move freely within the bottom 50% of the screen
2. **Dash**: Quick burst of speed with 0.2s invincibility (0.5s cooldown)
3. **Enemy Patterns**: Learn different formation behaviors:
   - Swarms converge on your position
   - V-formations dive systematically
   - Flanking groups attack from sides
4. **Power-ups**: Destroy enemies for chance at upgrades
   - Triple Shot (10 seconds)
   - Rapid Fire (10 seconds)  
   - Shield (15 seconds, absorbs one hit)
5. **Extra Lives**: Earn bonus ships at score milestones

## Enemy Types & Formations

### Enemy Classes
1. **Scout** (Purple) - 1 HP, 10 points, basic movement
2. **Fighter** (Turquoise) - 2 HP, 20 points, moderate aggression
3. **Bomber** (Yellow) - 3 HP, 30 points, heavy attacks
4. **Elite** (Orange) - 4 HP, 40 points, advanced tactics

### Formation Types
- **Wave 1**: Swarm formation - enemies move independently with flocking behavior
- **Wave 2**: V-Formation - coordinated diving attacks
- **Wave 4**: Circle formation - surrounding maneuver
- **Wave 5**: Flanking formation - pincer attacks from sides

## Quick Start

### Play Online
Play the game directly in your browser: **[https://erikgoulet.github.io/pixel-guardians/](https://erikgoulet.github.io/pixel-guardians/)**

### Run Locally
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Click "START GAME" or press Space
4. For best experience, play on mobile device or use Chrome/Edge

## File Structure

```
pixel-guardians/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Game styling and UI
├── js/
│   ├── core/
│   │   ├── game.js    # Main game logic and state management
│   │   └── utils.js   # Helper functions and utilities
│   ├── entities/
│   │   └── entities.js # Player, Enemy, Bullet, PowerUp, Boss classes
│   ├── systems/
│   │   ├── assets.js  # Sprite generation and rendering
│   │   └── audio.js   # Sound effects and soundtrack system
│   └── main.js        # Entry point
└── docs/
    ├── game-design.md # Design documentation
    └── CLAUDE.md      # AI assistant guidelines
```

## Technical Details

### Built With

- **Core**: Vanilla JavaScript (ES6+), no frameworks
- **Graphics**: HTML5 Canvas API with programmatic sprite generation
- **Audio**: Web Audio API for synthesized sound effects and music
- **Design**: Mobile-first responsive approach

### Architecture Highlights

- **Entity System**: Object-oriented design with base classes for game entities
- **Particle System**: Dynamic effects with physics simulation
- **Audio Synthesis**: Real-time sound generation including musical soundtrack
- **State Management**: Clean separation of game states (menu, playing, paused, gameover)
- **Delta Time**: Frame-independent movement and animations

### Performance Features

- 60 FPS target with requestAnimationFrame
- Efficient rectangle-based collision detection
- Particle cleanup and management
- Optimized sprite rendering
- Touch event optimization for mobile

### Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers with touch support
- Web Audio API support required for sound

## Customization Guide

### Visual Theme
Edit the color palette in `js/systems/assets.js`:
```javascript
colors: {
    primary: '#00ffff',      // Player cyan
    secondary: '#ff00ff',    // UI magenta
    danger: '#ff0066',       // Hot pink danger
    warning: '#ffcc00',      // Gold warnings
    powerup: '#00ff99',      // Mint powerups
    boss: '#ff3366',         // Coral boss
    enemy1-4: [...]          // Enemy colors
}
```

### Difficulty Tuning
Adjust in `js/entities/entities.js`:
- Enemy health scaling
- Movement speeds
- Shoot frequencies
- Boss patterns

### Wave Configuration
Modify in `js/core/game.js`:
- Formation types per wave
- Enemy counts
- Boss frequency

## Controls Reference

| Action | Mobile | Keyboard | Mouse |
|--------|--------|----------|--------|
| Move | Drag left side | WASD/Arrows | Move cursor |
| Shoot | Tap right side | Space | Click |
| Dash | Double-tap | Shift/X | Double-click |
| Pause | - | ESC | - |
| Toggle Sound | - | M | - |

## Tips & Strategy

1. **Master the Dash** - Use it to escape tight situations, not just for speed
2. **Learn Enemy Patterns** - Each formation type has weaknesses
3. **Prioritize Threats** - Elite enemies (orange) are most dangerous
4. **Manage Power-ups** - Save shield for boss fights
5. **Use Your Space** - Full movement area gives tactical advantage
6. **Watch for Flankers** - Some enemies attack from sides

## Future Enhancements

- [ ] Mission variety system (survival, escort, defense modes)
- [ ] Environmental hazards (asteroids, solar flares)
- [ ] Weapon upgrade system
- [ ] Achievement system
- [ ] Leaderboards
- [ ] Additional boss types
- [ ] Co-op mode

## License

This game is open source and available for modification and redistribution.

## Credits

Created as a modern reimagining of classic arcade shooters with focus on mobile gameplay and atmospheric experience. Features 100% original pixel art and synthesized audio.