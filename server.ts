import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.ts';
import { connectDB } from './config/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// REST API
// ================================

app.use('/api', apiRouter);

// ================================
// HEALTH CHECK
// ================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Stationery Shop API is running seamlessly'
  });
});

// ================================
// LOCAL DEVELOPMENT
// ================================

async function startLocalServer() {
  await connectDB();

  // Chỉ dùng Vite middleware khi chạy local
  const { createServer: createViteServer } = await import('vite');

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(
      `🚀 Stationery Shop Server running at http://localhost:${PORT}`
    );

    console.log(
      `📦 REST API mounted at http://localhost:${PORT}/api`
    );
  });
}

// ================================
// CHỈ CHẠY SERVER KHI LOCAL
// ================================

if (!process.env.VERCEL) {
  startLocalServer().catch((err) => {
    console.error(
      'Fatal error starting Stationery Shop server:',
      err
    );

    process.exit(1);
  });
}

// ================================
// EXPORT EXPRESS APP CHO VERCEL
// ================================

export default app;