# Demo and pitch script

Three minutes, one presenter. Lines in quotes are spoken. Lines in brackets
are what to do on screen. About 400 spoken words.

The full agent chain takes about three and a half minutes, longer than the
demo. So it is started in the first ten seconds and the result is shown at
the end, while the tour happens in between.

Before going on: app open on Overview, the BAND room open in a second tab
with the message already typed but not sent, the agent worker running, and a
recording of one full chain run ready in case the network fails.

## Beats

| Time | Beat | Screen |
|---|---|---|
| 0:00-0:10 | Start the chain | BAND |
| 0:10-0:35 | Problem | Overview |
| 0:35-0:50 | What we are | Overview |
| 0:50-1:40 | The four agents' work | Brief, Roster, Outreach, Posts |
| 1:40-2:15 | The chain, live | BAND, then Activity |
| 2:15-2:35 | What is not done | Activity |
| 2:35-3:00 | Business and close | Overview |

### 0:00 Start the chain

[In the BAND room, send: "@Strategist run the program for Lumen".]

"I just asked our Strategy agent to run a creator program. It will take a
few minutes. Let me show you what it is doing."

### 0:10 Problem

"Consumer brands pay small creators per thousand views to post TikToks and
Reels. Most campaigns pay 50 cents to a dollar fifty per thousand. The
marketplaces give a brand creators and a way to pay them. Someone still has
to write the brief, recruit, check every video, count views and build the
payout sheet. Today that is a person with a Discord server and a
spreadsheet. I have been that person."

Say the last line only if it is true for you.

### 0:35 What we are

"Creator Ops is a company that does that job with four agents. The brand
hires us like it would hire a program manager. A person approves two things
only: outreach and payouts."

### 0:50 The four agents' work

[Brief.] "Strategy researches the niche through Querit and Glasser and
writes the brief. Every reference links to a page it actually read."

[Roster.] "Research searches TikTok and checks each creator's real numbers.
The score is computed in code, not by the model. These are real creators.
The ones marked rejected were too large, off topic, or carry a fraud flag."

[Outreach.] "Sales drafts one message per creator. Nothing is sent until I
approve it."

[Posts.] "Review scores posted videos against the brief and flags missing
disclosure and suspicious views. No program is live yet, so these are the
roster creators' own recent videos, used to test the reviewer. They were not
made for the brand, and it correctly rejects them."

The brand, Lumen, is a sample. Say so if asked. The creators, numbers and
drafts are real.

### 1:40 The chain, live

[Switch to the BAND room.]

"This is the room from the start of the demo. Strategy wrote the brief and
handed it to Research. Research built the roster and handed it to Sales.
Sales drafted outreach and came back to me, because a person approves
before anything is sent. One message, three agents, and every step is on
the record."

[Open Activity in the app.] "The same handoffs, logged in the product."

If the chain has not finished, say what step it is on and move ahead. Do not
wait in silence.

### 2:15 What is not done

"Three things are not done. The Review agent is started by a person, not by
the chain, since it needs posted videos. The Strategy agent also exists as a
RocketRide pipeline that validates but has not completed a run. And we have
no paying customer. The brand here is a sample."

### 2:35 Business and close

"Pricing is a flat monthly fee, proposed at 2,000 dollars. No cut of
payouts, because we are the ones flagging fraud. The first customers come
from a free audit of last month's payouts. Thank you."

## Likely questions

| Question | Answer |
|---|---|
| What works today? | Four agents: Strategy, Research, Sales and Review. Each runs from a button in the app. Three of them run as a chain from one message in a BAND room. |
| Is the data real? | The creators, their numbers, the fraud flags and the drafts are real, pulled live from TikTok through Glasser. The brand is a sample, and no creator has been contacted. |
| How do you detect fake views? | In code, from each creator's own numbers: a post far above their usual views with far less engagement, very low engagement for the view count, a large following that barely watches, and posts stuck under 1,000 views. The thresholds are first guesses and have not been tuned on a live program. |
| How accurate is it? | Not measured. It has run on a few dozen real creators and posts. Measuring it needs a live program with known outcomes. |
| Why has RocketRide not run? | The pipeline file validates. Their engine has no build for my Mac's chip, and their cloud sign-in was failing when I tried. It is the next thing to get through. |
| Do you have customers? | No. No brand has paid, and the brand in the demo is a sample. |
| Where do the price and the margin come from? | They are estimates, written down in docs/business-model.md. |
| Why will Whop or Vyro not do this? | They may. They sell creator supply and payment rails. We run the program and can work across marketplaces. |
| Why keep a person in the loop? | Automated DMs break TikTok and Instagram terms, and payouts move real money. Agents draft and calculate. A person approves. |
| What is BAND doing that a function call would not? | Each agent is a member of a shared room. The request, every step and each handoff are posted there, so there is a record of which agent did what, and a person can step in by replying. |
| What stops the agents looping? | An agent only takes work from a person or from the agent before it in the chain, and ignores a repeat while it is busy. We hit that bug and fixed it. |
| What is the biggest risk? | Fraud detection being weaker than promised on a real program. It is the differentiator and it is untuned. |
