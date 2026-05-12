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
├── mobile/                  # Flutter Mobile App (Android & iOS)
│   ├── lib/
│   │   ├── main.dart        # App entry point
│   │   ├── models/          # Data models
│   │   ├── services/
│   │   │   └── api_service.dart  # HTTP client for all API endpoints
│   │   ├── providers/
│   │   │   ├── auth_provider.dart   # Auth state management
│   │   │   └── theme_provider.dart  # Theme system (8 themes)
│   │   ├── screens/
│   │   │   ├── auth/        # Login screen
│   │   │   ├── student/     # All student screens (7 pages)
│   │   │   └── doctor/      # Doctor/Admin dashboard screens
│   │   └── widgets/         # Shared UI components
│   └── pubspec.yaml         # Flutter dependencies
└── package.json             # Unified scripts and dependencies
```

---

## Getting Started

### Prerequisites

- Node.js v22+ (uses experimental `node:sqlite`)
- Flutter SDK 3.2+ (for mobile app)

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

## Mobile App (Flutter)

The `mobile/` folder contains a full Flutter app for Android and iOS that connects to the same Express backend.

### Setup

```bash
cd mobile
flutter pub get
```

### Running

1. Start the backend server first: `npm start` (from project root)
2. Update the API base URL in `mobile/lib/services/api_service.dart`:
   - Android emulator: `http://10.0.2.2:3000/api` (default)
   - iOS simulator: `http://localhost:3000/api`
   - Physical device: `http://<your-ip>:3000/api`
3. Run the app:

```bash
flutter run
```

### Mobile App Features

- Login with role selection (Student / Doctor / Admin)
- **Student:** Home dashboard with alerts & charts, Grades, Attendance, Schedule, Reports, Performance Comparison, Profile
- **Doctor/Admin:** Student list with search & grade filter, Student detail (Grades/Attendance/Feedback tabs), Schedule management, Add student (admin)
- 8 themes matching the web app (5 dark + 3 light), persisted in device storage
- Pull-to-refresh on all screens, animated progress bars, Chart.js-equivalent charts via fl_chart

---

## License

This project is for educational purposes.
