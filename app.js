(function () {
  "use strict";
  var D = window.CM_DATA || { clips: [], signals: [], moments: [] };
  var clipById = {}, sigById = {};
  D.clips.forEach(function (c) { clipById[c.id] = c; });
  D.signals.forEach(function (s) { sigById[s.id] = s; });
  var moments = D.moments.slice().sort(function (a, b) { return b.buzz - a.buzz; });
  var momentById = {};
  moments.forEach(function (m, i) { m.rank = i + 1; momentById[m.id] = m; });

  var PLATFORMS = [["tiktok", "TikTok"], ["reels", "Reels"], ["shorts", "Shorts"]];
  var state = { filter: "All", current: null, generated: {}, platform: "tiktok", variant: { tiktok: 0, reels: 0, shorts: 0 },
    approved: {}, approvedCount: 0, running: false, runToken: 0, expanded: {} };

  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  var saved = parseInt(store.get("cm_approved") || "0", 10);
  state.approvedCount = isNaN(saved) ? 0 : saved;

  var view = document.getElementById("view");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(n) { return Number(n).toLocaleString("en-US"); }
  function thumbSrc(clipId) { var c = clipById[clipId]; return c ? c.thumb_path : ""; }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function srcLine(s) {
    return '<div class="src">r/' + esc(String(s.subreddit).replace(/^r\//, "")) + ' · ▲' + fmt(s.score) +
      ' · <a href="' + esc(s.url) + '" target="_blank" rel="noopener">view comment</a></div>';
  }

  // ---------- routing ----------
  function go(hash) { if (location.hash !== hash) location.hash = hash; else render(); }
  function parse() {
    var h = (location.hash || "#trending").slice(1).split("/");
    var tab = ["trending", "studio", "impact"].indexOf(h[0]) >= 0 ? h[0] : "trending";
    return { tab: tab, id: h[1] || null };
  }
  function setTabs(tab) {
    document.querySelectorAll(".tab").forEach(function (b) {
      if (b.getAttribute("data-tab") === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }
  function render() {
    var r = parse();
    setTabs(r.tab);
    if (r.tab !== "studio") { state.runToken++; state.running = false; }
    if (r.tab === "trending") renderTrending();
    else if (r.tab === "studio") {
      var m = r.id ? momentById[r.id] : null;
      if (m && (!state.current || state.current.id !== m.id)) {
        state.current = m; state.platform = "tiktok"; state.variant = { tiktok: 0, reels: 0, shorts: 0 };
      }
      if (!m) state.current = null;
      renderStudio();
    } else renderImpact();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);
  document.querySelectorAll(".tab").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-tab");
      go(t === "studio" && state.current ? "#studio/" + state.current.id : "#" + t);
    });
  });

  // ---------- trending ----------
  function matchMoment(text) {
    var q = " " + text.toLowerCase().replace(/[^a-z0-9#' ]+/g, " ").replace(/\s+/g, " ") + " ";
    var best = null, bestScore = 0;
    moments.forEach(function (m) {
      var score = 0;
      m.keywords.concat(m.players.map(function (p) { return p.toLowerCase(); })).forEach(function (k) {
        if (q.indexOf(" " + k + " ") >= 0) score += k.indexOf(" ") > 0 ? 3 : 2;
        else if (k.length > 3 && q.indexOf(k) >= 0) score += 1;
      });
      m.title.toLowerCase().split(/\W+/).forEach(function (w) { if (w.length > 3 && q.indexOf(" " + w + " ") >= 0) score += 1; });
      if (score > bestScore || (score === bestScore && best && score > 0 && m.buzz > best.buzz)) { best = m; bestScore = score; }
    });
    return bestScore > 0 ? { m: best, exact: true } : { m: moments[0], exact: false };
  }

  function momentCard(m) {
    var sigs = m.signal_ids.map(function (id) { return sigById[id]; }).filter(Boolean);
    var top = sigs.slice().sort(function (a, b) { return b.score - a.score; })[0];
    var open = !!state.expanded[m.id];
    var html = '<article class="card moment">' +
      '<div class="thumb"><img loading="lazy" src="' + esc(thumbSrc(m.clip_id)) + '" alt="Clip thumbnail: ' + esc(m.title) + '"><span class="rank">#' + m.rank + '</span></div>' +
      '<div class="m-body">' +
        '<div class="m-top"><span class="cat">' + esc(m.category) + '</span></div>' +
        '<h3>' + esc(m.title) + '</h3>' +
        '<div class="buzz"><span>Buzz</span><span class="meter"><i style="width:' + m.buzz + '%"></i></span><b>' + m.buzz + '</b></div>' +
        (top ? '<p class="quote">“' + esc(top.quote) + '”</p>' + srcLine(top) : "") +
        (m.players.length ? '<div class="tags">' + m.players.map(function (p) { return '<span class="tag">' + esc(p) + '</span>'; }).join("") + '</div>' : "") +
        (sigs.length > 1 ? '<button class="more" data-more="' + m.id + '" aria-expanded="' + open + '">' + (open ? "Hide fan comments" : "See all " + sigs.length + " fan comments") + '</button>' : "") +
        (open ? '<div class="quotes">' + sigs.map(function (s) { return '<div><p class="quote">“' + esc(s.quote) + '”</p>' + srcLine(s) + '</div>'; }).join("") + '</div>' : "") +
        '<div class="m-actions"><button class="btn primary" data-gen="' + m.id + '">Generate drafts <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>' +
      '</div></article>';
    return html;
  }

  function renderTrending() {
    var cats = ["All", "Stars", "Big Moments", "Fan Culture"];
    var list = moments.filter(function (m) { return state.filter === "All" || m.category === state.filter; });
    view.innerHTML =
      '<section class="section">' +
        '<div><p class="kicker">Step 1 · Listen &amp; rank</p><h2>What fans are talking about</h2>' +
        '<p class="sub">The machine reads fan posts, ranks the moments and players they love most, and picks clips worth posting.</p></div>' +
        '<div class="status"><span class="dot" aria-hidden="true"></span><span>5,000 fan posts scanned today · Reddit · YouTube <span class="note">(demo)</span></span></div>' +
        '<form class="card paste" id="paste" autocomplete="off">' +
          '<label for="paste-in">Paste a fan post or type a topic</label>' +
          '<div class="paste-row"><input id="paste-in" maxlength="500" placeholder="e.g. Poulin in overtime was unreal"><button class="btn primary" type="submit">Find the moment</button></div>' +
          '<div class="hint" id="paste-hint" aria-live="polite"></div>' +
        '</form>' +
        '<div class="chips" role="group" aria-label="Filter moments">' +
          cats.map(function (c) { return '<button class="chip" data-filter="' + c + '" aria-pressed="' + (state.filter === c) + '">' + c + '</button>'; }).join("") +
        '</div>' +
        '<div class="list">' + list.map(momentCard).join("") + '</div>' +
      '</section>';

    view.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); renderTrending(); });
    });
    view.querySelectorAll("[data-more]").forEach(function (b) {
      b.addEventListener("click", function () { var id = b.getAttribute("data-more"); state.expanded[id] = !state.expanded[id]; renderTrending(); });
    });
    view.querySelectorAll("[data-gen]").forEach(function (b) {
      b.addEventListener("click", function () { startFor(b.getAttribute("data-gen")); });
    });
    document.getElementById("paste").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = document.getElementById("paste-in").value.trim();
      var hint = document.getElementById("paste-hint");
      if (!v) { hint.textContent = "Type a player, team or moment first. Try \"Frankel save\" or \"Detroit\"."; return; }
      var r = matchMoment(v);
      state.pendingNote = r.exact ? "Matched your post to: " + r.m.title : "No exact match. Closest trending moment: " + r.m.title;
      startFor(r.m.id);
    });
  }

  function startFor(id) {
    var m = momentById[id]; if (!m) return;
    state.current = m; state.platform = "tiktok"; state.variant = { tiktok: 0, reels: 0, shorts: 0 };
    state.autoRun = true;
    go("#studio/" + id);
  }

  // ---------- studio ----------
  var STEPS = [
    ["Reading fan comments", function (m) { return fmt(m.comments_read) + " comments"; }],
    ["Picking the most-shared clip", function (m) { var c = clipById[m.clip_id]; return c ? c.title : ""; }],
    ["Writing in the PWHL voice", function () { return "3 platforms × 2 versions"; }],
    ["Checking hockey facts", function (m) { return m.facts.length + " facts checked"; }]
  ];

  function renderStudio() {
    var m = state.current;
    if (!m) {
      view.innerHTML = '<section class="section"><div><p class="kicker">Step 2 · Draft</p><h2>Pick a moment to start</h2>' +
        '<p class="sub">Choose one of today\'s top moments and the machine will draft posts for TikTok, Reels and Shorts.</p></div>' +
        '<div class="list">' + moments.slice(0, 3).map(momentCard).join("") + '</div></section>';
      view.querySelectorAll("[data-gen]").forEach(function (b) { b.addEventListener("click", function () { startFor(b.getAttribute("data-gen")); }); });
      view.querySelectorAll("[data-more]").forEach(function (b) { b.addEventListener("click", function () { var id = b.getAttribute("data-more"); state.expanded[id] = !state.expanded[id]; renderStudio(); }); });
      return;
    }
    var done = !!state.generated[m.id];
    var note = state.pendingNote; state.pendingNote = null;
    view.innerHTML =
      '<section class="section">' +
        '<div><p class="kicker">Step 2 · Draft</p><h2>' + esc(m.title) + '</h2>' +
        '<p class="sub">' + (m.players.length ? esc(m.players.join(" · ")) + " · " : "") + 'Buzz ' + m.buzz + '/100</p>' +
        (note ? '<p class="hint" style="margin-top:8px">' + esc(note) + '</p>' : "") + '</div>' +
        '<div id="studio-body"></div>' +
      '</section>';
    if (done) { renderResult(); return; }
    var body = document.getElementById("studio-body");
    body.innerHTML = '<div class="card" style="display:grid;gap:14px">' +
      '<div class="pipeline" id="pipe" aria-live="polite">' + STEPS.map(function (s, i) {
        return '<div class="step" id="st' + i + '"><span class="ic">' + (i + 1) + '</span><div>' + s[0] + '<small id="sd' + i + '">&nbsp;</small></div></div>';
      }).join("") + '</div>' +
      '<button class="btn primary big" id="gen">Generate drafts</button></div>';
    document.getElementById("gen").addEventListener("click", runPipeline);
    if (state.autoRun) { state.autoRun = false; runPipeline(); }
  }

  function runPipeline() {
    if (state.running) return;
    var m = state.current; if (!m) return;
    state.running = true;
    var token = ++state.runToken;
    var btn = document.getElementById("gen");
    if (btn) { btn.disabled = true; btn.textContent = "Generating…"; }
    var dur = reduced ? 250 : 1150;
    var i = 0;
    function alive() { return token === state.runToken && document.getElementById("pipe"); }
    function stepNext() {
      if (!alive()) return;
      if (i > 0) { var prev = document.getElementById("st" + (i - 1)); prev.className = "step done"; prev.querySelector(".ic").textContent = "✓"; }
      if (i >= STEPS.length) {
        state.running = false; state.generated[m.id] = true;
        setTimeout(function () { if (token === state.runToken) renderResult(); }, reduced ? 50 : 350);
        return;
      }
      var el = document.getElementById("st" + i); el.className = "step active";
      var detail = document.getElementById("sd" + i);
      if (i === 0 && !reduced) {
        var target = m.comments_read, t0 = null;
        var tick = function (ts) {
          if (!alive()) return;
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / (dur - 100));
          detail.textContent = fmt(Math.round(target * p)) + " comments";
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } else detail.textContent = STEPS[i][1](m);
      i++;
      setTimeout(stepNext, dur);
    }
    stepNext();
  }

  var embedTimer = null;
  function phoneHTML(m, p, d) {
    var names = { tiktok: "TikTok", reels: "Reels", shorts: "Shorts" };
    var bars = { tiktok: '<span>Following</span><b>For You</b>', reels: '<b>Reels</b>', shorts: '<b>Shorts</b>' };
    var heart = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.4 4.5 6.3 4.5c2.1 0 3.9 1.2 4.7 2.9.8-1.7 2.6-2.9 4.7-2.9 3.9 0 5.9 4 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';
    var chat = '<svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H9l-5 4v-4a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>';
    var share = '<svg viewBox="0 0 24 24"><path d="M14 4l8 8-8 8v-5c-6 0-9.5 1.8-12 6 1-7 4.5-11 12-12V4z"/></svg>';
    return '<div class="phone ' + p + '">' +
      '<div class="media" id="media"><img src="' + esc(thumbSrc(m.clip_id)) + '" alt="Preview frame: ' + esc(m.title) + '"></div>' +
      '<div class="shade"></div>' +
      '<div class="pbar">' + bars[p] + '</div>' +
      '<span class="platform">' + names[p] + ' draft</span>' +
      '<div class="hook"><span>' + esc(d.hook) + '</span></div>' +
      '<div class="rail"><div>' + heart + '<div>24.1K</div></div><div>' + chat + '<div>812</div></div><div>' + share + '<div>Share</div></div></div>' +
      '<div class="meta"><div class="h">@yourteam</div><div id="pcap">' + esc(d.caption) + '</div><div class="t">' + esc(d.hashtags.join(" ")) + '</div></div>' +
      '<span class="offline" id="offline" hidden>Video preview offline</span>' +
    '</div>';
  }

  function mountVideo(m) {
    clearTimeout(embedTimer);
    var media = document.getElementById("media"); if (!media) return;
    var off = document.getElementById("offline");
    if (navigator.onLine === false) { if (off) off.hidden = false; return; }
    var id = m.clip_id;
    var src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) +
      "?autoplay=1&mute=1&loop=1&playlist=" + encodeURIComponent(id) + "&playsinline=1&controls=0&rel=0&modestbranding=1";
    var f = document.createElement("iframe");
    f.title = "Clip: " + m.title; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.loading = "eager";
    f.style.opacity = "0";
    var loaded = false;
    f.addEventListener("load", function () { loaded = true; f.style.opacity = "1"; });
    embedTimer = setTimeout(function () { if (!loaded && f.parentNode) { f.remove(); if (off) off.hidden = false; } }, 7000);
    f.src = src;
    media.appendChild(f);
  }

  function renderResult() {
    var m = state.current; var body = document.getElementById("studio-body"); if (!m || !body) return;
    var p = state.platform, list = m.drafts[p], v = state.variant[p] % list.length, d = list[v];
    var key = m.id + ":" + p + ":" + v;
    var sigs = m.signal_ids.map(function (id) { return sigById[id]; }).filter(Boolean);
    body.innerHTML =
      '<div class="studio has-result">' +
        '<div style="display:grid;gap:12px">' +
          '<div class="seg" role="group" aria-label="Platform">' + PLATFORMS.map(function (x) {
            return '<button data-plat="' + x[0] + '" aria-pressed="' + (p === x[0]) + '">' + x[1] + '</button>'; }).join("") + '</div>' +
          phoneHTML(m, p, d) +
        '</div>' +
        '<div class="draft">' +
          '<div class="card field"><label for="cap">Caption · version ' + (v + 1) + ' of ' + list.length + '</label>' +
            '<textarea id="cap" maxlength="600">' + esc(d.caption) + '</textarea>' +
            '<div class="tags" style="margin-top:10px">' + d.hashtags.map(function (h) { return '<span class="tag">' + esc(h) + '</span>'; }).join("") + '</div>' +
            '<p class="note" style="margin:10px 0 0">Suggested post time: <b style="color:#fff">' + esc(d.post_time) + '</b></p></div>' +
          '<div class="row">' +
            '<button class="btn" id="regen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 11-2.3-5.7M20 4v5h-5"/></svg>Regenerate</button>' +
            (state.approved[key] ? '<span class="approved">✓ Approved — queued for your team</span>'
              : '<button class="btn primary" id="approve"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>Approve</button>') +
            '<button class="btn" id="next">Next moment →</button>' +
          '</div>' +
          '<div class="card why"><label class="kicker" style="margin:0">Why this clip</label><p style="margin:0">' + esc(m.why_this_clip) + '</p>' +
            sigs.map(function (s) { return '<div><p class="quote">“' + esc(s.quote) + '”</p>' + srcLine(s) + '</div>'; }).join("") + '</div>' +
          '<div class="card facts"><label class="kicker" style="margin:0">Facts checked</label>' +
            m.facts.map(function (f) { return '<div class="fact"><span class="ok" aria-hidden="true">✓</span><div>' + esc(f.text) + ' <small>· ' + esc(f.source) + '</small></div></div>'; }).join("") + '</div>' +
          '<p class="note">Demo: drafts are pre-written and clips are real PWHL videos. In production, the model writes these and a person approves every post.</p>' +
        '</div>' +
      '</div>';

    mountVideo(m);
    body.querySelectorAll("[data-plat]").forEach(function (b) {
      b.addEventListener("click", function () { state.platform = b.getAttribute("data-plat"); renderResult(); });
    });
    var cap = document.getElementById("cap");
    cap.addEventListener("input", function () { var pc = document.getElementById("pcap"); if (pc) pc.textContent = cap.value; });
    document.getElementById("regen").addEventListener("click", function () {
      state.variant[p] = (state.variant[p] + 1) % list.length;
      renderResult();
      var c = document.getElementById("cap"); if (c) c.classList.add("shimmer");
    });
    var ap = document.getElementById("approve");
    if (ap) ap.addEventListener("click", function () {
      if (state.approved[key]) return;
      state.approved[key] = true; state.approvedCount++;
      store.set("cm_approved", String(state.approvedCount));
      toast("Approved — queued for your team ✓");
      renderResult();
    });
    document.getElementById("next").addEventListener("click", function () {
      var i = moments.indexOf(m); startFor(moments[(i + 1) % moments.length].id);
    });
  }

  // ---------- impact ----------
  function renderImpact() {
    var counts = {};
    D.signals.forEach(function (s) { (s.players || []).forEach(function (p) { counts[p] = (counts[p] || 0) + 1; }); });
    var top = Object.keys(counts).map(function (k) { return [k, counts[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var max = top.length ? top[0][1] : 1;
    view.innerHTML =
      '<section class="section">' +
        '<div><p class="kicker">Step 3 · Impact</p><h2>A studio\'s output for under one salary</h2>' +
        '<p class="sub">The machine adds capacity to the existing content team. It doesn\'t replace anyone.</p></div>' +
        '<div class="kpis">' +
          kpi("280", "AI drafts per week for staff to review") +
          kpi("~90 hrs", "saved per week (280 drafts × ~20 min)") +
          kpi("≈86%", "lower cost than one content hire") +
          kpi(String(state.approvedCount), "drafts you approved in this demo") +
        '</div>' +
        '<div class="grid2">' +
          '<div class="card"><h3>Annual cost</h3><div class="bars" style="margin-top:14px">' +
            bar("One content hire (fully loaded)", "≈ $125K / yr", 100, "alt") +
            bar("Content Machine (AI + data + hosting)", "≈ $18K / yr", 14.4, "") +
          '</div><p class="note" style="margin:12px 0 0">Claude Opus 5 at list price plus data access and hosting.</p></div>' +
          '<div class="card"><h3>Top players by fan buzz</h3><div class="bars" style="margin-top:14px">' +
            (top.length ? top.map(function (t) { return bar(t[0], t[1] + (t[1] === 1 ? " mention" : " mentions"), 100 * t[1] / max, ""); }).join("") : '<p class="note">No player mentions yet.</p>') +
          '</div><p class="note" style="margin:12px 0 0">Counted from the r/PWHL comments in this demo.</p></div>' +
        '</div>' +
        '<div class="card"><h3>Planned platform mix</h3><div class="bars" style="margin-top:14px">' +
          bar("TikTok", "45%", 45, "") + bar("Instagram Reels", "35%", 35, "") + bar("YouTube Shorts", "20%", 20, "") +
        '</div><p class="note" style="margin:12px 0 0">Planned mix for the pilot.</p></div>' +
        '<p class="note">All figures are estimates for the pitch; see our deck appendix.</p>' +
      '</section>';
    function kpi(n, l) { return '<div class="card kpi"><div class="n">' + esc(n) + '</div><div class="l">' + esc(l) + '</div></div>'; }
    function bar(label, val, pct, cls) {
      return '<div class="bar"><div class="lab"><span>' + esc(label) + '</span><b>' + esc(val) + '</b></div>' +
        '<div class="track"><div class="fill ' + cls + '" style="width:' + Math.max(3, Math.min(100, pct)) + '%"></div></div></div>';
    }
  }

  // ---------- intro ----------
  var intro = document.getElementById("intro");
  var skip = /[?&]nointro\b/.test(location.search) || store.get("cm_intro") === "1";
  if (!skip) {
    intro.hidden = false;
    document.getElementById("intro-start").focus();
  }
  document.getElementById("intro-start").addEventListener("click", function () {
    intro.hidden = true; store.set("cm_intro", "1"); view.focus();
  });

  render();
})();
