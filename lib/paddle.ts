import { Paddle as PaddleSDK, Environment } from '@paddle/paddle-node-sdk';

let client: PaddleSDK | null = null;

function getPaddleClient(): PaddleSDK {
  if (!client) {
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) throw new Error('PADDLE_API_KEY no configurado');
    const env = process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox;
    client = new PaddleSDK(apiKey, {
      environment: env,
    });
  }
  return client;
}

// En producción cambiar este price ID por el de producción
const PRICE_ID = process.env.PADDLE_PRICE_ID || 'pri_01kwae0jtegy7fg5cab8jd6cxq';

export async function createCheckoutTransaction(
  userId: string,
  successUrl: string
) {
  const paddle = getPaddleClient();

  const transaction = await paddle.transactions.create({
    items: [
      {
        priceId: PRICE_ID,
        quantity: 1,
      },
    ],
    customData: {
      user_id: userId,
    },
    checkout: {
      url: successUrl,
    },
  });

  return transaction;
}

export async function unmarshalWebhook(rawBody: string, signatureHeader: string) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('⚠️ PADDLE_WEBHOOK_SECRET no configurado — saltando verificación');
    return JSON.parse(rawBody);
  }

  const paddle = getPaddleClient();
  return paddle.webhooks.unmarshal(rawBody, secret, signatureHeader);
}
