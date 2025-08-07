// Main game logic

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover
        this.wave = 1;
        this.score = 0;
        this.highScore = Utils.getHighScore();
        
        // Extra life system
        this.nextExtraLifeScore = 10000; // First extra life at 10,000 points
        this.extraLifeIncrement = 20000; // Then every 20,000 points after
        this.extraLifeNotification = null;
        this.notificationTimer = 0;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        this.boss = null;
        
        // Enemy wave configuration
        this.enemyRows = 5;
        this.enemyCols = 8;
        this.enemySpacing = 50;
        
        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.isTouching = false;
        this.movementTouchId = null; // Track which touch is for movement
        this.useDirectTouch = true; // Use direct touch control instead of virtual joystick
        
        // Control layout preference (left/right handed)
        this.leftHanded = false; // Default right-handed layout
        
        // Touch feedback animations
        this.touchFeedback = [];
        
        // Swipe detection for dash
        this.swipeStartX = 0;
        this.swipeStartY = 0;
        this.swipeStartTime = 0;
        this.swipeThreshold = 50; // Minimum swipe distance
        this.swipeTimeLimit = 300; // Maximum time for swipe in ms
        
        // Touchpad area for movement (will be positioned based on handedness)
        this.touchpad = {
            x: 20,
            y: 0, // Will be set based on canvas height
            width: 200, // Will be responsive
            height: 200, // Will be responsive
            visible: true,
            baseScale: 0.35 // 35% of screen width - much larger for easier control
        };
        
        // Mobile shoot button - initialize before resizeCanvas
        this.shootButton = {
            x: 0,
            y: 0,
            width: 80, // Will be responsive
            height: 80, // Will be responsive
            pressed: false,
            baseScale: 0.15, // 15% of screen width - larger for easier tapping
            pressAnimation: 0
        };
        
        // Pause button for mobile
        this.pauseButton = {
            x: 0,
            y: 40,
            width: 40,
            height: 40,
            baseScale: 0.08
        };
        
        // Settings/handedness toggle button for mobile
        this.handsButton = {
            x: 0,
            y: 40,
            width: 40,
            height: 40,
            baseScale: 0.08
        };
        
        // Set canvas size for mobile (after shootButton is initialized)
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Input state
        this.input = {
            direction: { x: 0, y: 0 },
            shooting: false,
            dash: false
        };
        this.keys = {};
        
        // Delta time
        this.lastTime = 0;
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.waveElement = document.getElementById('wave');
        this.livesElement = document.getElementById('lives');
        this.muteButton = document.getElementById('mute-button');
        
        // Initialize
        this.init();
    }

    init() {
        // Initialize audio
        Audio.init();
        
        // Setup touch controls
        this.setupControls();
        
        // Setup UI buttons
        const startButton = document.getElementById('start-button');
        console.log('Start button element:', startButton);
        
        if (startButton) {
            // Also add touch event for mobile
            const handleStart = () => {
                console.log('Start button clicked/touched');
                try {
                    // Ensure audio context exists before resuming
                    if (Audio.audioContext) {
                        Audio.resume().then(() => {
                            console.log('Audio resumed');
                        }).catch(err => {
                            console.error('Audio resume error:', err);
                        });
                    }
                    this.startGame();
                } catch (err) {
                    console.error('Error starting game:', err);
                }
            };
            
            startButton.addEventListener('click', handleStart);
            startButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleStart();
            });
        } else {
            console.error('Start button not found!')
        }
        
        // Start menu soundtrack after a delay (desktop only - mobile needs user interaction)
        setTimeout(() => {
            if (this.state === 'menu' && Audio.audioContext && Audio.audioContext.state === 'running') {
                Audio.startSoundtrack();
            }
        }, 1000);
        
        // Also try to start soundtrack on first user interaction
        let soundtrackStarted = false;
        const startSoundtrackOnce = (e) => {
            if (soundtrackStarted) return;
            
            console.log('User interaction detected:', e.type);
            
            if (this.state === 'menu' && Audio.enabled && Audio.audioContext) {
                soundtrackStarted = true;
                
                // Resume audio context first
                Audio.resume().then(() => {
                    console.log('Audio context state:', Audio.audioContext.state);
                    
                    // Start soundtrack if not already playing
                    if (!Audio.soundtrack.isPlaying) {
                        console.log('Starting soundtrack after user interaction');
                        Audio.startSoundtrack();
                    }
                }).catch(e => {
                    console.log('Audio resume failed:', e);
                    soundtrackStarted = false;
                });
                
                // Remove all listeners
                document.removeEventListener('click', startSoundtrackOnce);
                document.removeEventListener('touchstart', startSoundtrackOnce);
                document.removeEventListener('keydown', startSoundtrackOnce);
                document.removeEventListener('touchend', startSoundtrackOnce);
                this.canvas.removeEventListener('touchstart', startSoundtrackOnce);
                this.canvas.removeEventListener('touchend', startSoundtrackOnce);
            }
        };
        
        document.addEventListener('click', startSoundtrackOnce);
        document.addEventListener('touchstart', startSoundtrackOnce);
        document.addEventListener('keydown', startSoundtrackOnce);
        // Additional mobile events
        document.addEventListener('touchend', startSoundtrackOnce);
        this.canvas.addEventListener('touchstart', startSoundtrackOnce);
        this.canvas.addEventListener('touchend', startSoundtrackOnce);
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('resume-button').addEventListener('click', () => {
            this.resumeGame();
        });
        
        // Setup mute button
        this.muteButton.addEventListener('click', () => {
            Audio.toggle();
            
            // Update button state
            if (Audio.enabled) {
                this.muteButton.classList.remove('muted');
            } else {
                this.muteButton.classList.add('muted');
            }
            
            // Resume audio context if needed (for mobile)
            if (Audio.enabled && Audio.audioContext && Audio.audioContext.state === 'suspended') {
                Audio.resume();
            }
        });
        
        // Set initial mute button state
        if (!Audio.enabled) {
            this.muteButton.classList.add('muted');
        }
        
        // Update high score display
        this.highScoreElement.textContent = Utils.formatScore(this.highScore);
        
        // Start game loop
        this.gameLoop(0);
    }

    resizeCanvas() {
        const aspectRatio = 9 / 16; // Vertical orientation
        const isMobile = 'ontouchstart' in window;
        const maxWidth = isMobile ? window.innerWidth : 400;
        const maxHeight = isMobile ? window.innerHeight : 800;
        
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        // For mobile, use full screen dimensions
        if (isMobile) {
            // Account for browser UI
            const availableHeight = window.innerHeight;
            const availableWidth = window.innerWidth;
            
            // Fit to screen while maintaining aspect ratio
            if (availableWidth / availableHeight > aspectRatio) {
                // Height limited
                height = availableHeight;
                width = height * aspectRatio;
            } else {
                // Width limited
                width = availableWidth;
                height = width / aspectRatio;
            }
        } else {
            // Desktop sizing
            if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
            }
            
            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Center the canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '50%';
        this.canvas.style.top = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
        
        // Scale controls based on screen size
        if (isMobile) {
            // Responsive control sizing
            console.log('Canvas width:', this.canvas.width, 'Touchpad baseScale:', this.touchpad.baseScale);
            this.touchpad.width = Math.floor(this.canvas.width * this.touchpad.baseScale);
            this.touchpad.height = Math.floor(this.canvas.width * this.touchpad.baseScale);
            console.log('New touchpad size:', this.touchpad.width, 'x', this.touchpad.height);
            
            this.shootButton.width = Math.floor(this.canvas.width * this.shootButton.baseScale);
            this.shootButton.height = Math.floor(this.canvas.width * this.shootButton.baseScale);
            
            this.pauseButton.width = Math.floor(this.canvas.width * this.pauseButton.baseScale);
            this.pauseButton.height = Math.floor(this.canvas.width * this.pauseButton.baseScale);
            
            this.handsButton.width = Math.floor(this.canvas.width * this.handsButton.baseScale);
            this.handsButton.height = Math.floor(this.canvas.width * this.handsButton.baseScale);
            
            // Position controls based on handedness
            const margin = 10; // Minimal margin to maximize control area
            
            if (this.leftHanded) {
                // Left-handed: touchpad on right, shoot button on left
                this.touchpad.x = this.canvas.width - this.touchpad.width - margin;
                this.shootButton.x = margin;
            } else {
                // Right-handed: touchpad on left, shoot button on right
                this.touchpad.x = margin;
                this.shootButton.x = this.canvas.width - this.shootButton.width - margin;
            }
            
            this.touchpad.y = this.canvas.height - this.touchpad.height - margin;
            this.shootButton.y = this.canvas.height - this.shootButton.height - margin;
            
            // Pause button at top center-left
            this.pauseButton.x = (this.canvas.width / 2) - this.pauseButton.width - 5;
            
            // Hands toggle button at top center-right
            this.handsButton.x = (this.canvas.width / 2) + 5;
        }
    }

    setupControls() {
        // Touch controls with virtual joystick
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // Resume audio context on first touch (important for mobile)
            Audio.resume();
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            // Handle all new touches
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const canvasX = x * scaleX;
                const canvasY = y * scaleY;
                
                // Add touch feedback ripple
                this.touchFeedback.push({
                    x: canvasX,
                    y: canvasY,
                    radius: 0,
                    maxRadius: 40,
                    alpha: 0.5,
                    life: 0.5
                });
                
                // Check if pause button is pressed (mobile only)
                if ('ontouchstart' in window && this.state === 'playing') {
                    if (canvasX >= this.pauseButton.x && 
                        canvasX <= this.pauseButton.x + this.pauseButton.width &&
                        canvasY >= this.pauseButton.y && 
                        canvasY <= this.pauseButton.y + this.pauseButton.height) {
                        this.pauseGame();
                        continue;
                    }
                    
                    // Check if hands toggle button is pressed
                    if (canvasX >= this.handsButton.x && 
                        canvasX <= this.handsButton.x + this.handsButton.width &&
                        canvasY >= this.handsButton.y && 
                        canvasY <= this.handsButton.y + this.handsButton.height) {
                        this.leftHanded = !this.leftHanded;
                        this.resizeCanvas();
                        continue;
                    }
                }
                
                // Check if shoot button is pressed (mobile only)
                if ('ontouchstart' in window && this.state === 'playing') {
                    if (canvasX >= this.shootButton.x && 
                        canvasX <= this.shootButton.x + this.shootButton.width &&
                        canvasY >= this.shootButton.y && 
                        canvasY <= this.shootButton.y + this.shootButton.height) {
                        this.shootButton.pressed = true;
                        this.shootButton.pressAnimation = 1.0;
                        this.input.shooting = true;
                        continue; // Process next touch
                    }
                }
                
                // Check if touch is within touchpad area
                if (canvasX >= this.touchpad.x && 
                    canvasX <= this.touchpad.x + this.touchpad.width &&
                    canvasY >= this.touchpad.y && 
                    canvasY <= this.touchpad.y + this.touchpad.height &&
                    this.movementTouchId === null) {
                    // Movement touch within touchpad
                    this.movementTouchId = touch.identifier;
                    this.touchStartX = canvasX;
                    this.touchStartY = canvasY;
                    this.touchCurrentX = this.touchStartX;
                    this.touchCurrentY = this.touchStartY;
                    this.isTouching = true;
                    
                    // For direct touch, map touchpad position to ship position
                    if (this.useDirectTouch && this.player && this.state === 'playing') {
                        // Map touchpad coordinates to playable area
                        const touchpadRelX = (canvasX - this.touchpad.x) / this.touchpad.width;
                        const touchpadRelY = (canvasY - this.touchpad.y) / this.touchpad.height;
                        
                        // Map to playable area
                        const playableMinY = this.canvas.height * 0.5;
                        const playableMaxY = this.canvas.height - this.player.height - 20;
                        
                        let targetX = touchpadRelX * (this.canvas.width - this.player.width);
                        let targetY = playableMinY + touchpadRelY * (playableMaxY - playableMinY);
                        
                        this.player.setTargetPosition(targetX + this.player.width / 2, targetY + this.player.height / 2);
                    }
                    
                    // Record swipe start for dash detection
                    this.swipeStartX = canvasX;
                    this.swipeStartY = canvasY;
                    this.swipeStartTime = Date.now();
                } else if (canvasX >= this.canvas.width / 2) {
                    if (this.state === 'playing') {
                        // Record swipe start for dash on right side
                        this.swipeStartX = canvasX;
                        this.swipeStartY = canvasY;
                        this.swipeStartTime = Date.now();
                    } else if (this.state === 'gameover') {
                        // Tap to restart
                        if (this.gameOverAnimation && this.gameOverAnimation.buttonAlpha > 0.5) {
                            this.startGame();
                        }
                    }
                }
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isTouching && this.state === 'playing' && this.movementTouchId !== null) {
                // Find the movement touch
                let movementTouch = null;
                for (let i = 0; i < e.touches.length; i++) {
                    if (e.touches[i].identifier === this.movementTouchId) {
                        movementTouch = e.touches[i];
                        break;
                    }
                }
                
                if (movementTouch) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = movementTouch.clientX - rect.left;
                    const y = movementTouch.clientY - rect.top;
                    const scaleX = this.canvas.width / rect.width;
                    const scaleY = this.canvas.height / rect.height;
                    this.touchCurrentX = x * scaleX;
                    this.touchCurrentY = y * scaleY;
                    
                    // Check if touch is still within touchpad bounds
                    const withinTouchpad = this.touchCurrentX >= this.touchpad.x && 
                                         this.touchCurrentX <= this.touchpad.x + this.touchpad.width &&
                                         this.touchCurrentY >= this.touchpad.y && 
                                         this.touchCurrentY <= this.touchpad.y + this.touchpad.height;
                    
                    if (withinTouchpad) {
                        if (this.useDirectTouch) {
                            // Direct touch control - map touchpad to playable area
                            if (this.player) {
                                // Map touchpad coordinates to playable area
                                const touchpadRelX = (this.touchCurrentX - this.touchpad.x) / this.touchpad.width;
                                const touchpadRelY = (this.touchCurrentY - this.touchpad.y) / this.touchpad.height;
                                
                                // Map to playable area
                                const playableMinY = this.canvas.height * 0.5;
                                const playableMaxY = this.canvas.height - this.player.height - 20;
                                
                                let targetX = touchpadRelX * (this.canvas.width - this.player.width);
                                let targetY = playableMinY + touchpadRelY * (playableMaxY - playableMinY);
                                
                                this.player.setTargetPosition(targetX + this.player.width / 2, targetY + this.player.height / 2);
                            }
                        } else {
                        // Virtual joystick control
                        const deltaX = this.touchCurrentX - this.touchStartX;
                        const deltaY = this.touchCurrentY - this.touchStartY;
                        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                        
                        // Reduced dead zone for more accuracy
                        const deadZone = 5;
                        const maxDist = 80; // Virtual joystick radius
                        
                        if (distance > deadZone) {
                            // Linear response for direct control
                            const normalizedDistance = Math.min(distance / maxDist, 1);
                            
                            // Direct linear mapping for accurate tracking
                            this.input.direction.x = (deltaX / distance) * normalizedDistance;
                            this.input.direction.y = (deltaY / distance) * normalizedDistance;
                        } else {
                            this.input.direction.x = 0;
                            this.input.direction.y = 0;
                        }
                        }
                    } else {
                        // Touch moved outside touchpad - stop movement
                        this.input.direction.x = 0;
                        this.input.direction.y = 0;
                    }
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            // Check each ended touch
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const x = (touch.clientX - rect.left) * scaleX;
                const y = (touch.clientY - rect.top) * scaleY;
                
                // Check if the ended touch was on the shoot button
                if (x >= this.shootButton.x && 
                    x <= this.shootButton.x + this.shootButton.width &&
                    y >= this.shootButton.y && 
                    y <= this.shootButton.y + this.shootButton.height) {
                    // Check if shoot button is still being pressed by another touch
                    let shootButtonStillPressed = false;
                    for (let j = 0; j < e.touches.length; j++) {
                        const remainingTouch = e.touches[j];
                        const remainingX = (remainingTouch.clientX - rect.left) * scaleX;
                        const remainingY = (remainingTouch.clientY - rect.top) * scaleY;
                        
                        if (remainingX >= this.shootButton.x && 
                            remainingX <= this.shootButton.x + this.shootButton.width &&
                            remainingY >= this.shootButton.y && 
                            remainingY <= this.shootButton.y + this.shootButton.height) {
                            shootButtonStillPressed = true;
                            break;
                        }
                    }
                    
                    if (!shootButtonStillPressed) {
                        this.shootButton.pressed = false;
                        this.input.shooting = false;
                    }
                }
                
                // Check for swipe gesture (for dash)
                if (this.state === 'playing' && this.swipeStartTime) {
                    const swipeDuration = Date.now() - this.swipeStartTime;
                    const swipeDistX = x - this.swipeStartX;
                    const swipeDistY = y - this.swipeStartY;
                    const swipeDistance = Math.sqrt(swipeDistX * swipeDistX + swipeDistY * swipeDistY);
                    
                    if (swipeDuration < this.swipeTimeLimit && swipeDistance > this.swipeThreshold) {
                        // Valid swipe detected - perform dash
                        const swipeAngle = Math.atan2(swipeDistY, swipeDistX);
                        this.input.dash = true;
                        
                        // Set dash direction based on swipe
                        if (this.player) {
                            this.player.dashDirection.x = Math.cos(swipeAngle);
                            this.player.dashDirection.y = Math.sin(swipeAngle);
                        }
                    }
                    
                    // Reset swipe tracking
                    this.swipeStartTime = 0;
                }
                
                // Check if the ended touch was the movement touch
                if (touch.identifier === this.movementTouchId) {
                    this.isTouching = false;
                    this.movementTouchId = null;
                    this.input.direction.x = 0;
                    this.input.direction.y = 0;
                }
            }
        });
        
        // Mouse controls for desktop
        let mouseDown = false;
        this.canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            this.input.shooting = true;
            
            // Double click for dash
            if (e.detail === 2) {
                this.input.dash = true;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.player && this.state === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate direction from player to mouse
                const dx = mouseX - (this.player.x + this.player.width / 2);
                const dy = mouseY - (this.player.y + this.player.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) {
                    this.input.direction.x = dx / distance;
                    this.input.direction.y = dy / distance;
                } else {
                    this.input.direction.x = 0;
                    this.input.direction.y = 0;
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            mouseDown = false;
            this.input.shooting = false;
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Global sound toggle
            if (e.key === 'm' || e.key === 'M') {
                const wasEnabled = Audio.enabled;
                Audio.toggle();
                
                // Handle soundtrack based on game state
                if (this.state === 'menu' || this.state === 'gameover') {
                    if (Audio.enabled && !wasEnabled) {
                        Audio.startSoundtrack();
                    } else if (!Audio.enabled && wasEnabled) {
                        Audio.stopSoundtrack();
                    }
                }
                return;
            }
            
            // Test audio (debug)
            if (e.key === 't' || e.key === 'T') {
                Audio.testSoundtrack();
                return;
            }
            
            // Force start soundtrack (debug)
            if (e.key === 'y' || e.key === 'Y') {
                console.log('Force starting soundtrack...');
                Audio.stopSoundtrack();
                setTimeout(() => {
                    Audio.resume();
                    Audio.startSoundtrack();
                }, 100);
                return;
            }
            
            if (this.state === 'playing') {
                switch(e.key) {
                    case ' ':
                        this.input.shooting = true;
                        break;
                    case 'Shift':
                    case 'x':
                        this.input.dash = true;
                        break;
                    case 'Escape':
                    case 'p':
                    case 'P':
                        this.pauseGame();
                        break;
                    case 'h':
                    case 'H':
                        // Toggle handedness
                        this.leftHanded = !this.leftHanded;
                        this.resizeCanvas();
                        break;
                }
            } else if (this.state === 'gameover') {
                if (e.key === ' ' && this.gameOverAnimation && this.gameOverAnimation.buttonAlpha > 0.5) {
                    this.startGame();
                }
            } else if (this.state === 'menu') {
                if (e.key === ' ' || e.key === 'Enter') {
                    Audio.resume();
                    Audio.stopSoundtrack();
                    this.startGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            
            if (e.key === ' ') {
                this.input.shooting = false;
            }
        });
        
        // Update keyboard direction every frame
        this.updateKeyboardInput = () => {
            if (this.state !== 'playing') return;
            
            // Don't update keyboard input if touch is active
            if (this.isTouching) return;
            
            this.input.direction.x = 0;
            this.input.direction.y = 0;
            
            if (this.keys['ArrowLeft'] || this.keys['a']) this.input.direction.x -= 1;
            if (this.keys['ArrowRight'] || this.keys['d']) this.input.direction.x += 1;
            if (this.keys['ArrowUp'] || this.keys['w']) this.input.direction.y -= 1;
            if (this.keys['ArrowDown'] || this.keys['s']) this.input.direction.y += 1;
            
            // Normalize diagonal movement
            const length = Math.sqrt(this.input.direction.x ** 2 + this.input.direction.y ** 2);
            if (length > 1) {
                this.input.direction.x /= length;
                this.input.direction.y /= length;
            }
        };
    }

    startGame() {
        console.log('Starting game...');
        console.log('Current state:', this.state);
        this.state = 'playing';
        console.log('New state:', this.state);
        this.wave = 1;
        this.score = 0;
        this.nextExtraLifeScore = 10000;
        this.extraLifeNotification = null;
        this.notificationTimer = 0;
        this.gameOverAnimation = null;
        
        // Stop soundtrack when game starts
        if (Audio && Audio.stopSoundtrack) {
            Audio.stopSoundtrack();
        }
        
        // Hide screens
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        console.log('Start screen element:', startScreen);
        if (startScreen) {
            startScreen.classList.add('hidden');
            console.log('Start screen hidden');
        }
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        
        // Create player
        this.player = new Player(
            (this.canvas.width - 27) / 2, // 27 = player width with scale 3
            this.canvas.height - 100
        );
        this.player.setCanvas(this.canvas.width, this.canvas.height);
        
        // Create first wave
        this.createEnemyWave();
        
        // Clear arrays
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        this.boss = null;
        
        // Update UI
        this.updateUI();
    }

    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-screen').classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-screen').classList.add('hidden');
        }
    }

    gameOver() {
        this.state = 'gameover';
        
        // Update high score
        if (Utils.saveHighScore(this.score)) {
            this.highScore = this.score;
            this.newHighScore = true;
        } else {
            this.newHighScore = false;
        }
        
        // Initialize game over animation
        this.gameOverAnimation = {
            overlayAlpha: 0,
            textScale: 0,
            statsAlpha: 0,
            buttonAlpha: 0,
            phase: 0
        };
        
        // Create final explosion effect
        if (this.player) {
            this.createShipDisintegration();
        }
        
        // Restart soundtrack after a delay
        setTimeout(() => {
            if (this.state === 'gameover' && Audio.enabled) {
                Audio.startSoundtrack();
            }
        }, 2000); // Start after 2 seconds
    }

    createEnemyWave() {
        this.enemies = [];
        
        // Boss wave every 3 waves
        if (this.wave % 3 === 0) {
            this.boss = new Boss(
                (this.canvas.width - 52) / 2, // Center boss
                50,
                Math.floor(this.wave / 3)
            );
            return;
        }
        
        // Choose formation type based on wave
        const formations = ['swarm', 'v-formation', 'circle', 'flanking'];
        const formationType = formations[Math.floor((this.wave - 1) / 2) % formations.length];
        
        // Determine enemy types for this wave
        const maxEnemyType = Math.min(Math.ceil(this.wave / 2), 4);
        const enemyCount = Math.min(this.enemyRows * this.enemyCols, 15 + this.wave * 2);
        
        switch (formationType) {
            case 'swarm':
                // Random swarm positions
                for (let i = 0; i < enemyCount; i++) {
                    const enemyType = Math.floor(Math.random() * maxEnemyType) + 1;
                    this.enemies.push(new Enemy(
                        Math.random() * (this.canvas.width - 40) + 20,
                        50 + Math.random() * 150,
                        enemyType,
                        this.wave,
                        'swarm'
                    ));
                }
                break;
                
            case 'v-formation':
                // V-shaped formation
                const vCenterX = this.canvas.width / 2;
                const vStartY = 50;
                const vSpacing = 40;
                const rows = Math.ceil(Math.sqrt(enemyCount));
                
                for (let row = 0; row < rows; row++) {
                    const colsInRow = Math.min(row * 2 + 1, enemyCount - row * row);
                    for (let col = 0; col < colsInRow; col++) {
                        const xOffset = (col - colsInRow / 2) * vSpacing;
                        const enemyType = Math.min(row + 1, maxEnemyType);
                        
                        this.enemies.push(new Enemy(
                            vCenterX + xOffset,
                            vStartY + row * vSpacing,
                            enemyType,
                            this.wave,
                            'swarm'
                        ));
                    }
                }
                break;
                
            case 'circle':
                // Circular formation
                const centerX = this.canvas.width / 2;
                const centerY = 150;
                const radius = 80;
                const angleStep = (Math.PI * 2) / enemyCount;
                
                for (let i = 0; i < enemyCount; i++) {
                    const angle = i * angleStep;
                    const enemyType = Math.floor(Math.random() * maxEnemyType) + 1;
                    
                    this.enemies.push(new Enemy(
                        centerX + Math.cos(angle) * radius - 10,
                        centerY + Math.sin(angle) * radius - 10,
                        enemyType,
                        this.wave,
                        'swarm'
                    ));
                }
                break;
                
            case 'flanking':
                // Two groups on the sides
                const sideCount = Math.floor(enemyCount / 2);
                
                for (let i = 0; i < enemyCount; i++) {
                    const isLeft = i < sideCount;
                    const groupX = isLeft ? 50 : this.canvas.width - 100;
                    const indexInGroup = isLeft ? i : i - sideCount;
                    const enemyType = Math.floor(Math.random() * maxEnemyType) + 1;
                    
                    this.enemies.push(new Enemy(
                        groupX + (Math.random() - 0.5) * 60,
                        50 + indexInGroup * 30,
                        enemyType,
                        this.wave,
                        'swarm'
                    ));
                }
                break;
                
            default:
                // Fallback to classic formation
                const startX = (this.canvas.width - (this.enemyCols * this.enemySpacing)) / 2;
                const startY = 50;
                
                for (let row = 0; row < this.enemyRows; row++) {
                    for (let col = 0; col < this.enemyCols; col++) {
                        const enemyType = Math.min(
                            Math.floor(row / 2) + 1 + Math.floor(this.wave / 3),
                            maxEnemyType
                        );
                        
                        this.enemies.push(new Enemy(
                            startX + col * this.enemySpacing,
                            startY + row * 40,
                            enemyType,
                            this.wave,
                            'classic'
                        ));
                    }
                }
        }
        
        // Set canvas dimensions for all enemies
        for (let enemy of this.enemies) {
            enemy.setCanvas(this.canvas.width, this.canvas.height);
        }
    }

    playerShoot() {
        if (this.player) {
            const bullets = this.player.shoot();
            if (bullets) {
                this.bullets.push(...bullets);
            }
        }
    }

    spawnPowerup(x, y) {
        // 20% chance to spawn powerup
        if (Math.random() < 0.2) {
            const types = ['triple', 'rapid', 'shield'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerups.push(new PowerUp(x, y, type));
        }
    }
    
    createShipDisintegration() {
        if (!this.player) return;
        
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        
        // Get ship sprite data
        const sprite = Assets.sprites.player;
        const scale = this.player.scale;
        
        // Create particles for each pixel of the ship
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col] === 1) {
                    // Calculate pixel position
                    const pixelX = this.player.x + col * scale;
                    const pixelY = this.player.y + row * scale;
                    
                    // Create multiple particles per pixel for density
                    for (let i = 0; i < 3; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 50 + Math.random() * 150;
                        const vx = Math.cos(angle) * speed;
                        const vy = Math.sin(angle) * speed - 50; // Slight upward bias
                        
                        this.particles.push({
                            x: pixelX + Math.random() * scale,
                            y: pixelY + Math.random() * scale,
                            vx: vx,
                            vy: vy,
                            color: Math.random() > 0.5 ? Assets.colors.primary : Assets.colors.danger,
                            life: 0.8 + Math.random() * 0.4,
                            size: Math.random() > 0.7 ? 3 : 2,
                            gravity: 100 + Math.random() * 50
                        });
                    }
                }
            }
        }
        
        // Add explosion core particles
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 100 + Math.random() * 100;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: Assets.colors.danger,
                life: 1.0,
                size: 4,
                gravity: 0
            });
        }
        
        // Add shockwave effect
        this.particles.push({
            x: centerX,
            y: centerY,
            vx: 0,
            vy: 0,
            color: Assets.colors.primary,
            life: 0.5,
            size: 1,
            isShockwave: true,
            radius: 0,
            maxRadius: 100
        });
    }

    update(deltaTime) {
        // Always update touch feedback animations
        for (let i = this.touchFeedback.length - 1; i >= 0; i--) {
            const feedback = this.touchFeedback[i];
            feedback.life -= deltaTime * 2;
            feedback.radius += deltaTime * 100;
            feedback.alpha = feedback.life * 0.5;
            
            if (feedback.life <= 0) {
                this.touchFeedback.splice(i, 1);
            }
        }
        
        // Always update button animations
        if (this.shootButton.pressAnimation > 0) {
            this.shootButton.pressAnimation -= deltaTime * 3;
        }
        
        if (this.state !== 'playing') return;
        
        // Update screen shake
        Utils.screenShake.update(deltaTime);
        
        // Update input
        this.updateKeyboardInput();
        
        // Update player
        if (this.player) {
            // For direct touch control, skip direction-based update when touching
            if (!this.useDirectTouch || !this.isTouching) {
                this.player.update(deltaTime, this.input.direction);
            } else {
                // Just update position and physics without directional input
                this.player.update(deltaTime, { x: 0, y: 0 });
            }
            
            // Handle shooting
            if (this.input.shooting) {
                this.playerShoot();
            }
            
            // Handle dash
            if (this.input.dash) {
                // Use swipe direction if available, otherwise use current movement direction
                let dashX = this.input.direction.x;
                let dashY = this.input.direction.y;
                
                if (this.player.dashDirection && (this.player.dashDirection.x !== 0 || this.player.dashDirection.y !== 0)) {
                    dashX = this.player.dashDirection.x;
                    dashY = this.player.dashDirection.y;
                    // Reset dash direction after use
                    this.player.dashDirection.x = 0;
                    this.player.dashDirection.y = 0;
                }
                
                this.player.dash(dashX, dashY);
                this.input.dash = false;
            }
        }
        
        // Update enemies
        let needDrop = false;
        for (let enemy of this.enemies) {
            enemy.update(deltaTime, this.enemies, this.player);
            if (enemy.formation === 'classic' && enemy.checkBounds(this.canvas.width)) {
                needDrop = true;
            }
            
            // Enemy shooting
            const bullet = enemy.shoot();
            if (bullet) {
                this.bullets.push(bullet);
            }
        }
        
        // Drop enemies if needed (only for classic formation)
        if (needDrop) {
            for (let enemy of this.enemies) {
                if (enemy.formation === 'classic') {
                    enemy.drop();
                }
            }
        }
        
        // Update boss
        if (this.boss) {
            this.boss.update(deltaTime, this.canvas.width);
            const bullets = this.boss.shoot();
            if (bullets) {
                this.bullets.push(...bullets);
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime);
            
            // Remove off-screen bullets
            if (bullet.y < -10 || bullet.y > this.canvas.height + 10) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collisions
            if (bullet.isPlayerBullet) {
                // Check enemy collisions
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (Utils.checkCollision(bullet, enemy)) {
                        if (enemy.hit()) {
                            // Enemy destroyed
                            this.score += enemy.points;
                            this.particles.push(...Utils.createParticles(
                                enemy.x + enemy.width / 2,
                                enemy.y + enemy.height / 2,
                                Assets.colors.primary,
                                15
                            ));
                            this.spawnPowerup(enemy.x + enemy.width / 2, enemy.y);
                            this.enemies.splice(j, 1);
                            Audio.play('explosion');
                            Utils.screenShake.add(5, 0.2);
                        }
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
                
                // Check boss collision
                if (this.boss && Utils.checkCollision(bullet, this.boss)) {
                    if (this.boss.hit()) {
                        // Boss destroyed
                        this.score += this.boss.points;
                        this.particles.push(...Utils.createParticles(
                            this.boss.x + this.boss.width / 2,
                            this.boss.y + this.boss.height / 2,
                            Assets.colors.boss,
                            30
                        ));
                        this.boss = null;
                        Audio.play('explosion');
                        Utils.screenShake.add(15, 0.5);
                    }
                    this.bullets.splice(i, 1);
                }
            } else {
                // Check player collision
                if (this.player && Utils.checkCollision(bullet, this.player)) {
                    if (this.player.hit()) {
                        this.player.lives--;
                        
                        // Create ship disintegration effect
                        this.createShipDisintegration();
                        
                        Audio.play('explosion');
                        Utils.screenShake.add(15, 0.5); // Increased shake
                        
                        if (this.player.lives <= 0) {
                            this.gameOver();
                        } else {
                            // Respawn effect
                            this.player.respawning = true;
                            this.player.respawnTimer = 1.5; // 1.5 seconds of invulnerability
                        }
                    }
                    this.bullets.splice(i, 1);
                }
            }
        }
        
        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.update(deltaTime);
            
            // Remove off-screen powerups
            if (powerup.y > this.canvas.height + 10) {
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Check player collision
            if (this.player && Utils.checkCollision(powerup, this.player)) {
                this.player.addPowerup(powerup.type);
                this.score += 50;
                Audio.play('powerup');
                this.powerups.splice(i, 1);
            }
        }
        
        // Update particles
        Utils.updateParticles(this.particles, deltaTime);
        
        // Check for extra life
        if (this.score >= this.nextExtraLifeScore && this.player) {
            this.player.lives = Math.min(this.player.lives + 1, 5); // Max 5 lives
            this.extraLifeNotification = '1UP!';
            this.notificationTimer = 2.0; // Show for 2 seconds
            Audio.play('powerup');
            
            // Set next milestone
            this.nextExtraLifeScore += this.extraLifeIncrement;
            
            // Create celebration particles
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const speed = 100 + Math.random() * 100;
                this.particles.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height / 2,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: Assets.colors.powerup,
                    life: 1.0,
                    size: 3
                });
            }
        }
        
        // Update notification timer
        if (this.notificationTimer > 0) {
            this.notificationTimer -= deltaTime;
        }
        
        // Check wave completion
        if (this.enemies.length === 0 && !this.boss) {
            this.wave++;
            this.createEnemyWave();
            // Bonus points for completing wave
            this.score += 100 * this.wave;
        }
        
        // Removed the "enemies reach player" game over condition
        // Game now only ends when player loses all lives
        // This allows for more dynamic combat with swarm AI
        
        // Update UI
        this.updateUI();
    }

    updateUI() {
        this.scoreElement.textContent = Utils.formatScore(this.score);
        this.waveElement.textContent = this.wave;
        this.livesElement.textContent = this.player ? this.player.lives : 0;
        this.highScoreElement.textContent = Utils.formatScore(this.highScore);
    }

    render() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a2a');
        gradient.addColorStop(0.5, '#0a0a1a');
        gradient.addColorStop(1, '#1a0a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add stars background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 73 + Date.now() * 0.01) % this.canvas.width;
            const y = (i * 137) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }
        
        // Apply screen shake
        const shakeOffset = Utils.screenShake.getOffset();
        this.ctx.save();
        this.ctx.translate(shakeOffset.x, shakeOffset.y);
        
        // Draw game objects
        if (this.state === 'playing' || this.state === 'paused') {
            // Draw enemies
            for (let enemy of this.enemies) {
                enemy.draw(this.ctx);
            }
            
            // Draw boss
            if (this.boss) {
                this.boss.draw(this.ctx);
            }
            
            // Draw player
            if (this.player) {
                this.player.draw(this.ctx);
            }
            
            // Draw bullets
            for (let bullet of this.bullets) {
                bullet.draw(this.ctx);
            }
            
            // Draw powerups
            for (let powerup of this.powerups) {
                powerup.draw(this.ctx);
            }
            
            // Draw particles
            Utils.drawParticles(this.ctx, this.particles);
        }
        
        this.ctx.restore();
        
        // Draw touch feedback ripples
        for (let feedback of this.touchFeedback) {
            this.ctx.save();
            this.ctx.globalAlpha = feedback.alpha;
            this.ctx.strokeStyle = Assets.colors.primary;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(feedback.x, feedback.y, feedback.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        // Draw touch controls feedback
        if (this.isTouching && this.state === 'playing') {
            if (this.useDirectTouch) {
                // Draw touch indicator for direct control (only within touchpad)
                const withinTouchpad = this.touchCurrentX >= this.touchpad.x && 
                                     this.touchCurrentX <= this.touchpad.x + this.touchpad.width &&
                                     this.touchCurrentY >= this.touchpad.y && 
                                     this.touchCurrentY <= this.touchpad.y + this.touchpad.height;
                
                if (withinTouchpad) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.5;
                    
                    // Draw touch point
                    this.ctx.strokeStyle = Assets.colors.primary;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(this.touchCurrentX, this.touchCurrentY, 15, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    // Draw inner dot
                    this.ctx.fillStyle = Assets.colors.primary;
                    this.ctx.beginPath();
                    this.ctx.arc(this.touchCurrentX, this.touchCurrentY, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Draw ship position indicator on touchpad
                    const touchpadRelX = (this.touchCurrentX - this.touchpad.x) / this.touchpad.width;
                    const touchpadRelY = (this.touchCurrentY - this.touchpad.y) / this.touchpad.height;
                    
                    // Show where this maps to on screen with a small ship icon
                    if (this.player) {
                        const indicatorX = this.touchpad.x + touchpadRelX * this.touchpad.width;
                        const indicatorY = this.touchpad.y + touchpadRelY * this.touchpad.height;
                        
                        // Draw mini ship indicator
                        this.ctx.globalAlpha = 0.7;
                        Assets.drawSprite(
                            this.ctx, 
                            Assets.sprites.player, 
                            indicatorX - 6, 
                            indicatorY - 6, 
                            1, 
                            Assets.colors.primary
                        );
                    }
                    
                    this.ctx.restore();
                }
            } else {
                // Virtual joystick for non-direct control
            // Draw virtual joystick background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(this.touchStartX, this.touchStartY, 85, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw virtual joystick
            this.ctx.globalAlpha = 0.5;
            
            // Outer circle
            this.ctx.strokeStyle = Assets.colors.primary;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.touchStartX, this.touchStartY, 80, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Inner circle (thumb position)
            const deltaX = this.touchCurrentX - this.touchStartX;
            const deltaY = this.touchCurrentY - this.touchStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDist = 80;
            
            let thumbX = this.touchCurrentX;
            let thumbY = this.touchCurrentY;
            
            if (distance > maxDist) {
                thumbX = this.touchStartX + (deltaX / distance) * maxDist;
                thumbY = this.touchStartY + (deltaY / distance) * maxDist;
            }
            
            this.ctx.fillStyle = Assets.colors.primary;
            this.ctx.beginPath();
            this.ctx.arc(thumbX, thumbY, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1;
            }
        }
        
        // Draw mobile controls
        if (this.state === 'playing' && 'ontouchstart' in window) {
            // Draw touchpad area
            if (this.touchpad.visible) {
                this.ctx.save();
                
                // Draw touchpad background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(this.touchpad.x, this.touchpad.y, this.touchpad.width, this.touchpad.height);
                
                // Draw touchpad border
                this.ctx.strokeStyle = this.isTouching ? Assets.colors.primary : 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(this.touchpad.x, this.touchpad.y, this.touchpad.width, this.touchpad.height);
                
                // Draw grid lines for reference
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 1;
                
                // Vertical center line
                const centerX = this.touchpad.x + this.touchpad.width / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, this.touchpad.y);
                this.ctx.lineTo(centerX, this.touchpad.y + this.touchpad.height);
                this.ctx.stroke();
                
                // Horizontal center line
                const centerY = this.touchpad.y + this.touchpad.height / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.touchpad.x, centerY);
                this.ctx.lineTo(this.touchpad.x + this.touchpad.width, centerY);
                this.ctx.stroke();
                
                // Label
                this.ctx.font = '12px monospace';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('MOVE', centerX, this.touchpad.y - 5);
                
                this.ctx.restore();
            }
            
            // Draw shoot button
            this.ctx.save();
            
            // Button scale animation when pressed
            const buttonScale = 1 - (this.shootButton.pressAnimation * 0.1);
            const buttonCenterX = this.shootButton.x + this.shootButton.width / 2;
            const buttonCenterY = this.shootButton.y + this.shootButton.height / 2;
            
            this.ctx.translate(buttonCenterX, buttonCenterY);
            this.ctx.scale(buttonScale, buttonScale);
            this.ctx.translate(-buttonCenterX, -buttonCenterY);
            
            // Button background with transparency
            const buttonAlpha = this.shootButton.pressed ? 0.6 : 0.3;
            this.ctx.globalAlpha = buttonAlpha;
            
            // Circular button background
            this.ctx.fillStyle = Assets.colors.danger;
            this.ctx.beginPath();
            this.ctx.arc(
                this.shootButton.x + this.shootButton.width / 2,
                this.shootButton.y + this.shootButton.height / 2,
                this.shootButton.width / 2,
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            // Button border with glow when pressed
            this.ctx.globalAlpha = this.shootButton.pressed ? 1.0 : 0.8;
            this.ctx.strokeStyle = Assets.colors.danger;
            this.ctx.lineWidth = this.shootButton.pressed ? 4 : 3;
            if (this.shootButton.pressed) {
                this.ctx.shadowColor = Assets.colors.danger;
                this.ctx.shadowBlur = 10;
            }
            this.ctx.stroke();
            
            // Fire icon/text
            this.ctx.globalAlpha = 1;
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `bold ${Math.floor(this.shootButton.width * 0.3)}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                'FIRE',
                this.shootButton.x + this.shootButton.width / 2,
                this.shootButton.y + this.shootButton.height / 2
            );
            
            this.ctx.restore();
            
            // Draw pause button
            this.ctx.save();
            
            // Pause button background
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(this.pauseButton.x, this.pauseButton.y, this.pauseButton.width, this.pauseButton.height);
            
            // Pause button border
            this.ctx.globalAlpha = 0.6;
            this.ctx.strokeStyle = Assets.colors.secondary;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.pauseButton.x, this.pauseButton.y, this.pauseButton.width, this.pauseButton.height);
            
            // Pause icon (two vertical bars)
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = Assets.colors.secondary;
            const barWidth = this.pauseButton.width * 0.2;
            const barHeight = this.pauseButton.height * 0.6;
            const barSpacing = this.pauseButton.width * 0.15;
            const barY = this.pauseButton.y + (this.pauseButton.height - barHeight) / 2;
            
            // Left bar
            this.ctx.fillRect(
                this.pauseButton.x + (this.pauseButton.width / 2) - barSpacing - barWidth,
                barY,
                barWidth,
                barHeight
            );
            
            // Right bar
            this.ctx.fillRect(
                this.pauseButton.x + (this.pauseButton.width / 2) + barSpacing,
                barY,
                barWidth,
                barHeight
            );
            
            this.ctx.restore();
            
            // Draw hands toggle button
            this.ctx.save();
            
            // Hands button background
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(this.handsButton.x, this.handsButton.y, this.handsButton.width, this.handsButton.height);
            
            // Hands button border
            this.ctx.globalAlpha = 0.6;
            this.ctx.strokeStyle = Assets.colors.warning;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.handsButton.x, this.handsButton.y, this.handsButton.width, this.handsButton.height);
            
            // Hand icon (simple representation)
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = Assets.colors.warning;
            this.ctx.font = `${Math.floor(this.handsButton.width * 0.6)}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                this.leftHanded ? 'L' : 'R',
                this.handsButton.x + this.handsButton.width / 2,
                this.handsButton.y + this.handsButton.height / 2
            );
            
            this.ctx.restore();
            
        }
        
        // Draw dash cooldown indicator
        if (this.player && this.player.dashCooldownTimer > 0) {
            const barWidth = 60;
            const barHeight = 4;
            const barX = this.player.x + (this.player.width - barWidth) / 2;
            const barY = this.player.y - 10;
            
            // Background
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Cooldown progress
            const progress = 1 - (this.player.dashCooldownTimer / this.player.dashCooldown);
            this.ctx.fillStyle = Assets.colors.powerup;
            this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        }
        
        // Draw UI elements at top of canvas
        this.ctx.font = '16px "Courier New", monospace';
        this.ctx.textAlign = 'left';
        const topPadding = 25;
        
        // Score
        this.ctx.fillStyle = Assets.colors.primary;
        this.ctx.fillText(`SCORE: ${Utils.formatScore(this.score)}`, 10, topPadding);
        
        // High Score
        this.ctx.fillStyle = Assets.colors.secondary;
        this.ctx.fillText(`HIGH: ${Utils.formatScore(this.highScore)}`, 150, topPadding);
        
        // Wave
        this.ctx.fillStyle = Assets.colors.warning;
        this.ctx.fillText(`WAVE: ${this.wave}`, 280, topPadding);
        
        // Lives text
        this.ctx.fillStyle = Assets.colors.danger;
        this.ctx.fillText(`LIVES:`, 10, topPadding + 25);
        
        // Draw remaining lives (ships) next to lives text
        if (this.player && this.player.lives > 0) {
            const shipScale = 1.5;
            const shipSpacing = 20;
            const startX = 70;
            const startY = topPadding + 12;
            
            for (let i = 0; i < this.player.lives; i++) {
                Assets.drawSprite(
                    this.ctx, 
                    Assets.sprites.player, 
                    startX + i * shipSpacing, 
                    startY, 
                    shipScale, 
                    Assets.colors.danger
                );
            }
        }
        
        // Draw next extra life score indicator
        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.fillStyle = Assets.colors.powerup;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`NEXT 1UP: ${Utils.formatScore(this.nextExtraLifeScore)}`, this.canvas.width - 10, topPadding + 25);
        
        // Draw handedness indicator on mobile
        if ('ontouchstart' in window) {
            this.ctx.font = '10px "Courier New", monospace';
            this.ctx.fillStyle = Assets.colors.secondary;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.leftHanded ? 'LEFT-HANDED MODE' : 'RIGHT-HANDED MODE', 
                this.canvas.width / 2, 
                this.canvas.height - 10
            );
        }
        
        // Draw extra life notification
        if (this.notificationTimer > 0 && this.extraLifeNotification) {
            const alpha = Math.min(this.notificationTimer, 1.0);
            const scale = 1 + (2 - this.notificationTimer) * 0.5;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = `${32 * scale}px "Courier New", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = Assets.colors.powerup;
            this.ctx.shadowColor = Assets.colors.powerup;
            this.ctx.shadowBlur = 20;
            
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2 - 100;
            
            // Draw the notification with animation
            this.ctx.fillText(this.extraLifeNotification, centerX, centerY);
            
            // Draw bonus ship icon
            Assets.drawSprite(
                this.ctx,
                Assets.sprites.player,
                centerX - 15,
                centerY + 10,
                3 * scale,
                Assets.colors.powerup
            );
            
            this.ctx.restore();
        }
        
        // Draw scanline effect with new color
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.015)';
        for (let i = 0; i < this.canvas.height; i += 3) {
            this.ctx.fillRect(0, i, this.canvas.width, 1);
        }
        
        // Add vignette effect
        const vignette = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game over overlay if needed
        if (this.state === 'gameover') {
            this.renderGameOver(this.lastDeltaTime || 0.016);
        }
    }

    gameLoop(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.lastDeltaTime = deltaTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    renderGameOver(deltaTime) {
        const anim = this.gameOverAnimation;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Update animation
        anim.phase += deltaTime;
        anim.overlayAlpha = Math.min(anim.overlayAlpha + deltaTime * 0.5, 0.7);
        
        if (anim.phase > 0.5) {
            anim.textScale = Math.min(anim.textScale + deltaTime * 3, 1);
        }
        if (anim.phase > 1) {
            anim.statsAlpha = Math.min(anim.statsAlpha + deltaTime * 2, 1);
        }
        if (anim.phase > 1.5) {
            anim.buttonAlpha = Math.min(anim.buttonAlpha + deltaTime * 2, 1);
        }
        
        // Draw dark overlay
        this.ctx.fillStyle = `rgba(10, 10, 26, ${anim.overlayAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw GAME OVER text with animation
        if (anim.textScale > 0) {
            this.ctx.save();
            this.ctx.translate(centerX, centerY - 100);
            this.ctx.scale(anim.textScale, anim.textScale);
            
            // Text shadow/glow
            this.ctx.shadowColor = Assets.colors.danger;
            this.ctx.shadowBlur = 20;
            
            // Main text
            this.ctx.font = 'bold 48px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = Assets.colors.danger;
            this.ctx.fillText('GAME OVER', 0, 0);
            
            this.ctx.restore();
        }
        
        // Draw stats
        if (anim.statsAlpha > 0) {
            this.ctx.globalAlpha = anim.statsAlpha;
            this.ctx.font = '24px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            
            // Final score
            this.ctx.fillStyle = Assets.colors.primary;
            this.ctx.fillText(`FINAL SCORE: ${Utils.formatScore(this.score)}`, centerX, centerY);
            
            // High score
            const highScoreY = centerY + 40;
            if (this.newHighScore) {
                // Flashing effect for new high score
                const flash = Math.sin(Date.now() * 0.01) > 0;
                this.ctx.fillStyle = flash ? Assets.colors.powerup : Assets.colors.warning;
                this.ctx.fillText(`NEW HIGH SCORE!`, centerX, highScoreY);
            } else {
                this.ctx.fillStyle = Assets.colors.secondary;
                this.ctx.fillText(`HIGH SCORE: ${Utils.formatScore(this.highScore)}`, centerX, highScoreY);
            }
            
            // Wave reached
            this.ctx.fillStyle = Assets.colors.warning;
            this.ctx.fillText(`WAVES SURVIVED: ${this.wave}`, centerX, centerY + 80);
            
            this.ctx.globalAlpha = 1;
        }
        
        // Draw restart prompt
        if (anim.buttonAlpha > 0) {
            this.ctx.globalAlpha = anim.buttonAlpha;
            
            // Button background
            const buttonY = centerY + 140;
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = centerX - buttonWidth / 2;
            
            // Glow effect
            const glowIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
            this.ctx.shadowColor = Assets.colors.primary;
            this.ctx.shadowBlur = 20 * glowIntensity;
            
            // Button border
            this.ctx.strokeStyle = Assets.colors.primary;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Button text
            this.ctx.shadowBlur = 0;
            this.ctx.font = '20px "Courier New", monospace';
            this.ctx.fillStyle = Assets.colors.primary;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PRESS SPACE TO RESTART', centerX, buttonY + 30);
            
            // Mobile instruction
            this.ctx.font = '16px "Courier New", monospace';
            this.ctx.fillStyle = Assets.colors.secondary;
            this.ctx.fillText('or tap to continue', centerX, buttonY + 70);
            
            this.ctx.globalAlpha = 1;
        }
    }
}