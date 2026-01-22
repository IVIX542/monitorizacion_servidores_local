const DocsAnimations = {
    canvas: null,
    ctx: null,
    animationFrameId: null,
    activeEffect: null,

    init() {
        if (this.canvas) return;
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'docs-bg-animation';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '0'; // Changed from -1 to 0 to sit just behind content
        this.canvas.style.opacity = '0.15'; // Increased for visibility
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

    startMatrix() {
        this.stop();
        this.activeEffect = 'matrix';
        const fontSize = 16;
        const columns = Math.ceil(this.canvas.width / fontSize);
        const drops = Array(columns).fill(1).map(() => Math.random() * -100);
        const chars = "DOCS";

        const draw = () => {
            // Slower fade for subtle trail
            this.ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#33ff00';
            this.ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                this.ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > this.canvas.height && Math.random() > 0.99) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    },

    startGlitch() {
        this.stop();
        this.activeEffect = 'glitch';
        const draw = () => {
            if (Math.random() > 0.95) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            if (Math.random() > 0.9) {
                const height = Math.random() * 20;
                const y = Math.random() * this.canvas.height;
                this.ctx.fillStyle = `rgba(227, 27, 35, ${Math.random() * 0.15})`;
                this.ctx.fillRect(0, y, this.canvas.width, height);
            }
            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    },

    startTron() {
        this.stop();
        this.activeEffect = 'tron';
        let offset = 0;
        const draw = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const horizon = this.canvas.height / 2;
            this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
            this.ctx.lineWidth = 1;

            const centerX = this.canvas.width / 2;
            for (let i = -10; i <= 10; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(centerX + (i * 40), horizon);
                this.ctx.lineTo(centerX + (i * 200), this.canvas.height);
                this.ctx.stroke();
            }

            offset = (offset + 0.5) % 40;
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

document.addEventListener('DOMContentLoaded', () => {
    // 0. Init Animations
    DocsAnimations.init();

    // 1. Inject Theme Selector into Nav
    const nav = document.querySelector('nav');
    if (nav) {
        const divider = document.createElement('hr');
        divider.style.borderColor = 'var(--border-color)';
        divider.style.margin = '20px 0';
        divider.style.opacity = '0.3';

        const label = document.createElement('div');
        label.textContent = '🎨 Tema Visual:';
        label.style.marginBottom = '10px';
        label.style.fontSize = '0.9em';
        label.style.color = 'var(--text-highlight)';

        const select = document.createElement('select');
        select.style.width = '100%';
        select.style.padding = '8px';
        select.style.background = 'var(--bg-color)';
        select.style.color = 'var(--text-main)';
        select.style.border = '1px solid var(--border-color)';
        select.style.borderRadius = '4px';
        select.style.fontFamily = 'inherit';
        select.style.cursor = 'pointer';

        const themes = [
            { id: 'default', name: 'Original (Docs)' },
            { id: 'matrix', name: 'Matrix (Green)' },
            { id: 'mr-robot', name: 'Mr. Robot (Red)' },
            { id: 'tron', name: 'Tron (Cyan)' }
        ];

        themes.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.name;
            select.appendChild(option);
        });

        nav.appendChild(divider);
        nav.appendChild(label);
        nav.appendChild(select);

        // 2. Load Saved Theme
        const savedTheme = localStorage.getItem('docs-theme') || 'default';
        applyTheme(savedTheme);
        select.value = savedTheme;

        // 3. Listener
        select.addEventListener('change', (e) => {
            const theme = e.target.value;
            applyTheme(theme);
            localStorage.setItem('docs-theme', theme);
        });
    }

    function applyTheme(themeId) {
        // Remove styling
        document.body.classList.remove('theme-matrix', 'theme-mr-robot', 'theme-tron');
        // Stop previous
        DocsAnimations.stop();

        if (themeId === 'default') {
            // No class, no animation
        } else if (themeId === 'matrix') {
            document.body.classList.add('theme-matrix');
            DocsAnimations.startMatrix();
        } else if (themeId === 'mr-robot') {
            document.body.classList.add('theme-mr-robot');
            DocsAnimations.startGlitch();
        } else if (themeId === 'tron') {
            document.body.classList.add('theme-tron');
            DocsAnimations.startTron();
        }
    }
});
