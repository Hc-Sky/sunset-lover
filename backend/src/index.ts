import express, { type Request, type Response } from 'express';
import cors from 'cors';
import spotsRouter from './routes/spots.js';
import roadsRouter from './routes/roads.js';
import { initDb } from './db.js';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use('/api/spots', spotsRouter);
app.use('/api/roads', roadsRouter);

const start = async () => {
  await initDb();
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
