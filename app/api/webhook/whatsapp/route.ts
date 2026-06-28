console.log('🚀 WhatsApp webhook route.ts cargado y funcionando');

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT_TEMPLATE = `
Sos el asistente virtual de {HOSTEL_NOMBRE}, ubicado en {HOSTEL_DIRECCION}. Tu trabajo es responder consultas de huéspedes potenciales y ayudarlos a hacer reservas.

INFORMACIÓN DEL HOSTEL:
{HOSTEL_HABITACIONES}

FORMAS DE PAGO:
{HOSTEL_PAGOS}

PERSONALIDAD:
{BOT_PERSONALITY}

REGLAS:
- Respondé siempre en español
- Sé amable, conciso y profesional
- Si preguntan disponibilidad, consultá las fechas ocupadas
- Si quieren reservar, pedí: nombre completo, email, teléfono, fecha de entrada, fecha de salida, cantidad de personas
- Cuando tengas TODOS esos datos, respondé con este formato exacto para confirmar:
  RESERVA_CONFIRMAR:{nombre}|{email}|{telefono}|{check_in}|{check_out}|{room_id}|{guest_count}
- No inventes información que no tenés
- Si no sabés algo, decí que van a contactar al hostel directamente
`;

async function getWhatsappConfig(phoneNumberId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from('business_config')
    .select('*')
    .eq('whatsapp_phone_id', phoneNumberId)
    .single();

  return data;
}

async function getHostelData(userId: string, supabase: SupabaseClient) {
  const [rooms, reservations, config] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, name, type, capacity, status, price_per_night, cleaning_status')
      .eq('user_id', userId),
    supabase
      .from('reservations')
      .select('room_id, guest_name, check_in, check_out, status')
      .eq('user_id', userId)
      .neq('status', 'cancelled'),
    supabase
      .from('business_config')
      .select('nombre, direccion, bot_personality, alias_cbu_cvu, link_pago')
      .eq('user_id', userId)
      .single(),
  ]);

  return { rooms: rooms.data || [], reservations: reservations.data || [], config: config.data };
}

function buildRoomsContext(rooms: any[], reservations: any[]) {
  const occupiedByRoom: Record<string, string[]> = {};

  for (const r of reservations) {
    if (!occupiedByRoom[r.room_id]) occupiedByRoom[r.room_id] = [];
    occupiedByRoom[r.room_id].push(`${r.guest_name}: ${r.check_in} → ${r.check_out}`);
  }

  return rooms
    .map((room) => {
      const ocupadas = occupiedByRoom[room.id]
        ? `\n    Ocupado: ${occupiedByRoom[room.id].join(', ')}`
        : '';
      return `  - ${room.name} (${room.type}): $${room.price_per_night} /noche, Capacidad: ${room.capacity}${ocupadas}`;
    })
    .join('\n');
}

async function sendWhatsAppMessage(
  token: string,
  phoneNumberId: string,
  to: string,
  text: string
) {
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  console.log('📤 Enviando mensaje WhatsApp:', { phoneNumberId, to, tokenExists: !!token, tokenLength: token?.length, textPreview: text.slice(0, 80) });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('❌ WhatsApp API error:', res.status, errBody);
    } else {
      console.log('✅ Mensaje WhatsApp enviado correctamente');
    }
  } catch (err) {
    console.error('❌ WhatsApp fetch exception:', (err as Error).message, (err as Error).stack);
  }
}

