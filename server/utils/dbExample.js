import { getMongoClient } from './db.js';

export async function listUsers() {
  try {
    const client = getMongoClient();
    const db = client.db('kushi_consultancy');
    const users = await db.collection('users').find({}).limit(50).toArray();
    return users;
  } catch (err) {
    // If DB not initialized, throw a clear error
    throw new Error('Database not initialized or error listing users: ' + err.message);
  }
}

export async function addUser(user) {
  try {
    const client = getMongoClient();
    const db = client.db('kushi_consultancy');
    const res = await db.collection('users').insertOne(user);
    return res;
  } catch (err) {
    throw new Error('Database not initialized or error adding user: ' + err.message);
  }
}
