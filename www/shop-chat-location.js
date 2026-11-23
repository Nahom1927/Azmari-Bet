(function () {
  "use strict";

  const STORAGE_LISTINGS_KEY = "azmari_store_listings_v2";
  const STORAGE_MESSAGES_KEY = "azmari_store_messages_v2";
  const STORAGE_FAVS_KEY = "azmari_store_favs_v2";
  const STORAGE_USER_KEY = "azmari_store_user_v2";

  const CATEGORIES = [
    { id: "All", label: "All", icon: "🛍️" },
    { id: "Keyboards", label: "Keyboards", icon: "🎹" },
    { id: "Strings", label: "Strings", icon: "🎸" },
    { id: "Traditional", label: "Traditional", icon: "🪕" },
    { id: "Percussion", label: "Percussion", icon: "🥁" },
    { id: "Audio", label: "Audio", icon: "🎙️" }
  ];

  const DEFAULT_LISTINGS = [
    {
      id: "seed-1",
      seller_name: "Dawit Alemu",
      seller_phone: "+251 911 234567",
      title: "Electric keyboard",
      category: "Keyboards",
      price_etb: 18500,
      condition: "Like New",
      city: "Addis Ababa",
      location_label: "Bole, Addis Ababa",
      lat: 8.9806,
      lng: 38.7578,
      verified: true,
      icon: "🎹",
      image_url: "",
      description: "61-key touch-sensitive keyboard with stand and adapter.",
      live_location_active: true,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: "seed-2",
      seller_name: "Hana Getachew",
      seller_phone: "+251 912 345678",
      title: "Digital piano",
      category: "Keyboards",
      price_etb: 42000,
      condition: "New",
      city: "Addis Ababa",
      location_label: "Kazanchis, Addis Ababa",
      lat: 9.0157,
      lng: 38.7654,
      verified: true,
      icon: "🎹",
      image_url: "",
      description: "88-key weighted digital piano with sustain pedal.",
      live_location_active: true,
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: "seed-3",
      seller_name: "Yonas Tadesse",
      seller_phone: "+251 913 456789",
      title: "Acoustic guitar",
      category: "Strings",
      price_etb: 7800,
      condition: "Good",
      city: "Addis Ababa",
      location_label: "Piassa, Addis Ababa",
      lat: 9.0349,
      lng: 38.7525,
      verified: false,
      icon: "🎸",
      image_url: "",
      description: "Warm spruce top acoustic guitar with gig bag.",
      live_location_active: false,
      created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
    },
    {
      id: "seed-4",
      seller_name: "Meron Bekele",
      seller_phone: "+251 914 567890",
      title: "Electric guitar",
      category: "Strings",
      price_etb: 15500,
      condition: "Like New",
      city: "Addis Ababa",
      location_label: "CMC, Addis Ababa",
      lat: 9.0211,
      lng: 38.8286,
      verified: true,
      icon: "🎸",
      image_url: "",
      description: "Clean strat-style electric guitar, ready for studio or stage.",
      live_location_active: true,
      created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ];

  let selectedCategory = "All";
  let searchQuery = "";
  let postModalOpen = false;
  let chatListingId = null;
  let activeThreadKey = "buyer-1";
  let activeSide = "buyer";
  let currentCoords = null;
  let liveWatchId = null;
  let statusBanner = "";
  let realtimeChannel = null;
  let subscribedKey = "";
  let realtimeStatus = "disconnected";

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

  function upsertLocalMessage(msg) {
    if (!msg || !msg.id) return false;
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

  function upsertLocalListing(row) {
    if (!row || !row.id) return;
    const normalized = Object.assign({}, row, {
      verified: row.verified !== undefined ? row.verified : Boolean(row.approved),
      icon: row.icon || categoryIcon(row.category)
    });
    const current = readJson(STORAGE_LISTINGS_KEY, []);
    const idx = current.findIndex((x) => String(x.id) === String(normalized.id));
    const next =
      idx >= 0
        ? current.map((x, i) => (i === idx ? Object.assign({}, x, normalized) : x))
        : [normalized].concat(current);
    writeJson(STORAGE_LISTINGS_KEY, next);
  }

  async function loadListings() {
    let local = readJson(STORAGE_LISTINGS_KEY, null);
    if (!Array.isArray(local) || local.length === 0) {
      local = DEFAULT_LISTINGS.slice();
      writeJson(STORAGE_LISTINGS_KEY, local);
    }

    const sb = getSupabase();
    if (sb && typeof sb.from === "function") {
      try {
        const { data, error } = await sb
          .from("shop_listings")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          const normalized = data.map((row) =>
            Object.assign({}, row, {
              verified: row.verified !== undefined ? row.verified : Boolean(row.approved),
              icon: row.icon || categoryIcon(row.category)
            })
          );
          writeJson(STORAGE_LISTINGS_KEY, normalized);
          return normalized;
        }
      } catch (_) {}
    }
    return local;
  }

  async function publishListing(input) {
    const newItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : "item-" + Date.now(),
      seller_name: input.seller_name.trim(),
      seller_phone: (input.seller_phone || "").trim(),
      seller_role: "seller",
      title: input.title.trim(),
      category: input.category || "Traditional",
      price_etb: Number(input.price_etb || 0),
      condition: input.condition || "Good",
      description: (input.description || "").trim(),
      image_url: (input.image_url || "").trim(),
      city: (input.city || "Addis Ababa").trim(),
      location_label: (input.location_label || input.city || "Addis Ababa").trim(),
      lat: typeof input.lat === "number" ? input.lat : null,
      lng: typeof input.lng === "number" ? input.lng : null,
      live_location_active: typeof input.lat === "number",
      location_updated_at: typeof input.lat === "number" ? new Date().toISOString() : null,
      approved: true,
      verified: true,
      icon: categoryIcon(input.category),
      created_at: new Date().toISOString()
    };

    const sb = getSupabase();
    if (sb && typeof sb.from === "function") {
      try {
        const dbRow = {
          seller_name: newItem.seller_name,
          seller_phone: newItem.seller_phone,
          seller_role: newItem.seller_role,
          title: newItem.title,
          category: newItem.category,
          price_etb: newItem.price_etb,
          condition: newItem.condition,
          description: newItem.description,
          image_url: newItem.image_url,
          city: newItem.city,
          location_label: newItem.location_label,
          lat: newItem.lat,
          lng: newItem.lng,
          live_location_active: newItem.live_location_active,
          location_updated_at: newItem.location_updated_at,
          approved: true
        };
        const { data, error } = await sb.from("shop_listings").insert(dbRow).select().single();
        if (!error && data) {
          const merged = Object.assign({}, newItem, data, { verified: true, icon: newItem.icon });
          upsertLocalListing(merged);
          return { item: merged, synced: true };
        }
      } catch (_) {}
    }

    upsertLocalListing(newItem);
    return { item: newItem, synced: false };
  }

  async function updateListingLocation(listingId, coords, label, active) {
    const patch = {
      lat: coords.lat,
      lng: coords.lng,
      location_label: label || "Live GPS, Addis Ababa",
      live_location_active: Boolean(active),
      location_updated_at: new Date().toISOString()
    };
    const updatedList = readJson(STORAGE_LISTINGS_KEY, []).map((it) =>
      String(it.id) === String(listingId) ? Object.assign({}, it, patch) : it
    );
    writeJson(STORAGE_LISTINGS_KEY, updatedList);

    const sb = getSupabase();
    if (sb && typeof sb.from === "function" && !String(listingId).startsWith("seed-")) {
      try {
        await sb.from("shop_listings").update(patch).eq("id", listingId);
      } catch (_) {}
    }
  }

  async function loadMessages(listingId, threadKey) {
    const local = readJson(STORAGE_MESSAGES_KEY, []).filter(
      (m) => String(m.listing_id) === String(listingId) && String(m.thread_key) === String(threadKey)
    );
    const sb = getSupabase();
    if (sb && typeof sb.from === "function" && !String(listingId).startsWith("seed-")) {
      try {
        const { data, error } = await sb
          .from("shop_messages")
          .select("*")
          .eq("listing_id", listingId)
          .eq("thread_key", threadKey)
          .order("created_at", { ascending: true });
        if (!error && Array.isArray(data)) {
          const rest = readJson(STORAGE_MESSAGES_KEY, []).filter(
            (m) => !(String(m.listing_id) === String(listingId) && String(m.thread_key) === String(threadKey))
          );
          writeJson(STORAGE_MESSAGES_KEY, rest.concat(data));
          return data;
        }
      } catch (_) {}
    }
    return local;
  }

  async function postMessage(msg) {
    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : "msg-" + Date.now(),
      listing_id: msg.listing_id,
      thread_key: msg.thread_key || "buyer-1",
      sender_name: msg.sender_name || (msg.sender_side === "seller" ? "Seller" : "Buyer"),
      sender_side: msg.sender_side === "seller" ? "seller" : "buyer",
      body: msg.body,
      shared_lat: typeof msg.shared_lat === "number" ? msg.shared_lat : null,
      shared_lng: typeof msg.shared_lng === "number" ? msg.shared_lng : null,
      shared_label: msg.shared_label || "",
      created_at: new Date().toISOString()
    };

    upsertLocalMessage(record);

    const sb = getSupabase();
    if (sb && typeof sb.from === "function" && !String(record.listing_id).startsWith("seed-")) {
      try {
        const { data, error } = await sb
          .from("shop_messages")
          .insert({
            listing_id: record.listing_id,
            thread_key: record.thread_key,
            sender_name: record.sender_name,
            sender_side: record.sender_side,
            body: record.body,
            shared_lat: record.shared_lat,
            shared_lng: record.shared_lng,
            shared_label: record.shared_label
          })
          .select()
          .single();
        if (!error && data) {
          upsertLocalMessage(data);
          return data;
        }
      } catch (_) {}
    }
    return record;
  }

  function cleanupRealtime() {
    const sb = getSupabase();
    if (realtimeChannel) {
      try {
        if (sb && typeof sb.removeChannel === "function") {
          sb.removeChannel(realtimeChannel);
        } else if (typeof realtimeChannel.unsubscribe === "function") {
          realtimeChannel.unsubscribe();
        }
      } catch (_) {}
      realtimeChannel = null;
    }
    subscribedKey = "";
    realtimeStatus = "disconnected";
  }

  function ensureRealtimeSubscription(listingId, threadKey) {
    const sb = getSupabase();
    if (!sb || typeof sb.channel !== "function" || !listingId || String(listingId).startsWith("seed-")) {
      return;
    }

    const nextKey = String(listingId) + "::" + String(threadKey);
    if (realtimeChannel && subscribedKey === nextKey) {
      return;
    }

    cleanupRealtime();
    subscribedKey = nextKey;
    realtimeStatus = "connecting";

    try {
      const channelName = `azmari-store-live-${String(listingId).slice(0, 8)}-${Date.now()}`;
      realtimeChannel = sb
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "shop_messages",
            filter: `listing_id=eq.${listingId}`
          },
          async (payload) => {
            const row = payload && payload.new ? payload.new : null;
            if (!row) return;
            if (String(row.thread_key || "buyer-1") !== String(activeThreadKey)) return;
            const added = upsertLocalMessage(row);
            if (added && String(chatListingId) === String(listingId)) {
              await render({ skipRealtimeSync: true });
              const stream = document.getElementById("az-chat-stream");
              if (stream) stream.scrollTop = stream.scrollHeight;
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shop_listings",
            filter: `id=eq.${listingId}`
          },
          async (payload) => {
            const row = payload && payload.new ? payload.new : null;
            if (!row) return;
            upsertLocalListing(row);
            if (String(chatListingId) === String(listingId)) {
              await render({ skipRealtimeSync: true });
            }
          }
        )
        .subscribe((status) => {
          realtimeStatus = String(status || "subscribing").toLowerCase();
          const badge = document.getElementById("az-rt-badge");
          if (badge) {
            badge.textContent = realtimeStatus === "subscribed" ? "● Live Realtime" : `○ ${realtimeStatus}`;
          }
        });
    } catch (_) {
      realtimeStatus = "fallback";
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
        if (onErr) onErr(err && err.message ? err.message : "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }

  function injectStyles() {
    if (document.getElementById("az-jiji-store-styles")) return;
    const style = document.createElement("style");
    style.id = "az-jiji-store-styles";
    style.textContent = `
      #azmari-shop-marketplace { color-scheme: light !important; }
      .az-st-shell { max-width: 780px; margin: 12px auto 84px; padding: 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fbf9f2 !important; color: #111827 !important; border-radius: 18px; border: 1px solid #d97706; }
      .az-st-topbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
      .az-st-h1 { margin: 0; font-size: 1.65rem; font-weight: 800; color: #1e3a8a; letter-spacing: -0.02em; }
      .az-st-post-cta { background: #15803d; color: #ffffff; border: none; border-radius: 999px; padding: 9px 16px; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
      .az-st-live-cta { background: #1e3a8a; color: #fef3c7; border: 1px solid #d97706; border-radius: 999px; padding: 8px 13px; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
      .az-st-search { display: flex; align-items: center; gap: 8px; background: #ffffff !important; border: 1px solid #94a3b8; border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; }
      .az-st-search input { border: none; outline: none; width: 100%; font-size: 0.98rem; color: #111827 !important; -webkit-text-fill-color: #111827 !important; background: #ffffff !important; }
      .az-st-cats { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 14px; scrollbar-width: none; }
      .az-st-cats::-webkit-scrollbar { display: none; }
      .az-st-cat { flex: 0 0 auto; min-width: 76px; padding: 10px 12px; border-radius: 14px; border: 1px solid #cbd5e1; background: #ffffff !important; color: #1e293b !important; text-align: center; cursor: pointer; font-size: 0.82rem; font-weight: 600; }
      .az-st-cat.active { background: #1e3a8a !important; color: #fef3c7 !important; border-color: #d97706; font-weight: 700; }
      .az-st-cat-ico { display: block; font-size: 1.45rem; margin-bottom: 4px; }
      .az-st-sub { margin: 0 0 12px; font-size: 1.05rem; font-weight: 800; color: #1e3a8a; }
      .az-st-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      @media (min-width: 680px) { .az-st-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      .az-st-card { background: #ffffff !important; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; border: 1px solid #dbe4f0; }
      .az-st-hero { position: relative; height: 132px; background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 65%, #b45309 100%); display: flex; align-items: center; justify-content: center; }
      .az-st-hero img { width: 100%; height: 100%; object-fit: cover; }
      .az-st-hero-emoji { font-size: 3.3rem; }
      .az-st-fav { position: absolute; top: 9px; right: 9px; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(254,243,199,0.5); background: rgba(17,24,39,0.65); color: #fff; font-size: 1rem; cursor: pointer; }
      .az-st-verified { position: absolute; left: 9px; bottom: 9px; background: #15803d; color: #ffffff; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 999px; border: 1px solid #fef3c7; }
      .az-st-body { padding: 10px 11px 11px; display: flex; flex-direction: column; gap: 4px; flex: 1; background: #ffffff !important; }
      .az-st-price { color: #b45309; font-weight: 800; font-size: 1.05rem; }
      .az-st-title { font-weight: 700; font-size: 0.96rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .az-st-meta { font-size: 0.77rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .az-st-actions { display: flex; gap: 7px; margin-top: 8px; }
      .az-st-contact { flex: 1; background: #1e3a8a; color: #fef3c7; border: none; border-radius: 10px; padding: 8px 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; }
      .az-st-flag { width: 36px; border: 1px solid #cbd5e1; background: #fffbeb !important; color: #b91c1c; border-radius: 10px; cursor: pointer; font-size: 0.9rem; }
      .az-st-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.62); z-index: 9999; display: flex; align-items: flex-end; justify-content: center; padding: 10px; }
      @media (min-width: 640px) { .az-st-overlay { align-items: center; } }
      .az-st-sheet { width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto; background: #fbf9f2 !important; color: #111827 !important; border-radius: 20px; padding: 16px; border: 2px solid #d97706; }
      .az-st-sheet input, .az-st-sheet select, .az-st-sheet textarea { background-color: #ffffff !important; color: #111827 !important; -webkit-text-fill-color: #111827 !important; border: 1px solid #64748b !important; opacity: 1 !important; }
      .az-st-sheet input::placeholder, .az-st-sheet textarea::placeholder { color: #64748b !important; -webkit-text-fill-color: #64748b !important; opacity: 1 !important; }
      .az-st-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: 0.84rem; font-weight: 700; color: #1e3a8a; }
      .az-st-field input, .az-st-field select, .az-st-field textarea { padding: 9px 11px; border-radius: 10px; font: inherit; }
      .az-st-chat-stream { max-height: 250px; overflow-y: auto; background: #ffffff !important; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 8px; margin: 10px 0; }
      .az-st-bubble { max-width: 82%; padding: 8px 11px; border-radius: 12px; font-size: 0.88rem; line-height: 1.35; color: #111827 !important; }
      .az-st-bubble.buyer { align-self: flex-start; background: #eff6ff !important; border: 1px solid #93c5fd; }
      .az-st-bubble.seller { align-self: flex-end; background: #fef3c7 !important; border: 1px solid #f59e0b; }
      .az-st-banner { font-size: 0.82rem; color: #1e3a8a; background: #fef3c7 !important; border: 1px solid #f59e0b; padding: 6px 10px; border-radius: 10px; margin-bottom: 8px; font-weight: 700; }
      .az-rt-pill { display: inline-block; font-size: 0.72rem; font-weight: 700; color: #15803d; background: #dcfce7; border: 1px solid #86efac; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
    `;
    document.head.appendChild(style);
  }

  function findStoreMountPoint() {
    let mount = document.getElementById("azmari-shop-marketplace");
    if (!mount) {
      const parent = document.querySelector("main") || document.body;
      mount = document.createElement("section");
      mount.id = "azmari-shop-marketplace";
      parent.appendChild(mount);
    }
    mount.style.display = "block";
    mount.style.visibility = "visible";
    mount.style.opacity = "1";
    return mount;
  }

  async function render(opts) {
    const options = opts || {};
    injectStyles();
    const mount = findStoreMountPoint();
    const allListings = await loadListings();
    const favs = readJson(STORAGE_FAVS_KEY, []);
    const savedName = getUserName();

    const q = searchQuery.trim().toLowerCase();
    const filtered = allListings.filter((item) => {
      const catOk = selectedCategory === "All" || String(item.category).toLowerCase() === selectedCategory.toLowerCase();
      if (!catOk) return false;
      if (!q) return true;
      const hay = [item.title, item.category, item.location_label, item.city, item.seller_name, item.description]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    const activeChatItem = chatListingId
      ? allListings.find((x) => String(x.id) === String(chatListingId)) || null
      : null;

    if (activeChatItem && !options.skipRealtimeSync) {
      ensureRealtimeSubscription(activeChatItem.id, activeThreadKey);
    } else if (!activeChatItem) {
      cleanupRealtime();
    }

    const chatMessages = activeChatItem ? await loadMessages(activeChatItem.id, activeThreadKey) : [];

    const catsHtml = CATEGORIES.map(
      (c) => `
        <button type="button" class="az-st-cat ${selectedCategory === c.id ? "active" : ""}" data-cat="${esc(c.id)}">
          <span class="az-st-cat-ico">${c.icon}</span>
          <span>${esc(c.label)}</span>
        </button>
      `
    ).join("");

    const cardsHtml = filtered.length
      ? filtered
          .map((item) => {
            const isFav = favs.includes(String(item.id));
            const hasCoords = typeof item.lat === "number" && typeof item.lng === "number";
            const km =
              hasCoords && currentCoords
                ? distanceKm(currentCoords.lat, currentCoords.lng, item.lat, item.lng)
                : null;
            const locText =
              (item.location_label || item.city || "Addis Ababa") +
              (typeof km === "number" ? ` (${km.toFixed(1)} km)` : "");
            return `
              <article class="az-st-card">
                <div class="az-st-hero">
                  ${
                    item.image_url
                      ? `<img src="${esc(item.image_url)}" alt="${esc(item.title)}" />`
                      : `<span class="az-st-hero-emoji">${esc(item.icon || categoryIcon(item.category))}</span>`
                  }
                  <button type="button" class="az-st-fav" data-fav="${esc(item.id)}" aria-label="Favorite">${isFav ? "❤️" : "🤍"}</button>
                  ${item.verified ? `<span class="az-st-verified">✓ Verified</span>` : ""}
                </div>
                <div class="az-st-body">
                  <div class="az-st-price">${esc(formatEtb(item.price_etb))}</div>
                  <div class="az-st-title" title="${esc(item.title)}">${esc(item.title)}</div>
                  <div class="az-st-meta">📍 ${esc(locText)}</div>
                  <div class="az-st-meta">🕒 ${esc(timeAgo(item.created_at))}</div>
                  <div class="az-st-meta">👤 ${esc(item.seller_name)}</div>
                  <div class="az-st-actions">
                    <button type="button" class="az-st-contact" data-contact="${esc(item.id)}">Contact</button>
                    <button type="button" class="az-st-flag" data-report="${esc(item.id)}" title="Report listing">🚩</button>
                  </div>
                </div>
              </article>
            `;
          })
          .join("")
      : `<div style="grid-column:1/-1;background:#fff;padding:18px;border-radius:14px;text-align:center;color:#475569;">No items match your filter. Tap <strong>+ Post Ad</strong> to list one!</div>`;

    const postModalHtml = postModalOpen
      ? `
        <div class="az-st-overlay" id="az-post-overlay">
          <div class="az-st-sheet">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <strong style="font-size:1.1rem;">Post Item (Afrotie / Gari Style)</strong>
              <button type="button" id="az-close-post" style="border:none;background:#f1f5f9;border-radius:999px;padding:6px 11px;cursor:pointer;font-weight:700;">✕</button>
            </div>
            <form id="az-afrotie-post-form">
              <div class="az-st-field">
                <label>Category *</label>
                <select name="category">
                  <option value="Keyboards">Keyboards</option>
                  <option value="Strings">Strings</option>
                  <option value="Traditional">Traditional (Krar, Masinko, Washint, Begena)</option>
                  <option value="Percussion">Percussion (Kebero, Drums)</option>
                  <option value="Audio">Audio & Studio Gear</option>
                </select>
              </div>
              <div class="az-st-field">
                <label>Item Title *</label>
                <input name="title" required placeholder="e.g. Yamaha PSR-E473 / Handcrafted Krar" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="az-st-field">
                  <label>Price (ETB) *</label>
                  <input name="price_etb" type="number" min="0" step="1" required placeholder="18500" />
                </div>
                <div class="az-st-field">
                  <label>Condition</label>
                  <select name="condition">
                    <option value="New">Brand New</option>
                    <option value="Like New" selected>Like New</option>
                    <option value="Good">Used - Good</option>
                    <option value="Fair">Used - Fair</option>
                  </select>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="az-st-field">
                  <label>Your Name *</label>
                  <input name="seller_name" required value="${esc(savedName)}" placeholder="Dawit Alemu" />
                </div>
                <div class="az-st-field">
                  <label>Phone Number *</label>
                  <input name="seller_phone" required placeholder="+251 9..." />
                </div>
              </div>
              <div class="az-st-field">
                <label>Sub-city / Neighborhood *</label>
                <input name="location_label" id="az-post-loc-label" required value="Bole, Addis Ababa" placeholder="Bole, Kazanchis, Piassa, CMC..." />
              </div>
              <div class="az-st-field">
                <label>Photo Upload or Image URL (optional)</label>
                <input type="file" id="az-post-photo-file" accept="image/*" />
                <input name="image_url" id="az-post-image-url" placeholder="Or paste image link https://..." />
              </div>
              <div class="az-st-field">
                <label>Details</label>
                <textarea name="description" rows="2" placeholder="Specs, accessories included, negotiable or fixed..."></textarea>
              </div>
              <input type="hidden" name="lat" id="az-post-lat" value="${currentCoords ? currentCoords.lat : ""}" />
              <input type="hidden" name="lng" id="az-post-lng" value="${currentCoords ? currentCoords.lng : ""}" />
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                <button type="button" id="az-post-pin-gps" style="flex:1;padding:10px;border-radius:12px;border:1px solid #1e3a8a;background:#eff6ff;color:#1e3a8a;font-weight:700;cursor:pointer;">📍 Attach Live GPS</button>
                <button type="submit" style="flex:1;padding:10px;border-radius:12px;border:none;background:#15803d;color:#fff;font-weight:700;cursor:pointer;">Publish Ad</button>
              </div>
            </form>
          </div>
        </div>
      `
      : "";

    const chatModalHtml = activeChatItem
      ? `
        <div class="az-st-overlay" id="az-chat-overlay">
          <div class="az-st-sheet">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div>
                <strong style="font-size:1.05rem;">${esc(activeChatItem.title)} • ${esc(formatEtb(activeChatItem.price_etb))}</strong>
                <span class="az-rt-pill" id="az-rt-badge">${realtimeStatus === "subscribed" ? "● Live Realtime" : `○ ${esc(realtimeStatus)}`}</span>
                <div style="font-size:0.8rem;color:#475569;">
                  Seller: <strong>${esc(activeChatItem.seller_name)}</strong>${activeChatItem.seller_phone ? ` • ${esc(activeChatItem.seller_phone)}` : ""}
                </div>
                ${
                  typeof activeChatItem.lat === "number" && typeof activeChatItem.lng === "number"
                    ? `<div style="font-size:0.78rem;margin-top:2px;"><a href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(activeChatItem.lat)}&mlon=${encodeURIComponent(activeChatItem.lng)}#map=16/${encodeURIComponent(activeChatItem.lat)}/${encodeURIComponent(activeChatItem.lng)}" target="_blank" rel="noopener">📍 Seller Live Location (${activeChatItem.lat}, ${activeChatItem.lng})</a></div>`
                    : ""
                }
              </div>
              <button type="button" id="az-close-chat" style="border:none;background:#f1f5f9;border-radius:999px;padding:6px 11px;cursor:pointer;font-weight:700;">✕</button>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;font-size:0.8rem;">
              <span>Chatting as:</span>
              <select id="az-chat-side" style="padding:5px 8px;border-radius:8px;">
                <option value="buyer" ${activeSide === "buyer" ? "selected" : ""}>Buyer</option>
                <option value="seller" ${activeSide === "seller" ? "selected" : ""}>Seller</option>
              </select>
              <input id="az-chat-thread-key" value="${esc(activeThreadKey)}" placeholder="Buyer ID / Phone" style="width:130px;padding:5px 8px;border-radius:8px;" />
              <button type="button" id="az-share-seller-live" style="padding:5px 9px;border-radius:8px;border:none;background:#1e3a8a;color:#fef3c7;font-weight:600;cursor:pointer;">Update Listing Live Pin</button>
            </div>

            <div class="az-st-chat-stream" id="az-chat-stream">
              ${
                chatMessages.length
                  ? chatMessages
                      .map(
                        (m) => `
                          <div class="az-st-bubble ${m.sender_side === "seller" ? "seller" : "buyer"}">
                            <div style="font-size:0.72rem;color:#475569;margin-bottom:2px;"><strong>${esc(m.sender_name)}</strong> (${esc(m.sender_side)}) • ${esc(timeAgo(m.created_at))}</div>
                            <div>${esc(m.body)}</div>
                            ${
                              typeof m.shared_lat === "number" && typeof m.shared_lng === "number"
                                ? `<div style="margin-top:4px;font-size:0.78rem;"><a href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(m.shared_lat)}&mlon=${encodeURIComponent(m.shared_lng)}#map=16/${encodeURIComponent(m.shared_lat)}/${encodeURIComponent(m.shared_lng)}" target="_blank" rel="noopener">📍 Live Location Pin (${m.shared_lat}, ${m.shared_lng})</a></div>`
                                : ""
                            }
                          </div>
                        `
                      )
                      .join("")
                  : `<div style="text-align:center;color:#64748b;font-size:0.84rem;padding:18px 6px;">Ask about price, condition, or share your live meetup pin below.</div>`
              }
            </div>

            <div style="display:flex;flex-direction:column;gap:7px;">
              <div style="display:flex;gap:6px;">
                <input id="az-chat-name" value="${esc(savedName)}" placeholder="Your name" style="width:36%;padding:8px 10px;border-radius:10px;" />
                <input id="az-chat-text" placeholder="Write a message..." style="flex:1;padding:8px 10px;border-radius:10px;" />
              </div>
              <div style="display:flex;gap:7px;">
                <button type="button" id="az-chat-send-pin" style="flex:1;padding:9px;border-radius:10px;border:1px solid #d97706;background:#fef3c7;color:#92400e;font-weight:700;cursor:pointer;">📍 Send Live Location</button>
                <button type="button" id="az-chat-send-btn" style="flex:1;padding:9px;border-radius:10px;border:none;background:#1e3a8a;color:#fef3c7;font-weight:700;cursor:pointer;">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      `
      : "";

    mount.innerHTML = `
      <div class="az-st-shell">
        <div class="az-st-topbar">
          <h2 class="az-st-h1">Store</h2>
          <div style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="az-st-live-cta" id="az-live-gps-btn">${liveWatchId !== null ? "🟢 Live GPS On" : "📍 Live GPS"}</button>
            <button type="button" class="az-st-post-cta" id="az-open-post-btn">+ Post Ad</button>
          </div>
        </div>

        ${statusBanner ? `<div class="az-st-banner">${esc(statusBanner)}</div>` : ""}

        <div class="az-st-search">
          <span>🔍</span>
          <input id="az-store-search" value="${esc(searchQuery)}" placeholder="What are you looking for?" />
        </div>

        <div class="az-st-cats">${catsHtml}</div>

        <h3 class="az-st-sub">Fresh recommendations</h3>
        <div class="az-st-grid">${cardsHtml}</div>
      </div>
      ${postModalHtml}
      ${chatModalHtml}
    `;

    bindUi(mount);
  }

  function bindUi(mount) {
    const searchEl = mount.querySelector("#az-store-search");
    if (searchEl) {
      searchEl.addEventListener("input", (e) => {
        searchQuery = e.target.value || "";
        render();
        const nextInput = document.getElementById("az-store-search");
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      });
    }

    mount.querySelectorAll("[data-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedCategory = btn.getAttribute("data-cat") || "All";
        render();
      });
    });

    mount.querySelectorAll("[data-fav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = String(btn.getAttribute("data-fav"));
        const favs = readJson(STORAGE_FAVS_KEY, []);
        const next = favs.includes(id) ? favs.filter((x) => x !== id) : favs.concat(id);
        writeJson(STORAGE_FAVS_KEY, next);
        render();
      });
    });

    mount.querySelectorAll("[data-contact]").forEach((btn) => {
      btn.addEventListener("click", () => {
        chatListingId = btn.getAttribute("data-contact");
        render();
      });
    });

    mount.querySelectorAll("[data-report]").forEach((btn) => {
      btn.addEventListener("click", () => {
        statusBanner = "Listing flagged for admin review.";
        render();
      });
    });

    const openPostBtn = mount.querySelector("#az-open-post-btn");
    if (openPostBtn) {
      openPostBtn.addEventListener("click", () => {
        postModalOpen = true;
        render();
      });
    }

    const closePostBtn = mount.querySelector("#az-close-post");
    if (closePostBtn) {
      closePostBtn.addEventListener("click", () => {
        postModalOpen = false;
        render();
      });
    }

    const liveBtn = mount.querySelector("#az-live-gps-btn");
    if (liveBtn) {
      liveBtn.addEventListener("click", () => {
        if (liveWatchId !== null) {
          navigator.geolocation.clearWatch(liveWatchId);
          liveWatchId = null;
          statusBanner = "Live GPS stopped.";
          render();
          return;
        }
        if (!navigator.geolocation) {
          statusBanner = "Geolocation not supported in this browser.";
          render();
          return;
        }
        statusBanner = "Acquiring live GPS...";
        liveWatchId = navigator.geolocation.watchPosition(
          async (pos) => {
            currentCoords = {
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy || 0)
            };
            statusBanner = `Live GPS active (${currentCoords.lat}, ${currentCoords.lng})`;
            if (chatListingId && activeSide === "seller") {
              await updateListingLocation(chatListingId, currentCoords, "Live GPS, Addis Ababa", true);
            }
            render();
          },
          (err) => {
            statusBanner = "GPS error: " + (err && err.message ? err.message : "Permission denied");
            render();
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
        );
        render();
      });
    }

    const photoFile = mount.querySelector("#az-post-photo-file");
    if (photoFile) {
      photoFile.addEventListener("change", () => {
        const file = photoFile.files && photoFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const urlInput = document.getElementById("az-post-image-url");
          if (urlInput && typeof reader.result === "string") {
            urlInput.value = reader.result;
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const pinGpsBtn = mount.querySelector("#az-post-pin-gps");
    if (pinGpsBtn) {
      pinGpsBtn.addEventListener("click", () => {
        statusBanner = "Reading GPS for listing...";
        grabGpsOnce(
          (coords) => {
            const latEl = document.getElementById("az-post-lat");
            const lngEl = document.getElementById("az-post-lng");
            if (latEl) latEl.value = String(coords.lat);
            if (lngEl) lngEl.value = String(coords.lng);
            statusBanner = `Live GPS attached (${coords.lat}, ${coords.lng})`;
            pinGpsBtn.textContent = "✓ Live GPS Attached";
          },
          (err) => {
            statusBanner = "Location error: " + err;
            render();
          }
        );
      });
    }

    const postForm = mount.querySelector("#az-afrotie-post-form");
    if (postForm) {
      postForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(postForm);
        const sellerName = String(fd.get("seller_name") || "").trim();
        const title = String(fd.get("title") || "").trim();
        if (!sellerName || !title) return;
        setUserName(sellerName);
        const rawLat = fd.get("lat");
        const rawLng = fd.get("lng");
        const lat = rawLat ? Number(rawLat) : null;
        const lng = rawLng ? Number(rawLng) : null;

        const res = await publishListing({
          category: String(fd.get("category") || "Traditional"),
          title,
          price_etb: Number(fd.get("price_etb") || 0),
          condition: String(fd.get("condition") || "Like New"),
          seller_name: sellerName,
          seller_phone: String(fd.get("seller_phone") || ""),
          location_label: String(fd.get("location_label") || "Addis Ababa"),
          image_url: String(fd.get("image_url") || ""),
          description: String(fd.get("description") || ""),
          lat: typeof lat === "number" && !isNaN(lat) ? lat : null,
          lng: typeof lng === "number" && !isNaN(lng) ? lng : null
        });

        postModalOpen = false;
        statusBanner = res.synced ? "Ad published live to Store." : "Ad published to Store.";
        await render();
      });
    }

    const closeChatBtn = mount.querySelector("#az-close-chat");
    if (closeChatBtn) {
      closeChatBtn.addEventListener("click", () => {
        cleanupRealtime();
        chatListingId = null;
        render();
      });
    }

    const sideSel = mount.querySelector("#az-chat-side");
    if (sideSel) {
      sideSel.addEventListener("change", () => {
        activeSide = sideSel.value === "seller" ? "seller" : "buyer";
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
            await updateListingLocation(chatListingId, coords, "Live Pin, Addis Ababa", true);
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
      const sender = ((nameEl && nameEl.value) || "").trim() || (activeSide === "seller" ? "Seller" : "Buyer");
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
  }

  window.AzmariShopChatLocation = { render: render, cleanupRealtime: cleanupRealtime };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => render());
  } else {
    render();
  }
})();
