import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const MODEL = "claude-opus-5-5";

const SYSTEM = `You fill in a setup form for a creator program from rough notes. A brand pays small creators per view to post short videos about its product. The person pasted whatever they had: a chat message, a pitch, a website blurb, a contract clause, bullet points.

Fill a field only with what the notes say or plainly imply. Leave a field as an empty string when the notes do not cover it, because an empty field keeps what the person already has and a guess would overwrite it with something wrong. Never invent a number: budget, pay rate, cap, minimum views and follower counts stay empty unless the notes give them.

How to write each field. The product line is one or two plain sentences on what the product is and does, with no marketing language. The audience line says who it is for in one sentence. Money fields are plain numbers in dollars with no symbol or commas, and a rate given per million views or per view is converted to dollars per 1,000 views. View and follower counts are whole numbers, so "5k" becomes 5000. The website is a full link starting with https://. The hashtag is one tag without the # sign. Rules are one per line, each a short plain sentence a creator could follow, and anything the notes forbid or require of a post belongs there.

Never use em dashes or en dashes.`;

const Fields = z.object({
  name: z.string().describe("The brand's name"),
  website: z.string().describe("Full link starting with https://, or empty"),
  product: z.string().describe("One or two plain sentences on what the product is"),
  audience: z.string().describe("Who the product is for, one sentence"),
  monthlyBudget: z.string().describe("Dollars a month as a plain number, or empty"),
  ratePerThousandViews: z.string().describe("Dollars per 1,000 views as a plain number, or empty"),
  payoutCapPerPost: z.string().describe("The most one post can earn, in dollars, or empty"),
  minimumViews: z.string().describe("Views a post needs before it pays, whole number, or empty"),
  followersMin: z.string().describe("Smallest following to recruit, whole number, or empty"),
  followersMax: z.string().describe("Largest following to recruit, whole number, or empty"),
  hashtag: z.string().describe("The program's tag without #, or empty"),
  rules: z.string().describe("Rules every post follows, one per line, or empty"),
});

export type ProgramFields = z.infer<typeof Fields>;

// Reads rough notes and returns the form fields they cover. Fields the
// notes say nothing about come back empty.
export async function draftProgram(notes: string): Promise<ProgramFields> {
  const client = new Anthropic();
  const written = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Notes:\n\n${notes}` }],
    output_config: { format: zodOutputFormat(Fields) },
  });

  if (written.stop_reason === "refusal") {
    throw new Error("The model declined to read those notes. Fill the form by hand.");
  }
  if (!written.parsed_output) {
    throw new Error("The notes could not be turned into fields. Try again.");
  }
  return written.parsed_output;
}
