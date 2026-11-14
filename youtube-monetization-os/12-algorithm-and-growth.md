# 12 — YouTube Growth & the Algorithm

How the recommendation system works in practice, what each metric tells you, and a growth strategy built on it. [Module 06](06-growth-systems.md) covers the growth *systems*; this module explains *why* they work, plus the testing and optimization methods.

---

## A. How the algorithm actually works (the mental model)

YouTube's stated goal is to **show each viewer the videos they're most likely to watch and be satisfied with**. There isn't one algorithm. There are several recommendation surfaces, each personalised per viewer:

| Surface | What it matches | What it rewards |
|---|---|---|
| **Home (Browse)** | Your video ↔ viewers whose history suggests interest | CTR + watch time + satisfaction among the viewers it's shown to |
| **Suggested (Up Next)** | Your video ↔ the video someone is currently watching | Topic/audience overlap; continuing the session |
| **Search** | Your video ↔ a typed query | Relevance (title, description, spoken words) + engagement on that query |
| **Shorts feed** | Your Short ↔ swipe behaviour | Viewed vs swiped away, completion, loops, engagement |
| **Subscriptions / notifications** | Your video ↔ your subscribers | Their history with your channel |

**The core loop:**
```
YouTube shows your video to a small test group (impressions)
   → do they click? (CTR)
   → do they watch and enjoy it? (AVD, % viewed, likes, surveys, not clicking "not interested")
   → do they keep watching YouTube afterward? (session)
If yes → it shows the video to a larger, similar group → repeat
If no  → impressions slow down
```

**Key principles**
1. **The algorithm follows the audience.** It doesn't "like" or "punish" channels. It predicts viewer behaviour.
2. **Performance is relative.** Your video is compared to the alternatives for *the same viewer at the same moment*, not to a fixed number.
3. **Every video gets a chance.** Small channels can break out because each video is evaluated on how viewers respond to it.
4. **Satisfaction beats clickbait.** High CTR with a quick exit is a negative signal. A misleading title loses to an accurate one over time.
5. **Upload frequency isn't directly rewarded.** More uploads mean more chances (and faster learning), not a ranking boost. A gap doesn't "kill" the channel.
6. **Viewers, not keywords.** Tags barely matter. Clear titles and spoken words help search; nothing replaces people wanting to watch.

---

## B. The metrics, and what each one tells you

| Metric | What it is | What it tells you | Lever to improve it |
|---|---|---|---|
| **Impressions** | Times your thumbnail was shown on YouTube | How much the system is testing/promoting you | Better CTR/retention (more promotion), broader topics, search optimization |
| **Impressions CTR** | % of impressions that turned into views | Packaging strength **for the audience it's shown to** | Title, thumbnail, topic choice |
| **Views** | Total views | Overall reach | Impressions × CTR, plus external traffic |
| **Average view duration (AVD)** | Mean minutes watched per view | Content value + pacing | Hook, structure, edit |
| **Average % viewed** | AVD ÷ length | Compare retention fairly across videos of different lengths | Same, plus right-sizing length |
| **Audience retention graph** | % still watching at each second | *Where exactly* you lose people | Fix the specific moments |
| **Watch time (hours)** | Total time watched | Monetization progress + total value delivered | Views × AVD |
| **Returning viewers** | Viewers who watched before | Whether people come back (channel loyalty) | Series, consistent promise, community |
| **New viewers** | First-time viewers | Reach into new audiences | Browse-style topics, Shorts, collabs |
| **Subscribers gained per 1k views** | Subscriber conversion | How strong the reason is to come back | Clear promise, series, CTA after value |
| **Traffic sources** | Where views came from | Which surface is working | Optimize for the surface that's growing |
| **Engagement** | Likes, comments, shares, saves | Viewer satisfaction signals | Questions, community, value worth sharing |

**CTR caveat:** CTR naturally *drops* as impressions grow, because the video is shown to colder audiences. Falling CTR + rising impressions = **good**. Always read CTR *alongside* impressions.

---

## C. Traffic sources: what each tells you, and how to grow it

| Source | Healthy sign | How to grow it |
|---|---|---|
| **YouTube search** | Steady and compounding over months | Answer specific queries; keyword in the title + first description line + spoken in the first 30s; chapters |
| **Browse features** | Spikes after publishing, sustained on winners | Broader curiosity topics, strong packaging, high satisfaction |
| **Suggested videos** | Your videos suggested next to others | Make videos on topics adjacent to bigger channels' successful videos; link your own videos into series |
| **Shorts feed** | Swipe-through > 70% | Hook in 1s, loopable, one idea per Short |
| **External** | Steady low % | Communities, email, social, embeds |
| **Channel pages / playlists / end screens** | Growing over time | Series playlists, a strong channel home page, end screens |

