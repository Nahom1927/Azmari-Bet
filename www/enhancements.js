(function () {
  var URL = "https://rnqizccrzbolsynfsxbu.supabase.co/rest/v1/rpc/";
  var KEY = "sb_publishable_1pbzO1FOGTjIjjE-yF7d1A__OFPESB2";
  var oset = Storage.prototype.setItem;
  function rpc(fn, b) {
    return fetch(URL + fn, { method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify(b) })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.status === 204 ? null : r.json(); });
  }
  function ac() { try { return JSON.parse(localStorage.getItem("acct") || "null") || {}; } catch (e) { return {}; } }
  function say(m) { try { toast(m); } catch (e) { alert(m); } }
  function jget(k, d) { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } }

  /* ---------- registration edit counter ---------- */
  var EK = "az_edits_used", MAX = 3;
  function used(p) { return +(jget(EK, "{}")[p] || 0); }
  function setUsed(p, n) { var m = jget(EK, "{}"); m[p] = n; oset.call(localStorage, EK, JSON.stringify(m)); }

  /* ---------- posts + edit counter hook ---------- */
  Storage.prototype.setItem = function (k, v) {
    try {
      if (k === "acct") {
        var oo = JSON.parse(this.getItem("acct") || "null"), nn = JSON.parse(v);
        if (oo && oo.phone && nn) {
          var A = Object.assign({}, oo), B = Object.assign({}, nn); delete A.pic; delete B.pic;
          if (JSON.stringify(A) !== JSON.stringify(B)) {
            if (used(oo.phone) >= MAX) { say("Edits left: 0. Ask the admin to reset."); setTimeout(function () { location.reload(); }, 1500); return; }
            var n = used(oo.phone) + 1; setUsed(oo.phone, n);
            say("Edits left: " + (MAX - n));
            rpc("app_use_reg_edit", { p_phone: oo.phone }).catch(function () {});
          }
        }
      }
    } catch (e) {}
    oset.apply(this, arguments);
    try {
      if (k === "ab_jobs") {
        var o = JSON.parse(v), j = o && o[0];
        if (j && !j._r && j.t) {
          var sig = j.id + "|" + j.title, s = jget("az_posts_sent", "[]");
          if (s.indexOf(sig) < 0) {
            s.push(sig); oset.call(localStorage, "az_posts_sent", JSON.stringify(s.slice(-100)));
            var a = ac();
            rpc("app_submit_post", { p_kind: "job", p_name: a.name || j.by || "", p_phone: a.phone || "", p_data: j })
              .then(function () { say("Sent for admin approval"); }).catch(function () {});
          }
        }
      }
    } catch (e) {}
  };

  function loadPosts() {
    rpc("app_list_posts", {}).then(function (rows) {
      if (!rows) return;
      rows.forEach(function (r) {
        var d = r.data || {}; d._r = 1; d.id = "r" + r.id; d.by = d.by || r.author_name;
        if (!JOBS.some(function (x) { return x.id === d.id || (x.title === d.title && x.by === d.by); })) JOBS.push(d);
      });
      try { render(); } catch (e) {}
    }).catch(function () {});
  }
  function syncEdits() {
    var a = ac(); if (!a.phone) return;
    rpc("app_reg_edits_used", { p_phone: a.phone }).then(function (n) { if (typeof n === "number") setUsed(a.phone, n); }).catch(function () {});
  }

  /* ---------- profile picture popup before location ---------- */
  var st = document.createElement("style");
  st.textContent = "@keyframes azglow{0%,100%{box-shadow:0 0 0 0 rgba(60,200,255,.9)}50%{box-shadow:0 0 18px 8px rgba(60,200,255,.7)}}" +
    "#azpop{position:fixed;inset:0;background:rgba(2,18,38,.7);display:flex;align-items:center;justify-content:center;z-index:99999}" +
    "#azpop div{background:var(--sf,#fff);color:var(--ink,#0d1b3a);border-radius:16px;padding:22px;max-width:320px;text-align:center}" +
    "#azpop button{margin:8px 4px 0;padding:12px 18px;border:0;border-radius:12px;font-weight:700;background:#0a66ff;color:#fff}" +
    "#azpop .glow{animation:azglow 1s infinite}";
  document.head.appendChild(st);

  function popup() {
    var o = document.createElement("div"); o.id = "azpop";
    o.innerHTML = '<div><h3>Upload your profile picture</h3><p>Add a picture first, then you can turn on location.</p>' +
      '<button class="glow" id="azup">Upload picture</button><button id="azx" style="background:#8fa3d1">Later</button>' +
      '<input type="file" id="azfile" accept="image/*" style="display:none"></div>';
    document.body.appendChild(o);
    o.querySelector("#azx").onclick = function () { o.remove(); };
    o.querySelector("#azup").onclick = function () { o.querySelector("#azfile").click(); };
    o.querySelector("#azfile").onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var img = new Image(), fr = new FileReader();
      fr.onload = function () { img.src = fr.result; };
      img.onload = function () {
        var c = document.createElement("canvas"), s = 256; c.width = c.height = s;
        var m = Math.min(img.width, img.height);
        c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        var url = c.toDataURL("image/jpeg", .8);
        try { acct.pic = url; } catch (e) {}
        localStorage.setItem("acct", JSON.stringify(Object.assign(ac(), { pic: url })));
        o.remove(); try { render(); } catch (e) {}
        say("Picture saved. Now tap Turn on location");
      };
      fr.readAsDataURL(f);
    };
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button,.btn,.chip,a");
    if (!b || !/turn on location/i.test(b.textContent || "")) return;
    if (ac().pic) return;
    e.stopImmediatePropagation(); e.preventDefault(); popup();
  }, true);

  window.addEventListener("load", function () { setTimeout(function () { loadPosts(); syncEdits(); }, 800); });
})();

