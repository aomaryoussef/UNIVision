const express = require("express");
const { getDb } = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.user.role !== "doctor" && req.user.role !== "admin") return res.status(403).json({ error: "Doctor access required" });
  next();
});

// Students
router.get("/students", (_req, res) => {
  res.json(getDb().prepare(`
    SELECT u.id,u.name,u.name_ar,sp.name_en,sp.university_email,sp.grade,
           (SELECT gpa FROM semesters WHERE student_id=u.id ORDER BY semester_number DESC LIMIT 1) AS gpa
    FROM users u LEFT JOIN student_profiles sp ON sp.student_id=u.id
    WHERE u.role='student' ORDER BY sp.grade ASC, u.name`).all());
});

router.get("/student/:id", (req, res) => {
  const db = getDb(); const sid = req.params.id;
  const profile = db.prepare("SELECT * FROM student_profiles WHERE student_id=?").get(sid);
  if (!profile) return res.status(404).json({ error: "Student not found" });
  const gpa = db.prepare("SELECT gpa FROM semesters WHERE student_id=? ORDER BY semester_number DESC LIMIT 1").get(sid)?.gpa ?? null;
  const att = db.prepare("SELECT SUM(attended) AS attended,SUM(total) AS total,ROUND(CAST(SUM(attended) AS REAL)/SUM(total)*100) AS percentage FROM attendance WHERE student_id=?").get(sid);
  res.json({ profile, gpa, attendance: att });
});

// Semesters (history)
router.get("/student/:id/semesters", (req, res) => {
  const db = getDb(); const sid = req.params.id;
  const sems = db.prepare("SELECT * FROM semesters WHERE student_id=? ORDER BY semester_number DESC").all(sid);
  res.json(sems.map(sem => ({
    ...sem,
    courses: db.prepare("SELECT * FROM semester_courses WHERE semester_id=? ORDER BY name").all(sem.id)
  })));
});

// Grades
router.get("/student/:id/grades", (req, res) => res.json(getDb().prepare("SELECT * FROM grades WHERE student_id=?").all(req.params.id)));

