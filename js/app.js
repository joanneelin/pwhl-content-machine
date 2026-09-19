/* Content Machine demo, a student prototype for Ideathon 2026.
   Plain JS, no build step. Reads window.CM_DATA (data/data.js), so it also
   works when opened straight from file://. Every storage call is wrapped:
   the demo must keep working with storage blocked. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const reduceMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };
  const isDesktop = () => {
    try { return window.matchMedia('(min-width: 900px)').matches; } catch (e) { return false; }
  };

  const store = {
    get(area, key, fallback) {
      try {
        const s = window[area];
        const v = s ? s.getItem(key) : null;
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(area, key, value) {
      try { window[area].setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: memory only */ }
    }
  };

  // ------------------------------------------------------------------ icons
  const STROKE = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sparkle: '<path d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
    approve: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    wifiOff: '<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.7"/><path d="M19 12.9a10 10 0 0 0-2.4-1.7"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M22 8.8A15 15 0 0 0 10.7 5"/><path d="M12 20h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  const icon = (name, cls) =>
    '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (STROKE[name] || '') + '</svg>';

  // Filled glyphs for the phone mockups (drawn to look like the real apps).
  const G = {
    heart: '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
    heartLine: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M12 20.3l-1.2-1.1C6 14.9 3 12.1 3 8.7 3 6.1 5 4 7.6 4c1.6 0 3.2.8 4.4 2.1C13.2 4.8 14.8 4 16.4 4 19 4 21 6.1 21 8.7c0 3.4-3 6.2-7.8 10.5L12 20.3z"/>',
    bubble: '<path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.6 3.4 6.1L4.6 21l4.4-2.3c1 .2 2 .3 3 .3 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/><circle cx="8" cy="11" r="1.2" fill="#161616"/><circle cx="12" cy="11" r="1.2" fill="#161616"/><circle cx="16" cy="11" r="1.2" fill="#161616"/>',
    bubbleLine: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M20.5 11.5a8.5 8.5 0 0 1-12.2 7.7L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 20.5 11.5z"/>',
    bookmark: '<path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>',
    share: '<path fill="currentColor" d="M14 5v4C7 10 4 15 3 20c2.5-3.5 6-5.1 11-5.1V19l7-7-7-7z"/>',
    plane: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M21.5 3L10 14.5M21.5 3l-7 18-4.5-6.5L3 10l18.5-7z"/>',
    dots: '<circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/>',
    dotsV: '<circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/>',
    thumbUp: '<path fill="currentColor" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>',
    thumbDown: '<path fill="currentColor" d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>',
    remix: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4"/>',
    note: '<path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>',
    home: '<path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
    homeLine: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M4 10.5L12 4l8 6.5V20h-5v-6H9v6H4z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    user: '<circle cx="12" cy="8.5" r="4" fill="currentColor"/><path fill="currentColor" d="M4 20.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z"/>',
    userLine: '<circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.9"/><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M4.5 20.5c.6-3.6 3.7-5.7 7.5-5.7s6.9 2.1 7.5 5.7"/>',
    friends: '<circle cx="9" cy="8.5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.9"/><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M3 20c.5-3.4 3-5.3 6-5.3s5.5 1.9 6 5.3M15.5 5.3a3.4 3.4 0 0 1 0 6.4M17.5 14.9c1.9.6 3.2 2.3 3.5 5.1"/>',
    inbox: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M4 5h16v11H9.5L5.5 19.5V16H4z"/>',
    camera: '<rect x="3" y="6.5" width="18" height="13.5" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M8.5 6.5L10 4h4l1.5 2.5"/><circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" stroke-width="1.9"/>',
    plusSq: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    reels: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M3.5 8.5h17M9 3.5l3 5M14.5 3.5l3 5" stroke="currentColor" stroke-width="1.7"/><path fill="currentColor" d="M10.3 11.6v5.3l4.5-2.65z"/>',
    shorts: '<path fill="currentColor" d="M17.8 9.8l-1.3-.6 1.3-.7c1.9-1 2.6-3.4 1.6-5.3-1-1.9-3.4-2.6-5.3-1.6L6.3 5.7C5 6.4 4.2 7.8 4.3 9.3c.1 1.5.9 2.8 2.3 3.4l1.3.6-1.3.7c-1.9 1-2.6 3.4-1.6 5.3 1 1.9 3.4 2.6 5.3 1.6l7.7-4.1c1.3-.7 2.1-2.1 2-3.6-.1-1.5-.9-2.8-2.2-3.4z"/><path fill="#0f0f0f" d="M10 15V9l5 3z"/>',
    subs: '<rect x="3.5" y="8" width="17" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M6 5.3h12M8 2.8h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path fill="currentColor" d="M10.3 11.3v5.4l4.5-2.7z"/>',
    chevDown: '<path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  const glyph = (name, extra) =>
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"' + (extra || '') + '>' + (G[name] || '') + '</svg>';

  const STATUSBAR =
    '<div class="statusbar" aria-hidden="true"><span>9:41</span><span class="sb-icons">' +
    '<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>' +
    '<svg viewBox="0 0 16 12"><path d="M8 11.5l2.3-2.6a3.3 3.3 0 0 0-4.6 0z" fill="#fff"/><path d="M3.6 6.9a6.2 6.2 0 0 1 8.8 0l1.5-1.6a8.4 8.4 0 0 0-11.8 0z" fill="#fff"/><path d="M1.4 4.5a9.3 9.3 0 0 1 13.2 0L16 3a11.4 11.4 0 0 0-16 0z" fill="#fff"/></svg>' +
    '<svg viewBox="0 0 27 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="2" fill="#fff"/><path d="M24.5 4v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2z" fill="#fff" fill-opacity=".5"/></svg>' +
    '</span></div><div class="island" aria-hidden="true"></div>';

  // ------------------------------------------------------------------- data
  const RAW = window.CM_DATA || {};
  const clips = Array.isArray(RAW.clips) ? RAW.clips : [];
  const signals = Array.isArray(RAW.signals) ? RAW.signals : [];
  const moments = (Array.isArray(RAW.moments) ? RAW.moments : []).filter((m) => m && m.id && m.title);
  const clipById = new Map(clips.map((c) => [c.id, c]));
  const sigById = new Map(signals.map((s) => [s.id, s]));
  const ranked = moments.slice().sort((a, b) => (Number(b.buzz) || 0) - (Number(a.buzz) || 0));
  ranked.forEach((m, i) => { m._rank = i + 1; });
  const momentById = (id) => ranked.find((m) => m.id === id) || null;

  const PLATFORMS = [
    { id: 'tiktok', label: 'TikTok' },
    { id: 'reels', label: 'Reels' },
    { id: 'shorts', label: 'Shorts' }
  ];
  const PLATFORM_LABEL = { tiktok: 'TikTok', reels: 'Instagram Reels', shorts: 'YouTube Shorts' };
  const CATS = [
    { id: 'All', label: 'All' },
    { id: 'Stars', label: 'Stars', cls: 'cat-stars' },
    { id: 'Big Moments', label: 'Big Moments', cls: 'cat-big' },
    { id: 'Fan Culture', label: 'Fan Culture', cls: 'cat-fan' }
  ];
  const catClass = (c) => (CATS.find((x) => x.id === c) || {}).cls || 'cat-big';

  const clipOf = (m) => (m && clipById.get(m.clip_id)) || null;
  const quotesOf = (m) => ((m && m.signal_ids) || []).map((id) => sigById.get(id)).filter((s) => s && s.quote);

  function draftOf(m, platform, v) {
    const list = (m.drafts && Array.isArray(m.drafts[platform]) && m.drafts[platform].length) ? m.drafts[platform] : null;
    const d = list ? list[((v % list.length) + list.length) % list.length] : null;
    return {
      hook: (d && d.hook) || m.title,
      caption: (d && d.caption) || m.title,
      hashtags: (d && Array.isArray(d.hashtags) && d.hashtags.length) ? d.hashtags : ['#PWHL', '#WomensHockey'],
      post_time: (d && d.post_time) || 'Tonight, 8:00 PM ET',
      count: list ? list.length : 1
    };
  }

  const duration = (s) => {
    s = Math.round(Number(s) || 0);
    return s > 0 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : '';
  };
  const thumbSrc = (clip, size) => (clip ? (size === 'md' ? (clip.thumb_md || clip.thumb) : (clip.thumb_sm || clip.thumb)) || clip.thumb_path || '' : '');

  // ------------------------------------------------------------------ state
  const S = {
    tab: 'trending',
    filter: store.get('sessionStorage', 'cm.filter', 'All'),
    expanded: new Set(),
    lastMomentId: store.get('sessionStorage', 'cm.last', null),
    platform: store.get('sessionStorage', 'cm.platform', 'tiktok'),
    variants: store.get('sessionStorage', 'cm.variants', {}) || {},
    approved: new Set(store.get('sessionStorage', 'cm.approved', []) || []),
    generated: new Set(store.get('sessionStorage', 'cm.generated', []) || []),
    edits: store.get('sessionStorage', 'cm.edits', {}) || {},
    match: null,
    autostart: null,
    run: null,
    frame: null
  };
  if (!CATS.some((c) => c.id === S.filter)) S.filter = 'All';
  if (!PLATFORMS.some((p) => p.id === S.platform)) S.platform = 'tiktok';
  if (typeof S.variants !== 'object' || Array.isArray(S.variants)) S.variants = {};
  if (typeof S.edits !== 'object' || Array.isArray(S.edits)) S.edits = {};

  const save = () => {
    store.set('sessionStorage', 'cm.last', S.lastMomentId);
    store.set('sessionStorage', 'cm.platform', S.platform);
    store.set('sessionStorage', 'cm.variants', S.variants);
    store.set('sessionStorage', 'cm.approved', Array.from(S.approved));
    store.set('sessionStorage', 'cm.generated', Array.from(S.generated));
    store.set('sessionStorage', 'cm.edits', S.edits);
  };
  const variantOf = (id, p) => ((S.variants[id] && Number(S.variants[id][p])) || 0);
  const draftKey = (id, p, v) => id + '/' + p + '/' + v;

  // --------------------------------------------------------------- matching
  const STOP = new Set(('a an and are as at be been but by can could did do does dont for from get got had has have he her hers his how i if im in into is it its ive just like me my no not of oh omg on or our out she so than that the their them then there they this to too up was we were what when where which who why will with wow yes you your youre lol really very again still ever even all any some much more most one'.split(' ')));
  const norm = (t) => String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2019']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const stem = (w) => (w.length > 4 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w);
  const tokens = (t) => norm(t).split(' ').filter((w) => w.length > 1 && !STOP.has(w)).map(stem);

  const INDEX = new Map();
  function indexOf(m) {
    if (INDEX.has(m.id)) return INDEX.get(m.id);
    const words = new Map();
    const phrases = new Set();
    const add = (text, weight) => {
      const toks = tokens(text);
      if (toks.length > 1) phrases.add(toks.join(' '));
      toks.forEach((t) => words.set(t, Math.max(words.get(t) || 0, weight)));
    };
    (m.keywords || []).forEach((k) => add(k, 3));
    (m.players || []).forEach((p) => add(p, 3));
    add(m.title, 2);
    add(m.category, 1);
    const clip = clipOf(m);
    if (clip) {
      (clip.players || []).forEach((p) => add(p, 2));
      (clip.teams || []).forEach((t) => add(t, 2));
      add(clip.title, 1);
    }
    const idx = { words, phrases };
    INDEX.set(m.id, idx);
    return idx;
  }

  // First names alone ("sarah", "emma") must not match a different player with the same first name.
  let FIRST_ONLY = null;
  function firstOnly() {
    if (FIRST_ONLY) return FIRST_ONLY;
    const first = new Set(), last = new Set();
    const addName = (n) => { const t = tokens(n); if (t.length > 1) { first.add(t[0]); t.slice(1).forEach((x) => last.add(x)); } };
    ranked.forEach((m) => { (m.players || []).forEach(addName); const c = clipOf(m); if (c) (c.players || []).forEach(addName); });
    FIRST_ONLY = new Set([...first].filter((f) => !last.has(f)));
    return FIRST_ONLY;
  }

  function findMoment(query) {
    const q = tokens(query).filter((t) => !firstOnly().has(t));
    const joined = ' ' + q.join(' ') + ' ';
    let best = null;
    ranked.forEach((m) => {
      const idx = indexOf(m);
      let score = 0;
      const hits = [];
      new Set(q).forEach((t) => {
        const w = idx.words.get(t);
        if (w) { score += w; hits.push(t); }
      });
      idx.phrases.forEach((p) => { if (joined.includes(' ' + p + ' ')) score += 2; });
      if (!best || score > best.score || (score === best.score && m.buzz > best.m.buzz)) best = { m, score, hits };
    });
    if (!best || best.score <= 0) return { m: ranked[0], score: 0, hits: [], closest: true };
    return Object.assign(best, { closest: false });
  }

  // ------------------------------------------------------------- rendering
  const view = $('#view');

  function thumbHTML(clip, size, extraCls) {
    const src = thumbSrc(clip, size);
    const alt = clip ? 'Thumbnail: ' + clip.title : '';
    return '<div class="thumb ' + (extraCls || '') + (src ? '' : ' img-failed') + '">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" width="270" height="480">' : '') +
      '<svg class="play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 4.5v15l13-7.5z"/></svg>' +
      (clip && duration(clip.duration_s) ? '<span class="dur">' + duration(clip.duration_s) + '</span>' : '') +
      '</div>';
  }

  function quoteHTML(s) {
    return '<blockquote class="quote"><p>“' + esc(s.quote) + '”</p>' +
      '<div class="qmeta"><a class="ext-link" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' +
      esc(s.subreddit || 'Reddit') + ' · <span class="up">▲' + fmt(s.score) + '</span>' +
      icon('ext', 'ic ic-xs') + '<span class="sr-only"> (opens the Reddit comment in a new tab)</span></a></div></blockquote>';
  }

  function buzzHTML(m) {
    const b = Math.max(0, Math.min(100, Number(m.buzz) || 0));
    return '<div class="buzz"><span class="buzz-label" aria-hidden="true">Buzz</span>' +
      '<span class="meter" aria-hidden="true"><span style="width:' + b + '%"></span></span>' +
      '<span class="buzz-num" aria-hidden="true">' + b + '</span><span class="sr-only">Buzz score ' + b + ' out of 100</span></div>';
  }

  function tagsHTML(m) {
    const clip = clipOf(m);
    const players = (m.players || []);
    const teams = Array.isArray(m.teams) ? m.teams : ((clip && clip.teams) || []);
    const tags = players.map((p) => '<span class="tag">' + esc(p) + '</span>')
      .concat(teams.map((t) => '<span class="tag tag-team">' + esc(t) + '</span>'));
    return tags.length ? '<div class="tags">' + tags.join('') + '</div>' : '';
  }

  // ------------------------------------------------------------ TRENDING
  const TRY = [
    ['Poulin in OT again', 'Poulin in OT again!!'],
    ['KK Harvey #1 pick', 'KK Harvey went #1 overall'],
    ['Detroit expansion', 'Detroit expansion team'],
    ['Found hockey at the Olympics', 'I found the PWHL through the Olympics']
  ];

  function cardHTML(m) {
    const clip = clipOf(m);
    const qs = quotesOf(m);
    const top = qs[0];
    const rest = qs.slice(1);
    const open = S.expanded.has(m.id);
    return '<li class="mcard card" data-card="' + esc(m.id) + '">' +
      '<div class="mcard-top">' +
        '<div class="rank"><small aria-hidden="true">#</small><span class="sr-only">Rank </span>' + m._rank + '</div>' +
        '<div class="mcard-main">' +
          '<div><span class="cat ' + catClass(m.category) + '">' + esc(m.category) + '</span></div>' +
          '<h3 class="mcard-title">' + esc(m.title) + '</h3>' +
          buzzHTML(m) +
        '</div>' +
        '<button type="button" class="thumb-btn" data-action="gen" data-id="' + esc(m.id) + '" aria-label="Generate drafts from this clip: ' + esc(m.title) + '">' +
          thumbHTML(clip, 'sm') + '</button>' +
      '</div>' +
      (top ? quoteHTML(top) : '') +
      tagsHTML(m) +
      (rest.length ? '<div class="more-quotes" id="mq-' + esc(m.id) + '"' + (open ? '' : ' hidden') + '>' +
        '<p class="eyebrow">More from fans</p>' + rest.map(quoteHTML).join('') + '</div>' : '') +
      '<div class="mcard-actions">' +
        '<button type="button" class="btn btn-primary" data-action="gen" data-id="' + esc(m.id) + '">Generate drafts' + icon('arrow', 'ic ic-sm') + '</button>' +
        (rest.length ? '<button type="button" class="btn btn-ghost expand-btn" data-action="expand" data-id="' + esc(m.id) + '" aria-expanded="' + open + '" aria-controls="mq-' + esc(m.id) + '">' +
          '<span>' + (open ? 'Less' : qs.length + ' quotes') + '</span>' + icon('chev', 'ic ic-sm chev') + '</button>' : '') +
      '</div>' +
    '</li>';
  }

  function listHTML() {
    const list = ranked.filter((m) => S.filter === 'All' || m.category === S.filter);
    return list.length ? list.map(cardHTML).join('') : '<li class="card empty-note">No moments in this category yet.</li>';
  }

  function renderTrending() {
    const counts = {};
    ranked.forEach((m) => { counts[m.category] = (counts[m.category] || 0) + 1; });
    view.innerHTML =
      '<section class="trend-layout" aria-labelledby="t-title">' +
        '<div class="listen">' +
          '<div>' +
            '<p class="eyebrow">Listen &amp; Rank</p>' +
            '<h1 class="h1" id="t-title" tabindex="-1">What fans are sharing</h1>' +
            '<p class="lede">PWHL moments ranked by buzz, with the real fan comments behind them.</p>' +
          '</div>' +
          '<div class="status-strip"><span class="live-dot" aria-hidden="true"></span>' +
            '<span class="ss-main"><span class="ss-num"><strong>5,000</strong> fan posts scanned today</span><span class="src">Sources: Reddit · YouTube</span></span>' +
            '<span class="demo-tag" title="Static demo number: our estimate of daily volume, not live data">Demo · Est.</span></div>' +
          '<form class="finder card" id="finder" novalidate>' +
            '<label class="finder-label" for="paste-in">Paste a fan post or type a topic</label>' +
            '<div class="finder-row">' +
              '<input id="paste-in" class="finder-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="e.g. Poulin in overtime" aria-describedby="finder-hint">' +
              '<button type="submit" class="btn btn-primary" aria-label="Find the moment">' + icon('search', 'ic ic-sm') + '<span>Find<span class="fm-more"> the moment</span></span></button>' +
            '</div>' +
            '<p class="hint" id="finder-hint" aria-live="polite"></p>' +
            '<div class="try"><span class="try-label">Try</span>' +
              TRY.map((t) => '<button type="button" class="try-chip" data-action="try" data-q="' + esc(t[1]) + '">' + esc(t[0]) + '</button>').join('') +
            '</div>' +
          '</form>' +
        '</div>' +
        '<div class="moments">' +
          '<div class="moments-head"><h2 class="h2">Trending moments</h2><span class="small">Ranked by buzz <span class="demo-tag" title="Buzz scores in this demo are illustrative">Demo</span></span></div>' +
          '<div class="filters" role="group" aria-label="Filter moments">' +
            CATS.map((c) => '<button type="button" class="chip" data-action="filter" data-filter="' + esc(c.id) + '" aria-pressed="' + (S.filter === c.id) + '">' +
              esc(c.label) + ' <span class="chip-count">' + (c.id === 'All' ? ranked.length : (counts[c.id] || 0)) + '</span></button>').join('') +
          '</div>' +
          '<p class="sr-only" id="filter-status" aria-live="polite"></p>' +
          '<ol class="moment-list" id="moment-list">' + listHTML() + '</ol>' +
        '</div>' +
      '</section>';
  }

  function setFilter(f) {
    S.filter = f;
    store.set('sessionStorage', 'cm.filter', f);
    $$('.filters .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
    const list = $('#moment-list');
    if (list) list.innerHTML = listHTML();
    const n = ranked.filter((m) => f === 'All' || m.category === f).length;
    const st = $('#filter-status');
    if (st) st.textContent = 'Showing ' + n + (f === 'All' ? '' : ' ' + f) + ' moments';
  }

  function toggleCard(id) {
    const card = $('[data-card="' + id + '"]');
    if (!card) return;
    const panel = $('.more-quotes', card);
    const btn = $('.expand-btn', card);
    if (!panel || !btn) return;
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    const m = momentById(id);
    $('span', btn).textContent = open ? 'Less' : quotesOf(m).length + ' quotes';
    if (open) S.expanded.add(id); else S.expanded.delete(id);
  }

  function submitFinder(value) {
    const hint = $('#finder-hint');
    const q = String(value || '').trim();
    if (!q || !tokens(q).length && !norm(q)) {
      if (hint) hint.textContent = 'Type a player, team or moment, or paste a fan comment. Try “Poulin”.';
      const input = $('#paste-in');
      let fine = true;
      try { fine = window.matchMedia('(pointer: fine)').matches; } catch (e) { /* keep default */ }
      if (input && fine) input.focus();
      return;
    }
    const r = findMoment(q);
    S.match = { id: r.m.id, query: q, closest: r.closest, hits: r.hits };
    if (hint) hint.textContent = (r.closest ? 'Closest match: ' : 'Best match: ') + r.m.title + '. Opening Studio…';
    openStudio(r.m.id, true, true);
  }

  // --------------------------------------------------------------- STUDIO
  function openStudio(id, autostart, keepMatch) {
    if (!keepMatch) S.match = null;
    S.autostart = autostart ? id : null;
    go('#studio/' + id);
  }

  function stepDefs(m, clip) {
    const nFacts = (m.facts || []).length;
    return [
      { label: 'Reading fan comments', todo: 'Reddit and YouTube comments on this moment', done: fmt(m.comments_read) + ' comments read (demo count)' },
      { label: 'Picking the most-shared clip', todo: 'From the PWHL’s official YouTube channel', done: clip ? '“' + clip.title + '”' : 'Official PWHL clip' },
      { label: 'Writing in the PWHL voice', todo: 'TikTok, Reels and Shorts', done: '3 platforms × 3 versions' },
      { label: 'Checking hockey facts', todo: 'Every name, number and record', done: nFacts + ' of ' + nFacts + ' facts checked' }
    ];
  }

  function phoneUI(p, d, caption) {
    const tags = d.hashtags.join(' ');
    const cap = esc(caption);
    const hook = '<div class="hook"><span>' + esc(d.hook) + '</span></div>';
    if (p === 'reels') {
      return hook +
        '<div class="p-top"><span class="ig-title">Reels' + glyph('chevDown') + '</span>' + glyph('camera', ' class="ic"') + '</div>' +
        '<div class="rail">' +
          '<div class="rail-btn">' + glyph('heartLine') + '<span>Like</span></div>' +
          '<div class="rail-btn">' + glyph('bubbleLine') + '<span>Comment</span></div>' +
          '<div class="rail-btn">' + glyph('plane') + '<span>Share</span></div>' +
          '<div class="rail-btn">' + glyph('dots') + '</div>' +
          '<div class="ig-audio-sq"></div>' +
        '</div>' +
        '<div class="p-info">' +
          '<div class="ig-user"><span class="ig-av">' + glyph('user') + '</span>yourteam<span class="ig-follow">Follow</span><span class="draft-tag">Draft</span></div>' +
          '<p class="p-cap" data-cap><b>yourteam</b> <span data-captext>' + cap + '</span> <span data-tags>' + esc(tags) + '</span></p>' +
          '<div class="p-sound">' + glyph('note') + '<span>yourteam · Original audio</span></div>' +
        '</div>' +
        '<div class="p-nav">' +
          '<div class="nv">' + glyph('homeLine') + '</div><div class="nv">' + glyph('search') + '</div>' +
          '<div class="nv">' + glyph('plusSq') + '</div><div class="nv on">' + glyph('reels') + '</div>' +
          '<div class="nv"><span class="ig-prof"></span></div>' +
        '</div>';
    }
    if (p === 'shorts') {
      return hook +
        '<div class="p-top"><span></span><span class="yt-top">' + glyph('search', ' class="ic"') + glyph('dotsV', ' class="ic"') + '</span></div>' +
        '<div class="rail">' +
          '<div class="rail-btn">' + glyph('thumbUp') + '<span>Like</span></div>' +
          '<div class="rail-btn">' + glyph('thumbDown') + '<span>Dislike</span></div>' +
          '<div class="rail-btn">' + glyph('bubble') + '<span>Comment</span></div>' +
          '<div class="rail-btn">' + glyph('share') + '<span>Share</span></div>' +
          '<div class="rail-btn">' + glyph('remix') + '<span>Remix</span></div>' +
          '<div class="yt-sq"></div>' +
        '</div>' +
        '<div class="p-info">' +
          '<div class="p-handle"><span class="ig-av">' + glyph('user') + '</span>@yourteam<span class="yt-sub">Subscribe</span></div>' +
          '<p class="p-cap" data-cap><span data-captext>' + cap + '</span> <span data-tags>' + esc(tags) + '</span></p>' +
          '<div class="p-sound">' + glyph('note') + '<span>Original sound · yourteam</span></div>' +
        '</div>' +
        '<div class="yt-progress"><span></span></div>' +
        '<div class="p-nav">' +
          '<div class="nv">' + glyph('homeLine') + '<span>Home</span></div><div class="nv on">' + glyph('shorts') + '<span>Shorts</span></div>' +
          '<div class="nv"><span class="yt-plus">' + glyph('plus') + '</span></div>' +
          '<div class="nv">' + glyph('subs') + '<span>Subscriptions</span></div><div class="nv">' + glyph('userLine') + '<span>You</span></div>' +
        '</div>';
    }
    return hook +
      '<div class="p-top"><span class="tt-live">LIVE</span><span class="tt-tabs"><span>Following</span><span class="on">For You</span></span>' + glyph('search', ' class="ic"') + '</div>' +
      '<div class="rail">' +
        '<div class="avatar">' + glyph('user') + '<span class="plus">' + glyph('plus') + '</span></div>' +
        '<div class="rail-btn">' + glyph('heart') + '<span>Like</span></div>' +
        '<div class="rail-btn">' + glyph('bubble') + '<span>Comment</span></div>' +
        '<div class="rail-btn">' + glyph('bookmark') + '<span>Save</span></div>' +
        '<div class="rail-btn">' + glyph('share') + '<span>Share</span></div>' +
        '<div class="disc"></div>' +
      '</div>' +
      '<div class="p-info">' +
        '<div class="p-handle">@yourteam<span class="draft-tag">Draft</span></div>' +
        '<p class="p-cap" data-cap><span data-captext>' + cap + '</span> <b data-tags>' + esc(tags) + '</b></p>' +
        '<div class="p-sound">' + glyph('note') + '<span>original sound · yourteam</span></div>' +
      '</div>' +
      '<div class="p-nav">' +
        '<div class="nv on">' + glyph('home') + '<span>Home</span></div><div class="nv">' + glyph('friends') + '<span>Friends</span></div>' +
        '<div class="tt-plus">' + glyph('plus') + '</div>' +
        '<div class="nv">' + glyph('inbox') + '<span>Inbox</span></div><div class="nv">' + glyph('userLine') + '<span>Profile</span></div>' +
      '</div>';
  }

  function emptyStudioHTML(badId) {
    return '<section class="studio-empty" aria-labelledby="s-title">' +
      '<div>' +
        '<p class="eyebrow">Studio · Draft</p>' +
        '<h1 class="h1" id="s-title" tabindex="-1">Pick a moment to draft</h1>' +
        '<p class="lede">' + (badId ? 'That moment isn’t in this demo. ' : '') +
          'Choose one of today’s top moments and Content Machine drafts posts for TikTok, Reels and Shorts.</p>' +
      '</div>' +
      '<div class="pick-list">' +
        ranked.slice(0, 3).map((m) => {
          const clip = clipOf(m);
          return '<button type="button" class="card pick" data-action="pick" data-id="' + esc(m.id) + '">' +
            thumbHTML(clip, 'sm') +
            '<span><span class="pk-title">' + esc(m.title) + '</span>' +
            '<span class="pk-sub">#' + m._rank + ' · ' + esc(m.category) + ' · Buzz ' + esc(m.buzz) + '</span></span>' +
            '<span class="pk-go">' + icon('arrow') + '</span></button>';
        }).join('') +
      '</div>' +
      '<a class="btn btn-ghost" href="#trending">See all trending moments</a>' +
    '</section>';
  }

  function studioHTML(m) {
    const clip = clipOf(m);
    const done = S.generated.has(m.id);
    const steps = stepDefs(m, clip);
    const match = S.match && S.match.id === m.id ? S.match : null;
    const shortQ = match ? (match.query.length > 40 ? match.query.slice(0, 38).replace(/\s+\S*$/, '') + '…' : match.query) : '';
    const qs = quotesOf(m);
    const facts = m.facts || [];
    const poster = thumbSrc(clip, 'md');

    return '<section class="studio" data-state="' + (done ? 'done' : 'idle') + '" data-moment="' + esc(m.id) + '" aria-labelledby="s-title">' +
      '<div class="studio-head card">' +
        '<p class="eyebrow">Studio · Draft · #' + m._rank + ' trending</p>' +
        '<h1 class="h1" id="s-title" tabindex="-1">' + esc(m.title) + '</h1>' +
        '<div class="head-meta"><span class="cat ' + catClass(m.category) + '">' + esc(m.category) + '</span>' + buzzHTML(m) + tagsHTML(m) + '</div>' +
        (match ? '<p class="match-note">' + icon(match.closest ? 'target' : 'search', 'ic ic-sm') +
          '<span>' + (match.closest
            ? 'Closest match for “' + esc(shortQ) + '”: nothing on that in today’s scan yet, so here’s the #1 moment'
            : 'Matched “' + esc(shortQ) + '”') + '</span></p>' : '') +
        '<div class="gen-btn-wrap pre-only"><button type="button" class="btn btn-primary btn-lg" id="gen-btn" data-action="generate">' +
          icon('sparkle', 'ic') + '<span>Generate drafts</span></button></div>' +
        '<div class="ready-chip results-only">' + icon('approve', 'ic') + '<span>9 drafts ready</span>' +
          '<button type="button" class="link-btn" data-action="generate">Run again</button></div>' +
      '</div>' +

      '<div class="studio-grid">' +
        '<div class="col-left">' +
          '<div class="phone-block">' +
            '<div class="phone">' +
              '<div class="screen' + (done ? '' : ' is-waiting') + '" id="screen" data-platform="' + S.platform + '">' +
                '<div class="media' + (poster ? '' : ' img-failed') + '">' +
                  (poster ? '<img class="poster" src="' + esc(poster) + '" alt="" decoding="async">' : '') +
                  '<div class="yt-slot"></div>' +
                '</div>' +
                '<div class="scrim"></div>' +
                '<div class="pui" id="pui" aria-hidden="true"></div>' +
                STATUSBAR +
                '<div class="phone-idle" aria-hidden="true"><span class="pi-idle">Drafts appear here</span><span class="pi-run">Drafting…</span></div>' +
                '<div class="media-note" id="media-note" hidden>' + icon('wifiOff', 'ic') + '<span class="mn-text">Video preview offline</span></div>' +
                '<div class="shimmer"></div>' +
              '</div>' +
            '</div>' +
            '<p class="sr-only" id="phone-sr" aria-live="polite"></p>' +
            (clip ? '<p class="clip-credit results-only">Official clip, PWHL YouTube channel · <a href="' + esc(clip.url) + '" target="_blank" rel="noopener noreferrer">Watch<span class="sr-only"> on YouTube (opens in a new tab)</span></a></p>' : '') +
          '</div>' +

        '</div>' +

        '<div class="col-right">' +
          '<div class="seg-row results-only">' +
            '<div class="seg" role="group" aria-label="Platform">' +
              PLATFORMS.map((p) => '<button type="button" data-action="platform" data-p="' + p.id + '" aria-pressed="' + (S.platform === p.id) + '">' +
                '<span>' + p.label + '</span><span class="pbadge" aria-hidden="true">' + icon('check', 'ic') + '</span><span class="sr-only pb-sr"></span></button>').join('') +
            '</div>' +
            '<div class="draft-meta"><span id="draft-ver"></span><span class="approved-chip" id="approved-chip" hidden>' + icon('check', 'ic') + 'Approved</span></div>' +
          '</div>' +

          '<div class="actions results-only">' +
            '<button type="button" class="btn btn-secondary" id="regen-btn" data-action="regen">' + icon('refresh', 'ic ic-sm') + 'Regenerate</button>' +
            '<button type="button" class="btn btn-primary" id="approve-btn" data-action="approve">' + icon('approve', 'ic ic-sm') + '<span>Approve</span></button>' +
            '<button type="button" class="btn btn-ghost next-btn" data-action="next">Next moment' + icon('arrow', 'ic ic-sm') + '</button>' +
          '</div>' +
          '<div class="pipeline card' + (done ? ' is-collapsed' : '') + '" id="pipeline">' +
            '<div class="pipe-head"><h2 class="h2">How it drafts</h2>' +
              '<span class="pipe-status' + (done ? ' is-done' : '') + '" id="pipe-status" role="status" aria-live="polite">' + (done ? 'Done' : 'Ready') + '</span></div>' +
            '<ol class="steps">' +
              steps.map((s, i) => '<li class="step" data-s="' + (done ? 'done' : 'todo') + '">' +
                '<span class="step-icon" aria-hidden="true"><span class="n">' + (i + 1) + '</span>' + icon('check', 'ic') + '</span>' +
                '<span class="step-body"><span class="step-label">' + esc(s.label) + '</span>' +
                '<span class="step-detail">' + esc(done ? s.done : s.todo) + '</span></span></li>').join('') +
            '</ol>' +
            '<p class="pipe-summary">' + icon('approve', 'ic ic-sm') +
              '<span>Demo run: read ' + fmt(m.comments_read) + ' fan comments · picked 1 official clip · wrote 9 drafts · checked ' + facts.length + ' facts</span></p>' +
            '<div class="pipe-foot">' +
              '<p class="pipe-note">AI drafts. Your team presses send.</p>' +
              '<button type="button" class="link-btn pipe-toggle" data-action="toggle-steps" aria-expanded="' + (!done) + '">' + (done ? 'Show steps' : 'Hide steps') + '</button>' +
            '</div>' +
          '</div>' +

          '<div class="editor card results-only">' +
            '<div class="field-label"><label class="eyebrow" for="cap-input">Caption</label><span class="small muted" id="cap-count"></span></div>' +
            '<textarea id="cap-input" class="cap-input" rows="4" spellcheck="true"></textarea>' +
            '<div class="cap-foot"><span>Edit freely. The preview updates as you type.</span>' +
              '<button type="button" class="link-btn" id="cap-reset" data-action="reset-cap" hidden>Reset</button></div>' +
            '<div class="field"><p class="eyebrow">Hashtags</p><div class="hashtags" id="hashtags"></div></div>' +
            '<div class="post-time">' + icon('clock', 'ic') + '<div><p class="pt-label">Suggested post time</p><p class="pt-val" id="post-time"></p></div></div>' +
          '</div>' +

          '<div class="why card results-only">' +
            '<h2 class="h2">Why this clip</h2>' +
            '<p class="why-text">' + esc(m.why_this_clip || 'Fans keep coming back to this moment.') + '</p>' +
            (qs.length ? '<p class="eyebrow">What fans said</p><div class="why-quotes">' + qs.slice(0, 4).map(quoteHTML).join('') + '</div>' : '') +
            (clip ? '<div class="clip-row">' + thumbHTML(clip, 'sm') +
              '<div class="ct"><strong>' + esc(clip.title) + '</strong>Official PWHL ' + (clip.format === 'short' ? 'Short' : 'video') +
              (clip.views_at_scan ? ' · ' + esc(clip.views_at_scan) + ' views when we scanned' : '') +
              ' · <a class="ext-link inline" href="' + esc(clip.url) + '" target="_blank" rel="noopener noreferrer">YouTube' + icon('ext', 'ic ic-xs') + '</a></div></div>' : '') +
          '</div>' +

          '<div class="facts card results-only">' +
            '<h2 class="h2">Facts checked</h2>' +
            (facts.length ? '<ul class="fact-list">' + facts.map((f) =>
              '<li class="fact"><span class="fact-check" aria-hidden="true">' + icon('check', 'ic') + '</span>' +
              '<p class="fact-text">' + esc(f.text) + '<span class="fact-src">Source: ' + esc(f.source || 'PWHL') + '</span></p></li>').join('') + '</ul>'
              : '<p class="muted">No facts to check for this draft.</p>') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderStudio(id, badId) {
    const m = id ? momentById(id) : null;
    if (!m) {
      view.innerHTML = emptyStudioHTML(badId);
      return;
    }
    if (S.lastMomentId !== m.id) { S.lastMomentId = m.id; save(); }
    view.innerHTML = studioHTML(m);
    fitPhone();
    updateDraft(m);
    if (S.generated.has(m.id)) armVideo(m);
    if (S.autostart === m.id) {
      S.autostart = null;
      startRun(m);
    }
  }

  const currentMoment = () => {
    const el = $('.studio[data-moment]');
    return el ? momentById(el.dataset.moment) : null;
  };

  function updateDraft(m, opts) {
    const p = S.platform;
    const v = variantOf(m.id, p);
    const d = draftOf(m, p, v);
    const key = draftKey(m.id, p, v);
    const caption = Object.prototype.hasOwnProperty.call(S.edits, key) ? S.edits[key] : d.caption;
    const screen = $('#screen');
    const pui = $('#pui');
    if (screen) screen.dataset.platform = p;
    if (pui) pui.innerHTML = phoneUI(p, d, caption);

    $$('.seg button').forEach((b) => {
      const bp = b.dataset.p;
      const approved = S.approved.has(draftKey(m.id, bp, variantOf(m.id, bp)));
      b.setAttribute('aria-pressed', String(bp === p));
      b.classList.toggle('is-approved', approved);
      const sr = $('.pb-sr', b);
      if (sr) sr.textContent = approved ? ' (approved)' : '';
    });

    const approved = S.approved.has(key);
    const ver = $('#draft-ver');
    if (ver) ver.textContent = PLATFORM_LABEL[p] + ' · version ' + (v % d.count + 1) + ' of ' + d.count;
    const chip = $('#approved-chip');
    if (chip) chip.hidden = !approved;
    const ab = $('#approve-btn');
    if (ab) {
      ab.classList.toggle('btn-done', approved);
      ab.classList.toggle('btn-primary', !approved);
      ab.setAttribute('aria-pressed', String(approved));
      $('span', ab).textContent = approved ? 'Approved' : 'Approve';
    }

    const ta = $('#cap-input');
    if (ta && !(opts && opts.keepCaption)) ta.value = caption;
    updateCapMeta(caption, caption !== d.caption);
    const tags = $('#hashtags');
    if (tags) tags.innerHTML = d.hashtags.map((h) => '<span class="hashtag">' + esc(h) + '</span>').join('');
    const pt = $('#post-time');
    if (pt) pt.textContent = d.post_time;
    const sr = $('#phone-sr');
    if (sr) sr.textContent = PLATFORM_LABEL[p] + ' preview, version ' + (v % d.count + 1) + '. On-screen text: ' + d.hook + '.';
  }

  function updateCapMeta(text, edited) {
    const c = $('#cap-count');
    if (c) c.textContent = fmt(String(text).length) + ' characters' + (edited ? ' · edited' : '');
    const r = $('#cap-reset');
    if (r) r.hidden = !edited;
  }

  // ------------------------------------------------------------- pipeline
  function setStudioState(state) {
    const st = $('.studio');
    if (st) st.dataset.state = state;
    const screen = $('#screen');
    if (screen) {
      screen.classList.toggle('is-waiting', state !== 'done');
      screen.classList.toggle('is-running', state === 'running');
      if (state !== 'done') screen.classList.remove('is-live');
    }
    const btn = $('#gen-btn');
    if (btn) {
      btn.disabled = state === 'running';
      btn.setAttribute('aria-busy', String(state === 'running'));
      $('span', btn).textContent = state === 'running' ? 'Generating…' : 'Generate drafts';
    }
  }

  function cancelRun() {
    const run = S.run;
    if (!run) return;
    run.timers.forEach(clearTimeout);
    if (run.raf) cancelAnimationFrame(run.raf);
    S.run = null;
  }

  function countUp(run, el, to, ms, render) {
    if (!el) return;
    const start = performance.now();
    const tick = (now) => {
      if (S.run !== run) return;
      const k = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = render(Math.round(to * eased));
      if (k < 1) run.raf = requestAnimationFrame(tick);
    };
    run.raf = requestAnimationFrame(tick);
  }

  function startRun(m) {
    if (S.run) {
      if (S.run.id === m.id) return; // double-click guard
      cancelRun();
    }
    const studio = $('.studio');
    if (!studio || studio.dataset.moment !== m.id) return;
    const run = { id: m.id, timers: [], raf: 0 };
    S.run = run;
    S.generated.delete(m.id);
    save();

    const pipeline = $('#pipeline');
    if (pipeline) pipeline.classList.remove('is-collapsed');
    const toggle = $('.pipe-toggle');
    if (toggle) { toggle.textContent = 'Hide steps'; toggle.setAttribute('aria-expanded', 'true'); }
    const stepEls = $$('.step');
    const detailEls = stepEls.map((s) => $('.step-detail', s));
    const status = $('#pipe-status');
    const clip = clipOf(m);
    const defs = stepDefs(m, clip);
    const nFacts = (m.facts || []).length;
    stepEls.forEach((s, i) => { s.dataset.s = 'todo'; detailEls[i].textContent = defs[i].todo; });
    setStudioState('running');
    armVideo(m, true);
    if (status) { status.className = 'pipe-status is-run'; status.textContent = 'Starting…'; }

    const reduce = reduceMotion();
    const D = reduce ? [250, 250, 250, 250] : [1300, 1000, 1200, 1000];
    const at = (ms, fn) => run.timers.push(setTimeout(() => { if (S.run === run) fn(); }, ms));

    let t = 0;
    D.forEach((ms, i) => {
      at(t, () => {
        stepEls[i].dataset.s = 'active';
        if (status) status.innerHTML = 'Step ' + (i + 1) + ' of 4<span class="sr-only">: ' + esc(defs[i].label) + '</span>';
        const el = detailEls[i];
        if (i === 0) {
          if (reduce) el.textContent = defs[0].done;
          else countUp(run, el, Number(m.comments_read) || 0, ms * 0.85, (n) => fmt(n) + ' comments read');
        } else if (i === 1) {
          el.textContent = defs[1].done;
        } else if (i === 2) {
          el.textContent = defs[2].done;
        } else {
          if (reduce || !nFacts) el.textContent = defs[3].done;
          else countUp(run, el, nFacts, ms * 0.8, (n) => 'Checking ' + Math.max(1, n) + ' of ' + nFacts + ' facts…');
        }
      });
      t += ms;
      at(t - 1, () => {
        if (run.raf) cancelAnimationFrame(run.raf);
        stepEls[i].dataset.s = 'done';
        detailEls[i].textContent = defs[i].done;
      });
    });
    at(t + (reduce ? 0 : 150), () => finishRun(m, run));
  }

  function finishRun(m, run) {
    if (S.run !== run) return;
    S.run = null;
    S.generated.add(m.id);
    save();
    setStudioState('done');
    const status = $('#pipe-status');
    if (status) { status.className = 'pipe-status is-done'; status.innerHTML = 'Done<span class="sr-only">: 9 drafts ready for review</span>'; }
    const pipeline = $('#pipeline');
    if (pipeline) pipeline.classList.add('is-collapsed');
    const toggle = $('.pipe-toggle');
    if (toggle) { toggle.textContent = 'Show steps'; toggle.setAttribute('aria-expanded', 'false'); }
    updateDraft(m);
    const f = S.frame;
    if (f && !f.dead) f.release(); else if (!f) armVideo(m);
    fitPhone();
    const behavior = reduceMotion() ? 'auto' : 'smooth';
    if (!isDesktop()) {
      // Phones: platform switcher at the top, the whole drafted post below it
      // (on very short screens, the drafted post alone).
      const target = phoneOnly ? $('.phone') : $('.seg-row');
      if (target) target.scrollIntoView({ behavior, block: 'start' });
    } else {
      // Desktop / projector: scroll just enough to show the whole phone.
      const credit = $('.clip-credit') || $('.phone');
      if (credit) {
        const over = credit.getBoundingClientRect().bottom + 16 - window.innerHeight;
        if (over > 0) window.scrollBy({ top: over, behavior });
      }
    }
  }

  // ------------------------------------------------------------ phone fit
  // The mockup is designed at 320 x 555 px and scaled as one piece (CSS zoom), so its
  // app chrome never collides at small sizes. Phones: fit the platform switcher, the
  // whole mockup and (when there is room) Regenerate/Approve between the top bar and
  // the tab bar. Uses the small viewport height so Safari's toolbars are accounted for
  // and the mockup doesn't resize while they collapse on scroll.
  const PHONE_W = 320;
  const PHONE_H = 555;
  let vhProbe = null;
  let phoneOnly = false;
  function viewportH() {
    try {
      if (!vhProbe) {
        vhProbe = document.createElement('div');
        vhProbe.setAttribute('aria-hidden', 'true');
        vhProbe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none;';
        document.body.appendChild(vhProbe);
      }
      return vhProbe.offsetHeight || window.innerHeight;
    } catch (e) { return window.innerHeight; }
  }
  function fitPhone() {
    const phone = $('.phone');
    if (!phone) return;
    const vh = viewportH();
    const topbar = ($('#topbar') || {}).offsetHeight || 60;
    let z;
    if (isDesktop()) {
      // Sticky column: top bar + 16px, then the phone, then the clip credit line.
      z = Math.min(1.0625, Math.max(0.8, (vh - topbar - 16 - 34 - 20) / PHONE_H));
    } else {
      const tabbar = ($('.tabbar') || {}).offsetHeight || 66;
      const avail = vh - topbar - tabbar - 24;
      const seg = 94 + 16;
      const act = 16 + 48;
      const withActions = (avail - seg - act) / PHONE_H;
      const withSeg = (avail - seg) / PHONE_H;
      // Very short screens (e.g. iPhone SE in Safari): the mockup alone fills the view.
      phoneOnly = withActions < 0.72 && withSeg < 0.62;
      z = withActions >= 0.72 ? withActions : (phoneOnly ? avail / PHONE_H : withSeg);
      const grid = $('.studio-grid');
      const w = grid ? grid.clientWidth : window.innerWidth - 32;
      z = Math.max(0.5, Math.min(z, 1, w / PHONE_W));
    }
    phone.style.setProperty('--phone-zoom', String(Math.round(z * 1000) / 1000));
  }
  let fitRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(fitPhone);
  });

  // ---------------------------------------------------------------- video
  // The poster stays up until the embed reports that the clip is actually
  // playing (YouTube's iframe postMessage protocol), so judges never see a
  // black, loading or error player. Only one iframe exists at a time.
  // The iframe is mounted while the drafts are being written (hidden behind
  // the poster), so the animation doubles as load time on slow networks.
  const YT_ORIGIN = /^https:\/\/www\.youtube(-nocookie)?\.com$/;
  const REVEAL_AT = 4.4; // seconds of playback: YouTube's own centre controls have faded by then

  function destroyFrame() {
    const f = S.frame;
    if (!f) return;
    ['timer', 'loadTimer', 'reveal', 'buf'].forEach((k) => clearTimeout(f[k]));
    clearInterval(f.hello);
    if (f.io) f.io.disconnect();
    if (f.el && f.el.parentNode) f.el.parentNode.removeChild(f.el);
    S.frame = null;
  }

  window.addEventListener('message', (e) => {
    const f = S.frame;
    if (!f || !f.el || !YT_ORIGIN.test(e.origin) || e.source !== f.el.contentWindow) return;
    let d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (err) { return; } }
    if (!d || typeof d !== 'object') return;
    if (!f.talking) { f.talking = true; clearInterval(f.hello); f.subscribe(); }
    const info = d.info && typeof d.info === 'object' ? d.info : null;
    // Removed or private clip, embedding turned off, or a bot check: keep the poster.
    if (d.event === 'onError' || (info && info.videoData && info.videoData.errorCode)) { f.fail('Video preview unavailable'); return; }
    const state = d.event === 'onStateChange' ? d.info : (info ? info.playerState : undefined);
    if (typeof state === 'number') {
      f.playing = state === 1;
      if (state === 3) f.onBuffering(); else if (state === 1) f.onResume();
    }
    const time = info && typeof info.currentTime === 'number' ? info.currentTime : null;
    if (f.playing && time !== null && time >= REVEAL_AT) f.onPlaying();
  });

  window.addEventListener('offline', () => {
    const f = S.frame;
    if (f && f.fail) f.fail('Video preview offline');
  });

  // hold: mount now but don't show the video until release() (drafts still running).
  function armVideo(m, hold) {
    destroyFrame();
    const clip = clipOf(m);
    const screen = $('#screen');
    if (!screen || !clip || !/^[\w-]{6,20}$/.test(clip.id)) return;
    const slot = $('.yt-slot', screen);
    const note = $('#media-note');
    if (note) note.hidden = true;
    screen.classList.remove('is-live', 'is-interactive');
    const f = {
      el: null, timer: 0, loadTimer: 0, reveal: 0, buf: 0, hello: 0, io: null,
      talking: false, loaded: false, playing: false, hold: Boolean(hold), pending: null,
      onPlaying: () => {}, onBuffering: () => {}, onResume: () => {}, subscribe: () => {}, fail: () => {}, release: () => {}
    };
    S.frame = f;
    const isLive = () => screen.classList.contains('is-live');
    f.fail = (text) => {
      if (S.frame !== f) return;
      ['timer', 'loadTimer', 'reveal', 'buf'].forEach((k) => clearTimeout(f[k]));
      clearInterval(f.hello);
      if (f.io) { f.io.disconnect(); f.io = null; }
      if (f.el && f.el.parentNode) f.el.parentNode.removeChild(f.el);
      f.el = null;
      f.dead = true;
      screen.classList.remove('is-live', 'is-interactive');
      if (note) {
        const t = $('.mn-text', note);
        if (t) t.textContent = text || (navigator.onLine === false ? 'Video preview offline' : 'Video preview unavailable');
        note.hidden = false;
      }
    };
    const reveal = (interactive) => {
      if (S.frame !== f || !f.el) return;
      if (f.hold) { f.pending = interactive ? 'interactive' : 'live'; return; }
      clearTimeout(f.timer);
      screen.classList.add('is-live');
      screen.classList.toggle('is-interactive', Boolean(interactive));
    };
    f.release = () => {
      if (S.frame !== f) return;
      f.hold = false;
      if (f.pending) { const p = f.pending; f.pending = null; reveal(p === 'interactive'); }
    };
    f.onPlaying = () => {
      if (isLive() || f.reveal) return;
      f.reveal = setTimeout(() => { f.reveal = 0; reveal(false); }, 100);
    };
    // A long stall while live (e.g. the venue Wi-Fi drops): fade back to the poster.
    f.onBuffering = () => {
      if (!isLive() || f.buf) return;
      f.buf = setTimeout(() => {
        f.buf = 0;
        if (S.frame === f && !f.playing) screen.classList.remove('is-live', 'is-interactive');
      }, 4500);
    };
    f.onResume = () => { clearTimeout(f.buf); f.buf = 0; };
    f.subscribe = () => {
      if (!f.el) return;
      ['onError', 'onStateChange'].forEach((ev) => {
        try {
          f.el.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: [ev], id: 'cm-preview', channel: 'widget' }), '*');
        } catch (err) { /* ignore */ }
      });
    };
    const mount = () => {
      if (S.frame !== f || f.el || f.dead) return;
      // No network, or opened from file:// (YouTube refuses embeds without a referrer): keep the poster.
      if (navigator.onLine === false) { f.fail('Video preview offline'); return; }
      if (location.protocol === 'file:') { f.fail('Video preview offline'); return; }
      const id = encodeURIComponent(clip.id);
      const ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&loop=1&playlist=' + id +
        '&playsinline=1&controls=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1' +
        '&origin=' + encodeURIComponent(location.origin);
      ifr.title = 'Video preview: ' + clip.title;
      ifr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      ifr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      ifr.setAttribute('tabindex', '-1');
      ifr.addEventListener('load', () => {
        if (S.frame !== f || f.el !== ifr) return;
        f.loaded = true;
        clearTimeout(f.loadTimer);
        const hello = () => {
          try {
            ifr.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'cm-preview', channel: 'widget' }), '*');
          } catch (err) { /* ignore */ }
        };
        hello();
        let tries = 0;
        clearInterval(f.hello);
        f.hello = setInterval(() => { if (++tries > 40 || f.talking) clearInterval(f.hello); else hello(); }, 250);
        // Something loaded. If it never speaks YouTube's player protocol it is not a
        // player (a network filter's block page, a browser error page): keep the poster.
        // A real player that is talking but not playing (autoplay blocked, e.g. iOS
        // Low Power Mode) is shown after a while so it can be tapped.
        clearTimeout(f.timer);
        let waited = 0;
        const fallback = () => {
          if (S.frame !== f || isLive() || f.reveal || f.dead) return;
          waited += 1;
          if (!f.talking) {
            if (waited < 2) { f.timer = setTimeout(fallback, 6000); return; }
            f.fail('Video preview unavailable');
            return;
          }
          if (waited < 2) { f.timer = setTimeout(fallback, 8000); return; }
          reveal(true);
        };
        f.timer = setTimeout(fallback, 8000);
      });
      // Slow network: keep the poster while the embed loads; give up only after 20s.
      f.loadTimer = setTimeout(function check() {
        if (S.frame !== f || f.loaded || f.dead) return;
        if (navigator.onLine === false) { f.fail('Video preview offline'); return; }
        if (!f.slowSince) { f.slowSince = true; f.loadTimer = setTimeout(check, 14000); return; }
        f.fail('Video preview unavailable');
      }, 6000);
      f.el = ifr;
      slot.appendChild(ifr);
    };
    if ('IntersectionObserver' in window) {
      // Mount when the phone is on screen or about to be (it sits just below the steps on phones).
      f.io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { if (f.io) f.io.disconnect(); f.io = null; mount(); }
      }, { rootMargin: '0px 0px 480px 0px', threshold: 0 });
      f.io.observe(screen);
    } else {
      mount();
    }
  }

  // --------------------------------------------------------- studio actions
  function setPlatform(p) {
    const m = currentMoment();
    if (!m || !PLATFORMS.some((x) => x.id === p)) return;
    S.platform = p;
    save();
    updateDraft(m);
  }

  let regenBusy = false;
  function regenerate() {
    const m = currentMoment();
    if (!m || regenBusy) return;
    regenBusy = true;
    const p = S.platform;
    const count = draftOf(m, p, 0).count;
    S.variants[m.id] = S.variants[m.id] || {};
    S.variants[m.id][p] = (variantOf(m.id, p) + 1) % count;
    save();
    const screen = $('#screen');
    const editor = $('.editor');
    const btn = $('#regen-btn');
    if (btn) btn.disabled = true;
    [screen, editor].forEach((el) => { if (el) { el.classList.remove('is-shimmer'); void el.offsetWidth; el.classList.add('is-shimmer'); } });
    const reduce = reduceMotion();
    setTimeout(() => {
      if (currentMoment() === m) updateDraft(m);
    }, reduce ? 0 : 260);
    setTimeout(() => {
      [screen, editor].forEach((el) => { if (el) el.classList.remove('is-shimmer'); });
      if (btn) btn.disabled = false;
      regenBusy = false;
    }, reduce ? 150 : 760);
  }

  function approve() {
    const m = currentMoment();
    if (!m) return;
    const p = S.platform;
    const key = draftKey(m.id, p, variantOf(m.id, p));
    if (S.approved.has(key)) {
      toast('Already approved — it’s in your team’s queue');
      return;
    }
    const ta = $('#cap-input');
    if (ta && !ta.value.trim()) {
      toast('Add a caption before approving');
      ta.focus();
      return;
    }
    S.approved.add(key);
    save();
    updateDraft(m, { keepCaption: true });
    toast('Approved — queued for your team ✓');
  }

  function nextMoment() {
    const m = currentMoment();
    const i = m ? ranked.indexOf(m) : -1;
    const next = ranked[(i + 1) % ranked.length];
    if (next) openStudio(next.id, true);
  }

  // --------------------------------------------------------------- IMPACT
  const ALIASES = {
    'Marie-Philip Poulin': ['poulin', 'mpp', 'pou', 'captain clutch'],
    'Hilary Knight': ['hilary knight', 'captain america'],
    'Aerin Frankel': ['frankel'],
    'Caroline Harvey': ['caroline harvey', 'kk harvey'],
    'Laila Edwards': ['laila edwards'],
    'Kendall Coyne Schofield': ['kcs', 'coyne schofield'],
    'Sarah Nurse': ['sarah nurse'],
    'Sarah Fillier': ['fillier'],
    'Taylor Heise': ['heise'],
    'Emily Clark': ['emily clark'],
    'Emma Maltais': ['maltais'],
    'Abbey Murphy': ['abbey murphy']
  };

  function topPlayers() {
    const tally = new Map();
    signals.forEach((s) => {
      if (s.subreddit !== 'r/PWHL') return;
      const text = ' ' + norm(s.quote) + ' ';
      const names = new Set(s.players || []);
      Object.keys(ALIASES).forEach((name) => {
        if (ALIASES[name].some((a) => text.includes(' ' + a + ' '))) names.add(name);
      });
      names.forEach((name) => {
        const t = tally.get(name) || { name, n: 0, up: 0 };
        t.n += 1;
        t.up += Number(s.score) || 0;
        tally.set(name, t);
      });
    });
    return Array.from(tally.values()).sort((a, b) => b.n - a.n || b.up - a.up).slice(0, 6);
  }

  function barRow(label, sub, value, pct, cls) {
    return '<li class="bar-row"><div class="bar-head"><span class="bl">' + label + (sub ? ' <small>' + sub + '</small>' : '') + '</span>' +
      '<span class="bv">' + value + '</span></div>' +
      '<div class="bar-track" aria-hidden="true"><span class="bar-base"></span><span class="bar-fill ' + (cls || '') + '" style="width:' + Math.max(1.5, pct).toFixed(1) + '%"></span></div></li>';
  }

  function renderImpact() {
    const approvedN = S.approved.size;
    const players = topPlayers();
    const maxN = players.length ? players[0].n : 1;
    const mix = [['TikTok', 40, 112], ['Instagram Reels', 30, 84], ['YouTube Shorts', 30, 84]];
    const animate = reduceMotion() ? '' : ' is-animate';

    view.innerHTML =
      '<section class="impact" aria-labelledby="i-title">' +
        '<div>' +
          '<p class="eyebrow">Impact</p>' +
          '<h1 class="h1" id="i-title" tabindex="-1">Why it’s worth it</h1>' +
          '<p class="lede">A small content team that publishes like a studio. AI drafts; your team presses send.</p>' +
        '</div>' +
        '<div class="kpis">' +
          '<div class="card kpi"><span class="kpi-num">280</span><span class="kpi-label">drafts / week</span>' +
            '<span class="kpi-sub">40 a day for staff to review <span class="est">Est.</span></span></div>' +
          '<div class="card kpi"><span class="kpi-num">~90</span><span class="kpi-label">hrs saved / week</span>' +
            '<span class="kpi-sub">280 drafts × ~20 min each <span class="est">Est.</span></span></div>' +
          '<div class="card kpi"><span class="kpi-num">≈86%</span><span class="kpi-label">lower cost</span>' +
            '<span class="kpi-sub">than one content hire <span class="est">Est.</span></span></div>' +
          '<div class="card kpi kpi-live"><span class="kpi-num" id="kpi-approved">' + approvedN + '</span>' +
            '<span class="kpi-label">Drafts you approved this session</span>' +
            '<span class="kpi-sub">' + (approvedN ? 'Live from your clicks in Studio' : 'Approve a draft in Studio to count it') + '</span></div>' +
        '</div>' +

        '<div class="impact-grid">' +
          '<div class="card chart span-2">' +
            '<div><h2 class="h2">Cost per year</h2><p class="chart-sub">Content Machine vs. one content hire (salary + ~25% benefits and taxes) <span class="est">Est.</span></p></div>' +
            '<ul class="bars' + animate + '">' +
              barRow('One content hire', '', '≈ $125K / yr', 100, 'is-muted') +
              barRow('Content Machine', 'AI + data access + hosting', '≈ $18K / yr', 18 / 125 * 100, 'is-accent') +
            '</ul>' +
            '<p class="savings">' + icon('check', 'ic') + '<span><strong>≈86% lower</strong> · about $107K a year back in the budget</span></p>' +
          '</div>' +

          '<div class="card chart">' +
            '<div><h2 class="h2">Top players by fan buzz</h2><p class="chart-sub">Mentions from r/PWHL comments in this demo · ties ranked by upvotes</p></div>' +
            (players.length ? '<ul class="bars' + animate + '">' +
              players.map((pl) => barRow(esc(pl.name), '▲' + fmt(pl.up), pl.n + (pl.n === 1 ? ' mention' : ' mentions'), pl.n / maxN * 100, 'is-ice')).join('') +
            '</ul>' : '<p class="muted">No player mentions in this demo data.</p>') +
          '</div>' +

          '<div class="card chart">' +
            '<div><h2 class="h2">Planned platform mix</h2><p class="chart-sub">How we plan to split the 280 weekly drafts <span class="est">Planned</span></p></div>' +
            '<ul class="bars' + animate + '">' +
              mix.map((x) => barRow(x[0], '~' + x[2] + ' / week', x[1] + '%', x[1] / 40 * 100, 'is-accent')).join('') +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<p class="footnote">Estimates for the pitch; see our deck appendix. Fan comments are real, from public Reddit threads.</p>' +
      '</section>';
  }

  // ---------------------------------------------------------------- toast
  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = '';
    el.classList.remove('show');
    clearTimeout(toastTimer);
    requestAnimationFrame(() => {
      el.textContent = msg;
      el.classList.add('show');
      toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
    });
  }

  // --------------------------------------------------------------- router
  const TITLES = { trending: 'Trending', studio: 'Studio', impact: 'Impact' };

  function parseHash() {
    let h = (location.hash || '').replace(/^#\/?/, '').split(/[?&]/)[0];
    try { h = decodeURIComponent(h); } catch (e) { /* malformed escape: use it raw */ }
    const parts = h.split('/');
    const tab = parts[0].toLowerCase();
    if (tab === 'studio') return { tab: 'studio', id: parts[1] || null };
    if (tab === 'impact') return { tab: 'impact' };
    return { tab: 'trending' };
  }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function updateTabs() {
    $$('[data-tab]').forEach((a) => {
      const on = a.dataset.tab === S.tab;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      if (a.dataset.tab === 'studio') a.setAttribute('href', S.lastMomentId && momentById(S.lastMomentId) ? '#studio/' + S.lastMomentId : '#studio');
    });
  }

  let routedHash = null;
  const scrollMem = {};
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }

  function route() {
    const r = parseHash();
    if (routedHash !== null) scrollMem[S.tab] = window.scrollY;
    cancelRun();
    destroyFrame();
    S.tab = r.tab;
    if (!DATA_OK) {
      renderDataError();
    } else if (r.tab === 'impact') {
      renderImpact();
    } else if (r.tab === 'studio') {
      let id = r.id;
      if (!id && S.lastMomentId && momentById(S.lastMomentId)) {
        id = S.lastMomentId;
        try { history.replaceState(null, '', '#studio/' + id); } catch (e) { /* ignore */ }
      }
      renderStudio(id, Boolean(r.id) && !momentById(r.id));
    } else {
      renderTrending();
    }
    updateTabs();
    const m = r.tab === 'studio' ? currentMoment() : null;
    document.title = (m ? m.title + ' · ' : '') + TITLES[S.tab] + ' · Content Machine';
    routedHash = location.hash;
    // Back to Trending (browser back, or the tab): return to the card you left.
    window.scrollTo(0, S.tab === 'trending' ? (scrollMem.trending || 0) : 0);
  }

  // ---------------------------------------------------------------- events
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (t && !t.disabled) {
      const a = t.dataset.action;
      if (a === 'gen' || a === 'pick') { openStudio(t.dataset.id, true); return; }
      if (a === 'filter') { setFilter(t.dataset.filter); return; }
      if (a === 'expand') { toggleCard(t.dataset.id); return; }
      if (a === 'try') {
        const input = $('#paste-in');
        if (input) input.value = t.dataset.q;
        submitFinder(t.dataset.q);
        return;
      }
      if (a === 'generate') { const m = currentMoment(); if (m) startRun(m); return; }
      if (a === 'platform') { setPlatform(t.dataset.p); return; }
      if (a === 'regen') { regenerate(); return; }
      if (a === 'approve') { approve(); return; }
      if (a === 'next') { nextMoment(); return; }
      if (a === 'reset-cap') {
        const m = currentMoment();
        if (!m) return;
        const rk = draftKey(m.id, S.platform, variantOf(m.id, S.platform));
        delete S.edits[rk];
        S.approved.delete(rk);
        save();
        updateDraft(m);
        const ta = $('#cap-input');
        if (ta) ta.focus();
        return;
      }
      if (a === 'toggle-steps') {
        const p = $('#pipeline');
        if (!p) return;
        const collapsed = p.classList.toggle('is-collapsed');
        t.textContent = collapsed ? 'Show steps' : 'Hide steps';
        t.setAttribute('aria-expanded', String(!collapsed));
        return;
      }
    }
    // Tapping a moment card (outside its buttons and links) expands its quotes.
    const card = e.target.closest('.mcard');
    if (card && !e.target.closest('a, button, input, textarea')) {
      const sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length) return;
      toggleCard(card.dataset.card);
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'finder') {
      e.preventDefault();
      const input = $('#paste-in');
      submitFinder(input ? input.value : '');
    }
  });

  let editSaveTimer = 0;
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'cap-input') {
      const m = currentMoment();
      if (!m) return;
      const p = S.platform;
      const v = variantOf(m.id, p);
      const d = draftOf(m, p, v);
      const val = e.target.value;
      const key = draftKey(m.id, p, v);
      if (val === d.caption) delete S.edits[key]; else S.edits[key] = val;
      const capText = $('#pui [data-captext]');
      if (capText) capText.textContent = val;
      updateCapMeta(val, val !== d.caption);
      if (S.approved.has(key)) {
        S.approved.delete(key);
        updateDraft(m, { keepCaption: true });
      }
      clearTimeout(editSaveTimer);
      editSaveTimer = setTimeout(save, 300);
    } else if (e.target && e.target.id === 'paste-in') {
      const hint = $('#finder-hint');
      if (hint && hint.textContent) hint.textContent = '';
    }
  });

  // Broken or missing images fall back to the gradient placeholder.
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (el && el.tagName === 'IMG') {
      const box = el.closest('.thumb, .media');
      if (box) box.classList.add('img-failed');
    }
  }, true);

  // A fast double tap can route synchronously before the queued hashchange arrives;
  // routing the same hash twice would cancel the run that just started.
  window.addEventListener('hashchange', () => { if (location.hash !== routedHash) route(); });

  // ---------------------------------------------------------------- intro
  function showIntro() {
    const intro = $('#intro');
    if (!intro) return;
    let skip = false;
    try { skip = new URLSearchParams(location.search).has('nointro'); } catch (e) { skip = /[?&]nointro\b/.test(location.search); }
    if (skip || store.get('sessionStorage', 'cm.introSeen', false)) { intro.hidden = true; return; }
    const behind = ['#topbar', '#main', '.tabbar'].map((s) => $(s)).filter(Boolean);
    behind.forEach((el) => { el.inert = true; el.setAttribute('aria-hidden', 'true'); });
    intro.hidden = false;
    const btn = $('#intro-start');
    const close = () => {
      if (intro.hidden) return;
      store.set('sessionStorage', 'cm.introSeen', true);
      behind.forEach((el) => { el.inert = false; el.removeAttribute('aria-hidden'); });
      document.removeEventListener('keydown', onKey);
      const done = () => { intro.hidden = true; intro.classList.remove('intro-leave'); };
      if (reduceMotion()) done();
      else { intro.classList.add('intro-leave'); setTimeout(done, 260); }
      const h = $('#view h1');
      if (h) h.focus({ preventScroll: true });
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); if (btn) btn.focus(); }
    };
    if (btn) {
      btn.addEventListener('click', close);
      let fine = true;
      try { fine = window.matchMedia('(pointer: fine)').matches; } catch (e) { /* keep default */ }
      if (fine) setTimeout(() => btn.focus({ preventScroll: true }), 50);
    }
    document.addEventListener('keydown', onKey);
  }

  // ----------------------------------------------------------------- boot
  const DATA_OK = ranked.length > 0;
  function renderDataError() {
    view.innerHTML = '<div class="card data-error"><h1 class="h2">The demo data didn’t load</h1>' +
      '<p class="muted">Check that data/data.js sits next to index.html, then reload.</p>' +
      '<button type="button" class="btn btn-primary" onclick="location.reload()">Reload</button></div>';
  }

  try { route(); } catch (e) {
    try { S.tab = 'trending'; renderTrending(); updateTabs(); } catch (e2) { /* leave the shell */ }
  }
  showIntro();
})();
