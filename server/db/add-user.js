const bcrypt = require("bcryptjs");
const { createSchema } = require("./schema");
const { getDb } = require("./database");

createSchema();
const db  = getDb();
const pwd = bcrypt.hashSync("123456", 10);
const SID = "29803050202396";

db.prepare("INSERT OR IGNORE INTO users (id,role,password,name,name_ar) VALUES (?,?,?,?,?)")
  .run(SID, "student", pwd, "Abdelaziz Omar", "عبدالعزيز عمر");

db.prepare(`INSERT OR IGNORE INTO student_profiles
  (student_id,name_en,name_ar,national_id,university_email)
  VALUES (?,?,?,?,?)`)
  .run(SID, "Abdelaziz Omar", "عبدالعزيز عمر", SID, `${SID}@student.eelu.edu.eg`);

console.log(`✓ Student added: ${SID} / Abdelaziz Omar / password: 123456`);
