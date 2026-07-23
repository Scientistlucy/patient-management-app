# Patient Chart — Full Stack Practical

Web application for patient registration, vitals (BMI), conditional assessment forms, and patient listing.

## Approach

**We built our own RESTful backend.** The [Postman Patient Management App collection](https://documenter.getpostman.com/view/18832855/2sB3Wnx2PF) was used **only as a request/response shape reference** (field names and route patterns), not as the live production API.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite + TypeScript + React Router |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT Bearer tokens + email password reset (Nodemailer/SMTP)
| Validation | Zod |

## Design direction

**Clinical Instrument** — industrial utilitarian clinical UI.

- Fonts: IBM Plex Sans + IBM Plex Mono
- Differentiation: monospace Patient ID wristband strip + teal chart rail
- Avoids generic purple SaaS / Inter / card-dashboard templates

## Project structure

```
patient-management-app/
  frontend/   # Vite React app (port 5173)
  backend/    # Express API (port 4000)
```

## Prerequisites

- Node.js 20+
- PostgreSQL running locally

## Setup

### 1. Database

Create a database named `patient_management`, then set credentials in `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/patient_management?schema=public"
JWT_SECRET="change-me-to-a-long-random-secret"
PORT=4000
```

Copy from `backend/.env.example` if needed.

### Email (Forgot password → real inbox)

Password reset sends a real email with a link like:

`http://localhost:5173/reset-password?email=...&token=...`

Add SMTP settings in `backend/.env` (Gmail example):

```env
APP_URL="http://localhost:5173"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your.email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="Patient Chart <your.email@gmail.com>"
```

For Gmail: turn on 2-Step Verification, then create an **App Password** and use that as `SMTP_PASS` (not your normal Gmail password).

Flow:
1. User clicks **Forgot password?** and enters email  
2. Backend emails a reset link  
3. User opens the link → **Create new password** page  
4. After save, sign in with the new password  

### 2. Backend

```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev
```

API base: `http://localhost:4000/api`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/user/signup` | Register clinician user |
| POST | `/api/user/signin` | Login → `access_token` |
| POST | `/api/patients/register` | Register patient (`unique` = Patient Id) |
| GET | `/api/patients/view` | List patients |
| GET | `/api/patients/show/:id` | View patient |
| POST | `/api/vital/add` | Add vitals |
| POST | `/api/visits/add` | Add assessment (diet and/or drugs) |
| POST | `/api/visits/view` | Listing (+ optional `visit_date` filter) |

Protected routes require `Authorization: Bearer <token>`.

## Clinical flow

1. Sign up / sign in  
2. Patient registration → Vitals  
3. BMI ≤ 25 → General Assessment; BMI > 25 → Overweight Assessment  
4. Assessment save → Patient Listing (filter by visit date)

### BMI status (listing)

- Underweight: BMI &lt; 18.5  
- Normal: 18.5 ≤ BMI &lt; 25  
- Overweight: BMI ≥ 25  

## Demo walkthrough

1. Open the app and create an account  
2. Register a patient with a unique Patient Id  
3. Enter height/weight and confirm BMI routing  
4. Complete the assessment form  
5. Open Patient Listing and try the visit-date filter  

## Hosting (so reviewers can test)

Reviewers only need **one frontend URL**. The API URL stays in env vars.

Recommended:
- **Frontend:** Vercel  
- **API + PostgreSQL:** Railway  

### Backend (Railway)

1. Create a Railway project and add a PostgreSQL plugin  
2. Deploy the `backend/` folder  
3. Set env vars from `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `APP_URL`)  
4. After the frontend URL exists, set:
   - `APP_URL=https://your-app.vercel.app`
   - `CORS_ORIGIN=https://your-app.vercel.app`

### Frontend (Vercel)

1. Import the GitHub repo and set Root Directory to `frontend`  
2. Add env var:
   - `VITE_API_BASE=https://your-api.up.railway.app/api`
3. Deploy and share the Vercel URL

### What to send reviewers

1. Live app URL (Vercel)  
2. Optional demo login  
3. GitHub repo link  
4. Optional short Loom walkthrough  
