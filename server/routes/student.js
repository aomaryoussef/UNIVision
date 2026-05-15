const express = require("express");
const { getDb } = require("../db/database");
const { requireAuth, requireSelf } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use("/:studentId", requireSelf);

router.get("/:studentId/profile", (req, res) => {
  const p = getDb().prepare("SELECT * FROM student_profiles WHERE student_id=?").get(req.params.studentId);
  if (!p) return res.status(404).json({ error: "Student not found" });
  res.json(p);
});

router.get("/:studentId/home", (req, res) => {
  const db  = getDb();
  const sid = req.params.studentId;
  const latest = db.prepare("SELECT * FROM semesters WHERE student_id=? ORDER BY semester_number DESC LIMIT 1").get(sid);
  const history = db.prepare("SELECT semester_number,label,gpa FROM semesters WHERE student_id=? ORDER BY semester_number ASC").all(sid);
  const att = db.prepare("SELECT SUM(attended) AS attended,SUM(total) AS total,ROUND(CAST(SUM(attended) AS REAL)/SUM(total)*100) AS percentage FROM attendance WHERE student_id=?").get(sid);

  // Top achievers in same grade
  const profile = db.prepare("SELECT grade FROM student_profiles WHERE student_id=?").get(sid);
  const grade = profile?.grade || 1;
  const topStudents = db.prepare(`
    SELECT sp.student_id, sp.name_en, sp.grade,
           (SELECT s.gpa FROM semesters s WHERE s.student_id = sp.student_id ORDER BY s.semester_number DESC LIMIT 1) AS gpa
    FROM student_profiles sp
    WHERE sp.grade = ?
    ORDER BY gpa DESC
    LIMIT 5
  `).all(grade).filter(s => s.gpa != null);

  // ── Performance Alerts ──────────────────────────────────────
  const alerts = [];

  // 1. GPA drop: compare last two semesters
  if (history.length >= 2) {
    const curr = history[history.length - 1].gpa;
    const prev = history[history.length - 2].gpa;
    const drop = prev - curr;
    if (drop >= 0.5) {
      alerts.push({ type: "danger", icon: "fa-arrow-trend-down", title: "Significant GPA Drop",
        message: `Your GPA dropped from ${prev.toFixed(2)} to ${curr.toFixed(2)} (−${drop.toFixed(2)}). Consider seeking academic support.` });
    } else if (drop > 0 && drop < 0.5) {
      alerts.push({ type: "warning", icon: "fa-arrow-trend-down", title: "GPA Slightly Decreased",
        message: `Your GPA went from ${prev.toFixed(2)} to ${curr.toFixed(2)} (−${drop.toFixed(2)}). Stay focused to recover.` });
    }
  }

  // 2. Low cumulative GPA
  const currentGPA = latest?.gpa ?? null;
  if (currentGPA != null && currentGPA < 2.0) {
    alerts.push({ type: "danger", icon: "fa-exclamation-triangle", title: "GPA Below 2.0 — Academic Probation Risk",
      message: `Your cumulative GPA is ${currentGPA.toFixed(2)}. You may be at risk of academic probation. Please consult your academic advisor.` });
  } else if (currentGPA != null && currentGPA < 2.5) {
    alerts.push({ type: "warning", icon: "fa-exclamation-circle", title: "Low GPA Warning",
      message: `Your cumulative GPA is ${currentGPA.toFixed(2)}. Consider improving your study habits to avoid further decline.` });
  }

  // 3. Overall attendance warning
  const attPct = att?.percentage ?? 100;
  if (attPct < 60) {
    alerts.push({ type: "danger", icon: "fa-calendar-xmark", title: "Critical Attendance — Fail Risk",
      message: `Your overall attendance is ${attPct}%. You are at serious risk of failing courses due to low attendance.` });
  } else if (attPct < 75) {
    alerts.push({ type: "warning", icon: "fa-calendar-minus", title: "Low Attendance Warning",
      message: `Your overall attendance is ${attPct}%. The minimum safe threshold is 75%. Try not to miss more classes.` });
  }

  // 4. Per-course attendance danger
  const courseAtt = db.prepare("SELECT course_name, percentage, status FROM attendance WHERE student_id=?").all(sid);
  const dangerCourses = courseAtt.filter(c => c.status === "danger" || c.percentage < 60);
  const warningCourses = courseAtt.filter(c => c.status === "warning" && c.percentage >= 60);
  if (dangerCourses.length) {
    alerts.push({ type: "danger", icon: "fa-user-clock", title: `Attendance Critical in ${dangerCourses.length} Course${dangerCourses.length > 1 ? 's' : ''}`,
      message: `Courses at risk: ${dangerCourses.map(c => `${c.course_name} (${c.percentage}%)`).join(", ")}. Attend all remaining classes.` });
  }
  if (warningCourses.length) {
    alerts.push({ type: "warning", icon: "fa-user-clock", title: `Attendance Warning in ${warningCourses.length} Course${warningCourses.length > 1 ? 's' : ''}`,
      message: `Watch out: ${warningCourses.map(c => `${c.course_name} (${c.percentage}%)`).join(", ")}.` });
  }

  // 5. Danger-flagged grades (courses the doctor flagged)
  const dangerGrades = db.prepare("SELECT course_name FROM grades WHERE student_id=? AND is_danger=1").all(sid);
  if (dangerGrades.length) {
    alerts.push({ type: "danger", icon: "fa-triangle-exclamation", title: `${dangerGrades.length} Course${dangerGrades.length > 1 ? 's' : ''} Flagged by Doctor`,
      message: `The following courses have been flagged: ${dangerGrades.map(g => g.course_name).join(", ")}. Check your grades and feedback.` });
  }

  // 6. Below class average GPA
  const peers = db.prepare("SELECT student_id FROM student_profiles WHERE grade=?").all(grade).map(p => p.student_id);
  if (currentGPA != null && peers.length > 1) {
    const allGPAs = peers.map(p => db.prepare("SELECT gpa FROM semesters WHERE student_id=? ORDER BY semester_number DESC LIMIT 1").get(p)?.gpa).filter(g => g != null);
    const classAvg = allGPAs.length ? allGPAs.reduce((a, b) => a + b, 0) / allGPAs.length : 0;
    if (currentGPA < classAvg - 0.3) {
      alerts.push({ type: "warning", icon: "fa-users", title: "Below Class Average",
        message: `Your GPA (${currentGPA.toFixed(2)}) is below the class average (${classAvg.toFixed(2)}). Check the Performance page to see detailed comparisons.` });
    }
  }

  res.json({ cumulativeGPA: currentGPA, attendance: att, gpaHistory: history, topStudents, grade, alerts,
    // ── Extra data for enhanced dashboard ──
    credits: latest?.credits ?? null,
    semesterCount: history.length,
    courseCount: courseAtt.length,
    dangerCourseCount: dangerGrades.length,
    gpaRank: (() => {
      if (currentGPA == null) return null;
      const allGPAs = peers.map(p => db.prepare("SELECT gpa FROM semesters WHERE student_id=? ORDER BY semester_number DESC LIMIT 1").get(p)?.gpa).filter(g => g != null);
      return { rank: allGPAs.filter(g => g > currentGPA).length + 1, total: allGPAs.length };
    })(),
    courseProgress: db.prepare("SELECT course_name, pre_final, max_pre_final, grade, is_danger FROM grades WHERE student_id=?").all(sid).map(g => ({
      course: g.course_name,
      preFinal: g.pre_final,
      maxPreFinal: g.max_pre_final,
      percentage: g.max_pre_final ? Math.round(g.pre_final / g.max_pre_final * 100) : 0,
      grade: g.grade,
      danger: !!g.is_danger,
    })),
    todaySchedule: (() => {
      const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const todayName = days[new Date().getDay()];
      return db.prepare("SELECT course_name, start_time, end_time, type, location AS room, doctor_name FROM schedule WHERE semester=? AND day=? ORDER BY start_time").all(grade, todayName);
    })(),
    recentFeedback: db.prepare("SELECT course_name, doctor_name, body, is_danger, created_at FROM feedback WHERE student_id=? ORDER BY created_at DESC LIMIT 3").all(sid),
    recentNotifications: db.prepare("SELECT title, body, category, created_at FROM notifications ORDER BY created_at DESC LIMIT 3").all(),
    upcomingExams: (() => {
      const today = new Date().toISOString().slice(0, 10);
      return db.prepare("SELECT * FROM exams WHERE semester=? AND exam_date>=? ORDER BY exam_date ASC LIMIT 5").all(grade, today);
    })(),
    recentActivity: db.prepare("SELECT action, detail, page, created_at FROM activity_log WHERE student_id=? ORDER BY created_at DESC LIMIT 8").all(sid),
  });
});

