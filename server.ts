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
const isProduction = process.env.NODE_ENV === 'production';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Stationery Shop API is running seamlessly' });
});

async function startServer() {
  // Connect to MongoDB Atlas if available, else JSON fallback
  await connectDB();

  if (!isProduction) {
    // Vite Dev Server middleware mode for full-stack SPA
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Serve static production build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Stationery Shop Server running on http://0.0.0.0:${PORT}`);
    console.log(`📦 REST API mounted at http://0.0.0.0:${PORT}/api`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting Stationery Shop server:', err);
  process.exit(1);
});
