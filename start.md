# ntfy Quick Start Guide
**Web Push + Authentication Setup**

This guide walks you through setting up ntfy with Web Push notifications and token-based authentication.

## Prerequisites

Before starting, build the required dependencies for the web interface:
```bash
make cli-deps-static-sites
```

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

```bash
go run main.go serve --config server/server.yml
```
> **Note**: Avoid using `sudo` on port 8099 to keep the auth database writable by your user.

## Step 3: Create an Admin User

In a new terminal (while the server is running):
```bash
NTFY_PASSWORD='ChangeMe_Strong!' \
  go run main.go user --config server/server.yml add --role=admin admin
```

## Step 4: Generate Bearer Token

Create a token for API access:
```bash
go run main.go token --config server/server.yml add --label nextjs admin
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