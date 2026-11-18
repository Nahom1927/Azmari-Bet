(function () {
  var sb = supabase.createClient("https://rnqizccrzbolsynfsxbu.supabase.co", "sb_publishable_1pbzO1FOGTjIjjE-yF7d1A__OFPESB2");
  var CODES = {1599:"band_profile",15000:"course_3mo",5998:"event_platinum",2998:"event_gold",1598:"event_silver",798:"event_bronze",398:"event_basic"};
  window.azCode = function (amount, isStore) {
    if (amount === 100) return isStore ? "post" : "seeker_profile";
    return CODES[amount] || null;
  };
  function mk(tag, text, css) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (css) e.style.cssText = css;
    return e;
  }
  function askLogin() {
    return new Promise(function (resolve) {
      var ov = mk("div", "", "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px");
      var box = mk("div", "", "background:#141b33;color:#fff;border-radius:12px;padding:16px;width:100%;max-width:360px;font:15px system-ui,sans-serif");
      var ic = "display:block;width:100%;box-sizing:border-box;padding:10px;margin:6px 0;font-size:16px;border-radius:8px;border:1px solid #556;background:#fff;color:#000";
      var bc = "padding:10px 14px;margin:6px 6px 0 0;border:0;border-radius:8px;font-size:15px;color:#000;background:#29c5ff";
      var em = mk("input", "", ic); em.type = "email"; em.placeholder = "Email";
      var pw = mk("input", "", ic); pw.type = "password"; pw.placeholder = "Password (6+ characters)";
      var note = mk("p", "", "color:#ffb3b3;margin:6px 0");
      function done(ok) { ov.remove(); resolve(ok); }
      var bi = mk("button", "Log in", bc);
      bi.onclick = async function () {
        var r = await sb.auth.signInWithPassword({ email: em.value.trim(), password: pw.value });
        if (r.error) note.textContent = r.error.message; else done(true);
      };
      var bs = mk("button", "Sign up", bc);
      bs.onclick = async function () {
        var r = await sb.auth.signUp({ email: em.value.trim(), password: pw.value });
        if (r.error) note.textContent = r.error.message;
        else if (!r.data.session) note.textContent = "Check your email to confirm, then log in.";
        else done(true);
      };
      var bx = mk("button", "Cancel", bc.replace("#29c5ff", "#cfd8e3"));
      bx.onclick = function () { done(false); };
      box.appendChild(mk("h3", "Log in to send your payment", "margin:0 0 8px"));
      box.appendChild(em); box.appendChild(pw);
      box.appendChild(bi); box.appendChild(bs); box.appendChild(bx); box.appendChild(note);
      ov.appendChild(box);
      document.body.appendChild(ov);
    });
  }
  window.azOrder = async function (code, label, ref) {
    try {
      var s = (await sb.auth.getSession()).data.session;
      if (!s) {
        var ok = await askLogin();
        if (!ok) return { ok: false, msg: "Log in is needed to send your payment" };
      }
      var r = await sb.from("orders").insert({ product_code: code, reference: ref, item_ref: String(label).slice(0, 120) });
      if (r.error) return { ok: false, msg: r.error.code === "23505" ? "That transaction ID was already submitted." : "Could not send. Try again." };
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: "Network problem. Try again." };
    }
  };
})();
