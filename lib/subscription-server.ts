import { createClient } from '@supabase/supabase-js';
import { getSubscriptionFromMetadata, isSubscriptionActive, getTrialDaysLeft } from './subscription';

export interface ServerSubscriptionStatus {
  active: boolean;
  plan: 'trial' | 'pro' | 'cancelled';
  daysLeft: number;
  expired: boolean;
}

export async function checkSubscriptionServer(userId: string): Promise<ServerSubscriptionStatus> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase.auth.admin.getUserById(userId);

  const metadata = data?.user?.user_metadata as { subscription?: string } | undefined;

  if (!metadata?.subscription) {
    return { active: false, plan: 'trial', daysLeft: 0, expired: true };
  }

  const sub = getSubscriptionFromMetadata(metadata);
  const active = isSubscriptionActive(sub);
  const daysLeft = getTrialDaysLeft(sub);

  return {
    active,
    plan: sub.plan,
    daysLeft,
    expired: sub.plan === 'trial' && !active,
  };
}
