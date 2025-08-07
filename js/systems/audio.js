// Audio system for sound effects

const Audio = {
    enabled: true,
    audioContext: null,
    sounds: {},
    
    // Soundtrack properties
    soundtrack: {
        isPlaying: false,
        oscillators: [],
        gainNode: null,
        filterNode: null,
        currentNoteIndex: 0,
        noteInterval: null,
        // D Dorian scale notes (D, E, F, G, A, B, C)
        // Using a 3-note pattern: Root, Minor 3rd, 5th, Major 6th
        noteSequence: [
            146.83, // D3
            174.61, // F3
            220.00, // A3
            246.94, // B3
            220.00, // A3
            174.61  // F3
        ],
        tempo: 120 // BPM
    },

    // Initialize audio context
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
            console.log('Audio initialized successfully');
        } catch (e) {
            console.log('Web Audio API not supported', e);
            this.enabled = false;
        }
    },

    // Create synthesized sound effects
    createSounds() {
        if (!this.enabled) return;

        // Define sound configurations
        const soundConfigs = {
            shoot: { frequency: 800, duration: 0.1, type: 'square', volume: 0.1 },
            hit: { frequency: 200, duration: 0.2, type: 'sawtooth', volume: 0.2 },
            explosion: { frequency: 100, duration: 0.5, type: 'noise', volume: 0.3 },
            powerup: { frequency: 600, duration: 0.3, type: 'sine', volume: 0.2 },
            enemyShoot: { frequency: 400, duration: 0.1, type: 'triangle', volume: 0.1 }
        };

        // Create each sound
        for (const [name, config] of Object.entries(soundConfigs)) {
            this.sounds[name] = () => this.playTone(config);
        }
    },

    // Play a synthesized tone
    playTone(config) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Configure sound
        if (config.type === 'noise') {
            // Create white noise for explosions
            const bufferSize = this.audioContext.sampleRate * config.duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;
            noise.connect(gainNode);
            
            gainNode.gain.setValueAtTime(config.volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
            
            noise.start(now);
            noise.stop(now + config.duration);
        } else {
            oscillator.type = config.type;
            oscillator.frequency.setValueAtTime(config.frequency, now);
            
            // Envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
            
            oscillator.start(now);
            oscillator.stop(now + config.duration);
        }
    },

    // Play a specific sound
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    },

    // Toggle audio on/off
    toggle() {
        this.enabled = !this.enabled;
        
        // Mute/unmute soundtrack gain instead of stopping it
        if (this.soundtrack.gainNode) {
            if (this.enabled) {
                // Unmute - ramp up volume
                this.soundtrack.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.soundtrack.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                this.soundtrack.gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
            } else {
                // Mute - ramp down volume
                this.soundtrack.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.soundtrack.gainNode.gain.setValueAtTime(this.soundtrack.gainNode.gain.value, this.audioContext.currentTime);
                this.soundtrack.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            }
        }
        
        return this.enabled;
    },

    // Resume audio context (needed for mobile)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('Resuming suspended audio context');
            return this.audioContext.resume();
        }
        return Promise.resolve();
    },
    
    // Test soundtrack with a simple note
    testSoundtrack() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = 220; // A3
        osc.type = 'sine';
        gain.gain.value = 0.2;
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
        
        console.log('Test note played');
    },
    
    // Start menu soundtrack
    startSoundtrack() {
        console.log('Starting soundtrack...', { enabled: this.enabled, context: !!this.audioContext, isPlaying: this.soundtrack.isPlaying });
        if (!this.enabled || !this.audioContext) return;
        
        // If already playing, don't restart
        if (this.soundtrack.isPlaying) {
            console.log('Soundtrack already playing, skipping');
            return;
        }
        
        // Resume context if needed
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed');
                this._startSoundtrackInternal();
            });
        } else {
            this._startSoundtrackInternal();
        }
    },
    
    _startSoundtrackInternal() {
        try {
            this.soundtrack.isPlaying = true;
            
            // Create simple gain node only
            this.soundtrack.gainNode = this.audioContext.createGain();
            this.soundtrack.gainNode.connect(this.audioContext.destination);
            
            // Set volume to 0.3 immediately for testing
            this.soundtrack.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            
            // Reset note index
            this.soundtrack.currentNoteIndex = 0;
            
            // Don't call createAmbientPad - it's broken
            // this.createAmbientPad();
            
            // Start arpeggiator with simple interval
            const beatDuration = 250; // 250ms per note
            this.soundtrack.noteInterval = setInterval(() => {
                this.playNextNote();
            }, beatDuration);
            
            // Play first note immediately
            this.playNextNote();
            
            console.log('Soundtrack started');
        } catch (e) {
            console.error('Error starting soundtrack:', e);
            this.soundtrack.isPlaying = false;
        }
    },
    
    // Stop menu soundtrack
    stopSoundtrack() {
        if (!this.soundtrack.isPlaying) return;
        
        this.soundtrack.isPlaying = false;
        
        // Clear interval immediately
        if (this.soundtrack.noteInterval) {
            clearInterval(this.soundtrack.noteInterval);
            this.soundtrack.noteInterval = null;
        }
        
        // Immediately disconnect and cleanup
        if (this.soundtrack.gainNode) {
            try {
                this.soundtrack.gainNode.disconnect();
            } catch (e) {}
            this.soundtrack.gainNode = null;
        }
        
        if (this.soundtrack.filterNode) {
            try {
                this.soundtrack.filterNode.disconnect();
            } catch (e) {}
            this.soundtrack.filterNode = null;
        }
        
        // Stop any remaining oscillators
        this.soundtrack.oscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {}
        });
        this.soundtrack.oscillators = [];
        
        // Reset note index
        this.soundtrack.currentNoteIndex = 0;
    },
    
    // Play next note in arpeggio
    playNextNote() {
        if (!this.soundtrack.isPlaying || !this.audioContext || !this.enabled) return;
        
        try {
            const now = this.audioContext.currentTime;
            const note = this.soundtrack.noteSequence[this.soundtrack.currentNoteIndex];
            
            // Create simple oscillator and gain
            const osc = this.audioContext.createOscillator();
            const noteGain = this.audioContext.createGain();
            
            // Configure oscillator
            osc.type = 'sine';
            osc.frequency.value = note;
            
            // Set note volume
            noteGain.gain.value = 0.15;
            
            // Connect through main gain node for proper muting
            osc.connect(noteGain);
            if (this.soundtrack.gainNode) {
                noteGain.connect(this.soundtrack.gainNode);
            } else {
                noteGain.connect(this.audioContext.destination);
            }
            
            // Play
            osc.start(now);
            osc.stop(now + 0.25);
            
            // Move to next note
            this.soundtrack.currentNoteIndex = (this.soundtrack.currentNoteIndex + 1) % this.soundtrack.noteSequence.length;
            
            console.log('Note played:', note, 'Hz');
        } catch (e) {
            console.error('Error in playNextNote:', e);
        }
    },
    
    // Create ambient pad for atmosphere
    createAmbientPad() {
        // Disabled - was causing issues
        return;
    }
};