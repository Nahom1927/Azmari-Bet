(function () {
  function pill(h) {
    var w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { if (n.nodeValue.indexOf("\uD83D\uDCC5") > -1) return n.parentNode; }
    return null;
  }
  function fit() {
    var h = document.querySelector(".hero"); if (!h) return;
    var eq = h.querySelector(".eq"), p = pill(h);
    if (!eq || !p) return;
    var r = p.getBoundingClientRect();
    if (r.width > 40) eq.style.width = Math.round(r.width) + "px";
  }
  new MutationObserver(function () { setTimeout(fit, 50); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", fit);
  window.addEventListener("load", function () { fit(); setTimeout(fit, 500); setTimeout(fit, 1500); });
})();

/* azalign2: date pill up + logo top = Welcome top */
(function () {
  var UP = 8; /* pixels the date pill moves up */
  function run() {
    var h = document.querySelector(".hero"); if (!h) return;
    var w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null), n, pill = null;
    while ((n = w.nextNode())) { if (n.nodeValue.indexOf("\uD83D\uDCC5") > -1) { pill = n.parentNode; break; } }
    if (pill) { pill.style.position = "relative"; pill.style.top = "-" + UP + "px"; }
    var row = h.querySelector(".wrow"), lg = h.querySelector(".lg");
    if (row && lg) { lg.style.setProperty("top", (row.offsetTop + Math.round(lg.offsetHeight * 0.15)) + "px", "important"); }
  }
  new MutationObserver(function () { setTimeout(run, 60); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", run);
  window.addEventListener("load", function () { run(); setTimeout(run, 500); setTimeout(run, 1500); });
})();
