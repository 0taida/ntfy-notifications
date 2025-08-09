# ntfy Web Push Integration Guide

This guide provides a complete implementation for integrating ntfy as a notification provider with Web Push support into your custom project.

## Overview

ntfy supports Web Push notifications, allowing browsers to receive push notifications even when the web app is closed. This implementation includes:

1. **Server-side**: VAPID key generation and ntfy server configuration
2. **Client-side**: Web Push subscription management and notification handling
3. **Integration**: How to send notifications to your custom project

## Step 1: Generate VAPID Keys

First, generate the VAPID keypair required for Web Push:

```bash
ntfy webpush keys --output-file vapid-keys.json
```

This will create a file with your VAPID keys:

```json
{
  "web-push-public-key": "your_public_key_here",
  "web-push-private-key": "your_private_key_here"
}
```

## Step 2: Configure ntfy Server

### Option A: Using server.yml configuration file

Create or update your `server.yml`:

```yaml
# Web Push Configuration
web-push-public-key: "your_public_key_here"
web-push-private-key: "your_private_key_here"
web-push-file: "/var/cache/ntfy/webpush.db"
web-push-email-address: "your-email@example.com"
web-push-expiry-warning-duration: "55d"
web-push-expiry-duration: "60d"

# Optional: Custom startup queries
web-push-startup-queries:
  - "CREATE INDEX IF NOT EXISTS idx_subscriptions_endpoint ON subscriptions(endpoint)"
```

### Option B: Using environment variables

```bash
export NTFY_WEBPUSH_PUBLIC_KEY="your_public_key_here"
export NTFY_WEBPUSH_PRIVATE_KEY="your_private_key_here"
export NTFY_WEBPUSH_FILE="/var/cache/ntfy/webpush.db"
export NTFY_WEBPUSH_EMAIL_ADDRESS="your-email@example.com"
export NTFY_WEBPUSH_EXPIRY_WARNING_DURATION="55d"
export NTFY_WEBPUSH_EXPIRY_DURATION="60d"
```

## Step 3: Frontend Web Push Implementation

### 3.1 Service Worker Registration

Create a service worker file (`sw.js`):

```javascript
// sw.js
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  if (event.data) {
    const data = event.data.json();
    console.log('[Service Worker] Push data received:', data);
    
    const options = {
      body: data.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id,
        topic: data.topic
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details',
          icon: '/images/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/images/xmark.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || data.topic, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the topic page
    event.waitUntil(
      clients.openWindow(`/topic/${event.notification.data.topic}`)
    );
  }
});

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription change received.');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
    })
    .then(function(subscription) {
      console.log('New subscription:', subscription);
      // Send the new subscription to your server
      return fetch('/api/webpush/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
          topics: ['your-topic'] // Add your topics here
        })
      });
    })
  );
});

// Utility function to convert VAPID public key
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### 3.2 Web Push Subscription Manager

Create a Web Push manager for your frontend:

```javascript
// webpush-manager.js
class WebPushManager {
  constructor(ntfyServerUrl, vapidPublicKey) {
    this.ntfyServerUrl = ntfyServerUrl;
    this.vapidPublicKey = vapidPublicKey;
    this.swRegistration = null;
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Service Worker or Push is not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToTopic(topic) {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered');
    }

    const subscription = await this.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey)
    });

    // Send subscription to ntfy server
    await this.updateSubscription(subscription, [topic]);
    
    return subscription;
  }

  async updateSubscription(subscription, topics) {
    const response = await fetch(`${this.ntfyServerUrl}/v1/webpush`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        topics: topics
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }

    return response.json();
  }

  async unsubscribe() {
    if (!this.swRegistration) {
      return;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      
      // Notify ntfy server to remove subscription
      await fetch(`${this.ntfyServerUrl}/v1/webpush`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
    }
  }

  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Usage example
const webPushManager = new WebPushManager(
  'https://your-ntfy-server.com',
  'YOUR_VAPID_PUBLIC_KEY'
);

// Initialize and subscribe
async function enableNotifications() {
  const supported = await webPushManager.init();
  if (!supported) {
    alert('Web Push not supported in this browser');
    return;
  }

  const permissionGranted = await webPushManager.requestNotificationPermission();
  if (!permissionGranted) {
    alert('Notification permission denied');
    return;
  }

  try {
    await webPushManager.subscribeToTopic('my-topic');
    console.log('Successfully subscribed to notifications');
  } catch (error) {
    console.error('Failed to subscribe:', error);
  }
}
```

## Step 4: Send Web Push Notifications

### 4.1 Using ntfy Publish API

Send notifications to your topic using the ntfy publish API:

```bash
# Basic notification
curl -X POST "https://your-ntfy-server.com/my-topic" \
  -H "X-Push: webpush" \
  -d "Hello from Web Push!"

# With title and priority
curl -X POST "https://your-ntfy-server.com/my-topic" \
  -H "X-Push: webpush" \
  -H "X-Title: Important Update" \
  -H "X-Priority: 4" \
  -d "This is an important message"

# JSON payload
curl -X POST "https://your-ntfy-server.com/my-topic" \
  -H "Content-Type: application/json" \
  -H "X-Push: webpush" \
  -d '{
    "message": "Hello from Web Push!",
    "title": "Custom Title",
    "priority": 4,
    "tags": ["warning", "urgent"]
  }'
