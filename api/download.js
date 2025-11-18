import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3client = new S3Client({
  region: process.env.S3_REGION,
  credentials: process.env.S3_KEY && process.env.S3_SECRET ? { accessKeyId: process.env.S3_KEY, secretAccessKey: process.env.S3_SECRET } : undefined,
});

export default async function handler(req, res) {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ ok: false, error: 'missing key' });
    const getCommand = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
    const url = await getSignedUrl(s3client, getCommand, { expiresIn: 60 });
    return res.json({ ok: true, url });
  } catch (err) {
    console.error('download error', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}
