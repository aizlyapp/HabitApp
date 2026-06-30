import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (user.email !== 'aizlyapp@gmail.com') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Service role key no configurada' }, { status: 500 });
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );

  const sub = {
    plan: 'pro',
    status: 'active',
    trialStart: new Date(0).toISOString(),
    trialEnd: new Date(0).toISOString(),
    subscribedAt: new Date().toISOString(),
  };

  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, subscription: JSON.stringify(sub) },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: 'pro', status: 'active' });
}
