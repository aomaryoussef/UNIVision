require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const { execSync } = require("child_process");

const { createSchema } = require("./db/schema");
const { getDb }        = require("./db/database");
const authRoutes    = require("./routes/auth");
const studentRoutes = require("./routes/student");
const doctorRoutes  = require("./routes/doctor");
const adminRoutes   = require("./routes/admin");

createSchema();

// Auto-seed if database is empty (first deploy)
try {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
  if (row.cnt === 0) {
    console.log("  Empty database detected — running seeds...");
    const scriptsDir = path.join(__dirname, "scripts");
    execSync(`node "${path.join(scriptsDir, "seed-doctor.js")}"`,  { stdio: "inherit" });
    execSync(`node "${path.join(scriptsDir, "seed-students.js")}"`, { stdio: "inherit" });
    execSync(`node "${path.join(scriptsDir, "seed-schedule.js")}"`, { stdio: "inherit" });
    execSync(`node "${path.join(scriptsDir, "seed-staff.js")}"`,    { stdio: "inherit" });
    console.log("  Seeding complete.\n");
  }
} catch (e) {
  console.error("  Auto-seed warning:", e.message);
}

const app      = express();
const PORT     = process.env.PORT || 3001;
const CLIENT   = path.join(__dirname, "../client");

app.use(express.json());

// ── API Routes ─────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/doctor",  doctorRoutes);
app.use("/api/admin",   adminRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// ── Cookie helper ──────────────────────────────────────────
function getCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v || "");
  }
  return null;
}

// ── Role-based page guards (before static) ─────────────────
const STUDENT_PAGES = ["/home.html", "/grades.html", "/attendance.html", "/reports.html", "/profile.html", "/schedule.html", "/comparison.html"];
const DOCTOR_PAGES  = ["/doctor.html"];

app.use((req, res, next) => {
  const role = getCookie(req, "uv_role");
  const page = req.path;

  if (!role && (STUDENT_PAGES.includes(page) || DOCTOR_PAGES.includes(page))) {
    return res.redirect("/login");
  }
  if ((role === "doctor" || role === "admin") && STUDENT_PAGES.includes(page)) {
    return res.redirect("/doctor.html");
  }
  if (role === "student" && DOCTOR_PAGES.includes(page)) {
    return res.redirect("/home.html");
  }

  next();
});

// ── Public pages ───────────────────────────────────────────
app.get("/", (_req, res) =>
  res.sendFile(path.join(CLIENT, "landing.html"))
);
app.get("/landing.html", (_req, res) => res.redirect(301, "/"));

app.get("/login", (_req, res) =>
  res.sendFile(path.join(CLIENT, "login.html"))
);

// ── Student pages ──────────────────────────────────────────
app.get("/home.html",       (_req, res) => res.sendFile(path.join(CLIENT, "pages/student/home.html")));
app.get("/grades.html",     (_req, res) => res.sendFile(path.join(CLIENT, "pages/student/grades.html")));
app.get("/attendance.html", (_req, res) => res.sendFile(path.join(CLIENT, "pages/student/attendance.html")));
app.get("/comparison.html", (_req, res) => res.sendFile(path.join(CLIENT, "pages/student/comparison.html")));
app.get("/reports.html",    (_req, res) => res.sendFile(path.join(CLIENT, "pages/student/reports.html")));
app.get("/schedule.html",   (_req, res) => res.sendFile(path.join(CLIENT, "pages/student/schedule.html")));
app.get("/profile.html",    (_req, res) => res.sendFile(path.join(CLIENT, "pages/student/profile.html")));

// ── Doctor / Admin page ────────────────────────────────────
app.get("/doctor.html",     (_req, res) => res.sendFile(path.join(CLIENT, "pages/doctor/dashboard.html")));

// ── Static assets ──────────────────────────────────────────
app.use(express.static(CLIENT));

// ── Fallback ───────────────────────────────────────────────
app.get("*", (_req, res) =>
  res.sendFile(path.join(CLIENT, "landing.html"))
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n  Univision  ->  http://localhost:${PORT}`);
  console.log(`  Doctor     ->  http://localhost:${PORT}/doctor.html\n`);
});
