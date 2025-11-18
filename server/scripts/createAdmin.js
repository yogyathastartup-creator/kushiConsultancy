#!/usr/bin/env node
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectToDatabase, closeDatabaseConnection, getMongoClient } from '../utils/db.js';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  // Accept --username and --password or fall back to env
  let username = process.env.ADMIN_USERNAME || 'admin';
  let password = process.env.ADMIN_PASSWORD || 'kushiadmin123';

  args.forEach((arg, i) => {
    if (arg === '--username' && args[i + 1]) username = args[i + 1];
    if (arg === '--password' && args[i + 1]) password = args[i + 1];
  });

  if (!password) {
    console.error('Password is required. Provide via --password or ADMIN_PASSWORD env var.');
    process.exit(1);
  }

  try {
    await connectToDatabase();
    const client = getMongoClient();
    const db = client.db(process.env.MONGO_DB_NAME || 'kushi_consultancy');

    const hashed = bcrypt.hashSync(password, 12);

    // Upsert admin document (single admin)
    const res = await db.collection('admins').updateOne(
      {},
      { $set: { username, password: hashed, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log('Admin user created/updated successfully.');
    console.log('Username:', username);
    if (res.upsertedId) console.log('Inserted id:', res.upsertedId._id);
  } catch (err) {
    console.error('Error creating admin user:', err.message || err);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

main();
