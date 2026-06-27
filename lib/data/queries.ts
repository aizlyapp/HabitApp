import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as repo from './repository';
import type { Room, Reservation, ReservationInsert, Guest } from './types';

export const queryKeys = {
  rooms: ['rooms'] as const,
  reservations: ['reservations'] as const,
  guests: ['guests'] as const,
};

const staleTime = 30_000;

export function useRoomsQuery(userId: string | null) {
  return useQuery<Room[]>({
    queryKey: [...queryKeys.rooms, userId],
    queryFn: () => repo.fetchAllRooms(userId!),
    enabled: !!userId,
    staleTime,
  });
}

export function useReservationsQuery(userId: string | null) {
  return useQuery<Reservation[]>({
    queryKey: [...queryKeys.reservations, userId],
    queryFn: () => repo.fetchAllReservations(userId!),
    enabled: !!userId,
    staleTime,
  });
}

export function useGuestsQuery(userId: string | null) {
  return useQuery<Guest[]>({
    queryKey: [...queryKeys.guests, userId],
    queryFn: () => repo.fetchAllGuests(userId!),
    enabled: !!userId,
    staleTime,
  });
}

export function useCreateReservationMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<Reservation, Error, ReservationInsert>({
    mutationFn: (data) => repo.createReservation(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
    },
  });
}

export function useUpdateReservationMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; updates: Partial<Reservation> }>({
    mutationFn: ({ id, updates }) => repo.updateReservation(userId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
    },
  });
}

export function useDeleteReservationMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => repo.deleteReservation(userId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
    },
  });
}
