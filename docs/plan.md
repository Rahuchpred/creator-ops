# Plan

Five build stages for the day-one MVP. Each ends with something that can be
demoed.

| Stage | What gets built | Sponsors | Done when |
|---|---|---|---|
| 1. Build the app | The UI and database: a brand page, a brief, a creator roster, a posts list and a payouts table. Filled with our own creator program's data | InstaCloud | Every screen can be clicked through with real data in it |
| 2. Strategy agent | Reads the brand page and what is working in the niche, then writes the brief | Glasser, Querit | Pressing a button fills the brief |
| 3. Research agent | Reads the brief and fills the roster with scored creators | Glasser, Apify | The roster fills itself from the brief |
| 4. Sales agent | Writes an outreach message for each creator on the roster and waits for approval | AdaL | Every creator has a draft message ready |
| 5. Review agent | Takes a posted video, scores it against the brief, flags suspicious views and writes the payout line. Then all four agents get chained so each starts when the previous one finishes | RocketRide, Tenki, Kylon | One button runs brand to brief to roster to outreach, and a video link turns into a payout line |

## Also due for Phase 1

The brief asks for two things beyond the build. Both are short and come last.

- A one-page business model and GTM: who pays, how much, how the first
  customers are reached.
- A short demo script and pitch.

Phase 1 has its own sponsor prizes, judged on build day. To be in the running
for BAND and RocketRide then, stage 5 connects the agents through BAND and
runs the review step on RocketRide.

## Scope

- Four agents: Strategy, Research, Sales and Review. Phase 1 asks for 3 to 5.
- Outreach is drafted, not sent. A person approves each message.
- Fraud detection is the hardest part of stage 5 and the main differentiator.
  If something has to be cut, cut UI polish before this.

## Phase 2

See [hackathon-brief.md](hackathon-brief.md) for the full deliverable list.

- Founding-team agents: Market Research, Finance, Fundraising and Content,
  taking the team past the 5-agent minimum
- An "Ask the team" screen where agents answer investor questions live
- Landing page
- Pitch deck and financial model
- Marketing assets
- Real users and traction, starting with our own creator program as the pilot
- Prelint for product rules, Paritok for token cost
- A client login so a brand can approve payouts itself
