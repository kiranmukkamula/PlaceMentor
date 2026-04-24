# PlaceMentor - Full-Stack Student Placement Portal

A comprehensive portal for tracking placement companies, managing applications, and checking Resume vs. Job Description matching using AI.

## Architecture

- **Frontend:** React.js, Tailwind CSS v4, React Router dom, Vite
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (using raw SQL with `pg` module)
- **AI Integration:** Google Gemini API (`@google/genai`)

## Requirements
- Node.js (v18+)
- PostgreSQL Database
- Gemini API Key

## Setup & Local Development

1. **Database Config:**
   - Go to `server/.env.example`, rename it to `.env`.
   - Add your `DATABASE_URL`, `JWT_SECRET`, and `GEMINI_API_KEY`.
   - If utilizing docker, ensure your backend server aligns with standard PG settings.

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   # Manually execute the server/database.sql on your PostgreSQL instance
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Deployment Guide

### Database (PostgreSQL Cloud)
Deploy a managed PostgreSQL database through Supabase, Neon, or Railway. Update your `DATABASE_URL` everywhere.

### Backend (Render/Railway)
1. Set start command to: `node src/index.js`
2. Connect to your Cloud Postgres Database & run the `database.sql` script once.
3. Add all environment variables.

### Frontend (Vercel)
1. Update `client/src/context/AuthContext.jsx`'s `baseURL` to point directly to your deployed Backend URL (e.g., `https://placementor-api.onrender.com/api`).
2. Run standard deployment inside Vercel targeting the `client` directory as the Root.
3. Build command: `npm run build`
4. Output directory: `dist`.

## Docker Support
A `docker-compose.yml` has been included in the root to help provision a local PostgreSQL instance rapidly. Run `docker compose up -d` to get it started.
