# Environment Setup Guide for Kushi Consultancy

## Overview
This guide explains how to use environment variables to keep sensitive credentials out of version control.

## Files Structure

```
kushi-consultancy/
├── .gitignore                    # Already configured to ignore .env files
├── frontend/
│   ├── .env.example              # Template for frontend env vars
│   ├── .env.local               # LOCAL ONLY - never commit (not included)
│   └── vite.config.js           # Auto-loads .env files
├── backend-java/
│   ├── .env.example              # Template for backend env vars
│   ├── src/main/resources/
│   │   └── application.properties # Uses environment variables
│   └── pom.xml
```

## Frontend Setup

### 1. Create `.env.local` in the `frontend/` directory:

```bash
# From frontend directory:
cp .env.example .env.local
```

### 2. Edit `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8080/api
VITE_MAX_FILE_SIZE=10
VITE_ADMIN_API_URL=http://localhost:8080/api/admin
```

### 3. Access in your React code:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Backend Setup (Java/Spring Boot)

### 1. Create `.env` in the `backend-java/` directory:

```bash
# From backend-java directory:
cp .env.example .env
```

### 2. Edit `backend-java/.env`:

Fill in all the sensitive values:

```
SERVER_PORT=8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
JWT_ACCESS_SECRET=your-base64-secret-key
JWT_REFRESH_SECRET=your-base64-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_TO_ADDRESS=recipient@example.com
CORS_ORIGINS=http://localhost:5174,http://localhost:4173
```

### 3. Running the application with environment variables:

**Option A: Using environment variables directly (Recommended)**

```bash
# Windows PowerShell
$env:SERVER_PORT=8080
$env:ADMIN_PASSWORD="your-password"
$env:SMTP_PASSWORD="your-password"
mvn spring-boot:run

# Or with all variables in one command
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8080 --app.auth.admin.password=your-password"
```

**Option B: Using a .env file (requires dotenv Maven plugin)**

```bash
# Install the dotenv-maven-plugin (if not already configured)
# Then run:
mvn clean install
mvn spring-boot:run
```

**Option C: Docker (Production)**

```bash
docker run -e SERVER_PORT=8080 -e SMTP_PASSWORD="your-password" your-image
```

## Important Security Notes ⚠️

1. **Never commit `.env` or `.env.local` files** - They are in `.gitignore`
2. **Never hardcode secrets** in code or config files
3. **Use strong passwords** for production
4. **Rotate credentials regularly** if they've been exposed
5. **Use different credentials for development and production**
6. **For deployed applications**, set environment variables:
   - **Render.com**: Dashboard → Environment
   - **Vercel**: Settings → Environment Variables
   - **Docker**: Use `-e` flag or docker-compose.yml
   - **Kubernetes**: Use Secrets

## Generating Secure Secrets

### JWT Secrets (Base64-encoded 256-bit keys)

```bash
# PowerShell (Windows)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Min 33 -Max 126) }) -join ''))

# Linux/Mac
openssl rand -base64 32
```

### Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select Mail and Windows (or your OS)
3. Generate app password
4. Use it in `SMTP_PASSWORD`

## Testing Environment Variables

### Frontend
```javascript
console.log(import.meta.env.VITE_API_URL);
```

### Backend
```java
@Value("${app.auth.admin.password}")
private String adminPassword;

System.out.println(adminPassword); // Should not be null
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `application.properties` shows `${VARIABLE_NAME}` | Environment variable not set. Set it before starting the app |
| Frontend API calls fail | Check `VITE_API_URL` in `.env.local` matches backend server |
| SMTP emails not sending | Verify `SMTP_USERNAME`, `SMTP_PASSWORD`, and Gmail app password settings |
| Build fails with `pom.xml` error | Make sure Java version is 11+ and Maven is installed |

## Next Steps

1. ✅ Remove exposed secrets from Git history using `git filter-repo`
2. ✅ Set up environment variables for development
3. ✅ Configure production environment variables on your hosting platform
4. ✅ Rotate all exposed credentials immediately
