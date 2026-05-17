import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { TRACKED_SYMBOLS } from '../services/finnhub';
import { AuthRequest, Params } from '../types';

const router = Router();

router.use(authMiddleware);

// POST /alerts
router.post('/', async (req: AuthRequest, res: Response) => {
  const { symbol, targetPrice } = req.body;

  if (!symbol || !targetPrice) {
    res.status(400).json({ message: 'symbol and targetPrice are required' });
    return;
  }

  if (!TRACKED_SYMBOLS.includes(symbol.toUpperCase())) {
    res.status(400).json({ message: `Symbol ${symbol} is not being tracked` });
    return;
  }

  if (typeof targetPrice !== 'number' || targetPrice <= 0) {
    res.status(400).json({ message: 'targetPrice must be a positive number' });
    return;
  }

  try {
    const alert = await prisma.alert.create({
      data: {
        userId: req.user!.id,
        symbol: symbol.toUpperCase(),
        targetPrice,
      },
    });

    res.status(201).json(alert);
  } catch {
    res.status(500).json({ message: 'Error creating alert' });
  }
});

// GET /alerts 
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(alerts);
  } catch {
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

// DELETE /alerts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params as Params;

  try {
    const alert = await prisma.alert.findUnique({
      where: { id: parseInt(id) },
    });

    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    if (alert.userId !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized to delete this alert' });
      return;
    }

    await prisma.alert.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Error deleting alert' });
  }
});

export default router;