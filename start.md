
## ntfy: quick start (Web Push + Auth)

Follow these steps to run the server, enable Web Push, and secure access with tokens.

### 1) Configure `server/server.yml`
- Already set in this repo:
  - `base-url: "http://localhost:8099"`
  - `listen-http: ":8099"`
  - `web-push-public-key`, `web-push-private-key`, `web-push-file`, `web-push-email-address`
  - `auth-file: "/home/taida/Desktop/ntfy/user.db"`
  - `auth-default-access: "deny-all"` (requires auth by default)

If you need to generate a fresh VAPID key pair:
```
go run main.go webpush keys
```
Paste the printed public/private keys into `server/server.yml` under `web-push-*`.

### 2) Start the server
```
go run main.go serve --config server/server.yml
```
Note: Avoid `sudo` on port 8099 to keep the auth DB writable by your user.

### 3) Create an admin user
Run this in another terminal while the server is running:
```
NTFY_PASSWORD='ChangeMe_Strong!' \
  go run main.go user --config server/server.yml add --role=admin admin
```

### 4) Issue a Bearer token for the admin
```
go run main.go token --config server/server.yml add --label nextjs admin
```
Copy the printed token and store it as a server-side secret (e.g., `NTFY_TOKEN`).

### 5) Use the token
- Send the token in requests: `Authorization: Bearer <token>`

Register a Web Push subscription:
```
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

Publish a message to a topic:
```
curl -X POST -H "Authorization: Bearer $NTFY_TOKEN" -d "Hello" http://localhost:8099/<topic>
```

Optional: Allow anonymous read to a public topic (ACL)
```
go run main.go access --config server/server.yml everyone announcements read
```

More details: https://docs.ntfy.sh/