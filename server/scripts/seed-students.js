/**
 * seed-students.js — 20 students across 4 grades with DIVERSE scenarios.
 * Each student has a unique performance profile to showcase all system features:
 *   - GPA drops, recoveries, steady performers
 *   - Danger flags, safe students, borderline cases
 *   - Attendance: perfect, warning, danger, mixed
 *   - Doctor feedback: praise, warnings, urgent danger
 *   - Admin feedback for flagged students
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

// Official grading scale
const GP_MAP = { "A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"C+":2.7,"C":2.4,"D+":2.2,"D":2.0,"F":0.0 };

// Derive letter grade from percentage (0-100)
function percentToGrade(pct) {
  if (pct >= 90) return "A";
  if (pct >= 85) return "A-";
  if (pct >= 80) return "B+";
  if (pct >= 75) return "B";
  if (pct >= 70) return "C+";
  if (pct >= 65) return "C";
  if (pct >= 60) return "D+";
  if (pct >= 50) return "D";
  return "F";
}

// ── Student profiles with UNIQUE scenarios ───────────────────────────────────
// scenario key determines the story:
//   "top"          = dean's list, near-perfect
//   "strong"       = solid A-/B+ student
//   "steady_avg"   = consistent B student, no drama
//   "improving"    = started weak, getting better each semester
//   "declining"    = was good, now dropping (triggers GPA drop alert)
//   "mixed"        = good in some courses, terrible in others
//   "at_risk"      = low GPA + low attendance = probation risk
//   "attendance_danger" = grades ok-ish but attendance is critical
//   "struggling"   = failing multiple courses
//   "comeback"     = failed, then recovered somewhat

const STUDENTS = [
  // ── Grade 4 — Senior (semCount=8) ─────────────────────────────────────────
  { id:"30012151012341", name:"Ahmed Mohamed El-Sherif",  name_ar:"أحمد محمد الشريف",    dob:"2000-12-15", bp:"القاهرة",     addr:"12 شارع التحرير، الدقي، الجيزة",         ph:"01012345678", em:"ahmed.elsherif00@gmail.com",   gen:"ذكر",  scenario:"top",             grade:4, semCount:8 },
  { id:"30306050211234", name:"Nour Tarek Hassan",        name_ar:"نور طارق حسن",        dob:"2003-06-05", bp:"طنطا",        addr:"28 شارع النصر، طنطا، الغربية",           ph:"01512345678", em:"nour.tarek03@gmail.com",       gen:"أنثى", scenario:"declining",        grade:4, semCount:8 },
  { id:"30001230218901", name:"Layla Mahmoud Osman",      name_ar:"ليلى محمود عثمان",    dob:"2000-01-23", bp:"الجيزة",      addr:"5 شارع فيصل، الهرم، الجيزة",            ph:"01098765432", em:"layla.mahmoud00@yahoo.com",    gen:"أنثى", scenario:"mixed",            grade:4, semCount:8 },
  { id:"30111050212345", name:"Omar Hassan Kamal",        name_ar:"عمر حسن كمال",        dob:"2001-11-05", bp:"الإسكندرية",  addr:"14 شارع المنشية، سيدي بشر، الإسكندرية", ph:"01234567801", em:"omar.kamal01@outlook.com",     gen:"ذكر",  scenario:"at_risk",          grade:4, semCount:8 },
  { id:"30206180209876", name:"Hana Ali Youssef",         name_ar:"هناء علي يوسف",       dob:"2002-06-18", bp:"أسوان",       addr:"3 شارع الكورنيش، أسوان",                ph:"01567891234", em:"hana.ali02@gmail.com",         gen:"أنثى", scenario:"comeback",         grade:4, semCount:8 },

  // ── Grade 3 — Junior (semCount=6) ─────────────────────────────────────────
  { id:"30204220214567", name:"Sara Khaled Ibrahim",      name_ar:"سارة خالد إبراهيم",   dob:"2002-04-22", bp:"الإسكندرية",  addr:"45 شارع الكورنيش، سيدي بشر، الإسكندرية",ph:"01123456789", em:"sara.khalid02@outlook.com",    gen:"أنثى", scenario:"strong",           grade:3, semCount:6 },
  { id:"30208180218765", name:"Youssef Adel Mahmoud",     name_ar:"يوسف عادل محمود",     dob:"2002-08-18", bp:"أسيوط",       addr:"15 شارع عبد الناصر، أسيوط",             ph:"01067891234", em:"youssef.adel02@gmail.com",     gen:"ذكر",  scenario:"attendance_danger", grade:3, semCount:6 },
  { id:"30305120217654", name:"Mariam Nasser El-Din",     name_ar:"مريم ناصر الدين",      dob:"2003-05-12", bp:"المنصورة",    addr:"7 شارع الجيش، المنصورة، الدقهلية",      ph:"01345678901", em:"mariam.nasser03@gmail.com",    gen:"أنثى", scenario:"improving",        grade:3, semCount:6 },
  { id:"30409070213456", name:"Kareem Samir Abdel-Aziz",  name_ar:"كريم سمير عبد العزيز", dob:"2004-09-07", bp:"بني سويف",    addr:"22 شارع الجمهورية، بني سويف",           ph:"01456789012", em:"kareem.samir04@yahoo.com",     gen:"ذكر",  scenario:"struggling",       grade:3, semCount:6 },
  { id:"30502140211111", name:"Dina Tarek Mansour",       name_ar:"دينا طارق منصور",     dob:"2005-02-14", bp:"الزقازيق",    addr:"9 شارع النيل، الزقازيق، الشرقية",       ph:"01578901234", em:"dina.tarek05@gmail.com",       gen:"أنثى", scenario:"steady_avg",       grade:3, semCount:6 },

  // ── Grade 2 — Sophomore (semCount=4) ──────────────────────────────────────
  { id:"30109100216789", name:"Mohamed Omar Al-Ansari",   name_ar:"محمد عمر الأنصاري",   dob:"2001-09-10", bp:"المنصورة",    addr:"7 شارع بورسعيد، المنصورة، الدقهلية",    ph:"01234567890", em:"m.alansari01@yahoo.com",       gen:"ذكر",  scenario:"declining",        grade:2, semCount:4 },
  { id:"30603010219876", name:"Amr Waleed Ibrahim",       name_ar:"عمرو وليد إبراهيم",   dob:"2006-03-01", bp:"طنطا",        addr:"17 شارع البحر، طنطا، الغربية",           ph:"01689012345", em:"amr.waleed06@gmail.com",       gen:"ذكر",  scenario:"top",              grade:2, semCount:4 },
  { id:"30706250214321", name:"Yasmine Adel Hassan",      name_ar:"ياسمين عادل حسن",     dob:"2007-06-25", bp:"الإسماعيلية", addr:"4 شارع السلام، الإسماعيلية",            ph:"01790123456", em:"yasmine.adel07@outlook.com",   gen:"أنثى", scenario:"mixed",            grade:2, semCount:4 },
  { id:"30801180217890", name:"Khaled Mohamed Saleh",     name_ar:"خالد محمد صالح",      dob:"2008-01-18", bp:"بورسعيد",     addr:"11 شارع الشهداء، بورسعيد",              ph:"01801234567", em:"khaled.saleh08@gmail.com",     gen:"ذكر",  scenario:"at_risk",          grade:2, semCount:4 },
  { id:"30903220212222", name:"Rania Osama Fouad",        name_ar:"رانيا أسامة فؤاد",    dob:"2009-03-22", bp:"قنا",         addr:"19 شارع الجمهورية، قنا",                ph:"01912345678", em:"rania.osama09@yahoo.com",      gen:"أنثى", scenario:"improving",        grade:2, semCount:4 },

  // ── Grade 1 — Freshman (semCount=2) ───────────────────────────────────────
  { id:"31003050219001", name:"Hassan Mahmoud El-Sayed",  name_ar:"حسن محمود السيد",     dob:"2010-03-05", bp:"الفيوم",      addr:"6 شارع النصر، الفيوم",                  ph:"01023456789", em:"hassan.mahmoud10@gmail.com",   gen:"ذكر",  scenario:"steady_avg",       grade:1, semCount:2 },
  { id:"31102150213456", name:"Fatma Ahmed Abdel-Aal",    name_ar:"فاطمة أحمد عبد العال", dob:"2011-02-15", bp:"المنيا",      addr:"14 شارع الحرية، المنيا",                ph:"01134567890", em:"fatma.ahmed11@outlook.com",    gen:"أنثى", scenario:"strong",           grade:1, semCount:2 },
  { id:"31208010218765", name:"Amir Youssef Barakat",     name_ar:"أمير يوسف بركات",     dob:"2012-08-01", bp:"دمياط",       addr:"8 شارع الميناء، دمياط",                 ph:"01245678901", em:"amir.barakat12@gmail.com",     gen:"ذكر",  scenario:"attendance_danger", grade:1, semCount:2 },
  { id:"31304180215432", name:"Noha Khaled Ibrahim",      name_ar:"نها خالد إبراهيم",    dob:"2013-04-18", bp:"الغردقة",     addr:"2 شارع الشاطئ، الغردقة، البحر الأحمر",  ph:"01356789012", em:"noha.khaled13@gmail.com",      gen:"أنثى", scenario:"struggling",       grade:1, semCount:2 },
  { id:"31409270211111", name:"Samer Tarek El-Ghandour",  name_ar:"سامر طارق الغندور",   dob:"2014-09-27", bp:"الأقصر",      addr:"33 شارع النيل، الأقصر",                 ph:"01467890123", em:"samer.tarek14@yahoo.com",      gen:"ذكر",  scenario:"comeback",         grade:1, semCount:2 },
];

// ── Scenario-based GPA progressions (per semester index) ─────────────────────
const SEM_GPA = {
  top:               [3.90, 3.95, 3.92, 3.97, 3.95, 3.98, 3.93, 3.96],
  strong:            [3.50, 3.60, 3.65, 3.70, 3.75, 3.80, 3.72, 3.78],
  steady_avg:        [2.80, 2.85, 2.90, 2.88, 2.92, 2.85, null, null],
  improving:         [1.80, 2.10, 2.50, 2.80, 3.10, 3.30, null, null],
  declining:         [3.60, 3.50, 3.30, 3.10, 2.70, 2.40, 2.10, 1.90],
  mixed:             [3.20, 2.60, 3.40, 2.30, 3.10, 2.50, 2.90, 2.40],
  at_risk:           [2.20, 2.00, 1.80, 1.60, 1.50, 1.40, 1.30, 1.20],
  attendance_danger: [3.00, 3.10, 2.90, 3.05, 2.95, 3.00, null, null],
  struggling:        [1.70, 1.50, 1.30, 1.10, 1.00, 0.90, null, null],
  comeback:          [1.20, 1.50, 2.00, 2.40, 2.70, 3.00, 3.20, 3.40],
};

const SEM_ATT = {
  top:               [98, 97, 99, 96, 98, 97, 99, 98],
  strong:            [93, 95, 92, 94, 91, 96, 93, 95],
  steady_avg:        [82, 85, 80, 83, 81, 84, null, null],
  improving:         [60, 68, 75, 80, 85, 88, null, null],
  declining:         [92, 88, 82, 75, 68, 62, 55, 50],
  mixed:             [90, 70, 92, 65, 88, 72, 85, 68],
  at_risk:           [55, 52, 48, 45, 42, 40, 38, 35],
  attendance_danger: [70, 62, 55, 50, 48, 45, null, null],
  struggling:        [58, 55, 50, 48, 45, 42, null, null],
  comeback:          [50, 60, 72, 80, 85, 90, 92, 94],
};

// ── Course-level score generation from target GPA ───────────────────────────
// Given a target GPA for the semester, generate scores that produce grades
// averaging close to that GPA. This ensures semester GPA ≈ implied GPA from grades.
function courseScoresForGPA(targetGPA, scenario, ci, courseCount) {
  // Determine target percentage for this course based on target GPA + variation
  // For low GPAs, use larger offsets to create a mix of D and F grades
  let offsets;
  if (targetGPA < 1.5) {
    offsets = [0.8, -0.8, 0.5, -1.0, 0.6, -0.7, 0.3, -0.9];
  } else if (targetGPA < 2.0) {
    offsets = [0.6, -0.5, 0.3, -0.6, 0.4, -0.4, 0.2, -0.5];
  } else {
    offsets = [0.3, -0.2, 0.1, -0.3, 0.2, -0.1, 0.15, -0.15];
  }
  const adjusted = Math.max(0, Math.min(4.0, targetGPA + offsets[ci % offsets.length]));

  // Map GPA to approximate percentage
  let targetPct;
  if (adjusted >= 3.85) targetPct = 92 + (ci % 4);       // A range
  else if (adjusted >= 3.5) targetPct = 86 + (ci % 4);   // A- range
  else if (adjusted >= 3.15) targetPct = 81 + (ci % 4);  // B+ range
  else if (adjusted >= 2.85) targetPct = 76 + (ci % 4);  // B range
  else if (adjusted >= 2.55) targetPct = 71 + (ci % 4);  // C+ range
  else if (adjusted >= 2.3) targetPct = 66 + (ci % 3);   // C range
  else if (adjusted >= 2.1) targetPct = 61 + (ci % 3);   // D+ range
  else if (adjusted >= 1.0) targetPct = 51 + (ci % 8);   // D range
  else targetPct = 30 + (ci % 15);                        // F range

  // Generate component scores that sum to targetPct% of 60
  const totalScore = Math.round(targetPct * 60 / 100);
  // Distribute across components (att:10, mid:30, q1:10, q2:10)
  const midPct = targetPct / 100;
  let attS = Math.min(10, Math.max(0, Math.round(10 * midPct + (ci % 2 - 0.5))));
  let midS = Math.min(30, Math.max(0, Math.round(30 * midPct + (ci % 3 - 1))));
  let q1S  = Math.min(10, Math.max(0, Math.round(10 * midPct + (ci % 2 - 0.5))));
  let q2S  = totalScore - attS - midS - q1S;
  q2S = Math.min(10, Math.max(0, q2S));
  // Adjust mid to absorb rounding
  const actual = attS + midS + q1S + q2S;
  if (actual !== totalScore) midS = Math.min(30, Math.max(0, midS + (totalScore - actual)));

  const preFinal = attS + midS + q1S + q2S;
  const pct = Math.round((preFinal / 60) * 100);
  const grade = percentToGrade(pct);

  // Danger flag logic based on scenario
  let danger = false;
  switch (scenario) {
    case "at_risk":           danger = true; break;
    case "struggling":        danger = true; break;
    case "declining":         danger = ci % 2 === 0; break;
    case "mixed":             danger = ci % 2 !== 0; break;
    case "attendance_danger": danger = ci < 2; break;
    default:                  danger = false;
  }

  return { att:[attS,10], mid:[midS,30], q1:[q1S,10], q2:[q2S,10], danger, grade };
}

// ── Attendance per course per scenario ──────────────────────────────────────
function courseAttendance(scenario, ci) {
  const total = 20;
  let attended;
  switch (scenario) {
    case "top":               attended = 19 + (ci%2); break;  // 19-20
    case "strong":            attended = 18 + (ci%2); break;  // 18-19
    case "steady_avg":        attended = 15 + (ci%3); break;  // 15-17
    case "improving":         attended = 16 + (ci%3); break;  // 16-18
    case "declining":         attended = 12 - (ci%3); break;  // 10-12
    case "mixed":             attended = ci%2===0 ? 18+(ci%2) : 10-(ci%2); break; // alternating
    case "at_risk":           attended = 8 - (ci%3); break;   // 6-8
    case "attendance_danger": attended = 10 - (ci%2)*2; break; // 8-10
    case "struggling":        attended = 9 - (ci%3); break;   // 7-9
    case "comeback":          attended = 17 + (ci%2); break;  // 17-18
    default:                  attended = 15;
  }
  attended = Math.max(4, Math.min(total, attended));
  const pct = Math.round((attended / total) * 100);
  const canMiss = Math.floor(total * 0.25) - (total - attended);
  let status, msg;
  if (pct >= 75) {
    status = "safe";
    msg = `Safe: You can miss ${Math.max(0, canMiss)} more.`;
  } else if (pct >= 60) {
    status = "warning";
    msg = "Careful: Attendance is dropping.";
  } else {
    status = "danger";
    msg = "Warning: Risk of DN — contact your advisor immediately.";
  }
  return { attended, total, pct, status, msg };
}

// ── Feedback templates per scenario ─────────────────────────────────────────
const FB_TMPL = {
  top: [
    { s:0, body:"أداء متميز ورائع. أنت من أفضل الطلاب. أنصحك بالمشاركة في البحث العلمي.", d:0, ago:5 },
    { s:1, body:"مشاركتك في النقاشات ممتازة. استمر على هذا المستوى.", d:0, ago:15 },
  ],
  strong: [
    { s:0, body:"أداء ممتاز. استمر على هذا المستوى وشارك في الأنشطة البحثية.", d:0, ago:5 },
    { s:2, body:"نتائجك في الكويزات جيدة جداً. راجع ملاحظاتي لتحسين المشروع.", d:0, ago:12 },
  ],
  steady_avg: [
    { s:0, body:"مستواك جيد لكن الاختبارات القصيرة تحتاج مزيداً من التركيز.", d:0, ago:7 },
    { s:1, body:"الميدترم كان أقل من المتوقع. راجع الفصول الأساسية قبل الفاينال.", d:0, ago:14 },
  ],
  improving: [
    { s:0, body:"تحسن ملحوظ! استمر بهذا الجهد. أداؤك في الميدترم أفضل بكثير من السابق.", d:0, ago:4 },
    { s:1, body:"مستواك في تحسن مستمر. حافظ على الحضور والمذاكرة.", d:0, ago:10 },
  ],
  declining: [
    { s:0, body:"مستواك انخفض بشكل ملحوظ مقارنة بالفصل الماضي. تحتاج خطة عاجلة للتحسن.", d:1, ago:3 },
    { s:1, body:"غياباتك زادت وعلاماتك تراجعت. تواصل معي فوراً.", d:1, ago:7 },
    { s:2, body:"إذا لم تتحسن نتائجك في الفاينال، مستقبلك الأكاديمي في خطر.", d:1, ago:1 },
  ],
  mixed: [
    { s:0, body:"أداؤك في هذه المادة ممتاز، لكن أداؤك في مواد أخرى مقلق. ركّز على المواد الضعيفة.", d:0, ago:6 },
    { s:1, body:"أنت بحاجة ماسة لتحسين أدائك في هذه المادة. تعال لساعة المكتب.", d:1, ago:4 },
  ],
  at_risk: [
    { s:0, body:"أداؤك في خطر حقيقي. غياباتك تجاوزت الحد المسموح. تواصل معي فوراً.", d:1, ago:2 },
    { s:1, body:"أنت مهدد بالفصل الأكاديمي. يجب أن تحضر جميع المحاضرات المتبقية.", d:1, ago:5 },
    { s:2, body:"الوضع حرج جداً. اذهب إلى مكتب شؤون الطلاب فوراً.", d:1, ago:1 },
  ],
  attendance_danger: [
    { s:0, body:"درجاتك جيدة لكن حضورك خطير. إذا غبت مرة أخرى ستحرم من دخول الامتحان.", d:1, ago:3 },
    { s:1, body:"تم إرسال إنذار رسمي بخصوص غيابك. تواصل مع شؤون الطلاب.", d:1, ago:6 },
  ],
  struggling: [
    { s:0, body:"علامة الميدترم ضعيفة جداً. إذا لم يتحسن مستواك ستفشل في المادة.", d:1, ago:3 },
    { s:1, body:"أداؤك ضعيف في جميع التقييمات. أنت بحاجة لدروس تقوية فوراً.", d:1, ago:8 },
  ],
  comeback: [
    { s:0, body:"تحسن رائع! بعد بداية صعبة أثبت أنك قادر على النجاح. استمر!", d:0, ago:4 },
    { s:1, body:"مستواك تغير بشكل إيجابي كبير. أتوقع لك نتائج ممتازة في الفاينال.", d:0, ago:9 },
  ],
};

// ── Admin feedback for flagged students ─────────────────────────────────────
const ADMIN_FB = {
  declining: [
    { body:"الطالب يحتاج متابعة مكثفة. مستواه انخفض بشكل حاد منذ فصلين. يرجى التواصل معه وتقديم خطة تحسين.", urgent:1, ago:2 },
  ],
  at_risk: [
    { body:"الطالب مهدد بالفصل الأكاديمي. GPA أقل من 1.5. يجب عقد اجتماع طارئ مع الطالب وولي الأمر.", urgent:1, ago:1 },
    { body:"تم إرسال إنذار رسمي للطالب بخصوص الحضور. يرجى المتابعة وإرسال تقرير أسبوعي.", urgent:1, ago:5 },
  ],
  struggling: [
    { body:"الطالب يفشل في أغلب المواد. يرجى تقييم إمكانية تحويله لبرنامج الدعم الأكاديمي.", urgent:1, ago:3 },
  ],
  attendance_danger: [
    { body:"حضور الطالب أقل من الحد المسموح في عدة مواد. يرجى التأكد من تطبيق نظام الإنذار.", urgent:0, ago:4 },
  ],
  mixed: [
    { body:"أداء الطالب متذبذب — ممتاز في بعض المواد وضعيف في أخرى. يرجى التنسيق مع جميع الأساتذة.", urgent:0, ago:6 },
  ],
};

// Derive a letter grade from a target GPA with per-course variation
function gradeFromGPA(targetGPA, ci) {
  // Add some variation around the target GPA
  const offsets = [0.3, -0.2, 0.1, -0.3, 0.2, -0.1, 0.0];
  const adjusted = Math.max(0, Math.min(4.0, targetGPA + offsets[ci % 7]));
  // Map GPA back to letter grade
  if (adjusted >= 3.85) return "A";
  if (adjusted >= 3.5)  return "A-";
  if (adjusted >= 3.15) return "B+";
  if (adjusted >= 2.85) return "B";
  if (adjusted >= 2.55) return "C+";
  if (adjusted >= 2.3)  return "C";
  if (adjusted >= 2.1)  return "D+";
  if (adjusted >= 1.0)  return "D";
  return "F";
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const ago = days => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().replace("T"," ").slice(0,19); };

// ── Prepared statements ───────────────────────────────────────────────────────
const insUser    = db.prepare("INSERT OR REPLACE INTO users (id,role,password,name,name_ar) VALUES (?,?,?,?,?)");
const insProfile = db.prepare(`INSERT OR REPLACE INTO student_profiles (student_id,name_en,name_ar,national_id,dob,birthplace,nationality,gender,religion,address,phone,email,university_email,grade) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insSem     = db.prepare("INSERT INTO semesters (student_id,semester_number,label,gpa,attendance_pct,credits) VALUES (?,?,?,?,?,?)");
const insCourse  = db.prepare("INSERT INTO semester_courses (semester_id,student_id,name,credits,grade,grade_points,progress) VALUES (?,?,?,?,?,?,?)");
const insGrade   = db.prepare(`INSERT INTO grades (student_id,course_name,grade,pre_final,max_pre_final,att_score,att_max,midterm_score,midterm_max,quiz1_score,quiz1_max,quiz2_score,quiz2_max,next_target_label,next_target_need,is_danger) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insAtt     = db.prepare("INSERT INTO attendance (student_id,course_name,attended,total,percentage,status,message) VALUES (?,?,?,?,?,?,?)");
const insFb      = db.prepare("INSERT INTO feedback (student_id,course_name,doctor_name,created_at,body,is_danger) VALUES (?,?,?,?,?,?)");
const insAdmFb   = db.prepare("INSERT INTO admin_feedback (student_id,doctor_id,admin_id,admin_name,course_name,body,is_urgent,created_at) VALUES (?,?,?,?,?,?,?,?)");

// ── Clean existing student data before seeding ──────────────────────────────
const studentIds = STUDENTS.map(s => `'${s.id}'`).join(",");
db.exec(`
  DELETE FROM admin_feedback  WHERE student_id IN (${studentIds});
  DELETE FROM feedback        WHERE student_id IN (${studentIds});
  DELETE FROM attendance      WHERE student_id IN (${studentIds});
  DELETE FROM grades          WHERE student_id IN (${studentIds});
  DELETE FROM semester_courses WHERE student_id IN (${studentIds});
  DELETE FROM semesters       WHERE student_id IN (${studentIds});
  DELETE FROM student_profiles WHERE student_id IN (${studentIds});
  DELETE FROM users           WHERE id IN (${studentIds});
`);

console.log("");

for (const s of STUDENTS) {
  insUser.run(s.id, "student", pwd, s.name, s.name_ar);
  insProfile.run(s.id, s.name, s.name_ar, s.id, s.dob, s.bp, "مصر", s.gen, "مسلم", s.addr, s.ph, s.em, `${s.id}@student.eelu.edu.eg`, s.grade);

  const sems = ALL_SEMESTERS.slice(0, s.semCount);

  // Semester history + courses
  for (let si = 0; si < sems.length; si++) {
    const sem = sems[si];
    const gpa = SEM_GPA[s.scenario][si];
    const att = SEM_ATT[s.scenario][si];
    if (gpa == null) continue;
    insSem.run(s.id, sem.n, sem.label, gpa, att, sem.cr);
    const semId = db.prepare("SELECT id FROM semesters WHERE student_id=? AND semester_number=?").get(s.id, sem.n).id;
    sem.courses.forEach((name, ci) => {
      const grd = gradeFromGPA(gpa, ci);
      const gp = GP_MAP[grd] ?? 0;
      const progress = Math.round((gp / 4) * 100);
      insCourse.run(semId, s.id, name, 3, grd, gp, progress);
    });
  }

  // Current-term grades & attendance (latest semester)
  const cur = sems[sems.length - 1];
  // Get the last semester's GPA to generate matching grades
  const lastSemGPA = SEM_GPA[s.scenario][s.semCount - 1] ?? SEM_GPA[s.scenario].filter(g => g != null).pop() ?? 2.0;

  // Target labels based on scenario
  let tl, tn;
  switch (s.scenario) {
    case "top":               tl = "Target for A";  tn = "36/40 in Final"; break;
    case "strong":            tl = "Target for A-"; tn = "34/40 in Final"; break;
    case "steady_avg":        tl = "Target for B+"; tn = "30/40 in Final"; break;
    case "improving":         tl = "Target for B+"; tn = "30/40 in Final"; break;
    case "declining":         tl = "Target to Pass"; tn = "22/40 in Final"; break;
    case "mixed":             tl = "Target for B";  tn = "28/40 in Final"; break;
    case "at_risk":           tl = "Must Pass";     tn = "25/40 in Final"; break;
    case "attendance_danger": tl = "Target for B";  tn = "28/40 in Final"; break;
    case "struggling":        tl = "Must Pass";     tn = "25/40 in Final"; break;
    case "comeback":          tl = "Target for B+"; tn = "30/40 in Final"; break;
    default:                  tl = "Target for B";  tn = "28/40 in Final";
  }

  cur.courses.forEach((courseName, ci) => {
    const sc = courseScoresForGPA(lastSemGPA, s.scenario, ci, cur.courses.length);
    const preFinal = sc.att[0] + sc.mid[0] + sc.q1[0] + sc.q2[0];
    const maxPreFinal = sc.att[1] + sc.mid[1] + sc.q1[1] + sc.q2[1];
    insGrade.run(s.id, courseName, sc.grade, preFinal, maxPreFinal, sc.att[0], sc.att[1], sc.mid[0], sc.mid[1], sc.q1[0], sc.q1[1], sc.q2[0], sc.q2[1], tl, tn, sc.danger ? 1 : 0);

    const at = courseAttendance(s.scenario, ci);
    insAtt.run(s.id, courseName, at.attended, at.total, at.pct, at.status, at.msg);
  });

  // Doctor feedback
  const fbs = FB_TMPL[s.scenario] || [];
  for (const fb of fbs) {
    insFb.run(s.id, cur.courses[fb.s] || cur.courses[0], "Dr. Ahmed Salem", ago(fb.ago), fb.body, fb.d);
  }

  // Admin feedback for flagged scenarios
  const admFbs = ADMIN_FB[s.scenario] || [];
  for (const afb of admFbs) {
    insAdmFb.run(s.id, "29803050202394", "29803050202395", "System Admin", cur.courses[0], afb.body, afb.urgent, ago(afb.ago));
  }

  console.log(`  ✓ Grade ${s.grade}  ${s.id}  "${s.name}"  [${s.scenario}]`);
}

console.log(`
╔═════════════════════════════════════════════════════════════════════════════════════╗
║ Gr │ ID               │ Name                      │ Scenario          │ Sems │ Pass ║
╠═════════════════════════════════════════════════════════════════════════════════════╣
║  4 │ 30012151012341   │ Ahmed El-Sherif           │ Top Student       │  8   │123456║
║  4 │ 30306050211234   │ Nour Tarek Hassan         │ Declining         │  8   │123456║
║  4 │ 30001230218901   │ Layla Mahmoud Osman       │ Mixed             │  8   │123456║
║  4 │ 30111050212345   │ Omar Hassan Kamal         │ At Risk           │  8   │123456║
║  4 │ 30206180209876   │ Hana Ali Youssef          │ Comeback          │  8   │123456║
╠═════════════════════════════════════════════════════════════════════════════════════╣
║  3 │ 30204220214567   │ Sara Khaled Ibrahim       │ Strong            │  6   │123456║
║  3 │ 30208180218765   │ Youssef Adel Mahmoud      │ Attendance Danger │  6   │123456║
║  3 │ 30305120217654   │ Mariam Nasser El-Din      │ Improving         │  6   │123456║
║  3 │ 30409070213456   │ Kareem Samir Abdel-Aziz   │ Struggling        │  6   │123456║
║  3 │ 30502140211111   │ Dina Tarek Mansour        │ Steady Average    │  6   │123456║
╠═════════════════════════════════════════════════════════════════════════════════════╣
║  2 │ 30109100216789   │ Mohamed Omar Al-Ansari    │ Declining         │  4   │123456║
║  2 │ 30603010219876   │ Amr Waleed Ibrahim        │ Top Student       │  4   │123456║
║  2 │ 30706250214321   │ Yasmine Adel Hassan       │ Mixed             │  4   │123456║
║  2 │ 30801180217890   │ Khaled Mohamed Saleh      │ At Risk           │  4   │123456║
║  2 │ 30903220212222   │ Rania Osama Fouad         │ Improving         │  4   │123456║
╠═════════════════════════════════════════════════════════════════════════════════════╣
║  1 │ 31003050219001   │ Hassan Mahmoud El-Sayed   │ Steady Average    │  2   │123456║
║  1 │ 31102150213456   │ Fatma Ahmed Abdel-Aal     │ Strong            │  2   │123456║
║  1 │ 31208010218765   │ Amir Youssef Barakat      │ Attendance Danger │  2   │123456║
║  1 │ 31304180215432   │ Noha Khaled Ibrahim       │ Struggling        │  2   │123456║
║  1 │ 31409270211111   │ Samer Tarek El-Ghandour   │ Comeback          │  2   │123456║
╚═════════════════════════════════════════════════════════════════════════════════════╝
`);
