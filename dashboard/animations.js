const Animations = {
    canvas: null,
    ctx: null,
    animationFrameId: null,
    activeEffect: null,

    init() {
        // Create canvas for background effects
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'bg-animation';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.opacity = '0.3'; // Subtle overlay
        this.canvas.style.pointerEvents = 'none';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        window.addEventListener('resize', () => this.resize());
        this.resize();
    },

    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    },

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.activeEffect = null;
    },

    // --- EFFECTS ---

    // 1. Matrix Rain
    startMatrixRain() {
        this.stop();
        this.activeEffect = 'matrix';
        const fontSize = 14;
        const columns = Math.ceil(this.canvas.width / fontSize);
        const drops = Array(columns).fill(1).map(() => Math.random() * -100); // Start above screen

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$@#%&";

        const draw = () => {
            // Semi-transparent fade to create trails
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#0F0'; // Green
            this.ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                this.ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > this.canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    },

    // 2. Mr. Robot Glitch (Visual Noise + Red artifacts)
    startGlitch() {
        this.stop();
        this.activeEffect = 'glitch';

        const draw = () => {
            // Random clear rects to simulate flicker? Or just lines
            if (Math.random() > 0.9) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // Draw random red bars/noise
            if (Math.random() > 0.8) {
                const height = Math.random() * 50;
                const y = Math.random() * this.canvas.height;
                this.ctx.fillStyle = `rgba(227, 27, 35, ${Math.random() * 0.2})`; // Red tint
                this.ctx.fillRect(0, y, this.canvas.width, height);
            }

            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    },

    // 3. Tron Grid (Moving perspective grid)
    startTronGrid() {
        this.stop();
        this.activeEffect = 'tron';

        let offset = 0;

        const draw = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Simple perspective grid simulation
            const horizon = this.canvas.height / 2;
            this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)'; // Cyan
            this.ctx.lineWidth = 1;

            // Vertical lines converging
            const centerX = this.canvas.width / 2;
            for (let i = -10; i <= 10; i++) {
                this.ctx.beginPath();
                // Top point (perspective)
                this.ctx.moveTo(centerX + (i * 20), horizon);
                // Bottom point w/spread
                this.ctx.lineTo(centerX + (i * 100 * (this.canvas.width / 1000)), this.canvas.height);
                this.ctx.stroke();
            }

            // Horizontal lines moving down
            offset = (offset + 1) % 40;
            for (let y = horizon; y < this.canvas.height; y += 40) {
                const currentY = y + offset;
                if (currentY > this.canvas.height) continue;

                this.ctx.beginPath();
                this.ctx.moveTo(0, currentY);
                this.ctx.lineTo(this.canvas.width, currentY);
                this.ctx.stroke();
            }

            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    }
};

// Export to global scope for dashboard.js
window.Animations = Animations;
