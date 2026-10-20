# AgroRent Database Architecture & Schema Documentation

AgroRent utilizes a relational PostgreSQL database engineered for high data integrity, transactional consistency, and optimized agricultural queries.

---

## 1. Relational Entity Relationship Architecture

```
                    ┌──────────────────────────┐
                    │          USERS           │
                    │  (id, role, status, ...) │
                    └─────────────┬────────────┘
                                  │ 1:1
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼───────────┐ ┌─────────▼───────────┐ ┌─────────▼───────────┐
│   FARMER_PROFILES   │ │   OWNER_PROFILES    │ │  SERVICE_PROFILES   │
└─────────────────────┘ └─────────────────────┘ └──────────┬──────────┘
                                                           │
          ┌────────────────────────────────────────────────┤
          │                                                │
┌─────────▼───────────┐ ┌─────────────────────┐ ┌──────────▼──────────┐
│      EQUIPMENT      │ │   ANIMAL_LISTINGS   │ │  SERVICE_BOOKINGS   │
└─────────┬───────────┘ └──────────┬──────────┘ └─────────────────────┘
          │                        │
┌─────────▼───────────┐ ┌──────────▼──────────┐
│ EQUIPMENT_BOOKINGS  │ │    ANIMAL_ORDERS    │
└─────────┬───────────┘ └──────────┬──────────┘
          │                        │
          └───────────┬────────────┘
                      │
            ┌─────────▼───────────┐
            │      PAYMENTS       │
            └─────────────────────┘
```

---

## 2. Table Specifications

### `users`
Core identity table supporting Role-Based Access Control (RBAC).
- `id` (VARCHAR(36) PK)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `phone` (VARCHAR(20) UNIQUE NOT NULL)
- `password_hash` (VARCHAR(255) NOT NULL - bcrypt salted)
- `role` (VARCHAR(20) CHECK: `FARMER`, `OWNER`, `ADMIN`)
- `status` (VARCHAR(20) CHECK: `ACTIVE`, `SUSPENDED`, `INACTIVE`)
- `is_active` (BOOLEAN DEFAULT true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### `equipment`
Agricultural machinery inventory (Tractors, Harvesters, Tillers, Sprayers).
- `id` (VARCHAR(36) PK)
- `owner_id` (FK -> users(id) ON DELETE CASCADE)
- `name`, `category`, `brand`, `model`, `price_per_hour`, `location`
- `availability_status` (`AVAILABLE`, `UNAVAILABLE`)
- `approval_status` (`PENDING`, `APPROVED`, `REJECTED`)
- `latitude`, `longitude` (DOUBLE PRECISION for spatial proximity queries)

### `equipment_bookings`
Rental transactions with duration and hourly pricing calculations.
- `id` (VARCHAR(36) PK)
- `equipment_id` (FK -> equipment(id) ON DELETE CASCADE)
- `farmer_id` (FK -> users(id))
- `owner_id` (FK -> users(id))
- `booking_date`, `start_time`, `end_time`, `duration_hours`, `total_amount`
- `booking_status` (`PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`)
- `payment_status` (`PENDING`, `PAID`, `FAILED`, `CASH_PENDING`)

### `animal_listings` & `animal_orders`
Livestock and poultry catalog (Cattle, Goats, Sheep, Poultry, Breeding pairs).
- Tracks quantity, breed, age, health certification, delivery details, and order state transitions.

### `service_profiles` & `service_bookings`
Commercial equipment drivers and farm laborers.
- Daily/hourly wage rates, verification approval, and booking calendar.

### `payments`
Immutable financial transaction ledger.
- Single-target constraint: links to either `equipment_booking_id`, `animal_order_id`, or `service_booking_id`.
- Razorpay order ID, payment ID, HMAC signature, and dynamic Bharat UPI references.

### `government_schemes` & `saved_schemes`
Central & State subsidy directory with full eligibility criteria and direct portal links.

### `delivery_tracking`
Live dispatch breadcrumb logs with GPS coordinates and driver assignments.

### `audit_logs`
Append-only administrative and security audit trail with automatic redaction of credentials.

### `platform_settings`
System governance key-value configuration (maintenance mode, commission percentage).

---

## 3. Database Indexes

Production query performance is guarded by targeted B-tree indexes:
- `idx_users_role`, `idx_users_status`, `idx_users_is_active`
- `idx_equipment_owner_id`, `idx_equipment_category`, `idx_equipment_approval_status`
- `idx_bookings_farmer_id`, `idx_bookings_owner_id`, `idx_bookings_date`, `idx_bookings_status`
- `idx_animal_seller_id`, `idx_animal_category`, `idx_orders_status`, `idx_orders_buyer_id`
- `idx_service_user_id`, `idx_service_type`, `idx_service_bookings_farmer`, `idx_service_bookings_date`
- `idx_payments_user_id`, `idx_payments_reference`, `idx_payments_status`
- `idx_notifications_user_id`, `idx_notifications_is_read`
- `idx_audit_logs_user_id`, `idx_audit_logs_action`, `idx_audit_logs_created_at`
- `idx_delivery_tracking_order_id`, `idx_delivery_tracking_driver_id`

---

## 4. Migration Execution
Migrations are executed automatically in lexicographical order from `/backend/migrations/*.sql` upon server startup via `backend/src/services/migrationService.ts`.
