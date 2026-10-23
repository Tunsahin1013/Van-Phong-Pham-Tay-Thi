import mongoose from 'mongoose';
import { dataStore, DEFAULT_STORE_SETTINGS, StoreSettings, SystemLogEntry } from './dataStore.ts';
import { isMongoDB } from '../config/db.ts';

const SETTINGS_COLLECTION = 'system_store_settings';
const LOGS_COLLECTION = 'system_activity_logs';

function mongoDb() {
  if (!isMongoDB() || mongoose.connection.readyState !== 1 || !mongoose.connection.db) return null;
  return mongoose.connection.db;
}

export async function getPersistentStoreSettings(): Promise<StoreSettings> {
  const db = mongoDb();
  if (!db) return dataStore.getStoreSettings();

  try {
    const collection = db.collection(SETTINGS_COLLECTION);
    const saved = await collection.findOne({ key: 'primary' });
    if (saved) {
      const { _id, key: _key, ...fields } = saved;
      const settings = { ...DEFAULT_STORE_SETTINGS, ...fields } as StoreSettings;
      return settings;
    }

    const defaults = dataStore.getStoreSettings();
    await collection.updateOne({ key: 'primary' }, { $setOnInsert: { ...defaults, key: 'primary' } }, { upsert: true });
    return defaults;
  } catch (error) {
    console.error('Failed to read store settings from MongoDB; using DataStore fallback.', error);
    return dataStore.getStoreSettings();
  }
}

export async function savePersistentStoreSettings(
  updates: Partial<Pick<StoreSettings, 'storeName' | 'logoUrl' | 'hotline' | 'address' | 'email'>>,
  updatedBy: string,
): Promise<StoreSettings> {
  const db = mongoDb();
  if (!db) return dataStore.updateStoreSettings(updates, updatedBy);

  const stored: StoreSettings = {
    ...dataStore.getStoreSettings(),
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || 'Quản trị viên',
  };
  try {
    await db.collection(SETTINGS_COLLECTION).updateOne(
      { key: 'primary' },
      { $set: { ...stored, key: 'primary' } },
      { upsert: true },
    );
    // Update runtime fallback only after durable storage succeeds.
    dataStore.updateStoreSettings(updates, updatedBy);
    return stored;
  } catch (error) {
    console.error('Failed to persist store settings to MongoDB.', error);
    throw new Error('Không thể lưu cấu hình vào MongoDB. Vui lòng kiểm tra kết nối database rồi thử lại.');
  }
}

export async function appendPersistentSystemLog(
  entry: Omit<SystemLogEntry, 'id' | 'createdAt'> & Partial<Pick<SystemLogEntry, 'createdAt'>>,
): Promise<SystemLogEntry> {
  const localLog = dataStore.addSystemLog(entry);
  const db = mongoDb();
  if (!db) return localLog;

  try {
    const record: SystemLogEntry = localLog;
    const collection = db.collection(LOGS_COLLECTION);
    await collection.insertOne(record);

    // Keep at most 2,000 recent audit records to bound storage.
    const overflow = await collection.find({}, { projection: { _id: 1 } })
      .sort({ createdAt: -1 })
      .skip(2000)
      .limit(2500)
      .toArray();
    if (overflow.length) {
      await collection.deleteMany({ _id: { $in: overflow.map(item => item._id) } });
    }
    return record;
  } catch (error) {
    console.error('Failed to persist system audit log to MongoDB; retained in DataStore fallback.', error);
    return localLog;
  }
}

export async function getPersistentSystemLogs(limit = 100): Promise<SystemLogEntry[]> {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit) || 100));
  const db = mongoDb();
  if (!db) return dataStore.getSystemLogs(safeLimit);
  try {
    const records = await db.collection(LOGS_COLLECTION)
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .toArray();
    return records as unknown as SystemLogEntry[];
  } catch (error) {
    console.error('Failed to read system audit logs from MongoDB; using DataStore fallback.', error);
    return dataStore.getSystemLogs(safeLimit);
  }
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
  if (!db) {
    return {
      storageMode: 'DataStore JSON fallback',
      dataStore: snapshot,
      mongoDatabase: null,
      mongoCollections: null,
      note: 'MongoDB is not connected; this export covers the application DataStore snapshot only.',
    };
  }

  const collections: Record<string, unknown[]> = {};
  try {
    const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map(collection => collection.name)
      .filter(name => !name.startsWith('system.'));
    for (const name of collectionNames) {
      collections[name] = await db.collection(name).find({}).toArray();
    }
  } catch (error) {
    console.error('Could not export one or more MongoDB collections.', error);
    throw new Error('Không thể sao lưu đầy đủ MongoDB. Vui lòng kiểm tra kết nối và quyền đọc các collection.');
  }

  return {
    storageMode: 'DataStore plus connected MongoDB snapshot',
    dataStore: snapshot,
    mongoDatabase: db.databaseName,
    mongoCollections: collections,
    note: 'Backup includes application DataStore data and MongoDB collections. It may contain personal information and password hashes.',
  };
}
