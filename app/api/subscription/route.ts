import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionFromMetadata, isSubscriptionActive, getTrialDaysLeft } from '@/lib/subscription';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const metadata = user.user_metadata as { subscription?: string };
  const sub = getSubscriptionFromMetadata(metadata);

  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    trialStart: sub.trialStart,
    trialEnd: sub.trialEnd,
    daysLeft: getTrialDaysLeft(sub),
    active: isSubscriptionActive(sub),
  });
}
