# Environment Strategy

Environment variables keep deploy-specific configuration out of source code. Real values must only live in local `.env` files, CI/CD secrets, or hosting provider secret managers.

## Files

```text
.env.example
backend/.env.example
frontend/.env.example
```

Example files are safe to commit. Real `.env` files are ignored by Git.

## Backend Variables

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | `development` | Runtime environment. |
| `PORT` | Yes | `5000` | Express server port. |
| `MONGO_URI` | Yes | `mongodb://127.0.0.1:27017/school_erp` | MongoDB connection string. |
| `JWT_SECRET` | Yes | `replace-with-a-long-random-secret` | Access token signing secret. |
| `JWT_REFRESH_SECRET` | Yes | `replace-with-a-different-long-random-secret` | Refresh token signing secret. |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS. |

## Frontend Variables

Vite only exposes variables prefixed with `VITE_`.

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | `http://localhost:5000/api` | Backend API base URL used by Axios services. |
| `VITE_APP_NAME` | No | `School ERP` | Public app display name. |

## Secret Rules

- Never commit `.env` files.
- Never commit MongoDB Atlas connection strings.
- Never commit JWT secrets.
- Never commit API keys, private certificates, or cloud credentials.
- Rotate secrets immediately if they are accidentally pushed.
- Keep production secrets in the deployment platform or CI/CD secret manager.
