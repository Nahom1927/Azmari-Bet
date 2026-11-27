/* azbui: dropdown professions, compact buttons, slideshow, 10-minute rotation */
(function () {
  'use strict';
  var acts = [], slide = 0, bucket = -1, ROT = 600000, tm = 0, pend = 0;
  function db() { return window.azSupabase || (window.S && window.S.sb); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function photos(a) {
    var p = a.photos; if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = [p]; } }
    if (!Array.isArray(p)) return [];
    return p.map(function (x) { return typeof x === 'string' ? x : (x && x.url) || ''; }).filter(function (u) { return /^https?:\/\//i.test(u) || /^data:image\//i.test(u); });
  }
  function rotated() {
    var n = acts.length; if (!n) return [];
    var o = Math.floor(Date.now() / ROT) % n; return acts.slice(o).concat(acts.slice(0, o));
  }
  var st = document.createElement('style');
  st.textContent =
    'html.azu-on .azb-chip{display:none!important}' +
    '.azu-sel{width:100%;max-width:340px;box-sizing:border-box;margin:8px 0;padding:9px 34px 9px 12px;border-radius:12px;border:1px solid #00e5ff;background:#030712;color:#e8f6ff;font-size:14px;font-weight:700;appearance:none;-webkit-appearance:none;background-image:linear-gradient(45deg,transparent 50%,#1d4ed8 50%),linear-gradient(135deg,#1d4ed8 50%,transparent 50%);background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;background-size:5px 5px;background-repeat:no-repeat;box-shadow:0 0 12px #00e5ff33}' +
    '.azu-bar{display:flex!important;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.azu-sm{padding:5px 12px!important;font-size:12px!important;line-height:1.3!important;border-radius:10px!important;letter-spacing:.3px;font-weight:700!important;margin:0!important;box-shadow:0 1px 6px #00e5ff33}' +
    '.azu-hero{position:relative;height:210px;border-radius:18px;overflow:hidden;border:2px solid #1d4ed8;box-shadow:0 0 0 3px #030712,0 0 0 4px #00e5ff,0 0 22px #00e5ff44;margin:12px 0;background:#030712}' +
    '.azu-sl{position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease}.azu-sl.on{opacity:1}' +
    '.azu-bg{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.04)}' +
    '.azu-sl.on .azu-bg{animation:azuk 9s ease-out forwards}' +
    '@keyframes azuk{to{transform:scale(1.18)}}' +
    '.azu-sh{position:absolute;inset:0;background:linear-gradient(0deg,#030712f2 0,#03071200 62%)}' +
    '.azu-cap{position:absolute;left:14px;right:14px;bottom:26px;color:#e8f6ff}' +
    '.azu-tg{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#00e5ff}' +
    '.azu-nm{font-family:Georgia,serif;font-size:24px;color:#e8f6ff;text-shadow:0 0 12px #00e5ff99;margin:2px 0}' +
    '.azu-mt{font-size:12px;opacity:.85}' +
    '.azu-dots{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:6px}' +
    '.azu-dots i{width:7px;height:7px;border-radius:50%;background:#e8f6ff55;transition:all .3s}' +
    '.azu-dots i.on{width:20px;border-radius:4px;background:linear-gradient(90deg,#1d4ed8,#00e5ff)}' +
    '@media (prefers-reduced-motion:reduce){.azu-sl.on .azu-bg{animation:none}.azu-sl{transition:none}}';
  document.head.appendChild(st);

  function buildHero() {
    var old = document.getElementById('azu-hero');
    var list = rotated().slice(0, 8);
    list.sort(function (a, b) { return (photos(b).length ? 1 : 0) - (photos(a).length ? 1 : 0); });
    if (!list.length) { if (old) old.remove(); return; }
    var h = document.createElement('div'); h.className = 'azu-hero'; h.id = 'azu-hero';
    h.setAttribute('data-n', list.length);
    h.innerHTML = list.map(function (a, i) {
      var p = photos(a)[0];
      var bg = p ? 'background-image:url(&quot;' + esc(p) + '&quot;)' : 'background:linear-gradient(135deg,#07122b,#0b2a4a 55%,#0a1a5c)';
      return '<div class="azu-sl' + (i === 0 ? ' on' : '') + '"><div class="azu-bg" style="' + bg + '"></div><div class="azu-sh"></div>' +
        '<div class="azu-cap"><span class="azu-tg">' + esc(a.kind || '') + (a.city ? ' \u00B7 ' + esc(a.city) : '') + '</span><div class="azu-nm">' + esc(a.name) + '</div>' +
        '<div class="azu-mt">' + esc(a.genre || '') + (a.price_from ? ' \u00B7 from ' + esc(a.price_from) : '') + '</div></div></div>';
    }).join('') + '<div class="azu-dots">' + list.map(function (a, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';
    slide = 0;
    if (old) old.replaceWith(h); else place(h);
  }
  function place(h) {
    var sel = document.querySelector('.azu-sel'), c = document.querySelector('.azb-card');
    var ref = sel || c; if (ref) ref.before(h);
  }
  function next() {
    if (document.hidden) return;
    var h = document.getElementById('azu-hero'); if (!h) return;
    var s = h.querySelectorAll('.azu-sl'), d = h.querySelectorAll('.azu-dots i'); if (s.length < 2) return;
    s[slide].classList.remove('on'); d[slide].classList.remove('on');
    slide = (slide + 1) % s.length;
    s[slide].classList.add('on'); d[slide].classList.add('on');
  }

  function dropdown() {
    var chips = document.querySelectorAll('.azb-chip'); if (!chips.length) return;
    var par = chips[0].parentNode, sel = par.querySelector('.azu-sel'), on = 0;
    chips.forEach(function (c, i) { if (c.classList.contains('on')) on = i; });
    if (sel) { sel.selectedIndex = on; return; }
    sel = document.createElement('select'); sel.className = 'azu-sel'; sel.setAttribute('aria-label', 'Profession');
    sel.innerHTML = [].map.call(chips, function (c, i) { return '<option value="' + i + '">' + esc(c.textContent.trim()) + '</option>'; }).join('');
    sel.selectedIndex = on;
    sel.onchange = function () { var cs = document.querySelectorAll('.azb-chip'), c = cs[+sel.value]; if (c) c.click(); };
    chips[0].before(sel);
    document.documentElement.classList.add('azu-on');
  }
  function buttons() {
    var bs = document.querySelectorAll('button'), par = null;
    bs.forEach(function (b) {
      var t = b.textContent.trim();
      if (/^\+\s*Register your/i.test(t) || /^My booking requests/i.test(t)) { b.classList.add('azu-sm'); par = b.parentNode; }
    });
    if (par && !par.classList.contains('azu-bar')) par.classList.add('azu-bar');
  }
  function rank(c, rk) { var n = c.querySelector('.azb-name'); var v = n ? rk[n.textContent.trim()] : null; return v == null ? 999 : v; }
  function reorder() {
    var cards = [].slice.call(document.querySelectorAll('.azb-card')); if (cards.length < 2 || !acts.length) return;
    var p = cards[0].parentNode; if (!cards.every(function (c) { return c.parentNode === p; })) return;
    var rk = {}; rotated().forEach(function (a, i) { rk[String(a.name).trim()] = i; });
    var sorted = cards.slice().sort(function (x, y) { return rank(x, rk) - rank(y, rk); });
    if (sorted.every(function (c, i) { return c === cards[i]; })) return;
    var ref = document.createComment(''); p.insertBefore(ref, cards[0]);
    sorted.forEach(function (c) { p.insertBefore(c, ref); }); ref.remove();
  }
  function run() {
    pend = 0;
    try {
      dropdown(); buttons();
      var b = Math.floor(Date.now() / ROT);
      if (acts.length && (b !== bucket || !document.getElementById('azu-hero'))) { bucket = b; buildHero(); }
      reorder();
    } catch (e) {}
  }
  function sched() { if (!pend) pend = requestAnimationFrame(run); }
  try { new MutationObserver(sched).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  function load() {
    if (!db()) { setTimeout(load, 800); return; }
    db().rpc('azb_list').then(function (r) { if (r && Array.isArray(r.data)) { acts = r.data; bucket = -1; sched(); } }, function () {});
  }
  setTimeout(load, 700); setInterval(load, 120000);
  setInterval(function () { if (Math.floor(Date.now() / ROT) !== bucket) sched(); }, 30000);
  setInterval(next, 6000);
})();
