document.addEventListener('DOMContentLoaded', () => {
    loadServers();

    // Theme Switcher Logic
    const themeSelector = document.getElementById('theme-selector');

    // Initialize animations
    if (window.Animations) {
        window.Animations.init();
        window.Animations.startMatrixRain(); // Default
    }

    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            const theme = e.target.value;
            // Reset classes
            document.body.classList.remove('theme-mr-robot', 'theme-tron');

            if (theme === 'mr-robot') {
                document.body.classList.add('theme-mr-robot');
                if (window.Animations) window.Animations.startGlitch();
            } else if (theme === 'tron') {
                document.body.classList.add('theme-tron');
                if (window.Animations) window.Animations.startTronGrid();
            } else {
                // Default
                if (window.Animations) window.Animations.startMatrixRain();
            }
            // Trigger resize to force refresh on some elements if needed
            window.dispatchEvent(new Event('resize'));
        });
    }
});

function loadServers() {
    fetch('/api/servers')
        .then(response => response.json())
        .then(data => {
            const serverList = document.getElementById('server-list');
            serverList.innerHTML = ''; // Clear existing
            data.forEach(server => {
                const card = document.createElement('div');
                card.className = `server-card status-${server.status}`; // styles: status-running, status-stopped
                card.innerHTML = `
                    <div class="server-header">
                        <span class="server-name">${server.name}</span>
                        <div class="status-indicator status-${server.status}">
                            <span class="status-dot"></span>
                            <span class="status-text">${server.status === 'running' ? 'ACTIVO' : 'DETENIDO'}</span>
                        </div>
                    </div>
                    
                    <div class="server-details">
                        <div class="detail-row">
                            <span class="detail-label">IP:</span> 
                            <span>${server.ip}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">S.O.:</span> 
                            <span id="os-${server.id}">--</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">NÚCLEO:</span> 
                            <span id="kernel-${server.id}">--</span>
                        </div>
                    </div>

                    <div class="server-controls">
                        <button class="btn" onclick="startServer('${server.id}')" ${server.status === 'running' ? 'disabled' : ''}>
                            <i class="fas fa-power-off"></i> INICIAR
                        </button>
                        <button class="btn btn-danger" onclick="stopServer('${server.id}')" ${server.status === 'stopped' ? 'disabled' : ''}>
                             <i class="fas fa-plug"></i> APAGAR
                        </button>
                    </div>

                    <div class="server-stats">
                        <button class="btn" onclick="getCPU('${server.id}')">
                            <i class="fas fa-microchip"></i> ESCANEAR CPU
                        </button>
                        <span id="cpu-${server.id}" style="margin-left:10px">--</span>
                    </div>

                    <div class="server-actions">
                        <div class="terminal-controls" style="display: flex; gap: 5px; margin-bottom: 10px;">
                            <button id="btn-connect-${server.id}" class="btn" style="flex-grow: 1;" onclick="openTerminal('${server.id}')">
                                <i class="fas fa-terminal"></i> CONECTAR TERMINAL
                            </button>
                             <button class="btn" title="Expandir/Contraer" onclick="toggleWidescreen('${server.id}')">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                        <div id="terminal-container-${server.id}" class="terminal-wrapper"></div>
                    </div>
                `;
                serverList.appendChild(card);

                // Auto-fetch OS info if running
                if (server.status === 'running') {
                    getOSStats(server.id);
                }
            });
        })
        .catch(err => console.error('Error loading servers:', err));
}

async function startServer(serverId) {
    if (!confirm('¿Ejecutar secuencia de INICIO?')) return;
    try {
        const response = await fetch('/api/servers/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: serverId })
        });
        if (response.ok) {
            // Find the card to play animation on
            const card = document.querySelector(`button[onclick="startServer('${serverId}')"]`).closest('.server-card');
            playBootAnimation(card, () => {
                setTimeout(loadServers, 1000); // Refresh after animation
            });
        } else {
            alert('Fallo al iniciar.');
        }
    } catch (err) {
        console.error(err);
        alert('Error de transmisión');
    }
}

function playBootAnimation(card, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'bios-boot-overlay';
    card.appendChild(overlay);

    const bootSequence = [
        `BIOS DATE 01/22/26 12:00:00 VER 1.0.2`,
        `CPU: VirtCPU @ 3.40GHz`,
        `Memory Test: 4096MB OK`,
        `Detecting Primary Master... VirtDisk`,
        `Booting from Hard Disk...`,
        `Loading Kernel... OK`,
        `[ OK ] Mounted Filesystems.`,
        `[ OK ] Started Networking Service.`,
        `[ OK ] Started SSH Daemon.`,
        `System Ready.`
    ];

    let lineIndex = 0;
    const interval = setInterval(() => {
        if (lineIndex < bootSequence.length) {
            const line = document.createElement('div');
            line.className = 'bios-line';
            line.textContent = bootSequence[lineIndex];
            overlay.appendChild(line);
            lineIndex++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                overlay.remove();
                if (callback) callback();
            }, 1000);
        }
    }, 400); // Speed of each line appearance
}

