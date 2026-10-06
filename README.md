# Kushi Consultancy

Website for Kushi Civil and Structural Consultancy: a React + Vite single-page site with an Express API for CV uploads and the admin panel.

## Project Structure

- `frontend/` — React + Vite site (deployed to Netlify)
- `backend/` — Express API: admin login, CV upload, email notifications via Resend (deployed to Render)
- `netlify.toml` — Netlify build settings and security headers
- `frontend/public/_redirects` — proxies `/api/*` to the Render backend and enables SPA routing
- `DEPLOYMENT.md` — step-by-step guide to going live on kushiconsultancy.com

## Quick Start

Requires Node.js 20.19 or newer.

```bash
# Backend (terminal 1)
cd backend
cp .env.example .env   # then fill in the values
npm install
npm run dev            # http://localhost:3001

# Frontend (terminal 2)
cd frontend
npm install
npm run dev            # http://localhost:5174
```

## Checks

Run these before every deploy:

```bash
cd backend  && npm run lint && npm test
cd frontend && npm run lint && npm test && npm run build
```

## Environment Variables

### Backend (`backend/.env`, or the Render dashboard)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | yes (prod) | Set to `production` on Render |
| `ADMIN_USERNAME` | yes | Admin panel username |
| `ADMIN_PASSWORD` | yes | Admin password; a bcrypt hash (`$2b$...`) is recommended |
| `JWT_SECRET` | yes | Long random string used to sign login sessions |
| `RESEND_API_KEY` | yes | API key from resend.com for CV notification emails |
| `MAIL_FROM_ADDRESS` | yes | Sender, on a domain verified in Resend (e.g. `noreply@kushiconsultancy.com`) |
| `MAIL_TO_ADDRESS` | yes | Inbox that receives CV submissions |
| `CORS_ORIGINS` | no | Extra allowed origins, comma-separated (the production domains are built in) |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | no | Global rate limit (default 1000 requests / 15 min per IP) |

Generate a bcrypt hash for `ADMIN_PASSWORD`:

```bash
cd backend && node -e "require('bcrypt').hash(process.argv[1], 12).then(console.log)" 'your-password'
```

### Frontend (Netlify dashboard → Site configuration → Environment variables)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL. Use `/api` in production so requests go through the Netlify proxy |
| `VITE_CONTACT_EMAIL` | Public contact email (defaults to `madhu@kushiconsultancy.com`) |

## Known Limitations

- **Admin dashboard edits are stored in the admin's browser (`localStorage`)**, not on the server, so content changes made in the dashboard are only visible on that one browser. Publishing edits to all visitors needs a database-backed content API.
- The upload virus scan (`backend/utils/avScanner.js`) is a stub; uploaded files are type-checked by content but not scanned for malware.
