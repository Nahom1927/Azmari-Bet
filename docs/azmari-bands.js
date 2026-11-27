/* azbands: band and DJ registry with booking */
(function () {
  'use strict';
  var acts = [], kind = 'all', isAdmin = false, loaded = 0, timer = 0;
  /* azprof: more professions */
  var T = [['band','\uD83E\uDD41 Band'],['dj','\uD83C\uDFA7 DJ'],['painter','\uD83C\uDFA8 Painter'],['creator','\uD83C\uDFAC Content creator'],['photo','\uD83D\uDCF7 Photo / Video'],['mc','\uD83C\uDFA4 MC / Host'],['dancer','\uD83D\uDC83 Dancer'],['other','\u2728 Other']];
  var KINDS = [['all','All'],['band','\uD83E\uDD41 Bands'],['dj','\uD83C\uDFA7 DJs'],['painter','\uD83C\uDFA8 Painters'],['creator','\uD83C\uDFAC Creators'],['photo','\uD83D\uDCF7 Photo / Video'],['mc','\uD83C\uDFA4 MCs'],['dancer','\uD83D\uDC83 Dancers'],['other','\u2728 Other']];
  var OPTS = T.map(function (t) { return '<option value="' + t[0] + '">' + t[1].replace(/^\S+\s/, '') + '</option>'; }).join('');
  function tagOf(k) { for (var i = 0; i < T.length; i++) if (T[i][0] === k) return T[i][1]; return '\u2728 Other'; }
  function db() { return window.azSupabase; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function okPhone(v) { return /^(\+251|251|0)?[79]\d{8}$/.test(String(v || '').replace(/[\s-]/g, '')); }
  var st = document.createElement('style');
  st.textContent =
    '.azb-bar{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}' +
    '.azb-chip{border:1px solid #c9a227;background:transparent;color:inherit;border-radius:999px;padding:6px 14px;font-weight:700;cursor:pointer}' +
    '.azb-chip.on{background:linear-gradient(135deg,#b8860b,#f5d76e);color:#3b2a00}' +
    '.azb-btn{border:0;border-radius:12px;padding:10px 16px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#b8860b,#f5d76e);color:#3b2a00}' +
    '.azb-btn.azb-ghost{background:transparent;color:inherit;border:1px solid #c9a227}' +
    '.azb-btn[disabled]{opacity:.5}' +
    '.azb-card{position:relative;margin:16px 0;border-radius:18px;overflow:hidden;background:linear-gradient(160deg,#2a1608,#120a04);color:#f6e7c1;border:2px solid #c9a227;box-shadow:0 0 0 4px #120a04,0 0 0 5px #c9a22788,0 10px 24px rgba(0,0,0,.35)}' +
    '.azb-strip{height:6px;background:linear-gradient(90deg,#078930 0 33.3%,#fcdd09 33.3% 66.6%,#da121a 66.6%)}' +
    '.azb-card .azsl{margin:0;border:0;border-radius:0}' +
    '.azb-body{padding:14px 16px 16px}' +
    '.azb-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#fcdd09;border:1px solid #c9a227;border-radius:999px;padding:2px 10px}' +
    '.azb-name{font-family:Georgia,"Times New Roman",serif;font-size:24px;margin:8px 0 2px;color:#f5d76e;letter-spacing:1px}' +
    '.azb-orn{color:#c9a227;letter-spacing:8px;font-size:12px;margin:2px 0 8px}' +
    '.azb-meta{opacity:.85;font-size:13px}' +
    '.azb-mems{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}' +
    '.azb-mem{display:inline-flex;align-items:center;gap:6px;background:#ffffff14;border-radius:999px;padding:3px 10px 3px 3px;font-size:13px}' +
    '.azb-mem i{font-style:normal;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#b8860b,#f5d76e);color:#3b2a00;font-weight:800}' +
    '.azb-price{font-weight:800;color:#fcdd09;margin:6px 0}' +
    '.azb-empty{opacity:.7;text-align:center;padding:20px}' +
    '.azb-ov{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;overflow:auto;padding:16px}' +
    '.azb-md{max-width:460px;margin:0 auto;background:linear-gradient(160deg,#2a1608,#120a04);color:#f6e7c1;border:2px solid #c9a227;border-radius:16px;padding:16px}' +
    '.azb-md label{display:block;margin:10px 0 4px;font-size:13px;font-weight:700}' +
    '.azb-md input,.azb-md select,.azb-md textarea{width:100%;box-sizing:border-box;padding:9px;border-radius:8px;border:1px solid #c9a227;background:#0e0702;color:#f6e7c1;font-size:15px}' +
    '.azb-msg{margin:10px 0;color:#ffb4a8;font-size:14px}.azb-ok{color:#9be29b}' +
    '.azb-row{border-top:1px solid #c9a22755;padding:10px 0;font-size:14px}';
  document.head.appendChild(st);
  var st2 = document.createElement('style');
  st2.textContent =
    '.azb-card{background:linear-gradient(160deg,#07122b,#030712);color:#e8f6ff;border:2px solid #ffd21f;box-shadow:0 0 0 4px #030712,0 0 0 5px #00e5ff,0 0 24px #00e5ff55}' +
    '.azb-strip{background:linear-gradient(90deg,#ffd21f,#00e5ff)}' +
    '.azb-name{color:#ffd21f;text-shadow:0 0 12px #00e5ff99}' +
    '.azb-orn{color:#00e5ff}.azb-tag{color:#00e5ff;border-color:#00e5ff}.azb-price{color:#ffd21f}' +
    '.azb-chip{border-color:#00e5ff}' +
    '.azb-chip.on,.azb-btn,.azb-mem i{background:linear-gradient(135deg,#ffd21f,#00e5ff);color:#04101f}' +
    '.azb-btn.azb-ghost{background:transparent;color:inherit;border:1px solid #00e5ff}' +
    '.azb-mem{background:#00e5ff18}.azb-row{border-top-color:#00e5ff55}' +
    '.azb-md{background:linear-gradient(160deg,#07122b,#030712);color:#e8f6ff;border-color:#ffd21f;box-shadow:0 0 18px #00e5ff55}' +
    '.azb-md input,.azb-md select,.azb-md textarea{border-color:#00e5ff;background:#030712;color:#e8f6ff}';
  document.head.appendChild(st2);

  function chip(k, t) { return '<button class="azb-chip' + (kind === k ? ' on' : '') + '" data-azk="' + k + '">' + t + '</button>'; }
  var AZB_FXS = ['zin', 'pl', 'sll', 'zout', 'fade', 'pr', 'rot', 'slr', 'pu', 'kb'], AZB_FXI = 0;
  var st3 = document.createElement('style');
  st3.textContent =
    '.azb-neon{border:2px solid #27c4ff;box-shadow:0 0 0 3px #030712,0 0 0 4px #27c4ff,0 0 24px #27c4ff,inset 0 0 18px #27c4ff33;animation:azbGlow 3.2s ease-in-out infinite}' +
    '@keyframes azbGlow{0%,100%{box-shadow:0 0 0 3px #030712,0 0 0 4px #27c4ff,0 0 14px #27c4ff99,inset 0 0 12px #27c4ff22}50%{box-shadow:0 0 0 3px #030712,0 0 0 4px #5fd8ff,0 0 30px #27c4ff,inset 0 0 22px #27c4ff44}}' +
    '.azb-neon .azb-name{color:#fff;text-shadow:0 0 10px #27c4ff,0 0 22px #27c4ff88;display:flex;align-items:center;gap:8px}' +
    '.azb-tick{flex:none;filter:drop-shadow(0 0 6px #27c4ff)}' +
    '.azb-sub2{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#27c4ff;margin:-2px 0 6px}' +
    '.azb-ss{position:relative;height:240px;overflow:hidden;background:#000;border-bottom:1px solid #27c4ff}' +
    '.azb-sl{position:absolute;inset:0;opacity:0;transition:opacity .9s ease;overflow:hidden}.azb-sl.on{opacity:1}' +
    '.azb-sl img{width:100%;height:100%;object-fit:cover;display:block;transform-origin:center}' +
    '.fx-kb img{animation:azbKb 6s linear forwards}.fx-zin img{animation:azbZin 6s ease-out forwards}.fx-zout img{animation:azbZout 6s ease-out forwards}' +
    '.fx-pl img{animation:azbPl 6s linear forwards}.fx-pr img{animation:azbPr 6s linear forwards}.fx-pu img{animation:azbPu 6s linear forwards}.fx-rot img{animation:azbRot 6s ease-out forwards}' +
    '.azb-sl.on.fx-sll{transition:none;animation:azbSL .9s ease-out}.azb-sl.on.fx-slr{transition:none;animation:azbSR .9s ease-out}' +
    '.azb-sl.fx-sll img,.azb-sl.fx-slr img{animation:azbZin 6s linear forwards}.azb-sl.on.fx-fade{transition:opacity 1.6s}' +
    '@keyframes azbKb{from{transform:scale(1.05) translate(-2%,-1%)}to{transform:scale(1.2) translate(2%,1%)}}' +
    '@keyframes azbZin{from{transform:scale(1)}to{transform:scale(1.2)}}@keyframes azbZout{from{transform:scale(1.22)}to{transform:scale(1)}}' +
    '@keyframes azbPl{from{transform:scale(1.15) translateX(4%)}to{transform:scale(1.15) translateX(-4%)}}@keyframes azbPr{from{transform:scale(1.15) translateX(-4%)}to{transform:scale(1.15) translateX(4%)}}' +
    '@keyframes azbPu{from{transform:scale(1.15) translateY(4%)}to{transform:scale(1.15) translateY(-4%)}}@keyframes azbRot{from{transform:scale(1.25) rotate(2deg)}to{transform:scale(1) rotate(0)}}' +
    '@keyframes azbSL{from{transform:translateX(100%)}to{transform:none}}@keyframes azbSR{from{transform:translateX(-100%)}to{transform:none}}' +
    '@media (prefers-reduced-motion:reduce){.azb-sl,.azb-sl img,.azb-neon{animation:none!important}}' +
    '.azb-dots{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:6px;z-index:3}' +
    '.azb-dots i{width:7px;height:7px;border-radius:50%;background:#ffffff66}.azb-dots i.on{background:#27c4ff;box-shadow:0 0 8px #27c4ff}' +
    '.azb-info{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin:10px 0}' +
    '.azb-it{background:#27c4ff14;border:1px solid #27c4ff44;border-radius:10px;padding:6px 10px;font-size:13px;word-break:break-word}' +
    '.azb-it b{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#27c4ff;margin-bottom:2px}' +
    '.azb-h{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#27c4ff;margin:12px 0 4px}' +
    '.azb-vid{width:100%;border-radius:12px;border:1px solid #27c4ff;margin:10px 0;max-height:320px;background:#000}' +
    '.azb-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.azb-acts a.azb-btn{text-decoration:none;display:inline-block;color:inherit}';
  document.head.appendChild(st3);
  function azbTick() {
    var now = Date.now();
    document.querySelectorAll('.azb-ss').forEach(function (el) {
      var sl = el.querySelectorAll('.azb-sl');
      if (sl.length < 2 || (el._p && el._p > now)) return;
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var i = +el.getAttribute('data-i') || 0, n = (i + 1) % sl.length, nx = sl[n];
      sl[i].classList.remove('on');
      nx.className = 'azb-sl'; void nx.offsetWidth;
      AZB_FXI = (AZB_FXI + 1) % AZB_FXS.length;
      nx.className = 'azb-sl on fx-' + AZB_FXS[AZB_FXI];
      el.setAttribute('data-i', n);
      el.querySelectorAll('.azb-dots i').forEach(function (d, k) { d.className = k === n ? 'on' : ''; });
    });
  }
  if (!window.__azbSS) {
    window.__azbSS = 1;
    setInterval(azbTick, 4500);
    document.addEventListener('pointerdown', function (e) { var s = e.target && e.target.closest && e.target.closest('.azb-ss'); if (s) s._p = Date.now() + 9000; }, true);
  }
  var AZB_TICK = '<svg class="azb-tick" viewBox="0 0 24 24" width="22" height="22" role="img" aria-label="Verified by admin"><circle cx="12" cy="12" r="11" fill="#27c4ff"/><path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#04101f" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function cardNew(a) {
    var ph = (Array.isArray(a.photos) ? a.photos : []).filter(Boolean), ss = '';
    if (ph.length) ss = '<div class="azb-ss" data-i="0">' + ph.map(function (u, i) { return '<div class="azb-sl' + (i === 0 ? ' on fx-kb' : '') + '"><img src="' + esc(u) + '" alt="Photo ' + (i + 1) + '"' + (i ? ' loading="lazy"' : '') + '></div>'; }).join('') + (ph.length > 1 ? '<div class="azb-dots">' + ph.map(function (u, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' : '') + '</div>';
    var mem = (Array.isArray(a.members) ? a.members : []).map(function (m) { return '<span class="azb-mem"><i>' + esc(String(m.name || '?').charAt(0).toUpperCase()) + '</i>' + esc(m.name) + (m.role ? ' \u00B7 ' + esc(m.role) : '') + '</span>'; }).join('');
    function it(l, v) { return v ? '<div class="azb-it"><b>' + l + '</b>' + esc(v) + '</div>' : ''; }
    var info = it('\uD83D\uDCCD Location', a.city) + it('\uD83C\uDFB5 Genre', a.genre) + it('\uD83C\uDF89 Events', a.event_types) + it('\uD83D\uDCB0 Starting price', a.price_from ? a.price_from + ' birr' : '') + it('\uD83D\uDC64 Leader', a.leader_name);
    var vid = /^https:\/\//i.test(a.video_url || '') ? '<video class="azb-vid" controls preload="metadata" playsinline src="' + esc(a.video_url) + '"></video>' : '';
    var pf = /^https?:\/\//i.test(a.portfolio || '') ? '<a class="azb-btn azb-ghost" target="_blank" rel="noopener" href="' + esc(a.portfolio) + '">\uD83D\uDD17 Portfolio / social</a>' : '';
    return '<div class="azb-card azb-neon"><div class="azb-strip"></div>' + ss + '<div class="azb-body">' +
      '<span class="azb-tag">' + tagOf(a.kind) + '</span>' +
      '<h3 class="azb-name">' + esc(a.name) + AZB_TICK + '</h3><div class="azb-sub2">Verified by admin</div>' +
      (info ? '<div class="azb-info">' + info + '</div>' : '') +
      (a.about ? '<div class="azb-h">About</div><p class="azb-meta" style="margin:4px 0">' + esc(a.about) + '</p>' : '') +
      (mem ? '<div class="azb-h">Band members</div><div class="azb-mems">' + mem + '</div>' : '') + vid +
      '<div class="azb-acts"><button class="azb-btn" data-azb="book" data-id="' + esc(a.id) + '" data-name="' + esc(a.name) + '">Book now</button>' + pf + '</div></div></div>';
  }
  var st4 = document.createElement('style');
  st4.textContent = `
.azb-card.azb-neon{border:1px solid #27c4ff;box-shadow:0 0 14px #27c4ff88;animation:azbGlow2 3.2s ease-in-out infinite}
@keyframes azbGlow2{0%,100%{box-shadow:0 0 10px #27c4ff66}50%{box-shadow:0 0 26px #27c4ff}}
.azb-card .azb-strip{display:none}
.azb-ss{border-bottom:0}
.azb-it{border:0;background:#27c4ff12}
.azb-md{border:1px solid #27c4ff;box-shadow:0 0 18px #27c4ff66}
.azb-md input,.azb-md textarea{border:1px solid #27c4ff44;border-radius:8px}
.azb-md input:focus,.azb-md textarea:focus,.azb-md select:focus{outline:0;border-color:#27c4ff;box-shadow:0 0 8px #27c4ff88}
.azb-md input[type=checkbox]{width:auto}
.azb-md select{-webkit-appearance:none;appearance:none;width:auto;min-width:150px;max-width:100%;height:34px;padding:0 30px 0 10px;font-size:13px;font-weight:600;border:1px solid #27c4ff66;border-radius:8px;cursor:pointer;background:#030712 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%2327c4ff' stroke-width='1.6'/%3E%3C/svg%3E") no-repeat right 10px center}
.azb-md option{background:#030712;color:#e8f6ff}
.azb-chip{border-color:#27c4ff66;padding:5px 12px;font-size:13px}
`;
  document.head.appendChild(st4);
  var st5 = document.createElement('style');
  st5.textContent = `
select.azu-sel{-webkit-appearance:none!important;appearance:none!important;height:32px!important;min-height:0!important;width:auto!important;min-width:130px;max-width:100%;padding:0 28px 0 12px!important;font-size:13px!important;font-weight:600!important;line-height:32px;color:#e8f6ff!important;border:1px solid #27c4ff66!important;border-radius:999px!important;cursor:pointer;background:#030712 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%2327c4ff' stroke-width='1.6'/%3E%3C/svg%3E") no-repeat right 10px center!important;box-shadow:0 0 8px #27c4ff33!important}
select.azu-sel:focus{outline:0;border-color:#27c4ff!important;box-shadow:0 0 10px #27c4ff99!important}
select.azu-sel option{background:#030712;color:#e8f6ff}
`;
  document.head.appendChild(st5);
  function card(a) { return cardNew(a); }
  function cardOld(a) {
    var ph = Array.isArray(a.photos) ? a.photos : [];
    var sl = ph.length ? '<div class="azsl az16" data-n="' + ph.length + '">' + ph.map(function (u, i) { return '<div class="azsl-i"><img src="' + esc(u) + '" alt="Photo ' + (i + 1) + '" loading="lazy"></div>'; }).join('') + '</div>' : '';
    var mem = (Array.isArray(a.members) ? a.members : []).map(function (m) { return '<span class="azb-mem"><i>' + esc(String(m.name || '?').charAt(0).toUpperCase()) + '</i>' + esc(m.name) + (m.role ? ' \u00B7 ' + esc(m.role) : '') + '</span>'; }).join('');
    return '<div class="azb-card"><div class="azb-strip"></div>' + sl + '<div class="azb-body">' +
      '<span class="azb-tag">' + tagOf(a.kind) + '</span>' +
      '<h3 class="azb-name">' + esc(a.name) + '</h3><div class="azb-orn">\u25C6 \u2756 \u25C6</div>' +
      '<div class="azb-meta">' + esc([a.genre, a.city].filter(Boolean).join(' \u00B7 ')) + (a.leader_name ? '<br>Leader: ' + esc(a.leader_name) : '') + '</div>' +
      (mem ? '<div class="azb-mems">' + mem + '</div>' : '') +
      (a.price_from ? '<div class="azb-price">From ' + esc(a.price_from) + ' birr</div>' : '') +
      (a.event_types ? '<div class="azb-meta">Events: ' + esc(a.event_types) + '</div>' : '') +
      (a.about ? '<p class="azb-meta" style="margin:8px 0">' + esc(a.about) + '</p>' : '') + (/^https?:\/\//i.test(a.portfolio || '') ? '<div class="azb-meta"><a style="color:#00e5ff" target="_blank" rel="noopener" href="' + esc(a.portfolio) + '">\uD83D\uDD17 Portfolio / social</a></div>' : '') +
      '<button class="azb-btn" data-azb="book" data-id="' + esc(a.id) + '" data-name="' + esc(a.name) + '">Book now</button></div></div>';
  }
  function html() {
    var list = acts.filter(function (a) { return (kind === 'all' || a.kind === kind) && azbOk(a); });
    var h = '<div class="azb-bar">' + KINDS.map(function (k) { return chip(k[0], k[1]); }).join('') + '</div>' +
      '<div class="azb-bar"><button class="azb-btn" data-azb="reg">+ Register your page</button><button class="azb-btn azb-ghost" data-azb="req">My booking requests</button>' +
      (isAdmin ? '<button class="azb-btn azb-ghost" data-azb="adm">Admin: approve</button>' : '') + '</div>';
    if (!list.length) h += '<p class="azb-empty">No approved pages here yet. Be the first to register.</p>';
    list.forEach(function (a) { h += card(a); });
    return h;
  }
  function draw() { document.querySelectorAll('.azb-root').forEach(function (r) { r.innerHTML = html(); }); }
  function load() {
    if (!db()) return;
    db().rpc('azb_list').then(function (r) { if (!r.error && Array.isArray(r.data)) { acts = r.data; draw(); } }, function () {});
    db().rpc('azb_admin_pending').then(function (r) { isAdmin = !r.error; draw(); }, function () {});
  }
  function mount() {
    var hs = document.querySelectorAll('h2');
    for (var i = 0; i < hs.length; i++) {
      if (hs[i].textContent.trim() !== 'Bands') continue;
      if (document.querySelector('.azb-root')) return;
      var root = document.createElement('div'); root.className = 'azb-root';
      var a = hs[i], n = a.nextElementSibling;
      if (n && n.classList.contains('azsl')) a = n;
      a.after(root); root.innerHTML = html(); load(); return;
    }
  }
  new MutationObserver(function () { if (timer) return; timer = setTimeout(function () { timer = 0; mount(); }, 150); }).observe(document.body, { childList: true, subtree: true });
  setTimeout(mount, 800);

  function modal(inner) {
    var o = document.createElement('div'); o.className = 'azb-ov';
    o.innerHTML = '<div class="azb-md">' + inner + '</div>';
    o.addEventListener('click', function (e) { if (e.target === o || e.target.getAttribute('data-azb') === 'x') o.remove(); });
    document.body.appendChild(o); return o;
  }
  function fld(id, label, ph, type) { return '<label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + (type || 'text') + '" placeholder="' + ph + '" maxlength="120">'; }
  function cropUp(file, uid, i) {
    return new Promise(function (res, rej) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () {
        var W = 1280, H = 560, c = document.createElement('canvas'); c.width = W; c.height = H;
        var k = Math.max(W / im.width, H / im.height), w = im.width * k, h = im.height * k;
        c.getContext('2d').drawImage(im, (W - w) / 2, (H - h) / 2, w, h); URL.revokeObjectURL(u);
        c.toBlob(function (b) {
          if (!b) { rej(new Error('Photo could not be processed')); return; }
          var path = uid + '/act-' + Date.now() + '-' + i + '.jpg';
          db().storage.from('azs-photos').upload(path, b, { contentType: 'image/jpeg', cacheControl: '31536000' }).then(function (r) {
            if (r.error) { rej(r.error); return; }
            res(db().storage.from('azs-photos').getPublicUrl(path).data.publicUrl);
          }, rej);
        }, 'image/jpeg', 0.8);
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('One file is not a valid image')); };
      im.src = u;
    });
  }
  var AZB_W = 1600, AZB_H = 700;
  var AZB_FX = {
    orig: { n: 'Original' },
    vivid: { n: 'Vivid', br: 1.03, ct: 1.12, sat: 1.35 },
    warm: { n: 'Warm', br: 1.04, ct: 1.05, sat: 1.1, tint: [14, 4, -12] },
    cool: { n: 'Cool', br: 1.02, ct: 1.06, sat: 1.05, tint: [-10, 2, 16] },
    bw: { n: 'B&W', gray: 1, ct: 1.15 },
    fade: { n: 'Fade', br: 1.08, ct: 0.82, sat: 0.85, tint: [8, 8, 10] },
    sepia: { n: 'Sepia', sep: 0.85, ct: 1.05 },
    neon: { n: 'Neon', br: 0.97, ct: 1.2, sat: 1.4, tint: [-12, 6, 30] }
  };
  function azbFx(ctx, w, h, key) {
    var f = AZB_FX[key]; if (!f || key === 'orig') return;
    var im = ctx.getImageData(0, 0, w, h), d = im.data, i, r, g, b, l;
    var br = f.br || 1, ct = f.ct || 1, sat = f.sat == null ? 1 : f.sat, gr = f.gray || 0, sp = f.sep || 0, tn = f.tint || [0, 0, 0];
    for (i = 0; i < d.length; i += 4) {
      r = d[i]; g = d[i + 1]; b = d[i + 2];
      if (gr) { l = .299 * r + .587 * g + .114 * b; r += (l - r) * gr; g += (l - g) * gr; b += (l - b) * gr; }
      if (sat !== 1) { l = .299 * r + .587 * g + .114 * b; r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
      if (sp) { var sr = .393 * r + .769 * g + .189 * b, sg = .349 * r + .686 * g + .168 * b, sb = .272 * r + .534 * g + .131 * b; r += (sr - r) * sp; g += (sg - g) * sp; b += (sb - b) * sp; }
      d[i] = ((r - 128) * ct + 128) * br + tn[0];
      d[i + 1] = ((g - 128) * ct + 128) * br + tn[1];
      d[i + 2] = ((b - 128) * ct + 128) * br + tn[2];
    }
    ctx.putImageData(im, 0, 0);
  }
  function azbImg(file) {
    return new Promise(function (res, rej) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('One file is not a valid image (iPhone HEIC is not supported, use Most Compatible)')); };
      im.src = u;
    });
  }
  function azbLoad(file) {
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return azbImg(file); });
    return azbImg(file);
  }
  function azbDraw(c, src, st, W, H) {
    var ctx = c.getContext('2d'); c.width = W; c.height = H;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    var k = Math.max(W / src.width, H / src.height) * (st.z || 1), w = src.width * k, h = src.height * k;
    ctx.drawImage(src, (W - w) * st.px, (H - h) * st.py, w, h);
    azbFx(ctx, W, H, st.fx);
  }
  function azbAuto(c) {
    var w = c.width, h = c.height, x = c.getContext('2d'), im = x.getImageData(0, 0, w, h), d = im.data, hist = new Uint32Array(256), i, l, r, g, b;
    for (i = 0; i < d.length; i += 4) hist[(.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) | 0]++;
    var lo = 0, hi = 255, acc = 0, t = w * h * .005;
    for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > t) { lo = i; break; } }
    acc = 0;
    for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > t) { hi = i; break; } }
    lo = Math.min(lo, 40); hi = Math.max(hi, 215);
    var lut = new Uint8ClampedArray(256), k = 255 / (hi - lo);
    for (i = 0; i < 256; i++) lut[i] = (i - lo) * k;
    for (i = 0; i < d.length; i += 4) {
      r = lut[d[i]]; g = lut[d[i + 1]]; b = lut[d[i + 2]]; l = .299 * r + .587 * g + .114 * b;
      d[i] = l + (r - l) * 1.08; d[i + 1] = l + (g - l) * 1.08; d[i + 2] = l + (b - l) * 1.08;
    }
    var src = new Uint8ClampedArray(d), row = w * 4, y, xx, j, ch, v;
    for (y = 1; y < h - 1; y++) for (xx = 1; xx < w - 1; xx++) {
      j = (y * w + xx) * 4;
      for (ch = 0; ch < 3; ch++) { v = src[j + ch]; d[j + ch] = v + .35 * (4 * v - src[j - 4 + ch] - src[j + 4 + ch] - src[j - row + ch] - src[j + row + ch]); }
    }
    x.putImageData(im, 0, 0);
  }
  function azbBlob2(c, orig) {
    var cap = Math.min(orig || 2600000, 2600000);
    return new Promise(function (res, rej) {
      var q = 0.9;
      (function t() {
        c.toBlob(function (b) {
          if (!b) { rej(new Error('Photo could not be processed')); return; }
          if (b.size > cap && q > 0.45) { q -= 0.05; t(); } else res(b);
        }, 'image/jpeg', q);
      })();
    });
  }
  function azbOk(a) {
    var ph = Array.isArray(a.photos) ? a.photos.filter(Boolean) : [];
    return !!(String(a.name || '').trim() && ph.length && (String(a.city || '').trim() || String(a.genre || '').trim()));
  }
  function azbBlob(c) {
    return new Promise(function (res, rej) {
      var q = 0.92;
      (function t() {
        c.toBlob(function (b) {
          if (!b) { rej(new Error('Photo could not be processed')); return; }
          if (b.size > 2600000 && q > 0.6) { q -= 0.06; t(); } else res(b);
        }, 'image/jpeg', q);
      })();
    });
  }
  function azbCropUp(file, uid, i, st) {
    st = st || { px: .5, py: .5, z: 1, fx: 'orig' };
    return azbLoad(file).then(function (bmp) {
      var c = document.createElement('canvas'); azbDraw(c, bmp, st, AZB_W, AZB_H);
      if (bmp.close) bmp.close();
      if (!st || st.fx === 'orig') azbAuto(c);
      return azbBlob2(c, file.size);
    }).then(function (b) {
      var path = uid + '/act-' + Date.now() + '-' + i + '.jpg';
      return db().storage.from('azs-photos').upload(path, b, { contentType: 'image/jpeg', cacheControl: '31536000' }).then(function (r) {
        if (r.error) throw r.error;
        return db().storage.from('azs-photos').getPublicUrl(path).data.publicUrl;
      });
    });
  }
  function azbEditor(o) {
    var inp = o.querySelector('#azb-f'), box = o.querySelector('#azb-ed'), srcs = [];
    o._ph = [];
    function show(n) {
      var st = o._ph[n], src = srcs[n], chips = '', key;
      for (key in AZB_FX) chips += '<button type="button" data-fx="' + key + '" class="azb-btn azb-ghost" style="padding:4px 10px;font-size:12px;white-space:nowrap">' + AZB_FX[key].n + '</button>';
      box.innerHTML = '<div class="azb-sub">Photo ' + (n + 1) + ' of ' + srcs.length + ' · drag to move, slider to zoom</div>' +
        '<canvas id="azb-cv" style="width:100%;border-radius:10px;border:1px solid #27c4ff;box-shadow:0 0 12px #27c4ff88;touch-action:none;cursor:grab"></canvas>' +
        '<input id="azb-z" type="range" min="1" max="3" step="0.01" value="' + st.z + '" style="width:100%">' +
        '<div style="display:flex;gap:6px;overflow-x:auto;padding:4px 0">' + chips + '</div>' +
        '<div style="display:flex;gap:8px"><button type="button" class="azb-btn azb-ghost" id="azb-pv">‹ Prev</button><button type="button" class="azb-btn azb-ghost" id="azb-nx">Next ›</button></div>';
      var cv = box.querySelector('#azb-cv'), drag = null;
      function draw() {
        azbDraw(cv, src, st, 640, 280);
        box.querySelectorAll('[data-fx]').forEach(function (b) { b.style.borderColor = b.getAttribute('data-fx') === st.fx ? '#27c4ff' : ''; b.style.boxShadow = b.getAttribute('data-fx') === st.fx ? '0 0 8px #27c4ff' : ''; });
      }
      cv.onpointerdown = function (e) { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); };
      cv.onpointerup = cv.onpointercancel = function () { drag = null; };
      cv.onpointermove = function (e) {
        if (!drag) return;
        var r = cv.getBoundingClientRect(), sc = 640 / r.width, k = Math.max(640 / src.width, 280 / src.height) * st.z;
        var rx = src.width * k - 640, ry = src.height * k - 280, dx = (e.clientX - drag.x) * sc, dy = (e.clientY - drag.y) * sc;
        drag = { x: e.clientX, y: e.clientY };
        if (rx > 0.5) st.px = Math.min(1, Math.max(0, st.px - dx / rx));
        if (ry > 0.5) st.py = Math.min(1, Math.max(0, st.py - dy / ry));
        draw();
      };
      box.querySelector('#azb-z').oninput = function () { st.z = +this.value; draw(); };
      box.querySelectorAll('[data-fx]').forEach(function (b) { b.onclick = function () { st.fx = b.getAttribute('data-fx'); draw(); }; });
      box.querySelector('#azb-pv').onclick = function () { show((n + srcs.length - 1) % srcs.length); };
      box.querySelector('#azb-nx').onclick = function () { show((n + 1) % srcs.length); };
      draw();
    }
    inp.addEventListener('change', async function () {
      var files = Array.prototype.slice.call(inp.files).slice(0, 4);
      o._ph = []; srcs = []; box.innerHTML = '';
      if (!files.length) return;
      box.innerHTML = '<div class="azb-sub">Loading photos...</div>';
      try {
        for (var i = 0; i < files.length; i++) {
          var b = await azbLoad(files[i]);
          var k = Math.min(1, 1800 / Math.max(b.width, b.height)), s = document.createElement('canvas');
          s.width = Math.max(1, Math.round(b.width * k)); s.height = Math.max(1, Math.round(b.height * k));
          var sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(b, 0, 0, s.width, s.height);
          if (b.close) b.close();
          srcs.push(s); o._ph.push({ px: .5, py: .5, z: 1, fx: 'orig' });
        }
      } catch (e) { box.innerHTML = '<div class="azb-sub" style="color:#ff8a8a">' + esc((e && e.message) || 'Photo error') + '</div>'; return; }
      show(0);
    });
  }
  function reg() {
    var o = modal('<h3 class="azb-name">Register</h3><div class="azb-orn">\u25C6 \u2756 \u25C6</div>' +
      '<label for="azb-k">Type</label><select id="azb-k">' + OPTS + '</select>' +
      fld('azb-n', 'Name (band, artist or brand)', 'e.g. Azmari Band') + fld('azb-g', 'Genre', 'e.g. Azmari, Ethio-jazz, Afrobeat') + fld('azb-c', 'City', 'e.g. Addis Ababa') +
      fld('azb-l', 'Leader name', 'Full name') + fld('azb-p', 'Leader phone (private, only admin sees it)', '0911234567', 'tel') +
      '<label for="azb-m">Members (one per line: name - role). DJs: crew, optional</label><textarea id="azb-m" rows="4" maxlength="800" placeholder="Meron Bekele - Lead vocal\nYonas Haile - Masinko"></textarea>' +
      fld('azb-pr', 'Starting price (birr)', 'e.g. 5000', 'number') + fld('azb-e', 'Event types', 'Wedding, club, church, corporate') +
      '' + fld('azb-w', 'Portfolio or social link (optional)', 'https://...') + '<label for="azb-a">About</label><textarea id="azb-a" rows="3" maxlength="600"></textarea>' +
      '<label for="azb-f">Photos for the slideshow (4 is best, 1 minimum)</label><input id="azb-f" type="file" accept="image/*" multiple><div id="azb-ed"></div>' +
      '<p class="azb-sub">Fee: 1,599 birr. Transfer by Telebirr to +251911898184, or to CBE account 1000037200534 (Nahom Zewge Tesfaye), then enter the transaction ID.</p>' + fld('azb-tx', 'Transaction ID', '6 to 40 letters or numbers') + '<label for="azb-pm">Paid with</label><select id="azb-pm"><option value="Telebirr">Telebirr</option><option value="CBE">CBE</option></select>' + '<div id="azb-rowvb" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0"><button type="button" class="azb-btn azb-ghost" id="azb-vb" style="margin:0">🎬 Add video · max 60 s</button><label style="display:flex;gap:5px;align-items:center;margin:0;font-size:11px;line-height:1.2"><input type="checkbox" id="azb-ok" style="width:14px;height:14px;margin:0;flex:none"> <span>I follow the community rules</span></label></div><input id="azb-vfile" type="file" accept="video/mp4,video/webm" style="display:none"><div class="azb-sub" id="azb-vname"></div><p class="azb-sub">Up to 4 photos and 1 video · Upload → Pay → Admin approval</p>' + '<div class="azb-msg" id="azb-msg"></div><div class="azb-bar"><button class="azb-btn" id="azb-go" style="flex:1;background:#27c4ff;color:#04101f">Create band profile · 1,599 birr</button><button class="azb-btn azb-ghost" data-azb="x">Cancel</button></div>');
    azbEditor(o);
    var vb = o.querySelector('#azb-vb'), vi = o.querySelector('#azb-vfile'), vn = o.querySelector('#azb-vname');
    vb.onclick = function () { vi.click(); };
    vi.onchange = function () {
      var f = vi.files[0]; o._vid = null; vn.textContent = '';
      if (!f) return;
      if (!/^video\/(mp4|webm)$/.test(f.type)) { vn.textContent = 'Video must be mp4 or webm'; vi.value = ''; return; }
      if (f.size > 31457280) { vn.textContent = 'Video is over 30 MB'; vi.value = ''; return; }
      var v = document.createElement('video'), vu = URL.createObjectURL(f);
      v.preload = 'metadata';
      v.onloadedmetadata = function () { URL.revokeObjectURL(vu); if (v.duration > 61) { vn.textContent = 'Video is longer than 60 seconds'; vi.value = ''; } else { o._vid = f; vn.textContent = '✓ ' + f.name; } };
      v.onerror = function () { URL.revokeObjectURL(vu); vn.textContent = 'Could not read this video'; vi.value = ''; };
      v.src = vu;
    };
    o.querySelector('#azb-go').onclick = async function () {
      var btn = this, msg = o.querySelector('#azb-msg'), g = function (i) { return o.querySelector('#' + i).value.trim(); };
      msg.textContent = '';
      if (!o.querySelector('#azb-ok').checked) { msg.textContent = 'Please confirm the community rules'; return; }
      if (typeof modr === 'function') { var bad = modr(g('azb-n') + ' ' + g('azb-g') + ' ' + g('azb-a') + ' ' + g('azb-e')); if (bad) { msg.textContent = 'Blocked: ' + bad + '. Please change your text.'; return; } }
      if (g('azb-n').length < 2) { msg.textContent = 'Write the name'; return; }
      if (!okPhone(g('azb-p'))) { msg.textContent = 'Write a correct leader phone, for example 0911234567'; return; }
      if (!/^[A-Za-z0-9]{6,40}$/.test(g('azb-tx'))) { msg.textContent = 'Enter the payment transaction ID (6 to 40 letters or numbers)'; return; }
      var files = Array.prototype.slice.call(o.querySelector('#azb-f').files);
      if (!files.length) { msg.textContent = 'Add at least 1 photo (4 is best)'; return; }
      if (files.length > 4) { msg.textContent = 'You can upload 4 photos at most'; return; }
      btn.disabled = true; msg.textContent = 'Uploading photos...';
      try {
        var ur = await db().auth.getUser(), u = ur && ur.data && ur.data.user;
        if (!u) throw new Error('Please log in first, then try again');
        var urls = await Promise.all(files.map(function (f, i) { return azbCropUp(f, u.id, i, o._ph && o._ph[i]); }));
        var vurl = null, vf = o._vid;
        if (vf) {
          msg.textContent = 'Uploading video...';
          var vp = u.id + '/band-' + Date.now() + (vf.type === 'video/webm' ? '.webm' : '.mp4');
          var vr = await db().storage.from('azmari-post-media').upload(vp, vf, { contentType: vf.type, cacheControl: '31536000' });
          if (vr.error) throw new Error('Video upload failed: ' + vr.error.message);
          vurl = db().storage.from('azmari-post-media').getPublicUrl(vp).data.publicUrl;
        }
        var mem = g('azb-m').split('\n').map(function (l) { var p = l.split(/\s[-\u2013]\s/); return { name: (p[0] || '').trim().slice(0, 60), role: (p[1] || '').trim().slice(0, 60) }; }).filter(function (m) { return m.name; }).slice(0, 12);
        if (!window.azSubmitPaidPost) throw new Error('Payment helper not loaded. Reload the app.');
        msg.textContent = 'Recording payment...';
        var pp = await window.azSubmitPaidPost({ acct: { name: g('azb-l') || g('azb-n'), phone: g('azb-p') }, kind: 'band', productCode: 'band_profile', ref: g('azb-tx'), method: o.querySelector('#azb-pm').value, ptime: null, data: { band_name: g('azb-n'), band_kind: g('azb-k'), genre: g('azb-g'), city: g('azb-c'), leader_name: g('azb-l'), photos: urls, video_url: vurl } });
        if (!pp || !pp.ok) throw new Error((pp && pp.msg) || 'Could not record payment');
        var r = await db().from('azb_acts').insert({ video_url: vurl, kind: g('azb-k'), name: g('azb-n'), genre: g('azb-g') || null, city: g('azb-c') || null, leader_name: g('azb-l') || null, leader_phone: g('azb-p'), members: mem, price_from: g('azb-pr') ? Number(g('azb-pr')) : null, event_types: g('azb-e') || null, about: g('azb-a') || null, portfolio: g('azb-w') ? (/^https?:\/\//i.test(g('azb-w')) ? g('azb-w') : 'https://' + g('azb-w')) : null, photos: urls, payment_ref: g('azb-tx') });
        if (r.error) throw r.error;
        o.querySelector('.azb-md').innerHTML = '<h3 class="azb-name">Submitted successfully</h3><p class="azb-ok">The admin will check your page and approve it.</p><button class="azb-btn" data-azb="x">Close</button>';
      } catch (e) { msg.textContent = (e && e.message) || 'Could not send'; btn.disabled = false; }
    };
  }
  function book(id, name) {
    var o = modal('<h3 class="azb-name">Book ' + esc(name) + '</h3><div class="azb-orn">\u25C6 \u2756 \u25C6</div>' +
      fld('azk-n', 'Your name', 'Full name') + fld('azk-p', 'Your phone', '0911234567', 'tel') + fld('azk-d', 'Event date', '', 'date') +
      fld('azk-t', 'Event type', 'Wedding, birthday, club...') + fld('azk-pl', 'Place', 'City and venue') +
      '<label for="azk-x">Note</label><textarea id="azk-x" rows="3" maxlength="500"></textarea>' +
      '<div class="azb-msg" id="azk-msg"></div><div class="azb-bar"><button class="azb-btn" id="azk-go">Send request</button><button class="azb-btn azb-ghost" data-azb="x">Cancel</button></div>');
    o.querySelector('#azk-go').onclick = async function () {
      var btn = this, msg = o.querySelector('#azk-msg'), g = function (i) { return o.querySelector('#' + i).value.trim(); };
      if (g('azk-n').length < 2) { msg.textContent = 'Write your name'; return; }
      if (!okPhone(g('azk-p'))) { msg.textContent = 'Write a correct phone number'; return; }
      btn.disabled = true; msg.textContent = '';
      var r = await db().rpc('azb_book', { p_act: id, p_name: g('azk-n'), p_phone: g('azk-p'), p_date: g('azk-d') || null, p_type: g('azk-t'), p_place: g('azk-pl'), p_note: g('azk-x') });
      if (r.error) { msg.textContent = r.error.message; btn.disabled = false; return; }
      o.querySelector('.azb-md').innerHTML = '<h3 class="azb-name">Request sent</h3><p class="azb-ok">The band will contact you on your phone.</p><button class="azb-btn" data-azb="x">Close</button>';
    };
  }
  async function requests() {
    var o = modal('<h3 class="azb-name">Booking requests</h3><div id="azr">Loading...</div><div class="azb-bar"><button class="azb-btn azb-ghost" data-azb="x">Close</button></div>');
    var r = await db().rpc('azb_my_bookings'), box = o.querySelector('#azr');
    if (r.error) { box.innerHTML = '<div class="azb-msg">' + esc(r.error.message) + '</div>'; return; }
    box.innerHTML = (r.data || []).length ? r.data.map(function (b) { return '<div class="azb-row"><b>' + esc(b.act_name) + '</b><br>' + esc(b.booker_name) + ' \u00B7 <a style="color:#fcdd09" href="tel:' + esc(b.booker_phone) + '">' + esc(b.booker_phone) + '</a><br>' + esc([b.event_date, b.event_type, b.place].filter(Boolean).join(' \u00B7 ')) + (b.note ? '<br>' + esc(b.note) : '') + '</div>'; }).join('') : 'No requests yet.';
  }
  async function admin() {
    var o = modal('<h3 class="azb-name">Pending pages</h3><div id="azr">Loading...</div><div class="azb-bar"><button class="azb-btn azb-ghost" data-azb="x">Close</button></div>');
    var r = await db().rpc('azb_admin_pending'), box = o.querySelector('#azr');
    if (r.error) { box.innerHTML = '<div class="azb-msg">' + esc(r.error.message) + '</div>'; return; }
    box.innerHTML = (r.data || []).length ? r.data.map(function (a) { return '<div class="azb-row" data-rid="' + esc(a.id) + '"><b>' + esc(a.name) + '</b> (' + esc(a.kind) + ')<br>' + esc([a.genre, a.city].filter(Boolean).join(' \u00B7 ')) + '<br>Leader: ' + esc(a.leader_name) + ' \u00B7 ' + esc(a.leader_phone) + '<br>' + (a.photos || []).length + ' photos \u00B7 ' + (a.members || []).length + ' members<br><b>Payment ID: ' + esc(a.payment_ref || 'NONE - do not approve') + '</b><div class="azb-bar"><button class="azb-btn" data-azb="ok" data-id="' + esc(a.id) + '">Approve</button><button class="azb-btn azb-ghost" data-azb="no" data-id="' + esc(a.id) + '">Remove</button></div></div>'; }).join('') : 'Nothing waiting.';
  }
  document.addEventListener('click', async function (e) {
    var k = e.target.closest && e.target.closest('[data-azk]');
    if (k) { kind = k.getAttribute('data-azk'); draw(); return; }
    var b = e.target.closest && e.target.closest('[data-azb]'); if (!b) return;
    var a = b.getAttribute('data-azb');
    if (a === 'reg') reg(); else if (a === 'book') book(b.getAttribute('data-id'), b.getAttribute('data-name'));
    else if (a === 'req') requests(); else if (a === 'adm') admin();
    else if (a === 'ok' || a === 'no') {
      b.disabled = true;
      var r = await db().rpc('azb_set_status', { p_id: b.getAttribute('data-id'), p_status: a === 'ok' ? 'approved' : 'removed' });
      if (r.error) { b.disabled = false; alert(r.error.message); return; }
      var row = b.closest('.azb-row'); if (row) row.remove(); load();
    }
  });
})();
;(function(){var s=document.createElement('style');s.id='azb-nohero';s.textContent='#azu-hero,.azb-bar .azu-hero{display:none!important}';document.head.appendChild(s);})();
