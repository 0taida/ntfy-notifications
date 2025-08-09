const crypto = require('crypto');

console.log('Generating new VAPID keys for ntfy...\n');

// Generate a new key pair
const keyPair = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: {
        type: 'spki',
        format: 'der'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der'
    }
});

// Convert to the format expected by VAPID
const publicKeyBuffer = keyPair.publicKey;
const privateKeyBuffer = keyPair.privateKey;

// Extract the raw public key (remove the ASN.1 wrapper)
const publicKeyRaw = publicKeyBuffer.slice(26, 26 + 65); // Skip ASN.1 header, get 65 bytes
const privateKeyRaw = privateKeyBuffer.slice(36, 36 + 32); // Skip ASN.1 header, get 32 bytes

// Convert to base64url format (no padding, URL-safe)
const publicKeyBase64 = publicKeyRaw.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const privateKeyBase64 = privateKeyRaw.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

console.log('Generated VAPID Keys:');
console.log('=====================');
console.log('Public Key:');
console.log(publicKeyBase64);
console.log('');
console.log('Private Key:');
console.log(privateKeyBase64);
console.log('');
console.log('ntfy Command:');
console.log('=============');
console.log(`sudo go run main.go --log-level debug serve \\`);
console.log(`  --web-push-public-key="${publicKeyBase64}" \\`);
console.log(`  --web-push-private-key="${privateKeyBase64}" \\`);
console.log(`  --web-push-email-address=sysadmin@example.com \\`);
console.log(`  --web-push-file=/tmp/webpush.db \\`);
console.log(`  --base-url=http://localhost:3003`);
console.log('');
console.log('Key Validation:');
console.log('===============');
console.log('Public key length:', publicKeyBase64.length, '(should be 87)');
console.log('Private key length:', privateKeyBase64.length, '(should be 43)');
console.log('Public key valid base64:', /^[A-Za-z0-9_-]+$/.test(publicKeyBase64));
console.log('Private key valid base64:', /^[A-Za-z0-9_-]+$/.test(privateKeyBase64)); 