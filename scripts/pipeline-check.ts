// Runs the strategy pipeline once against the local engine with a short
// question and prints what comes back. For debugging: bun run pipeline:check
import path from "node:path";
import { Question, RocketRideClient } from "rocketride";

const client = new RocketRideClient({
  uri: process.env.ROCKETRIDE_URI,
  auth: process.env.ROCKETRIDE_AUTH ?? "local",
  env: {
    ROCKETRIDE_ANTHROPIC_KEY: process.env.ANTHROPIC_API_KEY ?? "",
    ROCKETRIDE_QUERIT_KEY: process.env.QUERIT_API_KEY ?? "",
  },
  onEvent: async (event) => {
    console.log("event", JSON.stringify(event).slice(0, 220));
  },
});

await client.connect();
// Optional second argument: another pipeline file, for isolating a problem.
const file = process.argv[3] ?? path.join(process.cwd(), "pipelines", "strategy.pipe");
const { token } = await client.use({ filepath: file });
console.log("started", token.slice(0, 10));
try {
  const question = new Question({ expectJson: true });
  question.addQuestion(process.argv[2] ?? "Brand: Lumen, a study timer app that locks your phone. Write the creator brief.");
  const started = Date.now();
  const response = await client.chat({
    token,
    question,
    onSSE: async (type: string, data: unknown) => {
      console.log(`${Math.round((Date.now() - started) / 1000)}s`, type, JSON.stringify(data).slice(0, 160));
    },
  });
  console.log(`answered in ${Math.round((Date.now() - started) / 1000)}s`);
  console.log(JSON.stringify(response).slice(0, 1500));
} finally {
  await client.terminate(token).catch(() => undefined);
  await client.disconnect().catch(() => undefined);
}
