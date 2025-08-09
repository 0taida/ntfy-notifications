# ntfy - Simple Notifications

ntfy is a simple HTTP-based notification service. Send notifications to your phone or desktop from any script or device.

## 🚀 Quick Start

### Send a Notification
```bash
curl -d "Hello world!" https://ntfy.sh/my-topic
```

### Receive Notifications
- **Web**: Visit `https://ntfy.sh/my-topic`
- **Mobile**: Install ntfy app (Android/iOS)
- **Desktop**: Download ntfy app

## 📤 Sending Messages

### Basic
```bash
# Simple message
curl -d "Hello!" https://ntfy.sh/my-topic

# With title
curl -d "Message" -H "Title: Alert" https://ntfy.sh/my-topic

# With priority (1=urgent, 5=min)
curl -d "Urgent!" -H "Priority: 1" https://ntfy.sh/alerts
```

### Advanced
```bash
# Full notification
curl -d "System down!" \
     -H "Title: Server Alert" \
     -H "Priority: 1" \
     -H "Tags: server,down" \
     -H "Click: https://status.example.com" \
     https://ntfy.sh/alerts
```

## 📥 Receiving Messages

### Mobile Apps
- **Android**: [Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
- **iOS**: [App Store](https://apps.apple.com/us/app/ntfy/id1625396347)

### Web Interface
Visit `https://ntfy.sh/your-topic` in browser

### Command Line
```bash
# Stream messages
curl -s ntfy.sh/your-topic/sse

# Get latest messages
curl -s ntfy.sh/your-topic/json
```

## 🔧 Use Cases

### System Monitoring
```bash
if ! ping -c 1 server.example.com; then
    curl -d "Server down!" -H "Priority: 1" https://ntfy.sh/alerts
fi
```

### CI/CD
```bash
curl -d "Build completed!" -H "Tags: ci,success" https://ntfy.sh/ci
```

### Home Automation
```bash
curl -d "Door opened" -H "Tags: home,door" https://ntfy.sh/home
```

### Scheduled Messages
```bash
# Send in 1 hour
curl -d "Reminder" -H "Delay: 1h" https://ntfy.sh/reminders
```

## 🌐 Web Integration

### Server-Sent Events
```javascript
const eventSource = new EventSource('https://ntfy.sh/my-topic/json?poll=1');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('New message:', data);
};
```

### Web Push (Advanced)
```javascript
// Subscribe to background notifications
const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey
});

await fetch('https://ntfy.sh/v1/webpush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        topics: ['my-topic']
    })
});
```

## 📱 Priority Levels

- **1**: Urgent (red, requires interaction)
- **2**: High (yellow)
- **3**: Normal (green, default)
- **4**: Low (gray)
- **5**: Min (gray)

## 🔐 Privacy

- Topics are public by default
- Use random topic names for privacy
- Self-host for complete control

## 🛠️ Self-Hosting

```bash
# Download and run
wget https://github.com/binwiederhier/ntfy/releases/download/v2.8.0/ntfy_2.8.0_linux_amd64.tar.gz
tar -xzf ntfy_2.8.0_linux_amd64.tar.gz
sudo mv ntfy /usr/bin/
ntfy serve
```

## 📚 API

### Endpoints
- `POST /{topic}` - Send message
- `GET /{topic}/json` - Get messages
- `GET /{topic}/sse` - Stream messages

### Headers
- `Title` - Notification title
- `Priority` - Message priority (1-5)
- `Tags` - Comma-separated tags
- `Click` - Click action URL
- `Delay` - Delay message delivery

## 🎯 Best Practices

### Topic Names
```bash
# Good
https://ntfy.sh/server-alerts
https://ntfy.sh/ci-builds

# Avoid
https://ntfy.sh/test
```

### Messages
```bash
# Good: Clear and actionable
curl -d "Server web.example.com is responding again" \
     -H "Title: Server Recovery" \
     -H "Tags: server,up" \
     https://ntfy.sh/alerts

# Avoid: Vague
curl -d "Something happened" https://ntfy.sh/alerts
```

## 🔧 Troubleshooting

### Notifications Not Received
```bash
# Test topic
curl https://ntfy.sh/your-topic/json

# Send test
curl -d "Test" https://ntfy.sh/your-topic
```

### Mobile App Issues
- Check internet connection
- Verify topic URL
- Restart app
- Check notification permissions

## 📖 Resources

- [Official Docs](https://ntfy.sh/docs/)
- [GitHub](https://github.com/binwiederhier/ntfy)
- [Mobile Apps](https://ntfy.sh/docs/subscribe/phone/)

---

**ntfy** - Simple, reliable, and free notifications! 🚀 