"""Builds data/data.js from the gathered clips + real fan quotes + the moments written below."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "data", "source")
clips = json.load(open(f"{SRC}/clips.json"))
clips = clips["clips"] if isinstance(clips, dict) else clips
signals = json.load(open(f"{SRC}/signals.json"))
signals = signals["signals"] if isinstance(signals, dict) else signals


def d(hook, caption, tags, time):
    return {"hook": hook, "caption": caption, "hashtags": tags, "post_time": time}


M = [
  {"id": "m1", "title": "Captain Clutch in triple overtime", "category": "Stars", "buzz": 97, "clip_id": "cfqKuORvsrw",
   "signal_ids": ["s01", "s03", "s07"], "players": ["Marie-Philip Poulin"], "comments_read": 2140,
   "keywords": ["poulin", "mpp", "pou", "captain clutch", "clutch", "overtime", "ot", "triple overtime", "montreal", "victoire", "goal", "winner", "walter cup"],
   "why_this_clip": "Fans on r/PWHL keep calling for overtimes and for Poulin to lift the Cup. This is the most-shared Poulin clip: a triple-overtime goal.",
   "facts": [{"text": "Poulin holds the Olympic women's goals record (20)", "source": "2026 Olympics"},
             {"text": "Montréal won the 2026 Walter Cup; Poulin was playoff MVP", "source": "PWHL"}],
   "drafts": {
     "tiktok": [d("TRIPLE OVERTIME.", "Everyone else was tired. Captain Clutch was just getting started. Marie-Philip Poulin ends it in triple OT 🔥", ["#PWHL", "#WomensHockey", "#CaptainClutch", "#Victoire"], "Tonight, 8:00 PM ET"),
                d("Why they call her Captain Clutch", "Three overtimes. One Poulin. Any questions? Drop your favourite MPP moment below 👇", ["#PWHL", "#Poulin", "#Overtime", "#WomensHockey"], "Tomorrow, 12:30 PM ET")],
     "reels": [d("Captain Clutch, again.", "Hours of hockey, one moment everyone will remember. Marie-Philip Poulin wins it in triple overtime. Tag someone who stayed up for this one.", ["#PWHL", "#Victoire", "#CaptainClutch"], "Tonight, 9:00 PM ET"),
               d("Worth every minute", "Triple overtime. Marie-Philip Poulin. That's the post 💜", ["#PWHL", "#WomensHockey", "#MontrealVictoire"], "Fri, 6:00 PM ET")],
     "shorts": [d("Poulin wins it in triple OT", "Marie-Philip Poulin scores in triple overtime for the Montréal Victoire | PWHL Highlights", ["#PWHL", "#Poulin", "#Hockey", "#Shorts"], "Tonight, 7:45 PM ET"),
                d("Captain Clutch strikes again", "Captain Clutch: Marie-Philip Poulin's triple-overtime goal | PWHL", ["#PWHL", "#Victoire", "#Shorts"], "Sat, 11:00 AM ET")]}},
  {"id": "m2", "title": "Fillier's overtime hat trick", "category": "Big Moments", "buzz": 91, "clip_id": "QeWY_D5yyRM",
   "signal_ids": ["s07", "s17", "s21"], "players": ["Sarah Fillier"], "comments_read": 1620,
   "keywords": ["fillier", "sarah fillier", "hat trick", "hattrick", "overtime", "ot", "sirens", "new york", "goal", "winner"],
   "why_this_clip": "Overtime is what fans ask for most in playoff threads, and a hat trick finished in OT is the most replayed goal type this week.",
   "facts": [{"text": "Clip: OT-winning hat trick goal from Sarah Fillier", "source": "Clip title"},
             {"text": "Sarah Fillier plays for New York in 2026–27", "source": "PWHL roster"}],
   "drafts": {
     "tiktok": [d("Hat trick. In overtime.", "Sarah Fillier said one goal wasn't enough 🎩 Overtime winner to finish the hat trick.", ["#PWHL", "#Sirens", "#HatTrick", "#WomensHockey"], "Tonight, 7:30 PM ET"),
                d("Hats on the ice?", "Overtime hat trick from Sarah Fillier. Rate this finish 1–10 👇", ["#PWHL", "#Fillier", "#Overtime"], "Thu, 12:00 PM ET")],
     "reels": [d("Some nights are just yours.", "Sarah Fillier completes the hat trick with the overtime winner. New York, this one's for you.", ["#PWHL", "#NewYorkSirens", "#WomensHockey"], "Tonight, 8:30 PM ET"),
               d("Three for Fillier", "Goal. Goal. Overtime winner. Sarah Fillier, take a bow.", ["#PWHL", "#Sirens", "#HatTrick"], "Sun, 5:00 PM ET")],
     "shorts": [d("Fillier's OT hat trick", "Sarah Fillier's overtime winner completes the hat trick | PWHL New York Sirens", ["#PWHL", "#Fillier", "#Shorts"], "Tonight, 7:00 PM ET"),
                d("OT hat trick!", "OT-winning hat trick: Sarah Fillier | PWHL Highlights", ["#PWHL", "#Hockey", "#Shorts"], "Wed, 1:00 PM ET")]}},
  {"id": "m3", "title": "Knight & Carpenter: 2 goals in 22 seconds", "category": "Stars", "buzz": 88, "clip_id": "m4b3GCOjKis",
   "signal_ids": ["s03", "s16"], "players": ["Hilary Knight", "Alex Carpenter"], "comments_read": 1380,
   "keywords": ["knight", "hilary knight", "captain america", "carpenter", "alex carpenter", "seattle", "torrent", "22 seconds", "two goals", "goal", "detroit"],
   "why_this_clip": "Fans still call Knight \"Captain America\" after the Olympics. Two goals in 22 seconds is the fastest-rising clip with her name on it.",
   "facts": [{"text": "Knight holds US Olympic records: 15 goals, 33 points", "source": "2026 Olympics"},
             {"text": "Knight plays for PWHL Detroit in 2026–27", "source": "PWHL"}],
   "drafts": {
     "tiktok": [d("2 goals. 22 seconds.", "Blink and you missed it 😱 Hilary Knight and Alex Carpenter strike twice in 22 seconds.", ["#PWHL", "#HilaryKnight", "#WomensHockey"], "Tonight, 8:15 PM ET"),
                d("Wait for the second one", "Knight, then Carpenter. 22 seconds apart. Which goal was better? 👇", ["#PWHL", "#Knight", "#Carpenter"], "Fri, 12:00 PM ET")],
     "reels": [d("22 seconds of chaos", "Hilary Knight and Alex Carpenter needed just 22 seconds to flip the game.", ["#PWHL", "#WomensHockey", "#HilaryKnight"], "Tonight, 9:00 PM ET"),
               d("Clutch, twice", "Two goals, 22 seconds, one unforgettable shift.", ["#PWHL", "#Hockey"], "Sat, 4:00 PM ET")],
     "shorts": [d("2 goals in 22 seconds", "Hilary Knight and Alex Carpenter score 2 goals in 22 seconds | PWHL", ["#PWHL", "#HilaryKnight", "#Shorts"], "Tonight, 7:30 PM ET"),
                d("Knight + Carpenter", "22 seconds, 2 goals: Knight and Carpenter | PWHL Highlights", ["#PWHL", "#Shorts"], "Mon, 12:00 PM ET")]}},
  {"id": "m4", "title": "The brick wall of Boston", "category": "Stars", "buzz": 84, "clip_id": "wVPW4t-9tfc",
   "signal_ids": ["s02"], "players": ["Aerin Frankel"], "comments_read": 940,
   "keywords": ["frankel", "aerin frankel", "goalie", "save", "saves", "shutout", "brick wall", "boston", "fleet", "mvp"],
   "why_this_clip": "Goalie content is under-posted but highly shared. Fans single out Frankel as the reason Boston is hard to beat.",
   "facts": [{"text": "Frankel is the first goalie to win PWHL MVP", "source": "PWHL awards"},
             {"text": "Frankel set a record with 8 shutouts", "source": "PWHL awards"}],
   "drafts": {
     "tiktok": [d("Nothing gets past her", "The brick wall of Boston is back 🧱 Aerin Frankel with the shutout.", ["#PWHL", "#BostonFleet", "#Goalie", "#WomensHockey"], "Tonight, 7:45 PM ET"),
                d("Shooters, good luck", "Aerin Frankel said: not tonight. Shutout secured. Best save in the comments 👇", ["#PWHL", "#Frankel", "#Shutout"], "Thu, 5:00 PM ET")],
     "reels": [d("The brick wall is back", "Another shutout for Aerin Frankel. Boston, your goalie is in her era.", ["#PWHL", "#BostonFleet", "#WomensHockey"], "Tonight, 8:30 PM ET"),
               d("Zero goals allowed", "Every shot. Every save. Aerin Frankel, shutout.", ["#PWHL", "#Goalie"], "Sun, 12:00 PM ET")],
     "shorts": [d("Frankel shutout", "Aerin Frankel shutout: the brick wall of Boston | PWHL Boston Fleet", ["#PWHL", "#Frankel", "#Shorts"], "Tonight, 7:15 PM ET"),
                d("Best goalie in the PWHL?", "Aerin Frankel, first goalie to win PWHL MVP, with another shutout | PWHL", ["#PWHL", "#Goalie", "#Shorts"], "Tue, 12:00 PM ET")]}},
  {"id": "m5", "title": "Everyone watches women's hockey", "category": "Fan Culture", "buzz": 93, "clip_id": "wBTv7IeTzxQ",
   "signal_ids": ["s34", "s35", "s32"], "players": [], "comments_read": 2410,
   "keywords": ["fans", "everyone", "community", "inclusive", "family", "daughter", "kids", "watch", "belong", "queer", "crowd", "women's hockey"],
   "why_this_clip": "The most-upvoted fan comments aren't about stats; they're about belonging. This clip says it in five words.",
   "facts": [{"text": "Every PWHL game streams free on YouTube outside Canada", "source": "PWHL"},
             {"text": "#1 Instagram engagement rate (9.4%) of 13 major leagues", "source": "PWHL deck"}],
   "drafts": {
     "tiktok": [d("Everyone. Watches.", "Everyone. Watches. Women's. Hockey. 😤 Tell us who you're watching with.", ["#PWHL", "#WomensHockey", "#EveryoneWatches"], "Tonight, 8:00 PM ET"),
                d("Who's in your watch crew?", "Families, friends, first-timers. Everyone watches women's hockey. Tag your watch crew 👇", ["#PWHL", "#WomensHockey"], "Sat, 1:00 PM ET")],
     "reels": [d("This is who watches", "Every game streams free on YouTube (outside Canada). Bring someone new this week 💜", ["#PWHL", "#WomensHockey", "#Community"], "Tonight, 8:45 PM ET"),
               d("Made for everyone", "Everyone watches women's hockey, and everyone belongs here.", ["#PWHL", "#HockeyIsForEveryone"], "Sun, 11:00 AM ET")],
     "shorts": [d("Everyone watches women's hockey", "Everyone watches women's hockey | PWHL fans", ["#PWHL", "#WomensHockey", "#Shorts"], "Tonight, 7:00 PM ET"),
                d("The PWHL crowd", "Why fans say the PWHL feels different | PWHL", ["#PWHL", "#Shorts"], "Wed, 5:00 PM ET")]}},
  {"id": "m6", "title": "A record-breaking crowd", "category": "Big Moments", "buzz": 86, "clip_id": "QB9Nc9I-o64",
   "signal_ids": ["s20", "s19", "s10"], "players": [], "comments_read": 1190,
   "keywords": ["record", "crowd", "attendance", "history", "sold out", "arena", "fans", "first game", "takeover"],
   "why_this_clip": "First-game stories are the most common fan posts from new markets. A record crowd turns that feeling into a shareable moment.",
   "facts": [{"text": "1.1M+ fans at 2025–26 regular-season games (9,304 per game)", "source": "PWHL"},
             {"text": "Clip: record-breaking crowd for U.S. women's hockey", "source": "Clip title"}],
   "drafts": {
     "tiktok": [d("HISTORY MADE", "A record-breaking crowd for women's hockey 🎊 Were you there?", ["#PWHL", "#WomensHockey", "#HistoryMade"], "Tonight, 7:30 PM ET"),
                d("POV: you were there", "The noise. The signs. The record. Drop a 🙋 if you were in the building.", ["#PWHL", "#RecordCrowd"], "Fri, 6:00 PM ET")],
     "reels": [d("Look at this crowd", "A record-breaking crowd for women's hockey. This is what a movement sounds like.", ["#PWHL", "#WomensHockey"], "Tonight, 8:30 PM ET"),
               d("History, live", "We'll never forget this crowd. Thank you for showing up 💜", ["#PWHL", "#Fans"], "Sat, 10:00 AM ET")],
     "shorts": [d("Record crowd for women's hockey", "Record-breaking crowd for U.S. women's hockey | PWHL", ["#PWHL", "#Hockey", "#Shorts"], "Tonight, 7:00 PM ET"),
                d("History made", "History made: a record women's hockey crowd | PWHL", ["#PWHL", "#Shorts"], "Mon, 5:00 PM ET")]}},
  {"id": "m7", "title": "KK Harvey goes first overall", "category": "Stars", "buzz": 82, "clip_id": "nDMt0-pfv9o",
   "signal_ids": ["s04", "s16"], "players": ["Caroline Harvey"], "comments_read": 870,
   "keywords": ["harvey", "kk harvey", "caroline harvey", "draft", "first overall", "number one", "#1 pick", "rookie", "vancouver", "goldeneyes", "olympic mvp"],
   "why_this_clip": "Fans who found the league at the Olympics are tracking the new rookies. Harvey's draft moment connects the two.",
   "facts": [{"text": "Caroline Harvey was 2026 Olympic MVP", "source": "2026 Olympics"},
             {"text": "2026 #1 draft pick, Vancouver", "source": "PWHL draft"}],
   "drafts": {
     "tiktok": [d("Your #1 pick: KK Harvey", "Olympic MVP to first overall pick. Welcome to the PWHL, KK Harvey 🗣️", ["#PWHL", "#PWHLDraft", "#Goldeneyes"], "Tonight, 8:00 PM ET"),
                d("Remember this moment", "Caroline Harvey, 2026 #1 pick. Vancouver, what's her first goal celly going to be? 👇", ["#PWHL", "#KKHarvey"], "Thu, 12:30 PM ET")],
     "reels": [d("First overall.", "From Olympic MVP to the first name called. Caroline Harvey is a Goldeneye.", ["#PWHL", "#VancouverGoldeneyes", "#PWHLDraft"], "Tonight, 9:00 PM ET"),
               d("Welcome to Vancouver", "Vancouver, meet your newest star: KK Harvey 💜", ["#PWHL", "#Goldeneyes"], "Sat, 12:00 PM ET")],
     "shorts": [d("KK Harvey #1 pick", "Caroline Harvey goes first overall in the 2026 PWHL Draft | Vancouver Goldeneyes", ["#PWHL", "#PWHLDraft", "#Shorts"], "Tonight, 7:30 PM ET"),
                d("The 2026 #1 pick", "Your 2026 first overall pick: KK Harvey | PWHL", ["#PWHL", "#Shorts"], "Tue, 5:00 PM ET")]}},
  {"id": "m8", "title": "Motor City, stand up", "category": "Fan Culture", "buzz": 79, "clip_id": "Vik-xAEjmA4",
   "signal_ids": ["s31", "s27", "s28"], "players": [], "comments_read": 760,
   "keywords": ["detroit", "motor city", "expansion", "new team", "michigan", "hamilton", "las vegas", "san jose", "rivalry", "season tickets"],
   "why_this_clip": "Expansion threads are the fastest-growing topic. Detroit fans are already posting about local buzz.",
   "facts": [{"text": "Detroit is one of four expansion teams for 2026–27", "source": "PWHL"},
             {"text": "Hilary Knight signed with Detroit through 2028–29", "source": "PWHL"}],
   "drafts": {
     "tiktok": [d("MOTOR CITY, STAND UP", "Detroit, you have a PWHL team 🗣️ Who's getting season tickets?", ["#PWHL", "#PWHLDetroit", "#MotorCity"], "Tonight, 7:00 PM ET"),
                d("Name the team", "PWHL Detroit is coming. Drop what you want the team to be called 👇", ["#PWHL", "#Detroit", "#Expansion"], "Fri, 12:00 PM ET")],
     "reels": [d("Detroit hockey just got bigger", "A new team, a new home crowd. Detroit, the PWHL is coming to you.", ["#PWHL", "#PWHLDetroit"], "Tonight, 8:00 PM ET"),
               d("Hockeytown, meet the PWHL", "Motor City, it's your turn. See you at the rink 💜", ["#PWHL", "#Detroit"], "Sun, 3:00 PM ET")],
     "shorts": [d("PWHL Detroit is here", "Motor City, stand up: PWHL Detroit | 2026–27 expansion", ["#PWHL", "#Detroit", "#Shorts"], "Tonight, 6:30 PM ET"),
                d("Detroit expansion", "PWHL Detroit: what fans are saying | PWHL", ["#PWHL", "#Shorts"], "Wed, 12:00 PM ET")]}},
  {"id": "m9", "title": "Behind the scenes with Emma Maltais", "category": "Fan Culture", "buzz": 76, "clip_id": "J0PPKzNYQas",
   "signal_ids": ["s18", "s23"], "players": ["Emma Maltais"], "comments_read": 640,
   "keywords": ["maltais", "emma maltais", "tiktok", "behind the scenes", "bts", "vlog", "players", "personality", "content"],
   "why_this_clip": "Fans say they fell for players through TikTok and want more behind-the-scenes content. This clip is exactly that.",
   "facts": [{"text": "Emma Maltais plays for Montréal in 2026–27", "source": "PWHL roster"},
             {"text": "Clip: behind the scenes with Emma Maltais", "source": "Clip title"}],
   "drafts": {
     "tiktok": [d("POV: behind the scenes", "Behind the scenes with Emma Maltais, TikTok style 😎 What should she film next?", ["#PWHL", "#EmmaMaltais", "#BTS"], "Tonight, 9:00 PM ET"),
                d("Emma has the camera", "We handed Emma Maltais the camera. No regrets. 👇 Who should go next?", ["#PWHL", "#Maltais"], "Sat, 2:00 PM ET")],
     "reels": [d("A day with Emma Maltais", "Behind the scenes with Emma Maltais. More of this? Say less.", ["#PWHL", "#WomensHockey", "#BehindTheScenes"], "Tonight, 8:30 PM ET"),
               d("Off the ice", "The players you love, off the ice. Starring Emma Maltais 💜", ["#PWHL", "#Victoire"], "Sun, 12:00 PM ET")],
     "shorts": [d("Emma Maltais BTS", "Behind the scenes with Emma Maltais | PWHL", ["#PWHL", "#Maltais", "#Shorts"], "Tonight, 7:00 PM ET"),
                d("Behind the scenes", "Behind the scenes of Play It Big with Emma Maltais | PWHL", ["#PWHL", "#Shorts"], "Thu, 6:00 PM ET")]}},
]

clip_ids = {c["id"] for c in clips}
sig_ids = {s["id"] for s in signals}
for m in M:
    assert m["clip_id"] in clip_ids, m["id"]
    for s in m["signal_ids"]:
        assert s in sig_ids, (m["id"], s)

out = os.path.join(HERE, "..", "data", "data.js")
with open(out, "w") as f:
    f.write("window.CM_DATA = " + json.dumps({"clips": clips, "signals": signals, "moments": M}, ensure_ascii=False) + ";\n")
print("wrote", os.path.abspath(out), len(M), "moments")
