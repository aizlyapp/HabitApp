'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, User, Users } from 'lucide-react';
import type { Room, Reservation, Guest } from '@/lib/data/types';

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
  guests: Guest[];
  selectedRoom?: Room;
  selectedDate?: Date;
  editingBooking?: Reservation | null;
  onSubmit: (booking: {
    room_id: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    guest_count: number;
    check_in: string;
    check_out: string;
    total_amount: number;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; data?: Reservation }>;
}

const PRICE_PER_PERSON_KEY = 'habitapp_price_per_person';

function getSavedPricePerPerson(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem(PRICE_PER_PERSON_KEY);
  return saved ? Number(saved) : 0;
}

function savePricePerPerson(price: number) {
  localStorage.setItem(PRICE_PER_PERSON_KEY, String(price));
}

export function BookingModal({
  open,
  onOpenChange,
  rooms,
  guests,
  selectedRoom,
  selectedDate,
  editingBooking,
  onSubmit,
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    room_id: selectedRoom?.id || '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    price_per_person: getSavedPricePerPerson(),
    guest_count: 1,
    check_in: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    check_out: selectedDate
      ? format(new Date(selectedDate.getTime() + 86400000), 'yyyy-MM-dd')
      : '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = formData.price_per_person * formData.guest_count;

  useEffect(() => {
    if (open) {
      if (editingBooking) {
        const gc = editingBooking.guest_count || 1;
        const ppp = gc > 0 ? Math.round(editingBooking.total_amount / gc) : editingBooking.total_amount;
        setFormData({
          room_id: editingBooking.room_id,
          guest_name: editingBooking.guest_name,
          guest_email: editingBooking.guest_email,
          guest_phone: editingBooking.guest_phone,
          price_per_person: ppp,
          guest_count: gc,
          check_in: editingBooking.check_in,
          check_out: editingBooking.check_out,
          notes: editingBooking.notes || '',
        });
      } else {
        const saved = getSavedPricePerPerson();
        setFormData({
          room_id: selectedRoom?.id || '',
          guest_name: '',
          guest_email: '',
          guest_phone: '+54 ',
          price_per_person: saved,
          guest_count: 1,
          check_in: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
          check_out: selectedDate
            ? format(new Date(selectedDate.getTime() + 86400000), 'yyyy-MM-dd')
            : '',
          notes: '',
        });
      }
      setError(null);
    }
  }, [open, editingBooking, selectedRoom, selectedDate]);

  const selectedRoomData = rooms.find((r) => r.id === formData.room_id);

  const [nameSuggestions, setNameSuggestions] = useState<Guest[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        nameRef.current &&
        !nameRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (value: string) => {
    setFormData((f) => ({ ...f, guest_name: value }));
    if (value.trim().length > 0) {
      const lower = value.toLowerCase();
      const matches = guests.filter(
        (g) =>
          g.nombre.toLowerCase().includes(lower) ||
          g.email.toLowerCase().includes(lower) ||
          g.telefono.includes(value)
      );
      setNameSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (guest: Guest) => {
    setFormData((f) => ({
      ...f,
      guest_name: guest.nombre,
      guest_email: guest.email,
      guest_phone: guest.telefono,
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.room_id) {
      setError('Seleccioná una habitación');
      return;
    }
    if (!formData.guest_name.trim()) {
      setError('El nombre del huésped es obligatorio');
      return;
    }
    if (!formData.check_in || !formData.check_out) {
      setError('Las fechas de entrada y salida son obligatorias');
      return;
    }
    if (formData.check_out <= formData.check_in) {
      setError('La fecha de salida debe ser posterior a la de entrada');
      return;
    }

    setLoading(true);

    const result = await onSubmit({
      room_id: formData.room_id,
      guest_name: formData.guest_name.trim(),
      guest_email: formData.guest_email.trim(),
      guest_phone: formData.guest_phone.trim(),
      guest_count: formData.guest_count,
      check_in: formData.check_in,
      check_out: formData.check_out,
      total_amount: totalAmount,
      notes: formData.notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      setFormData({
        room_id: '',
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        price_per_person: getSavedPricePerPerson(),
        guest_count: 1,
        check_in: '',
        check_out: '',
        notes: '',
      });
    } else {
      setError(result.error || 'Error al crear la reserva');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingBooking ? 'Modificar Reserva' : 'Nueva Reserva'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="room" className="text-zinc-300">
              Habitación
            </Label>
            <Select
              value={formData.room_id}
              onValueChange={(value) =>
                setFormData({ ...formData, room_id: value })
              }
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Seleccionar habitación" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {rooms.map((room) => (
                  <SelectItem
                    key={room.id}
                    value={room.id}
                    className="text-white hover:bg-zinc-700"
                  >
                    {room.nombre} - {room.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn" className="text-zinc-300">
                Entrada
              </Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.check_in}
                onChange={(e) =>
                  setFormData({ ...formData, check_in: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut" className="text-zinc-300">
                Salida
              </Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.check_out}
                onChange={(e) =>
                  setFormData({ ...formData, check_out: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerPerson" className="text-zinc-300">
                Precio por persona
              </Label>
              <Input
                id="pricePerPerson"
                type="number"
                value={formData.price_per_person || ''}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setFormData({ ...formData, price_per_person: val });
                  savePricePerPerson(val);
                }}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount" className="text-zinc-300">
                Cantidad de personas
              </Label>
              <Input
                id="guestCount"
                type="number"
                min={1}
                max={selectedRoomData?.capacidad || 20}
                value={formData.guest_count}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setFormData({ ...formData, guest_count: val });
                }}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                {formData.guest_count} persona{formData.guest_count !== 1 ? 's' : ''} × ${formData.price_per_person.toLocaleString('es-AR')}
              </span>
              <span className="text-xl font-semibold text-white">
                ${totalAmount.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestName" className="text-zinc-300">
              Huésped
            </Label>
            <div className="relative">
              <Input
                ref={nameRef}
                id="guestName"
                value={formData.guest_name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => {
                  if (nameSuggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Nombre del huésped"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl max-h-48 overflow-y-auto"
                >
                  {nameSuggestions.map((guest) => (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => selectSuggestion(guest)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-white hover:bg-zinc-700 border-b border-zinc-700/50 last:border-0"
                    >
                      <User className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                      <div className="flex flex-col">
                        <span>{guest.nombre}</span>
                        <span className="text-xs text-zinc-500">
                          {[guest.email, guest.telefono].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestEmail" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="guestEmail"
                type="text"
                value={formData.guest_email}
                onChange={(e) =>
                  setFormData({ ...formData, guest_email: e.target.value })
                }
                placeholder="juan@email.com"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestPhone" className="text-zinc-300">
                Teléfono
              </Label>
              <Input
                id="guestPhone"
                value={formData.guest_phone}
                onChange={(e) =>
                  setFormData({ ...formData, guest_phone: e.target.value })
                }
                placeholder="+54 11 1234-5678"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-zinc-300">
              Notas (opcional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Peticiones especiales..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-600 text-white hover:bg-sky-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingBooking ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                editingBooking ? 'Guardar Cambios' : 'Crear Reserva'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
