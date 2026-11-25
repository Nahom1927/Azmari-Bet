/* Azmari Bet Store v3: Supabase, self-styled. Mounts inside <div id="shop-root">. */
(function () {
'use strict';
const SB_URL = 'https://rnqizccrzbolsynfsxbu.supabase.co', SB_KEY = 'sb_publishable_1pbzO1FOGTjIjjE-yF7d1A__OFPESB2';
const CATS = [['Keyboards','🎹'],['Strings','🎸'],['Traditional','🪕'],['Percussion','🥁'],['Wind','🎺'],['Audio','🎧'],['Rental','🔊']];
const ICON = Object.fromEntries(CATS);
const SITE = location.origin + location.pathname.replace(/index\.html$/, '');
const S = { sb: null, me: null, prof: null, used: 0, cat: '', q: '', msgs: [], read: {}, chat: null, live: {}, watch: null, ui: null };
const CSS = `
.azs,.azs-ov,.azs-chat,.azs-toasts{--bg:#070d24;--c1:#0d1635;--c2:#131f46;--ln:rgba(255,255,255,.09);--tx:#e8f0ff;--mu:#8da2c8;--ac:#1fc7f5;--pr:#3aa9ff;--ok:#14b86a;--bad:#e5484d;--on:#04202b;color:var(--tx);font-family:inherit;box-sizing:border-box}
.azs *,.azs-ov *,.azs-chat *,.azs-toasts *{box-sizing:border-box}
.azs{padding:14px 12px 20px;background:var(--bg);border-radius:16px;min-height:60vh}
.azs-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
.azs-h{margin:0;font-size:22px}.azs-acts{display:flex;flex-wrap:wrap;gap:6px}
.azs-search{width:100%;margin:12px 0 10px;padding:12px 14px;border-radius:12px;font-size:15px;color:var(--tx);background:var(--c1);border:1px solid var(--ln)}
.azs-cats{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px}
.azs-chip{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px;padding:8px 10px;font-size:12px;cursor:pointer;border-radius:12px;color:var(--tx);background:var(--c1);border:1px solid var(--ln)}
.azs-chip b{font-size:20px;font-weight:400}.azs-chip.on{background:var(--ac);color:var(--on);border-color:var(--ac)}
.azs-sub{margin:14px 0 8px;font-size:13px;color:var(--mu)}
.azs-empty{color:var(--mu);grid-column:1/-1;text-align:center;padding:30px 0}
.azs-btn{padding:9px 14px;border:0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;color:var(--on);background:var(--ac)}
.azs-btn:disabled{opacity:.5}.azs-ghost{color:var(--tx);background:var(--c2);border:1px solid var(--ln)}.azs-danger{background:var(--bad);color:#fff}
.azs-link{background:none;border:0;padding:0;color:var(--ac);text-decoration:underline;cursor:pointer;font-size:13px}
.azs-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media(min-width:700px){.azs-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(min-width:1000px){.azs-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.azs-card{background:var(--c1);border:1px solid var(--ln);border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}
.azs-card:hover{transform:translateY(-4px);box-shadow:0 10px 24px rgba(0,0,0,.35)}
.azs-card:active{transform:scale(.97)}
.azs-card img{transition:transform .35s ease}
.azs-card:hover img{transform:scale(1.06)}
.azs-prow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.azs-like{border:0;background:transparent;color:inherit;font-size:14px;cursor:pointer;padding:2px 6px;border-radius:8px}
.azs-like.on{color:#ef4444}
/* AZ-GAP */
.azs-body .azs-prow{margin:0 0 21px !important}
.azs-body .azs-price{margin:0 !important;line-height:1.3}
.azs-body .azs-title{margin:0 0 10px !important;line-height:1.35}
.azs-prow+.azs-title{margin-top:0 !important}
@keyframes azpop{0%{transform:scale(1)}50%{transform:scale(1.45)}100%{transform:scale(1)}}
.azs-like.pop{animation:azpop .3s}
@media (prefers-reduced-motion:reduce){.azs-card,.azs-card img{transition:none}.azs-card:hover,.azs-card:active,.azs-card:hover img{transform:none}.azs-like.pop{animation:none}}
.azs-media{position:relative;height:110px;display:flex;align-items:center;justify-content:center;background:var(--ac)}
.azs-emoji{font-size:46px}.azs-badge{position:absolute;left:6px;bottom:6px;padding:2px 7px;font-size:10px;border-radius:6px;background:var(--ok);color:#fff}
.azs-body{padding:10px}.azs-price{color:var(--pr);font-weight:700;font-size:14px}.azs-title{margin:8px 0 10px;font-weight:600;font-size:15px}
.azs-meta{font-size:11px;color:var(--mu);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.azs-row{display:flex;gap:6px;margin-top:10px}.azs-contact{flex:1}
.azs-flag{width:38px;border-radius:10px;border:0;cursor:pointer;color:var(--bad);background:rgba(229,72,77,.15);font-size:16px}
.azs-more{display:block;margin:16px auto}
.azs-ov{position:fixed;inset:0;z-index:10050;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,6,20,.75)}
.azs-sheet{width:100%;max-width:560px;max-height:92vh;max-height:92dvh;overflow-y:auto;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));background:var(--bg);border:1px solid var(--ln);border-radius:18px 18px 0 0}
@media(min-width:700px){.azs-ov{align-items:center}.azs-sheet{border-radius:18px}}
.azs-dlg{align-items:center;padding:16px}.azs-dlg .azs-sheet{max-width:380px;border-radius:18px;padding:18px}
.azs-sheet h3{margin:0 0 12px;font-size:18px;display:flex;justify-content:space-between;align-items:center}
.azs-x{background:none;border:0;color:var(--mu);font-size:22px;cursor:pointer}
.azs-field{display:block;margin-bottom:10px;font-size:13px;color:var(--mu)}
.azs-input{width:100%;margin-top:4px;padding:10px 12px;font-size:15px;border-radius:10px;color:var(--tx);background:var(--c1);border:1px solid var(--ln)}
.azs-input:focus,.azs-search:focus{outline:2px solid var(--ac)}textarea.azs-input{min-height:90px;resize:vertical}
.azs-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.azs-tile{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;font-size:12px;cursor:pointer;border-radius:12px;color:var(--tx);background:var(--c1);border:1px solid var(--ln)}.azs-tile b{font-size:30px;font-weight:400}
.azs-note{padding:8px 10px;margin-bottom:10px;font-size:12px;border-radius:10px;color:var(--mu);background:var(--c1);border:1px solid var(--ln)}
.azs-err{color:var(--bad);font-size:13px;margin:6px 0;min-height:1em}.azs-dtext{margin:0 0 12px;font-size:14px;color:var(--mu)}
.azs-big{height:130px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:60px;background:var(--ac);margin-bottom:10px}
.azs-item{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--ln);font-size:14px}.azs-item small{color:var(--mu);display:block}
.azs-st{font-size:11px;padding:2px 8px;border-radius:99px;background:var(--c2)}
.azs-toasts{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:10100;display:flex;flex-direction:column;align-items:center;gap:8px;padding:0 12px;pointer-events:none}
.azs-tt{pointer-events:auto;width:100%;max-width:420px;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.35;color:var(--tx);background:var(--c2);border:1px solid var(--ln);box-shadow:0 8px 28px rgba(0,0,0,.45);word-break:break-word}
.azs-tt b{display:block;color:var(--ac);font-size:13px}.azs-tt.bad{border-color:var(--bad)}.azs-tt.msg{border-color:var(--ac);cursor:pointer}
.azs-nb{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:9px;background:var(--bad);color:#fff;font-size:11px;font-weight:700}
.azs-chat{position:fixed;inset:0;z-index:10000;display:grid;grid-template-columns:320px 1fr;grid-template-rows:minmax(0,1fr);background:var(--bg)}
.azs-clist{border-right:1px solid var(--ln);overflow-y:auto;min-height:0}
.azs-ch{display:flex;align-items:center;gap:8px;padding:12px;padding-top:calc(12px + env(safe-area-inset-top,0px));border-bottom:1px solid var(--ln);font-weight:600}
.azs-ch span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.azs-conv{padding:12px;border-bottom:1px solid var(--ln);cursor:pointer}.azs-conv.on{background:var(--c2)}
.azs-conv b{display:flex;align-items:center;justify-content:space-between;font-size:14px}
.azs-conv small{display:block;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.azs-thread{display:flex;flex-direction:column;min-width:0;min-height:0}
.azs-msgs{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain}
.azs-msg{max-width:78%;padding:8px 12px;border-radius:14px 14px 14px 4px;font-size:14px;word-break:break-word;background:var(--c2);align-self:flex-start}
.azs-msg.me{align-self:flex-end;border-radius:14px 14px 4px 14px;background:var(--ac);color:var(--on)}.azs-msg.me .azs-link{color:var(--on)}
.azs-msg time{display:block;margin-top:2px;font-size:10px;opacity:.65;text-align:right}
.azs-live{padding:8px 12px;border-bottom:1px solid var(--ln);background:var(--c1);font-size:13px}
.azs-compose{display:flex;gap:6px;padding:10px;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--ln)}
.azs-compose .azs-input{margin:0;flex:1;min-width:0}.azs-back{display:none}
@media(max-width:760px){.azs-chat{grid-template-columns:1fr}.azs-chat .azs-thread{display:none}.azs-chat.in-thread .azs-clist{display:none}.azs-chat.in-thread .azs-thread{display:flex}.azs-back{display:inline-block}}
@media(min-width:761px){.azs-thread .azs-x{display:none}}`;

function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const k in props || {}) { const v = props[k];
    if (k === 'class') e.className = v; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v); }
  kids.flat(Infinity).forEach((c) => { if (c != null && c !== false) e.append(c); });
  return e;
}
const money = (n) => 'ETB ' + Number(n).toLocaleString('en-US');
const hhmm = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const mapsUrl = (a, b) => 'https://www.openstreetmap.org/?mlat=' + a + '&mlon=' + b + '#map=17/' + a + '/' + b;
function ago(iso) { const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 3600) return Math.max(1, Math.floor(s / 60)) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' hours ago';
  return s < 172800 ? 'Yesterday' : Math.floor(s / 86400) + ' days ago'; }
