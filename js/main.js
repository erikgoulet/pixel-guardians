// Main entry point for Pixel Guardians: Earth's Last Stand

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    const game = new Game();
    
    // Make game instance globally accessible for debugging
    window.game = game;
    
    // Log game version
    console.log('Pixel Guardians: Earth\'s Last Stand v1.0.1');
    console.log('Updated:', new Date().toISOString());
    console.log('Defend Earth! Controls: Drag to move, Tap to shoot');
});