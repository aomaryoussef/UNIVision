const bcrypt = require("bcryptjs");
const { createSchema } = require("./schema");
const { getDb } = require("./database");

function seed() {
  createSchema();
  const db  = getDb();
  const pwd = bcrypt.hashSync("123456", 10);

  const SID = "29803050202393";
  const DID = "29803050202394";
  const AID = "29803050202395";

  // Users
  const ins = db.prepare("INSERT OR IGNORE INTO users (id,role,password,name,name_ar) VALUES (?,?,?,?,?)");
  ins.run(SID, "student", pwd, "Muhammed Ahmed", "محمد أحمد");
  ins.run(DID, "doctor",  pwd, "Dr. Ahmed Salem", null);
  ins.run(AID, "admin",   pwd, "System Admin", null);
  console.log("✓ Users seeded");

  // Profile
  db.prepare(`INSERT OR IGNORE INTO student_profiles
    (student_id,name_en,name_ar,national_id,dob,birthplace,nationality,
     gender,religion,address,phone,email,university_email)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(SID,"Mohamed Ahmed","محمد أحمد",SID,"1988-08-05","الاسكندريه","مصر",
         "ذكر","مسلم","4 ش ممم من ممم الاسكندرية","01278888854",
         "mo88887@gmail.com",`${SID}@student.eelu.edu.eg`);
  console.log("✓ Profile seeded");

  // Semesters
  const insSem = db.prepare(
    "INSERT OR IGNORE INTO semesters (student_id,semester_number,label,gpa,attendance_pct,credits) VALUES (?,?,?,?,?,?)"
  );
  const sems = [
    {n:1,l:"Semester 1 — Fall 2023",  gpa:2.80,att:85,cr:15},
    {n:2,l:"Semester 2 — Spring 2024",gpa:3.00,att:89,cr:15},
    {n:3,l:"Semester 3 — Fall 2024",  gpa:3.20,att:92,cr:18},
    {n:4,l:"Semester 4 — Spring 2026",gpa:3.11,att:87,cr:15},
  ];
  for (const s of sems) insSem.run(SID, s.n, s.l, s.gpa, s.att, s.cr);
  console.log("✓ Semesters seeded");

  // Semester courses
  const getSem = (n) => db.prepare("SELECT id FROM semesters WHERE student_id=? AND semester_number=?").get(SID,n).id;
  const insCourse = db.prepare(
    "INSERT OR IGNORE INTO semester_courses (semester_id,student_id,name,credits,grade,grade_points,progress) VALUES (?,?,?,?,?,?,?)"
  );
  const allCourses = {
    1:[{n:"Calculus I",cr:3,g:"B",p:3.0,pr:74},{n:"Introduction to CS",cr:3,g:"B+",p:3.3,pr:84},
       {n:"Logic Design",cr:3,g:"C+",p:2.3,pr:60},{n:"English I",cr:3,g:"A-",p:3.7,pr:90},{n:"Islamic Studies",cr:3,g:"A",p:4.0,pr:98}],
    2:[{n:"Calculus II",cr:3,g:"B+",p:3.3,pr:85},{n:"Physics",cr:3,g:"B",p:3.0,pr:76},
       {n:"Programming II",cr:3,g:"A-",p:3.7,pr:91},{n:"Statistics I",cr:3,g:"B",p:3.0,pr:75},{n:"English II",cr:3,g:"B+",p:3.3,pr:83}],
    3:[{n:"Data Structures",cr:3,g:"A",p:4.0,pr:98},{n:"Algorithms",cr:3,g:"A-",p:3.7,pr:93},
       {n:"Networks",cr:3,g:"B+",p:3.3,pr:86},{n:"Databases",cr:3,g:"B",p:3.0,pr:78},
       {n:"OOP",cr:3,g:"B+",p:3.3,pr:84},{n:"Math III",cr:3,g:"B-",p:2.7,pr:70}],
    4:[{n:"Human Resources",cr:3,g:"A",p:4.0,pr:100},{n:"Marketing",cr:3,g:"B+",p:3.3,pr:85},
       {n:"Statistics",cr:3,g:"B",p:3.0,pr:75},{n:"Project Management",cr:3,g:"C+",p:2.3,pr:60},
       {n:"Economics",cr:3,g:"D",p:1.0,pr:32}],
  };
  for (const [num, courses] of Object.entries(allCourses)) {
    const sid = getSem(Number(num));
    for (const c of courses) insCourse.run(sid, SID, c.n, c.cr, c.g, c.p, c.pr);
  }
  console.log("✓ Semester courses seeded");

  // Detailed grades
  const insGrade = db.prepare(`INSERT OR IGNORE INTO grades
    (student_id,course_name,grade,pre_final,max_pre_final,
     att_score,att_max,midterm_score,midterm_max,
     quiz1_score,quiz1_max,quiz2_score,quiz2_max,
     next_target_label,next_target_need,is_danger)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const grds = [
    {n:"Human Resources",   g:"A",  pre:54, a:[10,10],m:[26,30],q1:[9,10], q2:[9,10],  tl:"Target for A+",  tn:"36/40 in Final",d:0},
    {n:"Marketing",         g:"B+", pre:48, a:[9,10], m:[22,30],q1:[8,10], q2:[9,10],  tl:"Target for A",   tn:"32/40 in Final",d:0},
    {n:"Statistics",        g:"B",  pre:42, a:[10,10],m:[18,30],q1:[7,10], q2:[7,10],  tl:"Target for B+",  tn:"33/40 in Final",d:0},
    {n:"Project Management",g:"C+", pre:38, a:[8,10], m:[20,30],q1:[5,10], q2:[5,10],  tl:"Target for B",   tn:"32/40 in Final",d:0},
    {n:"Economics",         g:"D",  pre:32, a:[5,10], m:[15,30],q1:[6,10], q2:[6,10],  tl:"Target to Pass", tn:"18/40 in Final",d:1},
  ];
  for (const g of grds) {
    insGrade.run(SID, g.n, g.g, g.pre, 60,
      g.a[0],g.a[1], g.m[0],g.m[1], g.q1[0],g.q1[1], g.q2[0],g.q2[1],
      g.tl, g.tn, g.d);
  }
  console.log("✓ Grades seeded");

  // Attendance
  const insAtt = db.prepare(
    "INSERT OR IGNORE INTO attendance (student_id,course_name,attended,total,percentage,status,message) VALUES (?,?,?,?,?,?,?)"
  );
  const atts = [
    {n:"Human Resources", at:4,t:5,p:80,s:"safe",    msg:"Safe: You can miss 2 more."},
    {n:"Marketing",       at:2,t:5,p:40,s:"danger",  msg:"Warning: Risk of DN."},
    {n:"Statistics",      at:3,t:5,p:60,s:"warning", msg:"Careful: Attendance is dropping."},
  ];
  for (const a of atts) insAtt.run(SID, a.n, a.at, a.t, a.p, a.s, a.msg);
  console.log("✓ Attendance seeded");

  // Feedback
  const insFb = db.prepare(
    "INSERT OR IGNORE INTO feedback (student_id,course_name,doctor_name,created_at,body,is_danger) VALUES (?,?,?,?,?,?)"
  );
  const ago = d => { const dt=new Date(); dt.setDate(dt.getDate()-d); return dt.toISOString().replace("T"," ").slice(0,19); };
  insFb.run(SID,"Economics","Dr. Ahmed Salem",ago(2),
    "مستواك في الميدترم كان مقلق. ركز جداً على فصل Supply and Demand وحاول تحل المسائل العملي اللي في الكتاب صفحة 120.",1);
  insFb.run(SID,"Project Management","Dr. Ahmed Salem",ago(5),
    "أداء جيد في الكويزات، لكن محتاج تركز أكتر في الـ Critical Path Method. حاول تراجع المحاضرة الخامسة قبل الفاينال.",0);
  console.log("✓ Feedback seeded");

  console.log(`
╔══════════════════════════════════════════════════════╗
║           UNIVISION — LOGIN CREDENTIALS              ║
╠══════════════════════════════════════════════════════╣
║  Role     │ ID              │ Password               ║
╠══════════════════════════════════════════════════════╣
║  Student  │ 29803050202393  │ 123456                 ║
║  Doctor   │ 29803050202394  │ 123456                 ║
║  Admin    │ 29803050202395  │ 123456                 ║
╚══════════════════════════════════════════════════════╝
`);
}

seed();
