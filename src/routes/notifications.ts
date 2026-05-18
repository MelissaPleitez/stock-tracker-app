import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types';

const router = Router();

router.use(authMiddleware);

// GET /notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.inAppNotification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50, 
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({ notifications, unreadCount });
  } catch {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PUT /notifications/read-all 
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.inAppNotification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch {
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// PUT /notifications/:id/read 
router.put('/:id/read', async (req: AuthRequest, res: Response) => {

    const idParam = req.params["id"];
    const id = parseInt(
    Array.isArray(idParam) ? idParam[0] : (idParam ?? "0"),
    10,
    );

  try {
    await prisma.inAppNotification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

export default router;