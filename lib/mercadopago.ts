import MercadoPagoConfig, { Preapproval } from 'mercadopago';

let client: MercadoPagoConfig | null = null;
let preapproval: Preapproval | null = null;

export function getMercadoPagoClient(): MercadoPagoConfig {
  if (!client) {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN no configurado');
    client = new MercadoPagoConfig({ accessToken: token });
  }
  return client;
}

export function getPreapproval(): Preapproval {
  if (!preapproval) {
    preapproval = new Preapproval(getMercadoPagoClient());
  }
  return preapproval;
}

const PRICE_ARS = 120000; // ~$99 USD en ARS aproximado

export async function createSubscriptionPreapproval(
  payerEmail: string,
  externalReference: string,
  backUrl: string
) {
  const mp = getPreapproval();

  const result = await mp.create({
    body: {
      preapproval_plan_id: null, // sin plan fijo, creamos una suscripción individual
      reason: 'Roomy Pro - Suscripción mensual',
      external_reference: externalReference, // user_id
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: PRICE_ARS,
        currency_id: 'ARS',
      },
      back_url: backUrl,
      status: 'pending',
    },
  });

  return result;
}
