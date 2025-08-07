# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pixel Guardians: Earth's Last Stand is a unique cyberpunk space defense game that reimagines classic arcade shooters. Built with vanilla HTML5, CSS, and JavaScript, it features swarm AI enemies, full directional movement, dash mechanics, and atmospheric synthesized music.

## Key Features Implemented

### Gameplay Mechanics
- **8-directional movement** within bottom 50% of screen
- **Dash ability** with 0.2s invincibility (0.5s cooldown)
- **Advanced swarm AI** using flocking behavior (separation, alignment, cohesion)
- **Multiple formation types**: swarm, V-formation, circle, flanking (cycle every 2 waves)
- **Direct touch controls** for mobile with handedness toggle and swipe-to-dash

### Visual Systems
- **Cyberpunk aesthetic** with neon colors (cyan player, multicolor enemies)
- **Particle effects**: ship disintegration, engine trails, shockwaves
- **Screen shake** on impacts (15 intensity for player hit)
- **Glowing effects** on enemies with pulsing animation
- **Canvas-based UI** for game over overlay

### Audio Systems
- **Synthesized sound effects** using Web Audio API
- **Dorian mode soundtrack** (6-note arpeggiator: D-F-A-B-A-F)
- **Music on menu and game over** screens
- **Sound toggle** with M key

### Game Systems
- **Extra life at 10K points**, then every 20K (max 5 lives)
- **Respawn invulnerability** for 1.5 seconds after hit
- **Power-ups**: Triple Shot, Rapid Fire, Shield (20% drop rate)
- **Boss battles** every 3 waves with multiple patterns

## Development Commands

### Running the Game

```bash
# Start local server (Python)
npm start

# Alternative with npx
npm run serve

# Or directly open index.html in browser
```

### Debugging Controls
- **T**: Test audio system
- **Y**: Force start soundtrack
- **M**: Toggle sound on/off

## Architecture

### Core Systems

1. **Game Loop** (`js/core/game.js`): 
   - State management: menu, playing, paused, gameover
   - Canvas-based rendering with overlay UI
   - Touch/mouse/keyboard input handling
   - Extra life system integration

2. **Entity System** (`js/entities/entities.js`):
   - Player: physics-based movement, dash, respawn system
   - Enemy: swarm AI with behavior states (patrol, attack, flank)
   - Bullet: player/enemy variants
   - PowerUp: three types with timed effects
   - Boss: multiple attack patterns

3. **Asset System** (`js/systems/assets.js`):
   - Programmatic sprite generation
   - Cyberpunk color palette
   - Custom pixel art designs

4. **Audio System** (`js/systems/audio.js`):
   - Web Audio API synthesis
   - Soundtrack system with arpeggiator
   - Sound effect generation
   - Audio context management

5. **Utilities** (`js/core/utils.js`):
   - Enhanced particle system with physics
   - Screen shake with intensity/duration
   - Collision detection
   - Score formatting

### Key Implementation Details

#### Player Movement
```javascript
// Player has velocity-based movement with friction
vx/vy: velocity components
acceleration: 2400  // Increased for mobile responsiveness
friction: 0.85
maxSpeed: 500       // Increased for better coverage
minY: canvas.height * 0.5 (50% boundary)
```

#### Enemy Swarm AI
```javascript
// Enemies use three flocking rules
separationRadius: 30   // Avoid crowding
alignmentRadius: 60    // Match neighbor velocity
cohesionRadius: 80     // Move toward group center
behavior: 'patrol'/'attack'/'flank'
```

#### Dash Mechanics
```javascript
dashSpeed: 800
dashDuration: 0.2
dashCooldown: 0.5
isDashing: true = invulnerable
```

#### Formation Types (Cycle Every 2 Waves)
- **Waves 1-2**: Swarm (random positions, flocking)
- **Waves 3-4**: V-Formation (triangular pattern)
- **Waves 5-6**: Circle (surrounding pattern)
- **Waves 7-8**: Flanking (two side groups)
- **Then repeats**: Pattern continues with increased difficulty

