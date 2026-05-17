import admin from 'firebase-admin';
import { env } from '../config/env';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export const sendPriceAlertNotification = async (
  fcmToken: string,
  symbol: string,
  currentPrice: number,
  targetPrice: number
): Promise<void> => {
  const message: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title: 'Price Alert Triggered!',
      body: `${symbol} has reached $${currentPrice.toFixed(2)} (your alert was set at $${targetPrice.toFixed(2)})`,
    },
    data: {
      symbol,
      currentPrice: currentPrice.toString(),
      targetPrice: targetPrice.toString(),
      type: 'price_alert',
    },
  };

  await admin.messaging().send(message);
  console.log(`Notification sent for ${symbol} to token ${fcmToken.slice(0, 20)}...`);
};