# 13 — AI-Powered Production System

An AI-assisted workflow that cuts production time roughly in half **without** producing the low-effort, mass-produced content that YouTube's inauthentic/reused content policies demonetize.

> **The golden rule:** AI handles *speed* (research, drafts, clean-up, versions). **You** handle *judgment* (the angle, opinions, experience, final script, final cut). If a viewer couldn't tell a human was involved, you've automated too much.

> **Tool note:** the tools below are examples that were widely used at the time of writing. Features, prices and policies change often. Check them before you commit, and start with free tiers.

---

## A. The pipeline at a glance

| Stage | Time (manual → AI-assisted) | AI does | You do |
|---|---|---|---|
| 1. Topic research | 2h → 45m | Clusters ideas, summarizes competitor videos and comments, lists questions | Choose the topic and angle; check demand evidence |
| 2. Packaging | 1h → 30m | Generates 30 title variants, thumbnail concepts | Choose; sketch; test |
| 3. Scripting | 3h → 1.5h | Outline, first draft, tightening, hook variants | Rewrite in your voice; add stories, opinions, examples |
| 4. Voice / recording | 1.5h → 1h | Teleprompter, optional voice cleanup, pickups | Perform. Your real voice is your brand. |
| 5. Editing | 5h → 2.5h | Transcript-based cutting, silence/filler removal, captions, B-roll suggestions | Pacing, story, final cut |
| 6. Thumbnail | 1h → 30m | Background generation/removal, upscaling, variants | Composition, face shot, final design |
| 7. Publishing | 45m → 15m | Description, chapters, tags draft, translations | Review and correct every line |
| 8. Analytics review | 45m → 20m | Summarizes exports, flags patterns | Decide what to change |
| 9. Repurposing | 3h → 1h | Finds clip moments, reframes vertically, captions | Pick clips; write native hooks |
| **Total / video** | **~18h → ~8h** | | |

---

## B. Recommended tool stack (by stage)

| Stage | Free / starter | Upgrade |
|---|---|---|
| Research & scripting | Claude, ChatGPT, Gemini (LLM assistant); YouTube search autocomplete; Google Trends | vidIQ / TubeBuddy (keyword + outlier research); video summarizer tools for competitor videos |
| Teleprompter | Free web teleprompters; phone teleprompter apps | Hardware teleprompter |
| Recording | Phone + lav mic; OBS Studio (screen) | Mirrorless camera; Tella or Screen Studio (polished screen recordings) |
| Voice | Your voice + a decent mic. Use noise cleanup (Adobe Podcast Enhance, built-in denoisers). | ElevenLabs for pickups/dubbing **only with your own cloned voice and disclosure where required** |
| Editing | DaVinci Resolve (free), CapCut | Descript (edit by transcript), Premiere Pro + AI features |
| Captions | YouTube auto-captions (corrected), CapCut auto-captions | Descript, Submagic |
| Music & SFX | YouTube Audio Library | Epidemic Sound, Artlist (licensed for YouTube) |
| B-roll & visuals | Your own footage; Pexels/Pixabay | Licensed stock; AI image/video generators for illustrative shots (disclose realistic synthetic content) |
| Thumbnails | Canva, Photopea | Photoshop (generative fill), remove.bg, upscalers |
| Repurposing | YouTube's built-in clip/remix tools, CapCut | Opus Clip, Descript, Vizard |
| Scheduling | YouTube Studio scheduler; native TikTok/IG schedulers | Buffer, Later, Metricool |
| Analytics | YouTube Studio | vidIQ, spreadsheets + an LLM for pattern analysis |
| Project management | Notion / Trello / Google Sheets | Notion database with this OS as templates |

---

## C. Stage-by-stage workflows (with prompts)

### 1. Topic research (45 min)
1. Gather inputs: 10 outlier titles from competitors, 50 top comments, 30 autocomplete phrases (module 01).
2. Prompt:
```
You are a YouTube strategist. My channel: [promise]. My viewer: [profile].
Here are outlier videos from my niche: [list]. Here are viewer comments: [paste].
Here are search phrases: [paste].
1) Cluster these into the 8 strongest underlying viewer desires/problems.
2) For each, give 3 video ideas with a unique angle that fits my channel.
3) Score each idea 1–5 on search demand, browse appeal, evergreen, monetization, ease.
Only use the evidence I gave you; mark anything you're guessing as [assumption].
```
3. **You:** check the top 5 ideas against real search results and pick one.

### 2. Packaging (30 min)
```
Video idea: [idea]. Viewer: [profile]. Core promise: [one sentence].
Write 30 titles under 60 characters using these formulas: how-to, I tried, numbers,
stop/mistakes, vs, why, story. Then give 5 thumbnail concepts as:
[subject] + [emotion/transformation] + [≤4 words of text that ADD to the title].
No clickbait the video can't deliver.
```
**You:** shortlist 3 titles + 2 thumbnails and run the "would I click?" test (module 05).

### 3. Scripting (1.5h)
1. **Brain dump first (15 min, no AI):** your experience, stories, opinions, examples. This is what makes the video yours.
2. Prompt for the outline:
```
Using the Challenge Arc / PAS / Countdown structure [pick one] and my notes below,
create a beat-by-beat outline for a [length]-minute video titled [title].
Include: hook (confirm/stakes/promise), 2 open loops with where they pay off,
a re-hook before each section, a midpoint twist, and a bridge ending to [next video].
My notes: [brain dump]
```
3. Draft the script from the outline (AI first draft is fine), then **rewrite every line out loud in your own words.**
4. Tightening prompt:
```
Cut this script by 20% without losing any information. Remove repetition, filler,
throat-clearing, and generic statements. Flag any sentence that sounds generic or
AI-written so I can rewrite it with a personal example. Give me 5 alternative hooks.
```

