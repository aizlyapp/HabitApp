import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as repo from './repository';
import type { Room, Reservation, ReservationInsert, Guest } from './types';

export const queryKeys = {
  rooms: ['rooms'] as const,
  reservations: ['reservations'] as const,
  guests: ['guests'] as const,
};

const staleTime = 30_000;

export function useRoomsQuery() {
  return useQuery<Room[]>({
    queryKey: queryKeys.rooms,
    queryFn: repo.fetchAllRooms,
    staleTime,
  });
}

export function useReservationsQuery() {
  return useQuery<Reservation[]>({
    queryKey: queryKeys.reservations,
    queryFn: repo.fetchAllReservations,
    staleTime,
  });
}

export function useGuestsQuery() {
  return useQuery<Guest[]>({
    queryKey: queryKeys.guests,
    queryFn: repo.fetchAllGuests,
    staleTime,
  });
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation<Reservation, Error, ReservationInsert>({
    mutationFn: (data) => repo.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
    },
  });
}

export function useUpdateReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; updates: Partial<Reservation> }>({
    mutationFn: ({ id, updates }) => repo.updateReservation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
    },
  });
}

export function useDeleteReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => repo.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
    },
  });
}
