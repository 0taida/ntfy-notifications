const crypto = require('crypto');

// Your VAPID keys
const publicKey = 'BNcbUYaRXWUFPPdu_kpjJUiL9vm1MPaBYNahRSjG8nHtnE0PjFu6afGj26hXqssI6pB4ICDYW38yf4bvqItr0S0';
const privateKey = 'azQWwbbV6WbaAsppqVbTrAUsKT8TpjmxpTeOXBweXTA';

console.log('Testing VAPID keys...');
console.log('Public key length:', publicKey.length);
console.log('Private key length:', privateKey.length);

// Test if public key is valid base64
try {
    const buffer = Buffer.from(publicKey, 'base64');
    console.log('Public key decoded length:', buffer.length);
    console.log('Public key is valid base64 ✓');
} catch (error) {
    console.error('Public key is not valid base64:', error.message);
}

// Test if private key is valid base64
try {
    const buffer = Buffer.from(privateKey, 'base64');
    console.log('Private key decoded length:', buffer.length);
    console.log('Private key is valid base64 ✓');
} catch (error) {
    console.error('Private key is not valid base64:', error.message);
}

// Test if keys are compatible (should be 32 bytes each for VAPID)
if (publicKey.length === 87 && privateKey.length === 43) {
    console.log('Key lengths look correct for VAPID ✓');
} else {
    console.log('Key lengths may be incorrect:');
    console.log('  Expected public key: 87 characters');
    console.log('  Expected private key: 43 characters');
    console.log('  Actual public key:', publicKey.length, 'characters');
    console.log('  Actual private key:', privateKey.length, 'characters');
}

console.log('\nRecommendations:');
console.log('1. Make sure both keys are generated together');
console.log('2. Restart ntfy with the correct keys');
console.log('3. Try generating new VAPID keys if needed'); 