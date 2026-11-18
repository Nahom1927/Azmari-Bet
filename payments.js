(function () {
  var sb = supabase.createClient("https://rnqizccrzbolsynfsxbu.supabase.co", "sb_publishable_1pbzO1FOGTjIjjE-yF7d1A__OFPESB2", { auth: { persistSession: false, autoRefreshToken: false } });
  var CODES = {1599:"band_profile",15000:"course_3mo",5998:"event_platinum",2998:"event_gold",1598:"event_silver",798:"event_bronze",398:"event_basic"};
  window.azCode = function (amount, isStore) {
    if (amount === 100) return isStore ? "post" : "seeker_profile";
    return CODES[amount] || null;
  };
  window.azOrder = async function (code, label, ref, acct, method, ptime) {
    try {
      if (!acct || !acct.name || !acct.phone) return { ok: false, msg: "Add your name and phone in your account first" };
      var r = await sb.rpc("submit_order", {
        p_code: code, p_ref: ref, p_name: acct.name, p_phone: acct.phone,
        p_item: String(label).slice(0, 120), p_method: method || "", p_time: ptime || null
      });
      if (r.error) {
        var m = r.error.message || "";
        if (r.error.code === "23505") return { ok: false, msg: "That transaction ID was already submitted." };
        if (m.indexOf("too many") >= 0) return { ok: false, msg: "Too many orders from this phone. Try again later." };
        if (m.indexOf("bad phone") >= 0) return { ok: false, msg: "Your phone number looks invalid. Edit your profile." };
        if (m.indexOf("bad name") >= 0) return { ok: false, msg: "Your name looks invalid. Edit your profile." };
        if (m.indexOf("bad time") >= 0) return { ok: false, msg: "The receipt time looks invalid." };
        return { ok: false, msg: "Could not send. Try again." };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: "Network problem. Try again." };
    }
  };
})();
