# Pixel Guardians: Earth's Last Stand - Setup Guide

## Quick Start (Simple Version)

If you just want to play the game immediately:
1. Open `index.html` in your web browser
2. Start playing!

## VS Code Setup (Organized Version)

### Step 1: File Organization

If you want the organized file structure:

```
pixel-guardians/
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
├── css/
│   └── style.css
├── js/
│   ├── core/
│   │   ├── game.js
│   │   └── utils.js
│   ├── entities/
│   │   └── entities.js
│   ├── systems/
│   │   ├── assets.js
│   │   └── audio.js
│   └── main.js
├── docs/
│   └── game-design.md
├── index.html
├── README.md
├── package.json
└── .gitignore
```

### Step 2: Move Files

1. Create the folder structure above
2. Move files to their respective locations:
   - `style.css` → `css/style.css`
   - `game.js` → `js/core/game.js`
   - `utils.js` → `js/core/utils.js`
   - `entities.js` → `js/entities/entities.js`
   - `assets.js` → `js/systems/assets.js`
   - `audio.js` → `js/systems/audio.js`
   - Create `js/main.js` from the provided file
   - Use the organized `index.html` that references the new paths

### Step 3: VS Code Setup

1. Open the project folder in VS Code
2. Install recommended extensions when prompted
3. Right-click on `index.html` → "Open with Live Server"

### Step 4: Start Development

- **Live Server**: Auto-reloads on file changes
- **Debug**: Press F5 to launch with Chrome debugging
- **Claude Code**: Use for adding features or debugging

## Testing

### Desktop
- Open in Chrome/Firefox/Safari
- Use mouse or keyboard controls

### Mobile
1. Start Live Server
2. Find your computer's IP address
3. On your phone, visit: `http://YOUR_IP:5501`

## Deployment

### GitHub Pages
1. Push all files to GitHub
2. Go to Settings → Pages
3. Select source: Deploy from branch
4. Your game will be live at: `https://yourusername.github.io/pixel-guardians/`

## Troubleshooting

### Game won't load
- Check browser console (F12) for errors
- Ensure all file paths are correct
- Verify all JavaScript files are loading

### Touch controls not working
- Test on actual mobile device
- Check that touch events are enabled

### Performance issues
- Reduce particle effects in `utils.js`
- Lower enemy count in `game.js`

Happy defending!