# Springfield ERP

A production-grade School ERP System built using the MERN Stack. Springfield ERP provides a comprehensive educational management suite to administer academic workflows, student admissions, attendance tracking, examination scheduling, grading analysis, and financial collections in a single secure, role-based platform.

---

## Table of Contents
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation Guide](#installation-guide)
- [Screenshots](#screenshots)
- [API Documentation](#api-documentation)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)

---

## Key Features

### Master Setup
- **Academic Years**: Establish and archive active/inactive academic sessions.
- **Classes & Sections**: Map standard classrooms and map section-specific classroom limits.
- **Streams**: Segregate senior secondary education pathways (e.g., Science, Commerce, Arts).
- **Subjects**: Configure core and elective subjects mapped to specific classes.
- **Departments & Designations**: Maintain corporate staffing layers.
- **Categories**: Map student pricing tiers (General, OBC, SC, ST) for automated invoicing.
- **Exam Types**: Set up recurring terms, assessment weightages, and grading standards.

### Admissions
- **Enquiries**: Capture, status-track, and convert candidate admission enquiries.
- **New Admissions**: End-to-end multi-step registration forms for demographic, parent, and document details.
- **Visitor Management**: Log details of campus guests, guardians, and third-party vendors.

### Students
- **Student Profiles**: Interactive student records detailing personal dossiers, parents, fees, and marks.
- **Promotion Management**: Batch upgrade students across academic years with academic filters.
- **Documents & Records**: Secure storage of KYC documents (Aadhaar, transfer certificates, birth logs).

### Staff
- **Staff Management**: Comprehensive directory of teaching and non-teaching personnel.
- **Dossiers**: Detailed logs of salary structures, leave allowances, and qualifications.

### Attendance
- **Student Attendance**: Daily roll-calls per section with quick toggles (Present, Absent, Late).
- **Staff Attendance**: Biometric-ready attendance registers for institutional tracking.
- **Reports**: Section-wise average attendance charts and exportable history.

### Examinations
- **Exam Setup**: Configure term-wide assessments.
- **Exam Scheduling**: Conflict-free exam timetabling with automated room and invigilator checks.
- **Marks Entry**: Draft-saveable subject grids for teachers with automatic percentage calculations.
- **Results & Analytics**: Instantly compute term topper rankings, pass rates, and performance trends.

### Fees & Finance
- **Fee Structures**: Define class and term-based fee configurations (Tuition, Library, Sports).
- **Category Discounts**: Automatic student category discounts (Waivers, percentage, or fixed concessions).
- **Fee Assignment**: Automatic bulk assignment of fee schedules on admission approval.
- **Fee Collection & Receipts**: Process payments with instant print-friendly receipts and invoices.

---

## Tech Stack

### Frontend
- **React**: Interactive component-driven user interface.
- **Redux Toolkit**: Centralized global state orchestration.
- **React Router**: Declarative client-side routing.
- **Axios**: Promised-based HTTP client for API communication.
- **Tailwind CSS**: Modern utility-first styling.

### Backend
- **Node.js**: Asynchronous event-driven JavaScript runtime.
- **Express.js**: Minimalist web routing framework.
- **MongoDB**: Schema-flexible Document database.
- **Mongoose**: Elegant MongoDB object modeling for Node.js.
- **JWT Authentication**: Secure stateless token-based authorization.

---

## Project Structure

This project uses a clean monorepo organization separating backend API services from the frontend single-page application.

```text
springfield-erp/
├── backend/                    # Express API Server & Database Layer
│   ├── src/
│   │   ├── config/             # Database and security helper setups
│   │   ├── controllers/        # HTTP controllers (receives req, triggers service, returns res)
│   │   ├── middlewares/        # Authentication, RBAC, and error validation filters
│   │   ├── models/             # Mongoose Schemas (Data mapping layer)
│   │   ├── routes/             # API Endpoints mapping to Controllers
│   │   ├── seed/               # Initial database seeder scripts
│   │   ├── services/           # Domain business rules and transactions
│   │   └── utils/              # Reusable helper functions
│   ├── uploads/                # Temporary local document storage
│   ├── package.json            # Backend dependency manifest
│   └── server.js               # Express server entry point
│
├── frontend/                   # React Single Page Client Application
│   ├── public/                 # Static images and favicons
│   ├── src/
│   │   ├── assets/             # Bundled application images and design assets
│   │   ├── components/         # Reusable presentation and layout UI elements
│   │   ├── config/             # Sidebar menus and system configs
│   │   ├── constants/          # Application-wide immutable constant vectors
│   │   ├── layouts/            # Page shells (Dashboard layouts)
│   │   ├── pages/              # View screens mounted on routes
│   │   ├── redux/              # RTK Store and feature state slices
│   │   ├── routes/             # AppRoutes and Protected route guards
│   │   ├── schemas/            # Zod validation schemas
│   │   └── services/           # Axios HTTP API services
│   ├── package.json            # Frontend dependency manifest
│   └── vite.config.js          # Vite build pack configuration
```

---

## Installation Guide

Follow these steps to run a production-ready development replica on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/akhileshsharma22/School-ERP.git
cd School-ERP
```

### 2. Install Project Dependencies
Run the installation script at the root directory to automatically build node modules for both folders:
```bash
npm run install:all
```

Alternatively, run installation commands inside their respective folders:
```bash
# Inside frontend folder
cd frontend && npm install

# Inside backend folder
cd ../backend && npm install
```

### 3. Setup Environment Variables
Create `.env` files in both the frontend and backend folders using the provided `.env.example` templates:

```bash
# Setup backend environment file
cp backend/.env.example backend/.env

# Setup frontend environment file
cp frontend/.env.example frontend/.env
```

Define dummy configuration keys inside `.env` ensuring secrets are kept secure:
- **Backend (`backend/.env`)**:
  - `PORT=5000`
  - `MONGO_URI=your_mongodb_connection_string`
  - `JWT_SECRET=your_jwt_signing_key`
  - `JWT_REFRESH_SECRET=your_jwt_refresh_key`
  - `CLIENT_URL=http://localhost:5173`
- **Frontend (`frontend/.env`)**:
  - `VITE_API_BASE_URL=http://localhost:5000/api`
  - `VITE_API_URL=http://localhost:5000`

### 4. Start the Application
You can run the full-stack setup with these root commands:

```bash
# Run backend API server (runs at http://localhost:5000)
npm run dev:backend

# Run frontend client app (runs at http://localhost:5173)
npm run dev:frontend
```

---

## Screenshots

> [!NOTE]
> Below are visualization placeholders for key modules. Replace files under the `docs/screenshots/` directory to display active dashboard images.

### Dashboard
![Dashboard Placeholder](docs/screenshots/dashboard.jpg)

### Master Setup
![Master Setup Placeholder](docs/screenshots/master_setup.jpg)

### Admissions
![Admissions Placeholder](docs/screenshots/admissions.jpg)

### Students
![Students Placeholder](docs/screenshots/students.jpg)

### Staff
![Staff Placeholder](docs/screenshots/staff.jpg)

### Attendance
![Attendance Placeholder](docs/screenshots/attendance.jpg)

### Examinations
![Examinations Placeholder](docs/screenshots/examinations.jpg)

### Fees & Finance
![Fees & Finance Placeholder](docs/screenshots/fees_finance.jpg)

---

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Validates credentials and returns JWT session tokens.
- `POST /api/auth/refresh-token` - Renews authorization tokens securely.
- `GET /api/auth/profile` - Fetches authenticated user profile credentials.

### Student Management Endpoints
- `GET /api/students` - Queries student database with class, category, and status filters.
- `GET /api/students/profile/:id` - Detailed student dossier review.
- `PUT /api/students/profile/:id` - Updates specific student demographics.
- `DELETE /api/students/:id` - Performs dependent delete validation and drops student profile.

### Admission Workflows
- `GET /api/admissions/applications` - Lists all processed or pending applications.
- `POST /api/admissions/applications` - Submits a new candidate application profile.
- `PUT /api/admissions/applications/:id/verify` - Verifies student files.
- `POST /api/admissions/applications/:id/approve` - Generates student credentials and triggers automatic fee mapping.

### Attendance Registries
- `GET /api/attendance` - Fetches historical attendance files.
- `POST /api/attendance/mark` - Saves attendance logs (Present, Absent, Late).

### Examinations & Grading
- `GET /api/exams` - Lists active exam schedules.
- `POST /api/exams/schedule` - Creates new timetables with room conflict verification checks.
- `POST /api/exams/marks/bulk` - Saves subject grades in bulk.
- `POST /api/exams/results/compute` - Aggregates marks and assigns ranks.

### Financial Transactions
- `GET /api/finance/fee-structures` - Lists configured tuition fee heads.
- `POST /api/finance/payments/collect/:id` - Records payment transactions and creates billing invoices.
- `GET /api/finance/receipts` - Queries print-friendly receipts.

---

## Contribution Guidelines

Contributions are welcome to make Springfield ERP a leading open-source system! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, commit layouts, and local developer validation checklists before initiating pull requests.

---

## License

This project is licensed under the terms of the MIT License. See [LICENSE](LICENSE) for full details.
