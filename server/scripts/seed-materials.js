/**
 * seed-materials.js — seed course materials for all courses in the grades table.
 * Usage: node scripts/seed-materials.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createSchema } = require("../db/schema");
const { getDb }        = require("../db/database");

createSchema();
const db = getDb();

// Skip if already seeded
const existing = db.prepare("SELECT COUNT(*) AS cnt FROM course_materials").get();
if (existing.cnt > 0) {
  console.log("  ✓ Course materials already seeded — skipping");
  return;
}

// Get all unique courses from grades
const courses = db.prepare("SELECT DISTINCT course_name FROM grades ORDER BY course_name").all().map(r => r.course_name);
// Get first doctor ID
const doctor = db.prepare("SELECT id FROM users WHERE role='doctor' LIMIT 1").get();
const DID = doctor ? doctor.id : "29803050202394";

const materialTemplates = [
  { suffix: "Lecture Slides",       type: "pdf",      urlSuffix: "slides.pdf",      desc: "Comprehensive lecture slides covering all key topics" },
  { suffix: "Video Lectures",       type: "video",    urlSuffix: "video",           desc: "Recorded video lectures for revision" },
  { suffix: "Study Guide",          type: "document", urlSuffix: "study-guide.docx",desc: "Study guide with summaries and practice questions" },
  { suffix: "Reference Materials",  type: "link",     urlSuffix: "references",      desc: "Curated external resources and reading materials" },
  { suffix: "Practice Problems",    type: "pdf",      urlSuffix: "practice.pdf",    desc: "Practice problems with worked solutions" },
];

const ins = db.prepare(
  "INSERT INTO course_materials (course_name, doctor_id, title, type, url, description, created_at) VALUES (?,?,?,?,?,?,datetime('now',?))"
);

let count = 0;
const courseSafe = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

for (const course of courses) {
  // Each course gets 2-3 random materials
  const numMats = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const shuffled = [...materialTemplates].sort(() => Math.random() - 0.5).slice(0, numMats);

  for (let i = 0; i < shuffled.length; i++) {
    const t = shuffled[i];
    const daysAgo = `-${Math.floor(Math.random() * 20 + 1)} days`;
    ins.run(
      course,
      DID,
      `${course} — ${t.suffix}`,
      t.type,
      `https://example.com/${courseSafe(course)}/${t.urlSuffix}`,
      t.desc,
      daysAgo
    );
    count++;
  }
}

console.log(`  ✓ Seeded ${count} course materials across ${courses.length} courses`);
