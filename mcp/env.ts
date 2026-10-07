// Prepares the process before any product code loads. mcp/server.ts imports
// this file first, because lib/files.ts works out where .data lives from
// process.cwd() the moment it is imported.

import { readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

// The repo root, worked out from this file, so the server behaves the same
// whatever directory the client starts it in.
export const ROOT = path.resolve(__dirname, "..");
process.chdir(ROOT);

// Stdout carries the protocol and nothing else. Anything the agents or
// their libraries log goes to stderr instead.
console.log = console.error;
console.info = console.error;
console.debug = console.error;

// The client that launches the server does not have the keys, so they are
// read from .env.local here. The file wins over whatever the client passed
// down. Only names are ever reported, never values.
try {
  const values = parseEnv(readFileSync(path.join(ROOT, ".env.local"), "utf8"));
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined) process.env[name] = value;
  }
} catch {
  console.error("Creator Ops MCP: .env.local was not found, so the action tools will ask for keys.");
}

// An assistant's own shell often routes model calls through a proxy. The key
// in .env.local is a normal key for api.anthropic.com, so both are dropped.
delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_AUTH_TOKEN;
