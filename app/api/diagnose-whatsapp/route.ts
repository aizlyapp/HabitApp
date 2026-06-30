export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function resolveWhatsappConfig() {
  // Priority: env vars first (local dev), then Supabase DB (production)
  let token = process.env.WHATSAPP_TOKEN;
  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data } = await supabase
        .from('business_config')
        .select('whatsapp_api_token, whatsapp_phone_id')
        .not('whatsapp_api_token', 'is', null)
        .limit(1)
        .single();

      if (data) {
        token = token || data.whatsapp_api_token;
        phoneNumberId = phoneNumberId || data.whatsapp_phone_id?.toString();
      }
    } catch {
      // DB might not be available
    }
  }

  return { token, phoneNumberId };
}

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {};
  const errors: string[] = [];

  // 1. Resolve config from env or DB
  const { token, phoneNumberId } = await resolveWhatsappConfig();

  results.WHATSAPP_TOKEN_EXISTS = !!token;
  results.WHATSAPP_TOKEN_LENGTH = token?.length || 0;
  results.WHATSAPP_PHONE_NUMBER_ID = phoneNumberId || '❌ NO DISPONIBLE';
  results.CONFIG_SOURCE = process.env.WHATSAPP_TOKEN ? 'env' : 'supabase_db';
  results.WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0 (default)';

  if (!token) errors.push('WHATSAPP_TOKEN no encontrado (ni env ni Supabase DB)');
  if (!phoneNumberId) errors.push('WHATSAPP_PHONE_NUMBER_ID no encontrado (ni env ni Supabase DB)');

  // 2. Try to fetch token info from Meta (debug endpoint)
  if (token) {
    try {
      const debugRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${token}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const debugData = await debugRes.json();
      results.token_debug_status = debugRes.status;
      results.token_debug = debugData;
      if (!debugRes.ok) errors.push(`Token inválido o expirado: ${JSON.stringify(debugData)}`);
    } catch (err) {
      errors.push(`Error al validar token: ${(err as Error).message}`);
    }
  }

  // 3. Try to send a test message
  if (token && phoneNumberId) {
    const searchParams = request.nextUrl.searchParams;
    const testNumber = searchParams.get('to');

    if (testNumber) {
      const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
      const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

      const normalizedNumber = testNumber.replace(/[^0-9]/g, '').replace(/^549/, '54');
      const payload = {
        messaging_product: 'whatsapp',
        to: normalizedNumber,
        type: 'text' as const,
        text: { body: '🔧 Test de diagnóstico desde HabitApp' },
      };

      results.test_url = url;
      results.test_payload = payload;

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const responseBody = await res.text();
        results.test_status = res.status;
        results.test_response = responseBody;

        if (!res.ok) errors.push(`Meta respondió con ${res.status}: ${responseBody}`);
        else results.test_ok = true;
      } catch (err) {
        errors.push(`Fetch exception: ${(err as Error).message}`);
      }
    } else {
      results.test_skipped = 'Pasá ?to=TU_NUMERO en la URL para probar envío';
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
