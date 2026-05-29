# 9router Admin MCP (TypeScript, stdio)

MCP server for **real 9router admin/runtime API** over stdio transport.

This project is now aligned to the verified API contract on local runtime (`http://127.0.0.1:20128`) and no longer assumes fake `/admin/*` endpoints.

## Implemented MCP tools

Core (aligned with requested names):

- `9router_health`
- `9router_list_providers`
- `9router_get_provider`
- `9router_create_provider`
- `9router_update_provider`
- `9router_delete_provider`
- `9router_list_combos`
- `9router_get_combo`
- `9router_create_combo`
- `9router_update_combo` *(experimental; upstream/runtime behavior may be unreliable)*
- `9router_delete_combo`
- `9router_get_settings`
- `9router_update_settings`
- `9router_get_usage_stats`

Optional extensions (supported by current 9router):

- `9router_list_provider_nodes`
- `9router_create_provider_node`
- `9router_list_api_keys`
- `9router_create_api_key`

## Real HTTP endpoints targeted

- `GET /api/settings`
- `PATCH /api/settings` (for settings update tool)
- `GET /api/providers`
- `GET /api/providers/:id`
- `POST /api/providers`
- `PUT /api/providers/:id`
- `DELETE /api/providers/:id`
- `GET /api/combos`
- `GET /api/combos/:id`
- `POST /api/combos`
- `PUT /api/combos/:id`
- `DELETE /api/combos/:id`
- `GET /api/provider-nodes`
- `POST /api/provider-nodes`
- `GET /api/keys`
- `POST /api/keys`
- `GET /api/usage/stats?period=7d`

## Auth mode (default: NONE)

Verified runtime facts:

- `requireLogin=true` (often enabled in production deployments)
- `requireApiKey=false`
- `hasPassword=true`

This MCP supports **cookie** and **password** authentication specifically designed for 9router App Router admin panels. 

- **password** (Recommended): The MCP automatically logs in via `/api/auth/login` to obtain the session cookie, and retries on `401 Unauthorized`.
- **cookie**: Pass a static session cookie directly.
- **bearer / apiKey**: For older or different deployment configurations.

## Configuration

Copy `.env.example` and adjust it for your environment.

### Minimal (recommended default)

```bash
export NINE_ROUTER_BASE_URL="http://127.0.0.1:20128"
```

### Authentication (Production)

```bash
# none | bearer | apiKey | both | cookie | password
export NINE_ROUTER_AUTH_MODE="password"

# For 'password' mode (Recommended for Next.js App Router admin panels)
export NINE_ROUTER_ADMIN_PASSWORD="YourStrongPassword"

# For 'cookie' mode
export NINE_ROUTER_SESSION_COOKIE="auth_token=eyJhbGci..."

# For 'bearer' or 'apiKey' modes
export NINE_ROUTER_BEARER_TOKEN="<token>"
export NINE_ROUTER_API_KEY="<api-key>"

# optional timeout
export NINE_ROUTER_TIMEOUT_MS="15000"
```

Backward-compatible env aliases are still accepted:

- `NINE_ROUTER_ADMIN_BASE_URL`
- `NINE_ROUTER_ADMIN_TOKEN`
- `NINE_ROUTER_ADMIN_API_KEY`
- `NINE_ROUTER_ADMIN_TIMEOUT_MS`

## Setup

```bash
cd research/9router-admin-mcp
npm install
cp .env.example .env
npm run build
npm start
```

Development mode:

```bash
npm run dev
```

## Notes on payload validation

Input schemas are updated to follow real route behavior as closely as possible from inspected 9router code:

- Providers create/update fields mirror `/api/providers` and `/api/providers/:id` route handlers
- Combos enforce `name` regex (`^[a-zA-Z0-9_-]+$`) and use `models: string[]`
- Usage period matches valid set: `24h | 7d | 30d | 60d | all`
- Settings update accepts known fields and allows additional keys (`catchall`) because 9router settings are extensible

## What is usable now

- Read provider/combo/settings resources against live `/api/*`
- Create/get/delete combos confirmed against live host; combo update should be treated as experimental for now
- Read usage stats by period
- Read/create provider nodes and API keys (optional tools)
- Health tool reports real runtime auth posture based on `/api/settings`