router.get("/:studentId/attendance", (req, res) => {
  const db  = getDb();
  const sid = req.params.studentId;
  const subjects = db.prepare("SELECT * FROM attendance WHERE student_id=?").all(sid);
  const overall  = db.prepare("SELECT SUM(attended) AS attended,SUM(total) AS total,ROUND(CAST(SUM(attended) AS REAL)/SUM(total)*100) AS percentage FROM attendance WHERE student_id=?").get(sid);
  res.json({ overall, subjects });
});

router.get("/:studentId/grades", (req, res) => {
  const db  = getDb();
  const sid = req.params.studentId;
  const rows = db.prepare("SELECT * FROM grades WHERE student_id=?").all(sid);
  const subjects = rows.map(r => {
    const staff = db.prepare("SELECT doctor_name,doctor_email,assistant_name,assistant_email FROM course_staff WHERE course_name=?").get(r.course_name);
    return {
      name: r.course_name, grade: r.grade, preFinal: r.pre_final, maxPreFinal: r.max_pre_final,
      breakdown: { attendance:[r.att_score,r.att_max], midterm:[r.midterm_score,r.midterm_max], quiz1:[r.quiz1_score,r.quiz1_max], quiz2:[r.quiz2_score,r.quiz2_max] },
      nextTarget: { label: r.next_target_label, need: r.next_target_need },
      danger: !!r.is_danger,
      staff: staff || null,
    };
  });
  const currentGPA = db.prepare("SELECT gpa FROM semesters WHERE student_id=? ORDER BY semester_number DESC LIMIT 1").get(sid)?.gpa ?? null;
  const feedback = db.prepare("SELECT course_name AS subject,doctor_name AS doctor,created_at,body AS text,is_danger AS danger FROM feedback WHERE student_id=? ORDER BY created_at DESC").all(sid).map(f => ({ ...f, danger: !!f.danger }));
  res.json({ currentGPA, subjects, feedback });
});