(function(){
var s=document.createElement("style");
s.textContent=".azgrid{display:grid!important;grid-template-columns:repeat(2,1fr);gap:10px}"+
"@media(min-width:700px){.azgrid{grid-template-columns:repeat(4,1fr)}}"+
".azgrid>*{grid-column:1/-1}.azgrid>.azp{grid-column:auto}"+
".azp{display:flex!important;flex-direction:column;gap:6px;padding:10px!important;margin:0!important;background:var(--sf);border:1px solid var(--ln);border-radius:14px;box-shadow:0 2px 10px rgba(10,102,255,.10)}"+
".azp .pic{width:100%!important;height:96px!important;font-size:48px!important;margin:0!important;border-radius:10px;background:linear-gradient(135deg,var(--bg),var(--nb))}"+
".azp .chip[data-act=call]{background:var(--gr);color:#fff;border:0;font-weight:700}"+
".azp .chip{margin:3px 3px 0 0}"+
"#azsearch{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:2px solid var(--gr);background:var(--sf);color:var(--ink);position:sticky;top:0;z-index:5}";
document.head.appendChild(s);
var busy=0;
function enhance(){
 if(busy)return;busy=1;
 var cards=[].filter.call(document.querySelectorAll(".card.row"),function(c){return c.querySelector('[data-act="call"]')&&c.querySelector('[data-act="rep"]')&&c.querySelector(".pic")});
 if(cards.length){
  var p=cards[0].parentNode;p.classList.add("azgrid");
  cards.forEach(function(c){c.classList.add("azp")});
  if(!document.getElementById("azsearch")){
   var i=document.createElement("input");i.id="azsearch";i.placeholder="🔍 Search instruments…";
   i.oninput=function(){var q=i.value.toLowerCase();cards.forEach(function(c){c.style.display=c.textContent.toLowerCase().indexOf(q)>=0?"":"none"})};
   p.insertBefore(i,cards[0]);
  }
 }
 busy=0;
}
new MutationObserver(function(){setTimeout(enhance,50)}).observe(document.documentElement,{childList:true,subtree:true});
})();

(function(){
var st=document.createElement("style");
st.textContent="#azstore{position:fixed;right:14px;bottom:80px;z-index:9999;width:auto!important;padding:12px 18px;border-radius:24px;font-weight:800;border:1px solid var(--rb);color:var(--on,#021226);background:linear-gradient(135deg,var(--nb),var(--rb));box-shadow:0 0 10px var(--rb),0 0 22px var(--nb);animation:azneon 2s infinite}@keyframes azneon{0%,100%{box-shadow:0 0 8px var(--rb),0 0 16px var(--nb)}50%{box-shadow:0 0 16px var(--rb),0 0 32px var(--nb)}}";
document.head.appendChild(st);
var b=document.createElement("button");b.id="azstore";b.className="btn";b.textContent="🛒 Store";
b.onclick=function(){var n=document.querySelector('[data-go="store"]');if(n){n.click();return}
try{view="store";render()}catch(e){location.href="shop.html"}};
function put(){if(document.body&&!document.getElementById("azstore"))document.body.appendChild(b)}
document.addEventListener("DOMContentLoaded",put);put();
})();