**Stage pattern:** new channels usually grow **Search → Suggested → Browse**. Search gets your first views, Suggested connects you to similar channels, and Browse (Home) is where breakouts happen once the system understands your audience.

---

## D. Posting frequency strategy

| Stage | Long-form | Shorts | Rationale |
|---|---|---|---|
| 0–1k subs | 1/week (minimum 2/month) | 3–5/week | Learn fast; build a search library; find signal |
| 1k–10k | 1–2/week | 3–5/week | Double down on proven formats; series |
| 10k+ | What quality allows | Clips + native | Quality and packaging matter more than volume now |

**Rules:**
- Raise frequency only if quality (CTR and AVD vs your average) holds.
- If a better video needs 2 weeks, take 2 weeks. One great video beats two mediocre ones.
- Don't post a long-form within ~6 hours of a Short (practical habit, not an official rule): give each a clean start.

---

## E. Testing methods

### 1. Thumbnail/title testing (Test & Compare)
- Upload up to 3 thumbnails (and title variants where available) at publish.
- YouTube picks a winner by **watch time share**, not CTR, which is the right metric.
- **Test big differences** (face vs no face, result vs process, light vs dark), not tiny colour tweaks.
- Log what wins in a "packaging lessons" doc. After 10 tests you'll have *your* audience's rules.

### 2. The 48-hour packaging swap
If after 48–72h a video has **CTR clearly below your channel average and good retention**, change the title *or* the thumbnail (one at a time) and compare the next 48h.

### 3. Format tests (A/B by video)
Run a 4-video experiment: 2 videos in format A, 2 in format B, same pillar, similar topic strength. Compare **views per day (first 7 days)**, **% viewed**, and **subs per 1k views**. Keep the winner.

### 4. Hook tests
For Shorts: post the same content with 2 different first seconds a week apart and compare "viewed vs swiped". For long-form, compare 30-second retention across videos and record which hook type each one used.

### 5. Length tests
For the same format, try ±30% length. Track **AVD (minutes)**, not only %: a 15-min video at 40% beats an 8-min video at 55% on watch time.

### Testing rules
- Change **one variable** at a time.
- Need at least ~1,000 impressions before judging CTR.
- Compare to **your own baseline**, never to other channels.
- Keep a test log: date, hypothesis, variable, result, lesson.

---

## F. Optimization tactics checklist

**Discovery**
- [ ] Title targets a real desire/question and is ≤ 60 chars
- [ ] Spoken keyword in the first 30 seconds (auto-captions feed search)
- [ ] First 2 description lines restate the promise naturally
- [ ] Chapters named like search queries
- [ ] Each video in at least one playlist

**Session building**
- [ ] End screen points to the *specific* best next video
- [ ] Mentions/cards link to related videos *at the moment they're relevant* (not in the first 30 seconds)
- [ ] Series playlists ordered so episodes play in sequence

**Back catalogue**
- [ ] Monthly: re-package underperformers with good retention
- [ ] Update old-video descriptions/end screens to point to newer, better videos
- [ ] Pin a comment linking to the follow-up video

---

## G. Turning viewers into subscribers

Viewers subscribe when they **expect future value**. One good video isn't enough; they need to believe the *next* one will be good too.

| Lever | How |
|---|---|
| **Clear promise** | State what the channel is for in every video (one sentence, after the first payoff) |
| **Series** | "This is part 1 of 5" creates a reason to subscribe |
| **Consistent packaging** | Recognizable thumbnails tell people "it's that channel again" |
| **CTA after value** | Ask *after* a payoff, and tie it to a benefit ("for part 2, subscribe") |
| **Channel page** | Trailer for non-subscribers + best playlist first |
| **Shorts → long-form** | Link clips to full videos; only post Shorts that serve the same viewer |
| **Community** | Reply to comments; viewers who get a reply return more often |
| **Topic focus** | Each off-topic video teaches the system to recommend you to the wrong people |

**Target:** 1%+ subscriber conversion (10+ subs per 1,000 long-form views) means the promise is landing.

---

## H. The 12-month growth strategy

| Quarter | Focus | Algorithm goal | Key metric |
|---|---|---|---|
| **Q1** | Search-led library + Shorts habit | Get YouTube to understand *who* you're for | Search % of traffic; first outlier |
| **Q2** | Double down on outliers; first series | Get into Suggested next to similar channels | Suggested %; returning viewers |
| **Q3** | Broader topics on proven formats; collabs | Break into Browse/Home | Impressions growth; views per video |
| **Q4** | Bigger productions on best formats; back-catalogue optimization | Sustain + compound | Watch hours/month; subs per 1k views |
