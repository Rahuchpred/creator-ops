# Business model and GTM

Phase 1 version, written October 7, 2026. Market facts come from
[market.md](market.md). Every other number here is an assumption and is
labelled as one. Nothing below has been tested with a paying customer yet.

## Who pays

- The brand: a consumer app or consumer product company that already runs a
  pay-per-view creator program, usually out of Discord and a spreadsheet, with
  dozens to a few hundred small creators.
- The person: whoever owns that program day to day. In a small team that is the
  founder or head of growth. In a larger one it is a creator program manager or
  community lead. They sign off on the creator budget, and they are the one
  counting views and building the payout sheet every week.
- Not the buyer: enterprise brands buying paid creator media. Agentio serves
  them.

## What they pay today

The brand already pays for creators and payment rails through a marketplace
(Whop, Vyro, Clipping.io). It still pays someone to run the program.

| Option today | Monthly cost | Status of the figure |
|---|---|---|
| In-house creator program manager | $6,000-9,000 fully loaded | Our estimate, not sourced |
| Agency retainer | $5,000-15,000 | Our estimate, not sourced |
| Founder does it at night | No cash, 10+ hours a week | Our estimate, not sourced |

These three figures need checking in the first customer calls. The creator
payouts themselves are separate: most campaigns pay $0.50-1.50 per 1,000 views
(sourced, market.md).

## Pricing

One model: a flat monthly fee per program, tiered by active creators.

| Tier | Active creators | Price per month |
|---|---|---|
| Starter | Up to 50 | $2,000 |
| Growth | Up to 200 | $4,000 |

Both prices are proposals, not tested.

Why flat, and why no cut of payouts: we are the ones who flag fake views. If
we took a percentage of payouts, we would earn more by missing fraud. A flat
fee keeps us on the brand's side. It is also easy to compare against a salary
or a retainer, which is the line item we replace. The brand pays creators
directly. We never hold creator money.

## Unit economics per client

Starter tier, one month. Every input is an assumption.

| Line | Assumption | Per month |
|---|---|---|
| Revenue | Starter tier | $2,000 |
| Model calls | Brief, outreach drafts, review of about 200 posts | $150 |
| Data calls | Creator search and view checks through Glasser, Querit, Apify | $100 |
| Hosting and pipeline runs | One client's share | $50 |
| Human approval | 3 hours at $50 an hour for outreach and payouts | $150 |
| Total cost | | $450 |
| Gross margin | | $1,550, about 78% |

What would break this: review cost per post is unmeasured, since the Review
agent is not built yet. Fraud checks may need far more data calls than
assumed. Human approval time may not stay at 3 hours as creator count grows.

## GTM: the first 10 customers

1. Customer zero is our own creator program. It supplies the data in the app
   and the first before and after numbers.
2. Build the list. Brands with live campaigns on Whop Content Rewards, Vyro and
   Clipping.io, and brands with public creator Discords. Those listings are
   public, so the list is brands that already spend on this. The Research
   agent does this for our own company once it is built. Until then it is
   manual.
3. Lead with a free audit, not a pitch. Offer: "Send us last month's posts and
   payout sheet. We send back which views look fake and what you overpaid."
   It costs the brand nothing and shows the one thing marketplaces do not do.
4. Reach them by email and in their own Discord, addressed to the program
   owner by name. A person approves every message. No automated DMs on TikTok
   or Instagram, because that breaks platform terms.
5. Convert audits into a one-month paid pilot at the Starter price. The pilot
   runs one full cycle: brief, roster, review, payout report.
6. Each finished pilot becomes a short case study that goes into the next
   batch of emails.

Target funnel, all assumptions: 200 brands contacted, 30 audits, 10 paid
pilots.

## Open questions

- Will a brand pay $2,000 a month before fraud detection is proven on its own
  data?
- Is the buyer the founder or a hired manager? The pitch differs: time back
  versus a role not hired.
- Do marketplaces add this themselves? If so, we work across marketplaces and
  they do not.
