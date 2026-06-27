'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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

export function useReservations() {
  const queryClient = useQueryClient();

  const roomsQuery = useRoomsQuery();
  const reservationsQuery = useReservationsQuery();
  const guestsQuery = useGuestsQuery();

  const createReservationMutation = useCreateReservationMutation();
  const updateReservationMutation = useUpdateReservationMutation();
  const deleteReservationMutation = useDeleteReservationMutation();

  const rooms: Room[] = roomsQuery.data ?? [];
  const reservations: Reservation[] = reservationsQuery.data ?? [];
  const guests: Guest[] = guestsQuery.data ?? [];
  const loading = roomsQuery.isLoading || reservationsQuery.isLoading || guestsQuery.isLoading;
  const error =
    roomsQuery.error instanceof Error
      ? roomsQuery.error.message
      : reservationsQuery.error instanceof Error
        ? reservationsQuery.error.message
        : guestsQuery.error instanceof Error
          ? guestsQuery.error.message
          : null;

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
      return repo.checkRoomAvailability(roomId, checkIn, checkOut, excludeReservationId);
    },
    []
  );

  const createReservation = useCallback(
    async (reservation: Omit<ReservationInsert, 'id' | 'created_at'>) => {
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
        return { success: true, data } as const;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al crear reserva',
        } as const;
      }
    },
    [isRoomAvailable, rooms, createReservationMutation]
  );

  const updateReservation = useCallback(
    async (id: string, updates: Partial<Reservation>) => {
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
    [isRoomAvailable, rooms, reservations, updateReservationMutation]
  );

  const deleteReservation = useCallback(
    async (id: string) => {
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
    [deleteReservationMutation]
  );

  const cancelReservation = useCallback(
    async (id: string) => {
      return updateReservation(id, { status: 'cancelled' });
    },
    [updateReservation]
  );

  const updateRoomStatus = useCallback(
    async (roomId: string, status: string) => {
      const prev = queryClient.getQueryData<Room[]>(queryKeys.rooms);

      queryClient.setQueryData<Room[]>(queryKeys.rooms, (old: Room[] | undefined) =>
        old
          ? old.map((r) => (r.id === roomId ? { ...r, status: status as Room['status'] } : r))
          : old
      );

      try {
        await repo.updateRoom(roomId, { status } as Partial<Room>);
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(queryKeys.rooms, prev);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al actualizar estado',
        } as const;
      }
    },
    [queryClient]
  );

  const updateCleaningStatus = useCallback(
    async (roomId: string, cleaningStatus: string) => {
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
        await repo.updateCleaningStatus(roomId, cleaningStatus);
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(queryKeys.rooms, prev);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al actualizar limpieza',
        } as const;
      }
    },
    [queryClient]
  );

  const checkIn = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) {
        return { success: false, error: 'Reserva no encontrada' } as const;
      }

      const prevReservations = queryClient.getQueryData<Reservation[]>(
        queryKeys.reservations
      );
      const prevRooms = queryClient.getQueryData<Room[]>(queryKeys.rooms);

      queryClient.setQueryData<Reservation[]>(queryKeys.reservations, (old: Reservation[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservationId ? { ...r, status: 'checked-in' as const } : r
            )
          : old
      );
      queryClient.setQueryData<Room[]>(queryKeys.rooms, (old: Room[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservation.room_id
                ? { ...r, status: 'occupied' as const }
                : r
            )
          : old
      );

      try {
        await repo.updateReservation(reservationId, { status: 'checked-in' });
        await repo.updateRoom(reservation.room_id, {
          status: 'occupied',
        } as Partial<Room>);
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(queryKeys.reservations, prevReservations);
        queryClient.setQueryData(queryKeys.rooms, prevRooms);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al registrar check-in',
        } as const;
      }
    },
    [reservations, queryClient]
  );

  const checkOut = useCallback(
    async (reservationId: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) {
        return { success: false, error: 'Reserva no encontrada' } as const;
      }

      const prevReservations = queryClient.getQueryData<Reservation[]>(
        queryKeys.reservations
      );
      const prevRooms = queryClient.getQueryData<Room[]>(queryKeys.rooms);

      queryClient.setQueryData<Reservation[]>(queryKeys.reservations, (old: Reservation[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservationId ? { ...r, status: 'checked-out' as const } : r
            )
          : old
      );
      queryClient.setQueryData<Room[]>(queryKeys.rooms, (old: Room[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservation.room_id
                ? { ...r, status: 'available' as const, cleaning_status: 'dirty' as const }
                : r
            )
          : old
      );

      try {
        await repo.updateReservation(reservationId, { status: 'checked-out' });
        await repo.updateRoom(reservation.room_id, {
          status: 'available',
        } as Partial<Room>);
        await repo.updateCleaningStatus(reservation.room_id, 'dirty');
        return { success: true } as const;
      } catch (err) {
        queryClient.setQueryData(queryKeys.reservations, prevReservations);
        queryClient.setQueryData(queryKeys.rooms, prevRooms);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error al registrar check-out',
        } as const;
      }
    },
    [reservations, queryClient]
  );

  const updatePaymentStatus = useCallback(
    async (reservationId: string, paymentStatus: PaymentStatus) => {
      const prev = queryClient.getQueryData<Reservation[]>(queryKeys.reservations);

      queryClient.setQueryData<Reservation[]>(queryKeys.reservations, (old: Reservation[] | undefined) =>
        old
          ? old.map((r) =>
              r.id === reservationId ? { ...r, payment_status: paymentStatus } : r
            )
          : old
      );

      try {
        await repo.updateReservation(reservationId, { payment_status: paymentStatus });
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
    [queryClient]
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
