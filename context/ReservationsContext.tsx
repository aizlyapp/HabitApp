'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useReservations } from '@/hooks/useReservations';
import type { Room, Reservation, ReservationInsert, Guest, PaymentStatus } from '@/lib/data/types';

interface ReservationsContextValue {
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRoomAvailable: (
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string
  ) => Promise<{ available: boolean; conflict?: Reservation }>;
  createReservation: (
    reservation: Omit<ReservationInsert, 'id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string; data?: Reservation }>;
  updateReservation: (
    id: string,
    updates: Partial<Reservation>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteReservation: (id: string) => Promise<{ success: boolean; error?: string }>;
  cancelReservation: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateRoomStatus: (
    roomId: string,
    status: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateCleaningStatus: (
    roomId: string,
    cleaningStatus: string
  ) => Promise<{ success: boolean; error?: string }>;
  checkIn: (reservationId: string) => Promise<{ success: boolean; error?: string }>;
  checkOut: (reservationId: string) => Promise<{ success: boolean; error?: string }>;
  updatePaymentStatus: (
    reservationId: string,
    paymentStatus: PaymentStatus
  ) => Promise<{ success: boolean; error?: string }>;
}

const ReservationsContext = createContext<ReservationsContextValue | null>(null);

export function ReservationsProvider({ children }: { children: ReactNode }) {
  const value = useReservations();

  return (
    <ReservationsContext.Provider value={value}>
      {children}
    </ReservationsContext.Provider>
  );
}

export function useReservationsContext() {
  const context = useContext(ReservationsContext);

  if (!context) {
    throw new Error(
      'useReservationsContext must be used within a ReservationsProvider'
    );
  }

  return context;
}
