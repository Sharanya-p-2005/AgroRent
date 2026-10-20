# AgroRent REST API Documentation

This document specifies the complete REST API for the AgroRent agricultural technology platform across Phases 1 through 12.

---

## Base URL
- **Local Development / Production:** `http://localhost:3000/api`
- **Reverse Proxy Path:** `/api`

## Authentication
Protected routes require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <jwt_token>
```

---

## 1. System & Health Endpoints

### GET `/api/health`
Public infrastructure health check.
- **Access:** Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "status": "healthy",
  "message": "AgroRent API is running"
}
```

---

## 2. Authentication & Profiles (`/api/auth`)

### POST `/api/auth/register`
Register a new Farmer or Equipment/Service Owner.
- **Rate Limit:** 30 attempts per 15 minutes
- **Body**:
```json
{
  "name": "Ramesh Gowda",
  "email": "ramesh@example.com",
  "phone": "9876543210",
  "password": "Password@123",
  "confirmPassword": "Password@123",
  "role": "FARMER",
  "address": "Kudlu Farm Road",
  "village": "Kudlu",
  "taluk": "Anekal",
  "district": "Bengaluru Urban",
  "state": "Karnataka",
  "pincode": "560068"
}
```
*Note: Public users cannot register as `ADMIN`. Admin accounts are securely provisioned.*

### POST `/api/auth/login`
Authenticate existing user and obtain signed JWT.
- **Body**:
```json
{
  "email": "farmer@agrorent.com",
  "password": "Farmer@123"
}
```

### GET `/api/auth/me`
Retrieve currently authenticated profile.
- **Access:** `requireAuth`

---

## 3. Equipment Rental (`/api/equipment` & `/api/bookings`)

### GET `/api/equipment`
Browse approved and available agricultural machinery.
- **Query Params:** `search`, `category`, `location`, `minPrice`, `maxPrice`, `sortBy`

### POST `/api/equipment`
List machinery (Owners only).
- **Access:** `requireAuth` + `requireOwner`

### POST `/api/bookings`
Reserve equipment for specified date and duration.
- **Access:** `requireAuth` + `requireFarmer`
- **Body**:
```json
{
  "equipment_id": "uuid",
  "booking_date": "2026-09-15",
  "start_time": "08:00",
  "end_time": "14:00",
  "duration_hours": 6
}
```

---

## 4. Livestock & Poultry Marketplace (`/api/animals` & `/api/animal-orders`)

### GET `/api/animals`
Search approved animal and bird listings.
- **Query Params:** `category`, `type` (`ANIMAL` | `BIRD`), `search`, `minPrice`, `maxPrice`

### POST `/api/animal-orders`
Place livestock purchase order.
- **Access:** `requireAuth` + `requireFarmer`

---

## 5. Driver & Farm Worker Services (`/api/services` & `/api/service-bookings`)

### GET `/api/services/drivers`
Browse verified commercial tractor/harvester drivers.

### GET `/api/services/workers`
Browse seasonal farm laborers and harvesting specialists.

### POST `/api/service-bookings`
Book verified driver or farm worker.
- **Access:** `requireAuth` + `requireFarmer`

---

## 6. Payments & Dynamic UPI QR (`/api/payments`)

### POST `/api/payments/initialize`
Calculates exact amount from database and initiates an audit-verified transaction record.
- **Access:** `requireAuth`

### POST `/api/payments/create-order`
Creates verified Razorpay order with cryptographically anchored amount.
- **Access:** `requireAuth`

### POST `/api/payments/verify`
Cryptographically verifies Razorpay payment signature via HMAC SHA-256.
- **Access:** `requireAuth`

### POST `/api/payments/upi-qr`
Generates RFC-compliant Bharat UPI QR string: `upi://pay?pa=...&pn=...&am=...`

---

## 7. Delivery & Live GPS Tracking (`/api/deliveries`)

### GET `/api/deliveries/:orderId`
Retrieve real-time delivery tracking status and breadcrumbs.

### POST `/api/deliveries/:orderId/location`
Update live GPS coordinate breadcrumbs (Driver or Admin).

---

## 8. Government Schemes & Resources (`/api/schemes` & `/api/resources`)

### GET `/api/schemes`
Browse Central & Karnataka State agricultural subsidy schemes.

### POST `/api/schemes/:id/save`
Bookmark scheme to user's saved list.

---

## 9. AI Assistant (`/api/ai`)

### POST `/api/ai/chat`
Conversational agricultural guidance powered by Google Gemini (Kannada & English).
- **Rate Limit:** 30 requests / minute
- **Body**:
```json
{
  "message": "ನನ್ನ 2 ಎಕರೆ ಭೂಮಿಗೆ ಟ್ರ್ಯಾಕ್ಟರ್ ಬಾಡಿಗೆ ಮತ್ತು ಬೆಳೆ ಶಿಫಾರಸು ಬೇಕು",
  "language": "kn"
}
```

---

## 10. Admin Intelligence & Management (`/api/admin`)
*All Admin endpoints require `requireAuth` + `requireAdmin`.*

- `GET /api/admin/analytics/overview`: High-level agricultural KPI cards with honest comparison deltas.
- `GET /api/admin/analytics/revenue`: GMV vs Platform take-rate breakdowns.
- `GET /api/admin/reports/:type?format=csv`: RFC 4180 streaming CSV reports.
- `GET /api/admin/audit-logs`: Immutable, append-only security and operational audit trail.
- `GET /api/admin/system-health`: Live telemetry of Node.js, PostgreSQL connection latency, and services.
- `PUT /api/admin/settings`: Platform governance, maintenance mode, and commission rates.
