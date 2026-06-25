# Flarely

Know when anything important happens in your app. Send any event — an error, a signup, a payment, a deploy, a cron job, a button click — to Slack, Discord, Telegram, Email, or any webhook with a single HTTP call.

No SDK. No agents. No dashboards to babysit. Just a POST request and an alert where your team already is.

## ☁️ Hosted Cloud

Don't want to manage infrastructure? **[Flarely Cloud](https://app.getflarely.dev)** is the managed version — no Redis, no setup, no ops.

- ✅ Free tier — 500 events/month, no credit card required
- ✅ Cloud Pro — $5/month, unlimited events, all 5 destinations
- ✅ Same API — swap `https://your-server` for `https://app.getflarely.dev`

**[→ Sign up free at getflarely.dev](https://getflarely.dev)** · **[Docs](https://getflarely.dev/docs)**

---

## How it works

```
Your app  →  POST /v1/ingest  →  dedup check  →  BullMQ queue  →  Slack / Discord / Email / Telegram / Webhook
```

- **Deduplication** — same event within the configured window (default 10 min) is suppressed. One alert per issue, not one per request
- **Retries** — failed deliveries retry 3 times with exponential backoff
- **Audit log** — every ingest call is recorded (queued, delivered, suppressed, or failed)
- **Rate limiting** — 100 requests per minute per API key

## Use cases

Flarely isn't just for errors. Any discrete event worth knowing about is a good fit:

| Event | Example title |
|---|---|
| Payment failed | `"Stripe charge declined"` |
| New user signed up | `"New signup: jane@example.com"` |
| Cron job failed | `"Daily backup failed"` |
| Deploy completed | `"Deployed v2.4.1 to prod"` |
| Threshold crossed | `"Queue depth > 1000"` |
| Button clicked | `"Landing: Hero CTA clicked"` |
| Form submitted | `"Contact form: enterprise inquiry"` |
| File uploaded | `"Export ready for download"` |

---

## Self-hosting

### Requirements

- Node.js 20+
- Redis (local, Docker, or [Upstash](https://upstash.com) free tier)

### 1. Clone and install

```bash
git clone https://github.com/flarely/flarely.git
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
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL (use `rediss://` for TLS) |
| `RESEND_API_KEY` | If using email | — | [Resend](https://resend.com) API key |
| `DEFAULT_DEDUP_WINDOW` | No | `600` | Default dedup window in seconds |
| `BULLBOARD_USER` | No | — | Username for the queue dashboard. Dashboard disabled if unset |
| `BULLBOARD_PASS` | No | — | Password for the queue dashboard. Dashboard disabled if unset |

### 3. Create your first project and API key

```bash
npm run setup
```

This interactive wizard creates a project, configures your destination, and prints your API key once. To manage projects after setup:

```bash
npm run manage
```

### 4. Start the server

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## Destinations

| Destination | Config required |
|---|---|
| **Slack** | Incoming webhook URL |
| **Discord** | Webhook URL |
| **Email** | Resend API key + `to` + `from` address |
| **Telegram** | Bot token + chat ID |
| **Webhook** | Any URL — posts structured JSON |

---

## Sending notifications

No SDK needed — just a plain HTTP POST from any language.

### curl

```bash
# An error
curl -X POST https://your-flarely-server/v1/ingest \
  -H "Authorization: Bearer sk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"title":"Payment failed","message":"Stripe charge declined","level":"error","source":"billing-service"}'

# A signup
curl -X POST https://your-flarely-server/v1/ingest \
  -H "Authorization: Bearer sk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"title":"New signup: jane@example.com","level":"info","source":"auth-service"}'
```

### JavaScript / TypeScript

```ts
await fetch("https://your-flarely-server/v1/ingest", {
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

requests.post("https://your-flarely-server/v1/ingest",
  headers={"Authorization": "Bearer sk_live_your_key_here"},
  json={
    "title": "New signup: jane@example.com",
    "level": "info",
    "source": "auth-service",
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
| `429` | Rate limited (100 req/min per API key) |

---

### `GET /v1/events`

Query your event history. Requires the same `Authorization` header.

**Query parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `queued` \| `delivered` \| `suppressed` \| `failed` | — | Filter by status |
| `level` | `info` \| `warn` \| `error` \| `critical` | — | Filter by level |
| `limit` | number | `50` | Results per page (max 100) |
| `offset` | number | `0` | Pagination offset |

```bash
# All events
curl https://your-flarely-server/v1/events \
  -H "Authorization: Bearer sk_live_your_key_here"

# Only failed deliveries
curl "https://your-flarely-server/v1/events?status=failed&limit=10" \
  -H "Authorization: Bearer sk_live_your_key_here"
```

**Response**

```json
{
  "data": [...],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### `GET /health`

Returns `200` when DB and Redis are reachable, `503` when degraded. No auth required.

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

Each project can override the default window via `npm run manage`.

---

## Queue dashboard

Flarely ships with [BullBoard](https://github.com/felixmosh/bull-board) for visualising the job queue — pending jobs, active, completed, and failed.

Set `BULLBOARD_USER` and `BULLBOARD_PASS` in your `.env` to enable it:

```
BULLBOARD_USER=admin
BULLBOARD_PASS=a-strong-password
```

Then visit `/admin/queues` in your browser. The dashboard is disabled entirely if either variable is unset.

---

## Project management CLI

```bash
npm run manage
```

```
🔥  Flarely — Project Manager

  1. List projects
  2. Create a new project
  3. Add an API key to a project
  4. Revoke an API key
  5. Delete a project
  6. Exit
```

Each project has its own destination, dedup window, and API keys. Multiple apps can point to the same Flarely server using different API keys.

---

## Deploying to Fly.io

```bash
cp fly.toml.example fly.toml
# Edit fly.toml — set your app name and region

fly apps create <your-app-name>
fly volumes create flarely_data --size 1 --app <your-app-name>

fly secrets set \
  REDIS_URL=<your-redis-url> \
  RESEND_API_KEY=<your-key> \
  BULLBOARD_USER=admin \
  BULLBOARD_PASS=<strong-password>

fly deploy

# First-time setup — creates project + API key
fly ssh console -C "node dist/cli/setup.js"

# Manage projects after deploy
fly ssh console -C "node dist/cli/manage.js"
```

---

## License

AGPL-3.0 — see [LICENSE](./LICENSE)