function toast(msg, kind, onTap) {
  let st = document.querySelector('.azs-toasts');
  if (!st) { st = h('div', { class: 'azs-toasts', 'aria-live': 'polite' }); document.body.append(st); }
  const t = h('div', { class: 'azs-tt' + (kind ? ' ' + kind : ''), role: 'status' }, msg);
  if (onTap) t.addEventListener('click', () => { t.remove(); onTap(); });
  st.append(t); setTimeout(() => { t.remove(); if (!st.children.length) st.remove(); }, kind === 'msg' ? 5000 : 3600);
}
function ask(o) {
  return new Promise((resolve) => {
    const field = o.input ? h('textarea', { class: 'azs-input', maxlength: 200, rows: 3, placeholder: o.placeholder || '' }) : null;
    const err = h('div', { class: 'azs-err' }); let done = false;
    const end = (v) => { if (done) return; done = true; ov.remove(); document.removeEventListener('keydown', key, true); resolve(v); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); end(o.input ? null : false); } };
    const ok = h('button', { class: 'azs-btn' + (o.danger ? ' azs-danger' : ''), onclick: () => {
      if (field) { const v = field.value.trim(); if (!v) { err.textContent = 'Please write a short reason'; return; } end(v); } else end(true); } }, o.ok || 'OK');
    const ov = h('div', { class: 'azs-ov azs-dlg', onclick: (e) => { if (e.target === ov) end(o.input ? null : false); } },
      h('div', { class: 'azs-sheet', role: 'alertdialog', 'aria-modal': 'true' }, h('h3', {}, o.title), h('p', { class: 'azs-dtext' }, o.text || ''), field, err,
        h('div', { class: 'azs-row', style: 'justify-content:flex-end' }, h('button', { class: 'azs-btn azs-ghost', onclick: () => end(o.input ? null : false) }, 'Cancel'), ok)));
    document.body.append(ov); document.addEventListener('keydown', key, true); setTimeout(() => (field || ok).focus(), 30);
  });
}
function modal(title, ...content) {
  const sheet = h('div', { class: 'azs-sheet', role: 'dialog', 'aria-label': title });
  const ov = h('div', { class: 'azs-ov', onclick: (e) => { if (e.target === ov) close(); } }, sheet);
  const close = () => ov.remove();
  sheet.append(h('h3', {}, title, h('button', { class: 'azs-x', 'aria-label': 'Close', onclick: close }, '\u00D7')), ...content.flat(Infinity).filter((c) => c != null && c !== false));
  document.body.append(ov); return { sheet, close };
}

