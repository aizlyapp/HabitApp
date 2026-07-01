'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BedDouble,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  Plus,
  Sparkles,
  LogIn,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import type { Room, Reservation } from '@/lib/data/types';
import { createClient } from '@/lib/supabase/client';
import { loadConfigFromDB } from '@/lib/data/business-config-db';
import type { BusinessConfig } from '@/lib/data/business-config';

const OccupationChart = dynamic(
  () => import('@/components/occupation-chart').then((m) => m.OccupationChart),
  { ssr: false }
);

interface ExecutiveDashboardProps {
  rooms: Room[];
  reservations: Reservation[];
  onNewBooking: () => void;
  onBookingClick: (booking: Reservation) => void;
  onViewDirtyRooms: () => void;
}

export function ExecutiveDashboard({
  rooms,
  reservations,
  onNewBooking,
  onBookingClick,
  onViewDirtyRooms,
}: ExecutiveDashboardProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const [businessConfig, setBusinessConfig] = useState<Partial<BusinessConfig>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        loadConfigFromDB(user.id, supabase).then(setBusinessConfig);
      }
    });
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const {
    occupancyRate,
    collectedRevenue,
    pendingRevenue,
    pendingCheckIns,
    dirtyRooms,
    todayCheckIns,
    todayCheckOuts,
  } = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
    const occupancyRate = rooms.length > 0
      ? Math.round((occupiedRooms / rooms.length) * 100)
      : 0;

    const monthStartStr = format(monthStart, 'yyyy-MM-dd');
    const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

    const monthReservations = reservations.filter((r) => {
      return r.status !== 'cancelled' && r.check_in >= monthStartStr && r.check_in <= monthEndStr;
    });

    const collectedRevenue = monthReservations
      .filter((r) => r.payment_status === 'paid')
      .reduce((sum, r) => sum + r.total_amount, 0);
    const pendingRevenue = monthReservations
      .filter((r) => r.payment_status === 'pending' || r.payment_status === 'deposit')
      .reduce((sum, r) => sum + r.total_amount, 0);

    const pendingCheckIns = reservations.filter(
      (r) => r.status === 'confirmed'
    ).length;

    const dirtyRooms = rooms.filter(
      (r) => r.cleaning_status === 'dirty'
    ).length;

    const todayStr = format(today, 'yyyy-MM-dd');

    const todayCheckIns = reservations.filter(
      (r) =>
        r.status !== 'cancelled' &&
        r.check_in === todayStr
    );

    const todayCheckOuts = reservations.filter(
      (r) =>
        r.status !== 'cancelled' &&
        r.check_out === todayStr
    );

    return {
      occupancyRate,
      collectedRevenue,
      pendingRevenue,
      pendingCheckIns,
      dirtyRooms,
      todayCheckIns,
      todayCheckOuts,
    };
  }, [rooms, reservations, today]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-4 lg:p-6">
      {/* Business header */}
      {businessConfig.logo && (
        <div className="flex items-center gap-3">
          <img
            src={businessConfig.logo}
            alt="logo"
            className="h-10 w-auto max-h-10 object-contain rounded"
          />
          {businessConfig.nombre && (
            <h1 className="text-xl sm:text-2xl font-semibold text-white">{businessConfig.nombre}</h1>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900 transition-all duration-200 hover:scale-[1.02] hover:border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {t('executiveDashboard.ocupacionActual')}
            </CardTitle>
            <BedDouble className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-white">{occupancyRate}%</div>
            <p className="mt-1 text-xs text-zinc-500">
              {t('executiveDashboard.deHabitaciones', { count: rooms.filter((r) => r.status === 'occupied').length, total: rooms.length })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 transition-all duration-200 hover:scale-[1.02] hover:border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {t('executiveDashboard.ingresosMes')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-white break-keep sm:whitespace-nowrap">
              ${(collectedRevenue + pendingRevenue).toLocaleString('es-AR')}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium truncate">
                ${collectedRevenue.toLocaleString('es-AR')} {t('executiveDashboard.cobrados')}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-500 truncate">
                ${pendingRevenue.toLocaleString('es-AR')} {t('executiveDashboard.pendientes')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 transition-all duration-200 hover:scale-[1.02] hover:border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {t('executiveDashboard.reservasPendientes')}
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-white">{pendingCheckIns}</div>
            <p className="mt-1 text-xs text-zinc-500">
              {t('executiveDashboard.sinCheckin')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 transition-all duration-200 hover:scale-[1.02] hover:border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {t('executiveDashboard.habitacionesSucias')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400">{dirtyRooms}</div>
            <p className="mt-1 text-xs text-zinc-500">
              {t('executiveDashboard.necesitanLimpieza')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2">
          <OccupationChart rooms={rooms} reservations={reservations} />
        </div>

        {/* Quick Actions */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">
              {t('executiveDashboard.accionesRapidas')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onNewBooking}
              className="w-full justify-start gap-3 bg-sky-600 text-white hover:bg-sky-700 h-11 sm:h-12"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium">{t('executiveDashboard.nuevaReserva')}</div>
                <div className="text-xs text-white/70">{t('executiveDashboard.registrarEntrada')}</div>
              </div>
            </Button>

            <Button
              onClick={onViewDirtyRooms}
              variant="outline"
              className="w-full justify-start gap-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-11 sm:h-12"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium">{t('executiveDashboard.habitacionesSuciasBtn')}</div>
                <div className="text-xs text-zinc-500">{t('executiveDashboard.verLimpieza')}</div>
              </div>
            </Button>


          </CardContent>
        </Card>
      </div>

      {/* Today's activity */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">
              {t('executiveDashboard.ingresosHoy')}
            </CardTitle>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
              {todayCheckIns.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {todayCheckIns.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">
                {t('executiveDashboard.noIngresos')}
              </p>
            ) : (
              <div className="space-y-2">
                {todayCheckIns.map((r) => {
                  const room = rooms.find((rm) => rm.id === r.room_id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => onBookingClick(r)}
                      className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 p-3 text-left transition-colors hover:bg-zinc-800/50"
                    >
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-500/20 shrink-0">
                        <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {r.guest_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {t('executiveDashboard.hab')} {room?.nombre || r.room_id}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">
              {t('executiveDashboard.salidasHoy')}
            </CardTitle>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
              {todayCheckOuts.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {todayCheckOuts.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">
                {t('executiveDashboard.noSalidas')}
              </p>
            ) : (
              <div className="space-y-2">
                {todayCheckOuts.map((r) => {
                  const room = rooms.find((rm) => rm.id === r.room_id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => onBookingClick(r)}
                      className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 p-3 text-left transition-colors hover:bg-zinc-800/50"
                    >
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-amber-500/20 shrink-0">
                        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {r.guest_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {t('executiveDashboard.hab')} {room?.nombre || r.room_id}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
