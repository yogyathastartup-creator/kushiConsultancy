// ⚠️ WARNING: This file is for SERVERLESS deployment (Vercel) only!
// It requires MongoDB configuration and is NOT used by the Express server.
// The Express server uses email for data storage, not MongoDB.
// Required environment variable: MONGODB_URI
// This stores upload metadata in MongoDB for serverless deployments.

export default async function handler(req, res) {
  return res.status(501).json({ ok: false, error: 'Not implemented' });
}
