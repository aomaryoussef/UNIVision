# UniVision -- University Student Portal System

A full-stack university portal for students, doctors, and administrators. Built with vanilla HTML/CSS/JS on the frontend and Node.js + Express + SQLite on the backend.

---

## Features

### Student Portal
- **Dashboard** -- GPA stats, course overview, top achievers, smart performance alerts
- **Grades** -- Per-course grades with doctor/assistant contact info
- **Attendance** -- Attendance tracking with animated progress bars
- **Schedule** -- Semester-based class schedule (shared per grade)
- **Reports** -- Downloadable academic reports
- **Performance Comparison** -- GPA/attendance vs classmates, radar chart, grade distribution, rank & percentile
- **Profile** -- Student profile management

### Doctor / Admin Dashboard
- Student management with tabbed interface and inline editing
- Contextual feedback system (admin can send feedback to students or doctors)
- Course staff management

### Theming
- 8 built-in themes via a palette switcher in the navbar:
  - **Dark:** Navy Gold, Ocean Blue, Emerald, Royal Purple, Rose
  - **Light:** White, Off-White, White Grey
- Theme persists in localStorage and applies before DOM render (no flash)

### Animations
- Page fade-up and stagger entrance animations
- Hover glow effects
- Animated progress bars (`fillBar` / `growUp` keyframes)

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Vanilla HTML, CSS, JavaScript       |
| Backend  | Node.js, Express                    |
| Database | SQLite (`node:sqlite`)              |
| Auth     | JWT (`jsonwebtoken`) + `bcryptjs`   |
| Charts   | Chart.js                            |

---

## Project Structure

```
rown/
├── client/                  # Frontend
│   ├── assets/              # Logo and static assets
│   ├── css/
│   │   └── style.css        # Global design system, theme tokens, animations
│   ├── js/
│   │   ├── student-api.js   # Student API client
│   │   ├── doctor-api.js    # Doctor/Admin API client
│   │   └── theme.js         # Theme color switcher (8 themes)
│   ├── pages/
│   │   ├── student/         # Student pages (home, grades, attendance, etc.)
│   │   └── doctor/          # Doctor/Admin dashboard
│   ├── landing.html         # Public landing page
│   └── login.html           # Login page
├── server/                  # Backend
│   ├── app.js               # Express entry point, routing, static serving
│   ├── db/
│   │   ├── database.js      # SQLite connection
│   │   ├── schema.js        # Table definitions (12 tables)
│   │   ├── seed.js          # Base seed data
│   │   └── univision.db     # SQLite database file
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Login / registration
│   │   ├── student.js       # Student API (home, grades, attendance, comparison, etc.)
│   │   ├── doctor.js        # Doctor/Admin API
│   │   └── admin.js         # Admin API
│   └── scripts/             # Seed scripts (doctor, students, schedule, staff)
├── docs/
│   └── UniVision_Presentation.pptx   # 20-slide animated presentation
└── package.json             # Unified scripts and dependencies
```

---

## Getting Started

### Prerequisites

- Node.js v22+ (uses experimental `node:sqlite`)

### Installation

```bash
npm install
```

### Seed the Database

```bash
npm run db:seed:all
```

Individual seed commands are also available:

```bash
npm run db:seed:doctor
npm run db:seed:students
npm run db:seed:schedule
npm run db:seed:staff
```

To wipe the database:

```bash
npm run db:clean
```

### Run the Server

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the port configured in `server/.env`).

---

## Demo Credentials

| Role    | National ID         | Password |
| ------- | ------------------- | -------- |
| Student | `30012151012341`    | `123456` |
| Doctor  | `29803050202394`    | `123456` |
| Admin   | `29803050202395`    | `123456` |

---

## API Endpoints

| Method | Endpoint                        | Description                     |
| ------ | ------------------------------- | ------------------------------- |
| POST   | `/api/auth/login`               | User login                      |
| GET    | `/api/student/:id/home`         | Student dashboard + alerts      |
| GET    | `/api/student/:id/grades`       | Student grades                  |
| GET    | `/api/student/:id/attendance`   | Student attendance              |
| GET    | `/api/student/:id/comparison`   | Performance comparison data     |
| GET    | `/api/student/:id/reports`      | Academic reports                |
| GET    | `/api/student/:id/schedule`     | Class schedule                  |
| GET    | `/api/health`                   | Health check                    |

---

## License

This project is for educational purposes.