### 4. Voice & recording (1h)
- Record with a teleprompter or bullet points. Natural delivery beats perfect delivery.
- Record each section 2× and keep the better take. Record the hook 3–5×.
- Use AI noise removal *lightly*; over-processing sounds robotic.
- **AI voiceover:** only for faceless channels that add substantial original value (research, scripting, editing), or for pickups/dubbing with your own cloned voice. A generic AI voice over stock footage is the profile that gets rejected from YPP.

### 5. Editing (2.5h)
1. Transcript-based rough cut: delete bad takes in the text editor (Descript/Resolve/Premiere).
2. Auto-remove silences and filler words, then **review**, since automation cuts breaths that need to stay.
3. AI B-roll pass: ask for a shot list from the transcript ("suggest a visual every 10 seconds").
4. Human pass for pacing: watch at 1×, cut anything you'd skip.
5. Captions: generate, then fix technical terms and names.
6. Audio: normalize the voice (~ −14 LUFS integrated for YouTube), music −25 to −30 dB under the voice.

### 6. Thumbnail (30 min)
1. Shoot 10 expression photos at recording time (good light, high contrast).
2. Remove the background → place on a designed background (AI-generated backgrounds are fine).
3. Make 3 variants with real differences for Test & Compare.
4. Check at mobile size (shrink to ~160px wide).

### 7. Publishing (15 min)
```
From this transcript, write: (1) a YouTube description whose first 2 lines restate the
promise naturally including "[keyword]", then a 3-sentence summary, (2) chapters with
timestamps named like search queries, (3) 5 tags, (4) a pinned comment that asks a
question viewers will want to answer. Transcript: [paste with timestamps]
```
Then run the module 04 publishing checklist. **Check every timestamp** (AI often gets them wrong).

### 8. Analytics review (20 min)
Export Advanced Mode data (CSV) → prompt:
```
Here's my YouTube analytics export: [paste]. My channel average CTR is X and % viewed is Y.
Identify: top 3 and bottom 3 videos by views/day and subs per 1k views; patterns in
titles/topics/length/format among the winners; one experiment to run next week.
Only state what the data shows; don't invent numbers.
```
Then follow the review frameworks in [module 15](15-analytics-optimization.md).

### 9. Repurposing (1h)

**1 long-form → 10+ pieces**

| Output | How | Platform notes |
|---|---|---|
| 3–5 vertical clips | AI clip finder suggests moments → you pick the 3–5 with a self-contained payoff → reframe 9:16 → **new hook in the first second** + captions | YouTube Shorts, TikTok, Instagram Reels, Facebook Reels |
| 1–2 native Shorts | Re-film the best tip vertically (often beats a clip) | Same |
| Carousel / thread | LLM turns key points into 6–8 slides/posts | Instagram, LinkedIn, X, Threads |
| Newsletter issue | LLM turns the transcript into an email draft → you add a personal note | Email list |
| Blog post / SEO article | Transcript → article; embed the video | Website (Google search) |
| Community post | Poll or image from the video | YouTube Community |

**Cross-platform rules**
- Export clean files **without other platforms' watermarks** (TikTok/IG/YouTube all deprioritize visible competitor watermarks).
- Write platform-native captions; don't paste the same text everywhere.
- Platform-specific trending sounds help on TikTok/Reels but often aren't licensed for YouTube. Use licensed audio for YouTube.
- Post the same clip on different platforms; adapt the hook if one platform responds better.

---

## D. Templates

**Production board columns (Notion/Trello):**
`Ideas → Packaged → Outlined → Scripted → Recorded → Edited → Thumbnail ready → Scheduled → Published → Repurposed → Reviewed (7d)`

**Per-video card fields:** title, pillar, format, publish date, script link, raw footage link, thumbnail variants, checklist status, 7-day metrics, lessons.

Script and brief templates: [templates/video-brief.md](templates/video-brief.md) and the script template in [module 11](11-viral-video-engine.md#j-script-template-copy-for-every-long-form-video).

---

## E. Quality-control checklists

### QC 1: Script (before recording)
- [ ] Includes at least 2 personal stories, opinions or original examples (not available from an AI or a competitor)
- [ ] Every factual claim checked against a primary source (AI makes things up)
- [ ] Code/demos actually run
- [ ] Read aloud: no sentence sounds like generic AI ("In today's fast-paced world…", "Let's dive in", "game-changer")
- [ ] Hook confirms the title within 5 seconds

### QC 2: Edit (before export)
- [ ] Watched fully at 1× as a viewer
- [ ] No dead air > 1s unless intentional
- [ ] Visual change every 5–15s
- [ ] Captions proofread (names, code terms)
- [ ] Audio levels consistent; no music overpowering the voice
- [ ] All music/footage licensed for YouTube monetization

### QC 3: Publish (before going public)
- [ ] Module 04 checklist complete
- [ ] AI-generated metadata reviewed line by line
- [ ] Altered/synthetic content disclosure set correctly (realistic AI-generated people, places or events require it)
- [ ] Paid promotion box ticked if applicable
- [ ] Affiliate disclosures in the description and spoken

### QC 4: Authenticity (monthly, protects YPP)
- [ ] Would a reviewer clearly see original contribution in my 10 newest and 10 most-viewed videos?
- [ ] Are videos meaningfully different from each other (not one template with swapped words)?
- [ ] Is my voice/face/perspective present in each?
