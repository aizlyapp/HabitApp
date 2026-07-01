-- Migration: Create external reservations and sync configuration for iCal integration
-- This enables multi-channel reservation sync (Airbnb, Booking, VRBO, etc)

-- 1. External Reservations table (stores synced reservations from external channels)
CREATE TABLE IF NOT EXISTS external_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_uid TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Airbnb', 'Booking', 'VRBO', 'Custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  total_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  sync_token TEXT,
  raw_ical_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, external_uid, source)
);

-- 2. Property Sync Configuration table (stores iCal URLs per property)
CREATE TABLE IF NOT EXISTS property_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ical_url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Custom',
  auto_sync BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'pending')),
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, user_id)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_reservations_dates 
  ON external_reservations(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_external_reservations_property 
  ON external_reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_external_reservations_source 
  ON external_reservations(source);
CREATE INDEX IF NOT EXISTS idx_property_sync_config_user 
  ON property_sync_config(user_id);
CREATE INDEX IF NOT EXISTS idx_property_sync_config_auto_sync 
  ON property_sync_config(auto_sync) WHERE auto_sync = true;

-- 4. Enable RLS
ALTER TABLE external_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sync_config ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for external_reservations
DROP POLICY IF EXISTS "anon_read_external_reservations" ON external_reservations;
CREATE POLICY "anon_read_external_reservations" ON external_reservations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_external_reservations" ON external_reservations;
CREATE POLICY "anon_insert_external_reservations" ON external_reservations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_external_reservations" ON external_reservations;
CREATE POLICY "anon_update_external_reservations" ON external_reservations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_external_reservations" ON external_reservations;
CREATE POLICY "anon_delete_external_reservations" ON external_reservations FOR DELETE
  TO anon, authenticated USING (true);

-- 6. RLS Policies for property_sync_config
DROP POLICY IF EXISTS "anon_read_property_sync_config" ON property_sync_config;
CREATE POLICY "anon_read_property_sync_config" ON property_sync_config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_property_sync_config" ON property_sync_config;
CREATE POLICY "anon_insert_property_sync_config" ON property_sync_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_property_sync_config" ON property_sync_config;
CREATE POLICY "anon_update_property_sync_config" ON property_sync_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_property_sync_config" ON property_sync_config;
CREATE POLICY "anon_delete_property_sync_config" ON property_sync_config FOR DELETE
  TO anon, authenticated USING (true);