import app from '../server.ts';
import { connectDB } from '../config/db.ts';

let dbConnected = false;

export default async function handler(req: any, res: any) {
  try {
    if (!dbConnected) {
      await connectDB();
      dbConnected = true;
    }

    return app(req, res);
  } catch (error) {
    console.error('Vercel API error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}