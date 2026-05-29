---
name: 9router-admin-mcp
description: Use this skill to integrate, test, and manage the 9router AI Gateway via the 9router-admin-mcp tool. Provides guidance on configuring authentication (Base URL and Admin Password) and lists all supported 9router capabilities (chat, image, tts, stt, embeddings, web search, web fetch). Trigger when a user mentions 9router, 9router-admin-mcp, or wants to manage AI provider connections.
---

# 9router Admin MCP

This skill orchestrates the setup and usage of the `9router-admin-mcp` server, which interacts with the Next.js App Router admin panel of 9Router. 

9Router is a local/remote AI gateway exposing OpenAI-compatible REST endpoints for Chat, Image Generation, TTS, STT, Embeddings, Web Search, and Web Fetch.

## 1. Initial Setup & MCP Configuration (CRITICAL)

Before using the `9router-admin-mcp` tools, you MUST configure the MCP. The admin API requires cookie-based authentication via an admin password.

**Agent Instruction:** When you need to set up or configure this MCP, you MUST explicitly ask the USER for the following information if you do not already have it:
1. **Router Base URL** (e.g., `https://9router.example.com`)
2. **Admin Password**

Once provided, configure the `mcp.json` as follows:

```json
{
  "mcpServers": {
    "9router": {
      "command": "node",
      "args": ["/path/to/9router-admin-mcp/dist/index.js"],
      "env": {
        "NINE_ROUTER_BASE_URL": "<PROVIDED_BASE_URL>",
        "NINE_ROUTER_AUTH_MODE": "password",
        "NINE_ROUTER_ADMIN_PASSWORD": "<PROVIDED_PASSWORD>"
      }
    }
  }
}
```

The MCP server will automatically login via `/api/auth/login` and extract the session cookie (`auth_token`) for subsequent requests.

## 2. Managing 9router (Admin Panel)

Use the MCP tools to manage the router's configuration:
- `9router_health`: Check router status and auth posture.
- `9router_list_providers` / `9router_get_provider`: View configured AI providers (OpenAI, Anthropic, Gemini, etc.).
- `9router_create_provider` / `9router_update_provider` / `9router_delete_provider`: Manage providers.
- `9router_list_combos`: View model routing combos.

## 3. 9Router AI Capabilities (Client Usage)

Once the admin configuration is complete, users or agents can use the 9Router API. 9Router exposes OpenAI-compatible REST endpoints for various tasks. 

> For detailed client API usage of these specific capabilities, refer to their respective SKILL docs in the 9Router repository:
> - **Chat/LLM**: [skills/9router-chat](https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-chat/SKILL.md) - `/v1/chat/completions` (OpenAI format).
> - **Image Generation**: [skills/9router-image](https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-image/SKILL.md) - `/v1/images/generations` (DALL-E format).
> - **Text-to-Speech (TTS)**: [skills/9router-tts](https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-tts/SKILL.md) - `/v1/audio/speech` (OpenAI format).
> - **Speech-to-Text (STT)**: [skills/9router-stt](https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-stt/SKILL.md) - `/v1/audio/transcriptions` (OpenAI format).
> - **Embeddings**: [skills/9router-embeddings](https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-embeddings/SKILL.md) - `/v1/embeddings` (OpenAI format).
> - **Web Search**: [skills/9router-web-search](https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-web-search/SKILL.md) - Google/Brave search integration.
> - **Web Fetch**: [skills/9router-web-fetch](https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-web-fetch/SKILL.md) - Jina Reader / Scraper integration.

## Troubleshooting

- If MCP tools return `401 Unauthorized` or `fetch failed (ECONNRESET)`, ensure that `NINE_ROUTER_AUTH_MODE` is set to `"password"` and the `NINE_ROUTER_ADMIN_PASSWORD` is correct. The MCP server handles the cookie extraction automatically.
- Ensure the `NINE_ROUTER_BASE_URL` does not have a trailing slash.
