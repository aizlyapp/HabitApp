'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  BedDouble,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { Room, Reservation, PaymentStatus } from '@/lib/data/types';
import { loadConfig, hasPaymentData, qrContent } from '@/lib/data/business-config';

interface BookingDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Reservation | null;
  room: Room | null;
  onCheckIn: () => Promise<{ success: boolean; error?: string }>;
  onCheckOut: () => Promise<{ success: boolean; error?: string }>;
  onEdit: () => void;
  onCancel: () => Promise<{ success: boolean; error?: string }>;
  onUpdatePaymentStatus?: (paymentStatus: PaymentStatus) => Promise<{ success: boolean; error?: string }>;
}

const getStatusConfig = (t: (key: string, params?: Record<string, string | number>) => string): Record<string, { label: string; color: string; bgColor: string }> => ({
  confirmed: {
    label: t('bookingDrawer.confirmada'),
    color: 'text-sky-400',
    bgColor: 'bg-sky-600/20 text-sky-400',
  },
  'checked-in': {
    label: t('bookingDrawer.checkinRealizado'),
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-600/20 text-emerald-400',
  },
  'checked-out': {
    label: t('bookingDrawer.checkoutRealizado'),
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-600/20 text-zinc-400',
  },
  cancelled: {
    label: t('bookingDrawer.cancelada'),
    color: 'text-rose-400',
    bgColor: 'bg-rose-600/20 text-rose-400',
  },
});

