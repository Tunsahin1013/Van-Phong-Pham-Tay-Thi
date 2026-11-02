import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { dataStore, DatabaseSchema } from './dataStore.ts';
import { getInitialSeedData } from '../data/seedData.ts';

const STATE_COLLECTION = 'application_state';

const COLLECTION_MAP: Array<{ collection: string; field: keyof DatabaseSchema }> = [
  { collection: 'users', field: 'users' },
  { collection: 'categories', field: 'categories' },
  { collection: 'products', field: 'products' },
  { collection: 'vouchers', field: 'vouchers' },
  { collection: 'suppliers', field: 'suppliers' },
  { collection: 'orders', field: 'orders' },
  { collection: 'reviews', field: 'reviews' },
  { collection: 'inventories', field: 'inventoryLogs' },
  { collection: 'wallettransactions', field: 'walletTransactions' },
  { collection: 'notifications', field: 'notifications' },
  { collection: 'conversations', field: 'conversations' },
  { collection: 'chatmessages', field: 'chatMessages' },
  { collection: 'system_activity_logs', field: 'systemLogs' },
];

let initialization: Promise<void> | null = null;
let mongoVersion = 0;

function getMongoDb() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB Atlas chưa kết nối. Dữ liệu không được lưu vào bộ nhớ thay thế.');
  }
  return mongoose.connection.db;
}

function withoutMongoId<T extends Record<string, unknown>>(record: T): Omit<T, '_id'> {
  const { _id: _ignored, ...clean } = record;
  return clean;
}

async function readCollection(collectionName: string): Promise<Record<string, unknown>[]> {
  const db = getMongoDb();
  return (await db.collection(collectionName).find({}).toArray())
    .map((record) => withoutMongoId(record as unknown as Record<string, unknown>));
}

function mergeById<T>(primary: T[], secondary: T[]): T[] {
  const result = [...primary];
  const seen = new Set(primary.map((item) => String((item as { id?: unknown }).id || '')));
  for (const item of secondary) {
    const id = String((item as { id?: unknown }).id || '');
    if (!id || !seen.has(id)) {
      result.push(item);
      if (id) seen.add(id);
    }
  }
  return result;
}

async function syncCollection(collectionName: string, records: unknown[]) {
  const db = getMongoDb();
  const collection = db.collection(collectionName);
  const docs = records
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => withoutMongoId(item));

  if (!docs.length) {
    await collection.deleteMany({});
    return;
  }

  const operations = docs
    .filter((doc) => typeof doc.id === 'string' && doc.id.length > 0)
    .map((doc) => ({
      replaceOne: {
        filter: { id: doc.id },
        replacement: doc,
        upsert: true,
      },
    }));

  if (operations.length) {
    await collection.bulkWrite(operations as any[], { ordered: true });
    await collection.deleteMany({ id: { $nin: operations.map((op) => op.replaceOne.filter.id) } });
  }
}

async function syncSnapshotCollections(safeSnapshot: DatabaseSchema): Promise<void> {
  const db = getMongoDb();
  for (const { collection, field } of COLLECTION_MAP) {
    await syncCollection(collection, (safeSnapshot[field] || []) as unknown[]);
  }
  await db.collection('system_store_settings').updateOne(
    { key: 'primary' },
    { $set: { key: 'primary', ...safeSnapshot.storeSettings } },
    { upsert: true },
  );
}

async function persistSnapshot(snapshot: DatabaseSchema): Promise<void> {
  const db = getMongoDb();
  const safeSnapshot = JSON.parse(JSON.stringify(snapshot)) as DatabaseSchema;

  // Compare-and-swap prevents a stale serverless instance from silently
  // overwriting a newer snapshot written by another instance.
  const result = await db.collection(STATE_COLLECTION).updateOne(
    { key: 'primary', version: mongoVersion },
    { $set: { data: safeSnapshot, updatedAt: new Date() }, $inc: { version: 1 } },
  );

  if (result.matchedCount !== 1) {
    const latest = await db.collection(STATE_COLLECTION).findOne({ key: 'primary' });
    if (latest?.data) {
      mongoVersion = Number(latest.version || 0);
      dataStore.loadSnapshot(latest.data as DatabaseSchema);
    }
    throw new Error('Dữ liệu MongoDB vừa được cập nhật từ phiên khác. Hệ thống đã tải lại dữ liệu mới; vui lòng thực hiện lại thao tác.');
  }

  mongoVersion += 1;
  await syncSnapshotCollections(safeSnapshot);
}