router.get("/:studentId/reports", (req, res) => {
  res.json(getDb().prepare("SELECT id,semester_number,label,gpa,attendance_pct,credits FROM semesters WHERE student_id=? ORDER BY semester_number DESC").all(req.params.studentId));
});

router.get("/:studentId/reports/:semesterNum", (req, res) => {
  const db  = getDb();
  const sid = req.params.studentId;
  const sem = db.prepare("SELECT * FROM semesters WHERE student_id=? AND semester_number=?").get(sid, Number(req.params.semesterNum));
  if (!sem) return res.status(404).json({ error: "Semester not found" });
  const courses = db.prepare("SELECT name,credits,grade,grade_points,progress FROM semester_courses WHERE semester_id=? AND student_id=?").all(sem.id, sid);
  res.json({ ...sem, courses });
});

router.get("/:studentId/schedule", (req, res) => {
  const db = getDb();
  const profile = db.prepare("SELECT grade FROM student_profiles WHERE student_id=?").get(req.params.studentId);
  const semester = profile?.grade || 1;
  res.json(db.prepare("SELECT * FROM schedule WHERE semester=? ORDER BY CASE day WHEN 'Sunday' THEN 0 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 END, start_time").all(semester));
});

// ── Performance Comparison ──────────────────────────────────
router.get("/:studentId/comparison", (req, res) => {
  const db  = getDb();
  const sid = req.params.studentId;
  const profile = db.prepare("SELECT grade, name_en FROM student_profiles WHERE student_id=?").get(sid);
  if (!profile) return res.status(404).json({ error: "Student not found" });
  const grade = profile.grade || 1;

  // All students in same grade
  const peers = db.prepare("SELECT student_id FROM student_profiles WHERE grade=?").all(grade).map(p => p.student_id);
  const peerCount = peers.length;

  // 1. GPA comparison — cumulative (latest semester)
  const myGPA = db.prepare("SELECT gpa FROM semesters WHERE student_id=? ORDER BY semester_number DESC LIMIT 1").get(sid)?.gpa ?? 0;
  const allGPAs = peers.map(p => db.prepare("SELECT gpa FROM semesters WHERE student_id=? ORDER BY semester_number DESC LIMIT 1").get(p)?.gpa ?? 0).filter(g => g > 0);
  const avgGPA = allGPAs.length ? +(allGPAs.reduce((a,b) => a+b, 0) / allGPAs.length).toFixed(2) : 0;
  const maxGPA = allGPAs.length ? Math.max(...allGPAs) : 0;
  const minGPA = allGPAs.length ? Math.min(...allGPAs) : 0;
  const gpaRank = allGPAs.filter(g => g > myGPA).length + 1;
  const gpaPercentile = peerCount > 1 ? Math.round((1 - (gpaRank - 1) / (peerCount - 1)) * 100) : 100;

  // 2. GPA trend — per semester: student vs class avg
  const mySemesters = db.prepare("SELECT semester_number, label, gpa FROM semesters WHERE student_id=? ORDER BY semester_number ASC").all(sid);
  const gpaTrend = mySemesters.map(s => {
    const peerGPAs = peers.map(p => db.prepare("SELECT gpa FROM semesters WHERE student_id=? AND semester_number=?").get(p, s.semester_number)?.gpa).filter(g => g != null);
    const classAvg = peerGPAs.length ? +(peerGPAs.reduce((a,b) => a+b, 0) / peerGPAs.length).toFixed(2) : 0;
    return { semester: s.label, semester_number: s.semester_number, myGPA: s.gpa, classAvg };
  });

  // 3. Attendance comparison
  const myAtt = db.prepare("SELECT ROUND(CAST(SUM(attended) AS REAL)/SUM(total)*100) AS pct FROM attendance WHERE student_id=?").get(sid)?.pct ?? 0;
  const allAtts = peers.map(p => db.prepare("SELECT ROUND(CAST(SUM(attended) AS REAL)/SUM(total)*100) AS pct FROM attendance WHERE student_id=?").get(p)?.pct ?? 0).filter(a => a > 0);
  const avgAtt = allAtts.length ? Math.round(allAtts.reduce((a,b) => a+b, 0) / allAtts.length) : 0;
  const attRank = allAtts.filter(a => a > myAtt).length + 1;

  // 4. Per-course score comparison (pre_final scores from grades table)
  const myGrades = db.prepare("SELECT course_name, pre_final, max_pre_final, att_score, att_max, midterm_score, midterm_max, quiz1_score, quiz1_max, quiz2_score, quiz2_max FROM grades WHERE student_id=?").all(sid);
  const courseComparison = myGrades.map(g => {
    const peerScores = peers.map(p => {
      const pg = db.prepare("SELECT pre_final, max_pre_final FROM grades WHERE student_id=? AND course_name=?").get(p, g.course_name);
      return pg ? (pg.pre_final / pg.max_pre_final * 100) : null;
    }).filter(s => s != null);
    const myPct = g.max_pre_final ? Math.round(g.pre_final / g.max_pre_final * 100) : 0;
    const classAvgPct = peerScores.length ? Math.round(peerScores.reduce((a,b) => a+b, 0) / peerScores.length) : 0;
    const maxPct = peerScores.length ? Math.round(Math.max(...peerScores)) : 0;
    const courseRank = peerScores.filter(s => s > myPct).length + 1;
    return {
      course: g.course_name,
      myScore: myPct,
      classAvg: classAvgPct,
      classMax: maxPct,
      rank: courseRank,
      totalStudents: peerScores.length,
    };
  });

  // 5. Per-course component breakdown comparison (avg per component)
  const componentComparison = myGrades.map(g => {
    const peerRows = peers.map(p => db.prepare("SELECT att_score, att_max, midterm_score, midterm_max, quiz1_score, quiz1_max, quiz2_score, quiz2_max FROM grades WHERE student_id=? AND course_name=?").get(p, g.course_name)).filter(Boolean);
    const avg = (arr, key, maxKey) => {
      const vals = arr.map(r => r[maxKey] > 0 ? r[key] / r[maxKey] * 100 : null).filter(v => v != null);
      return vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : 0;
    };
    return {
      course: g.course_name,
      attendance: { mine: g.att_max ? Math.round(g.att_score / g.att_max * 100) : 0, classAvg: avg(peerRows, "att_score", "att_max") },
      midterm:    { mine: g.midterm_max ? Math.round(g.midterm_score / g.midterm_max * 100) : 0, classAvg: avg(peerRows, "midterm_score", "midterm_max") },
      quiz1:      { mine: g.quiz1_max ? Math.round(g.quiz1_score / g.quiz1_max * 100) : 0, classAvg: avg(peerRows, "quiz1_score", "quiz1_max") },
      quiz2:      { mine: g.quiz2_max ? Math.round(g.quiz2_score / g.quiz2_max * 100) : 0, classAvg: avg(peerRows, "quiz2_score", "quiz2_max") },
    };
  });

  // 6. Grade distribution (letter grades across all peers for each course)
  const gradeDistribution = myGrades.map(g => {
    const allLetters = peers.map(p => db.prepare("SELECT grade FROM grades WHERE student_id=? AND course_name=?").get(p, g.course_name)?.grade).filter(Boolean);
    const dist = {};
    allLetters.forEach(l => { dist[l] = (dist[l] || 0) + 1; });
    const myLetterGrade = db.prepare("SELECT grade FROM grades WHERE student_id=? AND course_name=?").get(sid, g.course_name)?.grade;
    return { course: g.course_name, distribution: dist, myGrade: myLetterGrade };
  });

  res.json({
    studentName: profile.name_en,
    grade,
    peerCount,
    gpa:        { mine: myGPA, classAvg: avgGPA, classMax: maxGPA, classMin: minGPA, rank: gpaRank, percentile: gpaPercentile },
    gpaTrend,
    attendance: { mine: myAtt, classAvg: avgAtt, rank: attRank },
    courses:    courseComparison,
    components: componentComparison,
    gradeDistribution,
  });
});

