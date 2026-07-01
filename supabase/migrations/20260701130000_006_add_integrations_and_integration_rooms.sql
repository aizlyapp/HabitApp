-- Migration: Add global integrations table and integration_rooms mapping
-- Refactors from per-property sync config to a global integrations model

-- 1. Create integrations table (replaces and extends property_sync_config)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ical_url TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Airbnb', 'Booking', 'VRBO', 'Custom')),
  label TEXT NOT NULL DEFAULT '',
  auto_sync BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'pending')),
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create integration_rooms junction table (one integration → many rooms)
CREATE TABLE IF NOT EXISTS integration_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(integration_id, room_id)
);

-- 3. Add integration_id column to external_reservations (optional, for traceability)
ALTER TABLE external_reservations 
  ADD COLUMN IF NOT EXISTS integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_auto_sync ON integrations(auto_sync) WHERE auto_sync = true;
CREATE INDEX IF NOT EXISTS idx_integration_rooms_integration ON integration_rooms(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_rooms_room ON integration_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_external_reservations_integration ON external_reservations(integration_id);

-- 5. Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_rooms ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for integrations
DROP POLICY IF EXISTS "anon_read_integrations" ON integrations;
CREATE POLICY "anon_read_integrations" ON integrations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_integrations" ON integrations;
CREATE POLICY "anon_insert_integrations" ON integrations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_integrations" ON integrations;
CREATE POLICY "anon_update_integrations" ON integrations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_integrations" ON integrations;
CREATE POLICY "anon_delete_integrations" ON integrations FOR DELETE
  TO anon, authenticated USING (true);

-- 7. RLS Policies for integration_rooms
DROP POLICY IF EXISTS "anon_read_integration_rooms" ON integration_rooms;
CREATE POLICY "anon_read_integration_rooms" ON integration_rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_integration_rooms" ON integration_rooms;
CREATE POLICY "anon_insert_integration_rooms" ON integration_rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_integration_rooms" ON integration_rooms;
CREATE POLICY "anon_delete_integration_rooms" ON integration_rooms FOR DELETE
  TO anon, authenticated USING (true);