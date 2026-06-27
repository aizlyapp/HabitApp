import { supabase } from '@/lib/supabase';
import type {
  Room,
  Reservation,
  ReservationInsert,
  ReservationUpdate,
  AvailabilityResult,
  Guest,
  RoomType,
  RoomStatus,
  CleaningStatus,
} from '@/lib/data/types';
import { toDateString } from '@/lib/data/validators';

const DB_ROOM_COLUMNS = 'id, name, type, floor, capacity, status, cleaning_status, price_per_night, created_at';

function mapDbRoomToDomain(dbRoom: any): Room {
  return {
    id: dbRoom.id,
    nombre: dbRoom.name,
    tipo: (dbRoom.type as RoomType) || 'Habitación',
    precioPorNoche: dbRoom.price_per_night,
    capacidad: dbRoom.capacity,
    permiteMascotas: false,
    esPrivada: true,
    status: (dbRoom.status as RoomStatus) || 'available',
    cleaning_status: (dbRoom.cleaning_status as CleaningStatus) || 'clean',
    created_at: dbRoom.created_at,
  };
}

function mapDomainRoomToDb(room: Partial<Room>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if ('nombre' in room) db.name = room.nombre;
  if ('tipo' in room) db.type = room.tipo;
  if ('precioPorNoche' in room) db.price_per_night = room.precioPorNoche;
  if ('capacidad' in room) db.capacity = room.capacidad;
  if ('status' in room) db.status = room.status;
  if ('cleaning_status' in room) db.cleaning_status = room.cleaning_status;
  return db;
}

function mapReservation(data: any): Reservation {
  return {
    ...data,
    payment_status: data.payment_status || 'pending',
  } as Reservation;
}

export async function fetchAllRooms(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select(DB_ROOM_COLUMNS)
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return (data || []).map(mapDbRoomToDomain);
}

export async function fetchAllReservations(userId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', userId)
    .order('check_in');

  if (error) throw error;
  return (data || []).map(mapReservation);
}

export async function checkRoomAvailability(
  userId: string,
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string
): Promise<AvailabilityResult> {
  const checkInStr = toDateString(checkIn);
  const checkOutStr = toDateString(checkOut);

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .neq('status', 'cancelled')
    .lt('check_in', checkOutStr)
    .gt('check_out', checkInStr);

  if (error) {
    console.error('Error checking availability:', error);
    return { available: false };
  }

  const conflicting = data?.find(
    (r: any) => r.id !== excludeReservationId
  );

  return {
    available: !conflicting,
    conflict: conflicting ? mapReservation(conflicting) : undefined,
  };
}

export async function createReservation(
  userId: string,
  reservation: ReservationInsert
): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...reservation, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return mapReservation(data);
}

export async function updateReservation(
  userId: string,
  id: string,
  updates: ReservationUpdate
): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteReservation(
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateRoom(
  userId: string,
  id: string,
  updates: Partial<Room>
): Promise<void> {
  const dbUpdates = mapDomainRoomToDb(updates);
  const { error } = await supabase
    .from('rooms')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function insertRoom(
  userId: string,
  room: Partial<Room>
): Promise<void> {
  const dbData = mapDomainRoomToDb(room);
  const { error } = await supabase
    .from('rooms')
    .insert({ ...dbData, user_id: userId })
    .select('id');

  if (error) throw error;
}

export async function removeRoom(
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

function mapDbGuestToDomain(dbGuest: any): Guest {
  return {
    id: dbGuest.id,
    nombre: dbGuest.name,
    email: dbGuest.email || '',
    telefono: dbGuest.phone || '',
    fechaRegistro: dbGuest.created_at || '',
  };
}

function mapDomainGuestToDb(guest: Partial<Guest>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if ('nombre' in guest) db.name = guest.nombre;
  if ('email' in guest) db.email = guest.email;
  if ('telefono' in guest) db.phone = guest.telefono;
  return db;
}

export async function fetchAllGuests(userId: string): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return (data || []).map(mapDbGuestToDomain);
}

export async function insertGuest(
  userId: string,
  guest: Omit<Guest, 'id' | 'fechaRegistro'>
): Promise<Guest> {
  const dbData = mapDomainGuestToDb(guest);
  const { data, error } = await supabase
    .from('guests')
    .insert({ ...dbData, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return mapDbGuestToDomain(data);
}

export async function updateCleaningStatus(
  userId: string,
  roomId: string,
  cleaningStatus: string
): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ cleaning_status: cleaningStatus })
    .eq('id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
}
