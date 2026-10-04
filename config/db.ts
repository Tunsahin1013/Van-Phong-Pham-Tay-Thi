import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isMongoConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ No MONGODB_URI found. Stationery Shop is running smoothly on JSON Data Store fallback (Canteen-Goo architecture).');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas successfully!');
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed. Falling back to persistent JSON Data Store:', (error as Error).message);
    isMongoConnected = false;
    return false;
  }
}

export function isMongoDB(): boolean {
  return isMongoConnected;
}