```

### 4.2 Programmatic Integration

```javascript
// send-notification.js
class NtfyNotificationSender {
  constructor(ntfyServerUrl, topic, auth = null) {
    this.ntfyServerUrl = ntfyServerUrl;
    this.topic = topic;
    this.auth = auth;
  }

  async sendNotification(message, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Push': 'webpush'
    };

    if (this.auth) {
      headers['Authorization'] = `Bearer ${this.auth}`;
    }

    if (options.title) {
      headers['X-Title'] = options.title;
    }

    if (options.priority) {
      headers['X-Priority'] = options.priority.toString();
    }

    if (options.tags) {
      headers['X-Tags'] = options.tags.join(',');
    }

    const payload = {
      message: message,
      ...options
    };

    const response = await fetch(`${this.ntfyServerUrl}/${this.topic}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    return response.json();
  }
}

// Usage
const sender = new NtfyNotificationSender(
  'https://your-ntfy-server.com',
  'my-topic',
  'your-auth-token' // Optional
);

// Send a notification
sender.sendNotification('Hello from your app!', {
  title: 'App Notification',
  priority: 4,
  tags: ['info', 'app']
});
```

## Step 5: Complete Integration Example

Here's a complete example integrating Web Push into a custom project:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ntfy Web Push Integration</title>
</head>
<body>
    <h1>ntfy Web Push Integration</h1>
    
    <button id="enableNotifications">Enable Notifications</button>
    <button id="sendTestNotification">Send Test Notification</button>
    <button id="unsubscribe">Unsubscribe</button>

    <div id="status"></div>

    <script src="webpush-manager.js"></script>
    <script>
        const webPushManager = new WebPushManager(
            'https://your-ntfy-server.com',
            'YOUR_VAPID_PUBLIC_KEY'
        );

        const sender = new NtfyNotificationSender(
            'https://your-ntfy-server.com',
            'my-topic'
        );

        document.getElementById('enableNotifications').addEventListener('click', async () => {
            try {
                await enableNotifications();
                updateStatus('Notifications enabled successfully!');
            } catch (error) {
                updateStatus('Failed to enable notifications: ' + error.message);
            }
        });

        document.getElementById('sendTestNotification').addEventListener('click', async () => {
            try {
                await sender.sendNotification('Test notification from your app!', {
                    title: 'Test Notification',
                    priority: 3,
                    tags: ['test']
                });
                updateStatus('Test notification sent!');
            } catch (error) {
                updateStatus('Failed to send notification: ' + error.message);
            }
        });

        document.getElementById('unsubscribe').addEventListener('click', async () => {
            try {
                await webPushManager.unsubscribe();
                updateStatus('Unsubscribed from notifications');
            } catch (error) {
                updateStatus('Failed to unsubscribe: ' + error.message);
            }
        });

        function updateStatus(message) {
            document.getElementById('status').textContent = message;
        }

        // Initialize on page load
        webPushManager.init().then(supported => {
            if (supported) {
                updateStatus('Web Push is supported');
            } else {
                updateStatus('Web Push is not supported');
            }
        });
    </script>
</body>
</html>
```

## Step 6: Advanced Features

### 6.1 SSE Fallback for Non-Push Clients

For clients that don't support Web Push, use Server-Sent Events as a fallback:

```javascript
// sse-fallback.js
class SSEFallback {
  constructor(ntfyServerUrl, topic) {
    this.ntfyServerUrl = ntfyServerUrl;
    this.topic = topic;
    this.eventSource = null;
  }

  connect() {
    const url = `${this.ntfyServerUrl}/${this.topic}/sse`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.reconnect();
    };
  }

  handleMessage(message) {
    // Handle incoming messages (e.g., show in-page notification)
    console.log('Received message:', message);
    
    // Create in-page notification
    this.showInPageNotification(message);
  }

  showInPageNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <h3>${message.title || message.topic}</h3>
      <p>${message.message}</p>
      <small>${new Date(message.time * 1000).toLocaleString()}</small>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  reconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
```

### 6.2 User Management and Topic Access Control

For private topics, implement authentication:

```javascript
// auth-manager.js
class AuthManager {
  constructor(ntfyServerUrl) {
    this.ntfyServerUrl = ntfyServerUrl;
    this.authToken = localStorage.getItem('ntfy_auth_token');
  }

  async login(username, password) {
    const response = await fetch(`${this.ntfyServerUrl}/v1/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.authToken = data.token;
      localStorage.setItem('ntfy_auth_token', this.authToken);
      return true;
    }
    
    return false;
  }

  logout() {
    this.authToken = null;
    localStorage.removeItem('ntfy_auth_token');
  }

  getAuthHeaders() {
    if (this.authToken) {
      return {
        'Authorization': `Bearer ${this.authToken}`
      };
    }
    return {};
  }
}
```

## Security Considerations

1. **HTTPS Required**: Web Push only works over HTTPS with valid certificates
2. **VAPID Keys**: Keep your private key secure and never expose it to the client
3. **Topic Access**: Implement proper access control for private topics
4. **Rate Limiting**: Be aware of ntfy's rate limiting for notifications
5. **Subscription Management**: Regularly clean up unused subscriptions

## Troubleshooting

### Common Issues

1. **Service Worker not registering**: Ensure HTTPS and valid certificate
2. **Push notifications not received**: Check VAPID key configuration
3. **Permission denied**: Handle user rejection gracefully
4. **Subscription errors**: Verify endpoint URL and authentication

### Debug Commands

```bash
# Check ntfy server status
curl https://your-ntfy-server.com/v1/account

# Test topic access
curl -u username:password https://your-ntfy-server.com/mytopic

# Check Web Push configuration
ntfy serve --help | grep webpush
```

## API Reference

### Web Push Endpoints

- `POST /v1/webpush` - Update subscription
- `DELETE /v1/webpush` - Remove subscription

### Publish Endpoints

- `POST /{topic}` - Publish message to topic
- `PUT /{topic}` - Alternative publish method

### Headers

- `X-Push: webpush` - Enable Web Push delivery
- `X-Title` - Notification title
- `X-Priority` - Priority level (1-5)
- `X-Tags` - Comma-separated tags
- `Authorization` - Bearer token for private topics

This integration provides a complete Web Push notification system using ntfy as the backend, suitable for production use in custom applications. 