// ---------- Supabase + auth ----------
function lib() { return window.supabase ? Promise.resolve() : new Promise((ok, no) => {
  const s = h('script', { src: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js', onload: ok, onerror: () => no(new Error('Could not load Supabase')) }); document.head.append(s); }); }
async function init() {
  if (S.sb) return; await lib();
  S.sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { storageKey: 'azs-auth', persistSession: true, autoRefreshToken: true } });
  S.sb.auth.onAuthStateChange((ev) => { if (ev === 'PASSWORD_RECOVERY') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } setTimeout(newPassword, 0); } });
  const { data } = await S.sb.auth.getSession(); await setUser(data.session && data.session.user);
}
async function setUser(u) {
  S.me = u || null; S.prof = null; S.used = 0;
  if (u) {
    try { S.read = JSON.parse(localStorage.getItem('azs_read_' + u.id) || '{}'); } catch (e) { S.read = {}; }
    const [p, c] = await Promise.all([S.sb.from('azs_profiles').select('*').eq('id', u.id).maybeSingle(),
      S.sb.from('azs_listings').select('id', { count: 'exact', head: true }).eq('seller_id', u.id).neq('status', 'removed')]);
    S.prof = p.data; S.used = c.count || 0;
    const m = await S.sb.from('azs_messages').select('*').order('created_at', { ascending: true }).limit(500); S.msgs = m.data || [];
    sub();
  } else { unsub(); S.msgs = []; S.read = {}; S.live = {}; }
  drawTop(); badges();
}
const norm = (d) => { d = d.replace(/\D/g, ''); if (d.indexOf('251') === 0) d = '0' + d.slice(3); if (d.length === 9) d = '0' + d; return d; };
function login(after) {
  let mode = 'login';
  const err = h('div', { class: 'azs-err' });
  const info = h('div', { class: 'azs-note', style: 'display:none' });
  const name = h('input', { class: 'azs-input', maxlength: 60, autocomplete: 'name' });
  const email = h('input', { class: 'azs-input', type: 'email', placeholder: 'you@example.com', autocomplete: 'email', maxlength: 120 });
  const pw = h('input', { class: 'azs-input', type: 'password', autocomplete: 'current-password' });
  const nf = h('label', { class: 'azs-field', style: 'display:none' }, 'Full name', name);
  const pf = h('label', { class: 'azs-field' }, 'Password (8+ characters)', pw);
  const go = h('button', { class: 'azs-btn', onclick: submit }, 'Log in');
  const sw = h('button', { class: 'azs-link', onclick: () => { mode = mode === 'login' ? 'register' : 'login'; draw(); } }, '');
  const fg = h('button', { class: 'azs-link', onclick: () => { mode = 'forgot'; draw(); } }, 'Forgot password?');
  const m = modal('Account', nf, h('label', { class: 'azs-field' }, 'Email', email), pf, err, info, go, h('p', {}, sw), h('p', {}, fg));
  function draw() {
    nf.style.display = mode === 'register' ? 'block' : 'none';
    pf.style.display = mode === 'forgot' ? 'none' : 'block';
    fg.style.display = mode === 'login' ? 'inline' : 'none';
    go.textContent = mode === 'login' ? 'Log in' : mode === 'register' ? 'Create account' : 'Send reset link';
    sw.textContent = mode === 'login' ? 'New here? Create an account' : 'Back to log in';
    pw.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    err.textContent = ''; info.style.display = 'none';
  }
  draw();
  async function submit() {
    err.textContent = ''; info.style.display = 'none';
    const em = email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err.textContent = 'Enter a valid email address'; return; }
    go.disabled = true;
    try {
      if (mode === 'forgot') {
        const r = await S.sb.auth.resetPasswordForEmail(em, { redirectTo: SITE });
        if (r.error) throw r.error;
        info.textContent = 'If that email has an account, a reset link is on its way. Open the link on this device.'; info.style.display = 'block';
        return;
      }
      if (pw.value.length < 8) { err.textContent = 'Password needs 8+ characters'; return; }
      let r;
      if (mode === 'register') {
        if (!name.value.trim()) { err.textContent = 'Enter your name'; return; }
        r = await S.sb.auth.signUp({ email: em, password: pw.value, options: { data: { name: name.value.trim() }, emailRedirectTo: SITE } });
        if (r.error) throw r.error;
        if (!r.data.session) { info.textContent = 'Account created. Open the confirmation link we emailed you, then log in.'; info.style.display = 'block'; return; }
      } else {
        r = await S.sb.auth.signInWithPassword({ email: em, password: pw.value });
        if (r.error) throw r.error;
      }
      await setUser(r.data.user); m.close(); if (after) after();
    } catch (e) { err.textContent = /invalid login/i.test(e.message) ? 'Wrong email or password' : e.message; } finally { go.disabled = false; }
  }
}
function newPassword() {
  const err = h('div', { class: 'azs-err' });
  const p1 = h('input', { class: 'azs-input', type: 'password', autocomplete: 'new-password' });
  const p2 = h('input', { class: 'azs-input', type: 'password', autocomplete: 'new-password' });
  const go = h('button', { class: 'azs-btn', onclick: async () => {
    err.textContent = '';
    if (p1.value.length < 8) { err.textContent = 'Password needs 8+ characters'; return; }
    if (p1.value !== p2.value) { err.textContent = 'Passwords do not match'; return; }
    go.disabled = true;
    const r = await S.sb.auth.updateUser({ password: p1.value });
    go.disabled = false;
    if (r.error) { err.textContent = r.error.message; return; }
    m.close(); toast('Password changed. You are logged in.');
  } }, 'Save new password');
  const m = modal('Set a new password', h('label', { class: 'azs-field' }, 'New password (8+ characters)', p1), h('label', { class: 'azs-field' }, 'Repeat new password', p2), err, go);
}
async function logout() { stopShare(); closeChats(); await S.sb.auth.signOut(); await setUser(null); }

