import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { HttpClient } from "./client/http.js";
import { AdminApiClient } from "./client/adminApi.js";
import { registerAdminTools } from "./tools/registerTools.js";

async function main(): Promise<void> {
  const config = loadConfig();

  const server = new McpServer({
    name: "9router-admin-mcp",
    version: "0.1.0",
  });

  const http = new HttpClient(config);
  const api = new AdminApiClient(http);

  registerAdminTools(server, api);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("9router-admin-mcp is running via stdio transport");
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
