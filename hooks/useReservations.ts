'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Room, Reservation, ReservationInsert, Guest, PaymentStatus } from '@/lib/data/types';
import { validateDateRange, parseDate } from '@/lib/data/validators';
import * as repo from '@/lib/data/repository';
import {
  queryKeys,
  useRoomsQuery,
  useReservationsQuery,
  useGuestsQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,
} from '@/lib/data/queries';
import { getSubscriptionFromMetadata, isSubscriptionActive } from '@/lib/subscription';

const EXPIRED_MSG = 'Tu período de prueba terminó. Suscribite para seguir operando.';

export function useReservations() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        setUserId(user.id);
        const metadata = user.user_metadata as { subscription?: string };
        const sub = getSubscriptionFromMetadata(metadata);
        setSubscriptionBlocked(!isSubscriptionActive(sub));
      } else {
        setSubscriptionBlocked(null);
      }
    });
  }, [supabase]);

  const roomsQuery = useRoomsQuery(userId);
  const reservationsQuery = useReservationsQuery(userId);
  const guestsQuery = useGuestsQuery(userId);

  const createReservationMutation = useCreateReservationMutation(userId || '');
  const updateReservationMutation = useUpdateReservationMutation(userId || '');
  const deleteReservationMutation = useDeleteReservationMutation(userId || '');

  const rooms: Room[] = roomsQuery.data ?? [];
  const reservations: Reservation[] = reservationsQuery.data ?? [];
  const guests: Guest[] = guestsQuery.data ?? [];
  const loading = roomsQuery.isLoading || reservationsQuery.isLoading || guestsQuery.isLoading || !userId;
  const error =
    roomsQuery.error instanceof Error
      ? roomsQuery.error.message
      : reservationsQuery.error instanceof Error
        ? reservationsQuery.error.message
        : guestsQuery.error instanceof Error
          ? guestsQuery.error.message
          : null;

  const checkSubscriptionBlocked = useCallback(() => {
    if (subscriptionBlocked === true) {
      return { success: false, error: EXPIRED_MSG } as const;
    }
    return null;
  }, [subscriptionBlocked]);

  const refetch = useCallback(async () => {
    await Promise.all([
      roomsQuery.refetch(),
      reservationsQuery.refetch(),
      guestsQuery.refetch(),
    ]);
  }, [roomsQuery, reservationsQuery, guestsQuery]);

  const isRoomAvailable = useCallback(
    async (
      roomId: string,
      checkIn: Date,
      checkOut: Date,
      excludeReservationId?: string
    ) => {
      if (!userId) return { available: false, error: 'Usuario no autenticado' };
      return repo.checkRoomAvailability(userId, roomId, checkIn, checkOut, excludeReservationId);
    },
    [userId]
  );

  const createReservation = useCallback(
    async (reservation: Omit<ReservationInsert, 'id' | 'created_at'>) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      const checkIn = parseDate(reservation.check_in);
      const checkOut = parseDate(reservation.check_out);
      const validationError = validateDateRange(checkIn, checkOut);

      if (validationError) {
        return { success: false, error: validationError } as const;
      }

      const availability = await isRoomAvailable(reservation.room_id, checkIn, checkOut);

      if (!availability.available) {
        const room = rooms.find((r) => r.id === reservation.room_id);
        return {
          success: false,
          error: `La habitación ${room?.nombre || ''} no está disponible en esas fechas. Ya existe una reserva.`,
        } as const;
      }

      try {
        const data = await createReservationMutation.mutateAsync(
          reservation as ReservationInsert
        );

        if (reservation.guest_phone && userId) {
          const room = rooms.find((r) => r.id === reservation.room_id);
          const { sendReservationConfirmation } = await import('@/lib/services/whatsapp');
          sendReservationConfirmation(
            userId,
            reservation.guest_phone,
            reservation.guest_name || 'Huésped',
            room?.nombre || reservation.room_id,
            reservation.check_in,
            reservation.check_out,
            reservation.total_amount || 0
          ).catch((e) => console.error('Error sending WhatsApp confirmation:', e));
        }

        return { success: true, data } as const;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al crear reserva',
        } as const;
      }
    },
    [userId, isRoomAvailable, rooms, createReservationMutation, checkSubscriptionBlocked]
  );

  const updateReservation = useCallback(
    async (id: string, updates: Partial<Reservation>) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      if (updates.check_in && updates.check_out) {
        const checkIn = parseDate(updates.check_in);
        const checkOut = parseDate(updates.check_out);
        const validationError = validateDateRange(checkIn, checkOut);

        if (validationError) {
          return { success: false, error: validationError } as const;
        }

        const roomId =
          updates.room_id ||
          reservations.find((r) => r.id === id)?.room_id ||
          '';
        const availability = await isRoomAvailable(roomId, checkIn, checkOut, id);

        if (!availability.available) {
          const room = rooms.find((r) => r.id === roomId);
          return {
            success: false,
            error: `La habitación ${room?.nombre || ''} no está disponible en esas fechas.`,
          } as const;
        }
      }

      try {
        await updateReservationMutation.mutateAsync({ id, updates });
        return { success: true } as const;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al actualizar reserva',
        } as const;
      }
    },
    [userId, isRoomAvailable, rooms, reservations, updateReservationMutation, checkSubscriptionBlocked]
  );

  const deleteReservation = useCallback(
    async (id: string) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      try {
        await deleteReservationMutation.mutateAsync(id);
        return { success: true } as const;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al eliminar reserva',
        } as const;
      }
    },
    [userId, deleteReservationMutation, checkSubscriptionBlocked]
  );

  const cancelReservation = useCallback(
    async (id: string) => {
      const result = await updateReservation(id, { status: 'cancelled' });

      if (result.success && userId) {
        const reservation = reservations.find((r) => r.id === id);
        if (reservation?.guest_phone) {
          const room = rooms.find((r) => r.id === reservation.room_id);
          const { sendReservationCancelled } = await import('@/lib/services/whatsapp');
          sendReservationCancelled(
            userId,
            reservation.guest_phone,
            reservation.guest_name || 'Huésped',
            room?.nombre || reservation.room_id || '',
            reservation.check_in || ''
          ).catch((e) => console.error('Error sending cancellation WhatsApp:', e));
        }
      }

      return result;
    },
    [updateReservation, userId, reservations, rooms]
  );

  const updateRoomStatus = useCallback(
    async (roomId: string, status: string) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      const prev = queryClient.getQueryData<Room[]>(queryKeys.rooms);

      queryClient.setQueryData<Room[]>(queryKeys.rooms, (old: Room[] | undefined) =>
        old
          ? old.map((r) => (r.id === roomId ? { ...r, status: status as Room['status'] } : r))
          : old
      );

      try {
        await repo.updateRoom(userId, roomId, { status } as Partial<Room>);
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(queryKeys.rooms, prev);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al actualizar estado',
        } as const;
      }
    },
    [userId, queryClient, checkSubscriptionBlocked]
  );

  const updateCleaningStatus = useCallback(
    async (roomId: string, cleaningStatus: string) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      const prev = queryClient.getQueryData<Room[]>(queryKeys.rooms);

      queryClient.setQueryData<Room[]>(queryKeys.rooms, (old: Room[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === roomId
                ? { ...r, cleaning_status: cleaningStatus as Room['cleaning_status'] }
                : r
            )
          : old
      );

      try {
        await repo.updateCleaningStatus(userId, roomId, cleaningStatus);
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(queryKeys.rooms, prev);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al actualizar limpieza',
        } as const;
      }
    },
    [userId, queryClient, checkSubscriptionBlocked]
  );

  const checkIn = useCallback(
    async (reservationId: string) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) {
        return { success: false, error: 'Reserva no encontrada' } as const;
      }

      const reservationsKey = [...queryKeys.reservations, userId];
      const roomsKey = [...queryKeys.rooms, userId];

      const prevReservations = queryClient.getQueryData<Reservation[]>(reservationsKey);
      const prevRooms = queryClient.getQueryData<Room[]>(roomsKey);

      queryClient.setQueryData<Reservation[]>(reservationsKey, (old: Reservation[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservationId ? { ...r, status: 'checked-in' as const } : r
            )
          : old
      );
      queryClient.setQueryData<Room[]>(roomsKey, (old: Room[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservation.room_id
                ? { ...r, status: 'occupied' as const }
                : r
            )
          : old
      );

      try {
        await repo.updateReservation(userId, reservationId, { status: 'checked-in' });
        await repo.updateRoom(userId, reservation.room_id, {
          status: 'occupied',
        } as Partial<Room>);

        if (reservation.guest_phone && userId) {
          const room = rooms.find((r) => r.id === reservation.room_id);
          const { sendCheckInNotification } = await import('@/lib/services/whatsapp');
          sendCheckInNotification(
            userId,
            reservation.guest_phone,
            reservation.guest_name || 'Huésped',
            room?.nombre || reservation.room_id
          ).catch((e) => console.error('Error sending check-in WhatsApp:', e));
        }

        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(reservationsKey, prevReservations);
        queryClient.setQueryData(roomsKey, prevRooms);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al registrar check-in',
        } as const;
      }
    },
    [userId, reservations, rooms, queryClient, checkSubscriptionBlocked]
  );

  const checkOut = useCallback(
    async (reservationId: string) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) {
        return { success: false, error: 'Reserva no encontrada' } as const;
      }

      const reservationsKey = [...queryKeys.reservations, userId];
      const roomsKey = [...queryKeys.rooms, userId];

      const prevReservations = queryClient.getQueryData<Reservation[]>(reservationsKey);
      const prevRooms = queryClient.getQueryData<Room[]>(roomsKey);

      queryClient.setQueryData<Reservation[]>(reservationsKey, (old: Reservation[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservationId ? { ...r, status: 'checked-out' as const } : r
            )
          : old
      );
      queryClient.setQueryData<Room[]>(roomsKey, (old: Room[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservation.room_id
                ? { ...r, status: 'available' as const, cleaning_status: 'dirty' as const }
                : r
            )
          : old
      );

      try {
        await repo.updateReservation(userId, reservationId, { status: 'checked-out' });
        await repo.updateRoom(userId, reservation.room_id, {
          status: 'available',
        } as Partial<Room>);
        await repo.updateCleaningStatus(userId, reservation.room_id, 'dirty');
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(reservationsKey, prevReservations);
        queryClient.setQueryData(roomsKey, prevRooms);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al registrar check-out',
        } as const;
      }
    },
    [userId, reservations, queryClient, checkSubscriptionBlocked]
  );

  const updatePaymentStatus = useCallback(
    async (reservationId: string, paymentStatus: PaymentStatus) => {
      if (!userId) return { success: false, error: 'Usuario no autenticado' } as const;

      const blocked = checkSubscriptionBlocked();
      if (blocked) return blocked;

      const reservationsKey = [...queryKeys.reservations, userId];

      const prev = queryClient.getQueryData<Reservation[]>(reservationsKey);

      queryClient.setQueryData<Reservation[]>(reservationsKey, (old: Reservation[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservationId ? { ...r, payment_status: paymentStatus } : r
            )
          : old
      );

      try {
        await repo.updateReservation(userId, reservationId, { payment_status: paymentStatus });
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(queryKeys.reservations, prev);
        console.error('Error al actualizar payment_status:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al actualizar estado de pago',
        } as const;
      }
    },
    [userId, queryClient, checkSubscriptionBlocked]
  );

  return {
    rooms,
    reservations,
    guests,
    loading,
    error,
    refetch,
    isRoomAvailable,
    createReservation,
    updateReservation,
    deleteReservation,
    cancelReservation,
    updateRoomStatus,
    updateCleaningStatus,
    checkIn,
    checkOut,
    updatePaymentStatus,
  };
}
