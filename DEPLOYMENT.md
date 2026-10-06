# Going Live on kushiconsultancy.com

The domain is registered with **Zoho Domains**. The site keeps running where it already runs:

- **Frontend** on Netlify, served at `kushiconsultancy.com` and `www.kushiconsultancy.com`
- **Backend API** on Render (`kushicosultancy.onrender.com`), reached through the Netlify proxy at `kushiconsultancy.com/api/*`
- **Email** sent through Resend from `noreply@kushiconsultancy.com`

Zoho only holds the DNS records; it does not host the site.

## 0. Before you deploy

1. Merge this branch into `main` after the checks pass:
   ```bash
   cd backend  && npm ci && npm run lint && npm test
   cd frontend && npm ci && npm run lint && npm test && npm run build
   ```
2. Fix the dependency vulnerabilities (`npm audit` reports 31 in the backend and 14 in the frontend; all have non-breaking fixes):
   ```bash
   cd backend  && npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner && npm audit fix
   cd frontend && npm audit fix
   ```
   Re-run the checks above and commit the updated lockfiles.
3. Remove files that must not be in the repository:
   ```bash
   git rm -r --cached frontend/dist backend/uploads
   git rm package.json package-lock.json   # unused root package (only listed firebase)
   ```
   Then add `frontend/dist/` and `backend/uploads/` to `.gitignore` (the existing `/dist` and `/uploads/` rules only match the repository root).
   `backend/uploads/` contains a real applicant's CV. Removing it from the latest commit does not remove it from Git history, so rewrite history (e.g. `git filter-repo --path backend/uploads --invert-paths`) or make the repository private.

## 1. Render (backend)

Dashboard → your service → **Environment**. Set:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `ADMIN_USERNAME` | admin username |
| `ADMIN_PASSWORD` | bcrypt hash (see README) |
| `JWT_SECRET` | a long random string (`openssl rand -hex 32`) |
| `RESEND_API_KEY` | from resend.com |
| `MAIL_FROM_ADDRESS` | `noreply@kushiconsultancy.com` |
| `MAIL_TO_ADDRESS` | the inbox that should receive CVs |

Service settings: **Root Directory** `backend`, **Build Command** `npm ci`, **Start Command** `npm start`, **Health Check Path** `/api/health`.

The free Render plan sleeps after 15 minutes without traffic, and the first request then takes up to about a minute. That is the first CV upload or admin login after a quiet period. Upgrade to the Starter plan for an always-on API.

## 2. Netlify (frontend)

1. **Site configuration → Environment variables**: set `VITE_API_URL` = `/api`. All API calls then go through the proxy in `frontend/public/_redirects`, so the admin login cookie is first-party. Safari and Chrome block cross-site cookies, which breaks admin login when the site calls `onrender.com` directly.
2. **Deploys → Trigger deploy → Clear cache and deploy site**.
   Through the proxy, the backend sees Netlify's edge address rather than each visitor's IP, so rate limits apply per Netlify edge node. For a site of this size that is fine. If the admin is ever locked out by the login limit (10 failed attempts in 15 minutes), wait 15 minutes.
3. **Domain management → Add a domain**: add `kushiconsultancy.com` and choose to keep DNS at your current provider (external DNS). Netlify adds `www.kushiconsultancy.com` automatically and redirects one to the other.

## 3. Zoho Domains (DNS)

Zoho Domains → **My Domains** → **Manage** next to kushiconsultancy.com → **Manage DNS** → **Manage Records**.

1. Delete any existing parking `A`, `AAAA` or `CNAME` records for `@` and `www`.
2. Add:

| Type | Hostname | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `75.2.60.5` | 1 hour |
| CNAME | `www` | `inspiring-dolphin-fd2ca1.netlify.app` | 1 hour |

3. Back in Netlify → Domain management → **HTTPS**: click **Verify DNS configuration**. Netlify issues a free Let's Encrypt certificate once DNS resolves. Propagation usually takes minutes and can take up to 48 hours.

Do not touch existing `MX`/`TXT` records if you already use Zoho Mail.

## 4. Resend (email)

The backend sends from `noreply@kushiconsultancy.com`. Resend only allows that once the domain is verified.

1. resend.com → **Domains → Add Domain** → `kushiconsultancy.com`. Pick the region closest to you.
2. Resend shows several DNS records (an `MX` and a `TXT` on a `send` subdomain, and a DKIM `TXT` on `resend._domainkey`). Add each one in Zoho **Manage Records** exactly as shown.
3. Click **Verify** in Resend.
4. If you want people to email `madhu@kushiconsultancy.com` (shown on the site), set up the mailbox in Zoho Mail and add its MX/SPF records too. Otherwise set `VITE_CONTACT_EMAIL` in Netlify to an inbox that exists.

## 5. Optional: API on your own domain

To serve the backend as `api.kushiconsultancy.com` instead of through the Netlify proxy:

1. Render → service → **Settings → Custom Domains** → add `api.kushiconsultancy.com`.
2. Zoho: `CNAME` `api` → `kushicosultancy.onrender.com`.
3. Netlify: set `VITE_API_URL` = `https://api.kushiconsultancy.com/api`, and add `https://api.kushiconsultancy.com` to `connect-src` in `netlify.toml`.

## 6. Launch checklist

- [ ] `https://kushiconsultancy.com` and `https://www.kushiconsultancy.com` load with a padlock
- [ ] `https://kushiconsultancy.com/api/health` returns `{"status":"OK"}`
- [ ] Submit a test CV from `/upload-cv` and confirm the email arrives with the attachment
- [ ] Log in at `/admin/login`, reload the dashboard (session persists), then log out
- [ ] Footer shows a contact email that actually receives mail
- [ ] Test on a phone: no sideways scrolling, banner fully visible
- [ ] Submit `https://kushiconsultancy.com/sitemap.xml` in Google Search Console
