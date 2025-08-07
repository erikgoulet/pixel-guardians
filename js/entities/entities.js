// Game entity classes

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.sprite = Assets.sprites.player;
        this.scale = 3;
        const size = Assets.getSpriteSize(this.sprite, this.scale);
        this.width = size.width;
        this.height = size.height;
        this.speed = 300;
        this.lives = 3;
        this.powerups = {
            tripleShot: 0,
            rapidFire: 0,
            shield: 0
        };
        this.shieldAlpha = 0;
        this.canShoot = true;
        this.shootCooldown = 0;
        
        // Movement physics
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 1600; // Increased for more responsive control
        this.friction = 0.88; // Balanced friction for responsive but smooth movement
        this.maxSpeed = 400; // Increased for better touchpad tracking
        
        // Movement constraints (will be updated in setCanvas)
        this.minY = 400; // Default, updated when canvas is set
        this.maxY = 600; // Default, updated when canvas is set
        
        // Dash ability
        this.dashSpeed = 800;
        this.dashDuration = 0.2;
        this.dashCooldown = 0.5;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.dashDirection = { x: 0, y: 0 };
        
        // Engine trail effect
        this.engineParticles = [];
        
        // Respawn state
        this.respawning = false;
        this.respawnTimer = 0;
    }

    update(deltaTime, inputDir) {
        // Update respawn invulnerability
        if (this.respawning) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawning = false;
            }
        }
        
        // Update dash
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }
        
        // Update dash cooldown
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer -= deltaTime;
        }
        
        // Apply movement
        if (this.isDashing) {
            // During dash, use dash velocity
            this.vx = this.dashDirection.x * this.dashSpeed;
            this.vy = this.dashDirection.y * this.dashSpeed;
        } else {
            // Normal movement with acceleration and friction
            if (inputDir.x !== 0) {
                this.vx += inputDir.x * this.acceleration * deltaTime;
            } else {
                this.vx *= this.friction;
            }
            
            if (inputDir.y !== 0) {
                this.vy += inputDir.y * this.acceleration * deltaTime;
            } else {
                this.vy *= this.friction;
            }
            
            // Clamp velocity
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > this.maxSpeed) {
                this.vx = (this.vx / speed) * this.maxSpeed;
                this.vy = (this.vy / speed) * this.maxSpeed;
            }
        }
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Keep player on screen
        this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
        this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
        
        // Update cooldowns
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
            if (this.shootCooldown <= 0) {
                this.canShoot = true;
            }
        }

        // Update powerup timers
        for (let powerup in this.powerups) {
            if (this.powerups[powerup] > 0) {
                this.powerups[powerup] -= deltaTime;
            }
        }

        // Shield animation
        if (this.powerups.shield > 0) {
            this.shieldAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        }
    }

    shoot() {
        if (!this.canShoot) return null;

        const bullets = [];
        const bulletY = this.y - 10;
        const cooldown = this.powerups.rapidFire > 0 ? 0.1 : 0.3;

        if (this.powerups.tripleShot > 0) {
            bullets.push(
                new Bullet(this.x + this.width / 2 - 15, bulletY, -500, true),
                new Bullet(this.x + this.width / 2, bulletY, -500, true),
                new Bullet(this.x + this.width / 2 + 15, bulletY, -500, true)
            );
        } else {
            bullets.push(new Bullet(this.x + this.width / 2, bulletY, -500, true));
        }

        this.canShoot = false;
        this.shootCooldown = cooldown;
        Audio.play('shoot');

        return bullets;
    }

    draw(ctx) {
        // Respawn flashing effect
        if (this.respawning) {
            const flash = Math.sin(Date.now() * 0.02) > 0;
            if (flash) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        // Draw engine trail
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 50 || this.isDashing) {
            // Add new particle
            this.engineParticles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 6,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * 20,
                vy: 50 + Math.random() * 30,
                life: 1.0,
                size: 2 + Math.random() * 2
            });
        }
        
        // Update and draw particles
        for (let i = this.engineParticles.length - 1; i >= 0; i--) {
            const p = this.engineParticles[i];
            p.life -= 0.05;
            p.x += p.vx * 0.05;
            p.y += p.vy * 0.05;
            
            if (p.life <= 0) {
                this.engineParticles.splice(i, 1);
                continue;
            }
            
            ctx.globalAlpha = p.life;
            ctx.fillStyle = this.isDashing ? Assets.colors.powerup : Assets.colors.primary;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        
        // Add dash effect
        if (this.isDashing) {
            ctx.globalAlpha = 0.5;
            Assets.drawSprite(ctx, this.sprite, this.x - this.vx * 0.05, this.y - this.vy * 0.05, this.scale, Assets.colors.primary);
            ctx.globalAlpha = 0.3;
            Assets.drawSprite(ctx, this.sprite, this.x - this.vx * 0.1, this.y - this.vy * 0.1, this.scale, Assets.colors.primary);
            ctx.globalAlpha = 1;
        }
        
        Assets.drawSprite(ctx, this.sprite, this.x, this.y, this.scale, Assets.colors.primary);
        
        // Reset alpha after respawn effect
        if (this.respawning) {
            ctx.globalAlpha = 1;
        }
        
        // Draw shield
        if (this.powerups.shield > 0) {
            ctx.strokeStyle = Assets.colors.powerup;
            ctx.globalAlpha = this.shieldAlpha;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width * 0.7,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    hit() {
        // Invulnerable during dash or respawn
        if (this.isDashing || this.respawning) {
            return false;
        }
        
        if (this.powerups.shield > 0) {
            // Shield absorbs the hit but doesn't break
            return false; // Shield absorbed the hit
        }
        return true; // Player takes damage
    }
    
    dash(dirX, dirY) {
        if (this.dashCooldownTimer > 0 || this.isDashing) return;
        
        // If no direction provided, use current velocity direction
        if (dirX === 0 && dirY === 0) {
            if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                dirX = this.vx / speed;
                dirY = this.vy / speed;
            } else {
                return; // No dash if not moving and no direction given
            }
        }
        
        // Normalize direction
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        if (length > 0) {
            this.dashDirection.x = dirX / length;
            this.dashDirection.y = dirY / length;
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldownTimer = this.dashCooldown;
            Audio.play('powerup'); // Use powerup sound for dash
        }
    }
    
    setCanvas(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.minY = height * 0.5; // Can move up to 50% of screen
        this.maxY = height - this.height - 20;
    }
    
    // Direct position control for touchpad
    setTargetPosition(targetX, targetY) {
        // Calculate direction to target
        const dx = targetX - (this.x + this.width / 2);
        const dy = targetY - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Strong acceleration towards target for responsive control
            const force = Math.min(distance / 50, 1) * 2; // Scale force by distance
            this.vx += (dx / distance) * this.acceleration * force * 0.016;
            this.vy += (dy / distance) * this.acceleration * force * 0.016;
            
            // Apply stronger friction when close to target
            if (distance < 30) {
                this.vx *= 0.8;
                this.vy *= 0.8;
            }
        } else {
            // Stop when very close
            this.vx *= 0.7;
            this.vy *= 0.7;
        }
        
        // Clamp velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }

    addPowerup(type) {
        switch(type) {
            case 'triple':
                this.powerups.tripleShot = 10; // 10 seconds
                break;
            case 'rapid':
                this.powerups.rapidFire = 10;
                break;
            case 'shield':
                this.powerups.shield = 15;
                break;
        }
    }
}

