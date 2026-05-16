import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getAllQuotes, getStockQuote, TRACKED_SYMBOLS } from '../services/finnhub';
import { AuthRequest, Params } from '../types';

const router = Router();

// All routes here require authentication
router.use(authMiddleware);

// GET /stocks returns all stocks with current prices
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const quotes = await getAllQuotes();
    res.status(200).json(quotes);
  } catch {
    res.status(500).json({ message: 'Error fetching stock quotes' });
  }
});

// GET /stocks/:symbol — returns a single stock quote
router.get('/:symbol', async (req: AuthRequest, res: Response) => {
  const { symbol } = req.params as Params;

  if (!TRACKED_SYMBOLS.includes(symbol.toUpperCase())) {
    res.status(404).json({ message: `Symbol ${symbol} is not being tracked` });
    return;
  }

  try {
    const quote = await getStockQuote(symbol.toUpperCase());
    res.status(200).json(quote);
  } catch {
    res.status(500).json({ message: 'Error fetching stock quote' });
  }
});

export default router;