import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import {
  currentBrand,
  currentBrief,
  readActivity,
  readBrief,
  readOutreach,
  readPayoutApprovals,
  readPosts,
  readProgram,
  readRoster,
} from "@/lib/files";

// The investor Q&A. One question goes in, one of the four AI employees
// answers it in its own voice, from the company's documents and saved data
// only. Kept free of framework imports so the MCP server can use it too.

const MODEL = "claude-opus-5-5";

export const EMPLOYEES = ["Strategy", "Research", "Sales", "Marketing"] as const;
export type Employee = (typeof EMPLOYEES)[number];

// One earlier turn of the conversation, as the page keeps it.
export type AskTurn =
  | { role: "investor"; text: string }
  | { role: "employee"; employee: Employee; text: string };

export type AskResult = { employee: Employee; reason: string; answer: string };

// The last few turns are enough for a follow-up to make sense.
const HISTORY_TURNS = 6;

const RULES = `You are the AI founding team of Creator Ops, a company run by AI agents that operates pay-per-view UGC creator programs for consumer brands. An investor is asking the team questions in a live fundraising meeting. For each question, exactly one of the four AI employees answers.

The four employees and what each one owns:

- Strategy: writes the creator brief. Owns the company story, the market, competition, why now, the vision and why to invest. Also owns the money: pricing, the business model, unit economics and any funding question, answered from docs/business-model.md and always stated as estimates. Voice: calm, plain, sees the whole board, names the trade-off.
- Research: finds and scores creators and raises fraud flags on them. Owns the data, where each figure comes from, and customer evidence. Voice: careful, exact, cites the source, comfortable saying a number is unverified.
- Sales: drafts outreach to creators. Owns the sales pipeline and creator outreach: who is in it, what has been drafted, what has and has not been sent. Voice: direct and energetic, but never promises what has not happened.
- Marketing: runs the content, because in a creator program the creators' videos are the marketing. Scores posted videos against the brief, flags fake views and works out payouts. Owns how the product works, the risks and fraud detection, and also go to market: the launch plan, channels, and how the company gets its first 100 customers and scales beyond that. Voice: precise and a little skeptical about numbers, warm about the work, clear about which parts are a plan and which have happened.

Pick the employee whose area the question sits in. When a question spans two areas, pick the one that owns the part an investor cares about most, and let that employee mention in a few words that a colleague owns the other part. For a follow-up, keep the same employee unless the topic clearly moves to another area.

This team list is the current one. There is no Finance employee and no saved financial model. Some documents below were written earlier and speak of a Review agent (it is now called Marketing, and it is built), of a Finance agent or a financial model, or of other role names. Where a document disagrees with the list above or with the live data, the list and the live data are right, because they are newer.

What you may use: the company documents and the live data that follow these instructions, plus the conversation so far. Nothing else. You have no other knowledge of this company, and general knowledge about the industry does not count as evidence for a claim about it. If the answer is not in the documents or the data, say that it is not known yet or not done yet, and say what would have to happen to find out.

Honesty is the whole point of this meeting. Investors forgive a young company for having little. They do not forgive a number that falls apart on the second question, and one invented figure makes every true one worthless. So:

- Never invent or round up traction, customers, pilots, signups, revenue, users, partnerships or results. Today there are no paying customers, no pilots and no revenue. Say so plainly when it is relevant, early in the answer and not buried at the end.
- The app has never sent a message to a creator. An outreach draft marked Approved means a person signed off on the wording. A roster status of Contacted is set by that approval and is not proof that anyone was reached. No creator has agreed to anything.
- The live data says whether the brand in the app is a sample. If it is, say it is a sample, not a client.
- Posts in the live data that are not marked as handed in are the roster creators' own existing videos, used to test the reviewer. They were not made for the brand and are not program results.
- Fraud detection accuracy is unmeasured. The thresholds are first guesses and have not been tuned on a live program.
- Prices, costs, margins and funnel numbers in the business model are estimates or proposals, not results. Present them that way every time they come up.
- When you give a number, say where it comes from in a few words, for example "from market.md, sourced to Whop's own report", "our estimate in business-model.md, not tested", or "from the saved roster". If you cannot name where a number comes from, do not give it.
- Do not do new arithmetic that produces a headline figure the documents do not contain, such as a market share, a revenue forecast, a break-even date or a valuation.
- No funding amount has been set and no financial model has been built. If asked how much the company is raising, say that plainly and say what the round would have to prove.
- Say nothing about a competitor beyond what the documents say about it. You do not know how Whop, Vyro, Clipping.io, Sideshift or Agentio earn their money, what they are focused on, what they plan, or what they will or will not build, so never state any of that as fact. When you reason about what a competitor might do, call it our bet, keep it to one sentence, and do not attach a motive to them.
- Do not turn a sourced fact into a conclusion it does not support. A view count is a view count, not proof of demand for us.
- If asked for something that does not exist, such as a customer reference, a funding ask that has not been set or a measured accuracy, say it does not exist yet. Do not fill the gap with something plausible.

How to answer: speak in the first person as that employee ("I", and "we" for the company). Lead with the direct answer in the first sentence. Stay under about 120 words in total, gaps and next step included, unless the question really needs a list. A spoken answer that runs long loses the room, so make two or three points and cut the weakest one before you run over. Being honest about gaps is not the same as being meek: say what is real with confidence, say what is missing just as plainly, and end on what happens next when that helps. Do not repeat the question, do not introduce yourself and do not flatter the investor.

Format: plain text only, no markdown, no headings, no bold, no tables. For a list, put each item on its own line starting with "- ". Never use an em dash or an en dash anywhere. Use a comma, a colon, a full stop, or a plain hyphen in a number range such as $0.50-1.50.

Your reply must start with one header line in exactly this shape, then a blank line, then the answer:

ANSWERING: <Strategy, Research, Sales or Marketing> | <one short sentence, under 15 words, on why this employee is the one answering>

The header is read by the app and shown as a caption next to the employee's name, so write the reason for the investor to read, for example "Pricing and margins sit with Strategy."`;