class Enemy {
    constructor(x, y, type, wave, formation = 'swarm') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.wave = wave;
        this.formation = formation;
        
        // Set sprite and properties based on type
        const enemyTypes = ['enemy1', 'enemy2', 'enemy3', 'enemy4'];
        this.sprite = Assets.sprites[enemyTypes[Math.min(type - 1, 3)]];
        this.scale = 2;
        
        const size = Assets.getSpriteSize(this.sprite, this.scale);
        this.width = size.width;
        this.height = size.height;
        
        // Enemy properties scale with type
        this.health = type;
        this.maxHealth = type;
        this.points = type * 10;
        this.baseSpeed = 80 + (wave * 15);
        this.shootChance = 0.001 * type;
        
        // Swarm AI properties
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
        
        // Behavior state
        this.behavior = 'patrol'; // 'patrol', 'attack', 'retreat'
        this.behaviorTimer = Math.random() * 3;
        
        // Formation movement (legacy)
        this.direction = 1;
        this.dropDistance = 20;
        this.moveTimer = 0;
        this.moveInterval = Math.max(0.5 - (wave * 0.05), 0.1);
        
        // Visual
        this.hitFlash = 0;
        this.glowPhase = Math.random() * Math.PI * 2;
        
        // Swarm parameters
        this.separationRadius = 30;
        this.alignmentRadius = 60;
        this.cohesionRadius = 80;
        this.avoidanceRadius = 100;
        
