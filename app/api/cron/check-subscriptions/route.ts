import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expired: string[] = [];

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error listing users:', error);
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }

    const users = data?.users || [];
    console.log(`🔍 Verificando ${users.length} usuarios...`);

    for (const user of users) {
      const subStr = user.user_metadata?.subscription;
      if (typeof subStr !== 'string') continue;

      try {
        const sub = JSON.parse(subStr);
        if (sub.status !== 'active') continue;

        const now = new Date();

        // Trials expirados
        if (sub.plan === 'trial' && sub.trialEnd) {
          const trialEnd = new Date(sub.trialEnd);
          if (trialEnd <= now) {
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              user_metadata: {
                subscription: JSON.stringify({ ...sub, status: 'expired' }),
              },
            });
            expired.push(user.id);
            console.log(`⏰ Trial expirado — usuario ${user.id} marcado como expired`);
            continue;
          }
        }

        // Pro expirados
        if (sub.plan === 'pro' && sub.expiresAt) {
          const expiresAt = new Date(sub.expiresAt);
          if (expiresAt <= now) {
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              user_metadata: {
                subscription: JSON.stringify({ ...sub, status: 'expired' }),
              },
            });
            expired.push(user.id);
            console.log(`⏰ Pro expirado — usuario ${user.id} marcado como expired`);
          }
        }
      } catch {
        // skip malformed subscription data
      }
    }

    return NextResponse.json({
      checked: true,
      expiredCount: expired.length,
      expiredUserIds: expired,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Error en check-subscriptions:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
