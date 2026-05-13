const express = require("express");
const bcrypt  = require("bcryptjs");
const { getDb } = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
});

router.post("/students", (req, res) => {
  const { id, name, name_ar, password, national_id, dob, birthplace,
          nationality, gender, religion, address, phone, email, grade } = req.body;

  if (!id || !name || !password) {
    return res.status(400).json({ error: "id, name and password are required" });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE id=?").get(id);
  if (existing) return res.status(409).json({ error: "Student ID already exists" });

  const hashed = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (id,role,password,name,name_ar) VALUES (?,?,?,?,?)")
    .run(id, "student", hashed, name, name_ar || null);

  db.prepare(`INSERT INTO student_profiles
    (student_id,name_en,name_ar,national_id,dob,birthplace,nationality,
     gender,religion,address,phone,email,university_email,grade)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, name, name_ar || null, national_id || null, dob || null,
         birthplace || null, nationality || null, gender || null,
         religion || null, address || null, phone || null,
         email || null, `${id}@student.eelu.edu.eg`,
         grade ? Number(grade) : 1);

  res.status(201).json({ ok: true, id });
});

// ── Notifications ──────────────────────────────────────────
router.get("/notifications", (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM notifications ORDER BY created_at DESC"
  ).all();
  res.json(rows);
});

router.post("/notifications", (req, res) => {
  const { category, title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body are required" });

  const validCats = ["day_off", "lecture_cancelled", "event", "holiday", "exam", "general"];
  const cat = validCats.includes(category) ? category : "general";

  const db = getDb();
  const adminUser = db.prepare("SELECT name FROM users WHERE id=?").get(req.user.id);
  const adminName = adminUser ? adminUser.name : "Admin";

  const result = db.prepare(
    "INSERT INTO notifications (admin_id, admin_name, category, title, body) VALUES (?,?,?,?,?)"
  ).run(req.user.id, adminName, cat, title, body);

  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

router.delete("/notifications/:id", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM notification_reads WHERE notification_id=?").run(req.params.id);
  const result = db.prepare("DELETE FROM notifications WHERE id=?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

module.exports = router;