        // Canvas dimensions (will be set by game)
        this.canvasWidth = 400;
        this.canvasHeight = 800;
    }
    
    setCanvas(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    update(deltaTime, allEnemies, player) {
        this.hitFlash = Math.max(0, this.hitFlash - deltaTime * 3);
        
        if (this.formation === 'classic') {
            // Original Space Invaders movement
            this.moveTimer += deltaTime;
            if (this.moveTimer >= this.moveInterval) {
                this.x += this.direction * 10;
                this.moveTimer = 0;
            }
        } else {
            // Swarm AI movement
            this.updateSwarmBehavior(deltaTime, allEnemies, player);
            
            // Apply velocity
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            
            // Keep enemies on screen
            const margin = 20;
            if (this.x < margin) {
                this.x = margin;
                this.vx = Math.abs(this.vx);
            } else if (this.x > this.canvasWidth - this.width - margin) {
                this.x = this.canvasWidth - this.width - margin;
                this.vx = -Math.abs(this.vx);
            }
            
            // Prevent going too high
            if (this.y < 30) {
                this.y = 30;
                this.vy = Math.abs(this.vy);
            }
        }
    }
    
    updateSwarmBehavior(deltaTime, allEnemies, player) {
        // Update behavior state
        this.behaviorTimer -= deltaTime;
        if (this.behaviorTimer <= 0) {
            // Change behavior periodically
            const behaviors = ['patrol', 'attack', 'flank'];
            this.behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
            this.behaviorTimer = 2 + Math.random() * 3;
            
            // Set new target for patrol
            if (this.behavior === 'patrol') {
                this.targetX = Math.random() * (this.canvasWidth - this.width);
                this.targetY = 50 + Math.random() * 200;
            }
        }
        
        // Calculate forces
        let fx = 0, fy = 0;
        
        // 1. Separation - avoid crowding neighbors
        const separation = this.calculateSeparation(allEnemies);
        fx += separation.x * 1.5;
        fy += separation.y * 1.5;
        
        // 2. Alignment - steer towards average heading of neighbors
        const alignment = this.calculateAlignment(allEnemies);
        fx += alignment.x * 0.8;
        fy += alignment.y * 0.8;
        
        // 3. Cohesion - steer towards center of neighbors
        const cohesion = this.calculateCohesion(allEnemies);
        fx += cohesion.x * 0.6;
        fy += cohesion.y * 0.6;
        
        // 4. Behavior-specific movement
        if (player) {
            switch (this.behavior) {
                case 'attack':
                    // Move towards player
                    const dx = player.x + player.width/2 - (this.x + this.width/2);
                    const dy = player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        fx += (dx / dist) * this.baseSpeed * 0.5;
                        fy += (dy / dist) * this.baseSpeed * 0.3;
                    }
                    break;
                    
                case 'flank':
                    // Move to the sides of player
                    const side = this.x > this.canvasWidth / 2 ? 1 : -1;
                    this.targetX = player.x + side * 150;
                    this.targetY = player.y - 100;
                    break;
                    
                case 'patrol':
                    // Move to target position
                    const tdx = this.targetX - this.x;
                    const tdy = this.targetY - this.y;
                    const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                    if (tdist > 10) {
                        fx += (tdx / tdist) * this.baseSpeed * 0.3;
                        fy += (tdy / tdist) * this.baseSpeed * 0.3;
                    }
                    break;
            }
        }
        
        // Apply forces with damping
        this.vx += fx * deltaTime;
        this.vy += fy * deltaTime;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = this.baseSpeed;
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }
        
        // Apply friction
        this.vx *= 0.95;
        this.vy *= 0.95;
    }
    
    calculateSeparation(enemies) {
        let sx = 0, sy = 0;
        let count = 0;
        
        for (let other of enemies) {
            if (other === this) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.separationRadius && dist > 0) {
                // Push away from neighbor
                sx += (dx / dist) * (this.separationRadius - dist);
                sy += (dy / dist) * (this.separationRadius - dist);
                count++;
            }
        }
        
        if (count > 0) {
            sx /= count;
            sy /= count;
        }
        
        return { x: sx, y: sy };
    }
    
    calculateAlignment(enemies) {
        let avgVx = 0, avgVy = 0;
        let count = 0;
        
        for (let other of enemies) {
            if (other === this) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.alignmentRadius) {
                avgVx += other.vx;
                avgVy += other.vy;
                count++;
            }
        }
        
        if (count > 0) {
            avgVx /= count;
            avgVy /= count;
            return { x: avgVx - this.vx, y: avgVy - this.vy };
        }
        
        return { x: 0, y: 0 };
    }
    
    calculateCohesion(enemies) {
        let centerX = 0, centerY = 0;
        let count = 0;
        
        for (let other of enemies) {
            if (other === this) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.cohesionRadius) {
                centerX += other.x;
                centerY += other.y;
                count++;
            }
        }
        
        if (count > 0) {
            centerX /= count;
            centerY /= count;
            
            const dx = centerX - this.x;
            const dy = centerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                return { x: (dx / dist) * 10, y: (dy / dist) * 10 };
            }
        }
        
        return { x: 0, y: 0 };
    }

    checkBounds(screenWidth) {
        if ((this.direction > 0 && this.x + this.width >= screenWidth - 20) ||
            (this.direction < 0 && this.x <= 20)) {
            return true; // Need to drop
        }
        return false;
    }

    drop() {
        this.y += this.dropDistance;
        this.direction *= -1;
    }

    shoot() {
        if (Math.random() < this.shootChance) {
            Audio.play('enemyShoot');
            return new Bullet(
                this.x + this.width / 2,
                this.y + this.height,
                300 + (this.type * 50),
                false
            );
        }
        return null;
    }

    hit() {
        this.health--;
        this.hitFlash = 1;
        Audio.play('hit');
        return this.health <= 0;
    }

    draw(ctx) {
        // Update glow animation
        this.glowPhase += 0.05;
        
        const baseColor = this.hitFlash > 0 ? Assets.colors.danger : 
                         this.type === 1 ? Assets.colors.enemy1 :
                         this.type === 2 ? Assets.colors.enemy2 :
                         this.type === 3 ? Assets.colors.enemy3 :
                         Assets.colors.enemy4;
        
        // Draw glow effect
        const glowIntensity = 0.3 + Math.sin(this.glowPhase) * 0.2;
        ctx.globalAlpha = glowIntensity;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
        Assets.drawSprite(ctx, this.sprite, this.x, this.y, this.scale * 1.1, baseColor);
        
        // Draw main sprite
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        Assets.drawSprite(ctx, this.sprite, this.x, this.y, this.scale, baseColor);
        
        // Health bar for enemies with more than 1 health
        if (this.maxHealth > 1) {
            const barWidth = this.width;
            const barHeight = 3;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = Assets.colors.dark;
            ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
            
            ctx.fillStyle = Assets.colors.primary;
            ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
        }
    }
}

