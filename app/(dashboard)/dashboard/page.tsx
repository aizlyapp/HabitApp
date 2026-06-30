'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { createClient } from '@/lib/supabase/client';
import { getSubscriptionFromMetadata, isSubscriptionActive, getTrialDaysLeft } from '@/lib/subscription';
import { BookingCalendar } from '@/components/booking-calendar';
import { BookingModal } from '@/components/booking-modal';
import { BookingDetailDrawer } from '@/components/booking-detail-drawer';
import { ReportsDashboard } from '@/components/reports-dashboard';
import { RoomManager } from '@/components/room-manager';
import { GuestManager } from '@/components/guest-manager';
import { ExecutiveDashboard } from '@/components/executive-dashboard';
import { BusinessSettings } from '@/components/business-settings';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ReservationsProvider, useReservationsContext } from '@/context/ReservationsContext';
import type { Room, Reservation, ReservationInsert, Guest, PaymentStatus } from '@/lib/data/types';
import { queryKeys } from '@/lib/data/queries';
import * as repo from '@/lib/data/repository';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n/context';

function HotelsPMSContent() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        setUserId(user.id);
        const metadata = user.user_metadata as { subscription?: string };
        const sub = getSubscriptionFromMetadata(metadata);
        const active = isSubscriptionActive(sub);
        setSubscriptionExpired(!active && sub.plan === 'trial');
        setTrialDaysLeft(active && sub.plan === 'trial' ? getTrialDaysLeft(sub) : null);
      }
    });
  }, [supabase]);

  const {
    rooms,
    reservations,
    guests,
    loading,
    error,
    createReservation,
    updateReservation,
    checkIn,
    checkOut,
    cancelReservation,
    updateCleaningStatus,
    updatePaymentStatus,
  } = useReservationsContext();

  const handleNewBooking = (room?: Room, date?: Date) => {
    setSelectedRoom(room);
    setSelectedDate(date);
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleBookingSubmit = async (booking: {
    room_id: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    guest_count: number;
    check_in: string;
    check_out: string;
    total_amount: number;
    notes?: string;
  }) => {
    if (isEditMode && selectedBooking) {
      const result = await updateReservation(selectedBooking.id, {
        room_id: booking.room_id,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        guest_count: booking.guest_count,
        check_in: booking.check_in,
        check_out: booking.check_out,
        total_amount: booking.total_amount,
        notes: booking.notes,
      });

      if (result.success) {
        toast({
          title: t('page.reservaActualizada'),
          description: t('page.reservaActualizadaDesc', { name: booking.guest_name }),
        });
        setSelectedBooking(null);
      }

      return result;
    }

    // Auto-create guest if new
    const guestExists = guests.some(
      (g: Guest) =>
        g.nombre === booking.guest_name ||
        (booking.guest_email && g.email === booking.guest_email) ||
        (booking.guest_phone && g.telefono === booking.guest_phone)
    );

    if (!guestExists && userId) {
      try {
        await repo.insertGuest(userId, {
          nombre: booking.guest_name,
          email: booking.guest_email,
          telefono: booking.guest_phone,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.guests });
      } catch {
        // Guest creation is non-critical, continue with reservation
      }
    }

    const result = await createReservation({
      ...booking,
      status: 'confirmed' as const,
    });

    if (result.success) {
      toast({
        title: t('page.reservaCreada'),
        description: t('page.reservaCreadaDesc', { name: booking.guest_name }),
      });
    }

    return result;
  };

  const handleBookingClick = (booking: Reservation) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const handleEditBooking = () => {
    const room = rooms.find((r) => r.id === selectedBooking?.room_id);
    setSelectedRoom(room);
    setSelectedDate(new Date(selectedBooking?.check_in || new Date()));
    setIsEditMode(true);
    setDrawerOpen(false);
    setModalOpen(true);
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return { success: false, error: t('page.noHayReserva') };
    const result = await checkIn(selectedBooking.id);
    if (result.success) {
      const room = rooms.find((r) => r.id === selectedBooking.room_id);
      toast({
        title: t('page.checkinRegistrado'),
        description: t('page.checkinDesc', { name: selectedBooking.guest_name, room: room?.nombre || selectedBooking.room_id }),
      });
    }
    return result;
  };

  const handleCheckOut = async () => {
    if (!selectedBooking) return { success: false, error: t('page.noHayReserva') };
    const result = await checkOut(selectedBooking.id);
    if (result.success) {
      const room = rooms.find((r) => r.id === selectedBooking.room_id);
      toast({
        title: t('page.checkoutRegistrado'),
        description: t('page.checkoutDesc', { name: selectedBooking.guest_name, room: room?.nombre || selectedBooking.room_id }),
      });
      setSelectedBooking(null);
    }
    return result;
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return { success: false, error: t('page.noHayReserva') };
    const result = await cancelReservation(selectedBooking.id);
    if (result.success) {
      toast({
        title: t('page.reservaCancelada'),
        description: t('page.reservaCanceladaDesc', { name: selectedBooking.guest_name }),
      });
      setSelectedBooking(null);
    }
    return result;
  };

  const handleUpdatePaymentStatus = async (paymentStatus: PaymentStatus) => {
    if (!selectedBooking) return { success: false, error: t('page.noHayReserva') };
    const result = await updatePaymentStatus(selectedBooking.id, paymentStatus);
    if (result.success && selectedBooking) {
      setSelectedBooking({ ...selectedBooking, payment_status: paymentStatus });
    }
    return result;
  };

  const handleCleaningStatusChange = async (roomId: string, status: string) => {
    const result = await updateCleaningStatus(roomId, status);
    if (result.success) {
      toast({
        title: t('page.estadoActualizado'),
        description: t('page.estadoActualizadoDesc'),
      });
    }
    return result;
  };

  const selectedBookingRoom = selectedBooking
    ? rooms.find((r) => r.id === selectedBooking.room_id) || null
    : null;

  if (error) {
    return (
      <DashboardLayout
        sidebar={
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
        }
      >
        <div className="flex h-full items-center justify-center p-4">
          <div className="text-center">
            <p className="text-rose-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sky-400 hover:underline"
            >
              {t('page.reintentar')}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <ExecutiveDashboard
            rooms={rooms}
            reservations={reservations}
            onNewBooking={() => handleNewBooking()}
            onBookingClick={handleBookingClick}
            onViewDirtyRooms={() => setActiveView('rooms')}
          />
        );
      case 'rooms':
        return <RoomManager rooms={rooms} />;
      case 'guests':
        return <GuestManager guests={guests} />;
      case 'reports':
        return <ReportsDashboard rooms={rooms} reservations={reservations} />;
      case 'settings':
        return <BusinessSettings />;
      case 'calendar':
      default:
        return (
          <>
            <BookingCalendar
              rooms={rooms}
              reservations={reservations}
              loading={loading}
              onNewBooking={handleNewBooking}
              onBookingClick={handleBookingClick}
            />
            <BookingDetailDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              booking={selectedBooking}
              room={selectedBookingRoom}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onEdit={handleEditBooking}
              onCancel={handleCancelBooking}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          </>
        );
    }
  };

  return (
    <DashboardLayout
      sidebar={
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
      }
    >
      {subscriptionExpired && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-800/50 bg-rose-950/50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          <div className="flex-1 text-sm text-rose-200">
            {t('page.pruebaTerminada')}{' '}
            <a href="/suscripcion" className="font-medium text-rose-300 underline hover:text-rose-200">
              {t('page.suscribiteParaOperar')}
            </a>
          </div>
        </div>
      )}
      {trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-800/50 bg-amber-950/50 px-4 py-3">
          <Clock className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex-1 text-sm text-amber-200">
            {trialDaysLeft === 1 ? t('page.teQueda') : t('page.teQuedan')} <span className="font-semibold">{trialDaysLeft}</span> {trialDaysLeft === 1 ? t('page.diaPrueba') : t('page.diasPrueba')}{' '}
            <a href="/suscripcion" className="font-medium text-amber-300 underline hover:text-amber-200">
              {t('page.suscribiteNoPierdas')}
            </a>
          </div>
        </div>
      )}
      <div key={activeView} className="animate-fade-in">
        {renderContent()}
      </div>
      <BookingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        rooms={rooms}
        guests={guests}
        selectedRoom={selectedRoom}
        selectedDate={selectedDate}
        editingBooking={isEditMode ? selectedBooking : null}
        onSubmit={handleBookingSubmit}
      />
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <ReservationsProvider>
      <HotelsPMSContent />
    </ReservationsProvider>
  );
}
