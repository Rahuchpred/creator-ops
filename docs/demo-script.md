# Demo and pitch script

Three minutes, one presenter. Lines in quotes are spoken. Lines in brackets
are what to do on screen. About 400 spoken words.

Before going on: app open on Overview, BAND room open in a second tab, a
recording of both live steps ready in case the network fails.

## Beats

| Time | Beat | Screen |
|---|---|---|
| 0:00-0:25 | Problem | Overview |
| 0:25-0:45 | What we are | Overview |
| 0:45-1:05 | Tour | Brief, Roster, Posts, Payouts, Activity |
| 1:05-1:50 | Live: Strategy agent writes a brief | Brief |
| 1:50-2:25 | Live: same agent inside a BAND room | BAND |
| 2:25-2:45 | What is not built, and what is next | Activity |
| 2:45-3:00 | Business and close | Overview |

### 0:00 Problem

"Consumer brands pay small creators per thousand views to post TikToks and
Reels. Most campaigns pay 50 cents to a dollar fifty per thousand. The
marketplaces give a brand creators and a way to pay them. Someone still has to
write the brief, recruit, check every video, count views and build the payout
sheet. Today that is a person with a Discord server and a spreadsheet."

### 0:25 What we are

"Creator Ops is a company that does that job with agents. The brand hires us
like it would hire a program manager. A person approves two things only:
outreach and payouts."

### 0:45 Tour

[Click through Brief, Roster, Posts, Payouts, Activity. Do not stop.]

"This is the app. One brand, its brief, its creator roster, the posts, the
payouts table, and a log of everything the agents did."

Say "filled with data from our own creator program" only if that is what is
loaded. If it is sample data, say "sample data".

### 1:05 Live: the Strategy agent

[Go to Brief. Press "Write a new brief".]

"This is live. The Strategy agent is researching the niche right now. Web
search goes through Querit. Creator and platform data goes through Glasser.
You can see each step as it happens."

[Wait for the brief to fill. Scroll it once.]

"That is a brief a creator could work from, and it shows what it was based
on."

### 1:50 Live: the agent in BAND

[Switch to the BAND room. Type an @mention asking the Strategist for a brief.]

"The same agent is a member of a BAND room. I ask for a brief by name. It
posts its steps in the room, then hands the brief on to the next agent. That
handoff, with its audit trail, is how the departments will talk to each
other."

### 2:25 What is not built

"One agent works today: Strategy. Research, Sales and Review are not built
yet. The review pipeline is written for RocketRide and the file validates, but
it has not completed a run, so I am not showing it. We have no customers yet.
Next: Research fills the roster from the brief, Sales drafts outreach for
approval, and Review scores a posted video and flags fake views. Fake views
are the hard part and the reason a brand would pay us."

### 2:45 Business and close

"Pricing is a flat monthly fee, proposed at 2,000 dollars. No cut of payouts,
because we are the ones flagging fraud. The first customers come from a free
audit of last month's payouts. Thank you."

## Likely questions

| Question | Answer |
|---|---|
| What works today? | The app and one agent, Strategy, from the button and from a BAND room. Nothing else is live. |
| Why has RocketRide not run? | The pipeline file exists and validates. It has never completed a run. Getting one full review run through is the next task for that step. |
| How do you detect fake views? | Not built yet. The plan is to compare views with likes, comments and the creator's history, and send anything odd to a person. I cannot say how accurate it is until it runs on real posts. |
| Do you have customers? | No. Our own creator program is the first user. No brand has paid. |
| Where do the price and the margin come from? | They are assumptions, written down in docs/business-model.md. Review cost per post is unmeasured until the Review agent exists. |
| Why will Whop or Vyro not do this? | They may. They sell creator supply and payment rails. We run the program and can work across marketplaces. |
| Why keep a person in the loop? | Automated DMs break TikTok and Instagram terms, and payouts move real money. Agents draft and calculate. A person approves. |
| How do you use Querit and Glasser, exactly? | Querit for fresh web search on the niche. Glasser for creator and platform data. Both are called live in the brief step you just saw. |
| What is BAND doing that a function call would not? | The request, each step and the handoff are posted in a shared room, so there is a record of which agent did what. With one agent that is modest. It matters once four agents hand work to each other. |
| What is the biggest risk? | View fraud detection being weaker than promised. It is the differentiator and it does not exist yet. |
