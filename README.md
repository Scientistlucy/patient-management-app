# Patient Chart — Full Stack Practical

Web application for clinician sign-in, patient registration, vitals (BMI), conditional assessment forms, and patient listing with filters, pagination, and report download.

**Live app:** [https://patient-management-app-iota.vercel.app](https://patient-management-app-iota.vercel.app)  
**API:** [https://patient-management-app-production-ef47.up.railway.app/api](https://patient-management-app-production-ef47.up.railway.app/api)  
**Repo:** [https://github.com/Scientistlucy/patient-management-app](https://github.com/Scientistlucy/patient-management-app)

## Approach

**We built our own RESTful backend** (Node.js + Express + PostgreSQL).

The [Postman Patient Management App collection](https://documenter.getpostman.com/view/18832855/2sB3Wnx2PF) was used **only as a request/response shape reference** (field names, route patterns, and success messages) — not as the live production API. The Postman sample stack is Laravel + Sanctum + MySQL; ours is Express + JWT + PostgreSQL.

### Postman parity

All **8 documented Postman endpoints** are implemented:

| Method | Path | Postman success message / notes |
|--------|------|----------------------------------|
| POST | `/api/user/signup` | `Account creation Successfull` (spelling kept to match Postman) |
| POST | `/api/user/signin` | Returns `access_token`, `id`, `name`, `email`, timestamps |
| POST | `/api/patients/register` | `Patient Added successfully` (+ `proceed: 0`, also returns `id` / `unique`) |
| GET | `/api/patients/view` | Patient list array |
| GET | `/api/patients/show/:id` | Single patient wrapped in a one-item array |
| POST | `/api/vital/add` | `Vital Added Successfully` (+ `slug: 1`) |
| POST | `/api/visits/add` | `Visit Added Successfully` (+ `slug: 0`) |
| POST | `/api/visits/view` | Optional `visit_date` filter (response enriched for the UI — see below) |

**Shared success wrapper** (matches Postman):

```json
{
  "message": "success",
  "success": true,
  "code": 200,
  "data": {}
}
```

Protected routes require:

```http
Authorization: Bearer <access_token>
```

**Intentional difference:** Postman’s example for `POST /visits/view` returns a flat array of `{ name, age, bmi, status }`. Our API returns `{ rows, stats }` with richer row fields so the listing page can show filters, KPIs, pagination, and exports.

Postman intro mentions “CRUD”, but the published collection has **no update/delete** (or forgot-password) requests. Those are out of scope here.

### Extra endpoints (beyond Postman)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/patients/check-unique/:unique` | Patient Id uniqueness before register |
| POST | `/api/patients/seed-demo` | Idempotent demo census for listing demos |

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite + TypeScript + React Router |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT Bearer tokens (sign up / sign in) + Remember me |
| Validation | Zod |

## Product features

- Sign up / sign in with **Remember me** (persistent vs session storage)
- Patient registration with Patient Id uniqueness check
- Vitals capture with **auto BMI**
- BMI routing: **≤ 25 → General assessment**, **> 25 → Overweight assessment**
- Patient listing: search, gender, visit date, age filters, BMI status KPIs
- Pagination: **Previous / Next** and **Show 10 / 20 / 50**
- Download report as **CSV** or **PDF**
- Clinical Instrument UI (IBM Plex, teal brand mark)

## Design direction

**Clinical Instrument** — industrial utilitarian clinical UI.

- Fonts: IBM Plex Sans + IBM Plex Mono
- Differentiation: monospace Patient ID wristband + teal clinical palette
- Avoids generic purple SaaS / Inter / card-dashboard templates

## Project structure

```
patient-management-app/
  frontend/   # Vite React app (port 5173)
  backend/    # Express API (port 4000)
```

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (for local development)

## Setup

### 1. Database

Create a database named `patient_management`, then set credentials in `backend/.env` (copy from `backend/.env.example`):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/patient_management?schema=public"
JWT_SECRET="change-me-to-a-long-random-secret"
PORT=4000
APP_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
```

### 2. Backend

```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev
```

Optional demo seed:

```bash
npm run db:seed
```

API base: `http://localhost:4000/api`  
Health: `http://localhost:4000/api/health`

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` if needed:

```env
VITE_API_BASE=http://localhost:4000/api
```

```bash
npm run dev
```

App: `http://localhost:5173`

## Clinical flow

1. Sign up / sign in  
2. Patient registration → Vitals  
3. BMI ≤ 25 → General Assessment; BMI > 25 → Overweight Assessment  
4. Assessment save → Patient Listing (filter by visit date, paginate, download)

### BMI status (listing)

- Underweight: BMI &lt; 18.5  
- Normal: 18.5 ≤ BMI &lt; 25  
- Overweight: BMI ≥ 25  

## Demo walkthrough

1. Open the live app (or local) and create an account  
2. Register a patient with a unique Patient Id  
3. Enter height/weight and confirm BMI routing  
4. Complete the assessment form  
5. Open Patient Listing — try search, filters, **Show 10/20/50**, and report download  

## Hosting (so reviewers can test)

Reviewers only need **one frontend URL**. The API URL stays in env vars.

| Piece | Host |
|-------|------|
| Frontend | Vercel (`frontend/` root) |
| API + PostgreSQL | Railway (`backend/` root) |

### Backend (Railway)

1. Create a Railway project and add PostgreSQL  
2. Deploy the `backend/` folder  
3. Set env vars:
   - `DATABASE_URL` (Railway Postgres)
   - `JWT_SECRET`
   - `CORS_ORIGIN=https://your-app.vercel.app`
   - `APP_URL=https://your-app.vercel.app`
4. Confirm `/api/health` returns `{ "ok": true }`

### Frontend (Vercel)

1. Import the GitHub repo and set Root Directory to `frontend`  
2. Add:
   - `VITE_API_BASE=https://your-api.up.railway.app/api`
3. Deploy and share the Vercel URL

### What to send reviewers

1. Live app URL (Vercel)  
2. GitHub repo link  
3. Optional demo login credentials  
4. Optional short Loom walkthrough  
5. Note that the Postman collection was used as a **shape reference** only ([docs](https://documenter.getpostman.com/view/18832855/2sB3Wnx2PF))
