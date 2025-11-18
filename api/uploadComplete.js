import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  try {
    const body = req.body || await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d))); });
    const { key, originalName, name, email, phone, position, experience, location } = body;
    if (!key || !originalName) return res.status(400).json({ ok: false, error: 'missing key or originalName' });

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) return res.status(500).json({ ok: false, error: 'db not configured' });

    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db();
    const rec = {
      originalName,
      s3Key: key,
      uploaderName: name || null,
      uploaderEmail: email || null,
      phone: phone || null,
      position: position || null,
      experience: experience || null,
      location: location || null,
      uploadedAt: new Date()
    };
    const r = await db.collection('cvs').insertOne(rec);
    await client.close();
    return res.json({ ok: true, id: r.insertedId });
  } catch (err) {
    console.error('uploadComplete error', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}
