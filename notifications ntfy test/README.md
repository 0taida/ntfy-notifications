# ntfy Notifications - SSE and Web Push

This project demonstrates how to use ntfy for both Server-Sent Events (SSE) and Web Push notifications. It includes complete setup instructions, working examples, and troubleshooting guides.

## 📁 Project Structure

```
notifications ntfy test/
├── sse.html              # SSE (Server-Sent Events) test page
├── webpush.html          # Web Push notifications test page
├── sw.js                 # Service Worker for Web Push
├── vapid-test.html       # VAPID key validation tool
├── server.js             # HTTPS server for local development
├── setup-https.sh        # SSL certificate setup script
├── package.json          # Node.js project configuration
├── generate-vapid-keys.js # VAPID key generation script
├── test-vapid-keys.js    # VAPID key validation script
└── test-ntfy-webpush.js  # ntfy web push testing script
```

## 🚀 Quick Start

### 1. Setup HTTPS for Local Development

```bash
# Make setup script executable and run it
chmod +x setup-https.sh
./setup-https.sh

# Start the HTTPS server
node server.js
```

### 2. Start ntfy Server with Web Push

```bash
# Navigate to ntfy directory
cd ntfy

# Generate VAPID keys
sudo go run main.go webpush keys

# Start ntfy with web push enabled
sudo go run main.go --log-level debug serve --config server/server.yml
```

### 3. Test Notifications

- **SSE**: Open `https://localhost:3000/sse.html`
- **Web Push**: Open `https://localhost:3000/webpush.html`

## 📡 Server-Sent Events (SSE)

SSE provides real-time notifications by maintaining an open connection to the server.

### Features
- ✅ Real-time message streaming
- ✅ Automatic reconnection
- ✅ Message history with `since` parameter
- ✅ Topic filtering
- ✅ Event-based message handling

### Usage

#### 1. Subscribe to a Topic
```javascript
const eventSource = new EventSource('http://localhost/topic-name/json?poll=1');
```

#### 2. Handle Messages
```javascript
eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('New message:', data);
    // Display notification
};
```

#### 3. Send a Message
```bash
curl -d "Hello from SSE!" http://localhost/topic-name
```

### Example Implementation
```html
<!-- See sse.html for complete implementation -->
<script>
const topic = 'test-topic';
const eventSource = new EventSource(`http://localhost/${topic}/json?poll=1`);

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    showNotification(data.title || data.topic, data.message);
};

function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
}
</script>
```

## 🔔 Web Push Notifications

Web Push allows browsers to receive notifications even when the web app is closed.

### Features
- ✅ Background notifications
- ✅ Rich notification formatting
- ✅ Priority indicators
- ✅ Action buttons
- ✅ Automatic subscription management

### Setup

#### 1. Generate VAPID Keys
```bash
# Using ntfy's built-in generator
sudo go run main.go webpush keys

# Or using our Node.js script
node generate-vapid-keys.js
```

#### 2. Configure ntfy Server
```yaml
# server.yml
web-push-public-key: "YOUR_PUBLIC_KEY"
web-push-private-key: "YOUR_PRIVATE_KEY"
web-push-file: "/tmp/webpush.db"
web-push-email-address: "admin@example.com"
```

#### 3. Register Service Worker
```javascript
// Register service worker
navigator.serviceWorker.register('/sw.js')
    .then(registration => {
        console.log('Service Worker registered');
    });
```

### Usage

#### 1. Subscribe to Web Push
```javascript
const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey
});

// Send subscription to ntfy
await fetch('http://localhost/v1/webpush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        topics: ['your-topic']
    })
});
```

#### 2. Send Notifications
```bash
# Basic notification
curl -d "Hello from Web Push!" http://localhost/topic-name

# With title and priority
curl -d "Important message" \
     -H "Title: Alert" \
     -H "Priority: 1" \
     -H "Tags: urgent,warning" \
     http://localhost/topic-name