// ---------- store page ----------
function build(root) {
  if (!document.getElementById('azs-css')) document.head.append(h('style', { id: 'azs-css' }, CSS));
  S.ui = { acts: h('div', { class: 'azs-acts' }), cats: h('div', { class: 'azs-cats' }), grid: h('div', { class: 'azs-grid' }),
    search: h('input', { class: 'azs-search', type: 'search', placeholder: 'What are you looking for?', 'aria-label': 'Search ads', value: S.q }) };
  root.classList.add('azs'); root.textContent = '';
  root.append(h('div', { class: 'azs-top' }, h('h2', { class: 'azs-h' }, 'Store'), S.ui.acts), S.ui.search, S.ui.cats, h('p', { class: 'azs-sub' }, 'Fresh recommendations'), S.ui.grid);
  let t; const mine = S.ui;
  S.ui.search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { if (mine !== S.ui) return; S.q = mine.search.value.trim(); load(); }, 300); });
}
function drawTop() {
  if (!S.ui) return; const a = S.ui.acts; a.textContent = '';
  a.append(h('button', { class: 'azs-btn', onclick: post }, '+ Sell'));
  if (S.me) {
    a.append(h('button', { class: 'azs-btn azs-ghost', onclick: () => openChats() }, 'Chats', h('span', { class: 'azs-nb azs-cb', style: 'display:none' })),
      h('button', { class: 'azs-btn azs-ghost', onclick: mine }, 'My ads'));
    if (S.prof && S.prof.role === 'admin') a.append(h('button', { class: 'azs-btn azs-ghost', onclick: admin }, 'Admin'));
    a.append(h('button', { class: 'azs-btn azs-ghost', onclick: logout }, 'Log out'));
  } else a.append(h('button', { class: 'azs-btn azs-ghost', onclick: () => login() }, 'Log in'));
  badges();
}
function drawCats() {
  if (!S.ui) return; S.ui.cats.textContent = '';
  const chip = (v, i, l) => h('button', { class: 'azs-chip' + (S.cat === v ? ' on' : ''), onclick: () => { S.cat = v; drawCats(); load(); } }, h('b', {}, i), l);
  S.ui.cats.append(chip('', '\u2728', 'All'), ...CATS.map((c) => chip(c[0], c[1], c[0])));
}
/* AZ-PICS-START */
function azPics(l) {
  return (Array.isArray(l.images) ? l.images : []).filter((u) => typeof u === 'string' && /^https:\/\//.test(u));
}
function azEmoji(l, cls) {
  return h('span', { class: cls }, l.icon || ICON[l.category] || '\u{1F3B5}');
}
function azThumb(l) {
  const p = azPics(l);
  if (!p.length) return azEmoji(l, 'azs-emoji');
  const im = document.createElement('img');
  im.src = p[0]; im.alt = l.title || ''; im.loading = 'lazy';
  im.style.cssText = 'width:100%;height:100%;min-height:140px;object-fit:cover;display:block';
  im.onerror = () => im.replaceWith(azEmoji(l, 'azs-emoji'));
  return im;
}
function azLightbox(p, start) {
  let i = start;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.93);display:flex;align-items:center;justify-content:center;touch-action:pan-y';
  const im = document.createElement('img');
  im.style.cssText = 'max-width:94vw;max-height:82vh;object-fit:contain;border-radius:8px;user-select:none';
  const cnt = document.createElement('div');
  cnt.style.cssText = 'position:absolute;bottom:18px;left:0;right:0;text-align:center;color:#fff;font:600 15px system-ui';
  function show() { im.src = p[i]; cnt.textContent = p.length > 1 ? (i + 1) + ' / ' + p.length : ''; }
  function go(d) { i = (i + d + p.length) % p.length; show(); }
  function close() { document.removeEventListener('keydown', key); ov.remove(); }
  function key(e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft' && p.length > 1) go(-1); else if (e.key === 'ArrowRight' && p.length > 1) go(1); }
  function btn(txt, css, fn) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = txt;
    b.style.cssText = 'position:absolute;border:0;border-radius:50%;width:44px;height:44px;font-size:24px;line-height:44px;padding:0;cursor:pointer;background:rgba(255,255,255,.18);color:#fff;' + css;
    b.onclick = (e) => { e.stopPropagation(); fn(); };
    return b;
  }
  ov.append(im, cnt, btn('\u00d7', 'top:14px;right:14px', close));
  if (p.length > 1) ov.append(btn('\u2039', 'left:10px;top:50%;margin-top:-22px', () => go(-1)), btn('\u203a', 'right:10px;top:50%;margin-top:-22px', () => go(1)));
  im.onclick = (e) => e.stopPropagation();
  ov.onclick = close;
  let x0 = null;
  ov.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  ov.addEventListener('touchend', (e) => {
    if (x0 === null || p.length < 2) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });
  document.addEventListener('keydown', key);
  show();
  document.body.append(ov);
}
function azBig(l) {
  const p = azPics(l);
  if (!p.length) return h('div', { class: 'azs-big' }, l.icon || ICON[l.category] || '\u{1F3B5}');
  let cur = 0;
  const wrap = document.createElement('div');
  const main = document.createElement('img');
  main.src = p[0]; main.alt = l.title || '';
  main.style.cssText = 'width:100%;max-height:340px;object-fit:contain;border-radius:12px;display:block;cursor:zoom-in;background:rgba(255,255,255,.04)';
  main.onclick = () => azLightbox(p, cur);
  wrap.append(main);
  if (p.length > 1) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:8px;overflow-x:auto;padding-bottom:4px';
    p.forEach((u, i) => {
      const t = document.createElement('img');
      t.src = u; t.alt = '';
      t.style.cssText = 'width:58px;height:58px;object-fit:cover;border-radius:8px;cursor:pointer;flex:none;border:2px solid transparent;opacity:' + (i ? 0.6 : 1);
      t.onclick = () => { cur = i; main.src = u; Array.from(row.children).forEach((c) => { c.style.opacity = 0.6; }); t.style.opacity = 1; };
      row.append(t);
    });
    const hint = document.createElement('div');
    hint.textContent = p.length + ' photos \u00b7 tap the big photo to enlarge';
    hint.style.cssText = 'font-size:.8em;opacity:.7;margin-top:4px';
    wrap.append(row, hint);
  }
  return wrap;
}
/* AZ-PICS-END */
/* AZ-LIKE-START */
const AZL = { n: {}, mine: new Set(), btns: {}, uid: undefined, busy: false };
function azPaintLikes(id) {
  (AZL.btns[id] || []).forEach((b) => {
    const on = AZL.mine.has(id);
    b.textContent = (on ? '\u2665 ' : '\u2661 ') + (AZL.n[id] || 0);
    b.classList.toggle('on', on);
    b.setAttribute('aria-label', (on ? 'Unlike' : 'Like') + ' - ' + (AZL.n[id] || 0) + ' likes');
  });
}
async function azLoadLikes() {
  if (AZL.busy) return; AZL.busy = true;
  AZL.uid = S.me ? S.me.id : null;
  try {
    const a = await S.sb.from('azs_like_counts').select('listing_id,likes');
    AZL.n = {}; (a.data || []).forEach((r) => { AZL.n[r.listing_id] = r.likes; });
    AZL.mine = new Set();
    if (S.me) { const b = await S.sb.from('azs_likes').select('listing_id'); (b.data || []).forEach((r) => AZL.mine.add(r.listing_id)); }
  } catch (e) { /* ignore */ }
  AZL.busy = false;
  Object.keys(AZL.btns).forEach((id) => azPaintLikes(isNaN(id) ? id : Number(id)));
}
async function azToggle(l) {
  if (!l.seller_id) { toast('This is a sample ad.'); return; }
  if (!S.me) { toast('Please log in to like ads', 'bad'); return; }
  const id = l.id, had = AZL.mine.has(id);
  if (had) { AZL.mine.delete(id); AZL.n[id] = Math.max(0, (AZL.n[id] || 0) - 1); }
  else { AZL.mine.add(id); AZL.n[id] = (AZL.n[id] || 0) + 1; }
  azPaintLikes(id);
  let r;
  try {
    r = had ? await S.sb.from('azs_likes').delete().eq('listing_id', id).eq('user_id', S.me.id)
            : await S.sb.from('azs_likes').insert({ listing_id: id });
  } catch (e) { r = { error: e }; }
  if (r && r.error) {
    if (had) { AZL.mine.add(id); AZL.n[id] = (AZL.n[id] || 0) + 1; }
    else { AZL.mine.delete(id); AZL.n[id] = Math.max(0, (AZL.n[id] || 0) - 1); }
    azPaintLikes(id);
    toast(r.error.message || 'Could not save like', 'bad');
  }
}
function azLike(l) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'azs-like';
  (AZL.btns[l.id] = (AZL.btns[l.id] || []).filter((x) => x.isConnected)).push(b);
  b.onclick = (e) => {
    e.stopPropagation();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    azToggle(l);
  };
  azPaintLikes(l.id);
  const uid = S.me ? S.me.id : null;
  if (AZL.uid !== uid) azLoadLikes();
  return b;
}
const AZSND = { on: true, ctx: null };
try { AZSND.on = localStorage.getItem('azs_snd') !== 'off'; } catch (e) { /* ignore */ }
function azBeep() {
  if (!AZSND.on) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    AZSND.ctx = AZSND.ctx || new AC();
    const c = AZSND.ctx; if (c.state === 'suspended') c.resume();
    const t = c.currentTime;
    [880, 1175].forEach((fr, i) => {
      const o = c.createOscillator(), g = c.createGain(), st = t + i * 0.12;
      o.type = 'sine'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.2, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.2);
      o.connect(g); g.connect(c.destination); o.start(st); o.stop(st + 0.22);
    });
  } catch (e) { /* ignore */ }
}
function azMuteBtn() {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'azs-x';
  const set = () => {
    b.textContent = AZSND.on ? '\u{1F514}' : '\u{1F515}';
    b.setAttribute('aria-label', AZSND.on ? 'Mute chat sound' : 'Unmute chat sound');
  };
  b.onclick = () => {
    AZSND.on = !AZSND.on;
    try { localStorage.setItem('azs_snd', AZSND.on ? 'on' : 'off'); } catch (e) { /* ignore */ }
    set(); if (AZSND.on) azBeep();
  };
  set(); return b;
}
/* AZ-LIKE-END */
function card(l) {
  return h('article', { class: 'azs-card', onclick: () => detail(l) },
    h('div', { class: 'azs-media' }, azThumb(l), l.verified ? h('span', { class: 'azs-badge' }, '\u2714 Verified') : null),
    h('div', { class: 'azs-body' }, h('div', { class: 'azs-prow' }, h('div', { class: 'azs-price' }, money(l.price)), azLike(l)), h('div', { class: 'azs-title' }, l.title),
      h('div', { class: 'azs-meta' }, '\u{1F4CD} ' + (l.city || '')), h('div', { class: 'azs-meta' }, '\u{1F552} ' + ago(l.created_at)), h('div', { class: 'azs-meta' }, '\u{1F464} ' + l.seller_name),
      h('div', { class: 'azs-row' }, h('button', { class: 'azs-btn azs-contact', onclick: (e) => { e.stopPropagation(); contact(l); } }, 'Contact'),
        h('button', { class: 'azs-flag', 'aria-label': 'Report this ad', onclick: (e) => { e.stopPropagation(); report(l); } }, '\u2691'))));
}
async function load() {
  const ui = S.ui; if (!ui) return;
  let q = S.sb.from('azs_listings').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(60);
  if (S.cat) q = q.eq('category', S.cat);
  if (S.q) q = q.ilike('title', '%' + S.q.replace(/[%,]/g, '') + '%');
  const { data, error } = await q; if (ui !== S.ui) return;
  ui.grid.textContent = '';
  if (error) { ui.grid.append(h('p', { class: 'azs-empty' }, 'Could not load ads: ' + error.message)); return; }
  if (!data.length) ui.grid.append(h('p', { class: 'azs-empty' }, 'No ads found yet.'));
  data.forEach((l) => ui.grid.append(card(l)));
}
function detail(l) {
  const acts = h('div', { class: 'azs-row' });
  const m = modal(l.title, azBig(l), h('div', { class: 'azs-prow' }, h('div', { class: 'azs-price' }, money(l.price)), azLike(l)),
    h('p', { class: 'azs-meta' }, [l.category, l.condition, l.city, ago(l.created_at), l.seller_name].filter(Boolean).join(' \u2022 ')),
    h('p', { style: 'white-space:pre-wrap;word-break:break-word' }, l.description || 'No description.'), acts);
  acts.append(h('button', { class: 'azs-btn azs-contact', onclick: () => { m.close(); contact(l); } }, 'Chat with seller'));
  if (l.lat != null) acts.append(h('a', { class: 'azs-btn azs-ghost', style: 'text-decoration:none', href: mapsUrl(l.lat, l.lng), target: '_blank', rel: 'noopener' }, '\u{1F4CD} Map'));
}
async function report(l) {
  if (!S.me) return login(() => report(l));
  const reason = await ask({ title: 'Report this ad', text: 'What is wrong with this ad? The admin will review it.', input: true, placeholder: 'Short reason', ok: 'Send report', danger: true });
  if (!reason) return;
  const { error } = await S.sb.from('azs_reports').insert({ listing_id: l.id, reporter_id: S.me.id, reason });
  toast(error ? error.message : 'Thanks, the admin will review it', error ? 'bad' : '');
}

