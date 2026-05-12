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

module.exports = router;
