'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BedDouble,
  TrendingUp,
  DollarSign,
  CalendarCheck,
  CalendarX,
  Users,
  ArrowRight,
} from 'lucide-react';
import type { Room, Reservation } from '@/lib/data/types';
import { cn } from '@/lib/utils';

interface ReportsDashboardProps {
  rooms: Room[];
  reservations: Reservation[];
}

export function ReportsDashboard({ rooms, reservations }: ReportsDashboardProps) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const activeReservations = reservations.filter(
      (r) => r.status !== 'cancelled' && r.status !== 'checked-out'
    );

    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
    const occupancyRate = Math.round((occupiedRooms / rooms.length) * 100);

    const monthReservations = reservations.filter((r) => {
      const checkIn = new Date(r.check_in);
      return r.status !== 'cancelled' && checkIn >= monthStart && checkIn <= monthEnd;
    });

    const monthlyRevenue = monthReservations.reduce((sum, r) => sum + r.total_amount, 0);
    const collectedRevenue = monthReservations
      .filter((r) => r.payment_status === 'paid')
      .reduce((sum, r) => sum + r.total_amount, 0);

    const todayCheckIns = reservations.filter((r) => {
      const checkIn = new Date(r.check_in);
      checkIn.setHours(0, 0, 0, 0);
      return isToday(checkIn) && r.status === 'confirmed';
    });

    const todayCheckOuts = reservations.filter((r) => {
      const checkOut = new Date(r.check_out);
      checkOut.setHours(0, 0, 0, 0);
      return isToday(checkOut) && r.status === 'checked-in';
    });

    const tomorrowCheckIns = reservations.filter((r) => {
      const checkIn = new Date(r.check_in);
      checkIn.setHours(0, 0, 0, 0);
      return isTomorrow(checkIn) && r.status === 'confirmed';
    });

    const tomorrowCheckOuts = reservations.filter((r) => {
      const checkOut = new Date(r.check_out);
      checkOut.setHours(0, 0, 0, 0);
      return isTomorrow(checkOut) && r.status === 'checked-in';
    });

    const dirtyRooms = rooms.filter((r) => r.cleaning_status === 'dirty').length;
    const cleanRooms = rooms.filter((r) => r.cleaning_status === 'clean').length;
    const inProgressRooms = rooms.filter(
      (r) => r.cleaning_status === 'in-progress'
    ).length;

    return {
      occupancyRate,
      occupiedRooms,
      totalRooms: rooms.length,
      monthlyRevenue,
      collectedRevenue,
      todayCheckIns,
      todayCheckOuts,
      tomorrowCheckIns,
      tomorrowCheckOuts,
      dirtyRooms,
      cleanRooms,
      inProgressRooms,
    };
  }, [rooms, reservations]);

  const getRoomForReservation = (reservation: Reservation) => {
    return rooms.find((r) => r.id === reservation.room_id);
  };

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4 lg:p-6">
        <h1 className="text-2xl font-semibold text-white">Reportes</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Occupancy Rate */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                Ocupación Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">
                  {stats.occupancyRate}%
                </span>
                <span className="text-sm text-zinc-500 mb-1">
                  ({stats.occupiedRooms}/{stats.totalRooms} habitaciones)
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-sky-600 transition-all"
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Ingresos del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">
                  ${stats.monthlyRevenue.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-emerald-400 font-medium">
                  ${stats.collectedRevenue.toLocaleString('es-AR')} cobrados
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-amber-400">
                  ${(stats.monthlyRevenue - stats.collectedRevenue).toLocaleString('es-AR')} pendientes
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{
                    width: `${stats.monthlyRevenue > 0 ? (stats.collectedRevenue / stats.monthlyRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Housekeeping Status */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Estado de Limpieza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-emerald-400">
                    {stats.cleanRooms}
                  </span>
                  <span className="text-xs text-zinc-500">Limpias</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-rose-400">
                    {stats.dirtyRooms}
                  </span>
                  <span className="text-xs text-zinc-500">Sucias</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-amber-400">
                    {stats.inProgressRooms}
                  </span>
                  <span className="text-xs text-zinc-500">En proceso</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Today Check-ins */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald-400" />
                Ingresos de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.todayCheckIns.length === 0 ? (
                <p className="text-sm text-zinc-500">No hay ingresos programados</p>
              ) : (
                stats.todayCheckIns.map((reservation) => {
                  const room = getRoomForReservation(reservation);
                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {reservation.guest_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Hab. {room?.nombre} • {reservation.guest_phone}
                        </p>
                      </div>
                      <Badge className="bg-emerald-600/20 text-emerald-400 text-xs">
                        Pendiente
                      </Badge>
                    </div>
                  );
                })
              )}
              {stats.tomorrowCheckIns.length > 0 && (
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Mañana</p>
                  {stats.tomorrowCheckIns.slice(0, 2).map((reservation) => {
                    const room = getRoomForReservation(reservation);
                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center gap-2 text-sm text-zinc-400 py-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        <span>{reservation.guest_name}</span>
                        <span className="text-zinc-600">•</span>
                        <span>Hab. {room?.nombre}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today Check-outs */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <CalendarX className="h-4 w-4 text-amber-400" />
                Salidas de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.todayCheckOuts.length === 0 ? (
                <p className="text-sm text-zinc-500">No hay salidas programadas</p>
              ) : (
                stats.todayCheckOuts.map((reservation) => {
                  const room = getRoomForReservation(reservation);
                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {reservation.guest_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Hab. {room?.nombre} • ${reservation.total_amount.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <Badge className="bg-amber-600/20 text-amber-400 text-xs">
                        Pendiente
                      </Badge>
                    </div>
                  );
                })
              )}
              {stats.tomorrowCheckOuts.length > 0 && (
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Mañana</p>
                  {stats.tomorrowCheckOuts.slice(0, 2).map((reservation) => {
                    const room = getRoomForReservation(reservation);
                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center gap-2 text-sm text-zinc-400 py-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        <span>{reservation.guest_name}</span>
                        <span className="text-zinc-600">•</span>
                        <span>Hab. {room?.nombre}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