const DOCS_DIR = path.join(process.cwd(), "docs");

// Every markdown file in docs/, in name order so the prompt is the same
// from one question to the next and the cache holds.
async function readDocs(): Promise<string> {
  let names: string[] = [];
  try {
    names = (await readdir(DOCS_DIR)).filter((name) => name.endsWith(".md")).sort();
  } catch {
    // No docs folder. The team then has only the live data.
  }
  const docs = await Promise.all(
    names.map(async (name) => {
      try {
        const text = await readFile(path.join(DOCS_DIR, name), "utf8");
        return `<document name="docs/${name}">\n${text.trim()}\n</document>`;
      } catch {
        return "";
      }
    }),
  );
  const found = docs.filter(Boolean);
  return found.length > 0 ? found.join("\n\n") : "No company documents were found.";
}

const firstLine = (note: string) => note.split("\n").find((line) => line.trim()) ?? "";

function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[key(row)] = (counts[key(row)] ?? 0) + 1;
  return counts;
}

// What is saved in the app right now, as compact JSON with a plain note on
// what each part does and does not prove.
async function readLiveData(): Promise<string> {
  const [program, brand, savedBrief, brief, roster, outreach, posts, approvals, activity] =
    await Promise.all([
      readProgram(),
      currentBrand(),
      readBrief(),
      currentBrief(),
      readRoster(),
      readOutreach(),
      readPosts(),
      readPayoutApprovals(),
      readActivity(),
    ]);

  const parts: string[] = [];

  parts.push(
    program
      ? `Program: a person set this program up in the app. That alone does not make the brand a paying customer.\n${JSON.stringify(brand)}`
      : `Program: this is the built-in SAMPLE brand. It is made up, it is not a client, and nobody has paid.\n${JSON.stringify(brand)}`,
  );

  if (!brief) {
    parts.push("Brief: none written yet for this program.");
  } else {
    const { sources, references, ...rest } = brief;
    parts.push(
      `Brief: ${savedBrief ? "written by the Strategy agent" : "the built-in sample brief, not written by an agent"}. It read ${sources.length} web pages while researching.\n${JSON.stringify(
        { ...rest, references: references.map((reference) => reference.title) },
      )}`,
    );
  }

  if (!roster) {
    parts.push("Roster: the Research agent has not run, so there is no saved roster.");
  } else {
    parts.push(
      `Roster: ${roster.length} creators the Research agent found on TikTok and scored. Counts by status: ${JSON.stringify(countBy(roster, (creator) => creator.status))}. Suggested means found and scored, nothing more. Contacted means a person approved the draft, not that a message was sent.\n${JSON.stringify(
        roster.map((creator) => ({
          handle: creator.handle,
          platform: creator.platform,
          niche: creator.niche,
          followers: creator.followers,
          typicalViews: creator.averageViews,
          score: creator.score ?? null,
          status: creator.status,
          flags: creator.flags ?? [],
          reason: creator.reason ?? null,
        })),
      )}`,
    );
  }

  if (!outreach || outreach.length === 0) {
    parts.push("Outreach: no drafts yet. Nothing has been sent.");
  } else {
    parts.push(
      `Outreach: ${outreach.length} drafts written by the Sales agent. Counts by status: ${JSON.stringify(countBy(outreach, (draft) => draft.status))}. The app sends nothing, so zero messages have gone out through it and there are zero replies.\n${JSON.stringify(
        outreach.map((draft) => ({
          handle: draft.handle,
          subject: draft.subject,
          status: draft.status,
          draftedAt: draft.draftedAt,
        })),
      )}`,
    );
  }

  if (!posts || posts.length === 0) {
    parts.push("Posts: the Marketing agent has not reviewed any posts yet.");
  } else {
    const handedIn = posts.filter((post) => post.submitted).length;
    const total = Math.round(posts.reduce((sum, post) => sum + (post.payout ?? 0), 0) * 100) / 100;
    parts.push(
      `Posts: ${posts.length} posts reviewed by the Marketing agent. ${handedIn} were handed in for the program by a person pasting a link. The other ${posts.length - handedIn} are creators' own existing videos used to test the reviewer, not program results. Counts by status: ${JSON.stringify(countBy(posts, (post) => post.status))}. Calculated payouts add up to $${total}. No money has been paid through the app.\n${JSON.stringify(
        posts.map((post) => ({
          handle: post.handle,
          postedAt: post.postedAt,
          views: post.views,
          briefScore: post.briefScore,
          status: post.status,
          flags: post.flags ?? (post.flag ? [post.flag] : []),
          payout: post.payout ?? 0,
          handedIn: post.submitted ?? false,
        })),
      )}`,
    );
  }

  parts.push(
    approvals.length === 0
      ? "Payout approvals: none. No payout has been approved and none has been paid."
      : `Payout approvals: a person approved ${approvals.length} payout amounts. Approval is a sign-off in the app, not a payment.\n${JSON.stringify(approvals)}`,
  );

  parts.push(
    activity.length === 0
      ? "Activity: no agent runs are logged."
      : `Activity: the ${Math.min(activity.length, 12)} most recent agent runs and handoffs, newest first, out of ${activity.length} logged.\n${JSON.stringify(
          activity.slice(0, 12).map((handoff) => ({
            at: handoff.at,
            from: handoff.from,
            to: handoff.to,
            note: firstLine(handoff.note),
          })),
        )}`,
  );

  return parts.join("\n\n");
}

