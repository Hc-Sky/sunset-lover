import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ items: [], total: 0, page: 1, pageSize: 20 });
});

export default router;
