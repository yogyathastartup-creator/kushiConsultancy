import { MongoClient, ServerApiVersion } from 'mongodb';
import { logger } from './logger.js';

// Prefer environment variable; fallback to provided URI (not recommended for production)
const DEFAULT_URI = 'mongodb+srv://yogyathastartup_db_user:O9IGPOm0wI7tv1Hw@kushi-consultancy.9k1qe5o.mongodb.net/?appName=kushi-consultancy';
const uri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_URI;

let client;
let dbClient;

export async function connectToDatabase() {
  if (dbClient) return dbClient;

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    // Optionally test the connection
    await client.db('admin').command({ ping: 1 });
    logger.info('Connected to MongoDB');
    dbClient = client;
    return dbClient;
  } catch (err) {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    throw err;
  }
}

export function getMongoClient() {
  if (!dbClient) throw new Error('MongoDB client not initialized. Call connectToDatabase() first.');
  return dbClient;
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    dbClient = null;
    logger.info('MongoDB connection closed');
  }
}
