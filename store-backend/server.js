const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, "public", "uploads")),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname || ".jpg"))
});
const upload = multer({ storage });

const db = new sqlite3.Database(path.join(__dirname, "store_only.db"));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS store_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_name TEXT NOT NULL,
    seller_phone TEXT DEFAULT '',
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Traditional',
    price_etb REAL DEFAULT 0,
    negotiable INTEGER DEFAULT 1,
    condition TEXT DEFAULT 'Like New',
    description TEXT DEFAULT '',
    location_label TEXT DEFAULT 'Addis Ababa',
    lat REAL,
    lng REAL,
    live_location_active INTEGER DEFAULT 0,
    image_url TEXT DEFAULT '',
    approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS approved_sellers (
    seller_key TEXT PRIMARY KEY,
    seller_name TEXT NOT NULL,
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS store_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    thread_key TEXT DEFAULT 'buyer-1',
    sender_name TEXT NOT NULL,
    sender_side TEXT DEFAULT 'buyer',
    body TEXT NOT NULL,
    shared_lat REAL,
    shared_lng REAL,
    shared_label TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed 2 approved sample listings once
  db.get("SELECT COUNT(*) AS cnt FROM store_listings", (err, row) => {
    if (!err && row && row.cnt === 0) {
      db.run(`INSERT OR IGNORE INTO approved_sellers (seller_key, seller_name) VALUES ('dawit alemu', 'Dawit Alemu'), ('hana getachew', 'Hana Getachew')`);
      const stmt = db.prepare(`INSERT INTO store_listings
        (seller_name, seller_phone, title, category, price_etb, negotiable, condition, description, location_label, lat, lng, live_location_active, image_url, approved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);
      stmt.run(
        "Dawit Alemu",
        "+251 911 234567",
        "Electric keyboard",
        "Keyboards",
        18500,
        1,
        "Like New",
        "61-key touch-sensitive keyboard with stand and adapter.",
        "Bole, Addis Ababa",
        8.9806,
        38.7578,
        1,
        ""
      );
      stmt.run(
        "Hana Getachew",
        "+251 912 345678",
        "Digital piano",
        "Keyboards",
        42000,
        0,
        "New",
        "88-key weighted digital piano with sustain pedal.",
        "Kazanchis, Addis Ababa",
        9.0157,
        38.7654,
        1,
        ""
      );
      stmt.finalize();
    }
  });
});

const normKey = (name) => String(name || "").trim().toLowerCase();

app.get("/api/store/health", (_, res) => {
  res.json({ ok: true, service: "azmari-store-backend" });
});

// Get listings (approved for public; all when ?admin=true)
app.get("/api/store/listings", (req, res) => {
  const isAdmin = req.query.admin === "true";
  const sql = isAdmin
    ? "SELECT * FROM store_listings ORDER BY id DESC"
    : "SELECT * FROM store_listings WHERE approved = 1 ORDER BY id DESC";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Check if a user/seller is approved for unlimited posting
app.get("/api/store/sellers/status", (req, res) => {
  const key = normKey(req.query.name);
  if (!key) return res.json({ approved: false, unlimited: false });
  db.get("SELECT seller_name, approved_at FROM approved_sellers WHERE seller_key = ?", [key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ approved: Boolean(row), unlimited: Boolean(row), seller: row || null });
  });
});

// Admin approves/revokes a seller for unlimited posting
app.post("/api/store/sellers/approve", (req, res) => {
  const name = String(req.body.seller_name || "").trim();
  const approved = req.body.approved !== false;
  const key = normKey(name);
  if (!key) return res.status(400).json({ error: "seller_name is required" });

  if (approved) {
    db.run("INSERT OR REPLACE INTO approved_sellers (seller_key, seller_name) VALUES (?, ?)", [key, name], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      io.emit("store_updated");
      res.json({ seller_name: name, approved: true, unlimited: true });
    });
  } else {
    db.run("DELETE FROM approved_sellers WHERE seller_key = ?", [key], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      io.emit("store_updated");
      res.json({ seller_name: name, approved: false, unlimited: false });
    });
  }
});

// Post a new listing (approved automatically if seller is already admin-approved; otherwise pending)
app.post("/api/store/listings", upload.single("image"), (req, res) => {
  const b = req.body || {};
  const sellerName = String(b.seller_name || "").trim();
  const key = normKey(sellerName);
  if (!sellerName || !String(b.title || "").trim()) {
    return res.status(400).json({ error: "seller_name and title are required" });
  }

  db.get("SELECT seller_key FROM approved_sellers WHERE seller_key = ?", [key], (err, sellerRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const isApproved = sellerRow ? 1 : 0;
    const lat = b.lat !== undefined && b.lat !== "" ? Number(b.lat) : null;
    const lng = b.lng !== undefined && b.lng !== "" ? Number(b.lng) : null;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : String(b.image_url || "");

    db.run(
      `INSERT INTO store_listings
        (seller_name, seller_phone, title, category, price_etb, negotiable, condition, description, location_label, lat, lng, live_location_active, image_url, approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerName,
        String(b.seller_phone || "").trim(),
        String(b.title || "").trim(),
        String(b.category || "Traditional").trim(),
        Number(b.price_etb || 0),
        b.negotiable === false || b.negotiable === "false" ? 0 : 1,
        String(b.condition || "Like New").trim(),
        String(b.description || "").trim(),
        String(b.location_label || "Addis Ababa").trim(),
        Number.isFinite(lat) ? lat : null,
        Number.isFinite(lng) ? lng : null,
        Number.isFinite(lat) && Number.isFinite(lng) ? 1 : 0,
        imageUrl,
        isApproved
      ],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        db.get("SELECT * FROM store_listings WHERE id = ?", [this.lastID], (getErr, created) => {
          io.emit("store_updated");
          res.status(201).json({
            listing: created,
            approved: Boolean(isApproved),
            unlimited_unlocked: Boolean(isApproved)
          });
        });
      }
    );
  });
});

