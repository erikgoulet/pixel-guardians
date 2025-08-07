// Asset definitions and sprite data

const Assets = {
    // Color palette - Neon cyberpunk theme
    colors: {
        primary: '#00ffff',      // Cyan for player
        secondary: '#ff00ff',    // Magenta for UI
        dark: '#0066cc',        // Dark blue
        danger: '#ff0066',      // Hot pink for danger
        warning: '#ffcc00',     // Gold for warnings
        powerup: '#00ff99',     // Mint green for powerups
        boss: '#ff3366',        // Coral red for boss
        enemy1: '#ff66ff',      // Light purple
        enemy2: '#66ffcc',      // Turquoise
        enemy3: '#ffff66',      // Light yellow
        enemy4: '#ff9966'       // Orange
    },

    // Sprite definitions (pixel art patterns)
    sprites: {
        player: [
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,0,0],
            [0,1,0,1,1,1,0,1,0],
            [1,1,1,0,1,0,1,1,1],
            [1,0,1,1,1,1,1,0,1],
            [1,0,0,1,0,1,0,0,1],
            [0,0,1,0,0,0,1,0,0]
        ],

        // Enemy types - Crystal entities
        enemy1: [
            [0,0,1,0,0,0,0,0,0],
            [0,1,0,1,0,0,1,0,0],
            [1,0,0,0,1,1,0,1,0],
            [0,1,0,1,1,1,1,0,0],
            [0,0,1,1,0,1,1,0,0],
            [0,1,0,1,1,0,0,1,0],
            [1,0,0,0,1,0,0,0,1],
            [0,0,0,1,0,0,0,0,0]
        ],

        enemy2: [
            [0,0,0,1,1,0,0,0,0],
            [0,0,1,1,1,1,0,0,1],
            [0,1,1,0,0,1,1,1,0],
            [1,1,0,0,0,0,1,1,0],
            [1,1,1,0,0,1,1,0,0],
            [0,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,0,0,1,0],
            [1,0,0,0,0,0,0,0,0]
        ],

        enemy3: [
            [1,0,0,0,0,0,0,0,1],
            [0,1,1,0,0,0,1,1,0],
            [0,1,0,1,1,1,0,1,0],
            [0,0,1,1,0,1,1,0,0],
            [0,1,1,0,0,0,1,1,0],
            [1,0,1,0,1,0,1,0,1],
            [1,0,0,1,1,1,0,0,1],
            [0,1,1,0,0,0,1,1,0]
        ],

        enemy4: [
            [1,0,0,0,1,0,0,0,1],
            [0,1,0,1,1,1,0,1,0],
            [0,0,1,1,0,1,1,0,0],
            [0,1,1,0,0,0,1,1,0],
            [1,1,0,0,1,0,0,1,1],
            [1,0,0,1,1,1,0,0,1],
            [0,0,1,0,0,0,1,0,0],
            [0,1,0,0,0,0,0,1,0]
        ],

        boss: [
            [0,1,0,0,0,1,1,1,0,0,0,1,0],
            [1,0,1,0,1,1,0,1,1,0,1,0,1],
            [1,0,0,1,1,0,0,0,1,1,0,0,1],
            [0,1,1,1,0,0,1,0,0,1,1,1,0],
            [0,1,1,0,0,1,1,1,0,0,1,1,0],
            [1,1,0,0,1,1,1,1,1,0,0,1,1],
            [1,0,0,1,1,0,1,0,1,1,0,0,1],
            [0,0,1,1,0,0,0,0,0,1,1,0,0],
            [0,1,0,0,1,1,0,1,1,0,0,1,0],
            [1,0,0,0,0,0,1,0,0,0,0,0,1]
        ],

        // Power-up sprites
        powerupSpeed: [
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,0,0,1,0,0,1],
            [1,0,1,1,1,0,1],
            [1,0,0,1,0,0,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0]
        ],

        powerupTriple: [
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,1,1,1,1],
            [0,1,1,1,0],
            [0,0,1,0,0]
        ],

        powerupShield: [
            [0,1,1,1,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0]
        ],

        bullet: [
            [1],
            [1],
            [1],
            [1]
        ],

        enemyBullet: [
            [0,1,0],
            [1,1,1],
            [0,1,0]
        ]
    },

    // Draw sprite function
    drawSprite(ctx, sprite, x, y, scale, color) {
        ctx.fillStyle = color || this.colors.primary;
        const pixelSize = scale || 2;
        
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    ctx.fillRect(
                        x + col * pixelSize,
                        y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    },

    // Get sprite dimensions
    getSpriteSize(sprite, scale = 2) {
        return {
            width: sprite[0].length * scale,
            height: sprite.length * scale
        };
    }
};