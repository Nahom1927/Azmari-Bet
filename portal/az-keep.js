/* keep the same tab after refresh; restore only once, when the tabs first appear */
(function () {
  var KEY = "az_last_tab";
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".tabs button") : null;
    if (b && b.textContent) { try { sessionStorage.setItem(KEY, b.textContent.trim()); } catch (x) {} }
  }, true);
  function restore() {
    var bar = document.querySelector(".tabs");
    if (!bar || bar.__azDone) return;
    var btns = bar.querySelectorAll("button");
    if (!btns.length) return;
    bar.__azDone = true;
    var saved = null;
    try { saved = sessionStorage.getItem(KEY); } catch (x) {}
    for (var i = 0; saved && i < btns.length; i++) {
      if (btns[i].textContent.trim() === saved) { if (btns[i].className !== "on") btns[i].click(); break; }
    }
  }
  new MutationObserver(restore).observe(document.documentElement, { childList: true, subtree: true });
  restore();
})();
