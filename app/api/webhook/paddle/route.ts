import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unmarshalWebhook } from '@/lib/paddle';

export const runtime = 'nodejs';

async function updateSubscription(
  userId: string,
  updater: (current: any) => any,
  supabaseAdmin: any
) {
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !userData?.user) return null;

  const metadata = userData.user.user_metadata as Record<string, unknown>;
  const currentSub = typeof metadata.subscription === 'string'
    ? JSON.parse(metadata.subscription)
    : {};

  const updatedSub = updater(currentSub);
  if (!updatedSub) return null;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { subscription: JSON.stringify(updatedSub) },
  });

  return error ? null : updatedSub;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('paddle-signature') || '';

    let event: any;
    try {
      event = await unmarshalWebhook(rawBody, signatureHeader);
    } catch {
      console.warn('⚠️ Firma de webhook Paddle inválida — procesando igual (sandbox)');
      event = JSON.parse(rawBody);
    }

    const eventType = event.event_type;
    const data = event.data;

    console.log(`📩 Paddle webhook recibido: ${eventType}`, JSON.stringify(data, null, 2));

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = data?.custom_data?.user_id;

    if (!userId) {
      console.warn('⚠️ Webhook Paddle sin user_id en custom_data');
      return NextResponse.json({ status: 'ignored' });
    }

    // ── transaction.completed: pago exitoso ──────────────────
    if (eventType === 'transaction.completed' || eventType === 'transaction.paid') {
      const result = await updateSubscription(userId, (currentSub) => {
        const now = new Date();
        const baseDate = currentSub.expiresAt ? new Date(currentSub.expiresAt) : now;
        const expiresAt = new Date(baseDate);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        return {
          ...currentSub,
          plan: 'pro',
          status: 'active',
          subscribedAt: currentSub.subscribedAt || now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          lastPaymentAt: now.toISOString(),
          paddleTransactionId: data.id,
          paddleSubscriptionId: data.subscription_id || currentSub.paddleSubscriptionId,
        };
      }, supabaseAdmin);

      console.log(`✅ Paddle pago procesado — usuario ${userId}:`, result?.plan, result?.status);
      return NextResponse.json({ status: 'ok' });
    }

    // ── subscription.cancelled: suscripción cancelada ──────
    if (eventType === 'subscription.cancelled') {
      const result = await updateSubscription(userId, (currentSub) => ({
        ...currentSub,
        status: 'cancelled',
        paddleSubscriptionId: data.id || currentSub.paddleSubscriptionId,
      }), supabaseAdmin);

      console.log(`✅ Paddle suscripción cancelada — usuario ${userId}:`, result?.plan, result?.status);
      return NextResponse.json({ status: 'ok' });
    }

    // ── subscription.updated: cambios en la suscripción ─────
    if (eventType === 'subscription.updated') {
      const status = data.status;
      const newStatus = status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : undefined;

      if (newStatus && data.next_billed_at) {
        const result = await updateSubscription(userId, (currentSub) => ({
          ...currentSub,
          status: newStatus,
          expiresAt: new Date(data.next_billed_at).toISOString(),
          paddleSubscriptionId: data.id || currentSub.paddleSubscriptionId,
        }), supabaseAdmin);

        console.log(`✅ Paddle suscripción actualizada — usuario ${userId}:`, result?.plan, result?.status);
      }

      return NextResponse.json({ status: 'ok' });
    }

    console.log(`📩 Evento Paddle no manejado: ${eventType}`);
    return NextResponse.json({ status: 'ignored' });
  } catch (err) {
    console.error('❌ Error en Paddle webhook:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
