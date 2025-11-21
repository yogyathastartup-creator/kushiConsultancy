// Central helper for resolving API base URL
export function getApiUrl() {
  const raw = import.meta.env.VITE_API_URL;
  const base = (raw && raw.trim().length > 0) ? raw.trim() : 'http://localhost:3002/api';
  return base.replace(/\/$/, ''); // remove trailing slash
}

export function logApiResolution(context = 'init') {
  // eslint-disable-next-line no-console
  console.log(`[api] (${context}) using API base:`, getApiUrl());
}