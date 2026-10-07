"use server";

import { z } from "zod";
import { draftProgram } from "@/lib/agents/program";
import { explain } from "@/lib/agents/stream";
import type { Brand } from "@/lib/data";
import { saveProgram } from "@/lib/files";

const text = (label: string, max: number) =>
  z.string().trim().min(1, `Add ${label}.`).max(max, `Keep this under ${max} characters.`);
const amount = (label: string) =>
  z.coerce.number({ error: `Enter ${label} as a number.` }).positive(`Enter ${label} above zero.`);

const schema = z
  .object({
    name: text("the brand name", 60),
    website: z
      .string()
      .trim()
      .max(200)
      .refine((value) => value === "" || /^https?:\/\/\S+\.\S+$/.test(value), {
        message: "Start the link with https://, or leave it empty.",
      }),
    product: text("one line on what the product is", 240),
    audience: text("who it is for", 240),
    monthlyBudget: amount("the monthly budget"),
    ratePerThousandViews: amount("the pay per 1,000 views"),
    payoutCapPerPost: amount("the most one post can earn"),
    minimumViews: amount("the minimum views").int("Use a whole number of views."),
    followersMin: amount("the smallest following").int("Use a whole number."),
    followersMax: amount("the largest following").int("Use a whole number."),
    hashtag: z
      .string()
      .trim()
      .transform((value) => value.replace(/^#/, ""))
      .refine((value) => value === "" || /^[\p{L}\p{N}_]{2,60}$/u.test(value), {
        message: "Use one tag with letters and numbers only, or leave it empty.",
      }),
    rules: z.string().trim().min(1, "Add at least one rule, one per line.").max(2000),
  })
  .refine((value) => value.followersMax > value.followersMin, {
    path: ["followersMax"],
    message: "Make the largest following bigger than the smallest.",
  });

export type Field = keyof z.input<typeof schema>;

export type ProgramState = {
  values: Record<Field, string>;
  errors: Partial<Record<Field, string>>;
  // Set after a save. "moved" means results for the previous brand were put aside.
  saved?: { name: string; moved: boolean };
};

export async function saveProgramAction(
  previous: ProgramState,
  form: FormData,
): Promise<ProgramState> {
  const values = Object.fromEntries(
    Object.keys(previous.values).map((field) => [field, String(form.get(field) ?? "")]),
  ) as Record<Field, string>;

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const errors: ProgramState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as Field;
      errors[field] ??= issue.message;
    }
    return { values, errors };
  }

  const { followersMin, followersMax, rules, website, hashtag, ...rest } = parsed.data;
  const brand: Brand = {
    ...rest,
    ...(website ? { website } : {}),
    ...(hashtag ? { hashtag } : {}),
    creatorFollowers: { min: followersMin, max: followersMax },
    rules: rules
      .split("\n")
      .map((rule) => rule.replace(/^[-*\s]+/, "").trim())
      .filter(Boolean),
  };

  const moved = await saveProgram(brand);
  return { values, errors: {}, saved: { name: brand.name, moved } };
}

// Reads rough notes and returns the fields they cover, for the person to
// check. Nothing is saved here.
export async function fillProgramAction(
  notes: string,
): Promise<{ values?: Partial<Record<Field, string>>; message?: string }> {
  const text = notes.trim().slice(0, 12000);
  if (text.length < 10) return { message: "Paste a few lines about the program first." };
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return { message: "Add ANTHROPIC_API_KEY to .env.local and restart, then try again." };
  }

  try {
    const drafted = await draftProgram(text);
    const values: Partial<Record<Field, string>> = {};
    for (const [field, value] of Object.entries(drafted) as [Field, string][]) {
      if (value.trim()) values[field] = value.trim();
    }
    if (Object.keys(values).length === 0) {
      return { message: "Nothing in those notes matched the form. Add more detail and try again." };
    }
    return { values };
  } catch (error) {
    return { message: explain(error) };
  }
}
