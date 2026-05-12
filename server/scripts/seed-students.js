/**
 * seed-students.js — 20 students across 4 grades (5 per grade).
 * Grade = academic year level: 1 (freshman) … 4 (senior).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt           = require("bcryptjs");
const { createSchema } = require("../db/schema");
const { getDb }        = require("../db/database");

createSchema();
const db  = getDb();
const pwd = bcrypt.hashSync("123456", 10);

// ── Real semester catalogue ──────────────────────────────────────────────────
const ALL_SEMESTERS = [
  { n:1, label:"2022-2023 — First Semester",   cr:21, courses:["Principles of Management","Introduction to Marketing","Microeconomics","Technical Report Writing","Human Rights","Quantitative Methods for Business","Principles of Accounting 1"] },
  { n:2, label:"2022-2023 — Second Semester",  cr:18, courses:["Creative Thinking and Communication Skills","Science and Technology","Organizational Behavior","Principles of Accounting 2","Macroeconomics","Principles of Finance"] },
  { n:3, label:"2023-2024 — Third Semester",   cr:18, courses:["Introduction to Business","Human Resource Management","Introduction to Business Informatics","Business Environment and Ethics","Money and Banking","Production and Operations Management"] },
  { n:4, label:"2023-2024 — Fourth Semester",  cr:18, courses:["Contemporary Global Issues","Research Methods","Business Law","Entrepreneurship and Innovation","Logistics & Supply Chain Management","Statistics for Business"] },
  { n:5, label:"2024-2025 — Fifth Semester",   cr:15, courses:["Business Communications","Total Quality Management","Entrepreneurial Organizations","Knowledge Management","Organizational Change and Development"] },
  { n:6, label:"2024-2025 — Sixth Semester",   cr:15, courses:["International Business Management","Public Administration","Public Relations","Entrepreneurship & Small Business","Family Business Management"] },
  { n:7, label:"2025-2026 — Seventh Semester", cr:18, courses:["Project Management","Enterprise Resource Management","Graduation Project-1","Information and Communication Architecture","Enterprise Systems and Applications","Introduction to E-Commerce"] },
  { n:8, label:"2025-2026 — Eighth Semester",  cr:21, courses:["Strategic Competitive Analysis","Strategic Management","Feasibility Study","Entrepreneurship & Small Business","Graduation Project-2","Decision Support Systems","Information Security"] },
];

// ── Performance patterns ─────────────────────────────────────────────────────
const GRADE_SEQ   = { strong:["A","A-","A","B+","A-","A","A-"], average:["B+","B","B-","B+","C+","B","B-"], struggling:["C+","C","D","C","C+","D","C-"] };
const GP_MAP      = { "A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D":1.0,"F":0.0 };
const PROG_BASE   = { strong:90, average:76, struggling:58 };
const SCORE_PROF  = {
  strong:    { a:[9,10], m:[26,30], q1:[9,10], q2:[9,10], danger:false },
  average:   { a:[7,10], m:[19,30], q1:[7,10], q2:[7,10], danger:false },
  struggling:{ a:[5,10], m:[12,30], q1:[5,10], q2:[5,10], danger:true  },
};
const SEM_GPA  = { strong:[3.70,3.80,3.75,3.90,3.85,3.95,3.82,3.93], average:[2.90,3.10,3.00,3.20,3.05,3.15,null,null], struggling:[2.10,2.30,2.00,2.20,null,null,null,null] };
const SEM_ATT  = { strong:[95,93,96,94,92,97,91,95],                  average:[80,85,82,88,84,86,null,null],              struggling:[68,72,65,70,null,null,null,null] };

const FB_TMPL = {
  strong:    [{ s:0, body:"أداء ممتاز. استمر على هذا المستوى وشارك في الأنشطة البحثية.",               d:0, ago:5  },
              { s:1, body:"مشاركتك في النقاشات جيدة جداً. راجع ملاحظاتي على المشروع النهائي.",          d:0, ago:12 }],
  average:   [{ s:0, body:"مستواك جيد لكن الاختبارات القصيرة تحتاج مزيداً من التركيز.",                 d:0, ago:7  },
              { s:1, body:"الميدترم كان أقل من المتوقع. راجع الفصول الأساسية قبل الفاينال.",             d:0, ago:14 }],
  struggling:[{ s:0, body:"أداؤك في خطر حقيقي. غياباتك تجاوزت الحد. تواصل معي فوراً في ساعة المكتب.", d:1, ago:3  },
              { s:1, body:"علامة الميدترم ضعيفة. إذا لم يتحسن مستواك ستفشل في المادة.",                 d:1, ago:8  }],
};

// ── 20 students: 5 per grade ─────────────────────────────────────────────────
// grade 4 = senior (enrolled 2021-2022, 8 sems complete)
// grade 3 = junior (enrolled 2022-2023, 6 sems complete)
// grade 2 = sophomore (enrolled 2023-2024, 4 sems complete)
// grade 1 = freshman (enrolled 2024-2025, 2 sems complete)
const STUDENTS = [
  // ── Grade 4 — Senior (semCount=8) ─────────────────────────────────────────
  { id:"30012151012341", name:"Ahmed Mohamed El-Sherif",  name_ar:"أحمد محمد الشريف",    dob:"2000-12-15", bp:"القاهرة",     addr:"12 شارع التحرير، الدقي، الجيزة",         ph:"01012345678", em:"ahmed.elsherif00@gmail.com",   gen:"ذكر",  level:"strong",    grade:4, semCount:8 },
  { id:"30306050211234", name:"Nour Tarek Hassan",        name_ar:"نور طارق حسن",        dob:"2003-06-05", bp:"طنطا",        addr:"28 شارع النصر، طنطا، الغربية",           ph:"01512345678", em:"nour.tarek03@gmail.com",       gen:"أنثى", level:"strong",    grade:4, semCount:8 },
  { id:"30001230218901", name:"Layla Mahmoud Osman",      name_ar:"ليلى محمود عثمان",    dob:"2000-01-23", bp:"الجيزة",      addr:"5 شارع فيصل، الهرم، الجيزة",            ph:"01098765432", em:"layla.mahmoud00@yahoo.com",    gen:"أنثى", level:"average",   grade:4, semCount:8 },
  { id:"30111050212345", name:"Omar Hassan Kamal",        name_ar:"عمر حسن كمال",        dob:"2001-11-05", bp:"الإسكندرية",  addr:"14 شارع المنشية، سيدي بشر، الإسكندرية", ph:"01234567801", em:"omar.kamal01@outlook.com",     gen:"ذكر",  level:"average",   grade:4, semCount:8 },
  { id:"30206180209876", name:"Hana Ali Youssef",         name_ar:"هناء علي يوسف",       dob:"2002-06-18", bp:"أسوان",       addr:"3 شارع الكورنيش، أسوان",                ph:"01567891234", em:"hana.ali02@gmail.com",         gen:"أنثى", level:"struggling", grade:4, semCount:8 },

  // ── Grade 3 — Junior (semCount=6) ─────────────────────────────────────────
  { id:"30204220214567", name:"Sara Khaled Ibrahim",      name_ar:"سارة خالد إبراهيم",   dob:"2002-04-22", bp:"الإسكندرية",  addr:"45 شارع الكورنيش، سيدي بشر، الإسكندرية",ph:"01123456789", em:"sara.khalid02@outlook.com",    gen:"أنثى", level:"average",   grade:3, semCount:6 },
  { id:"30208180218765", name:"Youssef Adel Mahmoud",     name_ar:"يوسف عادل محمود",     dob:"2002-08-18", bp:"أسيوط",       addr:"15 شارع عبد الناصر، أسيوط",             ph:"01067891234", em:"youssef.adel02@gmail.com",     gen:"ذكر",  level:"average",   grade:3, semCount:6 },
  { id:"30305120217654", name:"Mariam Nasser El-Din",     name_ar:"مريم ناصر الدين",      dob:"2003-05-12", bp:"المنصورة",    addr:"7 شارع الجيش، المنصورة، الدقهلية",      ph:"01345678901", em:"mariam.nasser03@gmail.com",    gen:"أنثى", level:"strong",    grade:3, semCount:6 },
  { id:"30409070213456", name:"Kareem Samir Abdel-Aziz",  name_ar:"كريم سمير عبد العزيز", dob:"2004-09-07", bp:"بني سويف",    addr:"22 شارع الجمهورية، بني سويف",           ph:"01456789012", em:"kareem.samir04@yahoo.com",     gen:"ذكر",  level:"struggling", grade:3, semCount:6 },
  { id:"30502140211111", name:"Dina Tarek Mansour",       name_ar:"دينا طارق منصور",     dob:"2005-02-14", bp:"الزقازيق",    addr:"9 شارع النيل، الزقازيق، الشرقية",       ph:"01578901234", em:"dina.tarek05@gmail.com",       gen:"أنثى", level:"average",   grade:3, semCount:6 },

  // ── Grade 2 — Sophomore (semCount=4) ──────────────────────────────────────
  { id:"30109100216789", name:"Mohamed Omar Al-Ansari",   name_ar:"محمد عمر الأنصاري",   dob:"2001-09-10", bp:"المنصورة",    addr:"7 شارع بورسعيد، المنصورة، الدقهلية",    ph:"01234567890", em:"m.alansari01@yahoo.com",       gen:"ذكر",  level:"struggling", grade:2, semCount:4 },
  { id:"30603010219876", name:"Amr Waleed Ibrahim",       name_ar:"عمرو وليد إبراهيم",   dob:"2006-03-01", bp:"طنطا",        addr:"17 شارع البحر، طنطا، الغربية",           ph:"01689012345", em:"amr.waleed06@gmail.com",       gen:"ذكر",  level:"strong",    grade:2, semCount:4 },
  { id:"30706250214321", name:"Yasmine Adel Hassan",      name_ar:"ياسمين عادل حسن",     dob:"2007-06-25", bp:"الإسماعيلية", addr:"4 شارع السلام، الإسماعيلية",            ph:"01790123456", em:"yasmine.adel07@outlook.com",   gen:"أنثى", level:"average",   grade:2, semCount:4 },
  { id:"30801180217890", name:"Khaled Mohamed Saleh",     name_ar:"خالد محمد صالح",      dob:"2008-01-18", bp:"بورسعيد",     addr:"11 شارع الشهداء، بورسعيد",              ph:"01801234567", em:"khaled.saleh08@gmail.com",     gen:"ذكر",  level:"struggling", grade:2, semCount:4 },
  { id:"30903220212222", name:"Rania Osama Fouad",        name_ar:"رانيا أسامة فؤاد",    dob:"2009-03-22", bp:"قنا",         addr:"19 شارع الجمهورية، قنا",                ph:"01912345678", em:"rania.osama09@yahoo.com",      gen:"أنثى", level:"average",   grade:2, semCount:4 },

  // ── Grade 1 — Freshman (semCount=2) ───────────────────────────────────────
  { id:"31003050219001", name:"Hassan Mahmoud El-Sayed",  name_ar:"حسن محمود السيد",     dob:"2010-03-05", bp:"الفيوم",      addr:"6 شارع النصر، الفيوم",                  ph:"01023456789", em:"hassan.mahmoud10@gmail.com",   gen:"ذكر",  level:"average",   grade:1, semCount:2 },
  { id:"31102150213456", name:"Fatma Ahmed Abdel-Aal",    name_ar:"فاطمة أحمد عبد العال", dob:"2011-02-15", bp:"المنيا",      addr:"14 شارع الحرية، المنيا",                ph:"01134567890", em:"fatma.ahmed11@outlook.com",    gen:"أنثى", level:"strong",    grade:1, semCount:2 },
  { id:"31208010218765", name:"Amir Youssef Barakat",     name_ar:"أمير يوسف بركات",     dob:"2012-08-01", bp:"دمياط",       addr:"8 شارع الميناء، دمياط",                 ph:"01245678901", em:"amir.barakat12@gmail.com",     gen:"ذكر",  level:"strong",    grade:1, semCount:2 },
  { id:"31304180215432", name:"Noha Khaled Ibrahim",      name_ar:"نها خالد إبراهيم",    dob:"2013-04-18", bp:"الغردقة",     addr:"2 شارع الشاطئ، الغردقة، البحر الأحمر",  ph:"01356789012", em:"noha.khaled13@gmail.com",      gen:"أنثى", level:"average",   grade:1, semCount:2 },
  { id:"31409270211111", name:"Samer Tarek El-Ghandour",  name_ar:"سامر طارق الغندور",   dob:"2014-09-27", bp:"الأقصر",      addr:"33 شارع النيل، الأقصر",                 ph:"01467890123", em:"samer.tarek14@yahoo.com",      gen:"ذكر",  level:"struggling", grade:1, semCount:2 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const ago = days => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().replace("T"," ").slice(0,19); };
const gradeFor   = (lv, i) => GRADE_SEQ[lv][i % GRADE_SEQ[lv].length];
const progressFor = (lv, i) => PROG_BASE[lv] + (i % 7) - 3;

// ── Prepared statements ───────────────────────────────────────────────────────
const insUser    = db.prepare("INSERT OR IGNORE INTO users (id,role,password,name,name_ar) VALUES (?,?,?,?,?)");
const insProfile = db.prepare(`INSERT OR IGNORE INTO student_profiles (student_id,name_en,name_ar,national_id,dob,birthplace,nationality,gender,religion,address,phone,email,university_email,grade) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insSem     = db.prepare("INSERT OR IGNORE INTO semesters (student_id,semester_number,label,gpa,attendance_pct,credits) VALUES (?,?,?,?,?,?)");
const insCourse  = db.prepare("INSERT OR IGNORE INTO semester_courses (semester_id,student_id,name,credits,grade,grade_points,progress) VALUES (?,?,?,?,?,?,?)");
const insGrade   = db.prepare(`INSERT OR IGNORE INTO grades (student_id,course_name,grade,pre_final,max_pre_final,att_score,att_max,midterm_score,midterm_max,quiz1_score,quiz1_max,quiz2_score,quiz2_max,next_target_label,next_target_need,is_danger) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insAtt     = db.prepare("INSERT OR IGNORE INTO attendance (student_id,course_name,attended,total,percentage,status,message) VALUES (?,?,?,?,?,?,?)");
const insFb      = db.prepare("INSERT OR IGNORE INTO feedback (student_id,course_name,doctor_name,created_at,body,is_danger) VALUES (?,?,?,?,?,?)");

console.log("");

for (const s of STUDENTS) {
  insUser.run(s.id, "student", pwd, s.name, s.name_ar);
  insProfile.run(s.id, s.name, s.name_ar, s.id, s.dob, s.bp, "مصر", s.gen, "مسلم", s.addr, s.ph, s.em, `${s.id}@student.eelu.edu.eg`, s.grade);

  const sems = ALL_SEMESTERS.slice(0, s.semCount);

  // Semester history + courses (reports page)
  for (let si = 0; si < sems.length; si++) {
    const sem = sems[si];
    const gpa = SEM_GPA[s.level][si];
    const att = SEM_ATT[s.level][si];
    if (gpa == null) continue;
    insSem.run(s.id, sem.n, sem.label, gpa, att, sem.cr);
    const semId = db.prepare("SELECT id FROM semesters WHERE student_id=? AND semester_number=?").get(s.id, sem.n).id;
    sem.courses.forEach((name, ci) => {
      insCourse.run(semId, s.id, name, 3, gradeFor(s.level, ci), GP_MAP[gradeFor(s.level, ci)] ?? 0, progressFor(s.level, ci));
    });
  }

  // Current-term grades & attendance (latest semester)
  const cur = sems[sems.length - 1];
  const sp  = SCORE_PROF[s.level];
  const tl  = s.level === "strong" ? "Target for A+" : s.level === "average" ? "Target for B+" : "Target to Pass";
  const tn  = s.level === "strong" ? "38/40 in Final" : s.level === "average" ? "30/40 in Final" : "20/40 in Final";
  const ab  = s.level === "strong" ? 19 : s.level === "average" ? 16 : 12;

  cur.courses.forEach((courseName, ci) => {
    const g   = gradeFor(s.level, ci);
    const m   = sp.m[0]  - (ci % 3);
    const q1  = sp.q1[0] - (ci % 2);
    const q2  = sp.q2[0] - (ci % 2);
    insGrade.run(s.id, courseName, g, sp.a[0]+m+q1+q2, sp.a[1]+sp.m[1]+sp.q1[1]+sp.q2[1], sp.a[0], sp.a[1], m, sp.m[1], q1, sp.q1[1], q2, sp.q2[1], tl, tn, sp.danger && ci%3!==0 ? 1 : 0);
    const at  = ab - (ci % 3 === 0 ? 1 : 0);
    const pct = Math.round((at / 20) * 100);
    const canMiss = Math.floor(20 * 0.25) - (20 - at);
    const status  = pct >= 75 ? "safe" : pct >= 60 ? "warning" : "danger";
    const msg = status === "safe" ? `Safe: You can miss ${Math.max(0,canMiss)} more.` : status === "warning" ? "Careful: Attendance is dropping." : "Warning: Risk of DN.";
    insAtt.run(s.id, courseName, at, 20, pct, status, msg);
  });

  // Feedback
  for (const fb of FB_TMPL[s.level]) {
    insFb.run(s.id, cur.courses[fb.s] || cur.courses[0], "Dr. Ahmed Salem", ago(fb.ago), fb.body, fb.d);
  }

  console.log(`  ✓ Grade ${s.grade}  ${s.id}  "${s.name}"  [${s.level}]`);
}

console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║ Gr │ ID               │ Name                      │ Level      │ Sems │ Pass ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  4 │ 30012151012341   │ Ahmed El-Sherif           │ Strong     │  8   │123456║
║  4 │ 30306050211234   │ Nour Tarek Hassan         │ Strong     │  8   │123456║
║  4 │ 30001230218901   │ Layla Mahmoud Osman       │ Average    │  8   │123456║
║  4 │ 30111050212345   │ Omar Hassan Kamal         │ Average    │  8   │123456║
║  4 │ 30206180209876   │ Hana Ali Youssef          │ Struggling │  8   │123456║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  3 │ 30204220214567   │ Sara Khaled Ibrahim       │ Average    │  6   │123456║
║  3 │ 30208180218765   │ Youssef Adel Mahmoud      │ Average    │  6   │123456║
║  3 │ 30305120217654   │ Mariam Nasser El-Din      │ Strong     │  6   │123456║
║  3 │ 30409070213456   │ Kareem Samir Abdel-Aziz   │ Struggling │  6   │123456║
║  3 │ 30502140211111   │ Dina Tarek Mansour        │ Average    │  6   │123456║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  2 │ 30109100216789   │ Mohamed Omar Al-Ansari    │ Struggling │  4   │123456║
║  2 │ 30603010219876   │ Amr Waleed Ibrahim        │ Strong     │  4   │123456║
║  2 │ 30706250214321   │ Yasmine Adel Hassan       │ Average    │  4   │123456║
║  2 │ 30801180217890   │ Khaled Mohamed Saleh      │ Struggling │  4   │123456║
║  2 │ 30903220212222   │ Rania Osama Fouad         │ Average    │  4   │123456║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  1 │ 31003050219001   │ Hassan Mahmoud El-Sayed   │ Average    │  2   │123456║
║  1 │ 31102150213456   │ Fatma Ahmed Abdel-Aal     │ Strong     │  2   │123456║
║  1 │ 31208010218765   │ Amir Youssef Barakat      │ Strong     │  2   │123456║
║  1 │ 31304180215432   │ Noha Khaled Ibrahim       │ Average    │  2   │123456║
║  1 │ 31409270211111   │ Samer Tarek El-Ghandour   │ Struggling │  2   │123456║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
