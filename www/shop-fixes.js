(function () {
  'use strict';
  var CFG = { pollMs: 30000, toastMs: 4500, urlPattern: 'chat|message|thread|conversation', toastTitle: 'New message' };
  var rf = window.fetch.bind(window);
  rf('shop-fixes.json').then(function (r) { return r.json(); })
    .then(function (j) { for (var k in j) CFG[k] = j[k]; }).catch(function () {});

  /* ===== A. Fix "[object HTMLDivElement]" =====
     When a DOM element is turned into text, leave a token and swap the real element in. */
  var reg = {}, seq = 0, OPEN = '\u27E6azn:', CLOSE = '\u27E7';
  HTMLElement.prototype.toString = function () {
    var id = ++seq; reg[id] = this; return OPEN + id + CLOSE;
  };
  var tokenRe = /\u27E6azn:(\d+)\u27E7/;
  function fixNodes(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [], t;
    while ((t = w.nextNode())) {
      if (t.nodeValue.indexOf(OPEN) > -1 || t.nodeValue.indexOf('[object HTML') > -1) list.push(t);
    }
    list.forEach(function (tn) {
      if (!tn.parentNode) return;
      var txt = tn.nodeValue.replace(/\[object HTML[A-Za-z]*Element\]/g, '');
      var parts = txt.split(/\u27E6azn:(\d+)\u27E7/), frag = document.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (i % 2 === 0) { if (p) frag.appendChild(document.createTextNode(p)); }
        else if (reg[p]) { frag.appendChild(reg[p]); delete reg[p]; }
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }

  /* ===== B. Chat notifications ===== */
  var SEEN_KEY = 'azfx_seen';
  var seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (e) {}
  var unread = 0, lastReq = null, firstScan = true;
  function saveSeen() { try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {} }

  function toast(title, body) {
    var t = document.getElementById('azfx-toast');
    if (!t) { t = document.createElement('div'); t.id = 'azfx-toast'; document.body.appendChild(t); }
    t.textContent = '';
    var b = document.createElement('b'); b.textContent = title;
    t.appendChild(b); t.appendChild(document.createTextNode(body || ''));
    t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, CFG.toastMs);
    try {
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(title, { body: body || '' });
    } catch (e) {}
  }

  function chatsButton() {
    var bs = document.querySelectorAll('button, a');
    for (var i = 0; i < bs.length; i++) {
      var tx = (bs[i].getAttribute('data-azfx-label') || bs[i].textContent || '').trim();
      if (/^Chats/i.test(tx)) { bs[i].setAttribute('data-azfx-label', 'Chats'); return bs[i]; }
    }
    return null;
  }
  function paintBadge() {
    var b = chatsButton(); if (!b) return;
    var s = b.querySelector('.azfx-badge');
    if (unread > 0) {
      if (!s) { s = document.createElement('span'); s.className = 'azfx-badge'; b.appendChild(s); }
      s.textContent = unread > 99 ? '99+' : String(unread);
    } else if (s) s.remove();
  }

  function scan(d) {
    var list = Array.isArray(d) ? d : (d && (d.chats || d.threads || d.conversations || d.items || d.data)) || [];
    if (!Array.isArray(list)) return;
    var count = 0, newest = null;
    list.forEach(function (c) {
      var id = c.id || c.chat_id || c.thread_id; if (id == null) return;
      var ts = Date.parse(c.last_message_at || c.updated_at || c.last_at || c.created_at || 0) || 0;
      var n = (typeof c.unread === 'number') ? c.unread : (typeof c.unread_count === 'number') ? c.unread_count : (ts > (seen[id] || 0) ? 1 : 0);
      if (n > 0) { count += n; newest = c; }
    });
    var grew = count > unread;
    unread = count; paintBadge();
    if (grew && !firstScan && newest) {
      toast(CFG.toastTitle, (newest.other_name || newest.name || newest.title || 'Someone') + ' sent you a message');
    }
    firstScan = false;
    window.__azfxChats = list;
  }

  window.fetch = function (u, o) {
    var p = rf(u, o);
    try {
      var s = String((u && u.url) || u);
      var isGet = !o || !o.method || String(o.method).toUpperCase() === 'GET';
      if (isGet && s.indexOf('/api/') > -1 && new RegExp(CFG.urlPattern, 'i').test(s)) {
        lastReq = [u, o];
        p.then(function (r) { return r.clone().json().then(scan); }).catch(function () {});
      }
    } catch (e) {}
    return p;
  };

  // Poll the same chats request every pollMs while the app is visible
  setInterval(function () {
    if (document.hidden || !lastReq) return;
    rf(lastReq[0], lastReq[1]).then(function (r) { return r.json(); }).then(scan).catch(function () {});
  }, CFG.pollMs);

  // Opening Chats clears the badge and marks everything as read; asks for notification permission once
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-azfx-label="Chats"], button, a');
    if (!b || !/^Chats/i.test((b.getAttribute('data-azfx-label') || b.textContent || '').trim())) return;
    var now = Date.now();
    (window.__azfxChats || []).forEach(function (c) { var id = c.id || c.chat_id || c.thread_id; if (id != null) seen[id] = now; });
    saveSeen(); unread = 0; paintBadge();
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (er) {}
  }, true);

  /* ===== Keep everything fixed as the UI re-renders ===== */
  var busy = false;
  new MutationObserver(function () {
    if (busy) return; busy = true;
    requestAnimationFrame(function () { try { fixNodes(document.body); paintBadge(); } finally { busy = false; } });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('DOMContentLoaded', function () { fixNodes(document.body); });
})();
