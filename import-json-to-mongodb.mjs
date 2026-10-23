
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const file = path.resolve(process.cwd(), 'data', 'db.json');

if (!uri) {
  throw new Error('Thiếu MONGODB_URI trong file .env');
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const collections = {
  users: 'users',
  categories: 'categories',
  products: 'products',
  vouchers: 'vouchers',
  suppliers: 'suppliers',
  orders: 'orders',
  reviews: 'reviews',
  inventoryLogs: 'inventories',
  walletTransactions: 'wallettransactions',
  notifications: 'notifications',
  conversations: 'conversations',
  chatMessages: 'chatmessages',
};

await mongoose.connect(uri);

try {
  const db = mongoose.connection.db;

  for (const [key, name] of Object.entries(collections)) {
    const records = data[key];

    if (!Array.isArray(records) || records.length === 0) {
      console.log(`Bỏ qua ${key}: không có dữ liệu`);
      continue;
    }

    const collection = db.collection(name);

    for (const record of records) {
      if (!record.id) {
        throw new Error(`${key} có bản ghi thiếu id`);
      }

      await collection.updateOne(
        { id: record.id },
        { $set: record },
        { upsert: true }
      );
    }

    console.log(`${name}: ${records.length} bản ghi đã xử lý`);
  }

  console.log('Hoàn tất nhập dữ liệu!');
} finally {
  await mongoose.disconnect();
}
