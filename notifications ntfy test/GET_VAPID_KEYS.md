# Getting VAPID Keys from ntfy Server

## Method 1: Check ntfy Server Configuration

If you're running ntfy locally, check your ntfy configuration file or command line arguments:

```bash
# Check if ntfy is running with web push enabled
ntfy serve --help | grep web-push
```

Look for these parameters:
- `--web-push-public-key`
- `--web-push-private-key`

## Method 2: Generate VAPID Keys for ntfy

### Option A: Using ntfy to generate keys

```bash
# Generate VAPID keys using ntfy
ntfy serve --web-push-public-key=YOUR_PUBLIC_KEY --web-push-private-key=YOUR_PRIVATE_KEY
```

### Option B: Generate keys manually

```bash
# Install web-push library
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

This will output something like:
```
=======================================
Public Key:
BNcbUYaRXWUFPPdu_kpjJUiL9vm1MPaBYNahRSjG8nHtnE0PjFu6afGj26hXqssI6pB4ICDYW38yf4bvqItr0S0

Private Key:
YOUR_PRIVATE_KEY_HERE
=======================================
```

## Method 3: Check ntfy Server Status

If ntfy is running, you can check if web push is enabled:

```bash
# Check ntfy server status
curl http://localhost:2586/v1/config
```

Look for web push configuration in the response.

## Method 4: Use the Test Tool

1. Open `vapid-test.html` in your browser
2. Click "Generate VAPID Keys" 
3. Use the generated public key for testing

## Troubleshooting

### Common Issues:

1. **Wrong VAPID Key Format**
   - Must be 87 characters long
   - Must be valid base64
   - Should decode to 65 bytes

2. **ntfy Server Not Configured**
   - Ensure ntfy is running with web push enabled
   - Check that the VAPID keys match between client and server

3. **Browser Issues**
   - Must be HTTPS or localhost
   - Modern browser required (Chrome, Firefox, Edge)
   - Notification permissions must be granted

### Testing Steps:

1. **Test VAPID Key Format**
   - Use `vapid-test.html` to validate your key
   - Ensure it's 87 characters and valid base64

2. **Test ntfy Server**
   - Send a test notification: `curl -d "test" http://localhost:2586/test-topic`
   - Check if web push endpoint responds: `curl http://localhost:2586/v1/webpush`

3. **Test Browser Support**
   - Open browser console
   - Check for service worker registration
   - Verify push manager is available

## Example ntfy Configuration

```yaml
# ntfy.yml
web-push-public-key: "BNcbUYaRXWUFPPdu_kpjJUiL9vm1MPaBYNahRSjG8nHtnE0PjFu6afGj26hXqssI6pB4ICDYW38yf4bvqItr0S0"
web-push-private-key: "YOUR_PRIVATE_KEY_HERE"
```

Or command line:
```bash
ntfy serve \
  --web-push-public-key="BNcbUYaRXWUFPPdu_kpjJUiL9vm1MPaBYNahRSjG8nHtnE0PjFu6afGj26hXqssI6pB4ICDYW38yf4bvqItr0S0" \
  --web-push-private-key="YOUR_PRIVATE_KEY_HERE"
``` 