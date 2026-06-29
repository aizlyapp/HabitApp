import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mercado Pago webhook — se llama cuando cambia el estado de una suscripción
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📩 MP Webhook recibido:', JSON.stringify(body, null, 2));

    const { action, data, type } = body;

    // Solo nos interesan eventos de preapproval (suscripciones)
    if (type !== 'preapproval' && type !== 'subscription_preapproval') {
      return NextResponse.json({ status: 'ignored' });
    }

    const preapprovalId = data?.id;
    if (!preapprovalId) {
      return NextResponse.json({ status: 'ignored' });
    }

    // Consultar el estado actual en MP
    const mpResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${preapprovalId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );
    const mpData = await mpResponse.json();
    console.log('📩 MP Preapproval data:', JSON.stringify(mpData, null, 2));

    const userId = mpData.external_reference;
    const status = mpData.status; // 'authorized', 'pending', 'cancelled', etc.

    if (!userId) {
      return NextResponse.json({ status: 'ignored' });
    }

    // Crear cliente Supabase con service_role para operaciones admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (userError || !userData?.user) {
      console.error('❌ Error obteniendo usuario:', userError);
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    const user = userData.user;
    const metadata = user.user_metadata as Record<string, unknown>;
    const currentSub = typeof metadata.subscription === 'string'
      ? JSON.parse(metadata.subscription)
      : {};

    let updatedSub = { ...currentSub };

    if (status === 'authorized') {
      // Pago exitoso — activar Pro
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1); // +1 mes

      updatedSub = {
        ...currentSub,
        plan: 'pro',
        status: 'active',
        subscribedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        mpPreapprovalId: preapprovalId,
        mpSubscriptionId: mpData.id,
      };
    } else if (status === 'cancelled') {
      updatedSub = {
        ...currentSub,
        status: 'cancelled',
        mpSubscriptionId: mpData.id,
      };
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { data: { subscription: JSON.stringify(updatedSub) } }
    );

    if (updateError) {
      console.error('❌ Error actualizando usuario:', updateError);
    } else {
      console.log('✅ Usuario actualizado a:', updatedSub.plan, updatedSub.status);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ Error en MP webhook:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

// MP también envía GET para verificar el webhook
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
