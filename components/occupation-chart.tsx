'use client';

import { useMemo } from 'react';
import { format, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Room, Reservation } from '@/lib/data/types';

export function OccupationChart({
  rooms,
  reservations,
}: {
  rooms: Room[];
  reservations: Reservation[];
}) {
  const chartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

    return days.map((day) => {
      const activeReservations = reservations.filter((r) => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        return (
          r.status !== 'cancelled' &&
          isWithinInterval(day, {
            start: startOfDay(checkIn),
            end: endOfDay(checkOut),
          })
        );
      });

      const occupied = rooms.filter((room) =>
        activeReservations.some((r) => r.room_id === room.id)
      ).length;

      const percentage = rooms.length > 0
        ? Math.round((occupied / rooms.length) * 100)
        : 0;

      return {
        date: format(day, 'EEE d/M', { locale: es }),
        ocupacion: percentage,
        lleno: occupied,
        disponible: rooms.length - occupied,
      };
    });
  }, [rooms, reservations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Ocupación Próximos 14 Días
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Ocupación']}
              />
              <Bar
                dataKey="ocupacion"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
