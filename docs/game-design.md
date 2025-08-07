# Pixel Guardians: Earth's Last Stand - Game Design Document

## Overview
A unique cyberpunk space defense game that reimagines classic arcade shooters with modern mechanics. Features include full directional movement, swarm AI enemies, dash abilities, and atmospheric synthesized music.

## Core Mechanics

### Player Ship
- **Movement**: Full 8-directional movement within bottom 50% of screen
- **Velocity System**: Physics-based with acceleration (1200) and friction (0.85)
- **Dash Ability**: 800 speed burst, 0.2s duration, 0.5s cooldown with invincibility
- **Shooting**: Continuous fire with cooldown (0.3s normal, 0.1s rapid)
- **Lives**: 3 starting lives, max 5 with extra life system
- **Respawn**: 1.5s invulnerability after being hit

### Enemy Behavior
- **AI System**: Swarm intelligence with flocking behavior
- **Behavior States**: Patrol, Attack, Flank
- **Flocking Rules**:
  - Separation (30px radius): Avoid crowding
  - Alignment (60px radius): Match neighbor velocity
  - Cohesion (80px radius): Move toward group center
- **Formation Types**: 
  - Swarm: Free movement with AI
  - V-Formation: Triangular diving pattern
  - Circle: Surrounding maneuver
  - Flanking: Pincer attack from sides

### Progression System
- **Waves**: Infinite progression with formation rotation
- **Formation Schedule**:
  - Wave 1: Swarm
  - Wave 2: V-Formation
  - Wave 3: Boss
  - Wave 4: Circle
  - Wave 5: Flanking
  - Repeats with increased difficulty
- **Extra Lives**: Awarded at 10,000 points, then every 20,000

## Enemy Types

| Type | Health | Points | Color | Behavior |
|------|--------|--------|-------|----------|
| Scout | 1 | 10 | Purple (#ff66ff) | Basic AI, low aggression |
| Fighter | 2 | 20 | Turquoise (#66ffcc) | Moderate speed, higher shoot rate |
| Bomber | 3 | 30 | Yellow (#ffff66) | Slower, heavy attacks |
| Elite | 4 | 40 | Orange (#ff9966) | Fast, aggressive AI |
| Boss | 20+ | 500 | Coral (#ff3366) | Pattern attacks, 3 phases |

## Power-Up System

| Power-Up | Duration | Effect | Drop Rate | Visual |
|----------|----------|---------|-----------|---------|
| Triple Shot | 10s | 3 parallel bullets | 7% | Cyan burst |
| Rapid Fire | 10s | 3x fire rate | 7% | Yellow glow |
| Shield | 15s | Absorbs 1 hit, visual aura | 6% | Mint circle |

Total drop rate: 20% per enemy destroyed

## Visual Design

### Color Palette (Cyberpunk Theme)
- **Player**: Cyan (#00ffff)
- **UI**: Magenta (#ff00ff) 
- **Danger**: Hot pink (#ff0066)
- **Warning**: Gold (#ffcc00)
- **Power-ups**: Mint green (#00ff99)
- **Background**: Deep blue gradient

### Effects
- **Particle System**: 
  - Ship disintegration on hit
  - Engine trails with velocity
  - Explosion shockwaves
- **Screen Shake**: Dynamic intensity based on impact
- **Enemy Glow**: Pulsing aura effect
- **Dash Trail**: Multiple afterimages

## Audio Design

### Soundtrack
- **Technology**: Web Audio API synthesis
- **Style**: Dorian mode arpeggiator
- **Pattern**: D-F-A-B-A-F (6-note sequence)
- **Tempo**: 120 BPM, eighth notes
- **Locations**: Menu screen, Game over screen

### Sound Effects
- **Player shoot**: 800Hz square wave
- **Enemy shoot**: 400Hz triangle wave  
- **Hit**: 200Hz sawtooth
- **Explosion**: White noise burst
- **Power-up**: 600Hz sine wave ascending
- **Dash**: Power-up sound (temporary)

## Controls

### Mobile (Primary)
- **Move**: Large touchpad control area (35% screen width) with direct position mapping
- **Shoot**: Circular shoot button with press animation
- **Dash**: Swipe gesture in any direction to dash that way
- **Handedness**: Toggle between left/right-handed layouts
- **Sound**: Audio toggle button in UI

### Desktop
- **Move**: WASD/Arrow keys (8-directional)
- **Aim**: Mouse position
- **Shoot**: Space/Click (continuous)
- **Dash**: Shift/X or double-click
- **Pause**: ESC
- **Sound**: M toggle

## UI Systems

### HUD Elements
- **Score**: Top-left, cyan
- **High Score**: Top-center, yellow
- **Wave**: Top-right, gold
- **Lives**: Visual ship icons + counter
- **Next 1UP**: Score indicator
- **Sound Status**: ON/OFF indicator
- **Dash Cooldown**: Bar under player

### Game Over Overlay
- **Canvas-based**: No HTML overlay
- **Animation Sequence**:
  1. Dark overlay fade (0.5s)
  2. "GAME OVER" scale in (0.5s)
  3. Score stats fade in (0.5s)
  4. Restart prompt appear (0.5s)
- **New High Score**: Flashing effect

## Technical Implementation

### Architecture
- **Entity System**: OOP with update/render methods
- **State Machine**: menu → playing → paused/gameover
- **Delta Time**: Frame-independent physics
- **Collision**: Rectangle-based for performance

### Performance
- **Target**: 60 FPS on mobile
- **Optimizations**:
  - Particle pooling
  - Batched canvas operations
  - Efficient collision checks
  - Audio node cleanup

### Canvas
- **Size**: Responsive, max 400×800px
- **Scaling**: Maintains aspect ratio
- **Touch**: Offset calculations for accuracy

## Implemented Features

✅ Full directional movement
✅ Dash mechanics with invincibility
✅ Swarm AI with behaviors
✅ Multiple formation types
✅ Cyberpunk visual theme
✅ Particle effects system
✅ Synthesized soundtrack
✅ Extra life system
✅ Canvas-based game over
✅ Virtual joystick controls
✅ Screen shake effects
✅ Respawn invulnerability

## Future Enhancements

1. **Mission Variety**:
   - Survival mode (timed)
   - Escort missions
   - Base defense
   
2. **Environmental Hazards**:
   - Asteroids
   - Solar flares
   - Gravity wells
   
3. **Progression System**:
   - Ship upgrades
   - Weapon modifications
   - Permanent unlocks
   
4. **Multiplayer**:
   - Co-op mode
   - Versus mode
   - Leaderboards