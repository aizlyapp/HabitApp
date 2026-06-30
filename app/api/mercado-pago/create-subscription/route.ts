import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscriptionPreapproval } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const email = user.email || '';
    const origin = request.headers.get('origin') || 'https://app.roomy.com.ar';

    const result = await createSubscriptionPreapproval(
      email,
      user.id,
      `${origin}/suscripcion?success=true`
    );

    // Guardamos el mp_preapproval_id en metadatos
    if (result.id) {
      const metadata = user.user_metadata as Record<string, unknown>;
      const subscription = typeof metadata.subscription === 'string'
        ? JSON.parse(metadata.subscription)
        : {};
      
      await supabase.auth.updateUser({
        data: {
          subscription: JSON.stringify({
            ...subscription,
            mpPreapprovalId: result.id,
          }),
        },
      });
    }

    // MP devuelve el init_point para redirigir al checkout
    const sandboxInitPoint = (result as any).sandbox_init_point;
    const initPoint = (result as any).init_point;

    return NextResponse.json({
      url: initPoint || sandboxInitPoint || '',
      preapprovalId: result.id,
    });
  } catch (err) {
    console.error('Error creating MP subscription:', err);
    return NextResponse.json(
      { error: 'Error al crear la suscripción' },
      { status: 500 }
    );
  }
}
