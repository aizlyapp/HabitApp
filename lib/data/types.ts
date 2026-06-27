export type CleaningStatus = 'clean' | 'dirty' | 'in-progress';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type ReservationStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
export type PaymentStatus = 'pending' | 'deposit' | 'paid';

export type RoomType = 'Habitación' | 'Departamento' | 'Cabaña' | 'Suite' | 'Dormitorio';

export interface Room {
  id: string;
  nombre: string;
  tipo: RoomType;
  precioPorNoche: number;
  capacidad: number;
  permiteMascotas: boolean;
  esPrivada: boolean;
  status: RoomStatus;
  cleaning_status: CleaningStatus;
  created_at: string;
}

export interface Reservation {
  id: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: ReservationStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface ReservationInsert {
  id?: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_amount?: number;
  status?: ReservationStatus;
  payment_status?: PaymentStatus;
  notes?: string | null;
  created_at?: string;
}

export interface ReservationUpdate {
  id?: string;
  room_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in?: string;
  check_out?: string;
  total_amount?: number;
  status?: ReservationStatus;
  payment_status?: PaymentStatus;
  notes?: string | null;
  created_at?: string;
}

export interface Guest {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflict?: Reservation;
}

export interface MutationResult {
  success: boolean;
  error?: string;
}