class Boss {
    constructor(x, y, wave) {
        this.x = x;
        this.y = y;
        this.sprite = Assets.sprites.boss;
        this.scale = 4;
        
        const size = Assets.getSpriteSize(this.sprite, this.scale);
        this.width = size.width;
        this.height = size.height;
        
        this.health = 20 + (wave * 5);
        this.maxHealth = this.health;
        this.points = 500;
        this.speed = 100;
        this.direction = 1;
        
        this.shootTimer = 0;
        this.shootInterval = 1;
        this.movePattern = 0;
        this.patternTimer = 0;
        
        this.hitFlash = 0;
    }

    update(deltaTime, screenWidth) {
        this.hitFlash = Math.max(0, this.hitFlash - deltaTime * 3);
        this.shootTimer += deltaTime;
        this.patternTimer += deltaTime;
        
        // Movement patterns
        if (this.patternTimer > 2) {
            this.movePattern = (this.movePattern + 1) % 3;
            this.patternTimer = 0;
        }
        
        switch(this.movePattern) {
            case 0: // Horizontal movement
                this.x += this.direction * this.speed * deltaTime;
                if (this.x <= 20 || this.x + this.width >= screenWidth - 20) {
                    this.direction *= -1;
                }
                break;
            case 1: // Sine wave movement
                this.x += this.direction * this.speed * deltaTime;
                this.y += Math.sin(Date.now() * 0.003) * 2;
                if (this.x <= 20 || this.x + this.width >= screenWidth - 20) {
                    this.direction *= -1;
                }
                break;
            case 2: // Stationary burst fire
                // Stay in center
                const centerX = (screenWidth - this.width) / 2;
                this.x = Utils.lerp(this.x, centerX, deltaTime * 2);
                break;
        }
    }

