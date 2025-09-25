import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let database: Db | null = null;
let initializing: Promise<Db> | null = null;

const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME ?? 'ssr';

const ensureIndexes = async (db: Db) => {
  const spots = db.collection('spots');
  await spots.createIndex({ location: '2dsphere' });
  await spots.createIndex({ region: 1, country: 1, type: 1 });

  const roads = db.collection('roads');
  await roads.createIndex({ center: '2dsphere' });
  await roads.createIndex({ region: 1, country: 1 });
};

export const initDb = async (): Promise<Db> => {
  if (database) {
    return database;
  }

  if (!initializing) {
    initializing = (async () => {
      client = new MongoClient(uri);
      await client.connect();
      const db = client.db(dbName);
      await ensureIndexes(db);
      database = db;
      return db;
    })();
  }

  return initializing;
};

export const getDB = (): Db => {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
};
