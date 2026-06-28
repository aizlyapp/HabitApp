ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_business_config" ON business_config;
CREATE POLICY "anon_read_business_config" ON business_config FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_business_config" ON business_config;
CREATE POLICY "anon_insert_business_config" ON business_config FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_business_config" ON business_config;
CREATE POLICY "anon_update_business_config" ON business_config FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_business_config" ON business_config;
CREATE POLICY "anon_delete_business_config" ON business_config FOR DELETE TO anon, authenticated USING (true);
