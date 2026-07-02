import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function sendWhatsAppMessage(
  token: string,
  phoneNumberId: string,
  to: string,
  text: string
) {
  const id = phoneNumberId?.toString().trim() || '';
  let recipient = to?.toString().trim().replace(/[^0-9]/g, '') || '';
  if (recipient.startsWith('549')) {
    recipient = '54' + recipient.slice(3);
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const url = `https://graph.facebook.com/${apiVersion}/${id}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'text',
    text: { body: text },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const metaResponse = await res.text();

    if (!res.ok) {
      console.error('WhatsApp API error:', res.status, metaResponse);
      return { success: false, error: `HTTP ${res.status}: ${metaResponse}` };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('WhatsApp fetch exception:', message);
    return { success: false, error: message };
  }
}

async function getWhatsAppConfigForUser(
  userId: string,
  supabase: SupabaseClient
): Promise<{ token: string; phoneId: string } | null> {
  const envToken = process.env.WHATSAPP_TOKEN;
  const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (envToken && envPhoneId) {
    return { token: envToken, phoneId: envPhoneId };
  }

  const { data } = await supabase
    .from('business_config')
    .select('whatsapp_api_token, whatsapp_phone_id')
    .eq('user_id', userId)
    .single();

  if (data?.whatsapp_api_token && data?.whatsapp_phone_id) {
    return { token: data.whatsapp_api_token, phoneId: data.whatsapp_phone_id };
  }

  return null;
}

export async function sendReservationConfirmation(
  userId: string,
  guestPhone: string,
  guestName: string,
  roomName: string,
  checkIn: string,
  checkOut: string,
  totalAmount: number,
  paymentLink?: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const config = await getWhatsAppConfigForUser(userId, supabase);
  if (!config) return { success: false, error: 'WhatsApp no configurado' };

  const { data: hotel } = await supabase
    .from('business_config')
    .select('nombre, link_pago')
    .eq('user_id', userId)
    .single();

  const hotelName = hotel?.nombre || 'Hotel';
  const link = paymentLink || hotel?.link_pago;

  let message = `🏨 *${hotelName}*\n\n✅ *Reserva confirmada*\n\n👤 ${guestName}\n🛏 ${roomName}\n📅 ${checkIn} → ${checkOut}\n💰 $${totalAmount}`;

  if (link) {
    message += `\n\n🔗 Pagá acá: ${link}`;
  }

  message += '\n\n¡Gracias por elegirnos!';

  return sendWhatsAppMessage(config.token, config.phoneId, guestPhone, message);
}

export async function sendCheckInNotification(
  userId: string,
  guestPhone: string,
  guestName: string,
  roomName: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const config = await getWhatsAppConfigForUser(userId, supabase);
  if (!config) return { success: false, error: 'WhatsApp no configurado' };

  const { data: hotel } = await supabase
    .from('business_config')
    .select('nombre')
    .eq('user_id', userId)
    .single();

  const hotelName = hotel?.nombre || 'Hotel';

  const message = `🏨 *${hotelName}*\n\n👋 *¡Check-in realizado!*\n\n${guestName}, ya estás registrado en la habitación *${roomName}*.\n\nQue tengas una excelente estadía.`;

  return sendWhatsAppMessage(config.token, config.phoneId, guestPhone, message);
}

export async function sendReservationCancelled(
  userId: string,
  guestPhone: string,
  guestName: string,
  roomName: string,
  checkIn: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const config = await getWhatsAppConfigForUser(userId, supabase);
  if (!config) return { success: false, error: 'WhatsApp no configurado' };

  const { data: hotel } = await supabase
    .from('business_config')
    .select('nombre')
    .eq('user_id', userId)
    .single();

  const hotelName = hotel?.nombre || 'Hotel';

  const message = `🏨 *${hotelName}*\n\n❌ *Reserva cancelada*\n\n${guestName}, tu reserva en *${roomName}* para el ${checkIn} ha sido cancelada.\n\nSi querés reagendar, contactanos.`;

  return sendWhatsAppMessage(config.token, config.phoneId, guestPhone, message);
}
