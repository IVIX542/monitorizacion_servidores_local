const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const sshDir = path.join(os.homedir(), '.ssh');
const keyPath = path.join(sshDir, 'id_rsa');
const pubKeyPath = path.join(sshDir, 'id_rsa.pub');

console.log('--- AUTO KEY GENERATOR ---');

// 1. Ensure .ssh directory exists
if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir);
}

// 2. Remove existing keys to start fresh
try {
    if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
    if (fs.existsSync(pubKeyPath)) fs.unlinkSync(pubKeyPath);
    console.log('Old keys removed.');
} catch (e) {
    console.warn('Could not remove old keys (maybe open?):', e.message);
}

// 3. Generate new key strictly with NO passphrase (-N "")
// -m PEM: Force legacy PEM format
// -b 4096: Good security
// -t rsa: Standard type
// -N "": Empty passphrase
const command = `ssh-keygen -t rsa -b 4096 -m PEM -f "${keyPath}" -N ""`;

console.log('Generating new key...');
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('FAILED to generate key:', stderr);
        return;
    }
    console.log('SUCCESS: New SSH Key generated successfully without passphrase.');
    console.log('Key location:', keyPath);

    // Verify it's not encrypted
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    if (keyContent.includes('ENCRYPTED')) {
        console.error('ERROR: Something went wrong, key is still encrypted.');
    } else {
        console.log('VERIFIED: Key is unencrypted and ready for Dashboard.');
    }

    console.log('\n--- NEXT STEP ---');
    console.log('Run this command in PowerShell to copy the key to your VM:');
    console.log(`type $env:USERPROFILE\\.ssh\\id_rsa.pub | ssh usuario@192.168.1.137 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"`);
});