// ---------- post / my ads / admin ----------
function post() {
  if (!S.me) return login(post);
  const body = h('div'); const m = modal('Post ad', body);
  const unl = S.prof && S.prof.seller_status === 'approved';
  body.append(h('p', { class: 'azs-note' }, unl ? 'Your seller account is approved: unlimited ads.' : 'Free account: ' + S.used + ' of 2 ads used. The admin can approve your seller account for unlimited ads.'),
    h('p', { class: 'azs-sub' }, 'Choose a category'),
    h('div', { class: 'azs-tiles' }, CATS.map((c) => h('button', { class: 'azs-tile', onclick: () => form(c) }, h('b', {}, c[1]), c[0]))));
  function form(cat) {
    const err = h('div', { class: 'azs-err' }), where = h('small', {}, ''); let pos = null;
    const f = { title: h('input', { class: 'azs-input', maxlength: 80 }), price: h('input', { class: 'azs-input', type: 'number', min: 0, step: 'any', inputmode: 'decimal' }),
      cond: h('select', { class: 'azs-input' }, ['used', 'new', 'refurbished'].map((v) => h('option', { value: v }, v))),
      city: h('input', { class: 'azs-input', maxlength: 60, placeholder: 'e.g. Bole, Addis Ababa' }), desc: h('textarea', { class: 'azs-input', maxlength: 2000 }) };
    const send = h('button', { class: 'azs-btn', onclick: submit }, 'Submit ad'); body.textContent = '';
    body.append(h('p', { class: 'azs-note' }, cat[1] + ' ' + cat[0]), h('label', { class: 'azs-field' }, 'Title', f.title), h('label', { class: 'azs-field' }, 'Price (ETB)', f.price),
      h('label', { class: 'azs-field' }, 'Condition', f.cond), h('label', { class: 'azs-field' }, 'City / area', f.city), h('label', { class: 'azs-field' }, 'Description', f.desc),
      h('button', { class: 'azs-btn azs-ghost', onclick: () => navigator.geolocation.getCurrentPosition((p) => { pos = p.coords; where.textContent = ' Location added'; }, () => toast('Location permission denied', 'bad'), { enableHighAccuracy: true, timeout: 15000 }) }, '\u{1F4CD} Add my location'),
      where, err, h('div', { class: 'azs-row' }, send));
    async function submit() {
      err.textContent = ''; if (!f.title.value.trim() || f.price.value === '') { err.textContent = 'Title and price are required'; return; }
      send.disabled = true;
      const { error } = await S.sb.from('azs_listings').insert({ category: cat[0], icon: cat[1], title: f.title.value.trim(), price: Number(f.price.value), condition: f.cond.value,
        city: f.city.value.trim(), description: f.desc.value.trim(), lat: pos ? pos.latitude : null, lng: pos ? pos.longitude : null });
      if (error) { err.textContent = error.message; send.disabled = false; return; }
      S.used++; m.close(); toast('Your ad is live!'); load();
    }
  }
}
async function mine() {
  const { data, error } = await S.sb.from('azs_listings').select('id,title,price,status').eq('seller_id', S.me.id).order('id', { ascending: false });
  if (error) { toast(error.message, 'bad'); return; }
  const m = modal('My ads', data.length ? data.map((r) => h('div', { class: 'azs-item' }, h('div', {}, r.title, h('small', {}, money(r.price))), h('span', { class: 'azs-st' }, r.status),
    r.status === 'removed' ? null : h('button', { class: 'azs-link', onclick: async () => {
      if (!(await ask({ title: 'Remove this ad?', text: 'Buyers will no longer see it.', ok: 'Remove', danger: true }))) return;
      const u = await S.sb.from('azs_listings').update({ status: 'removed' }).eq('id', r.id);
      if (u.error) { toast(u.error.message, 'bad'); return; } S.used = Math.max(0, S.used - 1); m.close(); mine(); load(); toast('Ad removed'); } }, 'Remove'))) : h('p', { class: 'azs-empty' }, 'You have no ads yet.'));
}
async function admin() {
  const [s, r] = await Promise.all([S.sb.from('azs_profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }).limit(100),
    S.sb.from('azs_reports').select('id,reason,listing_id,azs_listings(title)').order('id', { ascending: false }).limit(30)]);
  if (s.error || r.error) { toast((s.error || r.error).message, 'bad'); return; }
  const box = h('div'); const m = modal('Admin', box);
  const act = (fn, w) => async () => { if (w && !(await ask({ title: w[0], text: w[1], ok: w[2], danger: true }))) return; const x = await fn(); if (x.error) { toast(x.error.message, 'bad'); return; } m.close(); admin(); load(); };
  const setS = (id, v) => () => S.sb.from('azs_profiles').update({ seller_status: v }).eq('id', id);
  box.append(h('p', { class: 'azs-sub' }, 'Sellers (approve = unlimited ads)'),
    ...s.data.map((u) => h('div', { class: 'azs-item' }, h('div', {}, u.name, h('small', {}, u.seller_status)),
      h('div', {}, h('button', { class: 'azs-btn', onclick: act(setS(u.id, 'approved')) }, 'Approve'), ' ',
        h('button', { class: 'azs-btn azs-danger', onclick: act(setS(u.id, 'blocked'), ['Block this seller?', 'They will not be able to post ads.', 'Block']) }, 'Block')))),
    h('p', { class: 'azs-sub' }, 'Recent reports'),
    ...r.data.map((x) => h('div', { class: 'azs-item' }, h('div', {}, (x.azs_listings && x.azs_listings.title) || 'Ad', h('small', {}, x.reason)),
      h('button', { class: 'azs-btn azs-danger', onclick: act(() => S.sb.from('azs_listings').update({ status: 'removed' }).eq('id', x.listing_id), ['Remove this ad?', 'It disappears from the Store.', 'Remove']) }, 'Remove ad'))));
}

// ---------- chat ----------
const ckey = (m) => m.listing_id + '_' + m.buyer_id;
function convs() {
  const g = {}; S.msgs.forEach((x) => { const k = ckey(x); (g[k] = g[k] || { key: k, listing_id: x.listing_id, buyer_id: x.buyer_id, seller_id: x.seller_id, title: x.title, list: [] }).list.push(x); });
  return Object.values(g).map((c) => { c.last = c.list[c.list.length - 1]; const o = c.list.find((x) => x.sender_id !== S.me.id);
    c.other = o ? o.sender_name : (c.seller_id === S.me.id ? 'Buyer' : 'Seller'); return c; }).sort((a, b) => new Date(b.last.created_at) - new Date(a.last.created_at));
}
const unreadOf = (c) => c.list.filter((x) => x.sender_id !== S.me.id && new Date(x.created_at) > new Date(S.read[c.key] || 0)).length;
function markRead(key) { const c = convs().find((x) => x.key === key); if (!c) return; S.read[key] = c.last.created_at;
  try { localStorage.setItem('azs_read_' + S.me.id, JSON.stringify(S.read)); } catch (e) { /* ignore */ } badges(); }
function badges() {
  const n = S.me ? convs().reduce((a, c) => a + unreadOf(c), 0) : 0;
  document.querySelectorAll('.azs-cb').forEach((b) => { b.textContent = n > 99 ? '99+' : String(n); b.style.display = n ? 'inline-flex' : 'none'; });
}
async function contact(l) {
  if (!S.me) return login(() => contact(l));
  if (!l.seller_id) { toast('This is a sample ad. Post your own ad to try the chat.'); return; }
  if (l.seller_id === S.me.id) { toast('This is your own ad', 'bad'); return; }
  const key = l.id + '_' + S.me.id;
  if (!convs().some((c) => c.key === key)) {
    const { data, error } = await S.sb.from('azs_messages').insert({ listing_id: l.id, buyer_id: S.me.id, body: 'Hello! Is "' + l.title + '" still available?' }).select().single();
    if (error) { toast(error.message, 'bad'); return; } onMsg(data);
  }
  openChats(key);
}
function sub() {
  if (S.ch || !S.sb || !S.me) return;
  S.ch = S.sb.channel('azs-' + S.me.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'azs_messages' }, (p) => onMsg(p.new))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'azs_live' }, (p) => onLive(p.new)).subscribe();
}
function unsub() { if (S.ch) { S.sb.removeChannel(S.ch); S.ch = null; } }
function onMsg(m) {
  if (!m || S.msgs.some((x) => x.id === m.id)) return; S.msgs.push(m);
  const k = ckey(m), open = S.chat && S.chat.key === k;
  if (m.sender_id !== S.me.id) { if (open && !document.hidden) { markRead(k); azBeep(); } else notify(m, k); }
  badges(); paint();
}
function notify(m, k) {
  const text = m.lat != null ? '\u{1F4CD} Shared a live location' : String(m.body || '').slice(0, 80);
  toast(h('div', {}, h('b', {}, m.sender_name || 'New message'), text), 'msg', () => openChats(k));
  try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) { /* ignore */ }
  azBeep();
  try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted') { const n = new Notification(m.sender_name || 'New message', { body: text, tag: 'azs-' + k }); n.onclick = () => { window.focus(); openChats(k); n.close(); }; } } catch (e) { /* ignore */ }
}
function onLive(r) {
  if (!r || r.user_id === S.me.id) return; const k = r.listing_id + '_' + r.buyer_id;
  if (r.active) S.live[k] = { lat: r.lat, lng: r.lng, at: r.updated_at }; else delete S.live[k]; paint();
}
async function openChats(key) {
  if (!S.me) return login(() => openChats(key));
  closeChats();
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* ignore */ }
  const C = { key: key || '', listEl: h('div'), titleEl: h('span', {}, 'Chat'), liveEl: h('div'), msgsEl: h('div', { class: 'azs-msgs' }) };
  const input = h('input', { class: 'azs-input', maxlength: 1000, placeholder: 'Type a message', 'aria-label': 'Message' });
  const cur = () => convs().find((c) => c.key === C.key);
  const send = async () => { const c = cur(), t = input.value.trim(); if (!c || !t) return; input.value = '';
    const { data, error } = await S.sb.from('azs_messages').insert({ listing_id: c.listing_id, buyer_id: c.buyer_id, body: t }).select().single();
    if (error) { input.value = t; toast(error.message, 'bad'); } else onMsg(data); };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  C.shareBtn = h('button', { class: 'azs-btn azs-ghost', 'aria-label': 'Share live location', onclick: () => { const c = cur(); if (c) share(c); else toast('Open a chat first', 'bad'); } }, '\u{1F4CD}');
  C.wrap = h('div', { class: 'azs-chat' + (key ? ' in-thread' : '') },
    h('div', { class: 'azs-clist' }, h('div', { class: 'azs-ch' }, h('span', {}, 'My chats'), azMuteBtn(), h('button', { class: 'azs-x', 'aria-label': 'Close chats', onclick: closeChats }, '\u00D7')), C.listEl),
    h('div', { class: 'azs-thread' }, h('div', { class: 'azs-ch' }, h('button', { class: 'azs-btn azs-ghost azs-back', onclick: () => C.wrap.classList.remove('in-thread') }, '\u2190'), C.titleEl,
      h('button', { class: 'azs-x', 'aria-label': 'Close chats', onclick: closeChats }, '\u00D7')), C.liveEl, C.msgsEl,
      h('div', { class: 'azs-compose' }, C.shareBtn, input, h('button', { class: 'azs-btn', onclick: send }, 'Send'))));
  document.body.append(C.wrap); S.chat = C; if (key) markRead(key); paint();
  const lv = await S.sb.from('azs_live').select('*').eq('active', true).gt('updated_at', new Date(Date.now() - 90000).toISOString());
  (lv.data || []).forEach((r) => { if (r.user_id !== S.me.id) S.live[r.listing_id + '_' + r.buyer_id] = { lat: r.lat, lng: r.lng, at: r.updated_at }; }); paint();
}
function closeChats() { stopShare(); if (S.chat) { S.chat.wrap.remove(); S.chat = null; } }
function paint() {
  const C = S.chat; if (!C) return; const cs = convs();
  C.listEl.textContent = '';
  if (!cs.length) C.listEl.append(h('p', { class: 'azs-empty' }, 'No chats yet. Tap Contact on an ad.'));
  cs.forEach((c) => { const n = unreadOf(c);
    C.listEl.append(h('div', { class: 'azs-conv' + (c.key === C.key ? ' on' : ''), onclick: () => { C.key = c.key; markRead(c.key); C.wrap.classList.add('in-thread'); paint(); } },
      h('b', {}, c.other, n ? h('span', { class: 'azs-nb' }, String(n)) : null), h('small', {}, c.title || ''), h('small', {}, c.last.lat != null ? '\u{1F4CD} Live location' : c.last.body))); });
  const c = cs.find((x) => x.key === C.key);
  C.titleEl.textContent = c ? c.other + ' \u2022 ' + c.title : 'Chat';
  C.msgsEl.textContent = '';
  if (!c) C.msgsEl.append(h('p', { style: 'margin:auto;color:var(--mu)' }, 'Select a chat'));
  else c.list.forEach((m) => { const me = m.sender_id === S.me.id; const b = h('div', { class: 'azs-msg' + (me ? ' me' : '') });
    if (m.lat != null) b.append(h('div', {}, '\u{1F4CD} Live location started'), h('a', { class: 'azs-link', href: mapsUrl(m.lat, m.lng), target: '_blank', rel: 'noopener' }, 'View start point'));
    else b.append(m.body);
    b.append(h('time', {}, hhmm(m.created_at))); C.msgsEl.append(b); });
  C.msgsEl.scrollTop = C.msgsEl.scrollHeight;
  C.liveEl.textContent = ''; const lv = c && S.live[c.key];
  if (lv && Date.now() - new Date(lv.at) < 90000) C.liveEl.append(h('div', { class: 'azs-live' }, '\u{1F4CD} Live location \u2022 updated ' + new Date(lv.at).toLocaleTimeString() + ' \u2022 ',
    h('a', { class: 'azs-link', href: mapsUrl(lv.lat, lv.lng), target: '_blank', rel: 'noopener' }, 'Open in maps')));
  C.shareBtn.textContent = S.watch != null ? '\u23F9 Stop' : '\u{1F4CD}';
}
async function share(c) {
  if (S.watch != null) { stopShare(); return; }
  if (!navigator.geolocation) { toast('Location is not supported on this device', 'bad'); return; }
  if (!(await ask({ title: 'Share live location?', text: 'This person will see where you are for 15 minutes. You can stop any time.', ok: 'Share' }))) return;
  let last = 0, first = true; S.shareConv = c;
  S.watch = navigator.geolocation.watchPosition(async (p) => {
    const now = Date.now(); if (now - last < 5000) return; last = now;
    await S.sb.from('azs_live').upsert({ listing_id: c.listing_id, buyer_id: c.buyer_id, seller_id: c.seller_id, user_id: S.me.id, lat: p.coords.latitude, lng: p.coords.longitude, active: true, updated_at: new Date().toISOString() });
    if (first) { first = false; const r = await S.sb.from('azs_messages').insert({ listing_id: c.listing_id, buyer_id: c.buyer_id, body: 'Started sharing live location', lat: p.coords.latitude, lng: p.coords.longitude }).select().single(); if (r.data) onMsg(r.data); }
  }, (e) => { toast(e.code === 1 ? 'Location permission denied' : 'Could not get your location', 'bad'); stopShare(); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  S.shareTimer = setTimeout(stopShare, 15 * 60 * 1000); toast('Sharing live location'); paint();
}
function stopShare() {
  if (S.watch == null) return; navigator.geolocation.clearWatch(S.watch); S.watch = null; clearTimeout(S.shareTimer);
  const c = S.shareConv; S.shareConv = null;
  if (c && S.sb) S.sb.from('azs_live').update({ active: false }).eq('listing_id', c.listing_id).eq('buyer_id', c.buyer_id).eq('user_id', S.me.id).then(function () {});
  paint();
}

// ---------- mount (the app re-creates #shop-root each time the Store tab opens) ----------
async function mount(root) {
  build(root); drawCats(); drawTop();
  try { await init(); } catch (e) { S.ui.grid.append(h('p', { class: 'azs-empty' }, e.message)); return; }
  drawTop(); load();
}
if (/type=recovery/.test(location.hash)) { init().catch(function () {}); }
function check() { const r = document.getElementById('shop-root'); if (r && r.dataset.azs !== '3') { r.dataset.azs = '3'; mount(r); } }
new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
})();