async function stopServer(serverId) {
    if (!confirm('ADVERTENCIA: ¿PARADA FORZOSA? Posible pérdida de datos.')) return;
    try {
        const response = await fetch('/api/servers/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: serverId })
        });
        if (response.ok) {
            alert('Señal de apagado enviada.');
            setTimeout(loadServers, 3000);
        } else {
            alert('Fallo al detener.');
        }
    } catch (err) {
        console.error(err);
        alert('Error de transmisión');
    }
}

// Global history storage
const commandHistory = {};
const historyIndex = {};

const socket = io();

// ... existing code ...

function openTerminal(serverId) {
    const containerWrapper = document.getElementById(`terminal-container-${serverId}`);
    const connectBtn = document.getElementById(`btn-connect-${serverId}`);

    // Check if terminal is already open
    if (containerWrapper.querySelector('.terminal-container')) return;

    // Expand card automatically for better view
    const card = containerWrapper.closest('.server-card');
    card.classList.add('expanded');

    // Hide connect button
    if (connectBtn) connectBtn.style.display = 'none';

    // Setup container
    containerWrapper.innerHTML = '<div class="terminal-container" style="height: 300px; width: 100%;"></div>';
    const container = containerWrapper.querySelector('.terminal-container');

    // Initialize xterm with dynamic theme
    const isMrRobot = document.body.classList.contains('theme-mr-robot');
    const isTron = document.body.classList.contains('theme-tron');

    let termTheme = {
        background: '#1a1a1a',
        foreground: '#33ff00',
        cursor: '#33ff00'
    };

    if (isMrRobot) {
        termTheme = {
            background: '#0f0f0f',
            foreground: '#e31b23',
            cursor: '#e31b23'
        };
    } else if (isTron) {
        termTheme = {
            background: '#000814',
            foreground: '#00f3ff',
            cursor: '#00f3ff'
        };
    }

    const term = new Terminal({
        cursorBlink: true,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        theme: termTheme,
        convertEol: true, // Handle \n -> \r\n
    });

    // Fit addon
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    term.open(container);
    fitAddon.fit();

    // Store reference to check for active sessions
    // ...

    term.write('Initializing Secure Shell connection...\r\n');

    // Start session
    socket.emit('start_ssh_session', serverId);

    // Incoming data (Namespaced for this server)
    socket.on(`term_data:${serverId}`, (data) => {
        term.write(data);
    });

    // Outgoing data
    term.onData(data => {
        socket.emit('term_input', { serverId, data });
    });

    // Handle Window Resize
    // We need to keep track of this listener to remove it if needed, but for now simple add is okay
    window.addEventListener('resize', () => {
        fitAddon.fit();
    });
}

function toggleWidescreen(serverId) {
    // Look for the specific container wrapper
    const containerWrapper = document.getElementById(`terminal-container-${serverId}`);
    // But if not found (because not connected yet?), fallback to the button or header
    // Actually, HTML structure is persistent, so containerWrapper should exist.
    const card = containerWrapper.closest('.server-card');

    card.classList.toggle('expanded');

    // Re-fit terminal if open
    const container = containerWrapper.querySelector('.terminal-container');
    if (container) {
        // Trigger resize event roughly to force xterm fit
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }
}

function executeCommand(serverId) {
    // Redirect legacy "EJECUTAR" button to open terminal
    openTerminal(serverId);
}

// ... remove old handleCommandKey and executeCommand ...

async function getCPU(serverId) {
    const cpuSpan = document.getElementById(`cpu-${serverId}`);
    cpuSpan.textContent = 'Escaneando...';

    try {
        const response = await fetch('/api/stats/cpu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: serverId })
        });

        const result = await response.json();
        if (result.cpu) {
            cpuSpan.textContent = `${result.cpu}%`;
        } else {
            cpuSpan.textContent = 'ERR';
        }
    } catch (err) {
        cpuSpan.textContent = 'N/A';
    }
}

async function getOSStats(serverId) {
    const osSpan = document.getElementById(`os-${serverId}`);
    const kernelSpan = document.getElementById(`kernel-${serverId}`);

    // Optional: Visual indicator that it's loading
    osSpan.textContent = 'Sondeando...';

    try {
        const response = await fetch('/api/stats/os', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: serverId })
        });

        const result = await response.json();
        if (result.os) {
            osSpan.textContent = result.os;
            kernelSpan.textContent = result.kernel;
        } else {
            osSpan.textContent = 'Desconocido';
        }
    } catch (err) {
        osSpan.textContent = 'Inaccesible';
    }
}
