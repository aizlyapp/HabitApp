export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {};
  const errors: string[] = [];

  // 1. Check env vars
  results.WHATSAPP_TOKEN_EXISTS = !!process.env.WHATSAPP_TOKEN;
  results.WHATSAPP_TOKEN_LENGTH = process.env.WHATSAPP_TOKEN?.length || 0;
  results.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '❌ NO SETEADO';
  results.WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0 (default)';

  if (!process.env.WHATSAPP_TOKEN) errors.push('WHATSAPP_TOKEN no está seteado en Vercel');
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) errors.push('WHATSAPP_PHONE_NUMBER_ID no está seteado en Vercel');

  // 2. Try to fetch token info from Meta (debug endpoint)
  if (process.env.WHATSAPP_TOKEN) {
    try {
      const debugRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${process.env.WHATSAPP_TOKEN}`,
        { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
      );
      const debugData = await debugRes.json();
      results.token_debug_status = debugRes.status;
      results.token_debug = debugData;
      if (!debugRes.ok) errors.push(`Token inválido o expirado: ${JSON.stringify(debugData)}`);
    } catch (err) {
      errors.push(`Error al validar token: ${(err as Error).message}`);
    }
  }

  // 3. Try to send a test message to the business's own number
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    const searchParams = request.nextUrl.searchParams;
    const testNumber = searchParams.get('to');

    if (testNumber) {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
      const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: testNumber.replace(/[^0-9]/g, '').replace(/^549/, '54'),
        type: 'text' as const,
        text: { body: '🔧 Test de diagnóstico desde HabitApp' },
      };

      results.test_url = url;
      results.test_payload = payload;

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
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
