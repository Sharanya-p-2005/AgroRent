# AgroRent – Agricultural Equipment Rental, Livestock Marketplace & Rural Services Platform

> **Empowering farmers through accessible technology, fair machinery rentals, and verified agricultural services.**

AgroRent is a full-stack digital agriculture ecosystem tailored for rural farmers, agricultural machinery owners, livestock breeders, and farm workers. The platform eliminates middleman exploitation by facilitating direct peer-to-peer equipment rentals, certified animal and bird trading, skilled labor booking, government subsidy discovery, live GPS dispatch tracking, and AI-powered multilingual agronomic guidance in Kannada and English.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Platform Features (Phases 1–12)](#2-platform-features-phases-112)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Installation](#5-installation)
6. [Environment Variables](#6-environment-variables)
7. [Database Setup](#7-database-setup)
8. [Database Migrations](#8-database-migrations)
9. [Seed Data & Demo Accounts](#9-seed-data--demo-accounts)
10. [Frontend Setup](#10-frontend-setup)
11. [Backend Setup](#11-backend-setup)
12. [Running the Development Server](#12-running-the-development-server)
13. [Production Build & Start](#13-production-build--start)
14. [Payment Configuration (Razorpay & Bharat UPI QR)](#14-payment-configuration)
15. [AI Configuration (Google Gemini Assistant)](#15-ai-configuration)
16. [Map & Geolocation Configuration](#16-map--geolocation-configuration)
17. [API Overview](#17-api-overview)
18. [User Roles & Access Control](#18-user-roles--access-control)
19. [Testing & Verification](#19-testing--verification)
20. [Deployment Guide](#20-deployment-guide)
21. [Troubleshooting & FAQs](#21-troubleshooting--faqs)

---

## 1. Project Overview

In rural India, high capital costs make modern agricultural machinery unaffordable for smallholder farmers, while machinery owners often face low asset utilization during off-peak windows. AgroRent bridges this divide:
- **For Farmers:** On-demand access to tractors, harvesters, tillers, sprayers, certified livestock, skilled drivers, and laborers with transparent hourly/daily pricing.
- **For Owners & Service Providers:** Guaranteed bookings, digital earnings tracking, verified reviews, and route-optimized dispatch.
- **For Platform Administrators:** Full platform oversight, RFC 4180 audit reports, comparative GMV/revenue analytics, append-only security logs, and infrastructure telemetry.

---

## 2. Platform Features (Phases 1–12)

* **Phase 1: Architecture & Authentication**: Role-Based Access Control (`FARMER`, `OWNER`, `ADMIN`), bcrypt password hashing, stateless JWT session tokens, and rural-friendly responsive UI.
* **Phase 2: Equipment Rental Engine**: Search, filter by hourly price/category/location, check calendar availability, book machinery, and track rental status.
* **Phase 3: Animal & Bird Marketplace**: Trading cattle, sheep, goats, and poultry with health certifications, photos, breed specifications, and stock counts.
* **Phase 4: Driver & Farm Worker Booking**: Verified commercial tractor/harvester drivers and seasonal labor crews with experience profiles and hourly/daily rates.
* **Phase 5: Government Schemes & Guidance**: Central & Karnataka State subsidy directory, required documents, official application links, and practical farming guides.
* **Phase 6: Payments & Dynamic UPI QR**: Dual-rail payments supporting Razorpay checkout (Cards/NetBanking/UPI) and instant NPCI Bharat UPI QR codes.
* **Phase 7: Delivery Tracking & Live GPS**: Order fulfillment pipeline with assigned drivers, real-time dispatch status, and coordinate breadcrumbs.
* **Phase 8: Notifications, Reviews & Favorites**: Contextual in-app notification center, star ratings with verified reviews, and one-click item bookmarking.
* **Phase 9: Interactive Maps & Spatial Radius**: Leaflet-based map views for nearby equipment, farms, and service providers.
* **Phase 10: Gemini AI Agricultural Assistant**: Multilingual AI agronomic consultant supporting Kannada and English queries, crop recommendations, and scheme navigation.
* **Phase 11: Admin Analytics, Reports & Audit Trail**: Platform-wide KPI dashboards, Gross GMV vs Net Take-Rate charts, streaming CSV exports, and immutable audit logs.
* **Phase 12: Production Readiness, Security & Hardening**: Rate limiting, Helmet security headers, SQL injection protection, error boundaries, skeleton loaders, and database indexes.
* **Phase 13: Advanced Features & Final Demo Enhancement**: Voice-enabled Kisan Sathi AI Assistant (Web Speech API in Kannada, Hindi, and English), real-time weather & agrometeorology telemetry cards, precision crop suitability advisory, machinery side-by-side comparison engine, instant printable tax invoices & receipts (`InvoiceReceiptModal`), farmer soil & acreage profile management (`FarmerProfileModal`), and administrator fast-governance toolbar.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router v7, Lucide React, Recharts, Leaflet.
- **Backend**: Node.js (ESM), Express.js 4, TypeScript via `tsx` / `esbuild`.
- **Database**: PostgreSQL 15+ (`pg` connection pool with automatic local zero-config PGlite fallback).
- **Security**: Helmet, CORS, bcryptjs, jsonwebtoken, sliding-window rate limiters.
- **Payments**: Razorpay Node SDK, Bharat UPI QR Generator (`qrcode`).
- **AI**: Google Gen AI SDK (`@google/genai`) powered by `gemini-3.8-flash`.

---

## 4. Project Structure

```
agro-rent/
├── backend/
│   ├── migrations/               # PostgreSQL schema migrations (001 through 011)
│   ├── seeds/                    # Seed script with demo accounts & listings
│   └── src/
│       ├── ai/                   # Gemini AI routes, controllers, and services
│       ├── config/               # Database pool and environment configuration
│       ├── controllers/          # Business logic handlers
│       ├── middleware/           # authMiddleware, rateLimiter, errorHandler, maintenance
│       ├── models/               # Data access objects with parameterized SQL
│       ├── routes/               # Express router declarations
│       ├── services/             # Core business services (payments, audit, analytics)
│       └── validators/           # Input validation schemas
├── frontend/
│   └── src/
│       ├── components/           # Reusable UI components & modals
│       │   ├── common/           # ErrorBoundary, SkeletonLoader, ConfirmDialog, etc.
│       │   ├── admin/            # Admin analytics, reports, audit logs, and settings
│       │   └── ...
│       ├── context/              # React AuthContext
│       ├── dashboards/           # Farmer, Owner, and Admin dashboards
│       ├── pages/                # HomePage, LoginPage, RegisterPage, PaymentPage
│       └── services/             # Axios API clients
├── docs/                         # Architecture runbooks & API specs
│   ├── API.md
│   ├── DATABASE.md
│   ├── DATABASE_BACKUP.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
├── .env.example                  # Environment variable reference
├── package.json                  # Root dependencies & build scripts
└── server.ts                     # Full-stack entry point binding Express + Vite
```

---

## 5. Installation

```bash
# 1. Clone repository
git clone https://github.com/example/agrorent.git
cd agrorent

# 2. Install dependencies
npm install
```

---

## 6. Environment Variables

Copy the example configuration to your local environment file:

```bash
cp .env.example .env
```

Key environment configurations:
- `DATABASE_URL`: PostgreSQL connection string. (If omitted in local development, AgroRent automatically initializes an embedded in-memory PostgreSQL engine).
- `JWT_SECRET`: 64+ character random string for signing auth tokens.
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay test/live credentials.
- `AI_API_KEY`: Google Gemini API key from AI Studio.
- `UPI_ID`: Merchant VPA (e.g. `agrorent@upi`) for dynamic QR generation.

---

## 7. Database Setup

AgroRent requires PostgreSQL 15+.
Create a database:
```sql
CREATE DATABASE agrorent;
```

---

## 8. Database Migrations

Migrations execute automatically on server startup. To inspect migration files, see `backend/migrations/`:
- `001_initial_schema.sql` (Users, profiles)
- `002_equipment_schema.sql` (Equipment, bookings)
- `003_animal_schema.sql` (Animals, orders)
- `004_service_profiles_schema.sql` (Drivers, workers)
- `005_payments_schema.sql` (Payments, single-target constraints)
- `006_government_schemes_schema.sql` (Schemes, bookmarks, guides)
- `007_notifications_reviews_favorites_schema.sql` (Alerts, ratings)
- `008_locations_delivery_tracking_schema.sql` (GPS, delivery logs)
- `009_ai_assistant_schema.sql` (Conversations, telemetry)
- `010_admin_analytics_audit_schema.sql` (Audit logs, platform settings)
- `011_production_indexes_constraints.sql` (Production indexes & B-tree tuning)

---

## 9. Seed Data & Demo Accounts

The database comes pre-seeded with rich demonstration data.

### Demo Credentials (Development Only):

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@agrorent.com` | `Admin@123` | System oversight, analytics, audit logs, settings |
| **Farmer** | `farmer@agrorent.com` | `Farmer@123` | Equipment rentals, animal buying, driver bookings |
| **Owner** | `owner@agrorent.com` | `Owner@123` | Machinery listings, incoming bookings, earnings |

*⚠️ Note: These credentials are strictly for demonstration. Change them in production.*

---

## 10. Frontend Setup

The frontend is integrated into the root project using Vite:
- **Port:** Served seamlessly alongside the backend on port `3000`.
- **CSS:** Tailwind CSS v4 configured via `@import "tailwindcss";`.
- **Icons:** Lucide React icons with semantic ARIA labels.

---

## 11. Backend Setup

The Express.js backend handles API routes under `/api/*`:
- Implements layered authorization with `requireAuth`, `requireFarmer`, `requireOwner`, `requireAdmin`.
- Encapsulates queries in parameterized model methods to protect against SQL injection.

---

## 12. Running the Development Server

```bash
npm run dev
```
Launches the dev server at `http://localhost:3000`.

---

## 13. Production Build & Start

```bash
# Compile frontend and bundle backend server
npm run build

# Start production server
npm start
```

---

## 14. Payment Configuration

AgroRent provides dual-rail payment processing:
1. **Razorpay**: Provides standard cards, net banking, and UPI intents. Amount is calculated server-side and signature is cryptographically verified via HMAC SHA-256.
2. **Dynamic UPI QR Code**: Encodes payment details into a standard Bharat UPI string (`upi://pay?pa=...`) rendered into an accessible QR code.
3. **Cash on Delivery**: Enters `CASH_PENDING` status until verified.

---

## 15. AI Configuration

Powered by Google Gemini:
- Set `AI_API_KEY` in your environment.
- Supports conversational agronomic guidance, crop advice, and subsidy navigation in English and Kannada.
- Protected by rate limiting and length boundaries.

---

## 16. Map & Geolocation Configuration

Uses Leaflet with OpenStreetMap tiles. Optional custom tile servers can be supplied via `VITE_MAP_TILE_URL`.

---

## 17. API Overview

Detailed specifications can be found in [`docs/API.md`](docs/API.md).
- `/api/auth/*`: Registration, Login, Current User, Logout
- `/api/equipment/*`: Machinery catalog, owner listings
- `/api/bookings/*`: Equipment rental reservations
- `/api/animals/*`: Livestock listings and orders
- `/api/services/*`: Tractor drivers and farm laborers
- `/api/payments/*`: Order initiation, verification, and UPI QR
- `/api/schemes/*`: Subsidy catalog and bookmarks
- `/api/deliveries/*`: Live GPS tracking and dispatch updates
- `/api/ai/*`: Multilingual conversational chat
- `/api/admin/*`: Analytics, reports, audit logs, system health

---

## 18. User Roles & Access Control

- **FARMER**: Can browse catalog, place orders, book drivers, save schemes, write reviews, and use AI.
- **OWNER**: Can list machinery, manage inventory, accept bookings, and view earnings.
- **ADMIN**: Can approve listings, moderate users, view financial reports, audit logs, and toggle maintenance mode.

---

## 19. Testing & Verification

Run integration regression tests across all 12 phases:
```bash
npm run lint
```
Tests can be executed against live endpoints to verify:
- Authentication & RBAC enforcement
- Equipment booking conflict checks
- Payment signature verification
- CSV export sanitization
- Audit trail immutability

---

## 20. Deployment Guide

Refer to [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full deployment instructions on Vercel, Netlify, Render, Railway, AWS, or Google Cloud.

---

## 21. Troubleshooting & FAQs

**Q: Database connection fails on local boot?**
A: If `DATABASE_URL` is omitted or PostgreSQL is unreachable, AgroRent gracefully boots an embedded PGlite instance so development never stops.

**Q: Why does registering as Admin fail with 400 Bad Request?**
A: Public registration is restricted to Farmers and Owners. Admin accounts must be created through backend seed scripts or authorized administrators.

**Q: How do I backup the database?**
A: See [`docs/DATABASE_BACKUP.md`](docs/DATABASE_BACKUP.md) for automated backup, restore, and retention procedures.
