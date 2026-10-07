# UGC program playbook

Notes on "Launch and Scale Generational UGC Programs (FULL GUIDE)" by Ben
(@benaratame), posted June 12, 2026:
https://x.com/benaratame/status/2065477802028110300

This is a summary in our own words, kept as a reference for how a strong
operator actually runs a program. He ran programs for live apps with real
budgets. We are an MVP, so the last section says what we take now, what we
take later, and what we leave out.

## How he runs a program

### Before starting

- Needs time and money. He would set aside about $5,000 to $10,000 for the
  first month of creator payouts.
- Run it yourself. He argues the founder always cares more than an agency.
- Two kinds of program. Regular: 10 to 50 creators, mostly pay per post,
  cheaper to start. Focused: under 10 experienced creators on retainers.

### Pay

- Starts at $20 to $30 per video plus view bonuses.
- A video only counts once it passes 1,000 views on a single platform, not
  combined across platforms. Under 1,000 means a shadow ban or weak content.
- The creator must hit a minimum number of posts per week to be paid.
- View bonuses replace the previous tier. They do not stack.
- A post can earn for two weeks. Views after that do not raise the payout.
- Pay-per-post creators are paid on a rolling basis, retainer creators every
  two weeks.
- For strong creators a retainer is often cheaper. $2,000 a month for a post
  a day works out near $67 a video.

### Trial period

- Every new creator gets 14 days to pass 10,000 views on one post, on one
  platform.
- Passing pays a flat $100. Trial posts earn nothing else.
- Because of the trial, he recruits as many creators as possible. A weak
  creator costs nothing.

### Recruiting and firing

- Recruit widely, hire fast, fire fast. Many of his best creators had never
  made content before.
- He looks for people who are outgoing and comfortable talking to a camera.
- Fire creators who are inconsistent, slow to reply, or miss the weekly
  minimum without warning. One warning, then out.
- Whoever runs the program has to sell the vision, since creators are being
  asked to accept a low base rate.

### Where he finds creators

His own network, cold outreach on TikTok, Instagram, email and Facebook,
UGC agencies paid per creator who passes trial, paid story posts from
creators who post about UGC and side hustles, UGC marketplaces, college
clubs, "I'm hiring marketing interns" videos, LinkedIn and X, fraternities
and sororities, referrals from current creators, Handshake and college job
boards, Reddit, and friends. Outbound is done by trained assistants sending
200 to 300 messages a day, with a log to avoid duplicates.

He also describes recruiting students for academic credit through a
university internship course.

His best outreach message does three things: establishes credibility, is
clear about the role and the pay, and says what happens next.

### Onboarding

- A 20 minute call with every creator: what the program offers, how it
  works, and what he needs to know about them.
- Contract and tax forms sent during the call, automated through an API.
- Creators keep ownership of their accounts. The brand owns the content for
  use in ads.

### Keeping creators consistent

- Minimum 5 to 7 posts a week, maximum 14.
- A daily update every morning at 10am Eastern, by text message: the weekly
  deadline, announcements, that day's scripts by format, and links to
  resources.
- Two calls a week per creator: one group call, one 1:1.
- Account warm-up before the first post: two days of about 90 minutes of
  real scrolling and engaging in the niche, then two test videos that must
  each pass 1,000 views.
- Post on every platform: TikTok, Instagram, Snapchat, YouTube Shorts,
  Facebook.

### Shadow bans

- Signs: posts stay under 1,000 views, or most likes come from mutuals.
- Fix: archive posts under 1,000 views after a few days, stop posting for a
  day or two, and warm the account up again.

### Bounties

- $500 for the first video to pass 500,000 views, $1,000 for the first to
  pass 1 million, on top of normal pay.
- Occasional bonuses for posting above the weekly minimum.
- Physical prizes work better than cash.

### Content

- One format, three scripts, tested for three days, then changed based on
  what performed. With 15 creators that is 45 posts in three days.
- The first days go to research: viral posts, top creators and community
  forums in the niche, to learn how that niche talks.
- Formats he names: entertainment, side hustle, career advice, and
  non-talking-head (a reaction with on-screen text, then a product demo).
- Creator resources: a manual, a sound library, product tutorials and a
  content crash course.

### Systems

- Editors at a few dollars a video, for the best creators only.
- A scriptwriter producing 8 to 10 scripts a day.
- A coach who reviews posts and gives creative direction.
- Affiliate links per creator to track conversions.
- Comment-to-DM automation so a viewer who comments a keyword gets the link.
- Post tracking through scraper APIs, under $100 a month for one or two
  programs. He pulls metrics often to catch fraud: engagement that spikes
  from nowhere, or very low engagement for the view count.
- Review every post within one to two hours, strictly, and give all the
  feedback at once.
- An internal dashboard and creator portal for submissions, payouts,
  resources and metrics. He built his own and says he does not know of a
  good alternative.

## What this means for us

### It confirms the idea

Nearly every job he describes is done by a person or a hired assistant:
outbound, scripting, coaching, post review, payout tracking, the daily
update. He built his own dashboard because he found nothing good to buy. That
is the gap this product sits in, described by someone who has run it at
scale.

### Take now, in the MVP

| His practice | What changes for us |
|---|---|
| Fraud checks on post metrics | Already the core of the Research agent, and the main job of the Review agent. His two signals, sudden spikes and low engagement for the views, match ours |
| Under 1,000 views means a shadow ban | Add to the Review agent as a named flag |
| Outreach that states credibility, pay and next steps | The Sales agent's drafts already state the pay. Add the next step and the trial terms |
| One format, three scripts | The Strategy agent's brief gives opening lines today. Shape it as one format with three scripts |

### Take later, in Phase 2

| His practice | What it becomes |
|---|---|
| Recruit widely and let a trial filter | A trial status on the roster: 14 days, one post past a view threshold. The Research agent can then be less strict, since today it rejects half of what it finds |
| Tiered pay: base, view tiers that replace, a minimum, a two-week window | A real payout engine. Our sample brand uses a single rate per 1,000 views, which is simpler than how he pays |
| Daily 10am update with scripts and deadlines | A Coach agent that writes and posts it. A fifth agent, which Phase 2 requires |
| Re-test content every three days | The Strategy agent reruns on a schedule, using the Review agent's results |
| Weekly minimum posts, one warning, then removal | Consistency tracking per creator, with the Coach agent sending the warning |
| Bounties | A rule the payout engine checks |
| Affiliate links and conversions | Ties views to installs. Needs a real client |

### Leave out

- Onboarding calls, contracts, tax forms and moving money. A person does
  these. Agents calculate, a person approves.
- Scoring creators on looks or accent. He lists these among his criteria. We
  score on what a creator posts and on their numbers, and we do not build
  appearance or accent into an automated filter.
- Account warm-up automation, VPN setups for overseas creators, and taking
  creators from other programs. Not needed for an MVP, and some carry
  platform or reputational risk.
- The academic-credit approach to unpaid creators. It depends on employment
  law we have not checked.
