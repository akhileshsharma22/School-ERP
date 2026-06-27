# Springfield ERP

A production-grade, enterprise-ready School ERP System built using the MERN stack.

---

## 1. Project Overview

Springfield ERP is a comprehensive academic administration platform designed to manage and automate educational operations. The system consolidates user authentication, academic setups, admissions, student records, staff payroll directories, student/staff attendance, exam schedules, grading compute modules, and financial collections under a single secure, role-based application.

---

## 2. Key Features & Modules

### ⚙️ Master Setup
- **Academic Years**: Manage sessions with archive flags and automatic current term routing.
- **Classes & Sections**: Map standard grades and section enrollment limits.
- **Streams**: Segregate senior secondary education pathways (Science, Commerce, Arts).
- **Subjects**: Configure core and elective classes mapped to specific grades.
- **Departments & Designations**: Structure administrative and teaching personnel roles.
- **Categories**: Map demographics (General, OBC, SC, ST) for concession invoicing.
- **Exam Types & Grading Configs**: Configure weightages, terms, and grading thresholds.

### 📝 Admissions
- **Enquiries**: Capture, convert, and status-track candidate queries.
- **New Admissions**: Process student registrations containing parent and demographic files.
- **Visitor Logs**: Track campus guests, guardians, and third-party vendors.

### 🎓 Students & Staff
- **Student Dossier**: Complete dossier with profiles, fee statuses, and exam schedules.
- **Promotions**: Bulk promote classes with condition filters across academic terms.
- **Staff Profiles**: Maintain files with joining details, department assignments, and salaries.

### 📅 Attendance
- **Daily Roll-Calls**: Mark student and staff attendance status (Present, Absent, Late, Half Day).
- **Analytics**: Render class attendance averages and exportable registers.

### ✍️ Examinations & Grading
- **Timetabling**: Automated conflict-free scheduling checks (room & invigilator).
- **Marks Entry**: Draft-saveable subject grids for teachers with auto-computed passing percentages.
- **Result Top-Lists**: Compute term rankings and pass percentages.

### 💳 Fees & Finance
- **Fee Structures**: Define class and term-based fee packages (Tuition, Library, Sports).
- **Discounts**: Apply concessions automatically based on student categories on enrollment.
- **Collections & Receipts**: Process payments and produce print-friendly invoices.

---

## 3. Tech Stack

- **Frontend**: React, Redux Toolkit, React Router, Tailwind CSS, Axios, Lucide Icons, Sonner.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, bcryptjs.
- **Development Tools**: Vite, Nodemon, Playwright.

---

## 4. Folder Structure & Architecture

Refer to [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) and [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for deeper layout references.

```text
springfield-erp/
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── config/             # DB setups
│   │   ├── controllers/        # HTTP controllers
│   │   ├── middlewares/        # JWT / Role guards
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # REST route files
│   │   └── utils/              # Migration and helper utilities
│   └── server.js               # Entry point
│
├── frontend/                   # React SPA Client
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Screen components
│   │   ├── redux/              # Redux RTK store
│   │   └── services/           # API services
│   └── vite.config.js          # Build pack config
│
└── docs/                       # System Documentation
```

---

## 5. Session Routing & Role Access Boundaries

Authentication is implemented via stateless signed JWT payloads. Access controls are enforced both on frontend routers and backend middleware gates.

### Roles Matrix
- **ADMIN**: Complete view. Access to Master Setup, Admissions, Promotions, Staff Directories, Finance Collections, and Global KPIs.
- **TEACHER**: Scoped view. Can view Today's Classes, list assigned students in their `assignedClasses`, mark section attendance, and submit marks.
- **PARENT**: Dedicated child portal. Selects linked child to view overall attendance rates, fee invoices status, exam results, and schedule calendars.

---

## 6. Installation & Run Guide

### Prerequisites
- Node.js >= 20.19.0
- MongoDB Local Server or MongoDB Atlas Account

### 1. Clone the Project
```bash
git clone https://github.com/akhileshsharma22/School-ERP.git
cd School-ERP
```

### 2. Install Dependencies
Run the utility installer from the root workspace folder to build all packages:
```bash
npm run install:all
```

### 3. Environment Variables Config
Create `.env` files in both the frontend and backend folders using the provided `.env.example` templates:

- **Backend Configuration (`backend/.env`)**:
  ```ini
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/springfield-erp
  JWT_SECRET=supersecret123
  JWT_REFRESH_SECRET=refreshsecret456
  CLIENT_URL=http://localhost:5173
  NODE_ENV=development
  ```
- **Frontend Configuration (`frontend/.env`)**:
  ```ini
  VITE_API_BASE_URL=http://127.0.0.1:5000/api
  VITE_API_URL=http://127.0.0.1:5000
  VITE_APP_NAME=Springfield ERP
  ```

### 4. Seed Database
Seeding resets database state and generates base classes, categories, departments, and three role accounts:
```bash
# Inside root folder
npm run seed:admin
```

### 5. Running in Development Mode
Start both services concurrently using the root package scripts:
```bash
# Terminal 1: Backend Server (starts on http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend App (starts on http://localhost:5173)
npm run dev:frontend
```

---

## 7. Default Credentials (Seeded Profiles)

| Role | Username / Email | Password | Linked Target |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `Admin@123` | Global Administration |
| **Teacher** | `teacher@erp.com` | `Teacher@123` | Class 10-A, Subject: Mathematics |
| **Parent** | `parent@erp.com` | `Parent@123` | Guardian of "Test Student" |

---

## 8. System Diagrams & Documentation

Deep-dive logs detailing subsystems are located in the `docs` folder:
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Database Model Schema](docs/DATABASE_SCHEMA.md)
- [Functional Module Flows](docs/MODULE_FLOW.md)
- [API Route Reference](docs/API_REFERENCE.md)

---

## 9. Future Enhancements
- **LMS Integration**: Assignment submission and quiz portals.
- **Messaging System**: Live communication channel between Parents and Class Teachers.
- **Bus Tracking GPS**: Real-time school vehicle tracking for Parents.

---

## 10. License & Author

- **License**: MIT License - See [LICENSE](LICENSE) for details.
- **Author**: [Akhilesh Sharma](https://github.com/akhileshsharma22)
