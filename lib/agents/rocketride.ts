import path from "node:path";
import { Answer, Question, RocketRideClient } from "rocketride";

// Where the RocketRide engine lives. Unset means the pipelines are not used
// and the agents fall back to calling the model directly.
export const rocketRideUri = () => process.env.ROCKETRIDE_URI;

// Runs one pipeline file on the RocketRide engine: start it, ask it one
// question, read the JSON answer, stop it.
export async function runPipeline(file: string, ask: string): Promise<unknown> {
  const client = new RocketRideClient({
    uri: rocketRideUri(),
    auth: process.env.ROCKETRIDE_AUTH ?? process.env.ROCKETRIDE_APIKEY ?? "",
    // The pipeline files read these names. The app keeps one copy of each key.
    env: {
      ROCKETRIDE_ANTHROPIC_KEY: process.env.ANTHROPIC_API_KEY ?? "",
      ROCKETRIDE_QUERIT_KEY: process.env.QUERIT_API_KEY ?? "",
    },
  });

  await client.connect();
  let token: string | undefined;
  try {
    const run = await client.use({ filepath: path.join(process.cwd(), "pipelines", file) });
    token = run.token;

    const question = new Question({ expectJson: true });
    question.addQuestion(ask);
    const response = await client.chat({ token, question });

    const text = (response as { answers?: unknown[] } | undefined)?.answers?.[0];
    if (text === undefined || text === null) {
      throw new Error("The pipeline finished without an answer. Run it again.");
    }
    if (typeof text !== "string") return text;

    const answer = new Answer(true);
    answer.setAnswer(text);
    return answer.getJson();
  } finally {
    if (token) await client.terminate(token).catch(() => undefined);
    await client.disconnect().catch(() => undefined);
  }
}
