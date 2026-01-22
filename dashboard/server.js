const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configuration for servers. 
// ... (servers const remains same, verify availability)
/* CAMBIAR IPs DE LOS SERVERS EN CASO DE CAMBIO DE RED  */
const servers = [
    { id: '1', name: 'server1', ip: '192.168.2.161', user: 'user', privateKeyPath: 'C:\\Users\\razon\\.ssh\\id_rsa' },
    { id: '2', name: 'server2', ip: '192.168.2.160', user: 'user', privateKeyPath: 'C:\\Users\\razon\\.ssh\\id_rsa' }
];

// Helper to execute VBoxManage commands
const runVBox = (command) => {
    const vboxExecutable = process.env.VBOX_MSI_INSTALL_PATH
        ? `"${path.join(process.env.VBOX_MSI_INSTALL_PATH, 'VBoxManage.exe')}"`
        : 'VBoxManage';

    return new Promise((resolve, reject) => {
        exec(`${vboxExecutable} ${command}`, (error, stdout, stderr) => {
            if (error) {
                console.warn(`VBox Error: ${stderr}`);
                resolve({ success: false, output: stderr });
            } else {
                resolve({ success: true, output: stdout });
            }
        });
    });
};

const checkVMStatus = async (vmName) => {
    const { success, output } = await runVBox(`showvminfo "${vmName}" --machinereadable`);
    if (!success) return 'unknown';

    if (output.includes('VMState="running"')) return 'running';
    if (output.includes('VMState="poweroff"')) return 'stopped';
    if (output.includes('VMState="aborted"')) return 'stopped';
    return 'stopped';
};

// --- Socket.IO Logic for Real-time Terminal ---
io.on('connection', (socket) => {
    console.log('Client connected to socket');
    // Map to store active sessions for this socket: { [serverId]: { client: NodeSSH, stream: stream } }
    const sessions = {};

    socket.on('start_ssh_session', async (serverId) => {
        // If session already exists, do nothing (or maybe re-emit connected?)
        if (sessions[serverId]) return;

        const targetServer = servers.find(s => s.id === serverId);
        if (!targetServer) {
            socket.emit(`term_data:${serverId}`, '\r\nServer not found.\r\n');
            return;
        }

        try {
            socket.emit(`term_data:${serverId}`, `\r\nConnecting to ${targetServer.name} (${targetServer.ip})...\r\n`);

            const sshConnection = new NodeSSH();
            await sshConnection.connect({
                host: targetServer.ip,
                username: targetServer.user,
                privateKey: fs.readFileSync(targetServer.privateKeyPath, 'utf8')
            });

            sshConnection.connection.shell((err, s) => {
                if (err) {
                    socket.emit(`term_data:${serverId}`, `\r\nShell execution failed: ${err.message}\r\n`);
                    return;
                }

                // Store session
                sessions[serverId] = { client: sshConnection, stream: s };

                socket.emit(`term_data:${serverId}`, `\r\nConnected! Terminal ready.\r\n`);

                // Data from SSH -> Browser (Namespaced event)
                s.on('data', (data) => {
                    socket.emit(`term_data:${serverId}`, data.toString());
                });

                s.on('close', () => {
                    socket.emit(`term_data:${serverId}`, '\r\nConnection closed by remote host.\r\n');
                    sshConnection.dispose();
                    delete sessions[serverId];
                });

            });

        } catch (err) {
            socket.emit(`term_data:${serverId}`, `\r\nConnection Failed: ${err.message}\r\n`);
            console.error(err);
        }
    });

    // Data from Browser -> SSH
    socket.on('term_input', ({ serverId, data }) => {
        const session = sessions[serverId];
        if (session && session.stream) {
            session.stream.write(data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected, closing all SSH sessions.');
        Object.values(sessions).forEach(session => {
            if (session.stream) session.stream.end();
            if (session.client) session.client.dispose();
        });
    });
});

app.get('/api/servers', async (req, res) => {
    const statusPromises = servers.map(async (s) => {
        const status = await checkVMStatus(s.name);
        return { ...s, status };
    });
    const results = await Promise.all(statusPromises);
    res.json(results);
});

// ... (Rest of existing API endpoints: /start, /stop, /stats/cpu, /stats/os remain as is)
app.post('/api/servers/start', async (req, res) => {
    const { id } = req.body;
    const s = servers.find(s => s.id === id);
    if (!s) return res.sendStatus(404);
    const { success } = await runVBox(`startvm "${s.name}" --type headless`);
    success ? res.sendStatus(200) : res.sendStatus(500);
});

app.post('/api/servers/stop', async (req, res) => {
    const { id } = req.body;
    const s = servers.find(s => s.id === id);
    if (!s) return res.sendStatus(404);
    // Force off
    let { success } = await runVBox(`controlvm "${s.name}" poweroff`);
    success ? res.sendStatus(200) : res.sendStatus(500);
});

app.post('/api/execute', async (req, res) => {
    // Keep this for legacy "one-off" command execution if needed, 
    // or compatibility with existing executeCommand() function before full migration
    const { id, command } = req.body;
    const server = servers.find(s => s.id === id);
    if (!server) return res.sendStatus(404);

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: server.ip,
            username: server.user,
            privateKey: fs.readFileSync(server.privateKeyPath, 'utf8')
        });
        const result = await ssh.execCommand(command);
        ssh.dispose();
        res.json({ stdout: result.stdout, stderr: result.stderr });
    } catch (err) {
        res.status(500).json({ error: 'Connection failed', details: err.message });
    }
});

app.post('/api/stats/cpu', async (req, res) => {
    const { id } = req.body;
    const server = servers.find(s => s.id === id);
    if (!server) return res.sendStatus(404);
    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: server.ip,
            username: server.user,
            privateKey: fs.readFileSync(server.privateKeyPath, 'utf8')
        });
        const cmd = `grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'`;
        const result = await ssh.execCommand(cmd);
        ssh.dispose();
        res.json({ cpu: parseFloat(result.stdout).toFixed(2) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/stats/os', async (req, res) => {
    // ... (Keep existing implementation logic)
    const { id } = req.body;
    const server = servers.find(s => s.id === id);
    if (!server) return res.sendStatus(404);

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: server.ip,
            username: server.user,
            privateKey: fs.readFileSync(server.privateKeyPath, 'utf8')
        });

        const cmd = 'uname -r && echo "---OS-RELEASE-START---" && cat /etc/os-release';

        const result = await ssh.execCommand(cmd);
        ssh.dispose();

        const output = result.stdout;
        const parts = output.split('---OS-RELEASE-START---');

        const kernel = parts[0] ? parts[0].trim() : 'Unknown';

        let osName = 'Linux Unknown';
        if (parts[1]) {
            const osRelease = parts[1];
            const match = osRelease.match(/PRETTY_NAME="?([^"\n]+)"?/);
            if (match && match[1]) {
                osName = match[1];
            } else {
                const idMatch = osRelease.match(/ID="?([^"\n]+)"?/);
                if (idMatch && idMatch[1]) osName = idMatch[1];
            }
        }
        res.json({ os: osName, kernel: kernel });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Changed from app.listen to server.listen for socket.io
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});