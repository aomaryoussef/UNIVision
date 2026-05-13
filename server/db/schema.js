const { getDb } = require("./database");

function createSchema() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id       TEXT PRIMARY KEY,
      role     TEXT NOT NULL CHECK(role IN ('student','doctor','admin')),
      password TEXT NOT NULL,
      name     TEXT NOT NULL,
      name_ar  TEXT
    );
    CREATE TABLE IF NOT EXISTS student_profiles (
      student_id       TEXT PRIMARY KEY REFERENCES users(id),
      name_en          TEXT NOT NULL,
      name_ar          TEXT,
      national_id      TEXT,
      dob              TEXT,
      birthplace       TEXT,
      nationality      TEXT,
      gender           TEXT,
      religion         TEXT,
      address          TEXT,
      phone            TEXT,
      email            TEXT,
      university_email TEXT,
      grade            INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS semesters (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id      TEXT    NOT NULL REFERENCES users(id),
      semester_number INTEGER NOT NULL,
      label           TEXT    NOT NULL,
      gpa             REAL    NOT NULL,
      attendance_pct  REAL    NOT NULL,
      credits         INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS semester_courses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      semester_id  INTEGER NOT NULL REFERENCES semesters(id),
      student_id   TEXT    NOT NULL REFERENCES users(id),
      name         TEXT    NOT NULL,
      credits      INTEGER NOT NULL,
      grade        TEXT    NOT NULL,
      grade_points REAL    NOT NULL,
      progress     INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS grades (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id        TEXT    NOT NULL REFERENCES users(id),
      course_name       TEXT    NOT NULL,
      grade             TEXT    NOT NULL,
      pre_final         INTEGER NOT NULL,
      max_pre_final     INTEGER NOT NULL,
      att_score         INTEGER NOT NULL,
      att_max           INTEGER NOT NULL,
      midterm_score     INTEGER NOT NULL,
      midterm_max       INTEGER NOT NULL,
      quiz1_score       INTEGER NOT NULL,
      quiz1_max         INTEGER NOT NULL,
      quiz2_score       INTEGER NOT NULL,
      quiz2_max         INTEGER NOT NULL,
      next_target_label TEXT,
      next_target_need  TEXT,
      is_danger         INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id  TEXT    NOT NULL REFERENCES users(id),
      course_name TEXT    NOT NULL,
      attended    INTEGER NOT NULL,
      total       INTEGER NOT NULL,
      percentage  INTEGER NOT NULL,
      status      TEXT    NOT NULL CHECK(status IN ('safe','warning','danger')),
      message     TEXT    NOT NULL
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id  TEXT    NOT NULL REFERENCES users(id),
      course_name TEXT    NOT NULL,
      doctor_name TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      body        TEXT    NOT NULL,
      is_danger   INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS schedule (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      semester    INTEGER NOT NULL,
      course_name TEXT    NOT NULL,
      day         TEXT    NOT NULL CHECK(day IN ('Sunday','Monday','Tuesday','Wednesday','Thursday')),
      start_time  TEXT    NOT NULL,
      end_time    TEXT    NOT NULL,
      location    TEXT,
      type        TEXT    NOT NULL DEFAULT 'Lecture' CHECK(type IN ('Lecture','Lab','Tutorial')),
      doctor_name TEXT
    );
    CREATE TABLE IF NOT EXISTS course_staff (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      course_name     TEXT    NOT NULL UNIQUE,
      doctor_name     TEXT    NOT NULL,
      doctor_email    TEXT    NOT NULL,
      assistant_name  TEXT,
      assistant_email TEXT
    );
    CREATE TABLE IF NOT EXISTS admin_feedback (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id  TEXT    NOT NULL REFERENCES users(id),
      doctor_id   TEXT    NOT NULL REFERENCES users(id),
      admin_id    TEXT    NOT NULL REFERENCES users(id),
      admin_name  TEXT    NOT NULL,
      course_name TEXT    NOT NULL,
      body        TEXT    NOT NULL,
      is_urgent   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id    TEXT    NOT NULL REFERENCES users(id),
      admin_name  TEXT    NOT NULL,
      category    TEXT    NOT NULL DEFAULT 'general' CHECK(category IN ('day_off','lecture_cancelled','event','holiday','exam','general')),
      title       TEXT    NOT NULL,
      body        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notification_reads (
      notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      student_id      TEXT    NOT NULL REFERENCES users(id),
      read_at         TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (notification_id, student_id)
    );
  `);
  // Migration: add grade column to existing databases
  try { db.exec("ALTER TABLE student_profiles ADD COLUMN grade INTEGER NOT NULL DEFAULT 1"); } catch {}
  // Migration: migrate schedule table from per-student to per-semester
  try {
    const hasStudentId = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='schedule'").get();
    if (hasStudentId && hasStudentId.sql.includes('student_id')) {
      db.exec("DROP TABLE schedule");
      db.exec(`CREATE TABLE schedule (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        semester    INTEGER NOT NULL,
        course_name TEXT    NOT NULL,
        day         TEXT    NOT NULL CHECK(day IN ('Sunday','Monday','Tuesday','Wednesday','Thursday')),
        start_time  TEXT    NOT NULL,
        end_time    TEXT    NOT NULL,
        location    TEXT,
        type        TEXT    NOT NULL DEFAULT 'Lecture' CHECK(type IN ('Lecture','Lab','Tutorial')),
        doctor_name TEXT
      )`);
      console.log("✓ Migrated schedule table to per-semester");
    }
  } catch {}
  // Migration: recreate admin_feedback if missing student_id
  try {
    const af = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='admin_feedback'").get();
    if (af && !af.sql.includes('student_id')) {
      db.exec("DROP TABLE admin_feedback");
      db.exec(`CREATE TABLE admin_feedback (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id  TEXT    NOT NULL REFERENCES users(id),
        doctor_id   TEXT    NOT NULL REFERENCES users(id),
        admin_id    TEXT    NOT NULL REFERENCES users(id),
        admin_name  TEXT    NOT NULL,
        course_name TEXT    NOT NULL,
        body        TEXT    NOT NULL,
        is_urgent   INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      )`);
      console.log("✓ Migrated admin_feedback table");
    }
  } catch {}
  console.log("✓ Schema ready");
}

module.exports = { createSchema };
