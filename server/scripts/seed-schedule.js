const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { getDb } = require("../db/database");
const { createSchema } = require("../db/schema");

createSchema();
const db = getDb();

// Schedule templates per semester
const SCHEDULES = {
  1: [
    { course_name: "Introduction to Business",   day: "Sunday",    start_time: "08:00", end_time: "10:00", location: "Hall A-101", type: "Lecture",   doctor_name: "Dr. Mohamed Hassan"  },
    { course_name: "Introduction to Business",   day: "Wednesday", start_time: "10:00", end_time: "11:00", location: "Lab B-204",  type: "Tutorial",  doctor_name: "Dr. Mohamed Hassan"  },
    { course_name: "Principles of Economics",    day: "Sunday",    start_time: "10:00", end_time: "12:00", location: "Hall A-102", type: "Lecture",   doctor_name: "Dr. Sara Ahmed"      },
    { course_name: "Principles of Economics",    day: "Tuesday",   start_time: "09:00", end_time: "10:00", location: "Hall A-102", type: "Tutorial",  doctor_name: "Dr. Sara Ahmed"      },
    { course_name: "Mathematics for Business",   day: "Monday",    start_time: "08:00", end_time: "10:00", location: "Hall C-205", type: "Lecture",   doctor_name: "Dr. Ahmed Nour"      },
    { course_name: "Mathematics for Business",   day: "Thursday",  start_time: "11:00", end_time: "12:00", location: "Lab C-101",  type: "Lab",       doctor_name: "Dr. Ahmed Nour"      },
    { course_name: "English Language I",         day: "Monday",    start_time: "12:00", end_time: "14:00", location: "Hall B-301", type: "Lecture",   doctor_name: "Dr. Layla Ibrahim"   },
    { course_name: "Computer Skills",            day: "Tuesday",   start_time: "10:00", end_time: "12:00", location: "Lab A-103",  type: "Lab",       doctor_name: "Dr. Khaled Mostafa"  },
    { course_name: "Introduction to Law",        day: "Thursday",  start_time: "08:00", end_time: "10:00", location: "Hall D-401", type: "Lecture",   doctor_name: "Dr. Nadia Saleh"     },
  ],
  2: [
    { course_name: "Human Resources Management", day: "Sunday",    start_time: "08:00", end_time: "10:00", location: "Hall A-101", type: "Lecture",   doctor_name: "Dr. Mohamed Hassan"  },
    { course_name: "Human Resources Management", day: "Wednesday", start_time: "10:00", end_time: "11:00", location: "Lab B-204",  type: "Tutorial",  doctor_name: "Dr. Mohamed Hassan"  },
    { course_name: "Marketing Principles",       day: "Sunday",    start_time: "10:00", end_time: "12:00", location: "Hall A-102", type: "Lecture",   doctor_name: "Dr. Sara Ahmed"      },
    { course_name: "Marketing Principles",       day: "Tuesday",   start_time: "09:00", end_time: "10:00", location: "Hall A-102", type: "Tutorial",  doctor_name: "Dr. Sara Ahmed"      },
    { course_name: "Business Statistics",        day: "Monday",    start_time: "08:00", end_time: "10:00", location: "Hall C-205", type: "Lecture",   doctor_name: "Dr. Ahmed Nour"      },
    { course_name: "Business Statistics",        day: "Thursday",  start_time: "11:00", end_time: "12:00", location: "Lab C-101",  type: "Lab",       doctor_name: "Dr. Ahmed Nour"      },
    { course_name: "Organizational Behavior",    day: "Monday",    start_time: "12:00", end_time: "14:00", location: "Hall B-301", type: "Lecture",   doctor_name: "Dr. Layla Ibrahim"   },
    { course_name: "Financial Accounting",       day: "Tuesday",   start_time: "10:00", end_time: "12:00", location: "Hall A-201", type: "Lecture",   doctor_name: "Dr. Khaled Mostafa"  },
    { course_name: "Financial Accounting",       day: "Wednesday", start_time: "08:00", end_time: "09:00", location: "Lab A-103",  type: "Lab",       doctor_name: "Dr. Khaled Mostafa"  },
    { course_name: "Economics",                  day: "Thursday",  start_time: "08:00", end_time: "10:00", location: "Hall D-401", type: "Lecture",   doctor_name: "Dr. Nadia Saleh"     },
  ],
  3: [
    { course_name: "Strategic Management",       day: "Sunday",    start_time: "08:00", end_time: "10:00", location: "Hall A-201", type: "Lecture",   doctor_name: "Dr. Mohamed Hassan"  },
    { course_name: "Operations Management",      day: "Monday",    start_time: "10:00", end_time: "12:00", location: "Hall B-102", type: "Lecture",   doctor_name: "Dr. Sara Ahmed"      },
    { course_name: "Business Law",               day: "Tuesday",   start_time: "08:00", end_time: "10:00", location: "Hall C-301", type: "Lecture",   doctor_name: "Dr. Nadia Saleh"     },
    { course_name: "Cost Accounting",            day: "Wednesday", start_time: "10:00", end_time: "12:00", location: "Hall A-103", type: "Lecture",   doctor_name: "Dr. Khaled Mostafa"  },
    { course_name: "Cost Accounting",            day: "Thursday",  start_time: "08:00", end_time: "09:30", location: "Lab A-103",  type: "Lab",       doctor_name: "Dr. Khaled Mostafa"  },
    { course_name: "Research Methods",           day: "Sunday",    start_time: "12:00", end_time: "14:00", location: "Hall D-201", type: "Lecture",   doctor_name: "Dr. Ahmed Nour"      },
  ],
  4: [
    { course_name: "International Business",     day: "Sunday",    start_time: "10:00", end_time: "12:00", location: "Hall A-301", type: "Lecture",   doctor_name: "Dr. Layla Ibrahim"   },
    { course_name: "Project Management",         day: "Monday",    start_time: "08:00", end_time: "10:00", location: "Hall B-201", type: "Lecture",   doctor_name: "Dr. Mohamed Hassan"  },
    { course_name: "E-Commerce",                 day: "Tuesday",   start_time: "10:00", end_time: "12:00", location: "Lab B-101",  type: "Lab",       doctor_name: "Dr. Ahmed Nour"      },
    { course_name: "Managerial Accounting",      day: "Wednesday", start_time: "08:00", end_time: "10:00", location: "Hall C-205", type: "Lecture",   doctor_name: "Dr. Khaled Mostafa"  },
    { course_name: "Entrepreneurship",           day: "Thursday",  start_time: "10:00", end_time: "12:00", location: "Hall D-401", type: "Lecture",   doctor_name: "Dr. Sara Ahmed"      },
  ],
};

// Clear existing schedule
db.prepare("DELETE FROM schedule").run();

const stmt = db.prepare(
  "INSERT INTO schedule (semester,course_name,day,start_time,end_time,location,type,doctor_name) VALUES (?,?,?,?,?,?,?,?)"
);

let total = 0;
for (const [semester, entries] of Object.entries(SCHEDULES)) {
  for (const s of entries) {
    stmt.run(Number(semester), s.course_name, s.day, s.start_time, s.end_time, s.location, s.type, s.doctor_name);
    total++;
  }
}

console.log(`✓ Seeded ${total} schedule entries across ${Object.keys(SCHEDULES).length} semesters`);
