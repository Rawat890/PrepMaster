import mongoose from 'mongoose';
import { promises as dns } from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
/**
 * Establishes the MongoDB connection before the HTTP server starts.
 * The application exits with a clear error if the database is unavailable,
 * because the core application cannot operate without persistent storage.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is missing. Add it to server/.env.');
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
};

export default connectDB;
