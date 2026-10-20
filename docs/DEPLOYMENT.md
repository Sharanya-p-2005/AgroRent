# AgroRent Production Deployment Guide

This guide provides step-by-step instructions for deploying AgroRent across standard production hosting platforms.

---

## Architecture Overview

AgroRent can be deployed either as a unified full-stack Node.js container or decoupled into separate frontend and backend deployments.

```
       [ Client Browser / PWA ]
                  │
        HTTPS (Port 443/3000)
                  │
        ┌─────────▼─────────┐
        │  Vite React App   │ (Vercel / Netlify / Nginx)
        └─────────┬─────────┘
                  │  /api/*
        ┌─────────▼─────────┐
        │ Express.js Server │ (Render / Railway / Cloud Run)
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │  PostgreSQL 15+   │ (Managed Cloud SQL / RDS / Neon)
        └───────────────────┘
```

---

## 1. Prerequisites & Preparation

1. **Managed PostgreSQL Database**:
   - Provision a PostgreSQL database instance on AWS RDS, Google Cloud SQL, Neon, or Supabase.
   - Note the connection URI: `postgres://<user>:<password>@<host>:<port>/<dbname>?sslmode=require`
2. **Razorpay Account (Payments)**:
   - Generate Key ID and Key Secret from the Razorpay Dashboard (Test or Live).
   - Set Webhook URL to: `https://<your-backend-domain>/api/payments/webhook`
3. **Google Gemini API Key (AI Assistant)**:
   - Generate an API key from Google AI Studio.

---

## 2. Environment Variables Specification

### Backend Environment Variables
Set these variables in your hosting provider's dashboard (Render, Railway, Cloud Run):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | HTTP port listener | `3000` |
| `DATABASE_URL` | PostgreSQL connection URI | `postgres://user:pass@host:5432/agrorent?sslmode=require` |
| `JWT_SECRET` | 64+ char cryptographic secret | `f8c4e7...long_random_key...` |
| `JWT_EXPIRES_IN` | Session token lifetime | `7d` |
| `FRONTEND_URL` | Allowed client origin for CORS | `https://your-frontend-app.vercel.app` |
| `RAZORPAY_KEY_ID` | Merchant Key Identifier | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Secret key for HMAC signing | `secret_...` |
| `RAZORPAY_WEBHOOK_SECRET`| Webhook verification secret | `whsec_...` |
| `UPI_ID` | Platform Merchant VPA | `agrorent@upi` |
| `AI_PROVIDER` | AI SDK driver | `gemini` |
| `AI_API_KEY` | Gemini API Key | `AIzaSy...` |
| `AI_MODEL` | Gemini Model identifier | `gemini-3.8-flash` |

### Frontend Environment Variables
Set these in your frontend host (Vercel, Netlify):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Fully qualified backend URL | `https://your-backend-app.onrender.com` |
| `VITE_RAZORPAY_KEY_ID` | Public Key ID for checkout popup | `rzp_live_...` |
| `VITE_MAP_TILE_URL` | OpenStreetMap or Mapbox tile URL | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |

---

## 3. Option A: Unified Full-Stack Node.js Deployment (Single Server)

Best suited for Cloud Run, Render Web Service, or Railway.

1. **Build Command**:
   ```bash
   npm run build
   ```
   *Compiles Vite frontend into `dist/` and builds `server.ts` into a self-contained CommonJS bundle at `dist/server.cjs`.*

2. **Start Command**:
   ```bash
   npm start
   ```
   *(Executes `node dist/server.cjs`)*

---

## 4. Option B: Decoupled Deployment

### Frontend (Vercel / Netlify)
1. **Root Directory**: `.`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. Configure Single Page Application (SPA) rewrites so all paths route to `/index.html`.
   - Vercel `vercel.json`:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```

### Backend (Render / Railway)
1. **Root Directory**: `.`
2. **Build Command**: `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
3. **Start Command**: `node dist/server.cjs`
4. Set `FRONTEND_URL` to your Vercel/Netlify URL to enable CORS credentials.

---

## 5. Post-Deployment Verification

1. Ping health check: `curl -I https://<your-backend-domain>/api/health` (should return `200 OK` with `status: "healthy"`).
2. Verify migrations auto-applied on initial boot in backend container logs.
3. Test Admin login with seeded credentials and immediately change default passwords.
4. Perform an end-to-end test booking and payment in Razorpay test mode.
