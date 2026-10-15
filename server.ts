import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.ts';
import { connectDB, isMongoDB } from './config/db.ts';
import { SiteContentModel } from './models/SiteContent.ts';
import { defaultSiteContent } from './data/siteContentDefaults.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Export the Express app so Vercel can invoke it as a serverless function.
export default app;
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
  const mongoConnected = await connectDB();
  if (mongoConnected && isMongoDB()) {
    try {
      // Seed default static storefront content only once; never overwrite edits in Atlas.
      await SiteContentModel.updateOne(
        { key: 'main' },
        { $setOnInsert: defaultSiteContent },
        { upsert: true },
      );
      console.log('🧩 Website static content is ready in MongoDB (sitecontents).');
    } catch (error) {
      console.warn('Could not initialize website static content:', (error as Error).message);
    }
  }

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

// Vercel imports this module as a request handler; do not start a local listener there.
// Locally, `npm run dev` still starts the full Express + Vite server.
if (process.env.VERCEL !== '1') {
  startServer().catch(err => {
    console.error('Fatal error starting Stationery Shop server:', err);
    process.exit(1);
  });
}