// Two cached blocks: the rules and documents, which rarely change, then the
// live data, which changes when an agent runs. A follow-up question reads
// both from the cache, and a new agent run only rewrites the second one.
async function buildSystem(): Promise<Anthropic.TextBlockParam[]> {
  const [docs, live] = await Promise.all([readDocs(), readLiveData()]);
  return [
    {
      type: "text",
      text: `${RULES}\n\nCompany documents, read from disk:\n\n${docs}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `Live data, read from the app's saved files just now:\n\n${live}`,
      cache_control: { type: "ephemeral" },
    },
  ];
}

const header = (employee: Employee, reason: string) => `ANSWERING: ${employee} | ${reason}`;

// Earlier answers go back in the same shape the model writes them, so the
// header format holds across a conversation.
function toMessages(question: string, history: AskTurn[]): Anthropic.MessageParam[] {
  const recent = history.slice(-HISTORY_TURNS);
  // The API wants the first turn to be the investor's.
  while (recent.length > 0 && recent[0].role !== "investor") recent.shift();
  return [
    ...recent.map((turn): Anthropic.MessageParam =>
      turn.role === "investor"
        ? { role: "user", content: turn.text }
        : {
            role: "assistant",
            content: `${header(turn.employee, "Answered earlier in this meeting.")}\n\n${turn.text}`,
          },
    ),
    { role: "user", content: question },
  ];
}

