// Azmari Bet service worker: offline support
const CACHE = "azmari-bet-v7";
const CORE = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
  "./images/logo.png", "./images/promo-1.jpg", "./images/promo-2.jpg", "./images/promo-3.jpg", "./images/promo-4.jpg", "./images/promo-5.jpg", "./images/promo-6.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === "navigate";
  // Pages: network first (always fresh), fall back to cache offline
  if (isPage) {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return r;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // Everything else (fonts, icons): cache first, then network and store
  if (url.protocol.startsWith("http")) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r && (r.ok || r.type === "opaque")) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => hit)));
  }
});
