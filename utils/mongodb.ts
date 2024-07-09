import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance: Db;
let client: MongoClient;

export async function connectToCluster(uri: string) {
  let mongoClient;

  try {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();

    return mongoClient;
  } catch (error) {
      console.error('Connection to MongoDB failed!', error);
      process.exit();
  }
}

export async function getCollection(collectionName: string): Promise<Collection> {
  const client = await connectToCluster(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  client.connect();
  return client.db(process.env.MONGODB_NAME).collection(collectionName);
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
  }
}
