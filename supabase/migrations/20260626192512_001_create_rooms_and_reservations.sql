/*
# Create rooms and reservations tables for PMS

1. New Tables
- `rooms`: Hotel room inventory with status, type, capacity, and pricing
  - id (uuid, primary key)
  - name (text, room number/name, unique)
  - type (text: single, double, suite, dorm)
  - floor (integer)
  - capacity (integer, max guests)
  - status (text: available, occupied, maintenance)
  - price_per_night (numeric)
  - created_at (timestamp)

- `reservations`: Booking records with guest info and dates
  - id (uuid, primary key)
  - room_id (uuid, foreign key to rooms)
  - guest_name (text)
  - guest_email (text)
  - guest_phone (text)
  - check_in (date)
  - check_out (date)
  - total_amount (numeric)
  - status (text: confirmed, checked-in, checked-out, cancelled)
  - notes (text, optional)
  - created_at (timestamp)

2. Security
- Enable RLS on both tables
- Allow anon + authenticated full CRUD (single-tenant, shared hotel staff access)
- This is intentionally public data within the hotel operation

3. Indexes
- Index on reservations.room_id for quick lookups
- Index on reservations.check_in, check_out for date range queries
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'double',
  floor integer NOT NULL DEFAULT 1,
  capacity integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'available',
  price_per_night numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('available', 'occupied', 'maintenance')),
  CONSTRAINT valid_type CHECK (type IN ('single', 'double', 'suite', 'dorm'))
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_reservation_status CHECK (status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled')),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (single-tenant, public access for hotel staff)
DROP POLICY IF EXISTS "anon_read_rooms" ON rooms;
CREATE POLICY "anon_read_rooms" ON rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms" ON rooms FOR DELETE
  TO anon, authenticated USING (true);

-- RLS Policies for reservations (single-tenant, public access for hotel staff)
DROP POLICY IF EXISTS "anon_read_reservations" ON reservations;
CREATE POLICY "anon_read_reservations" ON reservations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reservations" ON reservations;
CREATE POLICY "anon_insert_reservations" ON reservations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reservations" ON reservations;
CREATE POLICY "anon_update_reservations" ON reservations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reservations" ON reservations;
CREATE POLICY "anon_delete_reservations" ON reservations FOR DELETE
  TO anon, authenticated USING (true);

-- Insert seed data for rooms
INSERT INTO rooms (name, type, floor, capacity, status, price_per_night) VALUES
  ('101', 'single', 1, 1, 'available', 4500),
  ('102', 'double', 1, 2, 'occupied', 6500),
  ('103', 'double', 1, 2, 'available', 6500),
  ('201', 'suite', 2, 4, 'occupied', 12000),
  ('202', 'double', 2, 2, 'maintenance', 6500),
  ('203', 'single', 2, 1, 'available', 4500),
  ('Dorm A', 'dorm', 1, 8, 'occupied', 1800),
  ('Dorm B', 'dorm', 1, 6, 'available', 1800)
ON CONFLICT (name) DO NOTHING;

-- Insert seed data for reservations
INSERT INTO reservations (room_id, guest_name, guest_email, guest_phone, check_in, check_out, total_amount, status, notes) VALUES
  ((SELECT id FROM rooms WHERE name = '102'), 'María García', 'maria@email.com', '+54 11 1234-5678', '2026-06-26', '2026-06-29', 19500, 'checked-in', NULL),
  ((SELECT id FROM rooms WHERE name = '201'), 'Carlos López', 'carlos@email.com', '+54 11 9876-5432', '2026-06-25', '2026-06-28', 36000, 'checked-in', 'Solicita vista al jardín'),
  ((SELECT id FROM rooms WHERE name = 'Dorm A'), 'Ana Martínez', 'ana@email.com', '+54 11 5555-4444', '2026-06-24', '2026-06-27', 5400, 'checked-in', 'Cama inferior'),
  ((SELECT id FROM rooms WHERE name = '101'), 'Pedro Sánchez', 'pedro@email.com', '+54 11 3333-2222', '2026-06-27', '2026-06-30', 13500, 'confirmed', NULL),
  ((SELECT id FROM rooms WHERE name = '103'), 'Lucía Fernández', 'lucia@email.com', '+54 11 4444-1111', '2026-06-28', '2026-07-01', 19500, 'confirmed', 'Check-in tardío');
