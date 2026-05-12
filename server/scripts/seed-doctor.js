/**
 * seed-doctor.js — add the doctor and admin accounts (idempotent).
 * Usage: node scripts/seed-doctor.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt           = require("bcryptjs");
const { createSchema } = require("../db/schema");
const { getDb }        = require("../db/database");

createSchema();
const db  = getDb();
const ins = db.prepare(
  "INSERT OR REPLACE INTO users (id,role,password,name,name_ar) VALUES (?,?,?,?,?)"
);

const accounts = [
  {
    id:      "29803050202394",
    role:    "doctor",
    name:    "Dr. Ahmed Salem",
    name_ar: "د. أحمد سالم",
    pass:    "123456",
  },
  {
    id:      "29803050202395",
    role:    "admin",
    name:    "System Admin",
    name_ar: null,
    pass:    "123456",
  },
  {
    id:      "admin1",
    role:    "admin",
    name:    "Admin",
    name_ar: null,
    pass:    "123456",
  },
];

for (const a of accounts) {
  const hashed = bcrypt.hashSync(a.pass, 10);
  ins.run(a.id, a.role, hashed, a.name, a.name_ar);
  console.log(`  ✓ ${a.role.padEnd(6)} ${a.id}  "${a.name}"  (password: ${a.pass})`);
}

console.log(`
╔══════════════════════════════════════════════════════╗
║  Role    │ ID              │ Password                ║
╠══════════════════════════════════════════════════════╣
║  Doctor  │ 29803050202394  │ 123456                  ║
║  Admin   │ 29803050202395  │ 123456                  ║
║  Admin   │ admin1          │ 123456                  ║
╚══════════════════════════════════════════════════════╝
`);
