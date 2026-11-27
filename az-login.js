/* Azmari: no automatic popup; registered users log in with email and password */
(function () {
  if (typeof openAcct !== "function") return;
  var create = openAcct, oldBtn = acBtn, saving = false;
  function client() { return window.azSupabase; }
  function user() {
    var sb = client(); if (!sb) return Promise.resolve(null);
    return sb.auth.getSession().then(function (r) { return r.data && r.data.session ? r.data.session.user : null; }).catch(function () { return null; });
  }
  /* new device: bring back name and phone saved with the login */
  function restore(u) {
    var m = (u && u.user_metadata) || {};
    if (acct || !m.az_name || !m.az_phone) return false;
    acct = { name: String(m.az_name), phone: String(m.az_phone), email: u.email || "", pic: null, ts: Date.now() };
    try { localStorage.setItem("acct", JSON.stringify(acct)); } catch (e) {}
    oldBtn(); render();
    return true;
  }
  /* remember name and phone with the login, only for the same person's email */
  function save() {
    if (!acct || saving) return;
    saving = true;
    user().then(function (u) {
      if (!u || !acct) return;
      if (acct.email && acct.email.toLowerCase() !== String(u.email).toLowerCase()) return;
      var m = u.user_metadata || {};
      if (m.az_name === acct.name && m.az_phone === acct.phone) return;
      return client().auth.updateUser({ data: { az_name: acct.name, az_phone: acct.phone } });
    }).catch(function () {}).then(function () { saving = false; });
  }
  window.acBtn = function () { oldBtn(); save(); };
  window.openAcct = function () {
    if (acct || !window.azOpenLogin) return create();
    user().then(function (u) {
      if (!u) return window.azOpenLogin();
      if (!restore(u)) create();
    });
  };
  /* a way to register from the login window */
  new MutationObserver(function () {
    var d = document.querySelector('.sheet [role="dialog"][aria-label="Email login"]');
    if (!d || acct || d.querySelector(".aznew") || !d.querySelector("#azin, #azout")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn ln aznew";
    b.textContent = d.querySelector("#azout") ? "Complete my profile" : "New here? Create account";
    b.onclick = function () { d.parentNode.remove(); create(); };
    d.insertBefore(b, d.querySelector("#azm"));
  }).observe(document.body, { childList: true });
  /* "Sign out" in the account window also logs out the email login */
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#ao") && window.azAuthSignOut) window.azAuthSignOut();
  }, true);
  function start() {
    var sb = client(); if (!sb) return;
    sb.auth.onAuthStateChange(function (ev, s) {
      if (s && (ev === "SIGNED_IN" || ev === "INITIAL_SESSION")) setTimeout(function () { if (!restore(s.user)) save(); }, 0);
    });
  }
  start();
})();