function insertReservation(userId: string, data: Record<string, string>, supabase: SupabaseClient) {
  return supabase.from('reservations').insert({
    user_id: userId,
    room_id: data.room_id,
    guest_name: data.nombre,
    guest_email: data.email,
    guest_phone: data.telefono,
    guest_count: parseInt(data.guest_count || '1', 10),
    check_in: data.check_in,
    check_out: data.check_out,
    status: 'confirmed',
    total_amount: 0,
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!mode || !token || !challenge) {
    return new NextResponse('Missing parameters', { status: 403 });
  }

  if (mode !== 'subscribe' || token !== process.env.VERIFY_TOKEN) {
    return new NextResponse('Invalid verify token', { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  console.log('📩 Webhook POST recibido - headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
  console.log('📩 Webhook POST content-type:', request.headers.get('content-type'));

  let rawBody: string | undefined;
  let body: any;
  try {
    rawBody = await request.text();
    console.log('📩 Webhook POST raw body:', rawBody);
    body = JSON.parse(rawBody);
  } catch (parseErr) {
    console.error('Webhook POST parse error:', parseErr, 'rawBody:', rawBody);
    return NextResponse.json({ status: 'error', message: 'Evento Recibido' });
  }

  await processWhatsAppMessage(body).catch((err) => {
    console.error('WhatsApp processing error:', err);
  });

  return NextResponse.json({ status: 'ok', message: 'Evento Recibido' });
}

async function processWhatsAppMessage(body: any) {
  console.log('LOG_INICIO_PROCESO');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // ── 1. Extraer datos del webhook ──────────────────────────────────
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  console.log('🔍 value completo:', JSON.stringify(value, null, 2));

  if (!value?.messaging_product) {
    console.warn('⚠️ No messaging_product in webhook body — nothing to process');
    return;
  }

  const phoneNumberId = value.metadata?.phone_number_id;
  const message = value.messages?.[0];
  console.log('🔍 message completo:', JSON.stringify(message, null, 2));

  if (!phoneNumberId || !message) {
    console.warn('⚠️ Missing phoneNumberId or message', { phoneNumberId, hasMessage: !!message });
    return;
  }

  const from = message.from;
  const messageText = message.text?.body?.trim();

  if (!from || !messageText) {
    console.warn('⚠️ Missing from or messageText', { from, messageText });
    return;
  }

  // ── 2. Resolver token (env WHATSAPP_TOKEN → DB) ──────────────────
  let token: string | undefined;
  let config: any;

  token = process.env.WHATSAPP_TOKEN;
  if (token) {
    console.log('✅ Token resuelto desde env WHATSAPP_TOKEN');
  }

  if (!token) {
    try {
      config = await getWhatsappConfig(phoneNumberId, supabase);
      if (config?.whatsapp_api_token) {
        token = config.whatsapp_api_token;
        console.log('ℹ️ Token resuelto desde Supabase (fallback)');
      }
    } catch (dbErr) {
      console.error('⚠️ Error consultando Supabase para config:', (dbErr as Error).message, (dbErr as Error).stack);
    }
  }

  if (!token) {
    console.error('❌ No hay token disponible (ni env WHATSAPP_TOKEN ni DB)');
    return;
  }

  // ── 3. Toda la lógica dentro de un solo try/catch ─────────────────
  try {
    // ── 3a. Bot desactivado → responder igual ───────────────────────
    if (config && !config.bot_enabled) {
      console.warn('⚠️ Bot desactivado — respondiendo mensaje genérico');
      await sendWhatsAppMessage(token, phoneNumberId, from, 'El chatbot está desactivado. Por favor, contactanos directamente.');
      return;
    }

    // ── 3b. Sin userId → responder genérico ─────────────────────────
    const userId = config?.user_id;
    if (!userId) {
      console.warn('⚠️ Sin userId en config — respondiendo mensaje genérico');
      await sendWhatsAppMessage(token, phoneNumberId, from, '¡Gracias por tu mensaje! En breve te responderemos.');
      return;
    }

    // ── 3c. Obtener datos del hostel ────────────────────────────────
    const hostelData = await getHostelData(userId, supabase);

    if (!hostelData.config) {
      console.warn('⚠️ Sin hostelData.config para userId', { userId });
      await sendWhatsAppMessage(token, phoneNumberId, from, '¡Gracias por tu mensaje! En breve te responderemos.');
      return;
    }

    const roomsContext = buildRoomsContext(hostelData.rooms, hostelData.reservations);

    const formasPago = [
      hostelData.config.alias_cbu_cvu && `Transferencia bancaria: ${hostelData.config.alias_cbu_cvu}`,
      hostelData.config.link_pago && `Link de pago: ${hostelData.config.link_pago}`,
    ]
      .filter(Boolean)
      .join('\n');

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE
      .replace('{HOSTEL_NOMBRE}', hostelData.config.nombre || '')
      .replace('{HOSTEL_DIRECCION}', hostelData.config.direccion || '')
      .replace('{HOSTEL_HABITACIONES}', roomsContext || 'Sin habitaciones disponibles')
      .replace('{HOSTEL_PAGOS}', formasPago || 'Consultar al hostel')
      .replace('{BOT_PERSONALITY}', config?.bot_personality || hostelData.config.bot_personality || '');

    // ── 3d. Llamar a Groq ──────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const groqResponse = completion.choices[0]?.message?.content?.trim() || '';

    // ── 3e. Manejar reserva ────────────────────────────────────────
    if (groqResponse.startsWith('RESERVA_CONFIRMAR:')) {
      const parts = groqResponse.replace('RESERVA_CONFIRMAR:', '').split('|');

      if (parts.length >= 6) {
        const resData: Record<string, string> = {
          nombre: parts[0]?.trim() || '',
          email: parts[1]?.trim() || '',
          telefono: parts[2]?.trim() || '',
          check_in: parts[3]?.trim() || '',
          check_out: parts[4]?.trim() || '',
          room_id: parts[5]?.trim() || '',
          guest_count: parts[6]?.trim() || '1',
        };

        const { error: insertError } = await insertReservation(userId, resData, supabase);

        if (insertError) {
          console.error('❌ Error insertando reserva:', insertError);
          await sendWhatsAppMessage(token, phoneNumberId, from, 'Hubo un error al confirmar tu reserva. Por favor, contactanos directamente.');
          return;
        }

        const linkPago = hostelData.config.link_pago
          ? `\n\nPara pagar: ${hostelData.config.link_pago}`
          : '';

        await sendWhatsAppMessage(token, phoneNumberId, from, `✅ ¡Reserva confirmada! Te esperamos el ${resData.check_in}.${linkPago}`);
        return;
      }
    }

    // ── 3f. Respuesta normal de Groq ───────────────────────────────
    await sendWhatsAppMessage(token, phoneNumberId, from, groqResponse);

  } catch (err) {
    // ── 4. CATCH GLOBAL: responde aunque todo falle ────────────────
    console.error('❌ Error en processWhatsAppMessage:', (err as Error).message, (err as Error).stack);
    await sendWhatsAppMessage(token, phoneNumberId, from, 'En este momento no puedo procesar tu mensaje. Por favor, contactanos directamente.');
  }

  console.log('LOG_FIN_PROCESO');
}
