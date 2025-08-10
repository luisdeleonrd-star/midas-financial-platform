# Auth Service

Endpoints:
- `GET /health`
- `GET /.well-known/jwks.json`
- `POST /signup` { email, password, role? }
- `POST /login` { email, password }

Env vars: `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_EXPIRES_IN`.