export function BookingDetailDrawer({
  open,
  onOpenChange,
  booking,
  room,
  onCheckIn,
  onCheckOut,
  onEdit,
  onCancel,
  onUpdatePaymentStatus,
}: BookingDetailDrawerProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [copiedPayment, setCopiedPayment] = useState(false);
  const { t } = useTranslation();

  if (!booking || !room) return null;

  const businessConfig = loadConfig();

  const handleCheckIn = async () => {
    setLoading('checkin');
    setError(null);
    const result = await onCheckIn();
    setLoading(null);
    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || t('bookingDrawer.errorCheckin'));
    }
  };

  const handleCheckOut = async () => {
    setLoading('checkout');
    setError(null);
    const result = await onCheckOut();
    setLoading(null);
    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || t('bookingDrawer.errorCheckout'));
    }
  };

  const handleCancel = async () => {
    setLoading('cancel');
    setError(null);
    const result = await onCancel();
    setLoading(null);
    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || t('bookingDrawer.errorCancelar'));
    }
    setShowCancelConfirm(false);
  };

  const statusConfig = getStatusConfig(t);
  const status = statusConfig[booking.status] || statusConfig.confirmed;
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
    (1000 * 60 * 60 * 24)
  );
  const waNumber = booking.guest_phone.replace(/\D/g, '').replace(/^0/, '54');

  const canCheckIn = booking.status === 'confirmed';
  const canCheckOut = booking.status === 'checked-in';
  const canCancel = booking.status !== 'cancelled' && booking.status !== 'checked-out';

  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    if (!onUpdatePaymentStatus) return;
    setLoading('payment');
    setError(null);
    const result = await onUpdatePaymentStatus(newStatus);
    setLoading(null);
    if (!result.success) {
      console.error(t('bookingDrawer.errorPago'), result.error);
      setError(result.error || t('bookingDrawer.errorPago'));
    }
  };

  const handleCopyPayment = () => {
    const content = qrContent(businessConfig, booking.total_amount);
    navigator.clipboard.writeText(content);
    setCopiedPayment(true);
    setTimeout(() => setCopiedPayment(false), 2000);
  };

  const paymentLabels: Record<PaymentStatus, { label: string; color: string }> = {
    pending: { label: t('bookingDrawer.pendiente'), color: 'text-amber-400 border-amber-700 bg-amber-500/10' },
    deposit: { label: t('bookingDrawer.senia'), color: 'text-sky-400 border-sky-700 bg-sky-500/10' },
    paid: { label: t('bookingDrawer.pagado'), color: 'text-emerald-400 border-emerald-700 bg-emerald-500/10' },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-zinc-900 border-zinc-800 text-white overflow-y-auto">
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-xl font-semibold flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-sky-400" />
            {t('bookingDrawer.habitacion', { room: room.nombre })}
          </SheetTitle>
          <SheetDescription className="text-zinc-400">
            {format(new Date(booking.check_in), "d 'de' MMMM", { locale: es })} -{' '}
            {format(new Date(booking.check_out), "d 'de' MMMM, yyyy", { locale: es })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badge */}
          <div>
            <Badge className={`${status.bgColor} text-sm px-3 py-1`}>
              {status.label}
            </Badge>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Guest Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-300">{t('bookingDrawer.infoHuesped')}</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="text-white">{booking.guest_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-300">{booking.guest_email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-zinc-500" />
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  {booking.guest_phone}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Reservation Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-300">{t('bookingDrawer.detallesReserva')}</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-400">{t('bookingDrawer.estadia')}</span>
                </div>
                <span className="text-white">
                  {nights} noche{nights > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-400">{t('bookingDrawer.huespedes')}</span>
                </div>
                <span className="text-white">
                  {booking.guest_count || 1}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <BedDouble className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-400">{t('bookingDrawer.tipo')}</span>
                </div>
                <span className="text-white capitalize">{room.tipo}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-400">{t('bookingDrawer.precioBase')}</span>
                </div>
                <span className="text-white">
                  ${room.precioPorNoche.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('bookingDrawer.total')}</span>
            <span className="text-2xl font-semibold text-white">
              ${booking.total_amount.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="text-right text-xs text-zinc-500 -mt-4">
            ${room.precioPorNoche.toLocaleString('es-AR')} × {booking.guest_count || 1} pers × {nights} noche{nights > 1 ? 's' : ''}
          </div>

          {/* Payment Status */}
          <Separator className="bg-zinc-800" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300">{t('bookingDrawer.estadoPago')}</h3>
              <div className="flex gap-1.5">
                {(['pending', 'deposit', 'paid'] as PaymentStatus[]).map((ps) => {
                  const pl = paymentLabels[ps];
                  const active = booking.payment_status === ps;
                  return (
                    <button
                      key={ps}
                      onClick={() => handlePaymentStatusChange(ps)}
                      disabled={loading === 'payment'}
                      className={`rounded-md border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${active
                          ? pl.color
                          : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                        }`}
                    >
                      {pl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <Separator className="bg-zinc-800" />
          {hasPaymentData(businessConfig) ? (
            <div className="space-y-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-medium text-emerald-300">
                    {t('bookingDrawer.infoCobro')}
                  </h3>
                </div>
                <button
                  onClick={handleCopyPayment}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  {copiedPayment ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedPayment ? t('bookingDrawer.copiado') : t('bookingDrawer.copiar')}
                </button>
              </div>

              {businessConfig.nombre && (
                <p className="text-sm font-semibold text-white">{businessConfig.nombre}</p>
              )}
              {businessConfig.titular && (
                <p className="text-xs text-zinc-500">{businessConfig.titular}</p>
              )}
              {businessConfig.banco && (
                <p className="text-xs text-zinc-500">{businessConfig.banco}</p>
              )}
              {businessConfig.aliasCbuCvu && (
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {businessConfig.aliasCbuCvu}
                </p>
              )}
              {businessConfig.linkPago && (
                <a
                  href={businessConfig.linkPago}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-sky-400 hover:underline break-all"
                >
                  {businessConfig.linkPago}
                </a>
              )}
              <div className="flex justify-center pt-1">
                <div className="rounded-lg bg-white p-2">
                  <QRCodeSVG
                    value={qrContent(businessConfig, booking.total_amount)}
                    size={130}
                    level="M"
                    includeMargin
                  />
                </div>
              </div>
              <p className="text-center text-[10px] text-zinc-600">
                {t('bookingDrawer.escaneaPagar')}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-center">
              <CreditCard className="mx-auto h-5 w-5 text-zinc-600" />
              <p className="mt-2 text-xs text-zinc-500">
                {t('bookingDrawer.configurarPagos')}
              </p>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <>
              <Separator className="bg-zinc-800" />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-300">{t('bookingDrawer.notas')}</h3>
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <span className="text-zinc-300">{booking.notes}</span>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator className="bg-zinc-800" />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-300">{t('bookingDrawer.acciones')}</h3>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-3">
              {canCheckIn && (
                <Button
                  onClick={handleCheckIn}
                  disabled={loading !== null}
                  className="min-h-[48px] bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all duration-150"
                >
                  {loading === 'checkin' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  {t('bookingDrawer.registrarIngreso')}
                </Button>
              )}
              {canCheckOut && (
                <Button
                  onClick={handleCheckOut}
                  disabled={loading !== null}
                  className="min-h-[48px] bg-zinc-600 text-white hover:bg-zinc-700 active:scale-95 transition-all duration-150"
                >
                  {loading === 'checkout' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  {t('bookingDrawer.registrarSalida')}
                </Button>
              )}
              {(booking.status === 'checked-out' || booking.status === 'cancelled') && (
                <div className="col-span-2 text-center text-sm text-zinc-500 py-2">
                  {t('bookingDrawer.noModificable')}
                </div>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onEdit}
                disabled={loading !== null || !canCancel}
                className="min-h-[48px] border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white active:scale-95 transition-all duration-150"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('bookingDrawer.modificar')}
              </Button>

              {!showCancelConfirm && canCancel && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={loading !== null}
                  className="min-h-[48px] border-rose-700/50 text-rose-400 hover:bg-rose-950/30 active:scale-95 transition-all duration-150"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('bookingDrawer.cancelar')}
                </Button>
              )}

              {showCancelConfirm && (
                <div className="col-span-2 space-y-2">
                  <p className="text-sm text-rose-400 text-center">
                    {t('bookingDrawer.confirmarCancelacion')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={loading !== null}
                      className="min-h-[48px] flex-1 text-zinc-400"
                    >
                      {t('bookingDrawer.no')}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={loading !== null}
                      className="min-h-[48px] flex-1 bg-rose-600 text-white hover:bg-rose-700"
                    >
                      {loading === 'cancel' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {t('bookingDrawer.siCancelar')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
