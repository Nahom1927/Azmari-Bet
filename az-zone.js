(function () {
  var cache = null, cacheAt = 0;
  function load() {
    if (cache && Date.now() - cacheAt < 15000) return cache;
    cacheAt = Date.now();
    cache = (async function () {
      var sb = window.azSupabase;
      if (!sb) return { msg: "Instructor data is not connected." };
      var s = await sb.auth.getSession();
      if (!s.data || !s.data.session) return { msg: "Log in once on the Student portal to see your instructors.", portal: true };
      var r = await sb.rpc("my_instructors");
      if (r.error) return { msg: r.error.message };
      return { list: r.data || [] };
    })();
    return cache;
  }
  function pic(x) {
    var d;
    if (x.photo_url && /^https:\/\//i.test(x.photo_url)) { d = document.createElement("img"); d.src = x.photo_url; d.alt = ""; }
    else { d = document.createElement("div"); d.textContent = (x.name || "?").charAt(0).toUpperCase(); d.style.display = "flex"; d.style.alignItems = "center"; d.style.justifyContent = "center"; d.style.fontWeight = "700"; d.style.background = "#233"; }
    d.style.width = "48px"; d.style.height = "48px"; d.style.borderRadius = "50%"; d.style.objectFit = "cover"; d.style.flex = "none"; d.style.border = "2px solid #04d9ff";
    return d;
  }
  async function fill(box) {
    var res = await load();
    box.textContent = "";
    var h = document.createElement("h3"); h.textContent = "Your instructors"; box.appendChild(h);
    if (res.msg || !res.list.length) {
      var p = document.createElement("p"); p.className = "mu"; p.textContent = res.msg || "No instructor assigned yet."; box.appendChild(p);
      return;
    }
    var courses = [];
    res.list.forEach(function (x) {
      var row = document.createElement("div"); row.className = "row"; row.style.cssText = "display:flex;gap:12px;align-items:center;margin:8px 0";
      var t = document.createElement("div"), b = document.createElement("b"), m = document.createElement("div");
      b.textContent = ((x.prefix || "") + " " + (x.name || "")).trim(); m.className = "mu"; m.textContent = x.course;
      t.appendChild(b); t.appendChild(m); row.appendChild(pic(x)); row.appendChild(t); box.appendChild(row);
      if (courses.indexOf(x.course) < 0) courses.push(x.course);
    });
    var mp = Array.prototype.filter.call(document.querySelectorAll("p.mu"), function (e) { return /^Major course:/.test(e.textContent); })[0];
    if (mp) { mp.style.color = "#04d9ff"; mp.textContent = "Major course: " + courses.join(", "); }
  }
  function wrap() {
    if (typeof V === "undefined" || !V || !V.zone) return false;
    if (V.zone.__az) return true;
    var old = V.zone;
    V.zone = function () {
      var h = String(old.apply(this, arguments));
      h = h.replace(/<div class="chips"><span class="chip">Music Theory<\/span><span class="chip">Solfeggio<\/span><span class="chip">[^<]*<\/span><\/div>/, "");
      h = h.replace('<p class="mu">Major course:', '<p class="mu" style="color:#04d9ff">Major course:');
      h = h.replace(/<div class="card"><h3>Your instructor<\/h3>[\s\S]*?next class[^<]*<\/div><\/div><\/div><\/div>/, '<div class="card" id="azInstr"><h3>Your instructors</h3><p class="mu">Loading...</p></div>');
      return h;
    };
    V.zone.__az = true;
    return true;
  }
  var tries = 0, iv = setInterval(function () { if (wrap() || ++tries > 50) clearInterval(iv); }, 100);
  new MutationObserver(function () {
    var box = document.getElementById("azInstr");
    if (box && !box.getAttribute("data-done")) { box.setAttribute("data-done", "1"); fill(box); }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
