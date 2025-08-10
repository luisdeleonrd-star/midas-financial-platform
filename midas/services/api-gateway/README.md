# API Gateway

Proxies to internal services with optional JWT verification.

Routes:
- `/auth/*` -> auth-service
- `/registry/*` -> registry-service (requires JWT)
- `/finance/*` -> finance-service (requires JWT)
- `/billing/*` -> billing-service (requires JWT)
- `/messaging/*` -> messaging-service (requires JWT)
- `/reporting/*` -> reporting-service (requires JWT + admin)