import mongoose from 'mongoose';
import { connectDB } from './config/db.ts';
import { initializeMongoDataStore } from './services/mongoDataStorePersistence.ts';

async function migrateToMongo() {
  try {
    await connectDB();
    await initializeMongoDataStore();
    console.log('Hoàn tất khởi tạo/migration dữ liệu Tây Thi trên MongoDB Atlas.');
  } finally {
    await mongoose.disconnect();
  }
}

migrateToMongo().catch((error) => {
  console.error('Migration sang MongoDB thất bại:', error);
  process.exitCode = 1;
});
