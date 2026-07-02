import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/lib/services/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');

  const isValid =
    (authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
    (querySecret === process.env.CRON_SECRET);

  if (!isValid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const results: string[] = [];

  // ── 1. Recordatorio de check-in (24h antes) ──────────────────
  const { data: tomorrowCheckins } = await supabase
    .from('reservations')
    .select('id, user_id, guest_name, guest_phone, room_id, check_in, rooms(name)')
    .eq('check_in', fmt(tomorrow))
    .eq('status', 'confirmed')
    .not('guest_phone', 'is', null)
    .not('guest_phone', 'eq', '');

  if (tomorrowCheckins) {
    const seenUsers: string[] = [];
    for (const r of tomorrowCheckins) {
      if (!seenUsers.includes(r.user_id)) seenUsers.push(r.user_id);
    }

    for (const uid of seenUsers) {
      const { data: config } = await supabase
        .from('business_config')
        .select('whatsapp_api_token, whatsapp_phone_id, nombre, notify_checkin_reminder')
        .eq('user_id', uid)
        .single();
      if (!config || !config.notify_checkin_reminder) continue;
      const token = config.whatsapp_api_token;
      const phoneId = config.whatsapp_phone_id;
      if (!token || !phoneId) continue;

      for (const res of tomorrowCheckins.filter((r) => r.user_id === uid)) {
        const hotelName = config.nombre || 'Hotel';
        const roomName = Array.isArray(res.rooms) ? res.rooms[0]?.name : (res.rooms as any)?.name;
        const message = `🏨 *${hotelName}*\n\n⏰ *Recordatorio*\n\n${res.guest_name}, te esperamos mañana ${fmt(tomorrow)} en *${roomName || ''}*.\n\nCheck-in a partir de las 14:00 hs.\n\n¿Tenés dudas? Respondé este mensaje.`;

        await sendWhatsAppMessage(token, phoneId, res.guest_phone, message);
        results.push(`checkin-reminder: ${res.id} (${res.guest_name})`);
      }
    }
  }

  // ── 2. Solicitud de reseña (post-checkout) ───────────────────
  const { data: yesterdayCheckouts } = await supabase
    .from('reservations')
    .select('id, user_id, guest_name, guest_phone, room_id, rooms(name)')
    .eq('check_out', fmt(yesterday))
    .in('status', ['checked-out', 'confirmed'])
    .not('guest_phone', 'is', null)
    .not('guest_phone', 'eq', '');

  if (yesterdayCheckouts) {
    const seenUsers: string[] = [];
    for (const r of yesterdayCheckouts) {
      if (!seenUsers.includes(r.user_id)) seenUsers.push(r.user_id);
    }

    for (const uid of seenUsers) {
      const { data: config } = await supabase
        .from('business_config')
        .select('whatsapp_api_token, whatsapp_phone_id, nombre, notify_review_request')
        .eq('user_id', uid)
        .single();
      if (!config || !config.notify_review_request) continue;
      const token = config.whatsapp_api_token;
      const phoneId = config.whatsapp_phone_id;
      if (!token || !phoneId) continue;

      for (const res of yesterdayCheckouts.filter((r) => r.user_id === uid)) {
        const hotelName = config.nombre || 'Hotel';
        const roomName = Array.isArray(res.rooms) ? res.rooms[0]?.name : (res.rooms as any)?.name;
        const message = `🏨 *${hotelName}*\n\n⭐ *¿Cómo fue tu estadía?*\n\n${res.guest_name}, esperamos que hayas disfrutado tu estadía en *${roomName || ''}*.\n\n¿Nos ayudás con una reseña en Google? Tu opinión nos ayuda a mejorar.\n\n¡Gracias por elegirnos!`;

        await sendWhatsAppMessage(token, phoneId, res.guest_phone, message);
        results.push(`review-request: ${res.id} (${res.guest_name})`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    details: results,
    date: fmt(today),
    tomorrow: fmt(tomorrow),
    yesterday: fmt(yesterday),
  });
}
