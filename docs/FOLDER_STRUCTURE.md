# Folder Structure

This repository is organized as a two-application MERN project. The frontend and backend are intentionally independent so each can evolve, test, and deploy separately.

## Root

```text
school-erp/
├── backend/
├── frontend/
├── docs/
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── package.json
└── README.md
```

The root contains repository-level documentation, shared scripts, and GitHub-facing metadata.

## Backend

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   ├── services/
│   └── utils/
├── uploads/
├── .env.example
├── package.json
└── server.js
```

### Backend Guidelines

- `config/`: infrastructure setup such as MongoDB connections.
- `controllers/`: Express request and response handlers.
- `middlewares/`: authentication, role authorization, error handling, and request middleware.
- `models/`: Mongoose models and schema definitions.
- `routes/`: Express route definitions and route-level middleware composition.
- `seed/`: local development seed scripts.
- `services/`: business rules and domain workflows.
- `utils/`: small reusable backend helpers.
- `uploads/`: local runtime uploads. Contents are ignored by Git.

Keep controllers thin. Put reusable business logic in services and shared helpers in utils.

## Frontend

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── layouts/
│   ├── pages/
│   ├── redux/
│   ├── routes/
│   ├── schemas/
│   └── services/
├── .env.example
├── package.json
└── vite.config.js
```

### Frontend Guidelines

- `assets/`: bundled assets imported by React.
- `components/`: reusable UI components and feature components.
- `config/`: menu and frontend configuration.
- `constants/`: shared constants such as roles.
- `layouts/`: application shells such as dashboard layout.
- `pages/`: route-level screens.
- `redux/`: Redux Toolkit store and slices.
- `routes/`: React Router definitions and protected routes.
- `schemas/`: client-side validation schemas.
- `services/`: Axios clients and API access functions.

Keep API calls inside services. Keep route structure inside routes. Keep state ownership clear in Redux slices or local component state.

## Naming Conventions

- Use PascalCase for React components.
- Use camelCase for functions and variables.
- Use kebab-case for route URLs.
- Use plural folder names for collections of similar files.
- Use descriptive module names as the application grows, such as `students`, `fees`, `attendance`, and `reports`.
