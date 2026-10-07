import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const run = promisify(execFile);

export type Source = { title: string; url: string; site: string };

export type ToolContext = {
  onStep: (label: string) => void;
  // Every page the agent actually saw. The brief may only link to these.
  sources: Map<string, Source>;
  paidRunsLeft: number;
};

// Tool output goes straight back to the model. Past this size it is cut, and
// the model is told so it can ask a narrower question instead.
const OUTPUT_LIMIT = 24_000;

function clip(text: string) {
  if (text.length <= OUTPUT_LIMIT) return text;
  return `${text.slice(0, OUTPUT_LIMIT)}\n[Output cut at ${OUTPUT_LIMIT} characters. Narrow the request to see the rest.]`;
}

type QueritResponse = {
  error_code?: number;
  error_msg?: string;
  results?: {
    result?: Array<{
      url: string;
      title: string;
      snippet?: string;
      page_age?: string;
      site_name?: string;
      highlights?: string[];
    }>;
  };
};

async function glasser(args: string[]) {
  const bin = path.join(process.cwd(), "node_modules", ".bin", "glasser");
  try {
    const { stdout } = await run(bin, ["--json", ...args], {
      timeout: 90_000,
      maxBuffer: 16 * 1024 * 1024,
    });
    return clip(stdout);
  } catch (error) {
    const detail = error as { stderr?: string; stdout?: string; message: string };
    return `Glasser failed: ${detail.stderr || detail.stdout || detail.message}`;
  }
}

export function researchTools(context: ToolContext) {
  const webSearch = betaZodTool({
    name: "web_search",
    description:
      "Search the live web through Querit. Use it for what is working right now: recent posts, breakdowns of viral formats, platform trend reports. Returns titles, URLs, snippets and highlights.",
    inputSchema: z.object({
      query: z.string().describe("A specific search query"),
      recency: z
        .enum(["week", "month", "year", "any"])
        .describe("How recent the results must be"),
    }),
    run: async ({ query, recency }) => {
      context.onStep(`Searching the web: ${query}`);
      const date = { week: "w1", month: "m1", year: "y1", any: null }[recency];
      const response = await fetch("https://api.querit.ai/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.QUERIT_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          count: 8,
          highlights: true,
          ...(date ? { filters: { timeRange: { date } } } : {}),
        }),
      });
      if (!response.ok) return `Querit failed with status ${response.status}.`;

      const body = (await response.json()) as QueritResponse;
      // Querit reports success as error_code 200, not as an absent code.
      if (body.error_code && body.error_code !== 200) {
        return `Querit failed: ${body.error_msg || body.error_code}`;
      }

      const results = body.results?.result ?? [];
      for (const result of results) {
        context.sources.set(result.url, {
          title: result.title,
          url: result.url,
          site: result.site_name ?? new URL(result.url).hostname,
        });
      }
      return clip(JSON.stringify(results));
    },
  });

  const findData = betaZodTool({
    name: "find_data_source",
    description:
      "Search Glasser's catalog of paid data endpoints (TikTok, Instagram, YouTube, ad libraries and more). Free. Returns candidate endpoints with their provider and endpoint names.",
    inputSchema: z.object({
      capability: z.string().describe("What data you need, e.g. 'top TikTok videos for a hashtag'"),
      use_case: z.string().describe("One sentence on why you need it"),
    }),
    run: async ({ capability, use_case }) => {
      context.onStep(`Looking for a data source: ${capability}`);
      return glasser(["search", capability, "--use-case", use_case]);
    },
  });

  const inspectData = betaZodTool({
    name: "inspect_data_source",
    description:
      "Read one Glasser endpoint's input schema and price before running it. Free. Always call this before pull_data.",
    inputSchema: z.object({ provider: z.string(), endpoint: z.string() }),
    run: async ({ provider, endpoint }) => {
      context.onStep(`Checking the price of ${provider} ${endpoint}`);
      return glasser(["inspect", "-p", provider, "-e", endpoint]);
    },
  });

  const pullData = betaZodTool({
    name: "pull_data",
    description:
      "Run one Glasser endpoint. This costs money per call and the number of calls is capped, so inspect first and make each call count.",
    inputSchema: z.object({
      provider: z.string(),
      endpoint: z.string(),
      input: z.string().describe("The endpoint input as a JSON string, matching its inspected schema"),
    }),
    run: async ({ provider, endpoint, input }) => {
      if (context.paidRunsLeft <= 0) {
        return "The paid data budget for this brief is used up. Write the brief from what you have.";
      }
      try {
        JSON.parse(input);
      } catch {
        return "The input is not valid JSON. Fix it and call again.";
      }
      context.paidRunsLeft -= 1;
      context.onStep(`Pulling data from ${provider}`);
      return glasser([
        "run", "-p", provider, "-e", endpoint, "-i", input,
        "--wait", "--wait-timeout", "75",
        // Glasser requires one per paid call, so a retry is never billed twice.
        "--idempotency-key", randomUUID(),
      ]);
    },
  });

  return [webSearch, findData, inspectData, pullData];
}
