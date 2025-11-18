#!/usr/bin/env node
import dotenv from 'dotenv';
import { connectToDatabase, closeDatabaseConnection, getMongoClient } from '../utils/db.js';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  let password = process.env.ADMIN_PASSWORD || '';

  args.forEach((arg, i) => {
    if (arg === '--password' && args[i + 1]) password = args[i + 1];
  });

  if (!password) {
    console.error('Password required: provide --password or set ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  try {
    await connectToDatabase();
    const client = getMongoClient();
    const db = client.db(process.env.MONGO_DB_NAME || 'kushi_consultancy');

    // Upsert admin doc with plaintext password (per user request)
    const res = await db.collection('admins').updateOne(
      {},
      { $set: { username: process.env.ADMIN_USERNAME || 'admin', password: password, updatedAt: new Date() } },
      { upsert: true }
    );
    const adminDoc = await db.collection('admins').findOne({}, { projection: { username: 1, password: 1, updatedAt: 1 } });
    console.log('Admin document after update:');
    console.log(adminDoc);
  } catch (err) {
    console.error('Error setting plaintext admin password:', err.message || err);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

main();
