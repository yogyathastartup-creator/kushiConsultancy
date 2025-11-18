import { MongoClient, ServerApiVersion } from 'mongodb';
import { logger } from './logger.js';

// Use environment variable for MongoDB connection. Do NOT hard-code credentials in source.
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  // Fail fast to avoid accidental use of embedded credentials or unauthenticated DB access
  const msg = 'Missing MongoDB connection string. Set the MONGODB_URI environment variable.';
  logger.error(msg);
  throw new Error(msg);
}

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
