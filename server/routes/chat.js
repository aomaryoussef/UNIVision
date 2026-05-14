const express = require("express");
const { getDb } = require("../db/database");
const { requireAuth, requireSelf } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use("/:studentId", requireSelf);

// ── Gather student context ────────────────────────────────
function getStudentContext(sid) {
  const db = getDb();
  const profile = db.prepare("SELECT * FROM student_profiles WHERE student_id=?").get(sid);
  const semesters = db.prepare("SELECT * FROM semesters WHERE student_id=? ORDER BY semester_number ASC").all(sid);
  const latestSem = semesters[semesters.length - 1];
  const grades = db.prepare("SELECT * FROM grades WHERE student_id=?").all(sid);
  const attendance = db.prepare("SELECT * FROM attendance WHERE student_id=?").all(sid);
  const overallAtt = db.prepare(
    "SELECT SUM(attended) AS attended, SUM(total) AS total, ROUND(CAST(SUM(attended) AS REAL)/SUM(total)*100) AS percentage FROM attendance WHERE student_id=?"
  ).get(sid);

  const grade = profile?.grade || 1;
  const schedule = db.prepare(
    "SELECT * FROM schedule WHERE semester=? ORDER BY CASE day WHEN 'Sunday' THEN 0 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 END, start_time"
  ).all(grade);

  const feedback = db.prepare(
    "SELECT course_name, doctor_name, body, is_danger, created_at FROM feedback WHERE student_id=? ORDER BY created_at DESC"
  ).all(sid);

  const notifications = db.prepare(
    "SELECT title, body, category, created_at FROM notifications ORDER BY created_at DESC LIMIT 10"
  ).all();

  return {
    profile: profile || {},
    semesters,
    currentGPA: latestSem?.gpa ?? null,
    grades: grades.map(g => ({
      course: g.course_name, grade: g.grade,
      preFinal: g.pre_final, maxPreFinal: g.max_pre_final,
      attendance: [g.att_score, g.att_max],
      midterm: [g.midterm_score, g.midterm_max],
      quiz1: [g.quiz1_score, g.quiz1_max],
      quiz2: [g.quiz2_score, g.quiz2_max],
      danger: !!g.is_danger,
      nextTarget: g.next_target_label ? `Need ${g.next_target_need} more to reach ${g.next_target_label}` : null,
      nextTargetAr: g.next_target_label ? `محتاج ${g.next_target_need} كمان عشان توصل لـ ${g.next_target_label}` : null,
    })),
    attendance: {
      overall: overallAtt,
      courses: attendance.map(a => ({
        course: a.course_name, attended: a.attended,
        total: a.total, percentage: a.percentage, status: a.status,
      })),
    },
    schedule: schedule.map(s => ({
      day: s.day, time: `${s.start_time}–${s.end_time}`,
      course: s.course_name, type: s.type, room: s.room, doctor: s.doctor_name,
    })),
    feedback,
    notifications,
  };
}

// ── Language detection ─────────────────────────────────────
function isArabic(msg) {
  const arabicChars = (msg.match(/[\u0600-\u06FF]/g) || []).length;
  return arabicChars > msg.length * 0.15 || arabicChars >= 2;
}

