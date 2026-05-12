const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { getDb } = require("../db/database");

const router = express.Router();

router.post("/login", (req, res) => {
  const { role, id, password } = req.body;
  if (!role || !id || !password) return res.status(400).json({ error: "role, id and password are required" });
  if (!["student","doctor","admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const user = getDb().prepare("SELECT * FROM users WHERE id=? AND role=?").get(id, role);
  if (!user) return res.status(401).json({ error: "ID not found." });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Wrong password." });

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "8h" });

  // Set a cookie so the server can guard HTML page access by role
  const cookieOpts = { httpOnly: false, maxAge: 8 * 60 * 60 * 1000, path: "/" };
  res.cookie("uv_role", user.role, cookieOpts);

  res.json({ token, user: { id: user.id, role: user.role, name: user.name, nameAr: user.name_ar } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("uv_role", { path: "/" });
  res.json({ ok: true });
});

module.exports = router;
