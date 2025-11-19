// ⚠️ WARNING: This file is for SERVERLESS deployment (Vercel) only!
// It requires AWS S3 configuration and is NOT used by the Express server.
// The Express server handles uploads directly via /api/upload/cv endpoint.
// Required environment variables: S3_REGION, S3_KEY, S3_SECRET, S3_BUCKET

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3client = new S3Client({
  region: process.env.S3_REGION,
  credentials: process.env.S3_KEY && process.env.S3_SECRET ? { accessKeyId: process.env.S3_KEY, secretAccessKey: process.env.S3_SECRET } : undefined,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  try {
    const body = req.body || await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d))); });
    const { filename, contentType } = body;
    if (!filename || !contentType) return res.status(400).json({ ok: false, error: 'missing filename or contentType' });

    const key = `cvs/${Date.now()}-${filename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const putCommand = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3client, putCommand, { expiresIn: 900 });
    return res.json({ ok: true, url, key });
  } catch (err) {
    console.error('presign error', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}
