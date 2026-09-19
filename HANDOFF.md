# Content Machine demo: hand-off

**Live site:** https://joanneelin.github.io/pwhl-content-machine/
**Repo:** https://github.com/joanneelin/pwhl-content-machine (public)
**QR code for the slides:** `Ideathon/Content_Machine_QR.png` on Joanne's machine. It points at the live site; regenerate it if the URL changes.
**Last updated:** Sept 19, 2026

---

## 1. What this is

This is a clickable demo for our Ideathon 2026 pitch to the PWHL (Challenge 2, "Own the Story"). It shows the **Content Machine**, one of the two ideas in the deck.

The idea: an AI tool reads what fans share, ranks the moments and players they love, and drafts short videos with captions for TikTok, Instagram Reels and YouTube Shorts. A person on the PWHL's small content team approves every post. The deck's line for this is "AI drafts. Your team presses send."

**Nothing in the demo is real AI.** It's a static website with no server and no model.
- The "AI-generated videos" are **real PWHL clips**, embedded from the league's official YouTube channel.
- The captions are **written in advance**.
- The fan comments are **real Reddit comments, quoted word for word**.

This means the demo can't fail in front of judges. Judges scan a QR code on slides 9 and 20 and tap through it on their phones in about a minute.

### What a judge sees
| Tab | What it does |
|---|---|
| **Trending** (Listen & Rank) | 9 moments ranked by a buzz score. Each shows a clip thumbnail, a top real r/PWHL comment with upvotes and a link, and player tags. Includes filter chips (All / Stars / Big Moments / Fan Culture), a "See all fan comments" toggle, and a **"Paste a fan post or type a topic"** box that keyword-matches any text to the closest moment. Unmatched text falls back to the top moment, labeled "Closest match." |
| **Studio** (Draft) | A roughly 4.6-second animation walks through 4 steps: reading comments → picking a clip → writing in the PWHL voice → checking facts. Then a TikTok / Reels / Shorts switcher shows a phone mockup playing the real clip, with a hook, caption and hashtags. Below it: an editable caption (the edits update the phone preview live), a suggested post time, **Regenerate** (switches to the other caption version), **Approve** (shows "queued for your team ✓"), **Next moment**, a "Why this clip" card with real fan quotes, and a "Facts checked" list. |
| **Impact** | 280 drafts a week, about 90 hours saved a week, about 86% lower cost, and a count of drafts approved in this session. Also a cost bar comparison ($125K for a hire vs. $18K a year for the machine), top players by fan mentions (counted live from the quotes), and a planned platform mix. Everything is labeled as an estimate. |

The first visit shows a one-card intro. Add `?nointro` to the URL to skip it, which is useful for rehearsing. Deep links work: `#trending`, `#studio/m3`, `#impact`.

---

## 2. Repo layout

```
index.html            page shell: header, tabs, intro card, toast, footer
styles.css            all styling (design tokens at the top)
app.js                all behaviour: hash routing, rendering, matching, animation, video embeds
data/data.js          GENERATED: window.CM_DATA = {clips, signals, moments}. Don't hand-edit.
data/source/          clips.json (20 checked YouTube clips) + signals.json (36 real Reddit quotes)
assets/thumbs/        a local thumbnail for every clip (poster image + offline fallback)
tools/moments.py      THE CONTENT FILE: the 9 moments, captions, facts; builds data/data.js
tools/qa/             headless-Chrome click-through scripts (flow.mjs, live_check.mjs)
HANDOFF.md            this file
```

No framework and no build step. The data is loaded as a `<script>` instead of with `fetch()`, so the page also works when opened straight from disk (`file://`). All paths are relative, which it needs because GitHub Pages serves it from the `/pwhl-content-machine/` sub-path. The only outside requests are Google Fonts (EB Garamond), `youtube-nocookie.com` embeds, and nothing else.

---

## 3. Everyday tasks

**Run locally**
```bash
cd content-machine-live
python3 -m http.server 8801      # then open http://localhost:8801/?nointro
```

**Deploy:** push to `main`. GitHub Pages rebuilds the site within about a minute. No other steps.
```bash
git add -A && git commit -m "…" && git push
```

**Change captions, facts, buzz scores or which clip a moment uses:** edit `tools/moments.py`, then:
```bash
python3 tools/moments.py     # rewrites data/data.js; asserts every clip_id and signal_id exists
```

**Add a new moment:** copy one entry in `M` inside `tools/moments.py`.
- **Required fields:** `id`, `title`, `category` (`Stars` / `Big Moments` / `Fan Culture`), `buzz` (0–100; sets the rank), `clip_id`, `signal_ids`, `players`, `comments_read`, `keywords`, `why_this_clip`, `facts`.
- **Drafts:** `drafts.tiktok|reels|shorts`, a list of versions made with `d(hook, caption, hashtags, post_time)`. Regenerate cycles through however many versions you give it.
- **Keywords** power the paste box. Use lowercase and include nicknames. Multi-word phrases score higher than single words.

**Add a new clip**
1. Get the video ID from the PWHL channel (`@thepwhlofficial`, channel id `UCNKUkQV2R0JKakyE1vuC1lQ`).
2. **Check that it can be embedded.** This needs to return `200`; anything else shows "video unavailable":
   ```bash
   curl -s -o /dev/null -w "%{http_code}" "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json"
   ```
