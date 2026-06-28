'use client';

import { useMemo, useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Room, Reservation } from '@/lib/data/types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BedDouble,
  Wrench,
  Loader2,
  Sparkles,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface BookingCalendarProps {
  rooms: Room[];
  reservations: Reservation[];
  loading: boolean;
  onNewBooking: (room?: Room, date?: Date) => void;
  onBookingClick: (booking: Reservation) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-emerald-500/20 text-emerald-400' },
  occupied: { label: 'Ocupada', color: 'bg-amber-500/20 text-amber-400' },
  maintenance: { label: 'Mantenimiento', color: 'bg-rose-500/20 text-rose-400' },
};

const bookingStatusColors: Record<string, string> = {
  confirmed: 'bg-sky-600 hover:bg-sky-700',
  'checked-in': 'bg-emerald-600 hover:bg-emerald-700',
  'checked-out': 'bg-zinc-600',
  cancelled: 'bg-rose-600/50 line-through opacity-50',
};

export function BookingCalendar({
  rooms,
  reservations,
  loading,
  onNewBooking,
  onBookingClick,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const previousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getBookingForRoomOnDay = (roomId: string, day: Date): Reservation | null => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return (
      reservations.find((b) => {
        if (b.room_id !== roomId) return false;
        if (b.status === 'cancelled') return false;
        return dayStr >= b.check_in && dayStr < b.check_out;
      }) || null
    );
  };

  const hasBookingStarted = (booking: Reservation, day: Date): boolean => {
    return format(day, 'yyyy-MM-dd') === booking.check_in;
  };

  const getCheckoutBookingForRoomOnDay = (roomId: string, day: Date): Reservation | null => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return (
      reservations.find((b) => {
        if (b.room_id !== roomId) return false;
        if (b.status === 'cancelled') return false;
        return dayStr === b.check_out;
      }) || null
    );
  };

  const bookingStatusHex: Record<string, string> = {
    confirmed: '#0284c7',
    'checked-in': '#059669',
    'checked-out': '#52525b',
    cancelled: '#e11d48',
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800 p-4 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Calendario de Reservas</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </p>
          </div>
          <Button
            onClick={() => onNewBooking()}
            className="bg-sky-600 text-white hover:bg-sky-700 gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </Button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousWeek}
              className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextWeek}
              className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="sticky top-0 z-20 grid grid-cols-[180px_repeat(7,1fr)] border-b border-zinc-800 bg-zinc-900">
            <div className="border-r border-zinc-800 p-3 text-sm font-medium text-zinc-400">
              Habitación
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-r border-zinc-800 p-3 text-center',
                  isToday(day) && 'bg-sky-600/10'
                )}
              >
                <div className="text-xs font-medium uppercase text-zinc-500">
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    isToday(day) ? 'text-sky-400' : 'text-white'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Room rows */}
          {rooms.map((room) => (
            <div
              key={room.id}
              className={cn(
                'grid grid-cols-[180px_repeat(7,1fr)] border-b border-zinc-800 transition-colors',
                hoveredRoom === room.id && 'bg-zinc-800/50'
              )}
              onMouseEnter={() => setHoveredRoom(room.id)}
              onMouseLeave={() => setHoveredRoom(null)}
            >
              {/* Room info */}
              <div className="border-r border-zinc-800 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">
                    {room.nombre}
                    <Badge variant="outline" className="border-zinc-700 text-[10px] px-1.5 py-0 text-zinc-400">
                      {room.tipo}
                    </Badge>
                  </span>
                  {(room.cleaning_status === 'dirty' || room.cleaning_status === 'in-progress') && (
                    <div
                      className={cn(
                        'flex items-center justify-center h-5 w-5 rounded-full',
                        room.cleaning_status === 'dirty'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      )}
                      title={
                        room.cleaning_status === 'dirty'
                          ? 'Habitación sucia'
                          : 'Limpieza en progreso'
                      }
                    >
                      {room.cleaning_status === 'dirty' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                  )}
                  {room.cleaning_status === 'clean' && room.status !== 'maintenance' && (
                    <div title="Limpia">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  )}
                  <Badge
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      statusConfig[room.status]?.color || ''
                    )}
                  >
                    {statusConfig[room.status]?.label || room.status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <BedDouble className="h-3 w-3" />
                  <span>
                    {room.capacidad} pers.
                  </span>
                </div>
              </div>

              {/* Day cells */}
              {weekDays.map((day) => {
                const booking = getBookingForRoomOnDay(room.id, day);
                const checkoutBooking = getCheckoutBookingForRoomOnDay(room.id, day);
                const showBookingStart = booking && hasBookingStarted(booking, day);
                const isCheckoutDay = checkoutBooking !== null;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => {
                      if (isCheckoutDay && booking) {
                        onBookingClick(booking);
                      } else if (!booking && room.status !== 'maintenance') {
                        onNewBooking(room, day);
                      }
                    }}
                    className={cn(
                      'border-r border-zinc-800 p-1 min-h-[60px] transition-colors relative',
                      !booking && room.status !== 'maintenance' && 'cursor-pointer hover:bg-zinc-800/50',
                      room.status === 'maintenance' && 'bg-rose-950/20'
                    )}
                    title={
                      isCheckoutDay && checkoutBooking
                        ? booking
                          ? `Salida: ${checkoutBooking.guest_name} · Entrada: ${booking.guest_name}`
                          : `Salida: ${checkoutBooking.guest_name} · Entrada disponible`
                        : undefined
                    }
                  >
                    {isCheckoutDay && checkoutBooking && (
                      <div className="absolute inset-0 overflow-hidden rounded-sm">
                        <div
                          className="absolute inset-0 flex items-start justify-start"
                          style={{
                            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                            backgroundColor: booking
                              ? bookingStatusHex[checkoutBooking.status] || '#1e3a5f'
                              : '#1e3a5f',
                          }}
                        >
                          <span className="ml-1 mt-0.5 text-[10px] font-bold text-white/90 leading-none">
                            OUT
                          </span>
                        </div>
                        <div
                          className="absolute inset-0 flex items-end justify-end"
                          style={{
                            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                            backgroundColor: booking
                              ? bookingStatusHex[booking.status] || '#166534'
                              : '#166534',
                          }}
                        >
                          <span className="mr-1 mb-0.5 text-[10px] font-medium text-white/90 leading-none truncate max-w-[85%]">
                            {booking ? booking.guest_name : 'LIBRE'}
                          </span>
                        </div>
                      </div>
                    )}
                    {!isCheckoutDay && showBookingStart && booking && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick(booking);
                        }}
                        className={cn(
                          'w-full rounded px-2 py-1.5 text-left transition-opacity text-white',
                          bookingStatusColors[booking.status]
                        )}
                      >
                        <div className="text-xs font-medium truncate">
                          {booking.guest_name}
                        </div>
                        <div className="text-[10px] text-white/70">
                          {format(new Date(booking.check_in), 'd')} -{' '}
                          {format(new Date(booking.check_out), 'd')}
                        </div>
                      </button>
                    )}
                    {!isCheckoutDay && booking && !showBookingStart && (
                      <div className="h-full w-full rounded bg-sky-900/30 border-l-2 border-sky-600" />
                    )}
                    {!booking && room.status === 'maintenance' && day.getTime() === weekDays[0].getTime() && (
                      <div className="flex items-center gap-1 text-xs text-rose-400 p-2">
                        <Wrench className="h-3 w-3" />
                        <span>Mantenimiento</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">Leyenda:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-sky-600" />
            <span>Confirmada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>Ingreso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Mantenimiento</span>
          </div>
        </div>
      </div>
    </div>
  );
}
