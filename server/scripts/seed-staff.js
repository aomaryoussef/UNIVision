const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { getDb } = require("../db/database");
const { createSchema } = require("../db/schema");

createSchema();
const db = getDb();

// Pool of doctors and assistants
const DOCTORS = [
  { name: "Dr. Mohamed Hassan",    email: "m.hassan@eelu.edu.eg" },
  { name: "Dr. Sara Ahmed",        email: "s.ahmed@eelu.edu.eg" },
  { name: "Dr. Ahmed Nour",        email: "a.nour@eelu.edu.eg" },
  { name: "Dr. Layla Ibrahim",     email: "l.ibrahim@eelu.edu.eg" },
  { name: "Dr. Khaled Mostafa",    email: "k.mostafa@eelu.edu.eg" },
  { name: "Dr. Nadia Saleh",       email: "n.saleh@eelu.edu.eg" },
  { name: "Dr. Hossam El-Din",     email: "h.eldin@eelu.edu.eg" },
  { name: "Dr. Fatma Zahra",       email: "f.zahra@eelu.edu.eg" },
  { name: "Dr. Tarek Mansour",     email: "t.mansour@eelu.edu.eg" },
  { name: "Dr. Rania Abdel-Fattah", email: "r.abdelfattah@eelu.edu.eg" },
  { name: "Dr. Amr Helmy",         email: "a.helmy@eelu.edu.eg" },
  { name: "Dr. Mona Kamal",        email: "m.kamal@eelu.edu.eg" },
];

const ASSISTANTS = [
  { name: "Eng. Ali Mahmoud",       email: "ali.mahmoud@eelu.edu.eg" },
  { name: "Eng. Dina Youssef",      email: "dina.youssef@eelu.edu.eg" },
  { name: "Eng. Omar Fathy",        email: "omar.fathy@eelu.edu.eg" },
  { name: "Eng. Nourhan Saeed",     email: "nourhan.saeed@eelu.edu.eg" },
  { name: "Eng. Kareem Ashraf",     email: "kareem.ashraf@eelu.edu.eg" },
  { name: "Eng. Salma Hesham",      email: "salma.hesham@eelu.edu.eg" },
  { name: "Eng. Yasser Medhat",     email: "yasser.medhat@eelu.edu.eg" },
  { name: "Eng. Heba Adel",         email: "heba.adel@eelu.edu.eg" },
  { name: "Eng. Mahmoud Rizk",      email: "mahmoud.rizk@eelu.edu.eg" },
  { name: "Eng. Rana Tamer",        email: "rana.tamer@eelu.edu.eg" },
  { name: "Eng. Ahmed Gamal",       email: "ahmed.gamal@eelu.edu.eg" },
  { name: "Eng. Marwa Sayed",       email: "marwa.sayed@eelu.edu.eg" },
];

// Get all unique course names from grades table
const courses = db.prepare("SELECT DISTINCT course_name FROM grades ORDER BY course_name").all().map(r => r.course_name);

// Also get courses from schedule that may not be in grades yet
const scheduleCourses = db.prepare("SELECT DISTINCT course_name FROM schedule ORDER BY course_name").all().map(r => r.course_name);

// Also get courses from semester_courses
const semCourses = db.prepare("SELECT DISTINCT name FROM semester_courses ORDER BY name").all().map(r => r.name);

// Merge all unique course names
const allCourses = [...new Set([...courses, ...scheduleCourses, ...semCourses])].sort();

// Clear existing
db.prepare("DELETE FROM course_staff").run();

const stmt = db.prepare(
  "INSERT INTO course_staff (course_name, doctor_name, doctor_email, assistant_name, assistant_email) VALUES (?,?,?,?,?)"
);

let count = 0;
for (let i = 0; i < allCourses.length; i++) {
  const doc = DOCTORS[i % DOCTORS.length];
  const ast = ASSISTANTS[i % ASSISTANTS.length];
  stmt.run(allCourses[i], doc.name, doc.email, ast.name, ast.email);
  count++;
}

console.log(`✓ Seeded ${count} course staff assignments:`);
console.log("");
allCourses.forEach((c, i) => {
  const doc = DOCTORS[i % DOCTORS.length];
  const ast = ASSISTANTS[i % ASSISTANTS.length];
  console.log(`  ${c}`);
  console.log(`    Doctor:    ${doc.name} <${doc.email}>`);
  console.log(`    Assistant: ${ast.name} <${ast.email}>`);
});
