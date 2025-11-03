# ntfy Quick Start Guide
**Web Push + Authentication Setup**

This guide walks you through setting up ntfy with Web Push notifications and token-based authentication.

## Prerequisites

Before starting, build the required dependencies for the web interface:
```bash
make cli-deps-static-sites
```

## Step 0: Build Production Binary

Build the production binary with proper version information:
```bash
./build-prod.sh
```
This creates `ntfy-prod` with **your current code changes included**.

> **Important**: Every time you edit the code (like fixing the webpush subscription limit bug), you must rebuild:
> ```bash
> ./build-prod.sh
> sudo systemctl restart ntfy  # If running as service
> ```

## Step 1: Configure the Server

The `server/server.yml` file is already configured with:
- **Base URL**: `http://localhost:8099`
- **Listen Port**: `:8099`
- **Web Push Keys**: `web-push-public-key`, `web-push-private-key`, `web-push-file`, `web-push-email-address`
- **Auth Database**: `/home/taida/Desktop/ntfy/user.db`
- **Default Access**: `deny-all` (requires authentication by default)

### Generate VAPID Keys (Optional)
If you need fresh VAPID keys for Web Push:
```bash
go run main.go webpush keys
```
Copy the generated public/private keys into `server/server.yml` under the `web-push-*` settings.

## Step 2: Start the Server

### Development Mode (Testing)
```bash
go run main.go serve --config server/server.yml
```

### Production Mode (Recommended)
```bash
./ntfy-prod serve --config server/server.yml
```

> **Note**: Avoid using `sudo` on port 8099 to keep the auth database writable by your user.

### Production: Run as System Service (Always Running)

To make ntfy-prod start automatically and keep running in the background:

1. **Install the service:**
```bash
sudo cp ntfy.service /etc/systemd/system/
sudo systemctl daemon-reload
```

2. **Start and enable the service:**
```bash
sudo systemctl start ntfy
sudo systemctl enable ntfy  # Auto-start on boot
```

3. **Check status:**
```bash
sudo systemctl status ntfy
```

4. **View logs:**
```bash
sudo journalctl -u ntfy -f  # Follow logs in real-time
```

5. **Manage the service:**
```bash
sudo systemctl stop ntfy     # Stop the service
sudo systemctl restart ntfy  # Restart the service
```

## Step 3: Create an Admin User

In a new terminal (while the server is running):
```bash
# Development
NTFY_PASSWORD='ChangeMe_Strong!' \
  go run main.go user --config server/server.yml add --role=admin admin

# Production
NTFY_PASSWORD='ChangeMe_Strong!' \
  ./ntfy-prod user --config server/server.yml add --role=admin admin
```

## Step 4: Generate Bearer Token

Create a token for API access:
```bash
# Development
go run main.go token --config server/server.yml add --label nextjs admin

# Production
./ntfy-prod token --config server/server.yml add --label nextjs admin
```
**Important**: Save the generated token securely (e.g., as `NTFY_TOKEN` environment variable).

## Step 5: Using the API

### Authentication
Include the Bearer token in all API requests:
```
Authorization: Bearer <your-token>
```

### Register Web Push Subscription
```bash
curl -X POST \
  -H "Authorization: Bearer $NTFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "endpoint": "<endpoint>",
        "auth": "<auth>",
        "p256dh": "<p256dh>",
        "topics": ["<topic>"]
      }' \
  http://localhost:8099/v1/webpush
```

### Publish a Message
```bash
curl -X POST \
  -H "Authorization: Bearer $NTFY_TOKEN" \
  -d "Hello" \
  http://localhost:8099/<topic>
```

## Optional: Public Topic Access

To allow anonymous read access to a public topic:
```bash
go run main.go access --config server/server.yml everyone announcements read
```

## Additional Resources

For more detailed documentation, visit: https://docs.ntfy.sh/