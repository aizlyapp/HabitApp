'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CombinedReservation } from '@/lib/data/ical-types';
import type { Reservation } from '@/lib/data/types';

const supabase = createClient();

// Query keys
export const combinedReservationsKeys = {
    all: ['combinedReservations'] as const,
    lists: () => [...combinedReservationsKeys.all, 'list'] as const,
    list: (userId: string) => [...combinedReservationsKeys.lists(), userId] as const,
};

/**
 * Hook to fetch combined reservations (local + external)
 * Returns unified array with both reservation types
 */
export function useCombinedReservations(userId: string | undefined | null) {
    return useQuery({
        queryKey: combinedReservationsKeys.list(userId || ''),
        queryFn: async () => {
            if (!userId) throw new Error('User ID required');

            const response = await fetch('/api/reservations/combined', {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error fetching combined reservations');
            }

            const result = await response.json();

            return result.reservations as CombinedReservation[];
        },
        enabled: !!userId,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}

/**
 * Hook to create a new local reservation
 * Invalidates combined reservations cache after creation
 */
export function useCreateCombinedReservation() {
    const queryClient = useQueryClient();

    return async (userId: string, reservation: Omit<Reservation, 'id' | 'created_at'>) => {
        if (!userId) {
            return { success: false, error: 'Usuario no autenticado' } as const;
        }

        try {
            const { data, error } = await supabase
                .from('reservations')
                .insert({ ...reservation, user_id: userId })
                .select()
                .single();

            if (error) throw error;

            // Invalidate both queries
            queryClient.invalidateQueries({ queryKey: combinedReservationsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });

            return { success: true, data } as const;
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Error al crear reserva',
            } as const;
        }
    };
}

/**
 * Hook to get only local reservations (for forms that need it)
 */
export function useLocalReservations(userId: string | undefined | null) {
    return useQuery({
        queryKey: ['reservations', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID required');

            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('user_id', userId)
                .order('check_in');

            if (error) throw error;
            return (data || []) as Reservation[];
        },
        enabled: !!userId,
        staleTime: 30 * 1000,
    });
}

/**
 * Helper to check if a reservation is external
 */
export function isExternalReservation(reservation: CombinedReservation): boolean {
    return reservation.source === 'external';
}

/**
 * Get source display info
 */
export function getSourceDisplayInfo(reservation: CombinedReservation) {
    if (reservation.source === 'external') {
        return {
            label: reservation.external_source || 'Externo',
            badgeClass: 'bg-blue-100 text-blue-800',
            icon: '🌐',
        };
    }

    return {
        label: 'Local',
        badgeClass: 'bg-green-100 text-green-800',
        icon: '🏨',
    };
}