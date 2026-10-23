
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getInitialSeedData } from './data/seedData.ts';

dotenv.config();

async function seedMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Không tìm thấy MONGODB_URI trong file .env');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Không kết nối được database MongoDB');
  }

  console.log(`Đã kết nối database: ${db.databaseName}`);

  if (db.databaseName !== 'test') {
    throw new Error(
      `Dừng để bảo vệ dữ liệu: database hiện tại là "${db.databaseName}", không phải "test".`
    );
  }

  const seed = getInitialSeedData();

  const collections = [
    { name: 'users', data: seed.users },
    { name: 'categories', data: seed.categories },
    { name: 'products', data: seed.products },
    { name: 'vouchers', data: seed.vouchers },
    { name: 'suppliers', data: seed.suppliers },
    { name: 'orders', data: seed.orders },
    { name: 'reviews', data: seed.reviews },
    { name: 'inventories', data: seed.inventoryLogs },
    { name: 'wallettransactions', data: seed.walletTransactions },
    { name: 'notifications', data: seed.notifications },
    { name: 'conversations', data: seed.conversations },
    { name: 'chatmessages', data: seed.chatMessages },
  ];

  try {
    for (const collection of collections) {
      const target = db.collection(collection.name);
      let added = 0;
      let kept = 0;

      for (const item of collection.data as Array<{ id: string }>) {
        if (!item.id) {
          console.warn(
            `[${collection.name}] Bỏ qua bản ghi không có id`
          );
          continue;
        }

        const exists = await target.findOne(
          { id: item.id },
          { projection: { _id: 1 } }
        );

        if (exists) {
          kept++;
          continue;
        }

        try {
          await target.insertOne(item as Record<string, unknown>);
          added++;
        } catch (error) {
          // Nếu bản ghi vừa được thêm bởi tiến trình khác, giữ nguyên.
          if (
            error instanceof Error &&
            'code' in error &&
            (error as { code?: number }).code === 11000
          ) {
            kept++;
            continue;
          }
          throw error;
        }
      }

      console.log(
        `[${collection.name}] Đã thêm: ${added}; giữ nguyên: ${kept}`
      );
    }

    console.log('Hoàn tất nhập dữ liệu mẫu.');
  } finally {
    await mongoose.disconnect();
  }
}

seedMongo().catch((error) => {
  console.error('Nhập dữ liệu thất bại:', error);
  process.exitCode = 1;
});
