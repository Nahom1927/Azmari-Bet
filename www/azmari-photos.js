(function () {
  'use strict';
  var MAX = 5;
  var PAY = '<b>Telebirr / CBE Birr:</b> 0911898184<br><b>CBE account:</b> 1000037200534';
  var items = [];
  var realFetch = window.fetch.bind(window);

  function shrink(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 1280 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('Photo could not be processed')); }, 'image/jpeg', 0.8);
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('One file is not a valid image')); };
      img.src = u;
    });
  }

  function payRef() {
    var el = document.getElementById('azp-ref');
    return el ? el.value.trim() : '';
  }

  async function prepare(url, init) {
    var origin = new URL(url).origin;
    var h = new Headers(init.headers || {});
    var auth = h.get('Authorization') || '', key = h.get('apikey') || '';
    var uid = '';
    try { uid = JSON.parse(atob(auth.replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub; } catch (e) { /* ignore */ }
    if (items.length && !uid) throw new Error('Please log in again to upload photos');
    for (var i = 0; i < items.length; i++) {
      if (items[i].remote) continue;
      var blob = await shrink(items[i].file);
      var path = uid + '/' + Date.now() + '-' + i + '.jpg';
      var r = await realFetch(origin + '/storage/v1/object/azs-images/' + path, {
        method: 'POST',
        headers: { Authorization: auth, apikey: key, 'Content-Type': 'image/jpeg' },
        body: blob
      });
      if (!r.ok) throw new Error('Photo upload failed (' + r.status + ')');
      items[i].remote = origin + '/storage/v1/object/public/azs-images/' + path;
    }
    var body = JSON.parse(init.body);
    var rows = Array.isArray(body) ? body : [body];
    var urls = items.map(function (x) { return x.remote; });
    var ref = payRef();
    rows.forEach(function (row) { if (urls.length) row.images = urls; if (ref) row.pay_ref = ref; });
    var next = Object.assign({}, init, { body: JSON.stringify(Array.isArray(body) ? rows : rows[0]) });
    return next;
  }

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = String((init && init.method) || 'GET').toUpperCase();
    if (method === 'POST' && /\/rest\/v1\/azs_listings(\?|$)/.test(url) && init && typeof init.body === 'string' && (items.length || payRef())) {
      return prepare(url, init).then(function (i2) {
        return realFetch(input, i2).then(function (resp) {
          if (resp.ok) { items = []; document.querySelectorAll('.azp-panel').forEach(function (p) { p.remove(); }); }
          return resp;
        });
      });
    }
    return realFetch(input, init);
  };

  function render(panel) {
    var box = panel.querySelector('.azp-prev');
    box.innerHTML = '';
    items.forEach(function (it, i) {
      var w = document.createElement('div');
      w.style.cssText = 'position:relative;width:64px;height:64px';
      var im = document.createElement('img');
      im.src = it.preview;
      im.style.cssText = 'width:64px;height:64px;object-fit:cover;border-radius:8px';
      var x = document.createElement('button');
      x.type = 'button'; x.textContent = '×';
      x.style.cssText = 'position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:0;background:#e5484d;color:#fff;cursor:pointer;line-height:20px;padding:0';
      x.onclick = function () { URL.revokeObjectURL(it.preview); items.splice(i, 1); render(panel); };
      w.append(im, x); box.append(w);
    });
    panel.querySelector('.azp-count').textContent = items.length + ' / ' + MAX + ' photos';
  }

  function build() {
    var p = document.createElement('div');
    p.className = 'azp-panel azs-field';
    p.style.margin = '12px 0';
    p.innerHTML =
      '<div style="margin-bottom:6px">Photos (up to ' + MAX + ') <span class="azp-count" style="opacity:.7"></span></div>' +
      '<input class="azp-file" type="file" accept="image/*" multiple>' +
      '<div class="azp-prev" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px"></div>' +
      '<div style="margin-top:12px">Payment reference <span style="opacity:.7">(only needed after your 10 free ads: 100 birr for 10 more ads)</span></div>' +
      '<div class="azp-pay">' + PAY + '</div>' +
      '<input id="azp-ref" class="azs-input" maxlength="80" placeholder="Telebirr / CBE transaction number">';
    p.querySelector('.azp-file').onchange = function (e) {
      var list = Array.prototype.slice.call(e.target.files);
      list.forEach(function (f) {
        if (items.length < MAX && /^image\//.test(f.type)) items.push({ file: f, preview: URL.createObjectURL(f) });
      });
      e.target.value = '';
      render(p);
    };
    render(p);
    return p;
  }

  function scan() {
    document.querySelectorAll('button').forEach(function (b) {
      if (b.dataset.azp || !/^\s*Submit ad\s*$/i.test(b.textContent)) return;
      b.dataset.azp = '1';
      if (b.parentNode.querySelector('.azp-panel')) return;
      b.parentNode.insertBefore(build(), b);
    });
  }
  var st = document.createElement('style');
  st.textContent =
    '.azp-pay{margin:8px 0 10px;padding:12px 14px;border-radius:12px;border:1px dashed rgba(34,211,238,.5);background:rgba(34,211,238,.08);font-size:.9em;line-height:1.7}' +
    'button[data-azp="1"]{display:block;width:100%;min-height:52px;margin-top:14px;padding:0 24px;border:0;border-radius:14px;' +
    'background:linear-gradient(135deg,#22d3ee,#0ea5e9);color:#04121f;font-size:1.05rem;font-weight:700;letter-spacing:.3px;cursor:pointer;' +
    'box-shadow:0 8px 20px rgba(14,165,233,.35);transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}' +
    'button[data-azp="1"]:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(14,165,233,.5);filter:brightness(1.05)}' +
    'button[data-azp="1"]:active{transform:translateY(0) scale(.98);box-shadow:0 4px 12px rgba(14,165,233,.3)}' +
    'button[data-azp="1"]:focus-visible{outline:3px solid rgba(255,255,255,.6);outline-offset:2px}' +
    'button[data-azp="1"]:disabled{opacity:.6;cursor:wait;transform:none;filter:grayscale(.3)}';
  document.head.appendChild(st);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
