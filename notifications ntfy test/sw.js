// Service Worker for Web Push Notifications
let vapidPublicKey = 'BC7r1EiGxME5Pu7ghP8bOMXtwM8WlIlzYcr_9grg6de2ij-v7ZilE3LWkMWGrhARsT-M7KdCwsIplV5vvwELeNo';

// Track registered clients
let registeredClients = new Set();

// Listen for messages from the main thread to update VAPID key
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SET_VAPID_KEY') {
    vapidPublicKey = event.data.vapidKey;
    console.log('[Service Worker] VAPID key updated:', vapidPublicKey);
  } else if (event.data && event.data.type === 'REGISTER_CLIENT') {
    registeredClients.add(event.data.clientId);
    console.log('[Service Worker] Client registered:', event.data.clientId);
    console.log('[Service Worker] Total registered clients:', registeredClients.size);
  }
});

// Listen for BroadcastChannel messages
let broadcastChannel = null;

function getBroadcastChannel() {
  console.log('[Service Worker] getBroadcastChannel called, broadcastChannel exists:', !!broadcastChannel);
  if (!broadcastChannel) {
    console.log('[Service Worker] Creating new BroadcastChannel...');
    broadcastChannel = new BroadcastChannel('web-push-notifications');
    console.log('[Service Worker] BroadcastChannel created');
    
    broadcastChannel.addEventListener('message', function(event) {
      console.log('[Service Worker] Received BroadcastChannel message:', event.data);
      if (event.data.type === 'TEST_MESSAGE') {
        console.log('[Service Worker] Test message received:', event.data.message);
        // Echo back to confirm communication
        broadcastChannel.postMessage({
          type: 'TEST_RESPONSE',
          message: 'Service worker received your test message'
        });
      }
    });
  } else {
    console.log('[Service Worker] Using existing BroadcastChannel');
  }
  return broadcastChannel;
}

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log('[Service Worker] Event data type:', typeof event.data);
  console.log('[Service Worker] Event data:', event.data);
  
  if (event.data) {
    let data;
    try {
      data = event.data.json();
      console.log('[Service Worker] Push data received:', data);
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
      // Try to get text data as fallback
      const textData = event.data.text();
      console.log('[Service Worker] Raw text data:', textData);
      data = { message: textData };
    }
    
    // Handle our API notification format
    let title, body, icon;
    
    if (data.title && data.message) {
      // Our API format
      title = data.title;
      body = data.message;
      
      // Add priority indicator
      if (data.priority) {
        const priorityLabels = {
          1: '🔴 Urgent',
          2: '🟡 High',
          3: '🟢 Normal',
          4: '⚪ Low',
          5: '⚪ Min'
        };
        title = `${priorityLabels[data.priority] || ''} ${title}`;
      }
      
      // Add tags if present
      if (data.tags && data.tags.length > 0) {
        body = `${data.tags.join(' ')}: ${body}`;
      }
      
      // Add timestamp if available
      if (data.timestamp) {
        const date = new Date(data.timestamp);
        body = `${body}\n\n📅 ${date.toLocaleString()}`;
      }
    } else if (data.message && data.message.message) {
      // ntfy format - data.message contains the actual message object
      title = data.message.title || data.message.topic || 'Notification';
      body = data.message.message || 'New notification';
      
      // Add priority indicator
      if (data.message.priority) {
        const priorityLabels = {
          1: '🔴 Urgent',
          2: '🟡 High',
          3: '🟢 Normal',
          4: '⚪ Low',
          5: '⚪ Min'
        };
        title = `${priorityLabels[data.message.priority] || ''} ${title}`;
      }
      
      // Add tags if present
      if (data.message.tags && data.message.tags.length > 0) {
        body = `${data.message.tags.join(' ')}: ${body}`;
      }
      
      // Add timestamp if available
      if (data.message.time) {
        const date = new Date(data.message.time * 1000);
        body = `${body}\n\n📅 ${date.toLocaleString()}`;
      }
    } else if (data.message) {
      // Fallback for ntfy format
      title = data.message.title || data.message.topic || 'Notification';
      body = data.message.message || 'New notification';
      
      // Add priority indicator
      if (data.message.priority) {
        const priorityLabels = {
          1: '🔴 Urgent',
          2: '🟡 High',
          3: '🟢 Normal',
          4: '⚪ Low',
          5: '⚪ Min'
        };
        title = `${priorityLabels[data.message.priority] || ''} ${title}`;
      }
      
      // Add tags if present
      if (data.message.tags && data.message.tags.length > 0) {
        body = `${data.message.tags.join(' ')}: ${body}`;
      }
      
      // Add timestamp if available
      if (data.message.time) {
        const date = new Date(data.message.time * 1000);
        body = `${body}\n\n📅 ${date.toLocaleString()}`;
      }
    } else {
      // Fallback for other formats
      title = data.title || data.topic || 'Notification';
      body = data.message || 'New notification';
    }
    
    const options = {
      body: body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || data.message?.id,
        topic: data.topic || data.message?.topic,
        originalData: data
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
      ],
      tag: data.topic || data.message?.topic || 'notification', // Group notifications by topic
      requireInteraction: (data.priority || data.message?.priority) === 1, // Urgent notifications require interaction
      silent: false
    };

    console.log('[Service Worker] Showing notification:', title, options);
    
    // Send notification data to all clients (main page)
    const notificationData = {
      title: data.title || data.message?.title || title,
      message: data.message || data.message?.message || body,
      priority: data.priority || data.message?.priority || 3,
      tags: data.tags || data.message?.tags || [],
      icon: data.icon || data.message?.icon,
      click: data.click || data.message?.click,
      timestamp: data.timestamp || (data.message?.time ? data.message.time * 1000 : Date.now()),
      topic: data.topic || data.message?.topic
    };
    
    // For ntfy format, extract from data.message
    if (data.message && data.message.message) {
      notificationData.title = data.message.title || data.message.topic || title;
      notificationData.message = data.message.message || body;
      notificationData.priority = data.message.priority || 3;
      notificationData.tags = data.message.tags || [];
      notificationData.timestamp = data.message.time ? data.message.time * 1000 : Date.now();
      notificationData.topic = data.message.topic;
      console.log('[Service Worker] Extracted ntfy format data:', notificationData);
    }
    
    console.log('[Service Worker] Final notification data for clients:', notificationData);
    
    // Notify all clients about the received notification using BroadcastChannel
    console.log('[Service Worker] About to send BroadcastChannel messages...');
    const broadcastChannel = getBroadcastChannel();
    console.log('[Service Worker] BroadcastChannel obtained:', !!broadcastChannel);
    
    // Send the actual notification
    console.log('[Service Worker] Sending notification via BroadcastChannel...');
    broadcastChannel.postMessage({
      type: 'NOTIFICATION_RECEIVED',
      notification: notificationData
    });
    console.log('[Service Worker] Sent notification via BroadcastChannel');
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the topic page or your app
    const topic = event.notification.data.topic;
    if (topic) {
      event.waitUntil(
        clients.openWindow(`http://localhost:8099/${encodeURIComponent(topic)}`)
      );
    }
  } else {
    // Default action - open the main app
    event.waitUntil(clients.openWindow('http://localhost:8099'));
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});

// Handle background sync
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    console.log('[Service Worker] Performing background sync...');
    // Add any background sync logic here
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
  }
}

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(vapidPublicKey)
    })
    .then(function(subscription) {
      console.log('[Service Worker] New subscription:', subscription);
      // You could send the new subscription to your server here
    })
    .catch(function(error) {
      console.error('[Service Worker] Failed to resubscribe:', error);
    })
  );
});

// Utility function to convert base64 URL to Uint8Array
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