// ── Day names ─────────────────────────────────────────────
const DAYS_AR = { sunday: "الأحد", monday: "الاثنين", tuesday: "الثلاثاء", wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة", saturday: "السبت" };

// ── Follow-up suggestions per intent ──────────────────────
const FOLLOW_UPS = {
  greeting:      { en: ["📊 My GPA", "📝 My Grades", "📋 Attendance", "📅 Schedule"], ar: ["📊 المعدل التراكمي", "📝 درجاتي", "📋 الحضور", "📅 الجدول"] },
  gpa:           { en: ["📝 Show Grades", "⚠️ Any Warnings?", "💡 Study Tips", "📅 Schedule"], ar: ["📝 عرض الدرجات", "⚠️ في تحذيرات؟", "💡 نصائح", "📅 الجدول"] },
  grades:        { en: ["📊 My GPA", "🏆 Best Course", "📉 Weakest Course", "⚠️ Warnings"], ar: ["📊 المعدل", "🏆 أفضل مادة", "📉 أضعف مادة", "⚠️ التحذيرات"] },
  attendance:    { en: ["📊 My GPA", "📅 Schedule", "⚠️ Warnings", "💡 Tips"], ar: ["📊 المعدل", "📅 الجدول", "⚠️ التحذيرات", "💡 نصائح"] },
  schedule:      { en: ["📝 Grades", "📋 Attendance", "🕐 Next Class", "👤 Profile"], ar: ["📝 الدرجات", "📋 الحضور", "🕐 المحاضرة القادمة", "👤 بياناتي"] },
  next_class:    { en: ["📅 Full Schedule", "📝 Grades", "📋 Attendance", "💡 Tips"], ar: ["📅 الجدول الكامل", "📝 الدرجات", "📋 الحضور", "💡 نصائح"] },
  feedback:      { en: ["📝 Grades", "⚠️ Warnings", "📊 GPA", "💡 Tips"], ar: ["📝 الدرجات", "⚠️ التحذيرات", "📊 المعدل", "💡 نصائح"] },
  notifications: { en: ["📊 GPA", "📅 Schedule", "📝 Grades", "👤 Profile"], ar: ["📊 المعدل", "📅 الجدول", "📝 الدرجات", "👤 بياناتي"] },
  profile:       { en: ["📊 GPA", "📝 Grades", "📅 Schedule", "🏫 University Info"], ar: ["📊 المعدل", "📝 الدرجات", "📅 الجدول", "🏫 معلومات الجامعة"] },
  danger:        { en: ["📝 Grades", "📋 Attendance", "💡 Study Tips", "📊 GPA"], ar: ["📝 الدرجات", "📋 الحضور", "💡 نصائح للمذاكرة", "📊 المعدل"] },
  best_course:   { en: ["📉 Weakest Course", "📊 GPA", "📝 All Grades", "💡 Tips"], ar: ["📉 أضعف مادة", "📊 المعدل", "📝 كل الدرجات", "💡 نصائح"] },
  worst_course:  { en: ["🏆 Best Course", "📊 GPA", "💡 Study Tips", "⚠️ Warnings"], ar: ["🏆 أفضل مادة", "📊 المعدل", "💡 نصائح للمذاكرة", "⚠️ التحذيرات"] },
  tips:          { en: ["📊 GPA", "📝 Grades", "📋 Attendance", "📅 Schedule"], ar: ["📊 المعدل", "📝 الدرجات", "📋 الحضور", "📅 الجدول"] },
  university:    { en: ["📊 GPA", "📝 Grades", "📅 Schedule", "👤 Profile"], ar: ["📊 المعدل", "📝 الدرجات", "📅 الجدول", "👤 بياناتي"] },
  thanks:        { en: ["📊 My GPA", "📝 Grades", "📅 Schedule", "💡 Tips"], ar: ["📊 المعدل", "📝 الدرجات", "📅 الجدول", "💡 نصائح"] },
  bye:           { en: [], ar: [] },
  unknown:       { en: ["📊 My GPA", "📝 Grades", "📋 Attendance", "📅 Schedule"], ar: ["📊 المعدل", "📝 الدرجات", "📋 الحضور", "📅 الجدول"] },
};

// ── Intent matching ───────────────────────────────────────
const INTENTS = [
  { id: "greeting",     patterns: [/^(hi|hello|hey|مرحبا|اهلا|السلام عليكم|صباح|مساء|هاي|هلا)/i] },
  { id: "gpa",          patterns: [/gpa|معدل|تراكمي|cumulative|المعدل/i] },
  { id: "grades",       patterns: [/grade|درجات|درجاتي|marks?|score|نتيجة|نتائج|الدرجات/i] },
  { id: "attendance",   patterns: [/attend|حضور|غياب|absence|absent|الحضور|الغياب/i] },
  { id: "schedule",     patterns: [/schedule|جدول|محاضر|tomorrow|today|class|lecture|ميعاد|الجدول|اليوم|بكرة|غدا/i] },
  { id: "feedback",     patterns: [/feedback|ملاحظ|رأي|doctor.*(say|said|comment)|تعليق|الدكتور/i] },
  { id: "notifications",patterns: [/notif|اشعار|إشعار|announcement|إعلان|news|اخبار|الإشعارات|الاشعارات/i] },
  { id: "profile",      patterns: [/profile|بيانات|معلومات|my name|اسم|id|رقم|email|phone|department|قسم|بياناتي/i] },
  { id: "danger",       patterns: [/danger|risk|warning|خطر|تحذير|fail|رسوب|flagged|تحذيرات|إنذار/i] },
  { id: "tips",         patterns: [/tip|advice|نصيح|improve|تحسين|study|مذاكر|help me|نصائح/i] },
  { id: "best_course",  patterns: [/best.*(course|subject|grade)|أفضل.*ماد|highest.*(score|grade)/i] },
  { id: "worst_course", patterns: [/worst.*(course|subject|grade)|أسوأ|أضعف|lowest.*(score|grade)/i] },
  { id: "next_class",   patterns: [/next.*(class|lecture|session)|القادم|التالي|المحاضرة القادمة/i] },
  { id: "university",   patterns: [/university|eelu|جامعة|كلية|tuition|رسوم|withdraw|انسحاب|probation|إنذار|lms|moodle|الجامعة/i] },
  { id: "thanks",       patterns: [/thank|شكر/i] },
  { id: "bye",          patterns: [/bye|مع السلامة|وداع|سلام$/i] },
];

function detectIntent(message) {
  const msg = message.toLowerCase().trim();
  for (const intent of INTENTS) {
    for (const pat of intent.patterns) {
      if (pat.test(msg)) return intent.id;
    }
  }
  return "unknown";
}

// ── Response generators ───────────────────────────────────
function respond(intent, ctx, message) {
  const p = ctx.profile;
  const ar = isArabic(message);
  const nameEn = p.name_en?.split(" ")[0] || "there";
  const nameAr = p.name_ar?.split(" ")[0] || nameEn;
  const name = ar ? nameAr : nameEn;
  const YEAR_AR = { 1: "السنة الأولى", 2: "السنة الثانية", 3: "السنة الثالثة", 4: "السنة الرابعة" };
  const YEAR_EN = { 1: "Freshman", 2: "Sophomore", 3: "Junior", 4: "Senior" };

  switch (intent) {

    case "greeting": {
      if (ar) {
        return `أهلاً ${name}! 👋\n\nأنا **يوني بوت**، مساعدك الأكاديمي الذكي.\nيمكنني مساعدتك في:\n- 📊 المعدل التراكمي والدرجات\n- 📋 متابعة الحضور والغياب\n- 📅 الجدول الدراسي\n- ⚠️ التحذيرات والمخاطر\n- 💡 نصائح لتحسين أدائك\n- 🏫 معلومات عن الجامعة\n\nاختار من الأزرار أو اكتب سؤالك!`;
      }
      return `Hi ${name}! 👋\n\nI'm **UniBot**, your smart academic assistant.\nI can help you with:\n- 📊 GPA & grades info\n- 📋 Attendance tracking\n- 📅 Class schedule\n- ⚠️ Warnings & risks\n- 💡 Study tips & advice\n- 🏫 University info\n\nPick a button below or type your question!`;
    }

    case "gpa": {
      const gpa = ctx.currentGPA;
      if (gpa == null) return ar ? `لا تتوفر بيانات معدل حالياً يا ${name}.` : `I don't have GPA data for you yet, ${name}.`;

      const trend = ctx.semesters.length >= 2
        ? ctx.semesters[ctx.semesters.length - 1].gpa - ctx.semesters[ctx.semesters.length - 2].gpa
        : 0;
      const trendIcon = trend > 0 ? "📈" : trend < 0 ? "📉" : "➡️";

      if (ar) {
        const trendText = trend > 0
          ? `ارتفع بمقدار **${trend.toFixed(2)}** عن الفصل السابق! ممتاز!`
          : trend < 0
          ? `انخفض بمقدار **${Math.abs(trend).toFixed(2)}** عن الفصل السابق. لازم نشتغل على تحسينه.`
          : "نفس الفصل السابق.";

        let status = "";
        if (gpa >= 3.5) status = "🌟 **ممتاز** — أنت من أفضل الطلاب!";
        else if (gpa >= 3.0) status = "✅ **جيد جداً** — أداء قوي، استمر!";
        else if (gpa >= 2.5) status = "👍 **جيد** — فيه مجال للتحسين لكن أداؤك كويس.";
        else if (gpa >= 2.0) status = "⚠️ **مقبول** — محتاج تركز أكثر على دراستك.";
        else status = "🚨 **حرج** — ممكن تتعرض لإنذار أكاديمي!";

        let history = "**سجل المعدل:**\n";
        ctx.semesters.forEach(s => {
          const bar = "█".repeat(Math.round(s.gpa)) + "░".repeat(4 - Math.round(s.gpa));
          history += `- ${s.label || "الفصل " + s.semester_number}: **${s.gpa?.toFixed(2)}** ${bar}\n`;
        });

        return `**معدلك التراكمي: ${gpa.toFixed(2)}** ${trendIcon}\n\n${status}\n\n${trendText}\n\n${history}`;
      }

      // English
      const trendText = trend > 0
        ? `Up by **${trend.toFixed(2)}** from last semester! Great job!`
        : trend < 0
        ? `Down by **${Math.abs(trend).toFixed(2)}** from last semester. Let's work on improving it.`
        : "Same as last semester.";

      let status = "";
      if (gpa >= 3.5) status = "🌟 **Excellent** — You're among the top performers!";
      else if (gpa >= 3.0) status = "✅ **Very Good** — Solid performance, keep it up!";
      else if (gpa >= 2.5) status = "👍 **Good** — Room for improvement but you're doing fine.";
      else if (gpa >= 2.0) status = "⚠️ **Fair** — You should focus more on your studies.";
      else status = "🚨 **Critical** — You may be at risk of academic probation!";

      let history = "**GPA History:**\n";
      ctx.semesters.forEach(s => {
        const bar = "█".repeat(Math.round(s.gpa)) + "░".repeat(4 - Math.round(s.gpa));
        history += `- ${s.label || "Sem " + s.semester_number}: **${s.gpa?.toFixed(2)}** ${bar}\n`;
      });

      return `**Your Current GPA: ${gpa.toFixed(2)}** ${trendIcon}\n\n${status}\n\n${trendText}\n\n${history}`;
    }

    case "grades": {
      if (!ctx.grades.length) return ar ? `لا توجد درجات متاحة حالياً يا ${name}.` : `No grades available yet, ${name}.`;

      if (ar) {
        let reply = `**درجاتك الحالية:**\n\n`;
        ctx.grades.forEach(g => {
          const pct = g.maxPreFinal ? Math.round(g.preFinal / g.maxPreFinal * 100) : 0;
          const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
          const flag = g.danger ? " 🚨 **محذّر**" : "";
          reply += `**${g.course}**${flag}\n`;
          reply += `- التقدير: **${g.grade || "لم يحدد"}** | قبل النهائي: **${g.preFinal}/${g.maxPreFinal}** (${pct}%) ${bar}\n`;
          reply += `- ميدتيرم: ${g.midterm[0]}/${g.midterm[1]} | كويز ١: ${g.quiz1[0]}/${g.quiz1[1]} | كويز ٢: ${g.quiz2[0]}/${g.quiz2[1]}\n`;
          if (g.nextTargetAr) reply += `- 🎯 ${g.nextTargetAr}\n`;
          reply += "\n";
        });
        return reply;
      }

      let reply = `**Your Current Grades:**\n\n`;
      ctx.grades.forEach(g => {
        const pct = g.maxPreFinal ? Math.round(g.preFinal / g.maxPreFinal * 100) : 0;
        const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
        const flag = g.danger ? " 🚨 **FLAGGED**" : "";
        reply += `**${g.course}**${flag}\n`;
        reply += `- Grade: **${g.grade || "Pending"}** | Pre-Final: **${g.preFinal}/${g.maxPreFinal}** (${pct}%) ${bar}\n`;
        reply += `- Midterm: ${g.midterm[0]}/${g.midterm[1]} | Quiz 1: ${g.quiz1[0]}/${g.quiz1[1]} | Quiz 2: ${g.quiz2[0]}/${g.quiz2[1]}\n`;
        if (g.nextTarget) reply += `- 🎯 ${g.nextTarget}\n`;
        reply += "\n";
      });
      return reply;
    }

    case "attendance": {
      const ov = ctx.attendance.overall;
      if (!ov) return ar ? `لا توجد بيانات حضور حالياً يا ${name}.` : `No attendance data available yet, ${name}.`;

      if (ar) {
        let reply = `**نسبة الحضور الإجمالية: ${ov.percentage}%** (${ov.attended}/${ov.total} محاضرة)\n\n`;
        if (ov.percentage >= 90) reply += "🌟 حضور ممتاز! استمر كده!\n\n";
        else if (ov.percentage >= 75) reply += "✅ حضور جيد. حافظ على الاستمرارية.\n\n";
        else if (ov.percentage >= 60) reply += "⚠️ حضورك تحت الحد الآمن (٧٥%). حاول تحضر أكتر.\n\n";
        else reply += "🚨 **خطير!** أنت في خطر الرسوب بسبب الغياب الكتير!\n\n";

        reply += "**لكل مادة:**\n";
        ctx.attendance.courses.forEach(a => {
          const icon = a.status === "danger" ? "🔴" : a.status === "warning" ? "🟡" : "🟢";
          reply += `${icon} **${a.course}**: ${a.percentage}% (${a.attended}/${a.total})\n`;
        });
        return reply;
      }

      let reply = `**Overall Attendance: ${ov.percentage}%** (${ov.attended}/${ov.total} classes)\n\n`;
      if (ov.percentage >= 90) reply += "🌟 Excellent attendance! Keep it up!\n\n";
      else if (ov.percentage >= 75) reply += "✅ Good attendance. Stay consistent.\n\n";
      else if (ov.percentage >= 60) reply += "⚠️ Your attendance is below the safe zone (75%). Try to attend more classes.\n\n";
      else reply += "🚨 **Critical!** You're at serious risk of failing due to low attendance!\n\n";

      reply += "**Per Course:**\n";
      ctx.attendance.courses.forEach(a => {
        const icon = a.status === "danger" ? "🔴" : a.status === "warning" ? "🟡" : "🟢";
        reply += `${icon} **${a.course}**: ${a.percentage}% (${a.attended}/${a.total})\n`;
      });
      return reply;
    }

    case "schedule": {
      if (!ctx.schedule.length) return ar ? `لا يوجد جدول متاح يا ${name}.` : `No schedule data available, ${name}.`;

      const msg = message.toLowerCase();
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = new Date();
      let filterDay = null;

      if (/today|اليوم/.test(msg)) filterDay = days[today.getDay()];
      else if (/tomorrow|غدا|بكرة/.test(msg)) filterDay = days[(today.getDay() + 1) % 7];
      else { for (const d of days) { if (msg.includes(d)) { filterDay = d; break; } } }

      let classes = ctx.schedule;

      if (filterDay) {
        classes = ctx.schedule.filter(s => s.day.toLowerCase() === filterDay);
        const dayLabel = ar ? (DAYS_AR[filterDay] || filterDay) : filterDay.charAt(0).toUpperCase() + filterDay.slice(1);
        const label = ar ? `**جدول يوم ${dayLabel}:**\n\n` : `**Schedule for ${dayLabel}:**\n\n`;
        if (!classes.length) return ar ? `${label}مفيش محاضرات! استمتع بوقتك 😊` : `${label}No classes scheduled! Enjoy your free time. 😊`;
      }

      const grouped = {};
      classes.forEach(s => { if (!grouped[s.day]) grouped[s.day] = []; grouped[s.day].push(s); });

      let reply = ar
        ? (filterDay ? `**جدول يوم ${DAYS_AR[filterDay] || filterDay}:**\n\n` : "**الجدول الأسبوعي:**\n\n")
        : (filterDay ? `**Schedule for ${filterDay.charAt(0).toUpperCase() + filterDay.slice(1)}:**\n\n` : "**Your Weekly Schedule:**\n\n");

      for (const [day, slots] of Object.entries(grouped)) {
        const dayLabel = ar ? (DAYS_AR[day.toLowerCase()] || day) : day;
        reply += `📅 **${dayLabel}**\n`;
        slots.forEach(s => {
          if (ar) {
            reply += `- 🕐 ${s.time} — **${s.course}** (${s.type === "Lecture" ? "محاضرة" : "سكشن"})\n  📍 قاعة ${s.room} | 👨‍🏫 د. ${s.doctor}\n`;
          } else {
            reply += `- 🕐 ${s.time} — **${s.course}** (${s.type})\n  📍 Room ${s.room} | 👨‍🏫 ${s.doctor}\n`;
          }
        });
        reply += "\n";
      }
      return reply;
    }

    case "next_class": {
      if (!ctx.schedule.length) return ar ? "لا يوجد جدول متاح." : "No schedule data available.";
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
      const now = new Date();
      const currentDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const todayClasses = ctx.schedule.filter(s => s.day.toLowerCase() === currentDay && s.time.split("–")[0] > currentTime);
      if (todayClasses.length) {
        const next = todayClasses[0];
        if (ar) return `**محاضرتك القادمة اليوم:**\n\n🕐 **${next.time}** — **${next.course}** (${next.type === "Lecture" ? "محاضرة" : "سكشن"})\n📍 قاعة ${next.room} | 👨‍🏫 د. ${next.doctor}`;
        return `**Your next class today:**\n\n🕐 **${next.time}** — **${next.course}** (${next.type})\n📍 Room ${next.room} | 👨‍🏫 ${next.doctor}`;
      }

      const dayIndex = days.indexOf(currentDay);
      for (let i = 1; i <= 7; i++) {
        const checkDay = days[(dayIndex + i) % 5];
        if (!checkDay) continue;
        const classes = ctx.schedule.filter(s => s.day.toLowerCase() === checkDay);
        if (classes.length) {
          const next = classes[0];
          const dayAr = DAYS_AR[checkDay] || checkDay;
          if (ar) return `**مفيش محاضرات تاني اليوم.** محاضرتك الجاية:\n\n📅 **${dayAr}** 🕐 ${next.time}\n**${next.course}** (${next.type === "Lecture" ? "محاضرة" : "سكشن"})\n📍 قاعة ${next.room} | 👨‍🏫 د. ${next.doctor}`;
          return `**No more classes today.** Your next class is:\n\n📅 **${next.day}** 🕐 ${next.time}\n**${next.course}** (${next.type})\n📍 Room ${next.room} | 👨‍🏫 ${next.doctor}`;
        }
      }
      return ar ? "مقدرتش ألاقي محاضرات قادمة في جدولك." : "I couldn't find any upcoming classes in your schedule.";
    }

    case "feedback": {
      if (!ctx.feedback.length) return ar
        ? `مفيش ملاحظات من الدكاترة لحد دلوقتي يا ${name}. وده عادةً علامة كويسة! 😊`
        : `No doctor feedback recorded yet, ${name}. That's usually a good sign! 😊`;

      let reply = ar ? "**ملاحظات الدكاترة:**\n\n" : "**Doctor Feedback:**\n\n";
      ctx.feedback.forEach(f => {
        const icon = f.is_danger ? "🚨" : "💬";
        reply += `${icon} **${f.course_name}** — ${ar ? "د." : "by"} *${f.doctor_name}*\n> "${f.body}"\n\n`;
      });
      return reply;
    }

    case "notifications": {
      if (!ctx.notifications.length) return ar ? "مفيش إشعارات حالياً." : "No recent notifications.";
      const ICONS = { day_off: "🏖️", lecture_cancelled: "🚫", event: "🎉", holiday: "🌴", exam: "📝", general: "📢" };
      let reply = ar ? "**آخر الإشعارات:**\n\n" : "**Recent Notifications:**\n\n";
      ctx.notifications.forEach(n => {
        const icon = ICONS[n.category] || "📢";
        reply += `${icon} **${n.title}**\n${n.body}\n\n`;
      });
      return reply;
    }

    case "profile": {
      if (ar) {
        return `**بياناتك الشخصية:**\n\n- **الاسم:** ${p.name_ar || p.name_en} (${p.name_en})\n- **رقم الطالب:** ${p.student_id}\n- **الرقم القومي:** ${p.national_id || "—"}\n- **السنة:** ${YEAR_AR[p.grade] || p.grade}\n- **القسم:** ${p.department || "—"}\n- **الإيميل:** ${p.email || "—"}\n- **الموبايل:** ${p.phone || "—"}\n- **المعدل التراكمي:** ${ctx.currentGPA?.toFixed(2) ?? "—"}`;
      }
      return `**Your Profile:**\n\n- **Name:** ${p.name_en} (${p.name_ar || "—"})\n- **Student ID:** ${p.student_id}\n- **National ID:** ${p.national_id || "—"}\n- **Year:** ${p.grade} (${YEAR_EN[p.grade] || "—"})\n- **Department:** ${p.department || "—"}\n- **Email:** ${p.email || "—"}\n- **Phone:** ${p.phone || "—"}\n- **Current GPA:** ${ctx.currentGPA?.toFixed(2) ?? "—"}`;
    }

    case "danger": {
      const dangerCourses = ctx.grades.filter(g => g.danger);
      const lowAtt = ctx.attendance.courses.filter(a => a.status === "danger" || a.percentage < 60);
      const lowGPA = ctx.currentGPA != null && ctx.currentGPA < 2.0;

      if (!dangerCourses.length && !lowAtt.length && !lowGPA) {
        return ar
          ? `أخبار حلوة يا ${name}! 🎉 **مفيش تحذيرات أو مخاطر حالياً.** استمر كده!`
          : `Great news, ${name}! 🎉 You have **no active warnings or risks**. Keep up the good work!`;
      }

      let reply = ar ? `**⚠️ ملخص المخاطر يا ${name}:**\n\n` : `**⚠️ Risk Summary for ${name}:**\n\n`;
      if (lowGPA) {
        reply += ar
          ? `🚨 **تنبيه المعدل:** معدلك **${ctx.currentGPA.toFixed(2)}** — تحت ٢.٠. ممكن تتعرض لإنذار أكاديمي.\n\n`
          : `🚨 **GPA Alert:** Your GPA is **${ctx.currentGPA.toFixed(2)}** — below 2.0. You may face academic probation.\n\n`;
      }
      if (dangerCourses.length) {
        reply += ar ? `🚨 **مواد محذّرة (${dangerCourses.length}):**\n` : `🚨 **Flagged Courses (${dangerCourses.length}):**\n`;
        dangerCourses.forEach(g => {
          reply += ar
            ? `- **${g.course}** — التقدير: ${g.grade || "لم يحدد"}, قبل النهائي: ${g.preFinal}/${g.maxPreFinal}\n`
            : `- **${g.course}** — Grade: ${g.grade || "Pending"}, Pre-Final: ${g.preFinal}/${g.maxPreFinal}\n`;
        });
        reply += "\n";
      }
      if (lowAtt.length) {
        reply += ar ? `🔴 **حضور حرج (${lowAtt.length}):**\n` : `🔴 **Critical Attendance (${lowAtt.length}):**\n`;
        lowAtt.forEach(a => { reply += `- **${a.course}**: ${a.percentage}% (${a.attended}/${a.total})\n`; });
        reply += "\n";
      }
      reply += ar
        ? "💡 **نصيحة:** احضر كل المحاضرات المتبقية واطلب مساعدة من دكاترتك."
        : "💡 **Tip:** Attend all remaining classes and seek help from your professors.";
      return reply;
    }

    case "best_course": {
      if (!ctx.grades.length) return ar ? "لا توجد درجات متاحة حالياً." : "No grades data available yet.";
      const sorted = [...ctx.grades].sort((a, b) => {
        return (b.maxPreFinal ? b.preFinal / b.maxPreFinal : 0) - (a.maxPreFinal ? a.preFinal / a.maxPreFinal : 0);
      });
      const best = sorted[0];
      const pct = best.maxPreFinal ? Math.round(best.preFinal / best.maxPreFinal * 100) : 0;
      if (ar) return `🌟 **أفضل مادة عندك:** **${best.course}**\n\n- التقدير: **${best.grade || "لم يحدد"}**\n- درجة قبل النهائي: **${best.preFinal}/${best.maxPreFinal}** (${pct}%)\n\nشغل عظيم يا ${name}!`;
      return `🌟 **Your best course:** **${best.course}**\n\n- Grade: **${best.grade || "Pending"}**\n- Pre-Final Score: **${best.preFinal}/${best.maxPreFinal}** (${pct}%)\n\nGreat work on this one, ${name}!`;
    }

    case "worst_course": {
      if (!ctx.grades.length) return ar ? "لا توجد درجات متاحة حالياً." : "No grades data available yet.";
      const sorted = [...ctx.grades].sort((a, b) => {
        return (a.maxPreFinal ? a.preFinal / a.maxPreFinal : 0) - (b.maxPreFinal ? b.preFinal / b.maxPreFinal : 0);
      });
      const worst = sorted[0];
      const pct = worst.maxPreFinal ? Math.round(worst.preFinal / worst.maxPreFinal * 100) : 0;
      if (ar) {
        let reply = `📉 **أضعف مادة عندك:** **${worst.course}**\n\n- التقدير: **${worst.grade || "لم يحدد"}**\n- درجة قبل النهائي: **${worst.preFinal}/${worst.maxPreFinal}** (${pct}%)\n`;
        if (worst.nextTargetAr) reply += `- 🎯 ${worst.nextTargetAr}\n`;
        reply += `\nمتقلقش يا ${name} — ركز على المادة دي وهتقدر تحسنها!`;
        return reply;
      }
      let reply = `📉 **Your weakest course:** **${worst.course}**\n\n- Grade: **${worst.grade || "Pending"}**\n- Pre-Final Score: **${worst.preFinal}/${worst.maxPreFinal}** (${pct}%)\n`;
      if (worst.nextTarget) reply += `- 🎯 ${worst.nextTarget}\n`;
      reply += `\nDon't worry, ${name} — focus on this course and you can turn it around!`;
      return reply;
    }

    case "tips": {
      if (ar) {
        const tips = [];
        const lowAttCourses = ctx.attendance.courses.filter(a => a.percentage < 75);
        if (lowAttCourses.length) tips.push(`📋 **حسّن حضورك** في: ${lowAttCourses.map(a => a.course).join("، ")}. الهدف ٧٥%+.`);
        const dangerGrades = ctx.grades.filter(g => g.danger);
        if (dangerGrades.length) tips.push(`📚 **ركز على المواد المحذّرة:** ${dangerGrades.map(g => g.course).join("، ")}. اطلب مساعدة من الدكتور.`);
        if (ctx.currentGPA != null && ctx.currentGPA < 2.5) tips.push("📖 **جدول مذاكرة:** اعمل خطة أسبوعية وخصص وقت أكتر للمواد الضعيفة.");
        tips.push(
          "🕐 **إدارة الوقت:** استخدم تقنية بومودورو — ٢٥ دقيقة مذاكرة، ٥ دقائق راحة.",
          "👥 **مجموعات دراسية:** انضم أو كوّن مجموعة دراسية للمواد الصعبة.",
          "📝 **امتحانات سابقة:** تدرب على امتحانات السنين اللي فاتت.",
          "💤 **نام كويس:** ٧-٨ ساعات نوم، خصوصاً قبل الامتحانات.",
          "❓ **اسأل:** متتكسفش تسأل دكاترتك في الساعات المكتبية.",
        );
        return `**نصائح للمذاكرة يا ${name}:**\n\n${tips.map(t => `- ${t}`).join("\n")}`;
      }

      const tips = [];
      const lowAttCourses = ctx.attendance.courses.filter(a => a.percentage < 75);
      if (lowAttCourses.length) tips.push(`📋 **Improve attendance** in: ${lowAttCourses.map(a => a.course).join(", ")}. Aim for 75%+.`);
      const dangerGrades = ctx.grades.filter(g => g.danger);
      if (dangerGrades.length) tips.push(`📚 **Focus on flagged courses:** ${dangerGrades.map(g => g.course).join(", ")}. Ask your professor for extra help.`);
      if (ctx.currentGPA != null && ctx.currentGPA < 2.5) tips.push("📖 **Study schedule:** Create a weekly plan allocating more time to weaker subjects.");
      tips.push(
        "🕐 **Time management:** Use the Pomodoro technique — 25 min study, 5 min break.",
        "👥 **Study groups:** Join or create study groups for difficult courses.",
        "📝 **Past exams:** Practice with previous years' exam papers.",
        "💤 **Rest well:** Get 7-8 hours of sleep, especially before exams.",
        "❓ **Ask questions:** Don't hesitate to reach out to your professors during office hours.",
      );
      return `**Study Tips for ${name}:**\n\n${tips.map(t => `- ${t}`).join("\n")}`;
    }

    case "university": {
      if (ar) {
        return `**جامعة مصر للتعليم الإلكتروني (EELU) — معلومات سريعة:**\n
- 📅 **السنة الدراسية:** خريف (سبتمبر–يناير)، ربيع (فبراير–يونيو)، صيفي اختياري
- 📊 **نظام التقديرات:** A+ (٤.٠) → F (٠.٠)
- 📋 **الحد الأدنى للحضور:** ٧٥% لكل مادة. أقل من ٦٠% = خطر رسوب
- ⚠️ **الإنذار الأكاديمي:** معدل أقل من ٢.٠ لفصلين متتاليين
- 🚪 **سحب المواد:** قبل الميدتيرم بدون عقوبة
- 💰 **المصاريف:** بالساعة المعتمدة
- 🏫 **مراكز الدراسة:** القاهرة، الإسكندرية، أسيوط، وأكتر
- 💻 **نظام التعليم:** منصة Moodle للمحتوى والواجبات والكويزات
- 📞 **الدعم:** شئون الطلاب، الدعم الفني، الإرشاد الأكاديمي

محتاج تفاصيل أكتر عن أي حاجة؟ اسألني!`;
      }
      return `**Egyptian E-Learning University (EELU) — Quick Info:**\n
- 📅 **Academic Year:** Fall (Sep–Jan), Spring (Feb–Jun), optional Summer
- 📊 **Grading Scale:** A+ (4.0) → F (0.0)
- 📋 **Min Attendance:** 75% per course. Below 60% = fail risk
- ⚠️ **Academic Probation:** GPA below 2.0 for 2 consecutive semesters
- 🚪 **Course Withdrawal:** Before midterm, no penalty
- 💰 **Tuition:** Paid per credit hour
- 🏫 **Study Centers:** Cairo, Alexandria, Assiut, and more
- 💻 **LMS:** Moodle-based (course materials, assignments, quizzes)
- 📞 **Support:** Student Affairs, IT Support, Academic Advising

Need details on any of these? Just ask!`;
    }

    case "thanks": {
      if (ar) {
        const r = ["العفو يا " + name + "! 😊 دايماً في الخدمة.", "أي وقت يا " + name + "! بالتوفيق في دراستك! 🍀", "تحت أمرك يا " + name + "! لو محتاج أي حاجة تاني اسألني."];
        return r[Math.floor(Math.random() * r.length)];
      }
      const r = [`You're welcome, ${name}! 😊 Happy to help anytime.`, `Glad I could help, ${name}! Don't hesitate to ask again.`, `Anytime, ${name}! Good luck with your studies! 🍀`];
      return r[Math.floor(Math.random() * r.length)];
    }

    case "bye": {
      if (ar) return `مع السلامة يا ${name}! 👋 بالتوفيق في دراستك. أنا هنا دايماً لو محتاجني!`;
      return `Goodbye, ${name}! 👋 Good luck with your studies. I'm always here when you need me!`;
    }

    default: {
      if (ar) {
        return `مش متأكد إني فاهم سؤالك يا ${name}. أقدر أساعدك في:\n\n- 📊 **"المعدل"** — المعدل التراكمي\n- 📝 **"درجاتي"** — كل درجات المواد\n- 📋 **"الحضور"** — نسبة الحضور\n- 📅 **"الجدول"** أو **"جدول اليوم"** — الجدول الدراسي\n- ⚠️ **"تحذيرات"** — التنبيهات والمخاطر\n- 🏆 **"أفضل مادة"** / **"أضعف مادة"**\n- 💡 **"نصائح"** — نصائح للمذاكرة\n- 👤 **"بياناتي"** — معلوماتك الشخصية\n- 📢 **"الإشعارات"** — آخر الإعلانات\n- 🏫 **"الجامعة"** — معلومات عن الجامعة\n\nجرب واحدة من دول!`;
      }
      return `I'm not sure I understand that, ${name}. Here's what I can help with:\n\n- 📊 **"My GPA"** — View your GPA and trend\n- 📝 **"My grades"** — See all course grades\n- 📋 **"Attendance"** — Check your attendance\n- 📅 **"Schedule"** or **"Schedule today"** — View your timetable\n- ⚠️ **"Any warnings?"** — Check risk alerts\n- 🏆 **"Best course"** / **"Worst course"**\n- 💡 **"Study tips"** — Get personalized advice\n- 👤 **"My profile"** — View your info\n- 📢 **"Notifications"** — Recent announcements\n- 🏫 **"University info"** — EELU policies & info\n\nTry one of these!`;
    }
  }
}

// ── Chat endpoint ─────────────────────────────────────────
router.post("/:studentId/chat", (req, res) => {
  const { messages } = req.body;
  if (!messages || !messages.length) {
    return res.status(400).json({ error: "Messages required" });
  }

  try {
    const ctx = getStudentContext(req.params.studentId);
    const lastMessage = messages[messages.length - 1].content;
    const intent = detectIntent(lastMessage);
    const ar = isArabic(lastMessage);
    const reply = respond(intent, ctx, lastMessage);
    const followUps = (FOLLOW_UPS[intent] || FOLLOW_UPS.unknown)[ar ? "ar" : "en"];
    res.json({ reply, followUps, lang: ar ? "ar" : "en" });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

module.exports = router;
