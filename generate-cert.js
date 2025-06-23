import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create .cert directory if it doesn't exist
const certDir = path.join(__dirname, '.cert');
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
}

// Generate private key and certificate
try {
    execSync('openssl req -x509 -newkey rsa:2048 -keyout .cert/key.pem -out .cert/cert.pem -days 365 -nodes -subj "/CN=localhost"', { stdio: 'inherit' });
    console.log('SSL certificates generated successfully!');
} catch (error) {
    console.error('Error generating certificates:', error);
    process.exit(1);
} 