```

## 🛠️ Development Tools

### HTTPS Server
```bash
# Start HTTPS server for local development
node server.js

# Available endpoints:
# - https://localhost:3000/webpush.html
# - https://localhost:3000/sse.html
# - https://localhost:3000/vapid-test.html
```

### VAPID Key Tools
```bash
# Generate new VAPID keys
node generate-vapid-keys.js

# Test VAPID key format
node test-vapid-keys.js

# Open VAPID test tool
# https://localhost:3000/vapid-test.html
```

### ntfy Testing
```bash
# Test web push endpoint
node test-ntfy-webpush.js

# Send test notifications
curl -d "Test message" http://localhost/topic-name
```

## 📋 Notification Features

### Message Format
```json
{
  "id": "message-id",
  "time": 1754217102,
  "expires": 1754260302,
  "event": "message",
  "topic": "topic-name",
  "title": "Message Title",
  "message": "Message content",
  "priority": 3,
  "tags": ["tag1", "tag2"]
}
```

### Priority Levels
- 🔴 **1**: Urgent (requires interaction)
- 🟡 **2**: High
- 🟢 **3**: Normal (default)
- ⚪ **4**: Low
- ⚪ **5**: Min

### Notification Actions
- **View Details**: Opens topic page
- **Close**: Dismisses notification

## 🔧 Troubleshooting

### Common Issues

#### 1. VAPID Key Errors
```bash
# Validate VAPID key format
node test-vapid-keys.js

# Generate new keys
sudo go run main.go webpush keys
```

#### 2. HTTPS Required
```bash
# Web Push requires HTTPS or localhost
# Use the provided HTTPS server
node server.js
```

#### 3. Database Permissions
```bash
# Fix database permissions
sudo chown root:root /tmp/webpush.db
sudo chmod 644 /tmp/webpush.db
```

#### 4. Service Worker Issues
```bash
# Clear browser cache
# Check browser console for errors
# Verify service worker registration
```

### Debug Commands
```bash
# Check ntfy server status
curl http://localhost/v1/config

# Test web push endpoint
curl -X POST http://localhost/v1/webpush \
     -H "Content-Type: application/json" \
     -d '{"endpoint":"test","auth":"test","p256dh":"test","topics":["test"]}'

# Check server logs
sudo go run main.go --log-level debug serve --config server/server.yml
```

## 📚 API Reference

### SSE Endpoints
- `GET /{topic}/json` - Subscribe to topic
- `GET /{topic}/json?poll=1` - Poll for messages
- `GET /{topic}/json?since={id}` - Get messages since ID

### Web Push Endpoints
- `POST /v1/webpush` - Register subscription
- `DELETE /v1/webpush` - Unregister subscription

### Message Headers
- `Title` - Notification title
- `Priority` - Message priority (1-5)
- `Tags` - Comma-separated tags
- `Delay` - Delay message delivery

## 🎯 Examples

### Send Different Types of Notifications

```bash
# Basic notification
curl -d "Hello world!" http://localhost/test-topic

# With title and priority
curl -d "System alert" \
     -H "Title: Server Down" \
     -H "Priority: 1" \
     -H "Tags: critical,server" \
     http://localhost/alerts

# Delayed notification
curl -d "Reminder" \
     -H "Title: Meeting" \
     -H "Delay: 1h" \
     http://localhost/reminders

# With emoji
curl -d "🎉 Party time!" \
     -H "Title: Celebration" \
     -H "Priority: 2" \
     http://localhost/events
```

### JavaScript Integration

```javascript
// Subscribe to SSE
const eventSource = new EventSource('http://localhost/my-topic/json?poll=1');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('New message:', data);
};

// Subscribe to Web Push
async function subscribeToWebPush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
    });
    
    await fetch('http://localhost/v1/webpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            endpoint: subscription.endpoint,
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh,
            topics: ['my-topic']
        })
    });
}
```

## 📖 Additional Resources

- [ntfy Documentation](https://ntfy.sh/docs/)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE). 