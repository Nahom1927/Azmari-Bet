(function () {
  var sb = supabase.createClient("https://rnqizccrzbolsynfsxbu.supabase.co", "sb_publishable_1pbzO1FOGTjIjjE-yF7d1A__OFPESB2");
  var PRICE = 200;

  var bar = document.createElement("div");
  bar.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#111;color:#fff;padding:12px;font:14px sans-serif;text-align:center";
  document.body.appendChild(bar);
  var content = document.getElementById("premium");
  if (!content) {
    content = document.createElement("div");
    content.style.cssText = "padding:16px 16px 120px;font:15px sans-serif";
    document.body.appendChild(content);
  }

  function el(tag, text, onclick) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (onclick) e.onclick = onclick;
    e.style.cssText = "margin:4px;padding:8px 12px;font-size:14px";
    return e;
  }
  function line(parent, text, bold) {
    var p = document.createElement("p");
    p.textContent = text;
    p.style.margin = "6px 0";
    if (bold) p.style.fontWeight = "bold";
    parent.appendChild(p);
  }
  function msg(t) { bar.textContent = t; }

  async function isPaid() {
    var r = await sb.from("entitlements").select("user_id").maybeSingle();
    return !!r.data;
  }

  async function showPremium() {
    var r = await sb.from("premium_content").select("title,body").order("id");
    content.textContent = "";
    (r.data || []).forEach(function (row) {
      var h = document.createElement("h3"); h.textContent = row.title;
      var p = document.createElement("p"); p.textContent = row.body;
      content.appendChild(h); content.appendChild(p);
    });
  }

  async function showPayment() {
    content.textContent = "";
    var box = document.createElement("div");
    box.style.cssText = "border:1px solid #888;border-radius:8px;padding:12px";
    line(box, "Unlock Azmari Bet: " + PRICE + " ETB", true);
    line(box, "1. Send " + PRICE + " ETB to:");
    line(box, "Telebirr: +251911898184", true);
    line(box, "CBE: 1000037200534", true);
    line(box, "Name: Nahom Zewge Tesfaye");
    line(box, "2. Enter the transaction ID from your payment receipt below.");
    var inp = el("input"); inp.placeholder = "Transaction ID"; inp.style.width = "90%";
    box.appendChild(inp);
    box.appendChild(el("button", "Submit payment", async function () {
      var ref = inp.value.trim();
      if (!/^[A-Za-z0-9]{6,40}$/.test(ref)) { msg("Enter a valid transaction ID (letters and numbers only)."); return; }
      var r = await sb.from("payment_claims").insert({ reference: ref, amount: PRICE });
      if (r.error) msg(r.error.code === "23505" ? "That transaction ID was already submitted." : "Could not submit. Try again.");
      else { msg("Submitted. We will unlock your account after checking."); render(); }
    }));
    content.appendChild(box);

    var c = await sb.from("payment_claims").select("reference,status").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (c.data) {
      var s = c.data.status === "pending" ? "waiting for approval"
            : c.data.status === "rejected" ? "rejected (contact us)" : c.data.status;
      line(content, "Last submission " + c.data.reference + ": " + s);
    }
  }

  async function render() {
    var s = (await sb.auth.getSession()).data.session;
    bar.textContent = "";
    if (!s) {
      content.textContent = "";
      var em = el("input"); em.type = "email"; em.placeholder = "Email";
      var pw = el("input"); pw.type = "password"; pw.placeholder = "Password";
      bar.appendChild(em); bar.appendChild(pw);
      bar.appendChild(el("button", "Log in", async function () {
        var r = await sb.auth.signInWithPassword({ email: em.value, password: pw.value });
        if (r.error) msg(r.error.message); else render();
      }));
      bar.appendChild(el("button", "Sign up", async function () {
        var r = await sb.auth.signUp({ email: em.value, password: pw.value });
        if (r.error) msg(r.error.message);
        else if (!r.data.session) msg("Check your email to confirm, then log in.");
        else render();
      }));
      return;
    }
    var out = el("button", "Log out", async function () { await sb.auth.signOut(); render(); });
    if (await isPaid()) {
      bar.appendChild(el("span", "Premium unlocked"));
      bar.appendChild(out);
      showPremium();
    } else {
      bar.appendChild(el("button", "Check status", render));
      bar.appendChild(out);
      showPayment();
    }
  }

  render();
})();
