## Reflection

### 1. What was the most challenging part of building this boilerplate? How did you overcome it?
One of the most challenging parts was dealing with framework/library quirks, environment differences, and test-state issues while wiring everything together—such as Express 5 making `req.query` getter-only (causing `TypeError` when middleware tries to reassign it), adapting shell commands to Windows PowerShell, and running into `409` duplicate-email or `404` missing-ID responses during repeated API testing when database state wasn't reset between runs.

I overcame these by reading stack traces carefully to pinpoint the exact file and line, fixing root issues in the middleware or service layer (like safely mutating/assigning query parameters and checking actual database rows), and testing endpoints incrementally against MySQL.

### 2. How does this boilerplate differ from your Midterm project? What specific improvements did you make?
Earlier projects often keep routes, validation, database queries, and error responses tightly coupled or in fewer files just to get features working quickly. This boilerplate uses a clear layered architecture (`config`, `routes`, `middleware`, `controllers`, `services`, `entities`, `dto`, `utils`, `migrations`, `seeds`, `tests`, and `logs`) so each part has a single responsibility.

Specific improvements include:
* **Separation of concerns:** Controllers handle HTTP requests and responses, while services encapsulate business logic and TypeORM data access.
* **Centralized validation & error handling:** Joi schemas validate incoming payloads/params/query strings upfront, and custom error classes feed into a single error-handling pipeline.
* **Safer persistence & observability:** TypeORM migrations and seed scripts manage schema and initial data, `bcrypt` hashes passwords, and Winston provides structured logging alongside dedicated unit and integration test folders.

### 3. Why is centralized error handling better than try-catch in every controller?
Centralized error handling keeps error responses consistent across every endpoint (`success`, error code, message, and environment-appropriate stack details) without repeating `try/catch` blocks and HTTP status mapping in every controller action. It also reduces the chance of accidentally leaking raw database or internal errors to clients and ensures unexpected or async errors are handled uniformly in one place.

### 4. How does request validation with Joi improve security and code quality?
* **Security:** Joi validates and sanitizes untrusted input (`body`, `params`, `query`) before it reaches controllers or services—catching invalid types or IDs early and stripping unexpected fields (`stripUnknown: true`).
* **Code quality:** Services and controllers can assume incoming data already conforms to expected rules, keeping business logic clean and free of repetitive manual field checks.

### 5. What's the difference between synchronize: true and migrations? Why are migrations essential for production?
`synchronize: true` tells TypeORM to automatically update database tables on startup to match entity definitions. While convenient for quick local prototyping, it is risky because it can drop columns or modify tables without an explicit audit trail.

Migrations are versioned, ordered scripts (`up` and `down`) that track schema changes in source control. They are essential in production because they make database changes predictable, repeatable, reviewable, and reversible without risking accidental data loss.

### 6. How does structured logging (Winston) help in production debugging compared to console.log?
Unlike plain `console.log` statements, Winston adds timestamps, log levels (`debug`, `info`, `warn`, `error`), context/service labels, and structured metadata or error stacks. Using log levels and transports (such as rotating `combined.log` and `error.log` files) makes it much easier to filter logs, trace failures after they happen, and keep production output focused without losing critical error details.

### 7. If you had to add a new feature (e.g., Product CRUD), how would you use this boilerplate? What would you need to add?
I would follow the existing layered structure end-to-end:
1. **Database layer:** Create `Product` in `src/entities/`, generate/run a migration in `src/migrations/`, and add sample data in `src/seeds/` if needed.
2. **Validation & types:** Add DTOs in `src/dto/` and Joi schemas for create/update/query/param validation.
3. **Business & HTTP layers:** Implement `ProductService` in `src/services/`, add controller handlers in `src/controllers/`, wire routes with `validate(...)` middleware in `src/routes/`, and register the route on the Express app.
4. **Testing:** Add unit tests in `tests/unit/` and endpoint tests in `tests/integration/`.

### 8. What additional features would you add to make this boilerplate even more production-ready?
* **Authentication & Authorization:** JWT or session-based auth, token refresh/revocation, and role-based access control middleware.
* **Request Correlation & Auditability:** Attach a unique request ID per incoming request and include it in logs and responses to trace requests end-to-end.
* **Startup & Lifecycle Hardening:** Strict environment variable validation at boot, graceful shutdown (`SIGTERM`/`SIGINT`) that closes HTTP connections and `AppDataSource`, and health/readiness checks verifying database connectivity.
* **Automated Testing & CI:** Integration tests against a dedicated test database and CI checks for TypeScript compilation, linting, and tests.


1. Authentication vs. Authorization (with real-world examples)Authentication checks who you are—like scanning your ID at the building entrance.Authorization checks what you're allowed to do—like only IT staff having keycard access to the server room even after entering the building.2. Why JWT is "stateless" and how it helps scalabilityThe server doesn't have to save session data in memory or a database because the token itself holds the user claims and is verified with a secret key. Any server instance can check requests independently, making horizontal scaling behind a load balancer much easier.3. The three parts of a JWT and what each doesHeader: Shows token type (JWT) and signing algorithm (like HS256).Payload: Holds user data/claims (like userId, email, iat, exp).Signature: Signs the header + payload with a secret key so the server knows the token hasn't been tampered with.4. Why never put sensitive data (like passwords) in the JWT payloadJWT payloads are only encoded (Base64URL), not encrypted—anyone who gets the token can decode and read it. Keep sensitive info out and keep payloads small.5. How bcrypt protects passwords, plus "salt" and "rounds"bcrypt hashes passwords slowly on purpose so brute-force and GPU attacks take way too long.Salt: Random data per password so identical passwords produce different hashes and block lookup tables.Rounds: Sets the cost/iterations ($2^{\text{rounds}}$)—higher rounds mean slower hashing and stronger brute-force protection.6. What happens if someone steals a JWT, and how to mitigate itWhoever steals the token can act as that user until it expires. Mitigate it by keeping expiration short, using HTTPS, storing tokens safely (like HttpOnly cookies), and rotating/revoking tokens when needed.7. Why HTTPS matters when sending JWTsWithout HTTPS, tokens sent in headers or cookies can be intercepted over the network. HTTPS encrypts the connection so nobody can read or alter the token in transit.8. Short-lived access token vs. long-lived refresh tokenAccess token: Short-lived (minutes/hours) and sent on API calls—limits damage if stolen.Refresh token: Long-lived (days/weeks) and used to get a new access token without making the user log in again constantly.9. How auth middleware knows who is making the requestIt reads the Bearer token from the Authorization header, verifies it, decodes the payload (like userId), and attaches that user info to req before moving to the route handler.10. Adding role-based authorization (e.g., admin vs. regular user)Add a role column on the User entity and include it in the JWT payload, type req.user with role, create a role-check middleware (returning 403 Forbidden if unauthorized), and attach it after authMiddleware on restricted routes.
