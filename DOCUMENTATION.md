# UniVision — University Student Portal System

## Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Target Users](#4-target-users)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Project Structure](#7-project-structure)
8. [Database Design](#8-database-design)
9. [Authentication & Security](#9-authentication--security)
10. [Features — Student Portal](#10-features--student-portal)
11. [Features — Doctor/Admin Dashboard](#11-features--doctoradmin-dashboard)
12. [Features — AI Chatbot (UniBot)](#12-features--ai-chatbot-unibot)
13. [Features — Progressive Web App (PWA)](#13-features--progressive-web-app-pwa)
14. [API Reference](#14-api-reference)
15. [Theming System](#15-theming-system)
16. [Notification System](#16-notification-system)
17. [Seed Data & Demo Accounts](#17-seed-data--demo-accounts)
18. [Deployment](#18-deployment)
19. [Responsive Design](#19-responsive-design)
20. [Future Enhancements](#20-future-enhancements)

---

## 1. Project Overview

**UniVision** is a comprehensive, full-stack web-based university student portal designed to centralize and streamline academic information for students, doctors (professors), and administrators at the Egyptian E-Learning University (EELU). The platform provides a modern, dark-themed, responsive interface that gives students instant access to their grades, attendance, schedules, GPA analytics, performance comparisons, and more — all in one unified dashboard.

The system replaces the fragmented experience of checking multiple platforms and spreadsheets by offering a single, intelligent portal with real-time data visualization, an AI-powered chatbot assistant, and a professional CV builder to bridge academics with career readiness.

**Live URL:** https://uni-vision-azure.vercel.app

---

## 2. Problem Statement

University students at EELU face several challenges in managing their academic journey:

1. **Fragmented Information** — Students must navigate multiple platforms (SIS, LMS, email) to access grades, attendance, schedules, and notifications. There is no single source of truth.

2. **Lack of Performance Insight** — Students have no easy way to understand how they compare to their peers, identify weak areas, or predict their GPA trajectory.

3. **No Early Warning System** — Students at risk of academic probation or attendance violations often discover problems too late, after the semester ends.

4. **Communication Gaps** — Doctor feedback, admin announcements, and academic warnings are scattered across emails and verbal communication with no centralized tracking.

5. **Career Preparation Gap** — Students lack tools to build professional CVs and connect academic achievements to career opportunities.

6. **Accessibility** — Existing systems are not mobile-friendly and offer no offline capabilities, making it difficult for students to check information on the go.

---

## 3. Goals & Objectives

### Primary Goals

- **Centralize** all academic information (grades, attendance, schedule, feedback, notifications) into a single, intuitive dashboard
- **Empower** students with data-driven insights through GPA analytics, performance comparisons, and trend visualization
- **Alert** students to academic risks early through danger flags, attendance warnings, and performance tracking
- **Bridge** academics and career readiness through an integrated CV builder with ATS-optimized PDF export
- **Enable** doctors and administrators to manage student data, provide feedback, and broadcast announcements efficiently

### Secondary Goals

- Provide an intelligent chatbot assistant for quick academic queries
- Support offline access through Progressive Web App (PWA) technology
- Offer a customizable visual experience with multiple themes
- Ensure full mobile responsiveness for on-the-go access
- Deploy as a serverless application for zero-maintenance hosting

---

## 4. Target Users

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Student** | Undergraduate students across 4 academic years (Freshman to Senior) | View grades, attendance, schedule; track GPA; compare performance; receive alerts; build CV |
| **Doctor** | Professors/instructors managing courses | View student data, enter/edit grades and attendance, provide feedback, manage schedules and exams |
| **Admin** | University administrators | All doctor capabilities plus: create student accounts, broadcast notifications, send private feedback to doctors about students |

---

## 5. Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **HTML5** | Page structure and semantic markup | — |
| **CSS3** | Styling with CSS custom properties (variables) for theming | — |
| **Vanilla JavaScript (ES Modules)** | Client-side logic, DOM manipulation, API calls | ES2022+ |
| **Chart.js** | Interactive data visualization (line charts, doughnut charts, radar charts) | 4.4.0 |
| **Font Awesome** | Icon library (900+ icons used across the UI) | 6.4.0 |
| **Google Fonts (Inter)** | Typography | — |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | JavaScript runtime | 18+ |
| **Express.js** | HTTP server and REST API framework | 4.19.2 |
| **better-sqlite3** | Embedded SQLite database (synchronous, C++ addon) | 12.10.0 |
| **JSON Web Tokens (JWT)** | Stateless authentication | 9.0.2 |
| **bcryptjs** | Password hashing (bcrypt algorithm) | 2.4.3 |
| **dotenv** | Environment variable management | 16.4.5 |
| **CORS** | Cross-Origin Resource Sharing middleware | 2.8.5 |

### DevDependencies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Puppeteer** | PDF generation for reports (headless Chrome) | 24.43.1 |

### Deployment & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Vercel** | Serverless hosting (Node.js functions + static assets) |
| **SQLite** | Ephemeral database at `/tmp/univision.db` on Vercel (auto-seeds on cold start) |
| **PWA (Service Worker)** | Offline caching with network-first strategy |

### Design Decisions

- **No frontend framework** — Pure vanilla JS was chosen for simplicity, fast load times, and zero build step. Each page is a standalone HTML file with ES module scripts.
- **SQLite over PostgreSQL/MySQL** — Chosen for zero-configuration, serverless compatibility, and the demo/academic nature of the project. On Vercel, the DB is ephemeral (resets on cold start) which is acceptable for a demo.
- **better-sqlite3 over node:sqlite** — Required for Vercel compatibility; provides synchronous API that simplifies code.
- **Rule-based chatbot over AI/LLM** — Gemini API free-tier quota was exhausted; the rule-based approach works offline, has zero latency, and provides deterministic responses.

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Landing  │  │  Login   │  │ Student  │  │  Doctor  │    │
│  │  Page    │  │  Page    │  │ Pages x10│  │Dashboard │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘        │
│                          │                                   │
│              ┌───────────┴───────────┐                      │
│              │   JS API Clients      │                      │
│              │  (student-api.js,     │                      │
│              │   doctor-api.js)      │                      │
│              └───────────┬───────────┘                      │
│                          │  REST API (JWT Auth)              │
│  ┌───────────┐           │                                   │
│  │  Service  │           │                                   │
│  │  Worker   │◄──────────┤  (Caches static assets)          │
│  └───────────┘           │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼──────────────────────────────────┐
│                    SERVER (Express.js)                        │
│                          │                                   │
│              ┌───────────┴───────────┐                      │
│              │    Express Router     │                      │
│              └───────────┬───────────┘                      │
│                          │                                   │
│  ┌──────────┬────────────┼────────────┬──────────┐         │
│  │ Auth     │ Student    │ Doctor     │ Admin    │         │
│  │ Routes   │ Routes     │ Routes     │ Routes   │         │
│  │ /api/auth│ /api/student│/api/doctor│ /api/admin│        │
│  └──────────┴────────────┼────────────┴──────────┘         │
│                          │                                   │
│              ┌───────────┴───────────┐                      │
│              │   Chat Engine         │                      │
│              │ (Rule-based NLP,      │                      │
│              │  16 intents,          │                      │
│              │  bilingual EN/AR)     │                      │
│              └───────────┬───────────┘                      │
│                          │                                   │
│              ┌───────────┴───────────┐                      │
│              │   JWT Middleware      │                      │
│              │  (Authentication)     │                      │
│              └───────────┬───────────┘                      │
│                          │                                   │
│              ┌───────────┴───────────┐                      │
│              │   SQLite Database     │                      │
│              │  (better-sqlite3)     │                      │
│              │  15 tables            │                      │
│              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. User opens the browser and navigates to the app URL
2. Service Worker intercepts requests; serves cached assets if offline
3. Client-side JS (ES modules) makes authenticated REST API calls with JWT in `Authorization` header
4. Express server validates JWT via middleware
5. Route handlers query SQLite database using prepared statements
6. JSON responses are returned to the client
7. Client renders data into the DOM with Chart.js visualizations

---

## 7. Project Structure

```
GraduationProject/
│
├── api/
│   └── index.js                    # Vercel serverless entry point
│
├── client/
│   ├── assets/
│   │   └── logo.png                # UniVision logo
│   │
│   ├── css/
│   │   └── style.css               # Global design system (1000+ lines)
│   │                                  - CSS custom properties for theming
│   │                                  - Navbar, cards, tables, badges
│   │                                  - Chatbot styles
│   │                                  - Responsive breakpoints
│   │                                  - 8 theme color schemes
│   │
│   ├── js/
│   │   ├── student-api.js           # Auth + StudentAPI client (ES module)
│   │   ├── doctor-api.js            # Auth + DoctorAPI client (ES module)
│   │   ├── chatbot.js               # UniBot floating widget
│   │   ├── theme.js                 # Theme switcher + PWA registration
│   │   └── notifications.js         # Notification bell dropdown
│   │
│   ├── pages/
│   │   ├── student/
│   │   │   ├── home.html            # Student dashboard
│   │   │   ├── grades.html          # Grades viewer
│   │   │   ├── attendance.html      # Attendance tracker
│   │   │   ├── comparison.html      # Performance comparison
│   │   │   ├── reports.html         # Semester reports (printable)
│   │   │   ├── schedule.html        # Weekly timetable
│   │   │   ├── work.html            # CV builder + job platforms
│   │   │   ├── simulator.html       # GPA what-if calculator
│   │   │   ├── materials.html       # Course materials viewer
│   │   │   └── profile.html         # Personal information
│   │   │
│   │   └── doctor/
│   │       └── dashboard.html       # Doctor/Admin management dashboard
│   │
│   ├── landing.html                 # Public marketing page
│   ├── login.html                   # Role-based login
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service Worker
│
├── server/
│   ├── app.js                       # Express app entry + auto-seed chain
│   ├── .env                         # Environment variables
│   │
│   ├── db/
│   │   ├── database.js              # SQLite connection (better-sqlite3)
│   │   └── schema.js                # Schema creation (15 tables)
│   │
│   ├── middleware/
│   │   └── auth.js                  # JWT verification middleware
│   │
│   ├── routes/
│   │   ├── auth.js                  # Login/logout endpoints
│   │   ├── student.js               # Student data endpoints (17 routes)
│   │   ├── doctor.js                # Doctor CRUD endpoints (25+ routes)
│   │   ├── admin.js                 # Admin-only endpoints
│   │   └── chat.js                  # Rule-based chatbot engine
│   │
│   └── scripts/
│       ├── clean.js                 # Wipe all table data
│       ├── seed-doctor.js           # Seed doctor + admin accounts
│       ├── seed-students.js         # Seed 20 students with full data
│       ├── seed-schedule.js         # Seed class schedules
│       ├── seed-staff.js            # Seed course staff assignments
│       ├── seed-notifications.js    # Seed sample notifications
│       └── seed-materials.js        # Seed course materials
│
├── vercel.json                      # Vercel deployment configuration
├── .vercelignore                    # Files excluded from Vercel upload
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies and scripts
└── DOCUMENTATION.md                 # This file
```

---

## 8. Database Design

The system uses **SQLite** with **15 tables**. The schema is created automatically on server startup via `server/db/schema.js`.

### Entity Relationship Overview

```
users (1) ──── (1) student_profiles
  │
  ├──── (N) semesters ──── (N) semester_courses
  │
  ├──── (N) grades
  ├──── (N) attendance
  ├──── (N) feedback
  ├──── (N) admin_feedback
  ├──── (N) notification_reads ──── (N) notifications
  ├──── (1) cv_data
  └──── (N) activity_log

schedule (standalone, filtered by semester)
course_staff (standalone, keyed by course_name)
exams (standalone, filtered by semester)
course_materials (standalone, linked by doctor_id)
```

### Table Definitions

#### `users`
Central authentication table for all roles.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Unique ID (student national ID or doctor ID) |
| role | TEXT | `student`, `doctor`, or `admin` |
| password | TEXT | bcrypt-hashed password |
| name | TEXT | Full name (English) |
| name_ar | TEXT | Full name (Arabic) |

#### `student_profiles`
Extended personal information for students.

| Column | Type | Description |
|--------|------|-------------|
| student_id | TEXT PK (FK → users.id) | Student identifier |
| name_en | TEXT | English name |
| name_ar | TEXT | Arabic name |
| national_id | TEXT | Egyptian national ID |
| dob | TEXT | Date of birth |
| birthplace | TEXT | City of birth |
| nationality | TEXT | Nationality |
| gender | TEXT | Male/Female |
| religion | TEXT | Religion |
| address | TEXT | Full address |
| phone | TEXT | Phone number |
| email | TEXT | Personal email |
| university_email | TEXT | University email |
| grade | INTEGER | Academic year (1-4) |

#### `semesters`
GPA and credit summary per semester.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| student_id | TEXT (FK) | Student reference |
| semester_number | INTEGER | Ordinal semester (1, 2, 3...) |
| label | TEXT | e.g., "Semester 1 — Fall 2022" |
| gpa | REAL | Semester GPA (0.0-4.0) |
| attendance_pct | REAL | Semester attendance percentage |
| credits | INTEGER | Total credit hours |

#### `semester_courses`
Individual course records within a semester.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| semester_id | INTEGER (FK) | Semester reference |
| student_id | TEXT (FK) | Student reference |
| name | TEXT | Course name |
| credits | INTEGER | Credit hours |
| grade | TEXT | Letter grade (A+, A, B+, etc.) |
| grade_points | REAL | Grade points for this course |
| progress | REAL | Completion percentage |

#### `grades`
Detailed grade breakdown per course (current semester).

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| student_id | TEXT (FK) | Student reference |
| course_name | TEXT | Course name |
| grade | TEXT | Letter grade |
| pre_final | REAL | Pre-final total score |
| max_pre_final | REAL | Maximum possible pre-final score |
| att_score / att_max | REAL | Attendance component score / max |
| midterm_score / midterm_max | REAL | Midterm exam score / max |
| quiz1_score / quiz1_max | REAL | Quiz 1 score / max |
| quiz2_score / quiz2_max | REAL | Quiz 2 score / max |
| next_target_label | TEXT | Next achievable grade (e.g., "A") |
| next_target_need | REAL | Points needed for next grade |
| is_danger | INTEGER | 1 if flagged as at-risk |

#### `attendance`
Per-course attendance records.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| student_id | TEXT (FK) | Student reference |
| course_name | TEXT | Course name |
| attended | INTEGER | Classes attended |
| total | INTEGER | Total classes |
| percentage | REAL | Attendance percentage |
| status | TEXT | `safe`, `warning`, or `danger` |
| message | TEXT | Status description |

#### `feedback`
Doctor-to-student feedback on course performance.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| student_id | TEXT (FK) | Student reference |
| course_name | TEXT | Course name |
| doctor_name | TEXT | Doctor who wrote the feedback |
| created_at | TEXT | Timestamp |
| body | TEXT | Feedback content |
| is_danger | INTEGER | 1 if this is a warning |

#### `schedule`
Weekly class schedule entries.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| semester | INTEGER | Semester number (1-8) |
| course_name | TEXT | Course name |
| day | TEXT | Day of week (Sun-Thu) |
| start_time | TEXT | Start time (HH:MM) |
| end_time | TEXT | End time (HH:MM) |
| location | TEXT | Room/building location |
| type | TEXT | `Lecture`, `Lab`, or `Tutorial` |
| doctor_name | TEXT | Instructor name |

#### `course_staff`
Staff assignments per course.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| course_name | TEXT UNIQUE | Course name |
| doctor_name | TEXT | Lead doctor |
| doctor_email | TEXT | Doctor email |
| assistant_name | TEXT | Teaching assistant |
| assistant_email | TEXT | Assistant email |

#### `admin_feedback`
Private admin-to-doctor feedback about specific students.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| student_id | TEXT (FK) | Student being discussed |
| doctor_id | TEXT (FK) | Doctor receiving the feedback |
| admin_id | TEXT | Admin who wrote it |
| admin_name | TEXT | Admin name |
| course_name | TEXT | Related course |
| body | TEXT | Feedback content |
| is_urgent | INTEGER | Priority flag |
| created_at | TEXT | Timestamp |

#### `notifications`
Broadcast announcements from admins.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| admin_id | TEXT | Admin who created it |
| admin_name | TEXT | Admin name |
| category | TEXT | `day_off`, `lecture_cancelled`, `event`, `holiday`, `exam`, `general` |
| title | TEXT | Notification title |
| body | TEXT | Notification content |
| created_at | TEXT | Timestamp |

#### `notification_reads`
Tracks which students have read which notifications.

| Column | Type | Description |
|--------|------|-------------|
| notification_id | INTEGER (FK, composite PK) | Notification reference |
| student_id | TEXT (FK, composite PK) | Student reference |
| read_at | TEXT | When it was read |

#### `cv_data`
Stores student CV/resume data as a JSON blob.

| Column | Type | Description |
|--------|------|-------------|
| student_id | TEXT PK (FK) | Student reference |
| data | TEXT | JSON blob containing all CV fields |
| updated_at | TEXT | Last update timestamp |

#### `exams`
Upcoming exam schedule.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| semester | INTEGER | Semester number |
| course_name | TEXT | Course name |
| exam_type | TEXT | `Midterm`, `Final`, `Quiz`, `Practical` |
| exam_date | TEXT | Date (YYYY-MM-DD) |
| start_time | TEXT | Start time |
| end_time | TEXT | End time |
| location | TEXT | Exam venue |
| notes | TEXT | Additional notes |

#### `course_materials`
Learning resources uploaded by doctors.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| course_name | TEXT | Course name |
| doctor_id | TEXT (FK) | Doctor who uploaded |
| title | TEXT | Material title |
| type | TEXT | `link`, `pdf`, `video`, `document`, `other` |
| url | TEXT | Resource URL |
| description | TEXT | Brief description |
| created_at | TEXT | Upload timestamp |

#### `activity_log`
Tracks student page visits and actions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| student_id | TEXT (FK) | Student reference |
| action | TEXT | Action description |
| detail | TEXT | Additional detail |
| page | TEXT | Page name |
| created_at | TEXT | Timestamp |

---

## 9. Authentication & Security

### Authentication Flow

1. User submits `role`, `id`, and `password` to `POST /api/auth/login`
2. Server looks up user by `id` and `role` in the `users` table
3. Password is verified using `bcryptjs.compare()` against the stored hash
4. On success, a **JWT token** is generated with payload: `{ id, role, name }`
   - Token expires in **8 hours**
   - Signed with `JWT_SECRET` from environment variables
5. Token is returned to the client and stored in `localStorage`
6. A `uv_role` cookie is set for server-side role detection on page requests

### Authorization

- Every API request includes the JWT in the `Authorization: Bearer <token>` header
- The `auth.js` middleware verifies the token on every protected route
- Student routes enforce **self-access only** (student can only access their own data)
- Doctor routes require `role === 'doctor'` or `role === 'admin'`
- Admin routes require `role === 'admin'`
- Page-level protection: Express serves student HTML pages only if the `uv_role` cookie matches

### Password Security

- All passwords are hashed using **bcrypt** with a salt round of 10
- Plaintext passwords are never stored or logged
- Default seed password for all demo accounts: `123456`

---

## 10. Features — Student Portal

### 10.1 Home Dashboard (`home.html`)

The central hub for students, providing an at-a-glance overview of their academic status.

- **Dynamic Greeting** — Personalized welcome message with time-based greeting (Good Morning/Afternoon/Evening) and student name
- **Academic Standing Badge** — Color-coded status (Excellent/Good/Fair/Needs Improvement/Critical) based on cumulative GPA
- **6 Stat Cards** — Cumulative GPA, Current GPA, Attendance %, Courses Enrolled, Credits Completed, Flagged Courses
- **GPA Progress Chart** — Line chart showing GPA trend across all semesters with ordinal labels (1st '22, 2nd '23, etc.)
- **Attendance Doughnut Chart** — Visual breakdown of attended vs. absent classes
- **Today's Schedule** — Timeline of today's classes with time, course, type, and location
- **Course Progress** — Per-course progress bars showing completion percentage
- **Recent Feedback** — Latest doctor feedback with danger flag indicators
- **Top Achievers Leaderboard** — Top students in the same grade with ranking medals (gold/silver/bronze)
- **Upcoming Exams** — Countdown timer with urgency coloring (red < 3 days, yellow < 7 days)
- **GPA History** — Semester-by-semester GPA listing
- **University Resources** — Quick links to E-Learning, Main Portal, and Student Support

### 10.2 Grades Page (`grades.html`)

Detailed academic performance breakdown.

- **GPA Banner** — Large display of current semester GPA with trend indicator
- **Per-Course Grade Cards** — Each card shows:
  - Letter grade with color coding
  - Pre-final score with progress bar
  - Component breakdown (Attendance, Midterm, Quiz 1, Quiz 2) with individual bars
  - Next target grade and points needed
  - Danger flag for at-risk courses
  - Doctor/TA contact information
  - Doctor feedback history

### 10.3 Attendance Page (`attendance.html`)

Attendance monitoring with early warning system.

- **Overall Attendance Ring** — Large percentage display with color-coded status
- **Per-Course Cards** — Each shows:
  - Attended / Total classes
  - Percentage with progress bar
  - Status badge: Safe (green, >75%), Warning (yellow, 60-75%), Danger (red, <60%)
  - Warning message from the system

### 10.4 Performance Comparison (`comparison.html`)

Peer benchmarking and analytics.

- **Hero Banner** — GPA rank, percentile ring (animated SVG), peer count
- **Quick Stats** — Your GPA vs class average, class rank, attendance comparison, course count
- **GPA Trend Chart** — Line chart comparing your GPA to class average across semesters (with ordinal + year labels matching home dashboard)
- **Course Radar Chart** — Radar/spider chart comparing your scores to class average across all courses
- **Course-by-Course Breakdown** — Individual cards showing:
  - Your score vs. class average vs. class top
  - Gradient comparison bars
  - Component breakdown (Attendance, Midterm, Quiz 1, Quiz 2) with your score vs. class average
  - Rank within each course
- **Grade Distribution** — Bar charts showing letter grade distribution per course with your grade highlighted

### 10.5 Semester Reports (`reports.html`)

Formal academic reports with print support.

- **Semester Dropdown** — Select any completed semester
- **Report Card** — University-branded layout showing:
  - Student information header
  - Course table (Name, Credits, Grade, Grade Points)
  - Semester GPA and total credits
  - Print-optimized CSS with university logo

### 10.6 Weekly Schedule (`schedule.html`)

Class timetable organized by day.

- **Day Grouping** — Classes grouped by day (Sunday through Thursday)
- **Schedule Cards** — Each shows time range, course name, type (Lecture/Lab/Tutorial), location, and doctor name
- **Type Badges** — Color-coded by class type

### 10.7 CV Builder (`work.html`)

Professional resume creation tool.

- **Job Platform Links** — 7 cards linking to LinkedIn, Indeed, Wuzzuf, Forasna, Jobzella, Tanqeeb, Bayt
- **Multi-Section CV Form:**
  - Personal Info (name, title, phone, email, location, LinkedIn, portfolio, DOB, nationality, military status, marital status)
  - Professional Summary
  - Education (multiple entries: degree, university, dates, GPA)
  - Work Experience (multiple entries: title, company, dates, description)
  - Skills (tag-based input)
  - Projects (multiple entries: name, description, link)
  - Certifications (multiple entries: name, issuer, date)
  - Languages (multiple entries: language, proficiency level)
- **Live ATS Preview** — Real-time preview of the CV in a clean, ATS-friendly format
- **PDF Export** — One-click download using browser print-to-PDF
- **Server Persistence** — CV data saved as JSON blob to the database

### 10.8 GPA Simulator (`simulator.html`)

What-if GPA calculator.

- **Current GPA Display** — Shows the latest semester GPA
- **Per-Course Dropdowns** — Select hypothetical final grades for each enrolled course
- **Hypothetical Courses** — Add extra courses with custom credit hours and grades
- **Simulated GPA** — Real-time calculation of predicted GPA based on selected grades
- **Visual Comparison** — Side-by-side display of current vs. simulated GPA

### 10.9 Course Materials (`materials.html`)

Learning resource browser.

- **Grouped by Course** — Materials organized under course headers
- **Filter Tabs** — Filter by type: All, Links, PDFs, Videos, Documents
- **Material Cards** — Title, type icon, description, doctor name, upload date
- **Direct Links** — Click to open resource in new tab

### 10.10 Student Profile (`profile.html`)

Personal information display.

- **Profile Card** — Photo placeholder, name (EN + AR), student ID
- **Information Grid** — National ID, DOB, birthplace, nationality, gender, religion, address, phone, email, university email, academic grade/year

---

## 11. Features — Doctor/Admin Dashboard

The doctor dashboard (`dashboard.html`) is a comprehensive management interface with multiple views:

### 11.1 Student Management
- **Student List** — Searchable table of all students with ID, name, grade, GPA
- **Student Detail View** — Click any student to see full profile with tabbed interface

### 11.2 Grades Management (CRUD)
- View all grades for a selected student
- Add new grade entries with full component breakdown
- Edit existing grades
- Delete grade records
- Automatic GPA recalculation

### 11.3 Attendance Management (CRUD)
- View attendance records per student
- Add/edit attendance with automatic status calculation
- Delete attendance records

### 11.4 Feedback System
- Write feedback for specific students on specific courses
- Mark feedback as danger/warning
- Edit and delete feedback
- View feedback history

### 11.5 Schedule Management
- View schedule by semester
- Add new class entries (course, day, time, location, type, doctor)
- Edit and delete schedule entries

### 11.6 Exam Management
- Add upcoming exams (type, date, time, location, notes)
- View exams by semester
- Delete exam entries

### 11.7 Notifications (Admin Only)
- Broadcast notifications to all students
- Category selection (day off, lecture cancelled, event, holiday, exam, general)
- View and delete existing notifications

### 11.8 Admin Feedback (Admin Only)
- Send private feedback to doctors about specific students
- Mark as urgent
- View, edit, and delete admin feedback

---

## 12. Features — AI Chatbot (UniBot)

UniBot is a **rule-based, offline chatbot** that provides instant academic assistance without requiring any external API.

### Architecture
- **Pattern Matching** — Regex-based intent detection with weighted keyword scoring
- **Bilingual** — Automatic language detection (English/Arabic) with responses in the same language
- **Context-Aware** — Fetches real student data from the database for personalized responses
- **Follow-Up Suggestions** — Each response includes clickable suggestion buttons for guided conversation

### Supported Intents (16)

| Intent | Example Queries | Response |
|--------|----------------|----------|
| `greeting` | "Hello", "Hi", "مرحبا" | Welcome message with capabilities list |
| `gpa` | "What is my GPA?", "كم معدلي؟" | Current GPA, trend arrow, semester history, academic status |
| `grades` | "Show my grades", "عرض درجاتي" | All course grades with breakdowns, danger flags |
| `attendance` | "How is my attendance?", "نسبة حضوري" | Overall + per-course attendance with status |
| `schedule` | "What's my schedule today?", "جدولي" | Today's classes or full weekly schedule |
| `next_class` | "When is my next class?" | Finds the next upcoming class |
| `feedback` | "Any feedback from doctors?" | Doctor feedback messages |
| `notifications` | "Any new notifications?" | Recent announcements |
| `profile` | "Show my profile" | Personal information summary |
| `danger` | "Any warnings or risks?" | At-risk courses, low GPA alerts, attendance warnings |
| `best_course` | "What's my best course?" | Highest-scoring course with details |
| `worst_course` | "What's my worst course?" | Lowest-scoring course with improvement target |
| `tips` | "Give me study tips" | Personalized advice based on weak areas |
| `university` | "Tell me about the university" | EELU info: grading scale, probation rules, tuition, LMS |
| `thanks` | "Thank you", "شكرا" | Random appreciation response |
| `bye` | "Goodbye", "مع السلامة" | Farewell message |

### UI Features
- **Floating Action Button (FAB)** — Gold/purple gradient bubble in bottom-right corner with pulse animation
- **Chat Panel** — Slide-up panel with header, scrollable message area, and input field
- **Typing Indicator** — Animated bouncing dots with 1.2-3 second simulated delay
- **Markdown Rendering** — Bot responses support bold, lists, and code formatting
- **Clear Chat** — Reset conversation with one click
- **Mobile Fullscreen** — Chat panel goes fullscreen on mobile devices

---

## 13. Features — Progressive Web App (PWA)

UniVision is installable as a Progressive Web App on supported devices.

### Manifest (`manifest.json`)
- **Name:** UniVision Student Portal
- **Start URL:** `/home.html`
- **Display:** Standalone (no browser chrome)
- **Theme Color:** `#d4a830` (gold)
- **Background:** `#0a0e1a` (dark navy)
- **Icons:** 192x192 and 512x512 PNG

### Service Worker (`sw.js`)
- **Strategy:** Network-first with cache fallback
- **Cached Resources:** HTML pages, CSS, JS, logo, Font Awesome
- **API Exclusion:** `/api/` requests are never cached (always network)
- **Offline Fallback:** Serves cached `/home.html` for navigation requests when offline
- **Cache Name:** `univision-v1`

### Registration
- Service Worker is registered via `theme.js` on every page load
- Manifest link and `<meta>` tags are injected dynamically
- Apple touch icon is added for iOS home screen

### Installation
- **Android/Chrome:** Install prompt appears automatically or via browser menu
- **iOS/Safari:** Users must use "Add to Home Screen" from the share menu (Chrome on iOS does not support PWA install)

---

## 14. API Reference

Base URL: `/api`

### Authentication

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/login` | `{ role, id, password }` | `{ token }` + sets `uv_role` cookie |
| POST | `/auth/logout` | — | Clears cookie |

### Student Endpoints (require JWT + self-access)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/:sid/home` | Full dashboard data (GPA, attendance, schedule, feedback, exams, top students, etc.) |
| GET | `/student/:sid/profile` | Personal profile information |
| GET | `/student/:sid/grades` | All grades with component breakdowns |
| GET | `/student/:sid/attendance` | Overall + per-course attendance |
| GET | `/student/:sid/reports` | List all semesters |
| GET | `/student/:sid/reports/:semNum` | Detailed semester report |
| GET | `/student/:sid/schedule` | Weekly schedule |
| GET | `/student/:sid/comparison` | Performance vs peers (rank, percentile, trends, distributions) |
| GET | `/student/:sid/notifications` | All notifications with read status |
| POST | `/student/:sid/notifications/:nid/read` | Mark notification as read |
| POST | `/student/:sid/notifications/read-all` | Mark all notifications as read |
| POST | `/student/:sid/chat` | Send message to chatbot, get response |
| GET | `/student/:sid/cv` | Get saved CV data |
| PUT | `/student/:sid/cv` | Save CV data |
| GET | `/student/:sid/exams` | Upcoming exams |
| GET | `/student/:sid/materials` | Course materials for enrolled courses |
| GET | `/student/:sid/activity` | Activity log (last 30 entries) |
| POST | `/student/:sid/activity` | Log a page visit or action |

### Doctor Endpoints (require JWT + doctor/admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/students` | List all students |
| GET | `/doctor/student/:id` | Student profile + GPA + attendance |
| GET | `/doctor/student/:id/semesters` | Semester history with courses |
| GET | `/doctor/student/:id/grades` | Student grades |
| POST | `/doctor/student/:id/grades` | Add/update grade (upsert) |
| DELETE | `/doctor/grade/:id` | Delete grade |
| GET | `/doctor/student/:id/attendance` | Student attendance |
| POST | `/doctor/student/:id/attendance` | Add/update attendance (upsert) |
| DELETE | `/doctor/attendance/:id` | Delete attendance |
| GET | `/doctor/student/:id/feedback` | Get feedback for student |
| POST | `/doctor/student/:id/feedback` | Add feedback |
| PUT | `/doctor/feedback/:id` | Update feedback |
| DELETE | `/doctor/feedback/:id` | Delete feedback |
| GET | `/doctor/schedule/:semester` | Get schedule by semester |
| POST | `/doctor/schedule/:semester` | Add schedule entry |
| PUT | `/doctor/schedule-entry/:id` | Update schedule entry |
| DELETE | `/doctor/schedule-entry/:id` | Delete schedule entry |
| GET | `/doctor/exams/:semester` | List exams |
| POST | `/doctor/exams/:semester` | Add exam |
| DELETE | `/doctor/exam/:id` | Delete exam |
| GET | `/doctor/materials` | All course materials |
| POST | `/doctor/materials` | Add material |
| DELETE | `/doctor/material/:id` | Delete material |
| POST | `/doctor/student/:id/admin-feedback` | Add admin feedback |
| GET | `/doctor/student/:id/admin-feedback` | Get admin feedback |
| PUT | `/doctor/admin-feedback/:id` | Update admin feedback |
| DELETE | `/doctor/admin-feedback/:id` | Delete admin feedback |

### Admin Endpoints (require JWT + admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/students` | Create new student account |
| GET | `/admin/notifications` | List all notifications |
| POST | `/admin/notifications` | Create broadcast notification |
| DELETE | `/admin/notifications/:id` | Delete notification |

---

## 15. Theming System

UniVision includes **8 built-in themes** accessible via a dropdown in the navbar.

| Theme | Background | Accent | Text |
|-------|-----------|--------|------|
| **Navy Gold** (default) | `#0a0e1a` | `#d4a830` | `#e8edf3` |
| **Ocean Blue** | `#0a1628` | `#3b82f6` | `#e0e8f5` |
| **Emerald** | `#0a1a14` | `#10b981` | `#e0f0ea` |
| **Royal Purple** | `#12091f` | `#8b5cf6` | `#e8e0f5` |
| **Rose** | `#1a0a14` | `#f43f5e` | `#f5e0e8` |
| **White** | `#ffffff` | `#d4a830` | `#1e293b` |
| **Off White** | `#f8f6f1` | `#b8860b` | `#2d3748` |
| **White Grey** | `#f1f5f9` | `#6366f1` | `#1e293b` |

### Implementation
- Themes are defined as CSS custom property sets in `style.css`
- `theme.js` creates a dropdown selector in the navbar
- Selected theme is persisted to `localStorage`
- Theme class (e.g., `light-theme`) is applied to `<html>` element
- All components use CSS variables (`var(--bg)`, `var(--card-bg)`, `var(--accent)`, etc.) for automatic theme adaptation

---

## 16. Notification System

### Architecture
- Admins create broadcast notifications via the dashboard
- Notifications are stored in the `notifications` table
- Each student has a `notification_reads` table tracking read status
- The notification bell in the navbar shows the **unread count badge**

### Features
- **Categories** — Day Off, Lecture Cancelled, Event, Holiday, Exam, General
- **Category Icons** — Each category has a unique icon and color
- **Date Grouping** — Notifications grouped by Today, Yesterday, This Week, Older
- **Mark as Read** — Click a notification to mark it read
- **Mark All Read** — One-click to clear all unread
- **Real-time Badge** — Unread count updates on the bell icon

---

## 17. Seed Data & Demo Accounts

The system auto-seeds demo data on startup (and on every Vercel cold start).

### Seed Chain (executed in order)
1. `seed-doctor.js` — Creates doctor and admin accounts
2. `seed-students.js` — Creates 20 students with full academic history
3. `seed-schedule.js` — Creates class schedules for semesters 1-4
4. `seed-staff.js` — Assigns doctors and TAs to courses
5. `seed-notifications.js` — Creates 8 sample notifications
6. `seed-materials.js` — Creates 2-3 materials per course (~55 total)

### Demo Accounts

| Role | ID | Password | Name |
|------|----|----------|------|
| **Student** | `30012151012341` | `123456` | Ahmed Mohamed El-Sherif |
| **Student** | `30012151012342` | `123456` | Fatma Hassan Ibrahim |
| **Student** | `30012151012343` | `123456` | Omar Khaled Abdallah |
| **Doctor** | `29803050202394` | `123456` | Dr. Mohamed Ibrahim |
| **Admin** | `admin001` | `123456` | System Admin |
| **Admin** | `admin002` | `123456` | Academic Affairs Admin |

*(20 students total across 4 academic years with 10 unique performance scenarios)*

### Student Scenarios

| Scenario | Description | GPA Range |
|----------|-------------|-----------|
| `top_performer` | Consistently excellent grades | 3.7-4.0 |
| `strong` | Above average with minor dips | 3.3-3.7 |
| `steady_avg` | Consistent middle performer | 2.8-3.2 |
| `improving` | Started weak, trending upward | 2.0→3.2 |
| `declining` | Started strong, trending down | 3.5→2.5 |
| `mixed` | Inconsistent performance | 2.5-3.5 |
| `at_risk` | Below average, some danger flags | 2.0-2.5 |
| `attendance_danger` | Decent grades but critical attendance | 2.5-3.0 |
| `struggling` | Multiple failing courses | 1.5-2.0 |
| `comeback` | Failed, then dramatically improved | 1.0→3.0 |

---

## 18. Deployment

### Vercel Configuration

**`vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node",
      "config": { "includeFiles": ["server/**", "client/**"] }
    },
    {
      "src": "client/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "api/index.js" },
    { "src": "/(home|grades|...)\\. html", "dest": "api/index.js" },
    { "src": "/css/(.*)", "dest": "client/css/$1" },
    { "src": "/js/(.*)", "dest": "client/js/$1" },
    { "src": "/(.*)", "dest": "api/index.js" }
  ]
}
```

### How It Works on Vercel
1. `api/index.js` re-exports the Express app as a serverless function
2. Static assets (CSS, JS, images) are served via `@vercel/static`
3. HTML page requests and API calls route to the serverless function
4. SQLite database is created at `/tmp/univision.db` (ephemeral)
5. Auto-seed chain runs on every cold start, populating fresh demo data

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | Server port (local development only) |

### Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Force deploy (clear build cache)
vercel --prod --force
```

---

## 19. Responsive Design

The entire application is fully responsive across all device sizes.

### Breakpoints

| Breakpoint | Target |
|-----------|--------|
| `> 900px` | Desktop — full multi-column layouts |
| `768px - 900px` | Tablet — 2-column grids, collapsed nav |
| `480px - 768px` | Large mobile — single column, hamburger menu |
| `< 480px` | Small mobile — compact cards, fullscreen chatbot |

### Key Responsive Features
- **Navbar** — Collapses to hamburger menu on mobile with slide-down menu
- **Stat Cards** — 3-column → 2-column → 1-column grid progression
- **Charts** — Maintain aspect ratio, resize smoothly
- **Chatbot** — Goes fullscreen on mobile (<480px) with safe area padding for iOS
- **Notification Dropdown** — Becomes full-width fixed panel on mobile
- **Tables** — Horizontal scroll wrapper for data tables
- **University Resources** — 3-column → 1-column on small screens
- **CV Builder** — Single column form + preview stacking on mobile

---

## 20. Future Enhancements

Potential improvements for future versions:

1. **Persistent Database** — Migrate from ephemeral SQLite to PostgreSQL (e.g., Neon, Supabase) for production use
2. **Real-time Notifications** — WebSocket support for instant notification delivery
3. **AI Chatbot Upgrade** — Integrate with GPT/Gemini API for natural language understanding
4. **Email Integration** — Send email alerts for attendance warnings and grade updates
5. **File Upload** — Allow doctors to upload actual PDF/document files for course materials
6. **Student Registration** — Self-service account creation with email verification
7. **Exam Results** — Final exam grade entry and official transcript generation
8. **Multi-language UI** — Full Arabic RTL interface (currently only chatbot is bilingual)
9. **Analytics Dashboard** — Admin analytics with enrollment trends, GPA distributions, retention rates
10. **Mobile App** — React Native or Flutter wrapper for native mobile experience

---

## License

This project was developed as a **Graduation Project** for the Egyptian E-Learning University (EELU).

---

*Documentation last updated: May 2026*
