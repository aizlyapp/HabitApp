import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/lib/services/whatsapp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumberId, token, to, text } = body;

    if (!to || !text) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos (to, text)' },
        { status: 400 }
      );
    }

    let resolvedToken = token;
    let resolvedPhoneId = phoneNumberId;

    if (!resolvedToken || !resolvedPhoneId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader);
        if (user?.id) {
          const { data: config } = await supabase
            .from('business_config')
            .select('whatsapp_api_token, whatsapp_phone_id')
            .eq('user_id', user.id)
            .single();

          if (config?.whatsapp_api_token) resolvedToken = config.whatsapp_api_token;
          if (config?.whatsapp_phone_id) resolvedPhoneId = config.whatsapp_phone_id;
        }
      }
    }

    if (!resolvedToken || !resolvedPhoneId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp no configurado. Configurá el token y phone ID en Ajustes.' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(resolvedToken, resolvedPhoneId, to, text);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Error al enviar mensaje' },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('Error en /api/whatsapp/send:', err);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
