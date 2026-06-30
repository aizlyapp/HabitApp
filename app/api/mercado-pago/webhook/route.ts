import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const body = await request.json();
    console.log('📩 MP Webhook recibido:', JSON.stringify(body, null, 2));

    const { data, type } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── Pago recurrente mensual (subscription_authorized_payment) ─────────
    if (type === 'subscription_authorized_payment') {
      const paymentId = data?.id;
      if (!paymentId) return NextResponse.json({ status: 'ignored' });

      const paymentRes = await fetch(
        `https://api.mercadopago.com/authorized_payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
      );
      const paymentData = await paymentRes.json();
      console.log('📩 MP Authorized Payment:', JSON.stringify(paymentData, null, 2));

      const userId = paymentData.external_reference;
      if (!userId) return NextResponse.json({ status: 'ignored' });

      const result = await updateSubscription(userId, (currentSub) => {
        const baseDate = currentSub.expiresAt ? new Date(currentSub.expiresAt) : new Date();
        const newExpiresAt = new Date(baseDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

        return {
          ...currentSub,
          plan: 'pro',
          status: 'active',
          expiresAt: newExpiresAt.toISOString(),
          lastPaymentAt: new Date().toISOString(),
        };
      }, supabaseAdmin);

      console.log('✅ Pago recurrente procesado — expiresAt extendido:', result?.expiresAt);
      return NextResponse.json({ status: 'ok' });
    }

    // ── Eventos de preapproval (autorización inicial, cancelación) ─────
    if (type !== 'preapproval' && type !== 'subscription_preapproval') {
      return NextResponse.json({ status: 'ignored' });
    }

    const preapprovalId = data?.id;
    if (!preapprovalId) return NextResponse.json({ status: 'ignored' });

    const mpResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${preapprovalId}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );
    const mpData = await mpResponse.json();
    console.log('📩 MP Preapproval data:', JSON.stringify(mpData, null, 2));

    const userId = mpData.external_reference;
    const status = mpData.status;

    if (!userId) return NextResponse.json({ status: 'ignored' });

    const result = await updateSubscription(userId, (currentSub) => {
      if (status === 'authorized') {
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
          mpPreapprovalId: preapprovalId,
          mpSubscriptionId: mpData.id,
        };
      }

      if (status === 'cancelled') {
        return { ...currentSub, status: 'cancelled' };
      }

      return currentSub;
    }, supabaseAdmin);

    console.log('✅ Preapproval procesado:', result?.plan, result?.status);
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ Error en MP webhook:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
