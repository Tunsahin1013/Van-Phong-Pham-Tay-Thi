import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let connectionPromise: Promise<void> | null = null;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    connectionPromise = null;
  }

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('Thiếu MONGODB_URI. Tây Thi yêu cầu MongoDB Atlas và không hỗ trợ lưu dữ liệu bằng JSON.');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    }).then(() => {
      console.log(`Đã kết nối MongoDB Atlas: ${mongoose.connection.name}`);
    }).catch((error) => {
      connectionPromise = null;
      throw new Error(`Không thể kết nối MongoDB Atlas: ${(error as Error).message}`);
    });
  }

  await connectionPromise;
}

