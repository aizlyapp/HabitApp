// lib/subscription.ts
// Manejo de suscripciones usando metadatos de Supabase Auth
// No requiere migración de DB — usa raw_user_meta_data

export type Plan = 'trial' | 'pro' | 'cancelled';
export type SubscriptionStatus = 'active' | 'expired' | 'paused' | 'cancelled';

export interface SubscriptionData {
  plan: Plan;
  status: SubscriptionStatus;
  trialStart: string;   // ISO date
  trialEnd: string;     // ISO date
  subscribedAt?: string;
  expiresAt?: string;
  lastPaymentAt?: string;
  mpPreapprovalId?: string;
  mpSubscriptionId?: string;
  paddleTransactionId?: string;
  paddleSubscriptionId?: string;
}

const TRIAL_DAYS = 14;

/**
 * Crea el objeto de suscripción inicial para un usuario nuevo
 */
export function createTrialSubscription(): SubscriptionData {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  return {
    plan: 'trial',
    status: 'active',
    trialStart: now.toISOString(),
    trialEnd: trialEnd.toISOString(),
  };
}

/**
 * Parsea la suscripción desde los metadatos del usuario
 */
export function getSubscriptionFromMetadata(metadata: {
  subscription?: string;
  [key: string]: unknown;
}): SubscriptionData {
  if (metadata.subscription) {
    try {
      return JSON.parse(metadata.subscription as string) as SubscriptionData;
    } catch {
      // ignore
    }
  }
  // Sin metadata → trial expirada
  return {
    plan: 'trial',
    status: 'expired',
    trialStart: new Date(0).toISOString(),
    trialEnd: new Date(0).toISOString(),
  };
}

/**
 * Verifica si la suscripción está activa
 */
export function isSubscriptionActive(sub: SubscriptionData): boolean {
  if (sub.status !== 'active') return false;

  if (sub.plan === 'trial') {
    return new Date(sub.trialEnd) > new Date();
  }

  if (sub.plan === 'pro') {
    if (!sub.expiresAt) return true; // sin expiración = activo
    return new Date(sub.expiresAt) > new Date();
  }

  return false;
}

/**
 * Días restantes de trial
 */
export function getTrialDaysLeft(sub: SubscriptionData): number {
  if (sub.plan !== 'trial') return 0;
  const diff = new Date(sub.trialEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}


