/**
 * take-screenshots.js
 * Takes screenshots of every page in the UniVision application
 * using Puppeteer, then generates a Word document with descriptions.
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} = require("docx");

const BASE_URL = "http://localhost:3001";
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// Credentials
const STUDENT_ID = "30012151012341";
const DOCTOR_ID = "29803050202394";
const ADMIN_ID = "29803050202395";
const PASSWORD = "123456";

// ─── Page definitions ───────────────────────────────────────────────

const PUBLIC_PAGES = [
  {
    name: "Landing Page",
    url: "/",
    filename: "01_landing_page.png",
    description:
      "The public landing page of UniVision. It provides an overview of the platform's features and serves as the entry point for all users. It showcases the system capabilities and provides navigation to the login page.",
  },
  {
    name: "Login Page",
    url: "/login",
    filename: "02_login_page.png",
    description:
      "The login page where students, doctors, and administrators authenticate using their National ID and password. It provides secure access to the system with role-based redirection after successful authentication.",
  },
];

const STUDENT_PAGES = [
  {
    name: "Student Home / Dashboard",
    url: "/home.html",
    filename: "03_student_home.png",
    description:
      "The student dashboard displays an overview of the student's academic status including cumulative GPA, current semester performance, today's schedule, recent notifications, and activity summary. It serves as the central hub for student navigation.",
  },
  {
    name: "Grades Page",
    url: "/grades.html",
    filename: "04_student_grades.png",
    description:
      "The grades page shows detailed grade breakdowns for each course the student is enrolled in. It displays midterm, assignments, practical, and final exam scores along with the course instructor information and overall course grade.",
  },
  {
    name: "Attendance Page",
    url: "/attendance.html",
    filename: "05_student_attendance.png",
    description:
      "The attendance tracking page displays the student's attendance record for each course. It shows attendance percentage, number of absences, and warnings when attendance drops below acceptable thresholds.",
  },
  {
    name: "Performance Comparison",
    url: "/comparison.html",
    filename: "06_student_comparison.png",
    description:
      "The performance comparison page allows students to compare their academic performance (GPA, attendance, grades) against class averages and peer rankings. It provides visual charts and statistics to help students understand their relative standing.",
  },
  {
    name: "Academic Reports",
    url: "/reports.html",
    filename: "07_student_reports.png",
    description:
      "The reports page provides access to detailed academic reports for each semester. Students can view comprehensive semester summaries including GPA, course results, and can download/export these reports for their records.",
  },
  {
    name: "Class Schedule",
    url: "/schedule.html",
    filename: "08_student_schedule.png",
    description:
      "The schedule page displays the student's weekly class timetable. It shows course names, times, locations, and days for all enrolled courses in the current semester in a clear, organized format.",
  },
  {
    name: "GPA Simulator",
    url: "/simulator.html",
    filename: "09_student_simulator.png",
    description:
      "The GPA simulator allows students to plan their academic goals by simulating different grade scenarios. Students can input expected grades for current courses to predict their semester and cumulative GPA outcomes.",
  },
  {
    name: "Course Materials",
    url: "/materials.html",
    filename: "10_student_materials.png",
    description:
      "The course materials page provides access to learning resources uploaded by instructors. It includes lecture notes, PDFs, video links, and other educational materials organized by course for easy access.",
  },
  {
    name: "CV / Work Section",
    url: "/work.html",
    filename: "11_student_work.png",
    description:
      "The CV/Work section allows students to build and maintain their professional profile. Students can add their skills, experience, projects, and achievements to create a comprehensive curriculum vitae within the platform.",
  },
  {
    name: "Student Profile",
    url: "/profile.html",
    filename: "12_student_profile.png",
    description:
      "The profile page displays the student's personal and academic information including name, national ID, department, enrollment year, contact details, and allows students to manage their account settings.",
  },
];

// Doctor pages are captured via navigation within the single-page dashboard
const DOCTOR_PAGES = [
  {
    name: "Doctor Dashboard - Students List",
    filename: "13_doctor_students_list.png",
    description:
      "The doctor's main dashboard view showing a list of all students. Doctors can search, filter by grade level, and select any student to view their detailed academic records, manage grades, attendance, and provide feedback.",
  },
  {
    name: "Doctor Dashboard - Student Grades Tab",
    filename: "14_doctor_student_grades.png",
    description:
      "The grades management tab within the doctor dashboard. After selecting a student, doctors can view all their grades across semesters, add new grades, edit existing grades, and see detailed breakdowns of midterm, practical, assignments, and final exam scores.",
  },
  {
    name: "Doctor Dashboard - Student Attendance Tab",
    filename: "15_doctor_student_attendance.png",
    description:
      "The attendance management tab within the doctor dashboard. Doctors can view a student's attendance records per course, mark attendance, update records, and monitor absence patterns to identify students at risk.",
  },
  {
    name: "Doctor Dashboard - Student Feedback Tab",
    filename: "16_doctor_student_feedback.png",
    description:
      "The feedback tab within the doctor dashboard. Doctors can send personalized feedback to students about their academic performance, provide encouragement, suggestions, or warnings. Previous feedback messages are displayed in a conversation-style format.",
  },
  {
    name: "Doctor Dashboard - Schedule Management",
    filename: "17_doctor_schedule.png",
    description:
      "The schedule management section where doctors can view and manage the class schedule for each semester. They can add new lecture entries, edit times/locations, and organize the weekly timetable for their courses.",
  },
  {
    name: "Doctor Dashboard - Course Materials Management",
    filename: "18_doctor_materials.png",
    description:
      "The course materials management section where doctors can upload and manage learning resources. They can add links to lecture notes, PDFs, videos, and other educational materials organized by course for students to access.",
  },
];

const ADMIN_PAGES = [
  {
    name: "Admin Dashboard - Notifications Management",
    filename: "19_admin_notifications.png",
    description:
      "The notifications management section available only to administrators. Admins can create system-wide announcements, send targeted notifications to specific grade levels or all students, and manage existing notifications.",
  },
  {
    name: "Admin Dashboard - Add Student",
    filename: "20_admin_add_student.png",
    description:
      "The add student modal available only to administrators. Admins can register new students into the system by providing their national ID, name, department, grade level, and initial credentials.",
  },
];

// ─── Helper functions ───────────────────────────────────────────────

async function loginViaAPI(page, role, id, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  
  const result = await page.evaluate(async (apiBase, role, id, password) => {
    const res = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, id, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("uv_token", data.token);
      return { ok: true, token: data.token };
    }
    return { ok: false, error: data.error };
  }, BASE_URL, role, id, password);

  if (!result.ok) {
    console.error(`  ✗ Login failed for ${role}/${id}: ${result.error}`);
    return false;
  }
  
  console.log(`  ✓ Logged in as ${role} (${id})`);
  return true;
}

async function logout(page) {
  await page.evaluate(async (apiBase) => {
    await fetch(`${apiBase}/api/auth/logout`, { method: "POST" });
    localStorage.removeItem("uv_token");
    localStorage.clear();
  }, BASE_URL);
}

async function takeScreenshot(page, filename) {
  const filePath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  ✓ ${filename}`);
  return filePath;
}

async function takePageScreenshot(page, url, filename) {
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 4000));
    return await takeScreenshot(page, filename);
  } catch (err) {
    console.error(`  ✗ Failed: ${filename} - ${err.message}`);
    return null;
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("Starting screenshot capture...\n");
  
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1920, height: 1080 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // ── 1. Public pages ──
  console.log("PUBLIC PAGES:");
  for (const pg of PUBLIC_PAGES) {
    await takePageScreenshot(page, pg.url, pg.filename);
  }

  // ── 2. Student pages ──
  console.log("\nSTUDENT PAGES:");
  const studentLoggedIn = await loginViaAPI(page, "student", STUDENT_ID, PASSWORD);
  if (studentLoggedIn) {
    for (const pg of STUDENT_PAGES) {
      await takePageScreenshot(page, pg.url, pg.filename);
    }
  }

  // ── 3. Doctor pages ──
  console.log("\nDOCTOR PAGES:");
  await logout(page);
  const doctorLoggedIn = await loginViaAPI(page, "doctor", DOCTOR_ID, PASSWORD);
  if (doctorLoggedIn) {
    // Navigate to doctor dashboard
    await page.goto(`${BASE_URL}/doctor.html`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 5000));

    // Screenshot 1: Students list (default view)
    await takeScreenshot(page, "13_doctor_students_list.png");

    // Click on first student in the list
    await page.evaluate(() => {
      const studentItem = document.querySelector(".student-item");
      if (studentItem) studentItem.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Screenshot 2: Grades tab (default after selecting student)
    await page.evaluate(() => {
      const gradesTab = document.querySelector('[data-tab="grades"]');
      if (gradesTab) gradesTab.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, "14_doctor_student_grades.png");

    // Screenshot 3: Attendance tab
    await page.evaluate(() => {
      const attTab = document.querySelector('[data-tab="attendance"]');
      if (attTab) attTab.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, "15_doctor_student_attendance.png");

    // Screenshot 4: Feedback tab
    await page.evaluate(() => {
      const fbTab = document.querySelector('[data-tab="feedback"]');
      if (fbTab) fbTab.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, "16_doctor_student_feedback.png");

    // Screenshot 5: Schedule section (click nav link)
    await page.click("#navScheduleLink");
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot(page, "17_doctor_schedule.png");

    // Screenshot 6: Materials section (nav item is hidden by default, show it first)
    await page.evaluate(() => {
      // Make materials nav visible and trigger the view switch
      const navItem = document.getElementById("navItemMaterials");
      if (navItem) navItem.style.display = "";
      const link = document.getElementById("navMaterialsLink");
      if (link) link.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot(page, "18_doctor_materials.png");
  }

  // ── 4. Admin pages ──
  console.log("\nADMIN PAGES:");
  await logout(page);
  const adminLoggedIn = await loginViaAPI(page, "admin", ADMIN_ID, PASSWORD);
  if (adminLoggedIn) {
    // Navigate to doctor/admin dashboard
    await page.goto(`${BASE_URL}/doctor.html`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 5000));

    // Screenshot 7: Notifications section (admin only)
    // The navItemNotifications should be visible for admin
    await page.click("#navNotificationsLink");
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot(page, "19_admin_notifications.png");

    // Screenshot 8: Add Student modal (admin only)
    // Go back to dashboard view first
    await page.click("#navDashboardLink");
    await new Promise(r => setTimeout(r, 2000));
    
    // Click the Add Student button
    await page.click("#addStudentBtn");
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, "20_admin_add_student.png");
  }

  await browser.close();
  console.log("\nAll screenshots captured!\n");

  // Generate Word document
  await generateWordDoc();
}

// ─── Word Document Generation ───────────────────────────────────────

async function generateWordDoc() {
  console.log("Generating Word document...\n");
  
  const allPages = [...PUBLIC_PAGES, ...STUDENT_PAGES, ...DOCTOR_PAGES, ...ADMIN_PAGES];
  const sections = [];

  // Title page
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000 },
      children: [
        new TextRun({
          text: "UniVision",
          bold: true,
          size: 72,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: "Application Screenshots & Page Descriptions",
          size: 36,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: "University Student Portal System",
          size: 28,
          font: "Calibri",
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000 },
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
          size: 24,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // Table of contents
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Table of Contents", bold: true })],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] })
  );

  // Group headers
  const groups = [
    { title: "Public Pages", pages: PUBLIC_PAGES },
    { title: "Student Pages", pages: STUDENT_PAGES },
    { title: "Doctor Pages", pages: DOCTOR_PAGES },
    { title: "Admin Pages", pages: ADMIN_PAGES },
  ];

  let pageNum = 1;
  for (const group of groups) {
    sections.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: group.title, bold: true, size: 26 })],
      })
    );
    for (const pg of group.pages) {
      sections.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 400 },
          children: [new TextRun({ text: `${pageNum}. ${pg.name}`, size: 22 })],
        })
      );
      pageNum++;
    }
  }

  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // Each page with screenshot and description
  for (const pg of allPages) {
    const imgPath = path.join(SCREENSHOT_DIR, pg.filename);
    
    if (!fs.existsSync(imgPath)) {
      console.log(`  Warning: Skipping ${pg.filename} (not found)`);
      continue;
    }

    const imgBuffer = fs.readFileSync(imgPath);
    const targetWidth = 650;

    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200 },
        children: [new TextRun({ text: pg.name, bold: true })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: pg.url ? `URL: ${BASE_URL}${pg.url}` : "URL: Single-page view within the dashboard",
            italics: true,
            size: 20,
            color: "666666",
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 200, after: 300 },
        children: [
          new TextRun({ text: "Purpose: ", bold: true, size: 24 }),
          new TextRun({ text: pg.description, size: 24 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: imgBuffer,
            transformation: { width: targetWidth, height: Math.round(targetWidth * 0.5625) },
            type: "png",
          }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    console.log(`  ✓ Added ${pg.name} to document`);
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
      },
      children: sections,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, "UniVision_Screenshots.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`\nWord document saved: ${outputPath}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
