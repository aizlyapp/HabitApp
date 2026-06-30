import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutTransaction } from '@/lib/paddle';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const origin = request.headers.get('origin') || 'https://app.roomy.com.ar';

    const transaction = await createCheckoutTransaction(
      user.id,
      `${origin}/suscripcion?paddle=success`
    );

    const checkoutUrl = (transaction as any).checkout?.url;

    return NextResponse.json({
      url: checkoutUrl || '',
      transactionId: transaction.id,
    });
  } catch (err) {
    console.error('Error creating Paddle checkout:', err);
    return NextResponse.json(
      { error: 'Error al crear el checkout' },
      { status: 500 }
    );
  }
}
