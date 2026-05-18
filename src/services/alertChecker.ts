import { prisma } from '../config/prisma';
import { currentPrices } from './finnhub';
import { sendPriceAlertNotification } from './firebase';
import { io } from '../index';

let timerId: NodeJS.Timeout | null = null;

export const initAlertChecker = (): void => {
  const checkAlerts = async () => {
    try {
      const pendingAlerts = await prisma.alert.findMany({
        where: { triggered: false },
        include: { user: true },
      });

      if (pendingAlerts.length > 0) {
        for (const alert of pendingAlerts) {
          const currentPrice = currentPrices[alert.symbol];
          if (!currentPrice) continue;

          if (currentPrice >= alert.targetPrice) {
            console.log(
              `Alert triggered for ${alert.symbol}: current $${currentPrice} >= target $${alert.targetPrice}`
            );

            await prisma.alert.update({
              where: { id: alert.id },
              data: { triggered: true },
            });

            await prisma.inAppNotification.create({
              data: {
                userId: alert.userId,
                title: `🚨 ${alert.symbol} Price Alert!`,
                message: `${alert.symbol} reached $${currentPrice.toFixed(2)} — your target was $${alert.targetPrice.toFixed(2)}`,
              },
            });

            io.emit(`notification_${alert.userId}`, {});

            if (alert.user.fcmToken) {
              sendPriceAlertNotification(
                alert.user.fcmToken,
                alert.symbol,
                currentPrice,
                alert.targetPrice
              ).catch((err) =>
                console.error(`FCM failed for user ${alert.user.id}:`, err)
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Alert checker error:', error);
    } finally {
      timerId = setTimeout(checkAlerts, 30000);
    }
  };

  checkAlerts();
  console.log('Alert checker initialized runs continuously with 30s delay');
};