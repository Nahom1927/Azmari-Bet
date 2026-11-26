// AZMARI-ALERTS: photo upload alerts and location step before registration
(function () {
  function tell(text) { if (typeof window.toast === "function") window.toast(text); }

  function addNote(input) {
    var d = input.closest('[role="dialog"]');
    if (!d || input.dataset.az) return;
    var label = d.getAttribute("aria-label") || "";
    if (!/ccount|profile|regist|sign/i.test(label) && !d.querySelector('[inputmode="tel"]')) return;
    input.dataset.az = "1";
    var n = document.createElement("p");
    n.className = "mu";
    n.setAttribute("role", "alert");
    n.textContent = "📷 Tap the photo area to add a clear profile picture.";
    var saved = null;
    try { saved = localStorage.getItem("acct"); } catch (e) {}
    if (!saved) n.textContent += " 📍 Turn on location before you create your account.";
    input.parentNode.insertBefore(n, input);
    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      if (!f) return;
      n.textContent = f.type.indexOf("image/") === 0 ?
        "✅ Photo selected. Check it, then finish and save." :
        "⚠️ That file is not a photo. Choose a JPG or PNG.";
      tell(n.textContent);
    }, true);
  }

  new MutationObserver(function () {
    document.querySelectorAll('[role="dialog"] input[type="file"][accept^="image"]').forEach(addNote);
  }).observe(document.body, { childList: true, subtree: true });

  var allowed = false;
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("#azup");
    if (!btn || allowed) return;
    var email = document.querySelector("#aze").value.trim();
    var pass = document.querySelector("#azp").value;
    if (!email || pass.length < 8) return;
    e.stopPropagation();
    var m = document.querySelector("#azm");
    function show(text) { m.textContent = text; tell(text); }
    if (!navigator.geolocation) { show("This device cannot share location."); return; }
    btn.disabled = true;
    show("📍 Turn on location, then tap Allow…");
    navigator.geolocation.getCurrentPosition(function () {
      btn.disabled = false;
      if (!btn.isConnected) return;
      allowed = true;
      btn.click();
      allowed = false;
    }, function (err) {
      btn.disabled = false;
      show(err.code === 1 ?
        "Location is blocked. Allow it in your phone or browser settings, then tap Register again." :
        "Could not find your location. Turn it on, then tap Register again.");
    }, { timeout: 20000, maximumAge: 60000 });
  }, true);
})();
