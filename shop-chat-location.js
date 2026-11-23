(function () {
  "use strict";

  const STORE_API_BASE = window.AZMARI_STORE_API_BASE || "http://localhost:3000";
  const STORAGE_LISTINGS_KEY = "azmari_store_listings_v2";
  const STORAGE_MESSAGES_KEY = "azmari_store_messages_v2";
  const STORAGE_FAVS_KEY = "azmari_store_favs_v2";
  const STORAGE_USER_KEY = "azmari_store_user_v2";
  const STORAGE_APPROVED_SELLERS_KEY = "azmari_store_approved_sellers_v2";
  const STORAGE_ADMIN_MODE_KEY = "azmari_store_admin_mode_v2";

  const CATEGORIES = [
    { id: "All", label: "All", icon: "🛍️" },
    { id: "Keyboards", label: "Keyboards", icon: "🎹" },
    { id: "Strings", label: "Strings", icon: "🎸" },
    { id: "Traditional", label: "Traditional", icon: "🪕" },
    { id: "Percussion", label: "Percussion", icon: "🥁" },
    { id: "Audio", label: "Audio", icon: "🎙️" }
    { id: “Rental”, label: “Rental”, icon: "⛺" 
    { id: “Sound Rental”, label: “Sound Rental”, icon: "🎚️" 
  ];

  const DEFAULT_LISTINGS = [
    {
      id: 1,
      seller_name: "Dawit Alemu",
      seller_phone: "+251 911 234567",
      title: "Electric keyboard",
      category: "Keyboards",
      price_etb: 18500,
      negotiable: true,
      condition: "Like New",
      location_label: "Bole, Addis Ababa",
      lat: 8.9806,
      lng: 38.7578,
      live_location_active: true,
      approved: true,
      icon: "🎹",
      image_url: "",
      photos: [],
      description: "61-key touch-sensitive keyboard with stand and adapter.",
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 2,
      seller_name: "Hana Getachew",
      seller_phone: "+251 912 345678",
      title: "Digital piano",
      category: "Keyboards",
      price_etb: 42000,
      negotiable: false,
      condition: "New",
      location_label: "Kazanchis, Addis Ababa",
      lat: 9.0157,
      lng: 38.7654,
      live_location_active: true,
      approved: true,
      icon: "🎹",
      image_url: "",
      photos: [],
      description: "88-key weighted digital piano with sustain pedal.",
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    }
  ];

  let selectedCategory = "All";
  let searchQuery = "";
  let postModalOpen = false;
  let draftPhotos = [];
  let draftFile = null;
  let chatListingId = null;
  let activeThreadKey = "buyer-1";
  let activeSide = "buyer";
  let currentCoords = null;
  let liveWatchId = null;
  let statusBanner = "";
  let backendOnline = false;
  let storeSocket = null;
  let subscribedRoom = "";
  let realtimeStatus = "local";

  function resolveUrl(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
    if (url.startsWith("/")) return STORE_API_BASE + url;
    return url;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  function getUserName() {
    try {
      return localStorage.getItem(STORAGE_USER_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setUserName(name) {
    try {
      localStorage.setItem(STORAGE_USER_KEY, (name || "").trim());
    } catch (_) {}
  }

  function normalizeKey(name) {
    return String(name || "").trim().toLowerCase();
  }

  function isAdminMode() {
    return Boolean(readJson(STORAGE_ADMIN_MODE_KEY, false));
  }

  function setAdminMode(val) {
    writeJson(STORAGE_ADMIN_MODE_KEY, Boolean(val));
  }

  function getApprovedSellers() {
    const list = readJson(STORAGE_APPROVED_SELLERS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function isSellerApprovedLocal(sellerName) {
    const key = normalizeKey(sellerName);
    if (!key) return false;
    if (key === "dawit alemu" || key === "hana getachew") return true;
    return getApprovedSellers().some((s) => normalizeKey(s) === key);
  }

  function markSellerApprovedLocal(sellerName, approved) {
    const clean = String(sellerName || "").trim();
    const key = normalizeKey(clean);
    if (!key) return;
    const current = getApprovedSellers().filter((s) => normalizeKey(s) !== key);
    if (approved) {
      writeJson(STORAGE_APPROVED_SELLERS_KEY, current.concat(clean));
    } else {
      writeJson(STORAGE_APPROVED_SELLERS_KEY, current);
    }
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatEtb(n) {
    return "ETB " + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function timeAgo(iso) {
    if (!iso) return "Just now";
    const diffSec = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 60) return "Just now";
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return mins + (mins === 1 ? " min ago" : " mins ago");
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? " hour ago" : " hours ago");
    const days = Math.floor(hrs / 24);
    return days + (days === 1 ? " day ago" : " days ago");
  }

  function categoryIcon(cat) {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? found.icon : "🎵";
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    if (
      typeof lat1 !== "number" ||
      typeof lon1 !== "number" ||
      typeof lat2 !== "number" ||
      typeof lon2 !== "number"
    ) {
      return null;
    }
    const rad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function normalizeListingRow(row) {
    const isApproved = Boolean(row.approved);
    const img = resolveUrl(row.image_url || "");
    return Object.assign({}, row, {
      approved: isApproved,
      live_location_active: Boolean(row.live_location_active),
      negotiable: Boolean(row.negotiable),
      lat: row.lat !== null && row.lat !== undefined && row.lat !== "" ? Number(row.lat) : null,
      lng: row.lng !== null && row.lng !== undefined && row.lng !== "" ? Number(row.lng) : null,
      image_url: img,
      photos: img ? [img] : Array.isArray(row.photos) ? row.photos : [],
      icon: row.icon || categoryIcon(row.category)
    });
  }

  function upsertLocalListing(row) {
    if (!row || row.id === undefined || row.id === null) return;
    const normalized = normalizeListingRow(row);
    const current = readJson(STORAGE_LISTINGS_KEY, []);
    const idx = current.findIndex((x) => String(x.id) === String(normalized.id));
    const next =
      idx >= 0
        ? current.map((x, i) => (i === idx ? Object.assign({}, x, normalized) : x))
        : [normalized].concat(current);
    writeJson(STORAGE_LISTINGS_KEY, next);
  }

  function upsertLocalMessage(msg) {
    if (!msg || msg.id === undefined || msg.id === null) return false;
    const all = readJson(STORAGE_MESSAGES_KEY, []);
    const exists = all.some((m) => String(m.id) === String(msg.id));
    if (exists) {
      const next = all.map((m) => (String(m.id) === String(msg.id) ? Object.assign({}, m, msg) : m));
      writeJson(STORAGE_MESSAGES_KEY, next);
      return false;
    }
    writeJson(STORAGE_MESSAGES_KEY, all.concat(msg));
    return true;
  }

  async function loadListings() {
    const adminFlag = isAdminMode();
    try {
      const res = await fetch(`${STORE_API_BASE}/api/store/listings?admin=${adminFlag ? "true" : "false"}`);
      if (res.ok) {
        const rows = await res.json();
        backendOnline = true;
        if (Array.isArray(rows)) {
          const normalized = rows.map(normalizeListingRow);
          writeJson(STORAGE_LISTINGS_KEY, normalized);
          return normalized;
        }
      }
    } catch (_) {
      backendOnline = false;
    }

    let local = readJson(STORAGE_LISTINGS_KEY, null);
    if (!Array.isArray(local) || local.length === 0) {
      local = DEFAULT_LISTINGS.map(normalizeListingRow);
      writeJson(STORAGE_LISTINGS_KEY, local);
    }
    return local.map(normalizeListingRow);
  }

  async function checkSellerUnlimited(sellerName) {
    const clean = String(sellerName || "").trim();
    if (!clean) return false;
    try {
      const res = await fetch(`${STORE_API_BASE}/api/store/sellers/status?name=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        markSellerApprovedLocal(clean, Boolean(data.unlimited || data.approved));
        return Boolean(data.unlimited || data.approved);
      }
    } catch (_) {}
    return isSellerApprovedLocal(clean);
  }

  async function publishListing(input) {
    const sellerName = String(input.seller_name || "").trim();
    try {
      const fd = new FormData();
      fd.append("seller_name", sellerName);
      fd.append("seller_phone", String(input.seller_phone || "").trim());
      fd.append("title", String(input.title || "").trim());
      fd.append("category", String(input.category || "Traditional").trim());
      fd.append("condition", String(input.condition || "Like New").trim());
      fd.append("price_etb", String(Number(input.price_etb || 0)));
      fd.append("negotiable", input.negotiable ? "true" : "false");
      fd.append("location_label", String(input.location_label || "Addis Ababa").trim());
      if (typeof input.lat === "number") fd.append("lat", String(input.lat));
      if (typeof input.lng === "number") fd.append("lng", String(input.lng));
      fd.append("description", String(input.description || "").trim());
      if (input.file) {
        fd.append("image", input.file);
      } else if (Array.isArray(input.photos) && input.photos[0]) {
        fd.append("image_url", input.photos[0]);
      }

      const res = await fetch(`${STORE_API_BASE}/api/store/listings`, {
        method: "POST",
        body: fd
      });
      if (res.ok) {
        backendOnline = true;
        const payload = await res.json();
        const item = normalizeListingRow(payload.listing || payload);
        upsertLocalListing(item);
        return {
          item,
          approved: Boolean(payload.approved !== undefined ? payload.approved : item.approved),
          unlimitedUnlocked: Boolean(payload.unlimited_unlocked !== undefined ? payload.unlimited_unlocked : item.approved)
        };
      }
    } catch (_) {
      backendOnline = false;
    }

    const approvedLocal = isSellerApprovedLocal(sellerName);
    const photos = Array.isArray(input.photos) ? input.photos.slice(0, 6) : [];
    const fallbackItem = normalizeListingRow({
      id: "local-" + Date.now(),
      seller_name: sellerName,
      seller_phone: String(input.seller_phone || "").trim(),
      title: String(input.title || "").trim(),
      category: String(input.category || "Traditional").trim(),
      condition: String(input.condition || "Like New").trim(),
      price_etb: Number(input.price_etb || 0),
      negotiable: Boolean(input.negotiable),
      location_label: String(input.location_label || "Addis Ababa").trim(),
      lat: typeof input.lat === "number" ? input.lat : null,
      lng: typeof input.lng === "number" ? input.lng : null,
      live_location_active: typeof input.lat === "number",
      image_url: photos[0] || "",
      photos,
      description: String(input.description || "").trim(),
      approved: approvedLocal,
      created_at: new Date().toISOString()
    });
    upsertLocalListing(fallbackItem);
    return { item: fallbackItem, approved: approvedLocal, unlimitedUnlocked: approvedLocal };
  }

  async function setListingApproval(listingId, approved) {
    const val = Boolean(approved);
    try {
      const res = await fetch(`${STORE_API_BASE}/api/store/listings/${encodeURIComponent(listingId)}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: val })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.seller_name && val) markSellerApprovedLocal(data.seller_name, true);
      }
    } catch (_) {}

    const list = readJson(STORAGE_LISTINGS_KEY, []);
    const target = list.find((x) => String(x.id) === String(listingId));
    if (target && target.seller_name && val) markSellerApprovedLocal(target.seller_name, true);
    const next = list.map((x) =>
      String(x.id) === String(listingId) ? Object.assign({}, x, { approved: val }) : x
    );
    writeJson(STORAGE_LISTINGS_KEY, next);
  }

  async function updateListingLocation(listingId, coords, label, active) {
    const patch = {
      lat: coords.lat,
      lng: coords.lng,
      location_label: label || `Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      live_location_active: Boolean(active)
    };
    try {
      await fetch(`${STORE_API_BASE}/api/store/listings/${encodeURIComponent(listingId)}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    } catch (_) {}

    const next = readJson(STORAGE_LISTINGS_KEY, []).map((x) =>
      String(x.id) === String(listingId) ? Object.assign({}, x, patch) : x
    );
    writeJson(STORAGE_LISTINGS_KEY, next);
  }

  async function loadMessages(listingId, threadKey) {
    try {
      const res = await fetch(
        `${STORE_API_BASE}/api/store/messages/${encodeURIComponent(listingId)}?thread_key=${encodeURIComponent(threadKey)}`
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const rest = readJson(STORAGE_MESSAGES_KEY, []).filter(
            (m) => !(String(m.listing_id) === String(listingId) && String(m.thread_key) === String(threadKey))
          );
          writeJson(STORAGE_MESSAGES_KEY, rest.concat(rows));
          return rows;
        }
      }
    } catch (_) {}

    return readJson(STORAGE_MESSAGES_KEY, []).filter(
      (m) => String(m.listing_id) === String(listingId) && String(m.thread_key) === String(threadKey)
    );
  }

  async function postMessage(msg) {
    try {
      const res = await fetch(`${STORE_API_BASE}/api/store/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg)
      });
      if (res.ok) {
        const saved = await res.json();
        upsertLocalMessage(saved);
        return saved;
      }
    } catch (_) {}

    const localMsg = Object.assign({}, msg, {
      id: "msg-" + Date.now(),
      created_at: new Date().toISOString()
    });
    upsertLocalMessage(localMsg);
    return localMsg;
  }

  function cleanupRealtime() {
    if (storeSocket && subscribedRoom) {
      subscribedRoom = "";
    }
    realtimeStatus = backendOnline ? "connected" : "local";
  }

  function ensureRealtimeSubscription(listingId, threadKey) {
    if (!listingId) return;
    const roomKey = `${listingId}::${threadKey}`;
    if (subscribedRoom === roomKey && storeSocket) return;
    subscribedRoom = roomKey;

    if (typeof window.io === "function") {
      if (!storeSocket) {
        try {
          storeSocket = window.io(STORE_API_BASE, { transports: ["websocket", "polling"] });
          storeSocket.on("connect", () => {
            realtimeStatus = "live socket";
            const badge = document.getElementById("az-rt-badge");
            if (badge) badge.textContent = "● Live Socket";
            if (chatListingId) {
              storeSocket.emit("join_store_chat", { listing_id: chatListingId, thread_key: activeThreadKey });
            }
          });
          storeSocket.on("store_message", async (row) => {
            if (!row) return;
            if (String(row.listing_id) === String(chatListingId) && String(row.thread_key || "buyer-1") === String(activeThreadKey)) {
              const added = upsertLocalMessage(row);
              if (added) {
                await render({ skipRealtimeSync: true });
                const stream = document.getElementById("az-chat-stream");
                if (stream) stream.scrollTop = stream.scrollHeight;
              }
            }
          });
          storeSocket.on("store_updated", () => {
            render({ skipRealtimeSync: true });
          });
        } catch (_) {}
      }
      if (storeSocket) {
        storeSocket.emit("join_store_chat", { listing_id: listingId, thread_key: threadKey });
      }
    }
  }

  function grabGpsOnce(onOk, onErr) {
    if (!navigator.geolocation) {
      if (onErr) onErr("Geolocation unavailable in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0)
        };
        currentCoords = coords;
        if (onOk) onOk(coords);
      },
      (err) => {
        if (onErr) onErr((err && err.message) || "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }

  function toggleLiveTracking(listingId) {
    if (liveWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveWatchId);
      liveWatchId = null;
      statusBanner = "Live GPS tracking paused.";
      render();
      return;
    }
    if (!navigator.geolocation) {
      statusBanner = "Geolocation is not supported on this device.";
      render();
      return;
    }
    statusBanner = "Starting live GPS stream...";
    liveWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0)
        };
        currentCoords = coords;
        if (listingId) {
          await updateListingLocation(
            listingId,
            coords,
            `Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
            true
          );
        }
        statusBanner = `Live GPS active: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (±${coords.accuracy}m)`;
        await render({ skipRealtimeSync: true });
      },
      (err) => {
        statusBanner = "GPS watch error: " + ((err && err.message) || "Permission denied.");
        render();
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 3000 }
    );
    render();
  }

  function ensureMountTarget() {
    let mount =
      document.getElementById("azmari-shop-mount") ||
      document.querySelector("[data-shop-mount]") ||
      document.querySelector(".shop-section");

    if (!mount) {
      const main = document.querySelector("main") || document.body;
      mount = document.createElement("section");
      mount.id = "azmari-shop-mount";
      mount.style.cssText = "max-width:1120px;margin:24px auto;padding:0 14px 48px;";
      const scripts = main.querySelectorAll("script");
      if (scripts.length > 0 && main === document.body) {
        document.body.insertBefore(mount, scripts[0]);
      } else {
        main.appendChild(mount);
      }
    }
    return mount;
  }

  function injectStylesOnce() {
    if (document.getElementById("azmari-jiji-shop-styles")) return;
    const style = document.createElement("style");
    style.id = "azmari-jiji-shop-styles";
    style.textContent = `
      .az-shop-wrap{color:var(--ink,#e6efff);font-family:inherit}
      .az-shop-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:var(--sf,#0d1530);border:1px solid var(--ln,#1c2b57);border-radius:16px;padding:14px;margin-bottom:14px}
      .az-shop-brand h2{margin:0;font-size:20px;color:var(--ink,#e6efff)}
      .az-shop-brand p{margin:3px 0 0;font-size:13px;color:var(--mu,#8fa3d1)}
      .az-shop-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      .az-btn{border:0;border-radius:10px;padding:9px 14px;font:700 13px/1.2 inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:transform .12s ease,opacity .15s ease}
      .az-btn:active{transform:scale(.98)}
      .az-btn-pri{background:var(--gr,#3cc8ff);color:var(--on,#021226)}
      .az-btn-gold{background:var(--gd,#e8b23a);color:#17110a}
      .az-btn-sec{background:var(--sf2,#0b1226);color:var(--ink,#e6efff);border:1px solid var(--ln,#1c2b57)}
      .az-btn-ok{background:#1fb86b;color:#fff}
      .az-btn-warn{background:var(--rd,#ea7d73);color:#140707}
      .az-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:14px}
      .az-cats{display:flex;flex-wrap:wrap;gap:6px}
      .az-cat-pill{border:1px solid var(--ln,#1c2b57);background:var(--sf,#0d1530);color:var(--ink,#e6efff);border-radius:99px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer}
      .az-cat-pill.on{background:var(--gr,#3cc8ff);color:var(--on,#021226);border-color:var(--gr,#3cc8ff)}
      .az-search{min-width:220px;flex:1;max-width:320px;padding:8px 12px;border-radius:10px;border:1px solid var(--ln,#1c2b57);background:var(--sf,#0d1530);color:var(--ink,#e6efff);font-size:14px}
      .az-banner{background:var(--sf,#0d1530);border:1px solid var(--ln,#1c2b57);border-left:4px solid var(--gd,#e8b23a);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:8px}
      .az-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:14px}
      .az-card{background:var(--sf,#0d1530);border:1px solid var(--ln,#1c2b57);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
      .az-media{position:relative;height:165px;background:linear-gradient(135deg,var(--sf2,#0b1226),var(--bg,#060b1a));display:grid;place-items:center;overflow:hidden}
      .az-media img{width:100%;height:100%;object-fit:cover;display:block}
      .az-media-ico{font-size:46px}
      .az-fav{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(6,11,26,.65);color:#fff;font-size:16px;cursor:pointer}
      .az-fav.on{color:#ff4d6d}
      .az-tag-live{position:absolute;left:8px;bottom:8px;background:rgba(31,184,107,.92);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px}
      .az-tag-pending{position:absolute;left:8px;top:8px;background:var(--gd,#e8b23a);color:#17110a;font-size:11px;font-weight:800;padding:2px 8px;border-radius:99px}
      .az-body{padding:12px}
      .az-title{margin:0 0 4px;font-size:16px;font-weight:700;color:var(--ink,#e6efff)}
      .az-price{font-size:17px;font-weight:800;color:var(--gr,#3cc8ff);margin-bottom:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .az-nego{font-size:11px;font-weight:700;background:var(--sf2,#0b1226);color:var(--gd,#e8b23a);border:1px solid var(--ln,#1c2b57);padding:2px 7px;border-radius:99px}
      .az-meta{font-size:12px;color:var(--mu,#8fa3d1);display:flex;flex-direction:column;gap:3px;margin-bottom:8px}
      .az-loc-a{color:var(--nb,#3cc8ff);text-decoration:none;font-weight:600}
      .az-desc{margin:0;font-size:13px;color:var(--ink,#e6efff);opacity:.9;line-height:1.4}
      .az-foot{padding:10px 12px;border-top:1px solid var(--ln,#1c2b57);display:flex;gap:8px;flex-wrap:wrap}
      .az-foot .az-btn{flex:1;justify-content:center}
      .az-modal-bg{position:fixed;inset:0;background:rgba(3,7,18,.75);z-index:9990;display:flex;align-items:center;justify-content:center;padding:12px}
      .az-modal{background:var(--sf,#0d1530);border:1px solid var(--ln,#1c2b57);border-radius:16px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;padding:18px;color:var(--ink,#e6efff)}
      .az-field{margin-bottom:11px}
      .az-field label{display:block;font-size:12px;font-weight:700;color:var(--mu,#8fa3d1);margin-bottom:4px}
      .az-field input,.az-field select,.az-field textarea{width:100%;padding:9px 11px;border-radius:10px;border:1px solid var(--ln,#1c2b57);background:var(--sf2,#0b1226);color:var(--ink,#e6efff);font:14px/1.35 inherit}
      .az-thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
      .az-thumbs img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--ln,#1c2b57)}
      .az-chat-drawer{position:fixed;right:14px;bottom:14px;width:370px;max-width:calc(100vw - 28px);height:480px;max-height:calc(100vh - 28px);background:var(--sf,#0d1530);border:1px solid var(--ln,#1c2b57);border-radius:16px;box-shadow:0 14px 36px rgba(0,0,0,.55);z-index:9995;display:flex;flex-direction:column;overflow:hidden}
      .az-chat-hd{background:var(--sf2,#0b1226);border-bottom:1px solid var(--ln,#1c2b57);padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px}
      .az-chat-sub{padding:7px 12px;background:rgba(0,0,0,.18);border-bottom:1px solid var(--ln,#1c2b57);display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;font-size:12px}
      .az-chat-sub select,.az-chat-sub input{padding:4px 7px;border-radius:7px;border:1px solid var(--ln,#1c2b57);background:var(--sf2,#0b1226);color:var(--ink,#e6efff);font-size:12px}
      .az-chat-stream{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
      .az-msg{max-width:82%;padding:8px 11px;border-radius:12px;font-size:13px;line-height:1.38}
      .az-msg.buyer{align-self:flex-start;background:var(--sf2,#0b1226);border:1px solid var(--ln,#1c2b57);color:var(--ink,#e6efff)}
      .az-msg.seller{align-self:flex-end;background:var(--gr,#3cc8ff);color:var(--on,#021226);font-weight:600}
      .az-msg-meta{font-size:10px;opacity:.75;margin-bottom:2px}
      .az-quick{display:flex;gap:5px;overflow-x:auto;padding:6px 10px;border-top:1px solid var(--ln,#1c2b57)}
      .az-quick button{flex:none;font-size:11px;padding:4px 8px;border-radius:99px;border:1px solid var(--ln,#1c2b57);background:var(--sf2,#0b1226);color:var(--ink,#e6efff);cursor:pointer}
      .az-chat-ft{padding:8px 10px;border-top:1px solid var(--ln,#1c2b57);display:flex;gap:6px;align-items:center}
      .az-chat-ft input{flex:1;min-width:0;padding:8px 10px;border-radius:10px;border:1px solid var(--ln,#1c2b57);background:var(--sf2,#0b1226);color:var(--ink,#e6efff);font-size:13px}
      @media (max-width:600px){
        .az-chat-drawer{right:0;bottom:0;width:100vw;max-width:100vw;height:78vh;border-radius:16px 16px 0 0}
      }
    `;
    document.head.appendChild(style);
  }

  async function render(opts) {
    const options = opts || {};
    injectStylesOnce();
    const mount = ensureMountTarget();

    const allListings = await loadListings();
    const favs = readJson(STORAGE_FAVS_KEY, []);
    const adminOn = isAdminMode();
    const currentUser = getUserName();
    const currentApproved = currentUser ? await checkSellerUnlimited(currentUser) : false;

    const visibleListings = allListings.filter((item) => {
      if (!adminOn && item.approved === false) return false;
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          item.title,
          item.category,
          item.description,
          item.seller_name,
          item.location_label
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const activeChatListing = chatListingId
      ? allListings.find((x) => String(x.id) === String(chatListingId)) || null
      : null;

    let chatMessages = [];
    if (activeChatListing) {
      chatMessages = await loadMessages(activeChatListing.id, activeThreadKey);
      if (!options.skipRealtimeSync) {
        ensureRealtimeSubscription(activeChatListing.id, activeThreadKey);
      }
    } else if (!options.skipRealtimeSync) {
      cleanupRealtime();
    }

    const pendingCount = allListings.filter((x) => x.approved === false).length;

    const cardsHtml = visibleListings.length
      ? visibleListings
          .map((item) => {
            const isFav = favs.includes(String(item.id));
            const isPending = item.approved === false;
            const photo = (Array.isArray(item.photos) && item.photos[0]) || item.image_url || "";
            const hasCoords = typeof item.lat === "number" && Number.isFinite(item.lat) && typeof item.lng === "number" && Number.isFinite(item.lng);
            const dist =
              hasCoords && currentCoords
                ? distanceKm(currentCoords.lat, currentCoords.lng, item.lat, item.lng)
                : null;
            const mapHref = hasCoords
              ? `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=15/${item.lat}/${item.lng}`
              : `https://www.openstreetmap.org/search?query=${encodeURIComponent(item.location_label || "Addis Ababa")}`;

            return `
              <article class="az-card" data-id="${esc(item.id)}">
                <div>
                  <div class="az-media">
                    ${photo ? `<img src="${esc(photo)}" alt="${esc(item.title)}" />` : `<div class="az-media-ico">${esc(item.icon || categoryIcon(item.category))}</div>`}
                    ${isPending ? `<span class="az-tag-pending">⏳ Pending Admin</span>` : ``}
                    ${item.live_location_active ? `<span class="az-tag-live">● Live GPS</span>` : ``}
                    <button type="button" class="az-fav ${isFav ? "on" : ""}" data-fav="${esc(item.id)}" title="Save item">${isFav ? "♥" : "♡"}</button>
                  </div>
                  <div class="az-body">
                    <h3 class="az-title">${esc(item.title)}</h3>
                    <div class="az-price">
                      <span>${esc(formatEtb(item.price_etb))}</span>
                      ${item.negotiable ? `<span class="az-nego">Negotiable</span>` : ``}
                    </div>
                    <div class="az-meta">
                      <span>🏷️ ${esc(item.category || "Item")} · ${esc(item.condition || "Like New")}</span>
                      <span>👤 ${esc(item.seller_name || "Seller")}${isSellerApprovedLocal(item.seller_name) ? " · ✓ Unlimited Approved" : ""}</span>
                      <span>
                        <a class="az-loc-a" href="${esc(mapHref)}" target="_blank" rel="noopener noreferrer">
                          📍 ${esc(item.location_label || "Addis Ababa")}
                        </a>
                        ${dist !== null ? ` · <b>${dist.toFixed(1)} km away</b>` : ``}
                      </span>
                    </div>
                    <p class="az-desc">${esc(item.description || "")}</p>
                    ${
                      adminOn
                        ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                            ${
                              isPending
                                ? `<button type="button" class="az-btn az-btn-ok" data-approve-id="${esc(item.id)}">Approve Post & Seller</button>`
                                : `<button type="button" class="az-btn az-btn-warn" data-unapprove-id="${esc(item.id)}">Set Pending</button>`
                            }
                          </div>`
                        : ``
                    }
                  </div>
                </div>
                <div class="az-foot">
                  <button type="button" class="az-btn az-btn-pri" data-chat-id="${esc(item.id)}">💬 Chat</button>
                  <button type="button" class="az-btn az-btn-sec" data-pin-id="${esc(item.id)}">📍 Pin</button>
                </div>
              </article>
            `;
          })
          .join("")
      : `<div style="grid-column:1/-1;background:var(--sf,#0d1530);border:1px solid var(--ln,#1c2b57);border-radius:14px;padding:24px;text-align:center;">
          No shop items match your filter.
        </div>`;

    const postModalHtml = postModalOpen
      ? `
        <div class="az-modal-bg" id="az-post-modal">
          <div class="az-modal" role="dialog" aria-modal="true" aria-label="Post a new item">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h3 style="margin:0;font-size:18px;">Post Ad (Jiji Style)</h3>
              <button type="button" class="az-btn az-btn-sec" id="az-close-post">✕</button>
            </div>
            <p style="margin:0 0 12px;font-size:12px;color:var(--mu,#8fa3d1);">
              New users start pending admin approval. Once approved by admin, you can post <b>unlimited</b> items.
            </p>
            <form id="az-post-form">
              <div class="az-field">
                <label>Seller Name *</label>
                <input type="text" name="seller_name" id="az-f-seller" required value="${esc(currentUser)}" placeholder="Your name (e.g., Nahom)" />
              </div>
              <div class="az-field">
                <label>Phone / Contact</label>
                <input type="text" name="seller_phone" placeholder="+251 9XX XXX XXX" />
              </div>
              <div class="az-field">
                <label>Ad Title *</label>
                <input type="text" name="title" required placeholder="e.g., Yamaha PSR Keyboard / Krar" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="az-field">
                  <label>Category *</label>
                  <select name="category">
                    ${CATEGORIES.filter((c) => c.id !== "All")
                      .map((c) => `<option value="${esc(c.id)}">${esc(c.icon)} ${esc(c.label)}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="az-field">
                  <label>Condition *</label>
                  <select name="condition">
                    <option value="New">New</option>
                    <option value="Like New" selected>Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>
              <div class="az-field">
                <label>Price (ETB) *</label>
                <input type="number" name="price_etb" min="0" step="1" required placeholder="e.g., 12000" />
                <label style="display:inline-flex;align-items:center;gap:6px;margin-top:6px;color:var(--ink,#e6efff);cursor:pointer;">
                  <input type="checkbox" name="negotiable" style="width:auto;" checked /> Price is negotiable
                </label>
              </div>
              <div class="az-field">
                <label>Live Location / Area *</label>
                <div style="display:flex;gap:8px;">
                  <input type="text" name="location_label" id="az-f-loc" required value="${esc(currentCoords ? `Live GPS (${currentCoords.lat}, ${currentCoords.lng})` : "Addis Ababa")}" placeholder="Area or neighborhood" />
                  <button type="button" class="az-btn az-btn-gold" id="az-f-gps">📍 Live GPS</button>
                </div>
                <input type="hidden" name="lat" id="az-f-lat" value="${currentCoords ? currentCoords.lat : ""}" />
                <input type="hidden" name="lng" id="az-f-lng" value="${currentCoords ? currentCoords.lng : ""}" />
              </div>
              <div class="az-field">
                <label>Product Photo</label>
                <input type="file" id="az-f-photos" accept="image/*" />
                <div class="az-thumbs" id="az-f-thumbs">
                  ${draftPhotos.map((src) => `<img src="${esc(src)}" alt="Preview" />`).join("")}
                </div>
              </div>
              <div class="az-field">
                <label>Description *</label>
                <textarea name="description" rows="3" required placeholder="Describe condition, accessories, and meetup details..."></textarea>
              </div>
              <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
                <button type="button" class="az-btn az-btn-sec" id="az-cancel-post">Cancel</button>
                <button type="submit" class="az-btn az-btn-pri">Publish Ad</button>
              </div>
            </form>
          </div>
        </div>
      `
      : "";

    const chatDrawerHtml = activeChatListing
      ? `
        <aside class="az-chat-drawer" id="az-chat-drawer" aria-label="Buyer and Seller Chat">
          <div class="az-chat-hd">
            <div style="min-width:0;">
              <div style="font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${esc(activeChatListing.title)}
              </div>
              <div style="font-size:11px;color:var(--mu,#8fa3d1);">
                Seller: ${esc(activeChatListing.seller_name)} · <span id="az-rt-badge">${esc(realtimeStatus)}</span>
              </div>
            </div>
            <button type="button" class="az-btn az-btn-sec" id="az-chat-close" style="padding:5px 9px;">✕</button>
          </div>
          <div class="az-chat-sub">
            <div style="display:flex;gap:6px;align-items:center;">
              <label for="az-chat-role">Role:</label>
              <select id="az-chat-role">
                <option value="buyer" ${activeSide === "buyer" ? "selected" : ""}>Buyer</option>
                <option value="seller" ${activeSide === "seller" ? "selected" : ""}>Seller</option>
              </select>
              <input type="text" id="az-chat-name" value="${esc(currentUser || (activeSide === "seller" ? activeChatListing.seller_name : "Buyer"))}" placeholder="Name" style="width:95px;" />
            </div>
            <div style="display:flex;gap:5px;align-items:center;">
              <input type="text" id="az-chat-thread-key" value="${esc(activeThreadKey)}" title="Chat thread ID" style="width:74px;" />
              <button type="button" class="az-btn az-btn-sec" id="az-share-seller-live" style="padding:4px 7px;font-size:11px;" title="Update seller live GPS">📍 Live</button>
            </div>
          </div>
          <div class="az-chat-stream" id="az-chat-stream">
            ${
              chatMessages.length
                ? chatMessages
                    .map((m) => {
                      const side = m.sender_side === "seller" ? "seller" : "buyer";
                      const hasPin = typeof m.shared_lat === "number" && Number.isFinite(m.shared_lat) && typeof m.shared_lng === "number" && Number.isFinite(m.shared_lng);
                      const pinUrl = hasPin
                        ? `https://www.openstreetmap.org/?mlat=${m.shared_lat}&mlon=${m.shared_lng}#map=16/${m.shared_lat}/${m.shared_lng}`
                        : "";
                      return `
                        <div class="az-msg ${side}">
                          <div class="az-msg-meta">${esc(m.sender_name || side)} · ${esc(timeAgo(m.created_at))}</div>
                          <div>${esc(m.body)}</div>
                          ${
                            hasPin
                              ? `<div style="margin-top:4px;"><a href="${esc(pinUrl)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;font-weight:700;">📍 ${esc(m.shared_label || "Shared Live Location")} (${m.shared_lat}, ${m.shared_lng})</a></div>`
                              : ``
                          }
                        </div>
                      `;
                    })
                    .join("")
                : `<div style="text-align:center;color:var(--mu,#8fa3d1);font-size:12px;margin:auto;">Start chatting with ${esc(activeChatListing.seller_name)} about "${esc(activeChatListing.title)}".</div>`
            }
          </div>
          <div class="az-quick">
            <button type="button" data-quick="Is this still available?">Is this still available?</button>
            <button type="button" data-quick="Can we meet today?">Can we meet today?</button>
            <button type="button" data-quick="What is your last price?">Last price?</button>
          </div>
          <div class="az-chat-ft">
            <button type="button" class="az-btn az-btn-gold" id="az-chat-send-pin" style="padding:8px;" title="Send live GPS location">📍</button>
            <input type="text" id="az-chat-text" placeholder="Type a message..." autocomplete="off" />
            <button type="button" class="az-btn az-btn-pri" id="az-chat-send-btn">Send</button>
          </div>
        </aside>
      `
      : "";

    mount.innerHTML = `
      <div class="az-shop-wrap">
        <div class="az-shop-top">
          <div class="az-shop-brand">
            <h2>Azmari-Bet Marketplace</h2>
            <p>
              Backend: <b>${backendOnline ? `<span style="color:#5ee38a;">localhost:3000 Connected</span>` : `<span style="color:var(--gd,#e8b23a);">Local Cache</span>`}</b> · 2 sample items · Approved users post unlimited ads
              ${currentUser ? ` · <b>${esc(currentUser)}</b> (${currentApproved ? `<span style="color:#5ee38a;">Unlimited Approved</span>` : `<span style="color:var(--gd,#e8b23a);">Pending Approval</span>`})` : ``}
            </p>
          </div>
          <div class="az-shop-actions">
            <button type="button" class="az-btn az-btn-sec" id="az-live-gps-btn">
              ${liveWatchId !== null ? "● Stop Live GPS" : "📍 Live Location"}
            </button>
            <button type="button" class="az-btn az-btn-sec" id="az-admin-mode-btn">
              ${adminOn ? `🛡️ Admin: ON (${pendingCount} pending)` : `🛡️ Admin: OFF`}
            </button>
            <button type="button" class="az-btn az-btn-pri" id="az-open-post-btn">+ Post Ad</button>
          </div>
        </div>

        ${
          statusBanner
            ? `<div class="az-banner">
                <span>${esc(statusBanner)}</span>
                <button type="button" class="az-btn az-btn-sec" id="az-dismiss-banner" style="padding:4px 8px;font-size:11px;">Dismiss</button>
              </div>`
            : ``
        }

        <div class="az-toolbar">
          <div class="az-cats">
            ${CATEGORIES.map(
              (c) =>
                `<button type="button" class="az-cat-pill ${selectedCategory === c.id ? "on" : ""}" data-cat="${esc(c.id)}">${esc(c.icon)} ${esc(c.label)}</button>`
            ).join("")}
          </div>
          <input type="search" class="az-search" id="az-search-input" value="${esc(searchQuery)}" placeholder="Search instruments, gear, area..." />
        </div>

        <div class="az-grid">${cardsHtml}</div>
      </div>
      ${postModalHtml}
      ${chatDrawerHtml}
    `;

    bindEvents(mount);
  }

  function bindEvents(mount) {
    const dismissBtn = mount.querySelector("#az-dismiss-banner");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        statusBanner = "";
        render();
      });
    }

    const adminBtn = mount.querySelector("#az-admin-mode-btn");
    if (adminBtn) {
      adminBtn.addEventListener("click", () => {
        setAdminMode(!isAdminMode());
        statusBanner = isAdminMode()
          ? "Admin mode ON: approve pending posts to unlock unlimited posting for that seller."
          : "Admin mode OFF.";
        render();
      });
    }

    const liveGpsBtn = mount.querySelector("#az-live-gps-btn");
    if (liveGpsBtn) {
      liveGpsBtn.addEventListener("click", () => toggleLiveTracking(chatListingId || null));
    }

    const openPostBtn = mount.querySelector("#az-open-post-btn");
    if (openPostBtn) {
      openPostBtn.addEventListener("click", () => {
        draftPhotos = [];
        draftFile = null;
        postModalOpen = true;
        render();
      });
    }

    mount.querySelectorAll("[data-cat]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        selectedCategory = btnEl.getAttribute("data-cat") || "All";
        render();
      });
    });

    const searchInput = mount.querySelector("#az-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value || "";
        render();
      });
    }

    mount.querySelectorAll("[data-fav]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        const id = String(btnEl.getAttribute("data-fav"));
        const favs = readJson(STORAGE_FAVS_KEY, []);
        const next = favs.includes(id) ? favs.filter((x) => x !== id) : favs.concat(id);
        writeJson(STORAGE_FAVS_KEY, next);
        render();
      });
    });

    mount.querySelectorAll("[data-approve-id]").forEach((btnEl) => {
      btnEl.addEventListener("click", async () => {
        const id = btnEl.getAttribute("data-approve-id");
        await setListingApproval(id, true);
        statusBanner = "Approved! Seller can now post unlimited ads.";
        render();
      });
    });

    mount.querySelectorAll("[data-unapprove-id]").forEach((btnEl) => {
      btnEl.addEventListener("click", async () => {
        const id = btnEl.getAttribute("data-unapprove-id");
        await setListingApproval(id, false);
        statusBanner = "Listing set back to pending.";
        render();
      });
    });

    mount.querySelectorAll("[data-pin-id]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        const id = btnEl.getAttribute("data-pin-id");
        grabGpsOnce(
          async (coords) => {
            await updateListingLocation(
              id,
              coords,
              `Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
              true
            );
            statusBanner = `Live GPS updated (${coords.lat}, ${coords.lng}).`;
            render();
          },
          (err) => {
            statusBanner = "GPS error: " + err;
            render();
          }
        );
      });
    });

    mount.querySelectorAll("[data-chat-id]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        chatListingId = btnEl.getAttribute("data-chat-id");
        render();
        setTimeout(() => {
          const stream = document.getElementById("az-chat-stream");
          if (stream) stream.scrollTop = stream.scrollHeight;
        }, 30);
      });
    });

    const closePost = mount.querySelector("#az-close-post");
    const cancelPost = mount.querySelector("#az-cancel-post");
    [closePost, cancelPost].forEach((b) => {
      if (b) {
        b.addEventListener("click", () => {
          postModalOpen = false;
          draftPhotos = [];
          draftFile = null;
          render();
        });
      }
    });

    const fGpsBtn = mount.querySelector("#az-f-gps");
    if (fGpsBtn) {
      fGpsBtn.addEventListener("click", () => {
        statusBanner = "Fetching live GPS...";
        grabGpsOnce(
          (coords) => {
            const latEl = document.getElementById("az-f-lat");
            const lngEl = document.getElementById("az-f-lng");
            const locEl = document.getElementById("az-f-loc");
            if (latEl) latEl.value = String(coords.lat);
            if (lngEl) lngEl.value = String(coords.lng);
            if (locEl) locEl.value = `Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
            statusBanner = `Live GPS attached (${coords.lat}, ${coords.lng}).`;
            render();
          },
          (err) => {
            statusBanner = "GPS error: " + err;
            render();
          }
        );
      });
    }

    const fPhotos = mount.querySelector("#az-f-photos");
    if (fPhotos) {
      fPhotos.addEventListener("change", (e) => {
        const files = Array.from((e.target && e.target.files) || []);
        draftFile = files[0] || null;
        draftPhotos = files.slice(0, 4).map((f) => URL.createObjectURL(f));
        const thumbs = document.getElementById("az-f-thumbs");
        if (thumbs) {
          thumbs.innerHTML = draftPhotos.map((src) => `<img src="${esc(src)}" alt="Preview" />`).join("");
        }
      });
    }

    const postForm = mount.querySelector("#az-post-form");
    if (postForm) {
      postForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(postForm);
        const sellerName = String(fd.get("seller_name") || "").trim();
        setUserName(sellerName);
        const latRaw = parseFloat(fd.get("lat"));
        const lngRaw = parseFloat(fd.get("lng"));

        const res = await publishListing({
          seller_name: sellerName,
          seller_phone: String(fd.get("seller_phone") || ""),
          title: String(fd.get("title") || ""),
          category: String(fd.get("category") || "Traditional"),
          condition: String(fd.get("condition") || "Like New"),
          price_etb: Number(fd.get("price_etb") || 0),
          negotiable: fd.get("negotiable") === "on",
          location_label: String(fd.get("location_label") || "Addis Ababa"),
          lat: Number.isFinite(latRaw) ? latRaw : null,
          lng: Number.isFinite(lngRaw) ? lngRaw : null,
          file: draftFile,
          photos: draftPhotos.slice(),
          description: String(fd.get("description") || "")
        });

        postModalOpen = false;
        draftPhotos = [];
        draftFile = null;
        if (res.approved) {
          statusBanner = `Published "${res.item.title}"! Approved seller can post unlimited items.`;
        } else {
          statusBanner = `"${res.item.title}" is pending admin approval. Toggle "Admin: OFF -> ON" to approve ${sellerName} for unlimited posts.`;
        }
        await render();
      });
    }

    const chatClose = mount.querySelector("#az-chat-close");
    if (chatClose) {
      chatClose.addEventListener("click", () => {
        chatListingId = null;
        cleanupRealtime();
        render();
      });
    }

    const roleSel = mount.querySelector("#az-chat-role");
    if (roleSel) {
      roleSel.addEventListener("change", (e) => {
        activeSide = e.target.value === "seller" ? "seller" : "buyer";
        render();
      });
    }

    const threadInp = mount.querySelector("#az-chat-thread-key");
    if (threadInp) {
      threadInp.addEventListener("change", () => {
        activeThreadKey = (threadInp.value || "buyer-1").trim() || "buyer-1";
        render();
      });
    }

    const shareSellerLive = mount.querySelector("#az-share-seller-live");
    if (shareSellerLive) {
      shareSellerLive.addEventListener("click", () => {
        if (!chatListingId) return;
        grabGpsOnce(
          async (coords) => {
            await updateListingLocation(
              chatListingId,
              coords,
              `Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
              true
            );
            statusBanner = `Seller live location updated (${coords.lat}, ${coords.lng})`;
            await render();
          },
          (err) => {
            statusBanner = "GPS error: " + err;
            render();
          }
        );
      });
    }

    async function handleSendChat(withPin) {
      if (!chatListingId) return;
      const nameEl = document.getElementById("az-chat-name");
      const textEl = document.getElementById("az-chat-text");
      const sender =
        ((nameEl && nameEl.value) || "").trim() ||
        (activeSide === "seller" ? "Seller" : "Buyer");
      setUserName(sender);
      let body = ((textEl && textEl.value) || "").trim();
      if (!body && withPin) body = "Shared live meetup location";
      if (!body) return;

      const sendNow = async (coords) => {
        await postMessage({
          listing_id: chatListingId,
          thread_key: activeThreadKey,
          sender_name: sender,
          sender_side: activeSide,
          body,
          shared_lat: coords ? coords.lat : null,
          shared_lng: coords ? coords.lng : null,
          shared_label: coords ? "Live Location" : ""
        });
        await render({ skipRealtimeSync: true });
        const stream = document.getElementById("az-chat-stream");
        if (stream) stream.scrollTop = stream.scrollHeight;
      };

      if (withPin) {
        grabGpsOnce(
          (coords) => sendNow(coords),
          () => sendNow(currentCoords)
        );
      } else {
        await sendNow(null);
      }
    }

    const sendBtn = mount.querySelector("#az-chat-send-btn");
    if (sendBtn) sendBtn.addEventListener("click", () => handleSendChat(false));

    const sendPinBtn = mount.querySelector("#az-chat-send-pin");
    if (sendPinBtn) sendPinBtn.addEventListener("click", () => handleSendChat(true));

    mount.querySelectorAll("[data-quick]").forEach((qBtn) => {
      qBtn.addEventListener("click", async () => {
        const txt = qBtn.getAttribute("data-quick") || "";
        const textEl = document.getElementById("az-chat-text");
        if (textEl) textEl.value = txt;
        await handleSendChat(false);
      });
    });
  }

  window.AzmariShopChatLocation = { render: render, cleanupRealtime: cleanupRealtime };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => render());
  } else {
    render();
  }
})();