const HEADER = /^\s*ANSWERING:\s*([A-Za-z]+)\s*(?:\|\s*(.*))?$/i;

function parseHeader(line: string): { employee: Employee; reason: string } | null {
  const match = HEADER.exec(line);
  if (!match) return null;
  const employee = EMPLOYEES.find((name) => name.toLowerCase() === match[1].toLowerCase());
  if (!employee) return null;
  return { employee, reason: tidy(match[2]?.trim() ?? "") || `This one sits with ${employee}.` };
}

// The prompt already rules out long dashes. This is the backstop, so none
// reaches the screen if the model slips.
const tidy = (text: string) =>
  text.replace(/\s*\u2014\s*/g, ", ").replace(/\u2013/g, "-");

// Asks the team one question. `onEmployee` fires once, as soon as it is
// known who is answering, then `onText` fires for each piece of the answer
// as it is written.
export async function askTeam(
  question: string,
  history: AskTurn[],
  handlers: {
    onEmployee?: (employee: Employee, reason: string) => void;
    onText?: (delta: string) => void;
    signal?: AbortSignal;
  } = {},
): Promise<AskResult> {
  const client = new Anthropic();

  const stream = client.messages.stream(
    {
      model: MODEL,
      max_tokens: 8000,
      // A spoken answer wants to start quickly. The reasoning here is
      // picking a speaker and staying inside the documents.
      output_config: { effort: "low" },
      system: await buildSystem(),
      messages: toMessages(question, history),
    },
    { signal: handlers.signal },
  );

  type Speaker = { employee: Employee; reason: string };
  // Held in an object so the stream callback can set it and the code after can read it.
  const said: { who: Speaker | null } = { who: null };
  // Text held until the header line is complete.
  let head = "";
  // Whitespace held back from the end of a piece, so a long dash that opens
  // the next piece can be tidied together with the space before it.
  let held = "";
  let answer = "";
  let started = false;

  const emit = (text: string) => {
    let piece = tidy(held + text);
    // Nothing but blank lines before the answer starts.
    if (!started) piece = piece.replace(/^\s+/, "");
    const trailing = /\s+$/.exec(piece)?.[0] ?? "";
    held = trailing;
    piece = piece.slice(0, piece.length - trailing.length);
    if (!piece) return;
    started = true;
    answer += piece;
    handlers.onText?.(piece);
  };

  const announce = (found: Speaker) => {
    said.who = found;
    handlers.onEmployee?.(found.employee, found.reason);
  };

  stream.on("text", (delta) => {
    if (said.who) return emit(delta);
    head += delta;
    const end = head.indexOf("\n");
    if (end === -1) return;
    const parsed = parseHeader(head.slice(0, end));
    if (parsed) {
      announce(parsed);
      emit(head.slice(end + 1));
    } else {
      // No header came back. Strategy speaks for the company, and nothing
      // the model wrote is thrown away.
      announce({ employee: "Strategy", reason: "Strategy speaks for the company as a whole." });
      emit(head);
    }
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("The team declined to answer that one. Try wording the question differently.");
  }

  // An answer of one line, with no newline after the header to split on.
  if (!said.who) {
    const parsed = parseHeader(head);
    announce(parsed ?? { employee: "Strategy", reason: "Strategy speaks for the company as a whole." });
    if (!parsed) emit(head);
  }

  if (!answer) {
    throw new Error("The team did not get an answer out. Ask it again.");
  }
  if (message.stop_reason === "max_tokens") {
    const note = "\n\n(The answer was cut off for length. Ask for the rest.)";
    answer += note;
    handlers.onText?.(note);
  }

  const settled = said.who ?? { employee: "Strategy" as const, reason: "" };
  return { employee: settled.employee, reason: settled.reason, answer };
}
