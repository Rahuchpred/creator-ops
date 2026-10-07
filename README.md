# Creator Ops

Working name. A zero-human company that runs pay-per-view UGC creator programs
for consumer brands. Built for the Crewbase Collective "Zero Human Startup"
hackathon (SF Tech Week, Phase 2 runs October 7-11, 2026).

## The idea

Brands, especially consumer apps, run programs where dozens or hundreds of
small creators post TikToks and Reels and get paid per 1,000 views. Running one
is a full-time human job: recruiting, briefing, reviewing submissions, counting
views, calculating payouts, posting announcements.

This company does that whole job with agents. A brand hands over its product,
budget and rules. The agents find creators, brief them, review what gets
posted, count views and work out who is owed what. The brand gets a weekly
report and approves payouts.

It is a service the brand hires, not a tool the brand's team operates. The
agents are the staff. It replaces a creator program manager or an agency
retainer, not a software subscription.

## Why this one

- The work is already all text and data, so "zero human" is believable.
- Buyers already pay people for it.
- Customer zero exists: our own creator program, with real data from day one.

## The agents

Five agents, one per department of the startup. Most serve both the client and
the company itself.

| Agent | Area | For clients | For our own company |
|---|---|---|---|
| Research | Research | Finds and scores creators | Finds brands that run creator programs |
| Strategy | Strategy | Writes briefs from what is working in the niche | Decides which niche to target and how to price |
| Sales | Sales, GTM | Recruits and onboards creators | Pitches and closes brands |
| Marketing | Marketing | None | Turns client results into case studies, posts and the landing page |
| Product | Product | Builds the review and payout pipeline | Ships the dashboard and fixes what users complain about |

The review step is a pipeline the Product agent builds and runs in Phase 1. In
Phase 2 it becomes a sixth agent.

## Client pipeline

1. Brand signs up with product, budget and rules.
2. Strategy writes the creator brief. Glasser, Querit.
3. Research finds matching creators. Glasser, Apify.
4. Sales recruits and onboards them. AdaL.
5. Creators post videos on TikTok and Reels.
6. The review pipeline scores each post against the brief and flags suspicious
   views. RocketRide, Tenki.
7. A payout report goes to a person, who approves payment.

Results from step 6 feed the next brief and the next creator search.

## Company stack

- Kylon: headquarters. One room per client, tracker apps the agents maintain.
- BAND: handoffs between agents, with an audit trail.
- AdaL: the harness every agent runs on.
- Paritok: sits in front of every model call to cut token cost.
- Prelint, Tenki, InstaCloud: how the Product agent ships code. Prelint checks
  each PR against the product rules, Tenki runs tests in sandboxes, InstaCloud
  hosts the product.

## Risks

- View fraud. Botted views are the hard problem in this market. Catching them
  is the main differentiator and needs real work.
- Platform rules. Automated DMs on TikTok and Instagram break their terms.
  Recruit by email and Discord.
- Money. Payouts need a human-owned payment account. Agents calculate, a
  person approves.

## More

- [docs/plan.md](docs/plan.md): the five build stages
- [docs/sponsors.md](docs/sponsors.md): every sponsor, what it is, and whether we use it
- [docs/market.md](docs/market.md): market size, competitors, sources