// ── Notifications ──────────────────────────────────────────
router.get("/:studentId/notifications", (req, res) => {
  const db = getDb();
  const sid = req.params.studentId;
  const rows = db.prepare(`
    SELECT n.*, 
           CASE WHEN nr.student_id IS NOT NULL THEN 1 ELSE 0 END AS is_read
    FROM notifications n
    LEFT JOIN notification_reads nr
      ON nr.notification_id = n.id AND nr.student_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(sid);
  const unread = rows.filter(r => !r.is_read).length;
  res.json({ notifications: rows, unread });
});

router.post("/:studentId/notifications/:notifId/read", (req, res) => {
  const db = getDb();
  const sid = req.params.studentId;
  const nid = req.params.notifId;
  try {
    db.prepare(
      "INSERT OR IGNORE INTO notification_reads (notification_id, student_id) VALUES (?,?)"
    ).run(nid, sid);
  } catch {}
  res.json({ ok: true });
});

router.post("/:studentId/notifications/read-all", (req, res) => {
  const db = getDb();
  const sid = req.params.studentId;
  const notifs = db.prepare("SELECT id FROM notifications").all();
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO notification_reads (notification_id, student_id) VALUES (?,?)"
  );
  for (const n of notifs) stmt.run(n.id, sid);
  res.json({ ok: true });
});

// ── CV Data ─────────────────────────────────────────────────
router.get("/:studentId/cv", (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT data FROM cv_data WHERE student_id=?").get(req.params.studentId);
  res.json(row ? JSON.parse(row.data) : {});
});

router.put("/:studentId/cv", (req, res) => {
  const db = getDb();
  const sid = req.params.studentId;
  const json = JSON.stringify(req.body);
  db.prepare(
    "INSERT INTO cv_data (student_id, data, updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(student_id) DO UPDATE SET data=excluded.data, updated_at=datetime('now')"
  ).run(sid, json);
  res.json({ ok: true });
});

// ── Exams (upcoming) ────────────────────────────────────────
router.get("/:studentId/exams", (req, res) => {
  const db = getDb();
  const profile = db.prepare("SELECT grade FROM student_profiles WHERE student_id=?").get(req.params.studentId);
  const semester = profile?.grade || 1;
  const today = new Date().toISOString().slice(0, 10);
  const exams = db.prepare(
    "SELECT * FROM exams WHERE semester=? AND exam_date>=? ORDER BY exam_date ASC, start_time ASC"
  ).all(semester, today);
  res.json(exams);
});

// ── Course Materials ────────────────────────────────────────
router.get("/:studentId/materials", (req, res) => {
  const db = getDb();
  // Get courses for this student's current semester
  const profile = db.prepare("SELECT grade FROM student_profiles WHERE student_id=?").get(req.params.studentId);
  const semester = profile?.grade || 1;
  const courses = db.prepare("SELECT DISTINCT course_name FROM grades WHERE student_id=?").all(req.params.studentId).map(c => c.course_name);
  if (!courses.length) return res.json([]);
  const placeholders = courses.map(() => '?').join(',');
  const materials = db.prepare(
    `SELECT cm.*, u.name AS doctor_name FROM course_materials cm LEFT JOIN users u ON u.id=cm.doctor_id WHERE cm.course_name IN (${placeholders}) ORDER BY cm.created_at DESC`
  ).all(...courses);
  res.json(materials);
});

// ── Activity Log ────────────────────────────────────────────
router.get("/:studentId/activity", (req, res) => {
  const db = getDb();
  const logs = db.prepare("SELECT * FROM activity_log WHERE student_id=? ORDER BY created_at DESC LIMIT 30").all(req.params.studentId);
  res.json(logs);
});

router.post("/:studentId/activity", (req, res) => {
  const db = getDb();
  const { action, detail, page } = req.body;
  db.prepare("INSERT INTO activity_log (student_id, action, detail, page, created_at) VALUES (?,?,?,?,datetime('now'))")
    .run(req.params.studentId, action, detail || null, page || null);
  res.json({ ok: true });
});

module.exports = router;
