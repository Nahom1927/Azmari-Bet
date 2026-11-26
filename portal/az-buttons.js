(function () {
  function mk(id, label, side) {
    var b = document.createElement("button");
    b.type = "button"; b.id = id; b.textContent = label;
    var st = b.style;
    st.position = "fixed"; st[side] = "16px"; st.bottom = "16px"; st.zIndex = "2147483647";
    st.padding = "6px 10px"; st.border = "0"; st.borderRadius = "99px";
    st.background = "#04d9ff"; st.color = "#060B1A"; st.fontWeight = "700"; st.fontSize = "11px";
    st.fontFamily = "system-ui, sans-serif"; st.boxShadow = "0 0 14px #04d9ff"; st.cursor = "pointer";
    document.body.appendChild(b);
    return b;
  }
  var home = mk("azHomeBtn3", "\u2190 Home", "left");
  home.onclick = function (e) {
    e.stopPropagation();
    location.href = location.hostname.indexOf("github.io") > -1 ? "https://nahom1927.github.io/Azmari-Bet/" : location.origin + "/";
  };
  var out = mk("azLogoutBtn2", "Log out", "right");
  out.style.display = "none";
  function keys(st) {
    var k = [];
    try { for (var i = 0; i < st.length; i++) { var n = st.key(i); if (n && n.indexOf("sb-") === 0) k.push(n); } } catch (e) {}
    return k;
  }
  function has() { return keys(localStorage).some(function (n) { return /auth-token$/.test(n); }); }
  setInterval(function () { out.style.display = has() ? "block" : "none"; }, 800);
  out.onclick = async function () {
    try { if (window.sb && window.sb.auth) await window.sb.auth.signOut(); } catch (e) {}
    [localStorage, sessionStorage].forEach(function (st) { keys(st).forEach(function (n) { try { st.removeItem(n); } catch (e) {} }); });
    location.reload();
  };
})();
