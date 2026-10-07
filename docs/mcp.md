# The Creator Ops MCP server

An MCP (Model Context Protocol) server that lets an AI assistant operate
Creator Ops. Claude Code, Claude Desktop, Cursor or any other MCP client can
read the program and run the four agents, using the same functions and the
same `.data/` files as the app. The server lives in `mcp/server.ts` and talks
over stdio.

It loads its keys from `.env.local` in the repo root, so the client does not
need them. It needs Node on the machine and `bun install` to have been run.

## Tools

Read tools. Free and instant.

| Tool | What it returns |
|---|---|
| `get_program` | The brand, its pay rules and the creator size range. |
| `get_brief` | The saved brief, or the sample one, with a `source` field saying which. |
| `get_roster` | The roster, best score first. Optional `status` filter and `limit`. |
| `get_outreach` | The outreach drafts and whether each is approved. |
| `get_posts` | Reviewed posts with status, flags, brief score, feedback, payout and URL. Optional `status` filter and `limit`. |
| `get_activity` | Recent handoffs between the agents. Optional `limit`. |

Action tools. Each of the first four starts a paid agent run that takes one
to four minutes and spends a few cents of data plus a model call. The tool
descriptions say so, and a well-behaved assistant asks before calling one.

| Tool | What it does |
|---|---|
| `write_brief` | Runs the Strategy agent and saves a new brief. |
| `find_creators` | Runs the Research agent and saves a new roster. |
| `draft_outreach` | Runs the Sales agent and saves a draft for each top suggested creator. Needs a roster. |
| `review_posts` | Runs the Review agent and saves the reviews and payouts. Needs a roster. |
| `approve_outreach` | Marks one draft as Approved, by handle. Free. Approving does not send anything. |

Each run returns a short summary and the steps the agent reported. Clients
that ask for progress also get each step as it happens. A run saves over the
previous result, exactly as the buttons in the app do. Only one run per agent
can be in flight at a time.

## Connect it

The command is the same everywhere. Replace `/path/to/creator-ops` with the
absolute path to this repo:

```json
{
  "mcpServers": {
    "creator-ops": {
      "command": "node",
      "args": [
        "--import",
        "/path/to/creator-ops/node_modules/tsx/dist/loader.mjs",
        "/path/to/creator-ops/mcp/server.ts"
      ],
      "env": {
        "TSX_TSCONFIG_PATH": "/path/to/creator-ops/tsconfig.json"
      }
    }
  }
}
```

The absolute paths are what let the client start the server from any
directory. Inside the repo, `bun run mcp` starts the same server by hand.

### Claude Code

Nothing to set up. The repo has a `.mcp.json` at its root, and Claude Code
picks it up when it is opened in the repo. Approve the `creator-ops` server
the first time it asks, then check it with `/mcp`. The paths in `.mcp.json`
are absolute, so update them if the repo moves or is cloned somewhere else.

### Claude Desktop

Open Settings, Developer, Edit Config. That opens
`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS
(`%APPDATA%\Claude\claude_desktop_config.json` on Windows). Add the
`creator-ops` entry above under `mcpServers`, save, and restart Claude
Desktop.

Claude Desktop does not read your shell profile. If Node is installed through
nvm or a similar tool, set `command` to the full path that `which node`
prints.

### Cursor

Add the same JSON to `.cursor/mcp.json` in this repo for this project only,
or to `~/.cursor/mcp.json` for every project. Then open Cursor Settings, MCP,
and switch `creator-ops` on.

## Things to ask

- "How is the Lumen program doing? Show me the suggested creators and any
  posts that got flagged."
- "Read me the outreach draft for the top creator. If I like it, approve it."
- "The brief feels stale. Write a new one, then find creators for it." The
  assistant should tell you this costs a few cents and a few minutes, and
  wait for a yes.

## Notes

- Stdout carries the protocol only. Anything the agents log goes to stderr,
  which most clients show in their MCP logs.
- Keys are read from `.env.local` and never printed. If one is missing, the
  tool that needs it says which name to add.
- The server drops `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN` from its
  own environment, so the model is always called at api.anthropic.com with
  the key from `.env.local`.
