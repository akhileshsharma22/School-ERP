# Contributing

Thank you for contributing to School ERP. This repository is intended to grow into a production-grade MERN application, so changes should be clear, scoped, and maintainable.

## Development Principles

- Keep frontend and backend responsibilities separate.
- Do not commit secrets, `.env` files, credentials, tokens, certificates, or production data.
- Prefer small pull requests with a focused purpose.
- Keep business logic in backend services, not directly in route definitions.
- Keep reusable frontend UI in components and route-level screens in pages.
- Use environment variables for deploy-specific configuration.
- Preserve existing behavior unless the change explicitly requires behavior updates.

## Branch Naming

Use short descriptive names:

```text
feature/student-module
fix/auth-token-refresh
docs/environment-guide
chore/package-cleanup
```

## Commit Style

Use clear prefixes:

```text
feat: add student list API
fix: handle invalid login response
docs: update setup instructions
chore: clean package scripts
refactor: extract dashboard KPI card
```

## Local Setup

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev:backend
npm run dev:frontend
```

## Pull Request Checklist

- The change is scoped to one feature, fix, or maintenance task.
- No `.env` file or secret is included.
- Frontend lint passes with `npm run lint`.
- Frontend production build passes with `npm run build`.
- Backend starts with `npm run dev:backend`.
- New environment variables are added to the relevant `.env.example`.
- Documentation is updated when setup, scripts, or architecture changes.

## Security

If you discover a security issue, do not open a public issue with exploit details. Report it privately to the repository maintainer.
