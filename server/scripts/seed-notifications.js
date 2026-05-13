/**
 * seed-notifications.js — add sample notifications (idempotent).
 * Usage: node scripts/seed-notifications.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createSchema } = require("../db/schema");
const { getDb }        = require("../db/database");

createSchema();
const db = getDb();

// Skip if notifications already exist
const count = db.prepare("SELECT COUNT(*) as cnt FROM notifications").get();
if (count.cnt > 0) {
  console.log(`  ✓ Notifications already seeded (${count.cnt} found)`);
  process.exit(0);
}

const admin = db.prepare("SELECT id, name FROM users WHERE role='admin' LIMIT 1").get();
if (!admin) {
  console.log("  ⚠ No admin user found — run seed-doctor.js first");
  process.exit(1);
}

const notifications = [
  { category: "holiday",            title: "Eid Al-Adha Holiday",                 body: "The university will be closed from June 15 to June 20 for Eid Al-Adha. Classes resume on June 21. Enjoy the break!" },
  { category: "day_off",            title: "Campus Closed — Thursday June 12",    body: "Due to scheduled maintenance, the campus will be closed on Thursday June 12. All lectures are cancelled for the day. Online office hours will still be available." },
  { category: "lecture_cancelled",  title: "Computer Networks Lecture Cancelled",  body: "Dr. Ahmed's Computer Networks lecture scheduled for Wednesday has been cancelled. A make-up session will be announced later this week." },
  { category: "event",             title: "Annual Tech Fair 2025",                body: "Join us for the Annual Tech Fair on June 25 in the Main Hall! Student projects, guest speakers, and prizes. Registration is open now." },
  { category: "exam",              title: "Midterm Schedule Published",            body: "The midterm exam schedule for Spring 2025 has been published. Please check the Schedule page for your exam dates and locations. Good luck!" },
  { category: "general",           title: "Library Extended Hours",                body: "The university library will have extended hours (8 AM - 12 AM) during the exam period from June 10 to June 30 to support your study needs." },
  { category: "lecture_cancelled",  title: "Operating Systems Lab Rescheduled",    body: "The Operating Systems lab originally scheduled for Monday has been moved to Tuesday same time, same location. Please update your calendars." },
  { category: "event",             title: "Career Day — Meet Top Companies",       body: "Career Day is happening on June 28! Companies like Microsoft, Google, and Vodafone will be on campus for recruitment. Bring your CV and dress professionally." },
];

const stmt = db.prepare(
  "INSERT INTO notifications (admin_id, admin_name, category, title, body, created_at) VALUES (?,?,?,?,?,?)"
);

const now = Date.now();
notifications.forEach((n, i) => {
  const date = new Date(now - i * 3600000 * 6); // 6 hours apart
  stmt.run(admin.id, admin.name, n.category, n.title, n.body,
    date.toISOString().replace("T", " ").slice(0, 19));
});

console.log(`  ✓ Seeded ${notifications.length} sample notifications`);
