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
  function card(a) {
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
    var list = acts.filter(function (a) { return kind === 'all' || a.kind === kind; });
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
  function reg() {
    var o = modal('<h3 class="azb-name">Register</h3><div class="azb-orn">\u25C6 \u2756 \u25C6</div>' +
      '<label for="azb-k">Type</label><select id="azb-k">' + OPTS + '</select>' +
      fld('azb-n', 'Name (band, artist or brand)', 'e.g. Azmari Band') + fld('azb-g', 'Genre', 'e.g. Azmari, Ethio-jazz, Afrobeat') + fld('azb-c', 'City', 'e.g. Addis Ababa') +
      fld('azb-l', 'Leader name', 'Full name') + fld('azb-p', 'Leader phone (private, only admin sees it)', '0911234567', 'tel') +
      '<label for="azb-m">Members (one per line: name - role). DJs: crew, optional</label><textarea id="azb-m" rows="4" maxlength="800" placeholder="Meron Bekele - Lead vocal\nYonas Haile - Masinko"></textarea>' +
      fld('azb-pr', 'Starting price (birr)', 'e.g. 5000', 'number') + fld('azb-e', 'Event types', 'Wedding, club, church, corporate') +
      '' + fld('azb-w', 'Portfolio or social link (optional)', 'https://...') + '<label for="azb-a">About</label><textarea id="azb-a" rows="3" maxlength="600"></textarea>' +
      '<label for="azb-f">Photos for the slideshow (4 is best, 1 minimum)</label><input id="azb-f" type="file" accept="image/*" multiple>' +
      '<div class="azb-msg" id="azb-msg"></div><div class="azb-bar"><button class="azb-btn" id="azb-go">Submit</button><button class="azb-btn azb-ghost" data-azb="x">Cancel</button></div>');
    o.querySelector('#azb-go').onclick = async function () {
      var btn = this, msg = o.querySelector('#azb-msg'), g = function (i) { return o.querySelector('#' + i).value.trim(); };
      msg.textContent = '';
      if (g('azb-n').length < 2) { msg.textContent = 'Write the name'; return; }
      if (!okPhone(g('azb-p'))) { msg.textContent = 'Write a correct leader phone, for example 0911234567'; return; }
      var files = Array.prototype.slice.call(o.querySelector('#azb-f').files);
      if (!files.length) { msg.textContent = 'Add at least 1 photo (4 is best)'; return; }
      if (files.length > 4) { msg.textContent = 'You can upload 4 photos at most'; return; }
      btn.disabled = true; msg.textContent = 'Uploading photos...';
      try {
        var ur = await db().auth.getUser(), u = ur && ur.data && ur.data.user;
        if (!u) throw new Error('Please log in first, then try again');
        var urls = await Promise.all(files.map(function (f, i) { return cropUp(f, u.id, i); }));
        var mem = g('azb-m').split('\n').map(function (l) { var p = l.split(/\s[-\u2013]\s/); return { name: (p[0] || '').trim().slice(0, 60), role: (p[1] || '').trim().slice(0, 60) }; }).filter(function (m) { return m.name; }).slice(0, 12);
        var r = await db().from('azb_acts').insert({ kind: g('azb-k'), name: g('azb-n'), genre: g('azb-g') || null, city: g('azb-c') || null, leader_name: g('azb-l') || null, leader_phone: g('azb-p'), members: mem, price_from: g('azb-pr') ? Number(g('azb-pr')) : null, event_types: g('azb-e') || null, about: g('azb-a') || null, portfolio: g('azb-w') ? (/^https?:\/\//i.test(g('azb-w')) ? g('azb-w') : 'https://' + g('azb-w')) : null, photos: urls });
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
    box.innerHTML = (r.data || []).length ? r.data.map(function (a) { return '<div class="azb-row" data-rid="' + esc(a.id) + '"><b>' + esc(a.name) + '</b> (' + esc(a.kind) + ')<br>' + esc([a.genre, a.city].filter(Boolean).join(' \u00B7 ')) + '<br>Leader: ' + esc(a.leader_name) + ' \u00B7 ' + esc(a.leader_phone) + '<br>' + (a.photos || []).length + ' photos \u00B7 ' + (a.members || []).length + ' members<div class="azb-bar"><button class="azb-btn" data-azb="ok" data-id="' + esc(a.id) + '">Approve</button><button class="azb-btn azb-ghost" data-azb="no" data-id="' + esc(a.id) + '">Remove</button></div></div>'; }).join('') : 'Nothing waiting.';
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
