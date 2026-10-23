import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.ts';
import { connectDB, isMongoDB } from './config/db.ts';
import { SiteContentModel } from './models/SiteContent.ts';
import { defaultSiteContent } from './data/siteContentDefaults.ts';
import { systemAuditMiddleware } from './middleware/systemAudit.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit API mutations/failures without saving request bodies, passwords, or tokens.
app.use('/api', systemAuditMiddleware);
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Stationery Shop API is running seamlessly' });
});

async function startServer() {
  const mongoConnected = await connectDB();
  if (mongoConnected && isMongoDB()) {
    try {
      // Seed defaults once; never overwrite customized MongoDB site content.
      await SiteContentModel.updateOne(
        { key: 'main' },
        { $setOnInsert: defaultSiteContent },
        { upsert: true },
      );
      console.log('Website content is ready in MongoDB (sitecontents).');
    } catch (error) {
      console.warn('Could not initialize website content:', (error as Error).message);
    }
  }

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.resolve(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stationery Shop Server running at http://localhost:${PORT}`);
    console.log(`REST API mounted at http://localhost:${PORT}/api`);
  });
}

// Vercel imports the Express app as a serverless handler. Do not open a listener there.
if (process.env.VERCEL !== '1') {
  startServer().catch((err) => {
    console.error('Fatal error starting Stationery Shop server:', err);
    process.exit(1);
  });
}

export default app;
