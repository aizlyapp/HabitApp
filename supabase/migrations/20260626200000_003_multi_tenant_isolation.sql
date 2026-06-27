/*
# Multi-tenant isolation for PMS

Adds user_id to rooms, reservations, and creates guests table
with proper RLS policies for per-user data isolation.

1. Changes
- Add user_id column to rooms (references auth.users)
- Add user_id column to reservations (references auth.users)
- Create guests table with user_id
- Drop old single-tenant RLS policies
- Create new per-user RLS policies
- Remove hardcoded seed data (no user association)

2. Security
- All tables have RLS enabled with user_id = auth.uid() policy
- Users can only see, create, update, and delete their own data
- Indexes on user_id columns for performance
*/

-- Add user_id to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);

-- Add user_id to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_user_id ON guests(user_id);

-- Drop old permissive RLS policies on rooms
DROP POLICY IF EXISTS "anon_read_rooms" ON rooms;
DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;

-- Drop old permissive RLS policies on reservations
DROP POLICY IF EXISTS "anon_read_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_insert_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_update_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_delete_reservations" ON reservations;

-- Create per-user RLS policies for rooms
CREATE POLICY "users_read_own_rooms" ON rooms FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_rooms" ON rooms FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_rooms" ON rooms FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_rooms" ON rooms FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Create per-user RLS policies for reservations
CREATE POLICY "users_read_own_reservations" ON reservations FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_reservations" ON reservations FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_reservations" ON reservations FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_reservations" ON reservations FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Enable RLS on guests and create policies
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_guests" ON guests FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_guests" ON guests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_guests" ON guests FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_guests" ON guests FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Remove hardcoded seed data with no user_id so new users see an empty app
DELETE FROM reservations WHERE user_id IS NULL;
DELETE FROM rooms WHERE user_id IS NULL;
