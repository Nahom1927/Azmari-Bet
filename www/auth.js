// AZMARI-LOGIN: email login, registration, logout and password reset
(function () {
  function start() {
    var sb = window.azSupabase;
    if (!sb) { console.warn("auth.js: Supabase is not loaded"); return; }

    var LIVE = "https://nahom1927.github.io/Azmari-Bet/";
    var back = location.hostname === "localhost" && location.port === "8000" ? location.origin + "/" : LIVE;
    var firstHash = location.hash;
    var box = null;
    var recovering = false;

    function q(s) { return box.querySelector(s); }
    function close() { if (box) { box.remove(); box = null; } }
    function say(text) { var m = box && q("#azm"); if (m) m.textContent = text; }
    function note(text) { say(text); if (typeof window.toast === "function") window.toast(text); }

    function sheet(html) {
      close();
      box = document.createElement("div");
      box.className = "sheet";
      box.innerHTML = '<div role="dialog" aria-label="Email login">' + html +
        '<p class="mu" id="azm" role="status"></p><button type="button" class="btn ln" id="azx">Close</button></div>';
      document.body.appendChild(box);
      q("#azx").onclick = close;
    }

    function run(btn, task, ok) {
      btn.disabled = true;
      say("Please wait…");
      Promise.resolve().then(task).then(function (r) {
        if (r.error) say(r.error.message); else ok(r.data || {});
      }).catch(function () {
        say("Something went wrong. Check your internet and try again.");
      }).then(function () { btn.disabled = false; });
    }

    function showLogin() {
      sheet('<h3>Student login</h3>' +
        '<label for="aze">Email</label><input id="aze" type="email" autocomplete="email">' +
        '<label for="azp">Password</label><input id="azp" type="password" autocomplete="current-password">' +
        '<button type="button" class="btn" id="azin">Log in</button>' +
        '<button type="button" class="btn ln" id="azup">Register</button>' +
        '<button type="button" class="btn ln" id="azfp">Forgot password?</button>');
      function email() { return q("#aze").value.trim(); }
      function pass() { return q("#azp").value; }
      q("#azin").onclick = function () {
        var e = email(), p = pass();
        if (!e || !p) { say("Write your email and password"); return; }
        run(this, function () { return window.azAuthSignIn(e, p); }, function (d) {
          showSignedIn(d.user); note("Logged in");
        });
      };
      q("#azup").onclick = function () {
        var e = email(), p = pass();
        if (!e || p.length < 8) { say("Write your email and a password of at least 8 characters"); return; }
        run(this, function () { return window.azAuthSignUp(e, p); }, function (d) {
          if (d.session) { showSignedIn(d.user); note("Registration complete"); }
          else say("Check your email to confirm, then log in. Already registered? Use Log in or Forgot password.");
        });
      };
      q("#azfp").onclick = function () {
        var e = email();
        if (!e) { say("Write your email first"); return; }
        run(this, function () { return sb.auth.resetPasswordForEmail(e, { redirectTo: back }); }, function () {
          say("If that email is registered, a reset link was sent. Check spam too.");
        });
      };
    }

    function showSignedIn(user) {
      sheet('<h3>You are logged in</h3><p class="mu" id="azwho"></p>' +
        '<button type="button" class="btn" id="azcp">Change password</button>' +
        '<button type="button" class="btn ln" id="azout">Log out</button>');
      q("#azwho").textContent = (user && user.email) || "";
      q("#azcp").onclick = showNewPassword;
      q("#azout").onclick = function () {
        run(this, function () { return window.azAuthSignOut(); }, function () {
          showLogin(); note("Logged out");
        });
      };
    }

    function showNewPassword() {
      sheet('<h3>Set a new password</h3>' +
        '<label for="azn1">New password</label><input id="azn1" type="password" autocomplete="new-password">' +
        '<label for="azn2">Repeat new password</label><input id="azn2" type="password" autocomplete="new-password">' +
        '<button type="button" class="btn" id="azsave">Save password</button>');
      q("#azsave").onclick = function () {
        var a = q("#azn1").value, b = q("#azn2").value;
        if (a.length < 8) { say("Use at least 8 characters"); return; }
        if (a !== b) { say("The two passwords do not match"); return; }
        run(this, function () { return sb.auth.updateUser({ password: a }); }, function (d) {
          showSignedIn(d.user); note("Password changed");
        });
      };
    }

    function open() {
      sb.auth.getSession().then(function (r) {
        if (r.data && r.data.session) showSignedIn(r.data.session.user); else showLogin();
      }).catch(showLogin);
    }
    window.azOpenLogin = open;

    function recover() { if (!recovering) { recovering = true; showNewPassword(); } }
    sb.auth.onAuthStateChange(function (event) {
      if (event === "PASSWORD_RECOVERY") setTimeout(recover, 0);
    });
    if (firstHash.indexOf("type=recovery") > -1) {
      sb.auth.getSession().then(function (r) { if (r.data && r.data.session) recover(); });
    } else if (firstHash.indexOf("error_description=") > -1) {
      showLogin();
      say("That email link is invalid or expired. Use Forgot password to get a new one.");
    }

    // Adds the login button to the existing account window
    function addButton(node) {
      if (node.nodeType !== 1) return;
      var d = node.querySelector('[role="dialog"][aria-label*="ccount"]');
      if (!d || d.querySelector(".azlogin")) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn azlogin";
      b.textContent = "🔑 Email login & password";
      b.onclick = open;
      d.appendChild(b);
    }
    new MutationObserver(function (list) {
      list.forEach(function (x) { x.addedNodes.forEach(addButton); });
    }).observe(document.body, { childList: true });
  }

  if (window.azSupabase) start(); else window.addEventListener("load", start);
})();
