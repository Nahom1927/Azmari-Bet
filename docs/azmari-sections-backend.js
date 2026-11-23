(function () {
  "use strict";

  const STORAGE_EVENTS_KEY = "azmari_events_v2";
  const STORAGE_ACTIVITY_KEY = "azmari_section_activity_v2";
  const STORAGE_ACTIVE_TAB_KEY = "azmari_active_section_v2";

  const DEFAULT_EVENTS = [
    {
      id: "evt-1",
      title: "Addis Acoustic & Azmari Showcase",
      venue: "Bole Medhanialem, Addis Ababa",
      date_label: "Sat • 6:00 PM EAT",
      price_etb: 250,
      host: "Azmari Music Academy"
    },
    {
      id: "evt-2",
      title: "Krar, Masinko & Begena Open Session",
      venue: "Kazanchis Cultural Hall, Addis Ababa",
      date_label: "Sun • 3:30 PM EAT",
      price_etb: 150,
      host: "Dawit & Ensemble"
    }
  ];

  function getSupabase() {
    return window.supabaseClient || window.sb || window.supabase || null;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeSectionName(raw) {
    const val = String(raw || "").toLowerCase().trim();
    if (val.includes("academy")) return "academy";
    if (val.includes("store") || val.includes("shop")) return "store";
    if (val.includes("event")) return "events";
    if (val.includes("more")) return "more";
    return "home";
  }

  function logBackendActivity(sectionName, actionText) {
    const logs = readJson(STORAGE_ACTIVITY_KEY, []);
    const entry = {
      id: "act-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      section: sectionName,
      action: actionText,
      at: new Date().toISOString()
    };
    const next = [entry].concat(logs).slice(0, 20);
    writeJson(STORAGE_ACTIVITY_KEY, next);

    const sb = getSupabase();
    if (sb && typeof sb.from === "function") {
      try {
        sb.from("shop_messages")
          .insert({
            thread_key: "system-" + sectionName,
            sender_name: "Azmari Backend",
            sender_side: "seller",
            body: `[${sectionName.toUpperCase()}] ${actionText}`
          })
          .then(function () {}, function () {});
      } catch (_) {}
    }
  }

  function injectSectionStyles() {
    if (document.getElementById("az-all-sections-styles")) return;
    const style = document.createElement("style");
    style.id = "az-all-sections-styles";
    style.textContent = `
      .az-sec-panel { max-width: 780px; margin: 12px auto 84px; padding: 16px; border-radius: 18px; background: #fbf9f2; color: #111827; border: 1px solid #d97706; box-shadow: 0 6px 20px rgba(30,58,138,0.08); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .az-sec-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
      .az-sec-title { margin: 0; font-size: 1.45rem; font-weight: 800; color: #1e3a8a; }
      .az-sec-pill { font-size: 0.76rem; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
      .az-sec-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 10px; }
      .az-sec-card { background: #ffffff; border: 1px solid #dbe4f0; border-radius: 14px; padding: 12px; }
      .az-sec-card h4 { margin: 0 0 6px; color: #1e3a8a; font-size: 1rem; }
      .az-sec-card p { margin: 0 0 8px; color: #475569; font-size: 0.86rem; }
      .az-sec-btn { background: #1e3a8a; color: #fef3c7; border: none; border-radius: 10px; padding: 8px 12px; font-weight: 700; font-size: 0.84rem; cursor: pointer; }
      .az-sec-btn.gold { background: #15803d; color: #ffffff; }
      .az-sec-bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .az-sec-bar button { padding: 6px 11px; border-radius: 999px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
      .az-sec-bar button.is-active { background: #1e3a8a; color: #fef3c7; border-color: #d97706; }
      .az-sec-input { background: #ffffff !important; color: #111827 !important; border: 1px solid #94a3b8 !important; border-radius: 10px; padding: 8px 10px; font: inherit; width: 100%; box-sizing: border-box; }
    `;
    style.textContent += '\n/* Azmari Bet High-Contrast Surface & Input Guard */\nsection[data-az-section]:not([hidden]),\n#azmari-shop-marketplace {\n  color-scheme: light !important;\n}\n.az-sec-panel,\n.az-sec-card,\n.az-st-shell,\n.az-st-card,\n.az-st-sheet,\n.az-st-search,\n.az-st-chat-stream {\n  background-color: #ffffff !important;\n  color: #111827 !important;\n  opacity: 1 !important;\n}\n.az-sec-panel {\n  background-color: #fbf9f2 !important;\n}\n.az-st-shell {\n  background-color: #eef3fb !important;\n}\n.az-st-chat-stream {\n  background-color: #f8fafc !important;\n}\n.az-sec-panel input,\n.az-sec-panel select,\n.az-sec-panel textarea,\n.az-st-shell input,\n.az-st-shell select,\n.az-st-shell textarea,\n.az-st-sheet input,\n.az-st-sheet select,\n.az-st-sheet textarea,\ninput#az-store-search,\ninput#az-chat-name,\ninput#az-chat-text,\ninput#az-chat-thread-key,\nselect#az-chat-side {\n  background-color: #ffffff !important;\n  color: #111827 !important;\n  -webkit-text-fill-color: #111827 !important;\n  border: 1px solid #64748b !important;\n  opacity: 1 !important;\n}\n.az-sec-panel input::placeholder,\n.az-sec-panel textarea::placeholder,\n.az-st-shell input::placeholder,\n.az-st-sheet input::placeholder,\n.az-st-sheet textarea::placeholder {\n  color: #64748b !important;\n  -webkit-text-fill-color: #64748b !important;\n  opacity: 1 !important;\n}\n';
    document.head.appendChild(style);
  }

  function ensureSectionContainers() {
    const host = document.querySelector("main") || document.body;
    const names = ["home", "academy", "store", "events", "more"];
    const map = {};

    names.forEach((name) => {
      const id = "az-section-" + name;
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("section");
        el.id = id;
        el.setAttribute("data-az-section", name);
        host.appendChild(el);
      }
      map[name] = el;
    });

    return map;
  }

  function renderNonStoreSections(sections, activeTab, supabaseConnected) {
    const events = readJson(STORAGE_EVENTS_KEY, DEFAULT_EVENTS);
    const logs = readJson(STORAGE_ACTIVITY_KEY, []);
    const backendBadge = supabaseConnected ? "Supabase Backend Connected" : "Local + Supabase Ready";

    const quickNavHtml = `
      <div class="az-sec-bar">
        <button type="button" data-az-go="home" class="${activeTab === "home" ? "is-active" : ""}">🏠 Home</button>
        <button type="button" data-az-go="academy" class="${activeTab === "academy" ? "is-active" : ""}">🎓 Academy</button>
        <button type="button" data-az-go="store" class="${activeTab === "store" ? "is-active" : ""}">🛒 Store</button>
        <button type="button" data-az-go="events" class="${activeTab === "events" ? "is-active" : ""}">🎟️ Events</button>
        <button type="button" data-az-go="more" class="${activeTab === "more" ? "is-active" : ""}">☰ More</button>
      </div>
    `;

    sections.home.innerHTML = `
      <div class="az-sec-panel">
        ${quickNavHtml}
        <div class="az-sec-head">
          <h2 class="az-sec-title">Azmari Bet Home</h2>
          <span class="az-sec-pill">${esc(backendBadge)}</span>
        </div>
        <p style="margin:0 0 10px;color:#334155;">Welcome to Azmari Bet (አዝማሪ ቤት). Jump directly to music lessons, the instrument marketplace, live events, or backend tools.</p>
        <div class="az-sec-cards">
          <div class="az-sec-card">
            <h4>🎓 Academy</h4>
            <p>Practice traditional and modern music lessons, quizzes, and progress tracking.</p>
            <button type="button" class="az-sec-btn" data-az-go="academy">Open Academy</button>
          </div>
          <div class="az-sec-card">
            <h4>🛒 Store</h4>
            <p>Browse and post instruments with buyer–seller chat and live GPS sharing.</p>
            <button type="button" class="az-sec-btn gold" data-az-go="store">Open Store</button>
          </div>
          <div class="az-sec-card">
            <h4>🎟️ Events</h4>
            <p>Check upcoming Addis Ababa music sessions and reserve spots.</p>
            <button type="button" class="az-sec-btn" data-az-go="events">Open Events</button>
          </div>
        </div>
      </div>
    `;

    sections.academy.innerHTML = `
      <div class="az-sec-panel">
        ${quickNavHtml}
        <div class="az-sec-head">
          <h2 class="az-sec-title">Azmari Music Academy • አዝማሪ ሙዚቃ አካዳሚ</h2>
          <span class="az-sec-pill">${esc(backendBadge)}</span>
        </div>
        <div class="az-sec-cards">
          <div class="az-sec-card">
            <h4>Krar & Begena Foundations</h4>
            <p>Tuning (Tezeta, Bati, Ambassel, Anchihoye), rhythm patterns, and guided exercises.</p>
            <button type="button" class="az-sec-btn" data-az-track="Started Krar & Begena Foundations">Log Practice Session</button>
          </div>
          <div class="az-sec-card">
            <h4>Keyboard, Guitar & Ear Training</h4>
            <p>Chord progressions, scale drills, and studio practice logs synced to your workspace.</p>
            <button type="button" class="az-sec-btn gold" data-az-go="store">Shop Instruments</button>
          </div>
        </div>
      </div>
    `;

    const eventsCards = events
      .map(
        (ev) => `
          <div class="az-sec-card">
            <h4>${esc(ev.title)}</h4>
            <p>📍 ${esc(ev.venue)}<br/>🕒 ${esc(ev.date_label)} • <strong>ETB ${Number(ev.price_etb || 0).toLocaleString("en-US")}</strong></p>
            <button type="button" class="az-sec-btn gold" data-az-rsvp="${esc(ev.title)}">RSVP / Save Spot</button>
          </div>
        `
      )
      .join("");

    sections.events.innerHTML = `
      <div class="az-sec-panel">
        ${quickNavHtml}
        <div class="az-sec-head">
          <h2 class="az-sec-title">Live Sessions & Events</h2>
          <span class="az-sec-pill">${esc(backendBadge)}</span>
        </div>
        <div class="az-sec-cards">${eventsCards}</div>
        <form id="az-add-event-form" class="az-sec-card" style="margin-top:12px;">
          <h4>Host or Add an Event</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
            <input class="az-sec-input" name="title" required placeholder="Event title" />
            <input class="az-sec-input" name="venue" required placeholder="Venue (e.g. Bole, Addis Ababa)" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;">
            <input class="az-sec-input" name="date_label" required placeholder="Date / Time" />
            <input class="az-sec-input" name="price_etb" type="number" min="0" value="0" placeholder="Price ETB" />
            <button type="submit" class="az-sec-btn">Add Event</button>
          </div>
        </form>
      </div>
    `;

    const logItems = logs.length
      ? logs
          .slice(0, 8)
          .map((item) => `<li style="margin-bottom:4px;"><strong>[${esc(item.section)}]</strong> ${esc(item.action)}</li>`)
          .join("")
      : `<li>No recent section backend events recorded yet.</li>`;

    sections.more.innerHTML = `
      <div class="az-sec-panel">
        ${quickNavHtml}
        <div class="az-sec-head">
          <h2 class="az-sec-title">More • Backend & Sync</h2>
          <span class="az-sec-pill">${esc(backendBadge)}</span>
        </div>
        <div class="az-sec-cards">
          <div class="az-sec-card">
            <h4>Supabase Database & Realtime</h4>
            <p>Tables: <code>shop_listings</code> &amp; <code>shop_messages</code> with live GPS pins and buyer–seller threads.</p>
            <button type="button" class="az-sec-btn" id="az-sync-store-now">Refresh Store &amp; Backend</button>
          </div>
          <div class="az-sec-card">
            <h4>Recent Section Activity</h4>
            <ul style="margin:0;padding-left:18px;font-size:0.82rem;color:#334155;">${logItems}</ul>
          </div>
        </div>
      </div>
    `;
  }

  function applyActiveSection(activeTab) {
    const normalized = normalizeSectionName(activeTab);
    try {
      localStorage.setItem(STORAGE_ACTIVE_TAB_KEY, normalized);
    } catch (_) {}

    injectSectionStyles();
    const sections = ensureSectionContainers();
    const sb = getSupabase();
    renderNonStoreSections(sections, normalized, Boolean(sb && typeof sb.from === "function"));

    // Keep legacy section elements visible when not on store, or let our unified section render cleanly
    Object.keys(sections).forEach((key) => {
      const el = sections[key];
      if (key === "store") {
        el.style.display = normalized === "store" ? "block" : "none";
      } else {
        el.style.display = normalized === key ? "block" : "none";
      }
      el.hidden = normalized !== key;
    });

    const storeMount = document.getElementById("azmari-shop-marketplace");
    if (storeMount) {
      storeMount.style.display = normalized === "store" ? "block" : "none";
      if (normalized === "store" && window.AzmariShopChatLocation && typeof window.AzmariShopChatLocation.render === "function") {
        window.AzmariShopChatLocation.render({ skipRealtimeSync: true });
      }
    }

    // Highlight matching nav buttons in existing bottom/top bars
    document.querySelectorAll("button, a, [role='tab']").forEach((node) => {
      const txt = (node.textContent || "").trim().toLowerCase();
      const dataTab = (node.getAttribute("data-tab") || node.getAttribute("data-section") || "").toLowerCase();
      if (!txt && !dataTab) return;
      const matches =
        dataTab === normalized ||
        (normalized === "home" && txt === "home") ||
        (normalized === "academy" && txt === "academy") ||
        (normalized === "store" && (txt === "store" || txt === "shop")) ||
        (normalized === "events" && txt === "events") ||
        (normalized === "more" && txt === "more");
      if (matches && node.closest && !node.closest(".az-sec-panel")) {
        node.setAttribute("aria-selected", "true");
      }
    });

    bindSectionEvents(normalized);
  }

  function bindSectionEvents(currentTab) {
    document.querySelectorAll("[data-az-go]").forEach((btn) => {
      btn.onclick = function () {
        const target = normalizeSectionName(btn.getAttribute("data-az-go"));
        logBackendActivity(target, "Navigated to " + target);
        applyActiveSection(target);
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    });

    document.querySelectorAll("[data-az-track]").forEach((btn) => {
      btn.onclick = function () {
        const msg = btn.getAttribute("data-az-track") || "Academy activity";
        logBackendActivity("academy", msg);
        applyActiveSection("academy");
        alert(msg + " recorded.");
      };
    });

    document.querySelectorAll("[data-az-rsvp]").forEach((btn) => {
      btn.onclick = function () {
        const evTitle = btn.getAttribute("data-az-rsvp") || "Event";
        logBackendActivity("events", "RSVP saved for: " + evTitle);
        applyActiveSection("events");
        alert("RSVP saved for " + evTitle);
      };
    });

    const addEventForm = document.getElementById("az-add-event-form");
    if (addEventForm) {
      addEventForm.onsubmit = function (e) {
        e.preventDefault();
        const fd = new FormData(addEventForm);
        const title = String(fd.get("title") || "").trim();
        const venue = String(fd.get("venue") || "").trim();
        const dateLabel = String(fd.get("date_label") || "").trim();
        const priceEtb = Number(fd.get("price_etb") || 0);
        if (!title || !venue) return;
        const nextEvents = [
          {
            id: "evt-" + Date.now(),
            title: title,
            venue: venue,
            date_label: dateLabel || "Upcoming • Addis Ababa",
            price_etb: priceEtb,
            host: "Azmari Community"
          }
        ].concat(readJson(STORAGE_EVENTS_KEY, DEFAULT_EVENTS));
        writeJson(STORAGE_EVENTS_KEY, nextEvents);
        logBackendActivity("events", "Added event: " + title);
        applyActiveSection("events");
      };
    }

    const syncStoreBtn = document.getElementById("az-sync-store-now");
    if (syncStoreBtn) {
      syncStoreBtn.onclick = function () {
        logBackendActivity("more", "Synced Store & Backend state");
        if (window.AzmariShopChatLocation && typeof window.AzmariShopChatLocation.render === "function") {
          window.AzmariShopChatLocation.render();
        }
        applyActiveSection(currentTab || "more");
      };
    }
  }

  function installNavListeners() {
    document.addEventListener("click", function (e) {
      const target = e.target && e.target.closest ? e.target.closest("button, a, [role='tab']") : null;
      if (!target) return;
      if (target.closest(".az-sec-panel") || target.closest("#azmari-shop-marketplace")) return;

      const attr = (target.getAttribute("data-tab") || target.getAttribute("data-section") || "").toLowerCase();
      const label = (target.textContent || "").trim().toLowerCase();
      const candidate = attr || label;

      if (
        candidate === "home" ||
        candidate === "academy" ||
        candidate === "store" ||
        candidate === "shop" ||
        candidate === "events" ||
        candidate === "more"
      ) {
        const nextTab = normalizeSectionName(candidate);
        logBackendActivity(nextTab, "Switched tab to " + nextTab);
        setTimeout(function () {
          applyActiveSection(nextTab);
        }, 0);
      }
    });
  }

  window.AzmariSectionsBackend = {
    openSection: applyActiveSection,
    logActivity: logBackendActivity
  };

  function boot() {
    installNavListeners();
    let savedTab = "store";
    try {
      savedTab = normalizeSectionName(localStorage.getItem(STORAGE_ACTIVE_TAB_KEY) || "store");
    } catch (_) {}
    applyActiveSection(savedTab);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
