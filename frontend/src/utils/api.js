// Central helper for resolving API base URL
export function getApiUrl() {
  const raw = import.meta.env.VITE_API_URL;
  const base = (raw && raw.trim().length > 0) ? raw.trim() : 'http://localhost:3001/api';
  return base.replace(/\/$/, ''); // remove trailing slash
}

export function logApiResolution() {
  // Intentionally no-op in production: avoid leaking backend URLs/infra details to the browser console.
}