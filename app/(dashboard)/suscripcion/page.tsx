'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSubscriptionFromMetadata, isSubscriptionActive, getTrialDaysLeft } from '@/lib/subscription';
import type { SubscriptionData } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Loader2, Check, Clock, AlertTriangle, ExternalLink, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { initializePaddle, CheckoutEventNames } from '@paddle/paddle-js';
import type { Paddle } from '@paddle/paddle-js';
import { useTranslation } from '@/lib/i18n/context';

type PaymentMethod = 'ars' | 'usd';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { t } = useTranslation();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('ars');
  const paddleRef = useRef<Paddle | null>(null);

  const refreshSub = useCallback(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const metadata = user.user_metadata as { subscription?: string };
      setSub(getSubscriptionFromMetadata(metadata));
    });
  }, [supabase]);

  useEffect(() => {
    initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      eventCallback: (event) => {
        if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
          toast({ description: t('subscription.pagoExitoso') });
          setPaying(false);
          refreshSub();
        }
        if (event.name === CheckoutEventNames.CHECKOUT_CLOSED) {
          setPaying(false);
        }
      },
    }).then((paddle) => {
      if (paddle) {
        paddleRef.current = paddle;
      }
    });
  }, [refreshSub]);

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast({ description: t('subscription.suscripcionActivada') });
      refreshSub();
    }
  }, [searchParams, refreshSub]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      const metadata = user.user_metadata as { subscription?: string };
      setSub(getSubscriptionFromMetadata(metadata));
      setLoading(false);
    });
  }, []);

  const handleSubscribeMP = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/mercado-pago/create-subscription', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ description: t('subscription.errorPago') });
      }
    } catch {
      toast({ description: t('subscription.errorConexion') });
    } finally {
      setPaying(false);
    }
  };

  const handleSubscribePaddle = async () => {
    const paddle = paddleRef.current;
    if (!paddle) {
      toast({ description: t('subscription.paddleNoListo') });
      return;
    }

    setPaying(true);
    try {
      const res = await fetch('/api/paddle/create-checkout', {
        method: 'POST',
      });
      const data = await res.json();

      if (!data.transactionId) {
        toast({ description: t('subscription.errorCheckout') });
        setPaying(false);
        return;
      }

      paddle.Checkout.open({
        transactionId: data.transactionId,
      });

      paddleRef.current = paddle;
    } catch {
      toast({ description: t('subscription.errorConexion') });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!sub) return null;

  const daysLeft = getTrialDaysLeft(sub);
  const active = isSubscriptionActive(sub);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600/20">
              <BedDouble className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{t('subscription.title')}</h1>
              <p className="text-xs sm:text-sm text-zinc-500">{t('subscription.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <Card className="mb-6 border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {active ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-6 w-6 text-emerald-400" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20">
                    <AlertTriangle className="h-6 w-6 text-rose-400" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {active ? t('subscription.planActivo') : t('subscription.planVencido')}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {sub.plan === 'trial'
                      ? t('subscription.periodoPrueba', { days: daysLeft })
                      : sub.plan === 'pro'
                        ? t('subscription.suscripcionProActiva')
                        : t('subscription.planCancelado')}
                  </p>
                </div>
              </div>
              <Badge
                className={
                  active
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }
              >
                {active ? t('subscription.activo') : t('subscription.vencido')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">{t('subscription.proTitle')}</CardTitle>
            <CardDescription className="text-zinc-400">
              {t('subscription.proDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment method toggle */}
            <div className="flex rounded-lg border border-zinc-800 p-1 bg-zinc-950">
              <button
                onClick={() => setMethod('ars')}
                className={`flex-1 rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  method === 'ars'
                    ? 'bg-sky-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('subscription.pesosARS')}
              </button>
              <button
                onClick={() => setMethod('usd')}
                className={`flex-1 rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  method === 'usd'
                    ? 'bg-sky-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('subscription.dolaresUSD')}
              </button>
            </div>

            {/* Price */}
            <div className="text-center sm:text-left">
              {method === 'ars' ? (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    $75.000 <span className="text-base sm:text-lg font-normal text-zinc-500">{t('subscription.arsPriceSuffix')}</span>
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                    {t('subscription.arsSubtext')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    $50 <span className="text-base sm:text-lg font-normal text-zinc-500">{t('subscription.usdPriceSuffix')}</span>
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                    {t('subscription.usdSubtext')}
                  </p>
                </>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {[
                t('subscription.feature1'),
                t('subscription.feature2'),
                t('subscription.feature3'),
                t('subscription.feature4'),
                t('subscription.feature5'),
                t('subscription.feature6'),
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="text-xs sm:text-sm text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action */}
            <div className="space-y-3">
              {active && sub.plan === 'pro' ? (
                <p className="text-center text-sm text-emerald-400">
                  {t('subscription.yaSuscripto')}
                </p>
              ) : (
                <>
                  <Button
                    onClick={method === 'ars' ? handleSubscribeMP : handleSubscribePaddle}
                    disabled={paying}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700 h-12 text-base gap-2"
                  >
                    {paying ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <DollarSign className="h-5 w-5" />
                    )}
                    {paying
                      ? method === 'ars'
                        ? t('subscription.redirigiendoMP')
                        : t('subscription.redirigiendoPaddle')
                      : method === 'ars'
                        ? t('subscription.pagarMP')
                        : t('subscription.pagarTarjeta')}
                  </Button>
                  {sub?.plan === 'trial' && daysLeft > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <Clock className="h-4 w-4" />
                      {t('subscription.teQuedan', { days: daysLeft })}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          {t('subscription.ayuda')}{' '}
          <a href="mailto:aizlyapp@gmail.com" className="text-sky-400 hover:underline">
            aizlyapp@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
