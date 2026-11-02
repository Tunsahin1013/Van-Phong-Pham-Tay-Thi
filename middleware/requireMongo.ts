import { NextFunction, Request, Response } from 'express';
import { connectDB } from '../config/db.ts';
import { initializeMongoDataStore } from '../services/mongoDataStorePersistence.ts';
import { dataStore } from '../services/dataStore.ts';

/**
 * MongoDB is mandatory. Mutating API responses are held until the DataStore
 * snapshot and its domain collections have been durably written to Atlas.
 */
export async function requireMongo(req: Request, res: Response, next: NextFunction) {
  try {
    await connectDB();
    await initializeMongoDataStore();

    const originalEnd = res.end.bind(res);
    let ending = false;
    res.end = ((...args: any[]) => {
      if (ending) return res;
      ending = true;
      void dataStore.flush()
        .then(() => originalEnd(...args))
        .catch((error) => {
          console.error('MongoDB commit failed:', error);
          if (!res.headersSent) {
            res.statusCode = 503;
            res.removeHeader('Content-Length');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          }
          originalEnd(JSON.stringify({
            success: false,
            message: 'Không thể lưu dữ liệu vào MongoDB Atlas. Vui lòng thử lại sau khi kiểm tra kết nối.',
          }));
        });
      return res;
    }) as Response['end'];

    next();
  } catch (error) {
    console.error('MongoDB is required but unavailable:', error);
    return res.status(503).json({
      success: false,
      message: 'MongoDB Atlas chưa sẵn sàng. Hệ thống tạm dừng để tránh lưu dữ liệu sai hoặc mất dữ liệu.',
    });
  }
}
