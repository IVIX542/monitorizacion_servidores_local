const fs = require('fs');
const { NodeSSH } = require('node-ssh');

const keyPath = 'C:\\Users\\razon\\.ssh\\id_rsa'; // Path from server.js

console.log('--- DEBUG START ---');
try {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    console.log(`Key Path: ${keyPath}`);
    console.log(`Key Found: yes`);
    console.log(`Key Length: ${keyContent.length}`);
    console.log(`First Line: ${keyContent.split('\n')[0]}`);

    // Check for encryption headers
    if (keyContent.includes('ENCRYPTED')) {
        console.warn('WARNING: Key has ENCRYPTED header. This usually fails without passphrase.');
    } else {
        console.log('Encryption check: Looks unencrypted (Good)');
    }

    // Attempt simple connection (mock) just to parse key
    const ssh = new NodeSSH();
    console.log('Attempting to connect with this key...');

    // We'll try to connect to one of the servers defined in server.js manually here
    ssh.connect({
        host: '192.168.1.137', // Tring server1 IP
        username: 'usuario',
        privateKey: keyContent
    }).then(() => {
        console.log('SUCCESS: Connection established!');
        ssh.dispose();
    }).catch(err => {
        console.error('CONNECTION FAILED:', err.message);
        if (err.message.includes('parse')) {
            console.error('PARSING ERROR: This confirms the format is rejected by ssh2.');
        }
    });

} catch (err) {
    console.error('FILE ERROR:', err.message);
}
