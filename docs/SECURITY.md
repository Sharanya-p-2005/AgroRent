# AgroRent Security Architecture & Hardening Specifications

Security is a foundational pillar of AgroRent. This document outlines the defensive measures, authorization boundaries, cryptographic mechanisms, and operational practices implemented to protect rural farmers, machinery owners, and financial transactions.

---

## 1. Authentication & Identity Management

- **Password Hashing**: Uses `bcryptjs` with salt rounds = 10. Passwords are never logged, echoed in error messages, or stored in plaintext.
- **Role-Based Access Control (RBAC)**:
  - Three distinct roles: `FARMER`, `OWNER`, and `ADMIN`.
  - Public registration only allows selecting `FARMER` or `OWNER`. Public registration as `ADMIN` is strictly blocked with a `400 Bad Request`.
  - Admin accounts must be provisioned directly via backend seeds or elevated via authenticated database administrators.
- **JWT Session Security**:
  - Stateless JSON Web Tokens signed with a secure `JWT_SECRET`.
  - Tokens expire after 7 days (`JWT_EXPIRES_IN=7d`).
  - Tokens are transmitted via `Authorization: Bearer <token>` HTTP headers.
  - User ID, role, and active status are extracted and verified on every protected request.

---

## 2. API & Data Access Authorization

- **Layered Middleware**:
  - `requireAuth`: Verifies token signature and user existence.
  - `requireFarmer`: Restricts access to farmer-specific workflows (equipment bookings, livestock orders).
  - `requireOwner`: Restricts access to machinery owners and service providers.
  - `requireAdmin`: Restricts access to platform management, approvals, reports, and audit logs.
- **Resource Ownership Validation**:
  - Machinery owners can only edit or delete equipment matching their own `owner_id`.
  - Farmers can only view and cancel their own bookings and orders.
  - Notification state mutations are scoped strictly to the authenticated `user_id`.

---

## 3. Financial & Payment Security

- **Strict Server-Side Pricing**: The client cannot submit or dictate payment amounts. Amounts are looked up and computed directly from database tables (`equipment.price_per_hour * hours`, `animal_listings.price * quantity`).
- **Cryptographic Signature Verification**:
  - Razorpay order completion requires HMAC SHA-256 validation of `razorpay_order_id + "|" + razorpay_payment_id` against `RAZORPAY_KEY_SECRET`.
  - Webhooks verify `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` using raw request buffers.
- **Zero Sensitive Credential Storage**:
  - The database **never** stores credit/debit card numbers, CVVs, expiration dates, UPI PINs, or bank passwords.
  - Dynamic UPI QR codes conform to the NPCI Bharat UPI specification and do not handle user credentials.
- **Cash Transaction Safeguards**: Cash payments remain in `CASH_PENDING` status until authorized by verified administrative or operational staff.

---

## 4. SQL Injection & Database Protection

- **Parameterized Queries**: All database queries utilize parameterized placeholders (`$1`, `$2`, etc.) via the PostgreSQL client. String concatenation of raw user input into SQL queries is strictly prohibited.
- **Strong Typing & Constraints**: Check constraints (`CHECK`), foreign key cascades, and unique constraints prevent invalid or duplicate state transitions.

---

## 5. Network, Request & AI Security

- **HTTP Security Headers**: `helmet` is enabled to mitigate clickjacking, MIME sniffing, and cross-site scripting.
- **CORS Configuration**: Restricts origins to trusted frontend domains with credentials enabled.
- **Rate Limiting**:
  - Authentication endpoints (`/api/auth/login`, `/api/auth/register`) are throttled to 30 attempts per 15 minutes to defeat credential stuffing and brute-force attacks.
  - AI Assistant endpoints (`/api/ai/chat`) are rate-limited to 30 requests per minute per user.
- **AI Model Isolation**:
  - The Google Gemini API key is maintained exclusively on the server and is never exposed to browser bundles.
  - Input prompts are validated and bounded to maximum character lengths to avoid token exhaustion.
  - The AI Assistant operates in a read-only advisory capacity and cannot execute arbitrary SQL queries or mutate database records.

---

## 6. Audit Trail & Data Redaction

- **Immutable Audit Logging**: Administrative interventions, account status changes, and listing approvals are written to the append-only `audit_logs` table.
- **Automated PII Redaction**: Keys matching `password`, `secret`, `pin`, `token`, and `credential` are automatically stripped before writing state diffs to JSONB log fields.