// Admin approves/rejects a listing (and approves seller for unlimited posts)
app.patch("/api/store/listings/:id/approve", (req, res) => {
  const approved = req.body.approved !== false ? 1 : 0;
  const id = req.params.id;

  db.get("SELECT * FROM store_listings WHERE id = ?", [id], (err, item) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!item) return res.status(404).json({ error: "Listing not found" });

    db.run("UPDATE store_listings SET approved = ? WHERE id = ?", [approved, id], (updErr) => {
      if (updErr) return res.status(500).json({ error: updErr.message });

      const finish = () => {
        io.emit("store_updated");
        res.json({ id: Number(id), approved: Boolean(approved), seller_name: item.seller_name });
      };

      if (approved === 1 && item.seller_name) {
        db.run(
          "INSERT OR REPLACE INTO approved_sellers (seller_key, seller_name) VALUES (?, ?)",
          [normKey(item.seller_name), item.seller_name],
          finish
        );
      } else {
        finish();
      }
    });
  });
});

// Update live location on a listing
app.patch("/api/store/listings/:id/location", (req, res) => {
  const { lat, lng, location_label, live_location_active } = req.body || {};
  db.run(
    `UPDATE store_listings
     SET lat = ?, lng = ?, location_label = COALESCE(?, location_label), live_location_active = ?
     WHERE id = ?`,
    [
      typeof lat === "number" ? lat : null,
      typeof lng === "number" ? lng : null,
      location_label || null,
      live_location_active === false ? 0 : 1,
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      io.emit("store_location_updated", { listing_id: Number(req.params.id), lat, lng, location_label });
      res.json({ updated: this.changes });
    }
  );
});

// Buyer <-> Seller messages
app.get("/api/store/messages/:listingId", (req, res) => {
  const threadKey = req.query.thread_key || "buyer-1";
  db.all(
    "SELECT * FROM store_messages WHERE listing_id = ? AND thread_key = ? ORDER BY id ASC",
    [req.params.listingId, threadKey],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

app.post("/api/store/messages", (req, res) => {
  const m = req.body || {};
  if (!m.listing_id || !String(m.body || "").trim()) {
    return res.status(400).json({ error: "listing_id and body are required" });
  }
  const threadKey = String(m.thread_key || "buyer-1");
  const senderSide = m.sender_side === "seller" ? "seller" : "buyer";
  const senderName = String(m.sender_name || (senderSide === "seller" ? "Seller" : "Buyer")).trim();

  db.run(
    `INSERT INTO store_messages (listing_id, thread_key, sender_name, sender_side, body, shared_lat, shared_lng, shared_label)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(m.listing_id),
      threadKey,
      senderName,
      senderSide,
      String(m.body).trim(),
      typeof m.shared_lat === "number" ? m.shared_lat : null,
      typeof m.shared_lng === "number" ? m.shared_lng : null,
      String(m.shared_label || "")
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT * FROM store_messages WHERE id = ?", [this.lastID], (_, saved) => {
        io.to(`listing_${m.listing_id}_${threadKey}`).emit("store_message", saved);
        res.status(201).json(saved);
      });
    }
  );
});

io.on("connection", (socket) => {
  socket.on("join_store_chat", ({ listing_id, thread_key }) => {
    if (!listing_id) return;
    socket.join(`listing_${listing_id}_${thread_key || "buyer-1"}`);
  });
});

const PORT = process.env.STORE_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Store-only backend running at http://localhost:${PORT}`);
});