#### Mobile Control System
```javascript
// Direct touch control (default)
useDirectTouch: true
touchpadArea: 35% screen width
movementMapping: direct position to player coordinates
handednessToggle: left/right control layouts
swipeToDash: gesture in any direction triggers dash
shootButton: circular button with press animation
```

## Common Development Tasks

### Modifying Enemy Behavior
1. Edit `updateSwarmBehavior()` in Enemy class
2. Add new behavior states to switch statement
3. Adjust flocking parameters (separation/alignment/cohesion)

### Adding New Formations
1. Add formation name to `formations` array in `createEnemyWave()`
2. Add case in switch statement with enemy positioning logic
3. Set formation type when creating enemies

### Adjusting Difficulty
- Enemy speed: `baseSpeed` in Enemy constructor
- Swarm aggressiveness: force multipliers in `updateSwarmBehavior()`
- Formation selection: modify wave-based logic in `createEnemyWave()`

### Customizing Visual Effects
- Particle colors/sizes in `createShipDisintegration()`
- Enemy glow intensity in Enemy `draw()` method
- Engine trail parameters in Player class

### Modifying Soundtrack
- Note sequence in `Audio.soundtrack.noteSequence`
- Tempo in `Audio.soundtrack.tempo`
- Instrument type: change oscillator type in `playNextNote()`

## Performance Considerations

- Enemy count limited by `enemyCount` calculation
- Particles auto-cleanup when life <= 0
- Touch events optimized with single handler
- Canvas operations batched in render loop
- Audio nodes properly disconnected after use

## Testing Checklist

1. **Movement**: Test 8-directional movement boundaries
2. **Dash**: Verify invincibility and cooldown display
3. **Formations**: Check all 4 formation types appear
4. **AI**: Observe swarm behaviors (attack/patrol/flank)
5. **Extra Lives**: Reach 10K points for bonus ship
6. **Audio**: Press M to toggle, check soundtrack on menu/gameover
7. **Mobile**: Test virtual joystick and double-tap dash
8. **Performance**: Monitor FPS with many particles

## Known Implementation Notes

- Soundtrack connects directly to audio destination (bypasses gain node)
- Enemy formations reset to swarm AI after initial positioning
- Canvas touch coordinates need rect offset calculation
- Player respawn uses flashing effect via sin wave
- Game over requires button alpha > 0.5 to restart (prevents accidental restart)

## Git Commit Guidelines

When committing and pushing to Git, do NOT include the following in commit messages:
- Generated with [Claude Code](https://claude.ai/code)
- Co-Authored-By: Claude <noreply@anthropic.com>

### Quick Git Command: QGIT

When the user types "QGIT":

**With a message:** `QGIT Add swarm AI behavior`
1. `git add .` (stage all changes)
2. `git commit -m "Add swarm AI behavior"` (without Claude signatures)
3. `git push` (push to remote)

**Without a message:** `QGIT`
1. Run `git status` and `git diff --staged` to analyze changes
2. Auto-generate a commit message based on:
   - Files modified/added/deleted
   - Type of changes (feature, fix, update, refactor)
   - Specific components affected
3. `git add .` (stage all changes)
4. `git commit -m "[auto-generated message]"` (without Claude signatures)
5. `git push` (push to remote)

Example auto-generated messages for Pixel Guardians:
- "Update enemy swarm AI and flocking behavior"
- "Add dash ability with invincibility frames"
- "Fix virtual joystick touch controls"
- "Update cyberpunk visual theme and particle effects"
- "Add Dorian mode soundtrack to menu"
- "Implement extra life system at score milestones"

This will commit and push with a clean commit message, no Claude attribution.

## Deployment

The game is self-contained and can be deployed to any static hosting:
- GitHub Pages: Push to repo and enable Pages
- Netlify/Vercel: Direct deployment from Git
- Any web server: Upload all files maintaining structure