# Flarely

Webhook-based error and event notification service. Send a POST request from anywhere — Flarely routes it to your Slack, Discord, or email with smart deduplication so repeated errors don't spam you.

## How it works

```
Your app  →  POST /v1/ingest  →  dedup check  →  BullMQ queue  →  Slack / Discord / Email
```

- **Deduplication** — same error within the configured window (default 10 min) is suppressed. Only the first occurrence gets sent
- **Retries** — failed deliveries retry 3 times with exponential backoff
- **Audit log** — every ingest call is recorded (queued, delivered, suppressed, or failed)

---

## Hosted

The easiest way to use Flarely is the hosted version at **[flarely.dev](https://flarely.dev)** — no setup, no server, $9/mo.

---

## Self-hosting

### Requirements

- Node.js 20+
- Redis (local, Docker, or [Upstash](https://upstash.com) free tier)

### 1. Clone and install

```bash
git clone https://github.com/your-username/flarely.git
cd flarely
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP server port |
| `DATABASE_PATH` | No | `./data/flarely.db` | SQLite file path |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `RESEND_API_KEY` | If using email | — | [Resend](https://resend.com) API key |
| `DEFAULT_DEDUP_WINDOW` | No | `600` | Dedup window in seconds |

### 3. Create your first project and API key

```bash
npm run setup
```

This interactive wizard creates a project, configures your destination (Slack/Discord/email), and prints your API key once.

### 4. Start the server

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## Sending notifications

No SDK needed — just a plain HTTP POST from any language.

### curl

```bash
curl -X POST http://localhost:3000/v1/ingest \
  -H "Authorization: Bearer sk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment failed",
    "message": "Stripe charge declined: insufficient funds",
    "level": "error",
    "source": "billing-service"
  }'
```

### JavaScript / TypeScript

```ts
await fetch("http://localhost:3000/v1/ingest", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_your_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Payment failed",
    message: error.message,
    level: "error",
    source: "billing-service",
    fingerprint: `payment-fail-${userId}`, // optional — prevents per-user spam
  }),
});
```

### Python

```python
import requests

requests.post("http://localhost:3000/v1/ingest",
  headers={"Authorization": "Bearer sk_live_your_key_here"},
  json={
    "title": "Payment failed",
    "level": "error",
    "source": "billing-service",
    "message": str(e),
  }
)
```

---

## API reference

### `POST /v1/ingest`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Short alert title (max 255 chars) |
| `message` | string | No | Detail / stack trace (max 5000 chars) |
| `level` | `info` \| `warn` \| `error` \| `critical` | ✅ | Severity |
| `source` | string | ✅ | Where the alert came from (max 100 chars) |
| `fingerprint` | string | No | Custom dedup key. Auto-generated from title + source + level if omitted |

**Responses**

| Status | Meaning |
|---|---|
| `202` | Queued for delivery |
| `200` | Suppressed (duplicate within dedup window) |
| `400` | Invalid request body |
| `401` | Missing or invalid API key |
| `429` | Rate limited |

### `GET /health`

Returns `200` when DB and Redis are reachable, `503` when degraded.

```json
{
  "status": "ok",
  "checks": { "db": "ok", "redis": "ok" },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

## Deduplication

Flarely suppresses repeated alerts within a configurable time window per project.

**Auto-fingerprint** is generated from `projectId + title + source + level` — intentionally excludes `message` so the same error with different stack traces still deduplicates.

**Custom fingerprint** — pass your own `fingerprint` field to control exactly what counts as a duplicate:

```json
{ "fingerprint": "payment-fail-user-42" }
```

The window resets after it expires — so if the same error fires again 15 minutes later (with a 10-min window), it will be delivered again.

---

## Deploying to Fly.io

```bash
cp fly.toml.example fly.toml
# Edit fly.toml — set your app name and region

fly apps create <your-app-name>
fly volumes create flarely_data --size 1 --app <your-app-name>
fly secrets set REDIS_URL=<your-redis-url> RESEND_API_KEY=<your-key>
fly deploy

# First-time setup (creates project + API key)
fly ssh console -C "node dist/cli/setup.js"
```

---

## License

MIT
