# Kushi Consultancy

Welcome to the Kushi Consultancy project — a React + Vite single-page application that supports recruitment workflows and CV uploads.

## Project Structure (high level)

- `src/` — React application code

- `server/` — Express API and server-side utilities

- `public/` — static assets

- `package.json` — scripts and dependencies

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start frontend (Vite):

   ```bash
   npm run dev
   ```

3. Start server (separate terminal):

   ```bash
   npm run dev:server
   ```

## Admin account — create/update (bcrypt)

The server no longer uses MongoDB for admin credentials. Ensure all credentials are managed securely using environment variables or other secure storage solutions.

## Security

- Use strong secrets for `JWT_SECRET` and related environment variables.

- Remove any references to `MONGODB_URI` from your environment variables.

## Features

- **Authentication**: Secure login and session management.

- **File Uploads**: Upload CVs with validation.

- **Email Notifications**: Automated email services.

- **Health Check Endpoint**: Monitor server status.

## Environment Variables

### Server-Side Variables

- `PORT`: Port number for the server (default: 3001).

- `JWT_SECRET`: Secret key for JWT authentication.

- `JWT_REFRESH_SECRET`: Secret key for JWT refresh tokens.

- `EMAIL_USER`: Email service username.

- `EMAIL_PASSWORD`: Email service password.

- `CORS_ORIGINS`: Comma-separated list of allowed origins for CORS.

### Client-Side Variables

- `VITE_API_URL`: Base URL for API endpoints.

## SEO

- **Prerendered pages.** `npm run build` (in `frontend/`) renders each public route to static HTML (`scripts/prerender.mjs`), so crawlers get the real content. Admin and unknown paths get an empty app shell (`app-shell.html`).
- **Head tags.** Each page gets its own title, description, keywords, canonical, Open Graph/Twitter tags and JSON-LD (`frontend/src/seo/`). Page list and defaults live in `frontend/src/seo/siteConfig.js`.
- **robots.txt and sitemap.xml** are generated on every build from the same page list and the admin SEO settings.
- **Admin → SEO tab** saves to `PUT /api/seo` (admin login required). Settings are stored in `backend/data/seo-settings.json` (or `SEO_SETTINGS_PATH`) and take effect on the next deploy.

Netlify build variables:

| Variable | Purpose |
| --- | --- |
| `SEO_API_URL` | Backend endpoint, e.g. `https://api.kushiconsultancy.com/api/seo`. If set and unreachable, the build fails so an unpublished change can't go live silently. |
| `SITE_URL` | Canonical origin, default `https://kushiconsultancy.com` |

After the first deploy, submit `https://kushiconsultancy.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools, then paste the verification codes into the admin SEO tab and redeploy.

Note: on Render's free tier the filesystem is ephemeral, so point `SEO_SETTINGS_PATH` at a persistent disk or the saved SEO settings will reset on restart.

## Deployment

1. Deploy the project to Vercel:

   ```bash
   vercel
   ```

2. Ensure all environment variables are configured in the Vercel dashboard.
