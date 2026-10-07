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

## Deployment

1. Deploy the project to Vercel:

   ```bash
   vercel
   ```

2. Ensure all environment variables are configured in the Vercel dashboard.