router.post("/student/:id/grades", (req, res) => {
  const db = getDb(); const sid = req.params.id;
  const { course_name,grade,att_score,att_max,midterm_score,midterm_max,quiz1_score,quiz1_max,quiz2_score,quiz2_max,next_target_label,next_target_need,is_danger } = req.body;
  const pre_final = att_score + midterm_score + quiz1_score + quiz2_score;
  const max_pre_final = att_max + midterm_max + quiz1_max + quiz2_max;
  const existing = db.prepare("SELECT id FROM grades WHERE student_id=? AND course_name=?").get(sid, course_name);
  if (existing) {
    db.prepare(`UPDATE grades SET grade=?,pre_final=?,max_pre_final=?,att_score=?,att_max=?,midterm_score=?,midterm_max=?,quiz1_score=?,quiz1_max=?,quiz2_score=?,quiz2_max=?,next_target_label=?,next_target_need=?,is_danger=? WHERE id=?`)
      .run(grade,pre_final,max_pre_final,att_score,att_max,midterm_score,midterm_max,quiz1_score,quiz1_max,quiz2_score,quiz2_max,next_target_label,next_target_need,is_danger?1:0,existing.id);
    return res.json({ ok:true, id:existing.id, action:"updated" });
  }
  const r = db.prepare(`INSERT INTO grades (student_id,course_name,grade,pre_final,max_pre_final,att_score,att_max,midterm_score,midterm_max,quiz1_score,quiz1_max,quiz2_score,quiz2_max,next_target_label,next_target_need,is_danger) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(sid,course_name,grade,pre_final,max_pre_final,att_score,att_max,midterm_score,midterm_max,quiz1_score,quiz1_max,quiz2_score,quiz2_max,next_target_label,next_target_need,is_danger?1:0);
  res.status(201).json({ ok:true, id:r.lastInsertRowid, action:"created" });
});

router.delete("/grade/:id", (req, res) => { getDb().prepare("DELETE FROM grades WHERE id=?").run(req.params.id); res.json({ ok:true }); });

// Attendance
router.get("/student/:id/attendance", (req, res) => res.json(getDb().prepare("SELECT * FROM attendance WHERE student_id=?").all(req.params.id)));

router.post("/student/:id/attendance", (req, res) => {
  const db = getDb(); const sid = req.params.id;
  const { course_name, attended, total } = req.body;
  const percentage = Math.round((attended / total) * 100);
  const canMiss    = Math.floor(total * 0.25) - (total - attended);
  const status     = percentage >= 75 ? "safe" : percentage >= 60 ? "warning" : "danger";
  const message    = status === "safe" ? `Safe: You can miss ${Math.max(0,canMiss)} more.` : status === "warning" ? "Careful: Attendance is dropping." : "Warning: Risk of DN.";
  const existing = db.prepare("SELECT id FROM attendance WHERE student_id=? AND course_name=?").get(sid, course_name);
  if (existing) {
    db.prepare("UPDATE attendance SET attended=?,total=?,percentage=?,status=?,message=? WHERE id=?").run(attended,total,percentage,status,message,existing.id);
    return res.json({ ok:true, id:existing.id, action:"updated" });
  }
  const r = db.prepare("INSERT INTO attendance (student_id,course_name,attended,total,percentage,status,message) VALUES (?,?,?,?,?,?,?)").run(sid,course_name,attended,total,percentage,status,message);
  res.status(201).json({ ok:true, id:r.lastInsertRowid, action:"created" });
});

router.delete("/attendance/:id", (req, res) => { getDb().prepare("DELETE FROM attendance WHERE id=?").run(req.params.id); res.json({ ok:true }); });

// Feedback
router.get("/student/:id/feedback", (req, res) => res.json(getDb().prepare("SELECT * FROM feedback WHERE student_id=? ORDER BY created_at DESC").all(req.params.id)));

router.post("/student/:id/feedback", (req, res) => {
  const { course_name, body, is_danger } = req.body;
  const created_at = new Date().toISOString().replace("T"," ").slice(0,19);
  const r = getDb().prepare("INSERT INTO feedback (student_id,course_name,doctor_name,created_at,body,is_danger) VALUES (?,?,?,?,?,?)").run(req.params.id,course_name,req.user.name,created_at,body,is_danger?1:0);
  res.status(201).json({ ok:true, id:r.lastInsertRowid });
});

router.put("/feedback/:id", (req, res) => {
  const { course_name, body, is_danger } = req.body;
  getDb().prepare("UPDATE feedback SET course_name=?,body=?,is_danger=? WHERE id=?")
    .run(course_name, body, is_danger ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete("/feedback/:id", (req, res) => { getDb().prepare("DELETE FROM feedback WHERE id=?").run(req.params.id); res.json({ ok:true }); });

// Schedule (per semester)
router.get("/schedule/:semester", (req, res) => {
  res.json(getDb().prepare("SELECT * FROM schedule WHERE semester=? ORDER BY CASE day WHEN 'Sunday' THEN 0 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 END, start_time").all(Number(req.params.semester)));
});

router.post("/schedule/:semester", (req, res) => {
  const { course_name, day, start_time, end_time, location, type, doctor_name } = req.body;
  if (!course_name || !day || !start_time || !end_time) return res.status(400).json({ error: "course_name, day, start_time, end_time are required" });
  const r = getDb().prepare("INSERT INTO schedule (semester,course_name,day,start_time,end_time,location,type,doctor_name) VALUES (?,?,?,?,?,?,?,?)")
    .run(Number(req.params.semester), course_name, day, start_time, end_time, location || null, type || "Lecture", doctor_name || null);
  res.status(201).json({ ok: true, id: r.lastInsertRowid });
});

router.put("/schedule-entry/:id", (req, res) => {
  const { course_name, day, start_time, end_time, location, type, doctor_name } = req.body;
  getDb().prepare("UPDATE schedule SET course_name=?,day=?,start_time=?,end_time=?,location=?,type=?,doctor_name=? WHERE id=?")
    .run(course_name, day, start_time, end_time, location || null, type || "Lecture", doctor_name || null, req.params.id);
  res.json({ ok: true });
});

router.delete("/schedule-entry/:id", (req, res) => { getDb().prepare("DELETE FROM schedule WHERE id=?").run(req.params.id); res.json({ ok: true }); });

// Admin Feedback (admin → doctor, private, per student)
// Admin: send feedback about a student to the doctor
router.post("/student/:id/admin-feedback", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { course_name, body, is_urgent, doctor_id } = req.body;
  if (!course_name || !body) return res.status(400).json({ error: "course_name and body are required" });
  // Find the doctor to send to (use provided doctor_id or default to first doctor)
  const db = getDb();
  const targetDoctor = doctor_id || db.prepare("SELECT id FROM users WHERE role='doctor' LIMIT 1").get()?.id;
  if (!targetDoctor) return res.status(400).json({ error: "No doctor found" });
  const created_at = new Date().toISOString().replace("T"," ").slice(0,19);
  const r = db.prepare("INSERT INTO admin_feedback (student_id,doctor_id,admin_id,admin_name,course_name,body,is_urgent,created_at) VALUES (?,?,?,?,?,?,?,?)")
    .run(req.params.id, targetDoctor, req.user.id, req.user.name, course_name, body, is_urgent ? 1 : 0, created_at);
  res.status(201).json({ ok: true, id: r.lastInsertRowid });
});

// Get admin feedback for a student (admin sees their own, doctor sees feedback sent to them)
router.get("/student/:id/admin-feedback", (req, res) => {
  const db = getDb();
  if (req.user.role === "admin") {
    res.json(db.prepare("SELECT * FROM admin_feedback WHERE student_id=? ORDER BY created_at DESC").all(req.params.id));
  } else if (req.user.role === "doctor") {
    res.json(db.prepare("SELECT * FROM admin_feedback WHERE student_id=? AND doctor_id=? ORDER BY created_at DESC").all(req.params.id, req.user.id));
  } else {
    res.status(403).json({ error: "Access denied" });
  }
});

// Admin: update admin feedback
router.put("/admin-feedback/:id", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { course_name, body, is_urgent } = req.body;
  getDb().prepare("UPDATE admin_feedback SET course_name=?,body=?,is_urgent=? WHERE id=?")
    .run(course_name, body, is_urgent ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// Admin: delete admin feedback
router.delete("/admin-feedback/:id", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  getDb().prepare("DELETE FROM admin_feedback WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
