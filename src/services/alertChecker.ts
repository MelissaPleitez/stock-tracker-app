import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { currentPrices } from './finnhub';
import { sendPriceAlertNotification } from './firebase';

export const initAlertChecker = (): void => {
  // Runs every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      // Get all alerts that haven't been triggered yet
      const pendingAlerts = await prisma.alert.findMany({
        where: { triggered: false },
        include: { user: true },
      });

      if (pendingAlerts.length === 0) return;

      for (const alert of pendingAlerts) {
        const currentPrice = currentPrices[alert.symbol];

        // Skip if we don't have a price for this symbol yet
        if (!currentPrice) continue;

        if (currentPrice >= alert.targetPrice) {
          console.log(
            `Alert triggered for ${alert.symbol}: current $${currentPrice} >= target $${alert.targetPrice}`
          );

          // Mark alert as triggered so we don't send it again
          await prisma.alert.update({
            where: { id: alert.id },
            data: { triggered: true },
          });

          // Send push notification if user has FCM token
          if (alert.user.fcmToken) {
            await sendPriceAlertNotification(
              alert.user.fcmToken,
              alert.symbol,
              currentPrice,
              alert.targetPrice
            );
          }
        }
      }
    } catch (error) {
      console.error('Alert checker error:', error);
    }
  });

  console.log('Alert checker initialized (runs every 30s)');
};