export function validateDateRange(checkIn: Date, checkOut: Date): string | null {
  if (checkOut <= checkIn) {
    return 'La fecha de salida debe ser posterior a la de entrada';
  }
  return null;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const from = new Date(checkIn);
  const to = new Date(checkOut);
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

export function calculateTotal(pricePerNight: number, nights: number): number {
  return nights * pricePerNight;
}

export function parseDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