    shoot() {
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            const bullets = [];
            
            if (this.movePattern === 2) {
                // Burst fire pattern
                for (let i = -2; i <= 2; i++) {
                    bullets.push(new Bullet(
                        this.x + this.width / 2 + (i * 15),
                        this.y + this.height,
                        200 + Math.abs(i) * 50,
                        false,
                        i * 0.1 // Angle
                    ));
                }
            } else {
                // Normal fire
                bullets.push(new Bullet(
                    this.x + this.width / 2,
                    this.y + this.height,
                    300,
                    false
                ));
            }
            
            Audio.play('enemyShoot');
            return bullets;
        }
        return null;
    }

    hit() {
        this.health--;
        this.hitFlash = 1;
        Audio.play('hit');
        return this.health <= 0;
    }

    draw(ctx) {
        const color = this.hitFlash > 0 ? Assets.colors.danger : Assets.colors.boss;
        Assets.drawSprite(ctx, this.sprite, this.x, this.y, this.scale, color);
        
        // Health bar
        const barWidth = this.width;
        const barHeight = 5;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = Assets.colors.dark;
        ctx.fillRect(this.x, this.y - 12, barWidth, barHeight);
        
        ctx.fillStyle = Assets.colors.boss;
        ctx.fillRect(this.x, this.y - 12, barWidth * healthPercent, barHeight);
    }
}

class Bullet {
    constructor(x, y, speed, isPlayerBullet, angle = 0) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.isPlayerBullet = isPlayerBullet;
        this.angle = angle;
        
        this.sprite = isPlayerBullet ? Assets.sprites.bullet : Assets.sprites.enemyBullet;
        this.scale = 2;
        
        const size = Assets.getSpriteSize(this.sprite, this.scale);
        this.width = size.width;
        this.height = size.height;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
        this.x += this.angle * this.speed * deltaTime;
    }

    draw(ctx) {
        const color = this.isPlayerBullet ? Assets.colors.primary : Assets.colors.danger;
        Assets.drawSprite(ctx, this.sprite, this.x, this.y, this.scale, color);
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = 100;
        this.scale = 2;
        
        // Set sprite based on type
        this.sprite = type === 'triple' ? Assets.sprites.powerupTriple :
                     type === 'rapid' ? Assets.sprites.powerupSpeed :
                     Assets.sprites.powerupShield;
        
        const size = Assets.getSpriteSize(this.sprite, this.scale);
        this.width = size.width;
        this.height = size.height;
        
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
        this.x += Math.sin(Date.now() * 0.003 + this.bobOffset) * 0.5;
    }

    draw(ctx) {
        // Glow effect
        ctx.shadowColor = Assets.colors.powerup;
        ctx.shadowBlur = 10;
        Assets.drawSprite(ctx, this.sprite, this.x, this.y, this.scale, Assets.colors.powerup);
        ctx.shadowBlur = 0;
    }
}