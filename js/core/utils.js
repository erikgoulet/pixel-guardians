// Utility functions for Pixel Guardians

const Utils = {
    // Collision detection
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    },

    // Random number generator
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Linear interpolation
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    // Create particle effect
    createParticles(x, y, color, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: color,
                size: Utils.random(2, 4)
            });
        }
        return particles;
    },

    // Update particles
    updateParticles(particles, deltaTime) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            if (p.isShockwave) {
                // Handle shockwave particles
                p.radius += 200 * deltaTime;
                p.life -= deltaTime * 2;
                if (p.radius > p.maxRadius || p.life <= 0) {
                    particles.splice(i, 1);
                }
            } else {
                // Normal particle physics with deltaTime
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                
                // Apply gravity if present
                if (p.gravity) {
                    p.vy += p.gravity * deltaTime;
                }
                
                // Fade out
                p.life -= deltaTime * 2;
                p.size *= 0.98;
                
                if (p.life <= 0 || p.size < 0.5) {
                    particles.splice(i, 1);
                }
            }
        }
    },

    // Draw particles
    drawParticles(ctx, particles) {
        particles.forEach(p => {
            if (p.isShockwave) {
                // Draw expanding shockwave
                ctx.globalAlpha = p.life * 0.5;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Draw normal particle
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                
                // Add glow for larger particles
                if (p.size > 3) {
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = p.size;
                }
                
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
                ctx.shadowBlur = 0;
            }
        });
        ctx.globalAlpha = 1;
    },

    // Save high score to localStorage
    saveHighScore(score) {
        const highScore = this.getHighScore();
        if (score > highScore) {
            localStorage.setItem('pixelGuardiansHighScore', score);
            return true;
        }
        return false;
    },

    // Get high score from localStorage
    getHighScore() {
        return parseInt(localStorage.getItem('pixelGuardiansHighScore')) || 0;
    },

    // Format number with leading zeros
    formatScore(score, digits = 6) {
        return score.toString().padStart(digits, '0');
    },

    // Screen shake effect
    screenShake: {
        intensity: 0,
        duration: 0,
        update(deltaTime) {
            if (this.duration > 0) {
                this.duration -= deltaTime;
                if (this.duration <= 0) {
                    this.intensity = 0;
                }
            }
        },
        add(intensity, duration) {
            this.intensity = Math.max(this.intensity, intensity);
            this.duration = Math.max(this.duration, duration);
        },
        getOffset() {
            if (this.duration > 0) {
                return {
                    x: (Math.random() - 0.5) * this.intensity,
                    y: (Math.random() - 0.5) * this.intensity
                };
            }
            return { x: 0, y: 0 };
        }
    }
};