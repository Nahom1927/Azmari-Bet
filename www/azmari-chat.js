/* azchat: booking chat, artist inbox, direct call */
(function () {
  'use strict';
  var acts = [];
  function db() { return window.azSupabase || (window.S && window.S.sb); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rpc(n, a) { return db().rpc(n, a || {}).then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function norm(v) { var d = String(v || '').replace(/[\s-]/g, ''); return /^(\+251|251|0)?[79]\d{8}$/.test(d) ? '251' + d.slice(-9) : null; }
  function tok() {
    var t = ''; try { t = localStorage.getItem('azc-tok') || ''; } catch (e) {}
    if (t.length < 20) {
      t = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)) + '-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { localStorage.setItem('azc-tok', t); } catch (e) {}
    }
    return t;
  }
  var st = document.createElement('style');
  st.textContent =
    '#azc-fab{display:none!important;position:fixed;right:10px;bottom:10px;z-index:60;border:0;border-radius:999px;padding:9px 16px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#0b2a8a,#1d4ed8);color:#ffffff;box-shadow:0 2px 10px #00e5ff66}' +
    '.azc-ov{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;overflow:auto;padding:14px}' +
    '.azc-md{max-width:420px;margin:20px auto;background:linear-gradient(160deg,#07122b,#030712);color:#e8f6ff;border:2px solid #1d4ed8;border-radius:18px;overflow:hidden;box-shadow:0 0 0 4px #030712,0 0 0 5px #00e5ff,0 0 24px #00e5ff55}' +
    '.azc-strip{height:8px;background:linear-gradient(90deg,#1d4ed8,#00e5ff)}.azc-in{padding:16px}' +
    '.azc-md h3{font-family:Georgia,serif;color:#cfe3ff;margin:0 0 6px;font-size:22px;text-shadow:0 0 10px #00e5ff99}' +
    '.azc-sub{font-size:13px;opacity:.85;margin:4px 0}' +
    '.azc-md label{display:block;margin:8px 0 3px;font-size:13px;font-weight:700}' +
    '.azc-md input,.azc-md textarea{width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #00e5ff;background:#030712;color:#e8f6ff;font-size:16px;margin-top:4px}' +
    '.azc-md textarea{min-height:70px}' +
    '.azc-b{border:0;border-radius:12px;padding:10px 14px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#0b2a8a,#1d4ed8);color:#ffffff;margin:8px 8px 0 0}' +
    '.azc-b.g{background:transparent;color:inherit;border:1px solid #00e5ff}.azc-b[disabled]{opacity:.5}' +
    '.azc-row{margin:10px 0 2px}' +
    '.azc-list{max-height:260px;overflow:auto;margin:8px 0;padding:6px;border:1px solid #00e5ff55;border-radius:10px}' +
    '.azc-m{margin:6px 0;padding:8px 10px;border-radius:12px;max-width:85%;font-size:14px;white-space:pre-wrap;word-break:break-word}' +
    '.azc-m b{display:block;font-size:11px;opacity:.8}.azc-m i{display:block;font-size:10px;opacity:.6;margin-top:2px}' +
    '.azc-m.v{background:#00e5ff22;margin-left:auto}.azc-m.a{background:#1d4ed822;margin-right:auto}' +
    '.azc-th{padding:10px;margin:6px 0;border:1px solid #00e5ff;border-radius:12px;cursor:pointer}' +
    '#azc-er{color:#ffb4a8;font-size:14px;min-height:18px;margin-top:6px}';
  document.head.appendChild(st);

  function ov(html) {
    var old = document.querySelector('.azc-ov'); if (old) old.remove();
    var o = document.createElement('div'); o.className = 'azc-ov';
    o.innerHTML = '<div class="azc-md"><div class="azc-strip"></div><div class="azc-in">' + html + '</div></div>';
    o.addEventListener('click', function (e) { if (e.target === o) o.remove(); });
    document.body.appendChild(o); return o;
  }
  function bub(m, who) { return '<div class="azc-m ' + (m.from_artist ? 'a' : 'v') + '"><b>' + esc(m.from_artist ? who[0] : who[1]) + '</b>' + esc(m.body) + '<i>' + esc(new Date(m.created_at).toLocaleString()) + '</i></div>'; }
  function errText(e) { return (e && e.message) || 'Something went wrong'; }

  /* visitor chat */
  function chat(a) {
    var sn = '', sp = ''; try { sn = localStorage.getItem('azc-name') || ''; sp = localStorage.getItem('azc-phone') || ''; } catch (e) {}
    var o = ov('<h3>' + esc(a.name) + '</h3><div class="azc-sub">Write your booking request. The artist answers here.</div><div class="azc-list" id="azc-list">Loading...</div>' +
      '<div id="azc-nm"><label for="azc-n">Your name</label><input id="azc-n" maxlength="80" value="' + esc(sn) + '"><label for="azc-p">Your phone (optional)</label><input id="azc-p" type="tel" maxlength="20" value="' + esc(sp) + '"></div>' +
      '<label for="azc-tx">Message</label><textarea id="azc-tx" maxlength="1000" placeholder="Date, place, event type..."></textarea><div id="azc-er"></div>' +
      '<button class="azc-b" id="azc-go">Send</button><button class="azc-b g" id="azc-x">Close</button>');
    var list = o.querySelector('#azc-list'), nm = o.querySelector('#azc-nm'), er = o.querySelector('#azc-er'), iv = 0;
    o.querySelector('#azc-x').onclick = function () { clearInterval(iv); o.remove(); };
    async function load() {
      if (!document.body.contains(o)) { clearInterval(iv); return; }
      try {
        var m = await rpc('azb_chat_visitor_get', { p_act: String(a.id), p_token: tok() });
        list.innerHTML = m.length ? m.map(function (x) { return bub(x, [a.name, 'You']); }).join('') : '<div class="azc-sub">No messages yet.</div>';
        nm.style.display = m.length ? 'none' : ''; list.scrollTop = list.scrollHeight;
      } catch (e) { list.textContent = 'Could not load the chat'; }
    }
    o.querySelector('#azc-go').onclick = async function () {
      var b = this, tx = o.querySelector('#azc-tx'), n = o.querySelector('#azc-n').value.trim(), p = o.querySelector('#azc-p').value.trim();
      er.textContent = '';
      if (!tx.value.trim()) { er.textContent = 'Write a message'; return; }
      if (nm.style.display !== 'none' && n.length < 2) { er.textContent = 'Write your name'; return; }
      b.disabled = true;
      try {
        await rpc('azb_chat_visitor_send', { p_act: String(a.id), p_token: tok(), p_name: n, p_phone: p, p_body: tx.value });
        try { localStorage.setItem('azc-name', n); localStorage.setItem('azc-phone', p); } catch (e) {}
        tx.value = ''; await load();
      } catch (e) { er.textContent = errText(e); }
      b.disabled = false;
    };
    load(); iv = setInterval(load, 5000);
  }
  async function call(a) {
    try { var ph = await rpc('azb_contact', { p_act: String(a.id) }); if (ph) location.href = 'tel:' + ph; else alert('No phone number for this page'); }
    catch (e) { alert('Could not get the phone number'); }
  }

  /* cards: add Chat and Call */
  function decorate() {
    if (!acts.length) return;
    document.querySelectorAll('.azb-card:not([data-azc])').forEach(function (c) {
      var n = c.querySelector('.azb-name'); if (!n) return;
      var nm = n.textContent.trim(), a = null;
      for (var i = 0; i < acts.length; i++) if (String(acts[i].name).trim() === nm) { a = acts[i]; break; }
      if (!a) return;
      c.setAttribute('data-azc', '1');
      var d = document.createElement('div'); d.className = 'azc-row';
      d.innerHTML = '<button class="azc-b" data-k="chat">\uD83D\uDCAC Chat / book</button><button class="azc-b g" data-k="call">\uD83D\uDCDE Call</button>';
      d.onclick = function (e) { var b = e.target.closest('[data-k]'); if (!b) return; e.stopPropagation(); if (b.getAttribute('data-k') === 'chat') chat(a); else call(a); };
      c.appendChild(d);
    });
  }
  function loadActs() {
    if (!db()) { setTimeout(loadActs, 800); return; }
    rpc('azb_list').then(function (d) { acts = Array.isArray(d) ? d : []; decorate(); }).catch(function () {});
  }
  try { new MutationObserver(function () { decorate(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  setTimeout(loadActs, 700); setInterval(loadActs, 60000);

  /* artist inbox */
  var fab = document.createElement('button'); fab.id = 'azc-fab'; fab.textContent = '\uD83C\uDFAB Artist inbox';
  document.body.appendChild(fab);
  /* azchatslot: inbox button lives on the Bands page */
  function mountSlot() {
    if (document.getElementById('azc-slot')) return;
    var r = document.querySelector('.azb-root'), h = null;
    if (!r) { var hs = document.querySelectorAll('h2'); for (var i = 0; i < hs.length; i++) { if (hs[i].textContent.trim() === 'Bands') { h = hs[i]; break; } } }
    if (!r && !h) return;
    var s = document.createElement('div'); s.id = 'azc-slot'; s.style.margin = '10px 0';
    s.innerHTML = '<div style="padding:12px 14px;border-radius:16px;background:linear-gradient(160deg,#07122b,#030712);color:#e8f6ff;border:2px solid #1d4ed8;box-shadow:0 0 0 4px #030712,0 0 0 5px #00e5ff"><b>\uD83C\uDFAB Artist inbox</b><div style="font-size:13px;opacity:.85;margin:4px 0">Band, painter or creator? Open your booking requests and reply to visitors.</div><button class="azc-b" style="margin:6px 0 0">Open inbox</button></div>';
    s.querySelector('button').onclick = function () { fab.onclick(); };
    if (r) r.before(s); else h.after(s);
  }
  try { new MutationObserver(function () { if (!document.getElementById('azc-slot')) mountSlot(); }).observe(document.body, { childList: true, subtree: true }); setTimeout(mountSlot, 900); } catch (e) {}
  fab.onclick = async function () {
    if (!db()) { alert('App is still loading'); return; }
    var u = null; try { var r = await db().auth.getUser(); u = r && r.data && r.data.user; } catch (e) {}
    if (u) { try { await rpc('azb_claim'); } catch (e) {} listView(); } else loginView('login');
  };
  function loginView(mode) {
    var reg = mode === 'reg';
    var o = ov('<h3>Artist login</h3><div class="azc-sub">For bands, painters and creators with an approved page. Use the phone number you registered with.</div>' +
      '<div style="display:flex;gap:8px;margin:8px 0"><button class="azc-b' + (reg ? ' g' : '') + '" style="flex:1;margin:0" data-m="login">Login</button><button class="azc-b' + (reg ? '' : ' g') + '" style="flex:1;margin:0" data-m="reg">Create account</button></div>' +
      (reg ? '<label for="azc-fn">Your name</label><input id="azc-fn" maxlength="80">' : '') +
      '<label for="azc-ph">Phone number</label><input id="azc-ph" type="tel" placeholder="0911234567" maxlength="16">' +
      '<label for="azc-pw">Password (6 or more characters)</label><input id="azc-pw" type="password" maxlength="72">' +
      (reg ? '<label for="azc-p2">Password again</label><input id="azc-p2" type="password" maxlength="72">' : '') +
      '<div id="azc-er"></div><button class="azc-b" id="azc-go">' + (reg ? 'Create account' : 'Login') + '</button><button class="azc-b g" id="azc-x">Close</button>');
    o.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { loginView(b.getAttribute('data-m')); }; });
    o.querySelector('#azc-x').onclick = function () { o.remove(); };
    o.querySelector('#azc-go').onclick = async function () {
      var b = this, er = o.querySelector('#azc-er'), n = norm(o.querySelector('#azc-ph').value), pw = o.querySelector('#azc-pw').value;
      er.textContent = '';
      if (!n) { er.textContent = 'Write a correct phone number, for example 0911234567'; return; }
      if (pw.length < 6) { er.textContent = 'Password must be 6 or more characters'; return; }
      if (reg) {
        if (o.querySelector('#azc-fn').value.trim().length < 2) { er.textContent = 'Write your name'; return; }
        if (pw !== o.querySelector('#azc-p2').value) { er.textContent = 'The two passwords are not the same'; return; }
      }
      b.disabled = true;
      try {
        var email = n + '@phone.azmari-bet.app', r;
        if (reg) {
          r = await db().auth.signUp({ email: email, password: pw, options: { data: { phone: '0' + n.slice(3), full_name: o.querySelector('#azc-fn').value.trim() } } });
          if (r.error) throw r.error;
          if (!r.data.session) { r = await db().auth.signInWithPassword({ email: email, password: pw }); if (r.error) throw r.error; }
        } else { r = await db().auth.signInWithPassword({ email: email, password: pw }); if (r.error) throw r.error; }
        try { await rpc('azb_claim'); } catch (e) {}
        listView();
      } catch (e) {
        var m = errText(e);
        if (/already registered|already been/i.test(m)) m = 'This phone already has an account. Use Login.';
        else if (/invalid login/i.test(m)) m = 'Wrong phone or password';
        else if (/confirm/i.test(m)) m = 'Email confirmation is still ON in Supabase. Turn it off.';
        er.textContent = m; b.disabled = false;
      }
    };
  }
  async function listView() {
    var o = ov('<h3>Artist inbox</h3><div class="azc-sub">Booking requests for your pages.</div><div id="azc-l">Loading...</div><button class="azc-b g" id="azc-lo">Log out</button><button class="azc-b g" id="azc-x">Close</button>');
    o.querySelector('#azc-x').onclick = function () { o.remove(); };
    o.querySelector('#azc-lo').onclick = async function () { try { await db().auth.signOut(); } catch (e) {} o.remove(); };
    var l = o.querySelector('#azc-l');
    try {
      var t = await rpc('azb_my_threads'), map = {};
      if (!t.length) { l.innerHTML = '<div class="azc-sub">No requests yet. Your page must be approved and registered with the same phone number you log in with.</div>'; return; }
      l.innerHTML = t.map(function (x) { map[x.id] = x; return '<div class="azc-th" data-id="' + esc(x.id) + '"><b>' + esc(x.visitor_name) + '</b> \u00B7 ' + esc(x.act_name) + '<div class="azc-sub">' + esc(x.last_body || '') + '</div></div>'; }).join('');
      l.onclick = function (e) { var d = e.target.closest('[data-id]'); if (d) threadView(map[d.getAttribute('data-id')]); };
    } catch (e) { l.textContent = errText(e); }
  }
  function threadView(t) {
    var o = ov('<h3>' + esc(t.visitor_name) + '</h3><div class="azc-sub">' + esc(t.act_name) + (t.visitor_phone ? ' \u00B7 <a style="color:#00e5ff" href="tel:' + esc(t.visitor_phone) + '">\uD83D\uDCDE ' + esc(t.visitor_phone) + '</a>' : '') + '</div>' +
      '<div class="azc-list" id="azc-list">Loading...</div><textarea id="azc-tx" maxlength="1000" placeholder="Write a reply..."></textarea><div id="azc-er"></div>' +
      '<button class="azc-b" id="azc-go">Send</button><button class="azc-b g" id="azc-bk">Back</button>');
    var list = o.querySelector('#azc-list'), er = o.querySelector('#azc-er'), iv = 0;
    o.querySelector('#azc-bk').onclick = function () { clearInterval(iv); listView(); };
    async function load() {
      if (!document.body.contains(o)) { clearInterval(iv); return; }
      try { var m = await rpc('azb_my_msgs', { p_thread: t.id }); list.innerHTML = m.map(function (x) { return bub(x, ['You', t.visitor_name]); }).join(''); list.scrollTop = list.scrollHeight; }
      catch (e) { list.textContent = 'Could not load'; }
    }
    o.querySelector('#azc-go').onclick = async function () {
      var b = this, tx = o.querySelector('#azc-tx'); er.textContent = '';
      if (!tx.value.trim()) { er.textContent = 'Write a message'; return; }
      b.disabled = true;
      try { await rpc('azb_my_send', { p_thread: t.id, p_body: tx.value }); tx.value = ''; await load(); } catch (e) { er.textContent = errText(e); }
      b.disabled = false;
    };
    load(); iv = setInterval(load, 5000);
  }
})();
