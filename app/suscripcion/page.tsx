'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSubscriptionFromMetadata, isSubscriptionActive, getTrialDaysLeft } from '@/lib/subscription';
import type { SubscriptionData } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Loader2, Check, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({ description: '¡Suscripción activada! Bienvenido a Roomy Pro.' });
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      setUserId(user.id);
      const metadata = user.user_metadata as { subscription?: string };
      setSub(getSubscriptionFromMetadata(metadata));
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/mercado-pago/create-subscription', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ description: 'Error al crear el pago. Intentá de nuevo.' });
      }
    } catch {
      toast({ description: 'Error de conexión. Intentá de nuevo.' });
    } finally {
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
              <h1 className="text-2xl font-bold text-white">Suscripción</h1>
              <p className="text-sm text-zinc-500">Estado de tu plan Roomy Pro</p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <Card className="mb-6 border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
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
                    {active ? 'Plan activo' : 'Plan vencido'}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {sub.plan === 'trial'
                      ? `Período de prueba — ${daysLeft} días restantes`
                      : sub.plan === 'pro'
                        ? 'Suscripción Pro activa'
                        : 'Plan cancelado'}
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
                {active ? 'Activo' : 'Vencido'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Roomy Pro</CardTitle>
            <CardDescription className="text-zinc-400">
              Todo lo que necesitás para gestionar tu hostel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price */}
            <div>
              <p className="text-3xl font-bold text-white">
                $120.000 <span className="text-lg font-normal text-zinc-500">ARS / mes</span>
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                ≈ $99 USD · Sin cargo de inscripción
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {[
                'Reservas y calendario ilimitados',
                'Gestión de habitaciones sin límite',
                'Base de datos de huéspedes',
                'QR de cobro con Mercado Pago',
                'Soporte por WhatsApp',
                'Chatbot de reservas 24/7 (próximamente)',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-sky-400" />
                  <span className="text-sm text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action */}
            <div className="space-y-3">
              {active && sub.plan === 'pro' ? (
                <p className="text-center text-sm text-emerald-400">
                  Ya estás suscripto a Roomy Pro
                </p>
              ) : (
                <>
                  <Button
                    onClick={handleSubscribe}
                    disabled={paying}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700 h-12 text-base gap-2"
                  >
                    {paying ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ExternalLink className="h-5 w-5" />
                    )}
                    {paying ? 'Redirigiendo a Mercado Pago...' : 'Suscribirme ahora'}
                  </Button>
                  {sub?.plan === 'trial' && daysLeft > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <Clock className="h-4 w-4" />
                      Te quedan {daysLeft} días de prueba gratis — sin compromiso
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          ¿Tenés dudas? Escribinos a{' '}
          <a href="mailto:aizlyapp@gmail.com" className="text-sky-400 hover:underline">
            aizlyapp@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
