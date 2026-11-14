# 15 — Analytics Optimization System

A complete data system: which metrics matter, how to read them, how to diagnose problems, and the weekly/monthly/quarterly reviews that find winning patterns and fix weak videos.

Builds on: metric definitions in [module 12](12-algorithm-and-growth.md#b-the-metrics-and-what-each-one-tells-you), the retention graph guide in [module 05](05-retention-framework.md#stage-4--retention-graph-diagnosis), and the tracker in [templates/video-tracker.csv](templates/video-tracker.csv).

---

## A. The metric hierarchy

Don't read every number. Read them in this order:

```
LEVEL 1 — Is the video reaching people?   Impressions, Traffic sources
LEVEL 2 — Do they click?                  CTR (in context of impressions)
LEVEL 3 — Do they stay?                   AVD, % viewed, retention graph, 30s retention
LEVEL 4 — Do they come back / commit?     Subs per 1k views, returning viewers, engagement
LEVEL 5 — Does it pay?                    RPM, revenue per 1k views (all streams), conversions
```

Fix the **lowest broken level** first. Retention problems can't be fixed with a better thumbnail, and a weak thumbnail can't be fixed with better editing.

## B. Metric reference: how to read each one

| Metric | Where in Studio | Read it as | Watch out for |
|---|---|---|---|
| **Impressions** | Reach tab | How much YouTube is testing/promoting | Impressions only count YouTube thumbnail shows, not external traffic |
| **CTR** | Reach tab | Packaging strength | Drops naturally as impressions grow to colder audiences; compare videos at the same age (e.g. 7 days) |
| **AVD** | Engagement tab | Minutes of value delivered | Longer videos have higher AVD but lower %; compare within format |
| **% viewed** | Engagement tab | Retention efficiency | Shorter videos score higher; normalize by length bucket |
| **Retention graph** | Per video → Engagement | *Where* viewers leave | Compare against "typical retention" for similar-length videos in your channel |
| **Key moments** | Retention graph | Intro drop, top moments, spikes, dips | The first 30s is the most actionable |
| **Subscribers gained** | Audience tab / per video | Conversion | Use **subs per 1k views**, not raw subs |
| **Returning vs new viewers** | Audience tab | Loyalty vs reach | A healthy channel grows both |
| **Traffic sources** | Reach tab | Which surface works | A spike in one source usually means a specific trigger (search ranking, a big channel's suggested) |
| **Engagement** | Engagement/per video | Likes, comments, shares | Comments per 1k views reveals how strongly viewers reacted |
| **Revenue / RPM** | Revenue tab | Money per 1k views | RPM (what you earn) ≠ CPM (what advertisers pay) |

**Ratios worth computing (they reveal what raw numbers hide):**
| Ratio | Formula | Meaning |
|---|---|---|
| Views/day since publish | views ÷ days live | Fair comparison of old vs new videos |
| Subs per 1k views | subs gained ÷ views × 1,000 | How compelling the channel promise is |
| Comments per 1k views | comments ÷ views × 1,000 | Emotional/engagement strength |
| Watch hours per video | views × AVD ÷ 60 | Contribution to the YPP target |
| Revenue per 1k views (all streams) | total revenue ÷ views × 1,000 | True business value per video |
| 7-day vs 28-day views | v7 ÷ v28 | Spiky (browse) vs compounding (search) video |

## C. The diagnosis matrix

Compare each video to **your own median** for the same format.

| CTR | Retention | Diagnosis | Action |
|---|---|---|---|
| ↑ High | ↑ High | **Winner** | Make a follow-up/series; promote it; link more videos to it |
| ↑ High | ↓ Low | **Packaging over-promises** or a weak hook | Check the first 30s; make sure the video delivers the title's promise quickly |
| ↓ Low | ↑ High | **Hidden gem** (good content, weak packaging) | New title/thumbnail. Your fastest win. |
| ↓ Low | ↓ Low | **Weak idea** or wrong audience | Don't re-edit; learn and move on. Check whether the topic fits your viewer. |
| Normal | Normal, low impressions | **Narrow topic / low demand** | Fine for search content; for browse, choose broader topics |
| Any | Any, high subs per 1k | **Channel-defining video** | Put it in your trailer slot; make it the start of a series; link to it often |

### Retention graph patterns (expanded)
| Pattern | Likely cause | Fix |
|---|---|---|
| Intro drop > 35% in 30s | Hook doesn't confirm the click; slow start; intro sequence | Start with the payoff/visual; cut greetings |
| Drop at the first sponsor/CTA | Interruption too early | Move sponsor/CTA after the first payoff |
| Steady slow decline | Normal | Tighter pacing, more re-hooks |
| Sharp dip at a section | Boring/confusing section or a perceived ending | Cut or shorten; re-hook before transitions |
| Bumps (rewatches) | High-value or confusing moment | Clarify, or make more of that type |
| Graph flattens late | Your core audience stays | The content works; improve the beginning |
| Big drop before end screen | Viewers sense the ending | Start the bridge earlier with a reason to keep watching |

## D. Weekly review framework (Monday, 20–30 min)

Use [templates/weekly-review.md](templates/weekly-review.md). Steps:

1. **Leading indicators** (5 min): did I do the work? (scorecard /7)
2. **New video check** (10 min): last video at 7 days (or 48h for a quick check):
   - Impressions, CTR, AVD, % viewed, 30s retention, subs per 1k, top traffic source
   - Place it in the diagnosis matrix
3. **Retention graph** (5 min): note the single biggest drop point + cause
4. **Shorts check** (3 min): viewed vs swiped away for the week's Shorts; best hook
5. **One decision** (2 min): exactly one action for this week (e.g. "swap thumbnail on video 7", "cut intro to < 10s on next video")

**Rules:** don't check analytics more than once a day; judge a video at 7 days, re-check at 28 days.

## E. Monthly review framework (first weekend, 60–90 min)

### Step 1: Data pull (15 min)
Studio → Advanced Mode → last 28 days + lifetime, export by video: views, impressions, CTR, AVD, % viewed, subscribers, watch time, revenue (if monetized), traffic source breakdown. Paste into the tracker.

### Step 2: Rank & tag (15 min)
- Sort by **views/day** and by **subs per 1k views**.
- Tag top 20% = 🟢, bottom 20% = 🔴.
- For each video, tag: pillar, format, title formula, thumbnail style (face/no face, text/no text), length bucket, hook type.

### Step 3: Find winning patterns (20 min)
Compare tags among 🟢 vs 🔴. Questions to answer:
- Which **pillar** and **format** appear most among winners?
- Which **title formula** and **thumbnail style** have the highest median CTR?
- Which **hook type** has the best 30-second retention?
- Which **length** gives the most watch time per video?
- Which videos bring the most **subscribers** per view (your promise in action)?
- Which **search terms** bring traffic (Reach → Traffic source: YouTube search)? Do any deserve a dedicated video?

Write down **3 winning patterns** ("Challenge format + face thumbnail = 2× our median CTR").

### Step 4: Fix weak videos (20 min)
| Video type | Fix |
|---|---|
| Hidden gems (low CTR, good retention) | New title/thumbnail; re-test in 2 weeks |
| Good search videos losing rank | Update the description, add chapters, pin a comment, link from newer videos |
| Outdated but popular | Make an updated version; link the old to the new (card + description + pinned comment) |
| Weak, off-topic videos | Leave them alone (they still count toward watch hours) unless they confuse your channel's theme for YPP review |

### Step 5: Plan (10 min)
- Next month's content: ≥ 50% based on winning patterns, ≤ 20% experiments.
- Set targets: subs, watch hours, uploads, revenue.
- Update the YPP progress table (module 07).

## F. Quarterly review (half day)
- **Audience check:** Audience tab → age, countries, "other channels your audience watches", "content your audience watches". Still your target viewer?
- **Format portfolio:** kill the weakest format, scale the strongest, add one new experiment.
- **Traffic mix:** is search growing? Suggested? If one source is over 70%, diversify.
- **Revenue:** revenue per 1k views by stream; which videos make money (module 14).
- **Positioning:** re-run module 02 checks.

## G. Monthly dashboard (copy into a sheet)

| Metric | Last month | This month | Δ | Target |
|---|---|---|---|---|
| Long-form uploads / Shorts uploads | | | | |
| Impressions | | | | |
| Median CTR (7-day, long-form) | | | | |
| Median % viewed | | | | |
| Total views (long / Shorts) | | | | |
| Watch hours (month) / 12-mo rolling | | | | |
| Subscribers gained / total | | | | |
| Subs per 1k views (long / Shorts) | | | | |
| Returning viewers % | | | | |
| Search % / Browse % / Suggested % / Shorts % | | | | |
| Email subscribers | | | | |
| Revenue total / per 1k views | | | | |
| **3 winning patterns** | | | | |
| **1 experiment for next month** | | | | |

## H. AI-assisted analysis (optional)
Export your tracker as CSV and use the analytics prompt in [module 13](13-ai-production-system.md#8-analytics-review-20-min). Always check AI conclusions against the raw numbers; an LLM can misread spreadsheets.