async function buildInitialSnapshot(): Promise<DatabaseSchema> {
  const db = getMongoDb();
  const state = await db.collection(STATE_COLLECTION).findOne({ key: 'primary' });
  if (state?.data && typeof state.data === 'object') {
    return state.data as DatabaseSchema;
  }

  const seed = getInitialSeedData();
  const legacyPath = path.resolve(process.cwd(), 'data', 'db.legacy.backup');
  let legacy: Partial<DatabaseSchema> = {};
  if (fs.existsSync(legacyPath)) {
    try {
      legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8')) as Partial<DatabaseSchema>;
      console.warn('Đang nhập dữ liệu db.json cũ vào MongoDB lần đầu. Sau bước này ứng dụng không đọc db.json nữa.');
    } catch (error) {
      throw new Error(`Không thể đọc dữ liệu JSON cũ để di chuyển sang MongoDB: ${(error as Error).message}`);
    }
  }

  const snapshot: DatabaseSchema = {
    users: [], categories: [], products: [], vouchers: [], suppliers: [], orders: [],
    reviews: [], inventoryLogs: [], walletTransactions: [], notifications: [],
    conversations: [], chatMessages: [], systemLogs: [],
    storeSettings: { ...dataStore.getStoreSettings() },
  };

  for (const { collection, field } of COLLECTION_MAP) {
    const mongoRecords = await readCollection(collection);
    const legacyRecords = Array.isArray(legacy[field]) ? legacy[field] as Record<string, unknown>[] : [];
    const seedRecords = (seed[field] || []) as unknown[];
    const baseRecords = mongoRecords.length ? mongoRecords : legacyRecords.length ? legacyRecords : seedRecords;
    const combined = mongoRecords.length && legacyRecords.length
      ? mergeById<Record<string, unknown>>(mongoRecords, legacyRecords)
      : baseRecords;
    (snapshot as unknown as Record<string, unknown[]>)[field] = combined;
  }

  const settings = await db.collection('system_store_settings').findOne({ key: 'primary' });
  if (settings) {
    snapshot.storeSettings = {
      ...snapshot.storeSettings,
      ...withoutMongoId(settings as unknown as Record<string, unknown>),
    } as DatabaseSchema['storeSettings'];
    delete (snapshot.storeSettings as unknown as Record<string, unknown>).key;
  } else if (legacy.storeSettings) {
    snapshot.storeSettings = { ...snapshot.storeSettings, ...legacy.storeSettings };
  }

  return snapshot;
}

export async function initializeMongoDataStore(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      const db = getMongoDb();
      let state: any = await db.collection(STATE_COLLECTION).findOne({ key: 'primary' });

      if (state?.data) {
        mongoVersion = Number(state.version || 0);
      } else {
        const snapshot = await buildInitialSnapshot();
        try {
          await db.collection(STATE_COLLECTION).insertOne({
            key: 'primary',
            version: 0,
            data: snapshot,
            updatedAt: new Date(),
          });
          state = { key: 'primary', version: 0, data: snapshot };
          mongoVersion = 0;
        } catch (error) {
          if (!(error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000)) {
            throw error;
          }
          state = await db.collection(STATE_COLLECTION).findOne({ key: 'primary' });
          if (!state?.data) throw error;
          mongoVersion = Number(state.version || 0);
        }
      }

      if (!state?.data) {
        throw new Error('Không thể khởi tạo snapshot dữ liệu trên MongoDB Atlas.');
      }
      dataStore.loadSnapshot(state.data as DatabaseSchema);
      dataStore.setPersistenceHandler(persistSnapshot);
      await syncSnapshotCollections(dataStore.getBackupSnapshot());
      console.log('MongoDB Atlas là nguồn dữ liệu chính; đã đồng bộ các collection nghiệp vụ.');
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  await initialization;
}
