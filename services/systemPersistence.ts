import mongoose from 'mongoose';
import { dataStore, DEFAULT_STORE_SETTINGS, StoreSettings, SystemLogEntry } from './dataStore.ts';

const SETTINGS_COLLECTION = 'system_store_settings';
const LOGS_COLLECTION = 'system_activity_logs';

function mongoDb() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB Atlas chưa kết nối. Không cho phép sử dụng DataStore/JSON thay thế.');
  }
  return mongoose.connection.db;
}

export async function getPersistentStoreSettings(): Promise<StoreSettings> {
  const collection = mongoDb().collection(SETTINGS_COLLECTION);
  const saved = await collection.findOne({ key: 'primary' });
  if (saved) {
    const { _id, key: _key, ...fields } = saved;
    return { ...DEFAULT_STORE_SETTINGS, ...fields } as StoreSettings;
  }

  const defaults = dataStore.getStoreSettings();
  await collection.updateOne(
    { key: 'primary' },
    { $setOnInsert: { ...defaults, key: 'primary' } },
    { upsert: true },
  );
  return defaults;
}

export async function savePersistentStoreSettings(
  updates: Partial<Pick<StoreSettings, 'storeName' | 'logoUrl' | 'hotline' | 'address' | 'email'>>,
  updatedBy: string,
): Promise<StoreSettings> {
  const stored: StoreSettings = {
    ...dataStore.getStoreSettings(),
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || 'Quản trị viên',
  };
  await mongoDb().collection(SETTINGS_COLLECTION).updateOne(
    { key: 'primary' },
    { $set: { ...stored, key: 'primary' } },
    { upsert: true },
  );
  dataStore.updateStoreSettings(updates, updatedBy);
  return stored;
}

export async function appendPersistentSystemLog(
  entry: Omit<SystemLogEntry, 'id' | 'createdAt'> & Partial<Pick<SystemLogEntry, 'createdAt'>>,
): Promise<SystemLogEntry> {
  const localLog = dataStore.addSystemLog(entry);
  await dataStore.flush();
  await mongoDb().collection(LOGS_COLLECTION).replaceOne(
    { id: localLog.id },
    localLog as unknown as Record<string, unknown>,
    { upsert: true },
  );

  // Keep at most 2,000 recent audit records to bound storage.
  const overflow = await mongoDb().collection(LOGS_COLLECTION)
    .find({}, { projection: { _id: 1 } })
    .sort({ createdAt: -1 })
    .skip(2000)
    .limit(2500)
    .toArray();
  if (overflow.length) {
    await mongoDb().collection(LOGS_COLLECTION).deleteMany({ _id: { $in: overflow.map((item) => item._id) } });
  }
  return localLog;
}

export async function getPersistentSystemLogs(limit = 100): Promise<SystemLogEntry[]> {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit) || 100));
  return await mongoDb().collection(LOGS_COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .toArray() as unknown as SystemLogEntry[];
}

export async function createSystemBackupSnapshot() {
  const snapshot = dataStore.getBackupSnapshot();
  const [settings, logs] = await Promise.all([
    getPersistentStoreSettings(),
    getPersistentSystemLogs(500),
  ]);
  snapshot.storeSettings = settings;
  snapshot.systemLogs = logs;

  const db = mongoDb();
  const collections: Record<string, unknown[]> = {};
  const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((collection) => collection.name)
    .filter((name) => !name.startsWith('system.'));
  for (const name of collectionNames) {
    collections[name] = await db.collection(name).find({}).toArray();
  }

  return {
    storageMode: 'MongoDB Atlas only',
    dataStore: snapshot,
    mongoDatabase: db.databaseName,
    mongoCollections: collections,
    note: 'Bản sao lưu được lấy từ MongoDB Atlas. Tệp có thể chứa dữ liệu cá nhân và hash mật khẩu.',
  };
}
