const https = require('https');
const http = require('http');

async function testNtfyWebPush() {
    console.log('Testing ntfy web push endpoint...\n');
    
    const testPayloads = [
        {
            name: 'Basic test',
            data: {
                endpoint: 'https://fcm.googleapis.com/fcm/send/test',
                auth: 'test',
                p256dh: 'test',
                topics: ['test-topic']
            }
        },
        {
            name: 'Real subscription format',
            data: {
                endpoint: 'https://fcm.googleapis.com/fcm/send/cxiKOSp3Xo0:APA91bECnoWNpGHBS8Gb4NbWlwTFkJm2R5qXMxrjoCP2hhN1azxQV536RrdoCGt6ppK-mMRCPtFmUSsEYJSLsmV1Tws1Ou_o11Hon-ut2NqPSfujUpQ3jZhpIQ6HJOsNUyAHEhUS2PcL',
                auth: 'test-auth-key',
                p256dh: 'test-p256dh-key',
                topics: ['test-topic']
            }
        },
        {
            name: 'Minimal payload',
            data: {
                endpoint: 'https://test.com',
                auth: 'auth',
                p256dh: 'p256dh',
                topics: ['topic']
            }
        }
    ];

    for (const test of testPayloads) {
        console.log(`\n--- ${test.name} ---`);
        
        try {
            const response = await makeRequest('http://localhost/v1/webpush', test.data);
            console.log('Status:', response.status);
            console.log('Response:', response.body);
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

function makeRequest(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}

testNtfyWebPush().catch(console.error); 