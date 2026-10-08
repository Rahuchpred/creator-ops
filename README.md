# Creator Ops

**An AI team that runs your pay-per-view creator program.**

Live: https://prod-main-app-c27069-00rt439e5sw.compute.instacloud-edge.com

Built for the Crewbase Collective "Zero Human Startup" hackathon, SF Tech
Week, October 2026.

## The idea

Consumer brands pay small creators per 1,000 views to post TikToks. The
marketplaces give a brand creators and a way to pay them. Someone still has
to write the brief, recruit, check every video, count views and work out who
is owed what. Today that is one person with a Discord server and a
spreadsheet.

Creator Ops does that job with four AI agents. A brand pastes what it has,
presses one button, and the team runs the program. A person approves two
things: the outreach before it goes out, and the money before anyone is paid.

## The team

| Agent | Area | What it does |
|---|---|---|
| **Strategy** | Strategy | Researches what is working in the brand's niche right now and writes the creator brief. Every reference links to a page it read |
| **Research** | Research | Searches TikTok for creators who fit the brief, pulls their real numbers, scores them and raises fraud flags |
| **Sales** | Sales | Drafts one first message per creator, written from that creator's own content. Nothing is sent until a person approves it |
| **Marketing** | Marketing | Reads every posted video, including a timed transcript of what is said, checks it against the brief and the rules, flags odd views, and works out the payout |

One rule runs through all four: **the model judges, the code computes.** The
model decides how well a creator or a video fits the brief and what to say.
Plain code computes every score, flag, verdict and dollar amount, so no
number on screen can be invented.

## What you can do in it

- **Set up a program by pasting notes.** A message, a pitch or rough bullet
  points. The form fills itself.
- **Run the whole team from one button.** Strategy, Research, Sales and
  Marketing run in order and stop for your approval.
- **Bring posts in three ways.** Paste a video link, let creators hand in
  their own on a public creator page, or pull in every video carrying the
  program hashtag in one press.
- **See why a post was approved, held or rejected.** The reviewer's note
  cites the second something is said, such as "the app is first named at
  0:14".
- **Make the final call.** Approve or reject any post, approve payouts, and
  ban a creator for botting.
- **Track the money.** A budget bar shows what is paid, committed, held and
  left for the month.
- **Rank everything.** A leaderboard of top posts and top creators, with a
  trust score per creator computed from their flags.
- **Ask the team.** Type an investor question and the agent who owns that
  area answers from the company's own documents and live data.
- **Give creators their own page.** They read the brief, hand in videos, and
  see what each one earned.

## Built with the hackathon sponsors

| Sponsor | Role in the product |
|---|---|
| **BAND** | The room the agents work in. Each agent is a member of one BAND room, and one message starts the chain: Strategy hands the brief to Research, Research hands the roster to Sales, and Sales reports back to a person. See [`agents/worker.ts`](agents/worker.ts) |
| **RocketRide** | The Strategy agent runs as a RocketRide pipeline: a strategist agent that delegates research to a sub-agent, defined in [`pipelines/strategy.pipe`](pipelines/strategy.pipe) and run on RocketRide Cloud. Its steps stream into the app as it works |
| **Glasser** | All TikTok data, paid per call: creator and hashtag search, profiles, recent videos, single videos and timed transcripts |
| **Querit** | Live web search for the research behind every brief |
| **InstaCloud** | Hosting. The live site is one container with a persistent disk, created and deployed from the command line by a coding agent |

## The team works in a BAND room

A company is people talking to each other. Ours is agents talking to each
other, and BAND is where that happens.

- **Every agent is a real member of the room.** Strategy, Research, Sales
  and Marketing each have their own identity in one BAND room, next to the
  founder.
- **One message runs the company.** The founder writes one line to
  Strategy. Strategy writes the brief and hands it to Research by name.
  Research builds the roster and hands it to Sales. Sales drafts the
  outreach and reports back to the founder, because a person approves
  before anything goes out.
- **The handoff is the product.** No function calls another function. An
  agent finishes, posts its work in the room and mentions the next agent,
  the way a colleague would. Take BAND away and the team stops being a team.
- **You can watch them work.** Each agent posts short progress notes as it
  goes, so the room reads like a live standup.
- **A person can step in at any point** by replying in the room, to
  redirect, correct or stop the work.
- **Everything is on the record.** Who did what, in what order, and what
  they passed on is in the room, and mirrored in the app's Activity screen.
- **It is built to behave.** An agent only takes work from a person or from
  the agent before it, and ignores a repeat while it is busy, so the chain
  never loops.

The whole thing is one file: [`agents/worker.ts`](agents/worker.ts).

## Why the brief runs on RocketRide

The brief is the most important document in a creator program. Every
creator works from it and every video is judged against it. So the agent
that writes it runs on RocketRide.

- **Two agents, one pipeline.** A strategist agent owns the brief. It
  delegates the research to a second agent and writes only from what that
  agent reports back. RocketRide makes that delegation a single line in the
  pipeline: one agent is simply a tool the other can call.
- **Real research, built in.** The researcher searches the live web through
  an HTTP tool inside the pipeline, several searches at once, and keeps its
  notes in the pipeline's own memory.
- **You watch it think.** RocketRide streams each agent's steps as they
  happen, and those lines appear in the app while the brief is being written.
- **One file, any brand.** The whole thing is
  [`pipelines/strategy.pipe`](pipelines/strategy.pipe). Every program a
  brand sets up goes through the same pipeline, with nothing rewritten.
- **No servers to run.** It runs on RocketRide Cloud, so the hosted app
  starts a pipeline with one call and gets a finished brief back.

## How a program runs

1. **Setup.** The brand, what it pays, the follower range it wants, its
   hashtag and its rules.
2. **Strategy** researches the niche and writes the brief: the goal, the
   angle, opening lines, what every post includes and what to avoid.
3. **Research** finds creators on TikTok and ranks them. Each one gets a
   score, a reason, fraud flags and an expected payout.
4. **Sales** drafts a message to each suggested creator. You approve, copy
   and send.
5. **Posts come in** by link, by creator page or by hashtag.
6. **Marketing** checks each one: the paid label, the brief, the rules, view
   spikes, low engagement and duplicates. It sets a verdict and a payout.
7. **You** decide the held posts and approve the payouts.

## Under the hood

- **App:** Next.js 16, React 19, Tailwind, Base UI and Geist.
- **Model:** Claude Opus 5.5 through the Anthropic SDK, with tool use,
  structured output, streaming and prompt caching.
- **MCP server:** assistants such as Claude can read the program and run the
  agents. See [`docs/mcp.md`](docs/mcp.md).
- **Storage:** files on a persistent disk.

## Run it yourself

```bash
bun install
cp .env.example .env.local   # add your keys
bun run dev -p 3100
```

Open http://localhost:3100, go to Setup, paste a few lines about a program
and press Run the Program on the Overview.

To run the agents as a chain in a BAND room:

```bash
npm run agents
```

## More

- [`docs/market.md`](docs/market.md): the market and who else is in it
- [`docs/competitors.md`](docs/competitors.md): what similar tools do
- [`docs/business-model.md`](docs/business-model.md): pricing and unit economics
- [`docs/plan.md`](docs/plan.md): how it was built, stage by stage
