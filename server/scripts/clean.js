/**
 * clean.js — wipe all data from every table, keeping the schema intact.
 * Usage: node scripts/clean.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createSchema } = require("../db/schema");
const { getDb }        = require("../db/database");

createSchema();
const db = getDb();

const tables = [
  "schedule",
  "feedback",
  "attendance",
  "grades",
  "semester_courses",
  "semesters",
  "student_profiles",
  "users",
];

for (const t of tables) {
  db.prepare(`DELETE FROM ${t}`).run();
  console.log(`  ✓ Cleared ${t}`);
}

console.log("\n🗑  Database cleaned — all rows deleted, schema kept.\n");
