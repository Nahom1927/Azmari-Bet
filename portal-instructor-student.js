(function () {
  "use strict";

  var SB_URL = "https://rnqizccrzbolsynfsxbu.supabase.co";
  var SB_KEY = "sb_publishable_1pbzO1FOGTjIjjE-yF7d1A__OFPESB2";
  var STORAGE_KEY = "azmari_portal_state_v220";

  function normPhone(v) {
    return String(v || "").trim();
  }

  function sbHeaders() {
    return {
      apikey: SB_KEY,
      Authorization: "Bearer " + SB_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    };
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveState(patch) {
    var next = Object.assign({}, loadState(), patch);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
  }

  async function redeemCodeRpc(studentNo, phone, section, code) {
    var cleanNo = String(studentNo || "").trim().toUpperCase();
    var cleanPhone = normPhone(phone);
    var cleanSection = String(section || "attendance").trim();
    var cleanCode = String(code || "").trim();

    if (!cleanNo || !cleanPhone || !cleanCode) {
      throw new Error("Enter Student No, Phone, Section, and Code.");
    }

    var res = await fetch(SB_URL + "/rest/v1/rpc/redeem_code", {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({
        p_student_no: cleanNo,
        p_phone: cleanPhone,
        p_section: cleanSection,
        p_code: cleanCode
      })
    });

    var txt = await res.text();
    if (!res.ok) {
      throw new Error("RPC error (" + res.status + "): " + txt);
    }

    var parsed;
    try {
      parsed = JSON.parse(txt);
    } catch (e) {
      parsed = txt === "true";
    }

    if (parsed !== true) {
      throw new Error("Code not redeemed: verify active student_no + phone in students and active unexpired code/section in access_codes.");
    }
    return true;
  }

  async function savePortalEntry(kind, payload) {
    var res = await fetch(SB_URL + "/rest/v1/user_entries", {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({
        kind: kind,
        phone: normPhone(payload.phone),
        name: payload.name || payload.student_no || kind,
        data: payload
      })
    });
    if (!res.ok) {
      throw new Error("Supabase save failed (" + res.status + "): " + (await res.text()));
    }
    return res.json();
  }

  async function fetchPortalEntries(kind) {
    var res = await fetch(
      SB_URL + "/rest/v1/user_entries?kind=eq." + encodeURIComponent(kind) + "&order=id.desc&limit=25",
      { headers: sbHeaders() }
    );
    if (!res.ok) return [];
    return res.json();
  }

  function renderPortalUI() {
    if (document.getElementById("azmari-portal-panel")) return;
    var state = loadState();

    var wrap = document.createElement("section");
    wrap.id = "azmari-portal-panel";
    wrap.style.cssText = "max-width:720px;margin:20px auto;padding:16px;border:1px solid #cbd5e1;border-radius:10px;background:#ffffff;color:#0f172a;font-family:system-ui,-apple-system,sans-serif;";

    wrap.innerHTML = [
      "<h2 style='margin:0 0 10px;font-size:18px;'>Azmari Instructor & Student Portal</h2>",
      "<div style='display:flex;gap:8px;margin-bottom:14px;'>",
      "  <button type='button' id='tab-student-mode' style='padding:8px 12px;cursor:pointer;'>Student Portal</button>",
      "  <button type='button' id='tab-instructor-mode' style='padding:8px 12px;cursor:pointer;'>Instructor Portal</button>",
      "</div>",
      "<div id='pane-student-mode'>",
      "  <div style='display:grid;gap:8px;margin-bottom:10px;'>",
      "    <input id='stu-name' type='text' placeholder='Student Full Name' value='" + (state.studentName || "") + "' style='padding:8px;' />",
      "    <input id='stu-no' type='text' placeholder='Student No (exact match in students)' value='" + (state.studentNo || "") + "' style='padding:8px;' />",
      "    <input id='stu-phone' type='tel' placeholder='Phone (exact match in students)' value='" + (state.studentPhone || "") + "' style='padding:8px;' />",
      "    <input id='stu-section' type='text' placeholder='Section (e.g. attendance or portal)' value='" + (state.studentSection || "attendance") + "' style='padding:8px;' />",
      "    <input id='stu-code' type='text' placeholder='Admin Access Code' value='" + (state.redeemCode || "") + "' style='padding:8px;' />",
      "  </div>",
      "  <div style='display:flex;gap:8px;flex-wrap:wrap;'>",
      "    <button type='button' id='btn-redeem-code' style='padding:8px 14px;cursor:pointer;'>Redeem Code & Lock Student</button>",
      "    <button type='button' id='btn-refresh-lessons' style='padding:8px 14px;cursor:pointer;'>Load Instructor Lessons</button>",
      "  </div>",
      "  <div id='student-status-msg' style='margin-top:10px;font-size:14px;'></div>",
      "  <div id='student-embedded-card' style='margin-top:12px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;'></div>",
      "  <div id='student-lessons-box' style='margin-top:12px;'></div>",
      "</div>",
      "<div id='pane-instructor-mode' style='display:none;'>",
      "  <div style='display:grid;gap:8px;margin-bottom:10px;'>",
      "    <input id='ins-name' type='text' placeholder='Instructor Name' value='" + (state.instructorName || "") + "' style='padding:8px;' />",
      "    <input id='ins-target-id' type='text' placeholder='Target Student No or Phone' value='" + (state.targetStudent || "") + "' style='padding:8px;' />",
      "    <input id='ins-lesson-title' type='text' placeholder='Lesson / Krar / Azmari Topic' style='padding:8px;' />",
      "    <textarea id='ins-lesson-notes' rows='3' placeholder='Instructor feedback or assignment notes...' style='padding:8px;'></textarea>",
      "  </div>",
      "  <button type='button' id='btn-post-lesson' style='padding:8px 14px;cursor:pointer;'>Publish Lesson to Student</button>",
      "  <div id='instructor-status-msg' style='margin-top:10px;font-size:14px;'></div>",
      "  <div id='instructor-feed-box' style='margin-top:12px;'></div>",
      "</div>"
    ].join("");

    document.body.appendChild(wrap);

    var stuPane = wrap.querySelector("#pane-student-mode");
    var insPane = wrap.querySelector("#pane-instructor-mode");
    var stuMsg = wrap.querySelector("#student-status-msg");
    var insMsg = wrap.querySelector("#instructor-status-msg");
    var stuCard = wrap.querySelector("#student-embedded-card");
    var lessonsBox = wrap.querySelector("#student-lessons-box");
    var feedBox = wrap.querySelector("#instructor-feed-box");

    function paintStudentCard(rec) {
      if (!rec || (!rec.name && !rec.student_no && !rec.phone)) {
        stuCard.innerHTML = "<p style='margin:0;color:#64748b;'>No locked student record yet.</p>";
        return;
      }
      stuCard.innerHTML =
        "<p style='margin:3px 0;'><strong>Embedded Student:</strong> " + (rec.name || "-") + "</p>" +
        "<p style='margin:3px 0;'><strong>Student No:</strong> " + (rec.student_no || "-") + "</p>" +
        "<p style='margin:3px 0;'><strong>Phone:</strong> " + (rec.phone || "-") + "</p>" +
        "<p style='margin:3px 0;'><strong>Section & Code:</strong> " + (rec.section || "-") + " / " + (rec.code || "-") + "</p>" +
        "<p style='margin:3px 0;'><strong>Lock Status:</strong> Saved Forever (Read-Only)</p>";
    }

    async function refreshLessons() {
      var rows = await fetchPortalEntries("instructor_lesson");
      var targetNo = (wrap.querySelector("#stu-no").value || "").trim().toLowerCase();
      var targetPhone = normPhone(wrap.querySelector("#stu-phone").value);
      var filtered = rows.filter(function (r) {
        var d = r.data || {};
        var matchNo = targetNo && String(d.target_student || "").toLowerCase().includes(targetNo);
        var matchPhone = targetPhone && normPhone(d.target_student) === targetPhone;
        return (!targetNo && !targetPhone) || matchNo || matchPhone;
      });
      if (!filtered.length) {
        lessonsBox.innerHTML = "<p style='color:#64748b;font-size:13px;'>No lessons posted yet.</p>";
        return;
      }
      lessonsBox.innerHTML = "<h3 style='margin:0 0 6px;font-size:15px;'>Instructor Lessons</h3>" +
        filtered.map(function (r) {
          var d = r.data || {};
          return "<div style='padding:8px;margin-bottom:6px;border:1px solid #e2e8f0;border-radius:6px;'>" +
            "<div><strong>" + (d.title || "Lesson") + "</strong> — <span style='font-size:12px;color:#475569;'>By " + (d.instructor || "Instructor") + "</span></div>" +
            "<p style='margin:4px 0 0;font-size:13px;'>" + (d.notes || "") + "</p>" +
            "</div>";
        }).join("");
    }

    async function refreshInstructorFeed() {
      var rows = await fetchPortalEntries("instructor_lesson");
      if (!rows.length) {
        feedBox.innerHTML = "<p style='color:#64748b;font-size:13px;'>No published lessons yet.</p>";
        return;
      }
      feedBox.innerHTML = "<h3 style='margin:0 0 6px;font-size:15px;'>Published Lessons</h3>" +
        rows.map(function (r) {
          var d = r.data || {};
          return "<div style='padding:8px;margin-bottom:6px;border:1px solid #e2e8f0;border-radius:6px;'>" +
            "<div><strong>" + (d.title || "Lesson") + "</strong> → Student: " + (d.target_student || "All") + "</div>" +
            "<p style='margin:4px 0 0;font-size:13px;'>" + (d.notes || "") + "</p>" +
            "</div>";
        }).join("");
    }

    wrap.querySelector("#tab-student-mode").addEventListener("click", function () {
      stuPane.style.display = "block";
      insPane.style.display = "none";
      refreshLessons();
    });

    wrap.querySelector("#tab-instructor-mode").addEventListener("click", function () {
      stuPane.style.display = "none";
      insPane.style.display = "block";
      refreshInstructorFeed();
    });

    wrap.querySelector("#btn-redeem-code").addEventListener("click", async function () {
      var rec = {
        name: wrap.querySelector("#stu-name").value.trim(),
        student_no: wrap.querySelector("#stu-no").value.trim().toUpperCase(),
        phone: normPhone(wrap.querySelector("#stu-phone").value),
        section: wrap.querySelector("#stu-section").value.trim() || "attendance",
        code: wrap.querySelector("#stu-code").value.trim(),
        locked: true,
        redeemed_at: new Date().toISOString()
      };
      stuMsg.textContent = "Verifying student & redeeming code...";
      try {
        await redeemCodeRpc(rec.student_no, rec.phone, rec.section, rec.code);
        await savePortalEntry("student", rec);
        var saved = saveState({
          lockedStudent: rec,
          studentName: rec.name,
          studentNo: rec.student_no,
          studentPhone: rec.phone,
          studentSection: rec.section,
          redeemCode: rec.code
        });
        paintStudentCard(saved.lockedStudent);
        stuMsg.textContent = "Code redeemed and student saved forever as embedded text.";
      } catch (err) {
        stuMsg.textContent = err.message;
      }
    });

    wrap.querySelector("#btn-refresh-lessons").addEventListener("click", refreshLessons);

    wrap.querySelector("#btn-post-lesson").addEventListener("click", async function () {
      var lesson = {
        instructor: wrap.querySelector("#ins-name").value.trim() || "Azmari Instructor",
        target_student: wrap.querySelector("#ins-target-id").value.trim(),
        title: wrap.querySelector("#ins-lesson-title").value.trim(),
        notes: wrap.querySelector("#ins-lesson-notes").value.trim(),
        created_at: new Date().toISOString()
      };
      if (!lesson.title) {
        insMsg.textContent = "Enter a lesson title first.";
        return;
      }
      insMsg.textContent = "Publishing lesson...";
      try {
        await savePortalEntry("instructor_lesson", lesson);
        saveState({
          instructorName: lesson.instructor,
          targetStudent: lesson.target_student
        });
        wrap.querySelector("#ins-lesson-title").value = "";
        wrap.querySelector("#ins-lesson-notes").value = "";
        insMsg.textContent = "Lesson published to student portal.";
        refreshInstructorFeed();
      } catch (err) {
        insMsg.textContent = err.message;
      }
    });

    paintStudentCard(state.lockedStudent);
    refreshLessons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPortalUI);
  } elseelse {
    renderPortalUI();
  }
})();
