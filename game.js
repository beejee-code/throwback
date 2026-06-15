class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Create graphics programmatically, no external assets needed
    }

    create() {
        // Game constants
        this.GRAVITY = 9.8;
        this.SCALE = 10; // pixels per meter
        this.WIDTH = this.cameras.main.width;
        this.HEIGHT = this.cameras.main.height;
        
        // Game state
        this.currentPlayer = 1;
        this.isThrowing = false;
        this.windSpeed = (Math.random() - 0.5) * 20; // Random wind between -10 and 10
        this.windDirection = this.windSpeed > 0 ? 1 : -1;
        
        // Create city skyline
        this.createCity();
        
        // Create players
        this.createPlayers();
        
        // Create UI
        this.createUI();
        
        // Create wind indicator
        this.createWindIndicator();
        
        // Input fields
        this.angleInput = 45;
        this.velocityInput = 50;
    }

    createCity() {
        const buildingCount = 8;
        const buildingWidth = this.WIDTH / buildingCount;
        
        this.buildings = [];
        
        for (let i = 0; i < buildingCount; i++) {
            const height = Phaser.Math.Between(100, 300);
            const x = i * buildingWidth;
            const y = this.HEIGHT - height;
            
            // Create building
            const building = this.add.rectangle(
                x + buildingWidth / 2,
                y + height / 2,
                buildingWidth - 5,
                height,
                0x4a4a4a
            );
            building.setStrokeStyle(2, 0x2a2a2a);
            
            // Add windows
            for (let row = 0; row < Math.floor(height / 30); row++) {
                for (let col = 0; col < 3; col++) {
                    if (Math.random() > 0.3) {
                        const window = this.add.rectangle(
                            x + buildingWidth / 2 - 30 + col * 25,
                            y + 20 + row * 30,
                            15,
                            20,
                            Math.random() > 0.5 ? 0xffff00 : 0x333333
                        );
                    }
                }
            }
            
            this.buildings.push({
                x: x,
                y: y,
                width: buildingWidth,
                height: height
            });
        }
        
        // Ground
        this.add.rectangle(this.WIDTH / 2, this.HEIGHT - 5, this.WIDTH, 10, 0x2a2a2a);
    }

    createPlayers() {
        // Player 1 (left side)
        const p1Building = this.buildings[1];
        this.player1 = this.add.rectangle(
            p1Building.x + p1Building.width / 2,
            p1Building.y - 20,
            40,
            50,
            0x8B4513
        );
        this.player1.setStrokeStyle(2, 0x5D3A1A);
        
        // Player 1 face
        this.add.circle(
            p1Building.x + p1Building.width / 2 - 8,
            p1Building.y - 30,
            5,
            0x000000
        );
        this.add.circle(
            p1Building.x + p1Building.width / 2 + 8,
            p1Building.y - 30,
            5,
            0x000000
        );
        
        // Player 2 (right side)
        const p2Building = this.buildings[this.buildings.length - 2];
        this.player2 = this.add.rectangle(
            p2Building.x + p2Building.width / 2,
            p2Building.y - 20,
            40,
            50,
            0x228B22
        );
        this.player2.setStrokeStyle(2, 0x006400);
        
        // Player 2 face
        this.add.circle(
            p2Building.x + p2Building.width / 2 - 8,
            p2Building.y - 30,
            5,
            0x000000
        );
        this.add.circle(
            p2Building.x + p2Building.width / 2 + 8,
            p2Building.y - 30,
            5,
            0x000000
        );
        
        this.player1Pos = { x: p1Building.x + p1Building.width / 2, y: p1Building.y - 20 };
        this.player2Pos = { x: p2Building.x + p2Building.width / 2, y: p2Building.y - 20 };
    }

    createUI() {
        const uiY = 20;
        
        // Player turn indicator
        this.turnText = this.add.text(20, uiY, 'Player 1\'s Turn', {
            fontSize: '24px',
            color: '#ffffff'
        });
        
        // Angle input
        this.add.text(20, uiY + 40, 'Angle (degrees):', {
            fontSize: '16px',
            color: '#ffffff'
        });
        
        this.angleText = this.add.text(180, uiY + 40, '45', {
            fontSize: '16px',
            color: '#00ff00'
        });
        
        // Velocity input
        this.add.text(20, uiY + 70, 'Velocity (m/s):', {
            fontSize: '16px',
            color: '#ffffff'
        });
        
        this.velocityText = this.add.text(180, uiY + 70, '50', {
            fontSize: '16px',
            color: '#00ff00'
        });
        
        // Instructions
        this.add.text(20, uiY + 100, 'Controls:', {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.add.text(20, uiY + 120, 'UP/DOWN: Adjust angle', {
            fontSize: '12px',
            color: '#aaaaaa'
        });
        this.add.text(20, uiY + 140, 'LEFT/RIGHT: Adjust velocity', {
            fontSize: '12px',
            color: '#aaaaaa'
        });
        this.add.text(20, uiY + 160, 'SPACE: Throw', {
            fontSize: '12px',
            color: '#aaaaaa'
        });
        
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    createWindIndicator() {
        const windX = this.WIDTH - 150;
        const windY = 50;
        
        this.add.text(windX - 50, windY - 30, 'Wind:', {
            fontSize: '16px',
            color: '#ffffff'
        });
        
        // Wind arrow
        this.windArrow = this.add.triangle(
            windX,
            windY,
            0, -20,
            -15, 10,
            15, 10,
            0xff0000
        );
        
        // Wind speed text
        this.windText = this.add.text(windX - 30, windY + 25, 
            `${Math.abs(this.windSpeed).toFixed(1)} m/s`, {
            fontSize: '14px',
            color: '#ffffff'
        });
        
        this.updateWindArrow();
    }

    updateWindArrow() {
        const windMagnitude = Math.abs(this.windSpeed);
        const scale = Math.min(windMagnitude / 10, 2);
        this.windArrow.setScale(scale);
        
        if (this.windDirection > 0) {
            this.windArrow.setRotation(0);
        } else {
            this.windArrow.setRotation(Math.PI);
        }
        
        this.windText.setText(`${windMagnitude.toFixed(1)} m/s`);
    }

    update() {
        if (this.isThrowing) {
            return;
        }
        
        // Adjust angle
        if (this.cursors.up.isDown) {
            this.angleInput = Math.min(this.angleInput + 1, 90);
            this.angleText.setText(this.angleInput.toString());
        }
        if (this.cursors.down.isDown) {
            this.angleInput = Math.max(this.angleInput - 1, 0);
            this.angleText.setText(this.angleInput.toString());
        }
        
        // Adjust velocity
        if (this.cursors.right.isDown) {
            this.velocityInput = Math.min(this.velocityInput + 1, 100);
            this.velocityText.setText(this.velocityInput.toString());
        }
        if (this.cursors.left.isDown) {
            this.velocityInput = Math.max(this.velocityInput - 1, 10);
            this.velocityText.setText(this.velocityInput.toString());
        }
        
        // Throw
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.throwProjectile();
        }
    }

    throwProjectile() {
        this.isThrowing = true;
        
        const startPos = this.currentPlayer === 1 ? this.player1Pos : this.player2Pos;
        const targetPos = this.currentPlayer === 1 ? this.player2Pos : this.player1Pos;
        
        // Calculate angle based on player position
        let angle = this.angleInput * (Math.PI / 180);
        
        // Player 1 throws right, Player 2 throws left
        if (this.currentPlayer === 2) {
            angle = Math.PI - angle;
        }
        
        // Create projectile
        this.projectile = this.add.circle(startPos.x, startPos.y, 8, 0xff0000);
        
        // Initial velocity components
        const vx = this.velocityInput * Math.cos(angle) * this.SCALE;
        const vy = -this.velocityInput * Math.sin(angle) * this.SCALE;
        
        this.projectileData = {
            x: startPos.x,
            y: startPos.y,
            vx: vx,
            vy: vy,
            time: 0
        };
        
        // Start projectile animation
        this.projectileTimer = this.time.addEvent({
            delay: 16,
            callback: this.updateProjectile,
            callbackScope: this,
            loop: true
        });
    }

    updateProjectile() {
        if (!this.isThrowing) {
            return;
        }
        
        const dt = 0.016; // 16ms in seconds
        
        // Apply physics
        this.projectileData.vy += this.GRAVITY * this.SCALE * dt;
        this.projectileData.vx += this.windSpeed * this.SCALE * dt * 0.1;
        
        this.projectileData.x += this.projectileData.vx * dt;
        this.projectileData.y += this.projectileData.vy * dt;
        
        this.projectile.setPosition(this.projectileData.x, this.projectileData.y);
        
        // Check collision with ground
        if (this.projectileData.y > this.HEIGHT - 10) {
            this.endTurn(false);
            return;
        }
        
        // Check collision with buildings
        for (const building of this.buildings) {
            if (this.projectileData.x > building.x && 
                this.projectileData.x < building.x + building.width &&
                this.projectileData.y > building.y) {
                this.endTurn(false);
                return;
            }
        }
        
        // Check collision with players
        const targetPlayer = this.currentPlayer === 1 ? this.player2Pos : this.player1Pos;
        const distance = Phaser.Math.Distance.Between(
            this.projectileData.x, this.projectileData.y,
            targetPlayer.x, targetPlayer.y
        );
        
        if (distance < 30) {
            this.endTurn(true);
            return;
        }
        
        // Check if out of bounds
        if (this.projectileData.x < 0 || this.projectileData.x > this.WIDTH) {
            this.endTurn(false);
            return;
        }
    }

    endTurn(hit) {
        this.isThrowing = false;
        
        // Remove the projectile timer
        if (this.projectileTimer) {
            this.projectileTimer.remove();
            this.projectileTimer = null;
        }
        
        this.projectile.destroy();
        
        if (hit) {
            const winner = this.currentPlayer === 1 ? 'Player 1' : 'Player 2';
            this.add.text(this.WIDTH / 2 - 100, this.HEIGHT / 2, 
                `${winner} Wins!`, {
                fontSize: '48px',
                color: '#00ff00',
                backgroundColor: '#000000'
            });
            
            // Reset game after 3 seconds
            this.time.delayedCall(3000, () => {
                this.scene.restart();
            });
        } else {
            // Switch player
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.turnText.setText(`Player ${this.currentPlayer}'s Turn`);
            
            // Change wind
            this.windSpeed = (Math.random() - 0.5) * 20;
            this.windDirection = this.windSpeed > 0 ? 1 : -1;
            this.updateWindArrow();
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: MainScene
};

const game = new Phaser.Game(config);
