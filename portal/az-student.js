/* Azmari: instructor card on the student's first screen + Student ID after approval */
(function () {
  var sb = window.azSb;
  if (!sb) { console.warn("az-student: window.azSb is missing"); return; }
  var raw = sb.rpc.bind(sb), seen = {};

  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }

  /* admin side: publish the ID when an application is approved (and when the Approved list is opened) */
  async function publish(row, no) {
    if (!row || !no || !row.payment_ref) return;
    var r = await raw("az_publish_student_id", { p_phone: row.phone, p_ref: row.payment_ref, p_student_no: String(no) });
    if (r.error) console.warn("az-student: " + r.error.message);
  }
  sb.rpc = function (name, args, opts) {
    if (name !== "admin_list_registrations" && name !== "admin_approve_registration") return raw(name, args, opts);
    return (async function () {
      var r = await raw(name, args, opts);
      try {
        if (!r.error && name === "admin_list_registrations") {
          for (var i = 0; i < (r.data || []).length; i++) {
            var x = r.data[i]; seen[x.id] = x;
            if (x.status === "approved") await publish(x, x.student_no);
          }
        } else if (!r.error && args) await publish(seen[args.p_id], r.data);
      } catch (e) { console.warn(e); }
      return r;
    })();
  };

  /* student side: instructors with photo on the first screen */
  async function instructors(after) {
    var box = el("div", null, "card"); box.appendChild(el("h3", "Your instructor"));
    var status = el("p", "Loading…", "mu"); box.appendChild(status);
    after.parentNode.insertBefore(box, after.nextSibling);
    var r = await raw("my_instructors");
    if (r.error) { status.textContent = r.error.message; return; }
    var list = r.data || [];
    if (!list.length) { status.textContent = "No instructor assigned yet."; return; }
    status.remove();
    list.forEach(function (x) {
      var row = el("div"); row.style.cssText = "display:flex;gap:14px;align-items:center;margin:8px 0";
      var name = ((x.prefix || "") + " " + (x.name || "")).trim() || "Instructor";
      function initial() { var d = el("div", (x.name || "?").charAt(0).toUpperCase()); d.style.cssText = "display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;background:#233;color:#fff"; return size(d); }
      function size(p) { p.style.width = p.style.height = "72px"; p.style.borderRadius = "50%"; p.style.objectFit = "cover"; p.style.flex = "none"; p.style.border = "2px solid #04d9ff"; return p; }
      var pic;
      if (x.photo_url && /^https:\/\//i.test(x.photo_url)) { pic = size(el("img")); pic.alt = name; pic.onerror = function () { this.replaceWith(initial()); }; pic.src = x.photo_url; }
      else pic = initial();
      var t = el("div"); t.appendChild(el("h3", name)); t.appendChild(el("p", x.course || "", "mu"));
      row.appendChild(pic); row.appendChild(t); box.appendChild(row);
    });
  }

  /* applicant side: find my Student ID */
  function finder(idInput) {
    var pane = idInput.closest(".card") || idInput.parentNode.parentNode;
    if (pane.querySelector(".azfind")) return;
    var d = el("details", null, "azfind"); d.style.marginTop = "14px";
    d.appendChild(el("summary", "Approved? Show my Student ID"));
    d.appendChild(el("p", "Enter the phone number and the payment reference (transaction ID) you used when you registered.", "mu"));
    function field(label, type) { var l = el("label", label), i = el("input"); i.type = type; i.style.width = "100%"; i.style.boxSizing = "border-box"; i.setAttribute("aria-label", label); d.appendChild(l); d.appendChild(i); return i; }
    var ph = field("Registered phone", "tel"), ref = field("Payment reference", "text");
    var go = el("button", "Show my Student ID"), out = el("p"); go.type = "button"; out.setAttribute("role", "status");
    go.onclick = async function () {
      if (!ph.value.trim() || ref.value.trim().length < 6) { out.textContent = "Write your phone number and the full payment reference."; return; }
      go.disabled = true; out.textContent = "Checking…";
      var r = await raw("az_find_student_id", { p_phone: ph.value, p_ref: ref.value });
      go.disabled = false;
      if (r.error) { out.textContent = "This is not available yet. Ask the school."; return; }
      if (r.data.wait) { out.textContent = "Too many tries. Try again in one hour or ask the school."; return; }
      if (!r.data.ids.length) { out.textContent = "No approved Student ID found for these details yet."; return; }
      out.textContent = "✅ Approved. Your Student ID: " + r.data.ids.join(", ");
      out.style.cssText = "font-size:18px;font-weight:700";
      if (idInput.isConnected) idInput.value = r.data.ids[0];
    };
    d.appendChild(go); d.appendChild(out); pane.appendChild(d);
  }

  function scan() {
    var ps = document.querySelectorAll("#app p.mu");
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i], card = p.parentNode, h = p.previousElementSibling;
      if (/^Student ID: /.test(p.textContent) && h && h.tagName === "H2" && !card.dataset.azins) { card.dataset.azins = "1"; instructors(card); }
    }
    var id = document.querySelector('#app input[placeholder="AZ-26-0001"]');
    if (id) finder(id);
  }
  new MutationObserver(scan).observe(document.getElementById("app"), { childList: true, subtree: true });
  scan();
})();