3. Download a thumbnail to `assets/thumbs/VIDEO_ID.jpg` (from `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`).
4. Add an entry to `data/source/clips.json`: `id`, `title` (copied from the oEmbed response), `thumb_path`, `players`, `category`.
5. Rerun `python3 tools/moments.py`.

**Add a fan quote:** add it to `data/source/signals.json` with `id`, `quote`, `score`, `subreddit`, `url`, `theme` and `players`. **Copy it word for word from a real comment, and don't include usernames.** The source threads are saved in `Ideathon/research/reddit-threads/*.txt` on Joanne's machine.

**Test it in a real browser (optional, needs Google Chrome)**
```bash
cd tools/qa && npm install
python3 -m http.server 8801 -d ../..   # in another terminal, from the repo root
node flow.mjs          # phone + desktop click-through, screenshots saved to qa-shots/
node live_check.mjs    # checks the LIVE site at phone size, screenshots saved to qa-shots/
```
Both scripts print any console or page errors. `qa-shots/` is gitignored. The scripts expect Chrome at `/Applications/Google Chrome.app/…`, so change `executablePath` on other machines.

---

## 4. Content rules (don't break these)

These matter because PWHL executives are among the judges:
- **Quotes are real and word for word.** Never write or "improve" a fan quote. Trimming at a sentence boundary with "…" is fine.
- **No usernames** anywhere.
- **No X/Twitter content.** We don't have real posts, and inventing them would be dishonest.
- **Every "fact checked" line and every player-team pairing** has to come from the verified list below or from the clip's own title. Captions can't describe action the clip title doesn't support; we write captions without watching the clips.
- **Voice:** bold, warm, inclusive. **Never compare the women's game to the men's.** Say "intermission," never "halftime." Don't call pros "girls."
- **This is a student prototype, not an official PWHL product.** Don't use the PWHL logo as the app's branding, and keep the footer disclaimer.
- **Impact numbers must match the deck:** 280 drafts a week (40 a day), 5,000 fan posts scanned a day, about $18K a year vs. about $125K for a hire, about 86% lower. If the deck changes, change `renderImpact()` in `app.js`.

**Verified facts used in the demo**
- Poulin (Montréal): Olympic women's goals record (20); 2026 Walter Cup champion and playoff MVP.
- Knight (Detroit, signed through 2028–29): US Olympic records of 15 goals and 33 points.
- Harvey (Vancouver): 2026 Olympic MVP and 2026 #1 draft pick.
- Frankel (Boston): first goalie to win PWHL MVP; record 8 shutouts.
- Fillier (New York). Maltais (Montréal).
- Detroit is one of four 2026–27 expansion teams.
- Every game streams free on YouTube outside Canada.
- PWHL has the #1 Instagram engagement rate (9.4%) of 13 major leagues.
- 1.1M+ regular-season fans in 2025–26 (9,304 per game).

---

## 5. Design system (matches the slide deck)

- **Colors:** background gradient `#05022A` → `#1A0552` → `#2E067E` with a violet glow. Accent purple `#7E3EF6`, ice blue `#5EAEF8` (numbers), lavender `#B9A2FF` (labels), muted text `#C8C2E8`, dim text `#8F86C2`, deep purple `#2A0B7A`.
- **Type:** **EB Garamond** everywhere in the app. The phone mockups use the system sans-serif so they look like the real apps.
- **Layout:** phone-first. There's a bottom tab bar under 900px and a top tab row with two-column layouts from 900px up.

---

## 6. Known gaps and next steps

1. **Captions:** each platform has **2** versions per moment. The original plan was 3; add a third with `d(...)`.
2. **Desktop layout:** checked in code but only lightly checked on a real screen. Look at 1440×900 (a projector) before presenting.
3. **YouTube's own overlay:** the embed briefly shows its title and play/pause button on top of our mockup. YouTube controls this, and `controls=0` doesn't remove it entirely. A fix would be to download the clips as MP4s and use `<video>`, but that's a copyright gray area, which is why we embed.
4. **Offline:** if the network drops, each preview falls back to the thumbnail and shows "Video preview offline" after about 7 seconds. Venue Wi-Fi is the biggest risk, so **keep a screen recording of the demo as backup.**
5. **Missing favicon:** harmless 404 in the console. Add a `favicon.ico` if you want a clean console.
6. **No automated review yet.** A fuller build with four QA reviewers was running in the background. Its partial output is in `Ideathon/content-machine/` on Joanne's machine and is **not deployed**. It has 8 moments with 3 caption versions each in `data/moments.json`, plus its own `qa/` harness. If you finish or check it, deploy by copying it into this repo, so the URL (and the QR code) stays the same.
7. **Paste box matching** is plain keyword overlap. Anything it can't match falls back to the top moment, labeled "Closest match." That's intentional so it never shows an empty result.
8. **Buzz scores and "comments read" counts are demo numbers,** labeled "demo" in the app.

---

## 7. Related materials (on Joanne's machine, `Ideathon/`)

- `PWHL_Join_Our_Why.pptx`: the pitch deck. The demo QR code goes on slide 9 ("See it work") and slide 20 (closing). Built with `deck/build.js` (EB Garamond, PWHL purple).
- `JOY_graphic.pptx` and `JOY_graphic_*.png`: the "Join Our (Wh)Y" graphic.
- `research/`: Reddit threads, the three campaign concepts, slide design notes and the slide outline.
