# School ERP

A production-oriented School ERP built with the MERN stack. The project is organized as a separated frontend and backend codebase so it can scale into modules such as admissions, students, staff, attendance, academics, fees, transport, communication, reporting, and administration.

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router
- Lucide React
- Recharts
- Axios

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens
- Helmet
- CORS
- Cookie Parser
- Morgan

## Repository Structure

```text
school-erp/
├── backend/                 # Express API and MongoDB data layer
│   ├── src/
│   │   ├── config/          # Database and infrastructure configuration
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middlewares/     # Auth, role, and error middleware
│   │   ├── models/          # Mongoose schemas and models
│   │   ├── routes/          # API route definitions
│   │   ├── seed/            # Development/admin seed scripts
│   │   ├── services/        # Business/domain service layer
│   │   └── utils/           # Shared backend utilities
│   ├── uploads/             # Local runtime uploads, ignored by Git
│   ├── package.json
│   └── server.js
├── frontend/                # React/Vite client application
│   ├── public/              # Static public assets
│   ├── src/
│   │   ├── assets/          # Bundled image and static assets
│   │   ├── components/      # Reusable UI and feature components
│   │   ├── config/          # Frontend configuration
│   │   ├── constants/       # Shared constants
│   │   ├── layouts/         # Layout shells
│   │   ├── pages/           # Route-level pages
│   │   ├── redux/           # Redux Toolkit store and slices
│   │   ├── routes/          # Client-side route definitions
│   │   ├── schemas/         # Validation schemas
│   │   └── services/        # API client modules
│   └── package.json
├── docs/                    # Architecture and operations documentation
├── .env.example             # Root environment variable reference
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── package.json             # Root orchestration scripts
└── README.md
```

See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) for the folder-by-folder development guide.

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- MongoDB local instance or MongoDB Atlas cluster

## Installation

Install dependencies for both applications:

```bash
npm run install:all
```

Or install them separately:

```bash
cd frontend
npm install

cd ../backend
npm install
```

## Environment Variables

Copy the example files before running locally:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Never commit real `.env` files, JWT secrets, MongoDB connection strings, API keys, private certificates, or production credentials.

### Backend

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/school_erp
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
CLIENT_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=School ERP
```

More details are documented in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Running the Project

### Frontend

```bash
npm run dev:frontend
```

The Vite app runs at `http://localhost:5173`.

### Backend

```bash
npm run dev:backend
```

The API runs at `http://localhost:5000`.

### Production Build

```bash
npm run build
```

This builds the frontend into `frontend/dist`.

### Backend Start

```bash
npm start
```

This starts the Express API with `backend/server.js`.

## Development Workflow

1. Create a feature branch from the main branch.
2. Add or update environment variables only in local `.env` files.
3. Keep frontend and backend changes separated by responsibility.
4. Put route-level React screens in `frontend/src/pages`.
5. Put reusable React UI in `frontend/src/components`.
6. Put Express request handlers in `backend/src/controllers`.
7. Put domain logic in `backend/src/services`.
8. Add validation, authentication, and authorization at route or middleware boundaries.
9. Run lint and build checks before opening a pull request.

## Current Architecture Notes

- The frontend and backend are separated and can be deployed independently.
- The backend already follows a scalable controller/service/model/route structure.
- Runtime uploads and environment files are ignored from Git.
- The frontend is organized around layouts, pages, services, routes, Redux, and reusable components.

## Future Roadmap

- Add module-level APIs for students, staff, admissions, attendance, fees, exams, transport, and reports.
- Add request validation schemas for every backend route.
- Add centralized backend config validation.
- Add automated tests for frontend components and backend APIs.
- Add CI checks for lint, build, and tests.
- Add Docker Compose for local MongoDB and full-stack development.
- Add production deployment documentation.
- Add audit logging and role-based permissions per module.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
