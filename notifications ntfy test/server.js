const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const app = function (req, res) {
  // Set CORS headers for web push
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = req.url === '/' ? '/webpush.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.js':
        contentType = 'application/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.ico':
        contentType = 'image/x-icon';
        break;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const server = https.createServer(options, app);

server.listen(4567, () => {
  console.log('HTTPS Server running on https://localhost:4567');
  console.log('Available files:');
  console.log('  - https://localhost:4567/webpush.html (Web Push Test)');
  console.log('  - https://localhost:4567/vapid-test.html (VAPID Key Test)');
  console.log('  - https://localhost:4567/sse.html (SSE Test)');
  console.log('  - https://localhost:4567/sw.js (Service Worker)');
  console.log('');
  console.log('Note: You may see a security warning in your browser.');
  console.log('Click "Advanced" and "Proceed to localhost" to continue.');
}); 