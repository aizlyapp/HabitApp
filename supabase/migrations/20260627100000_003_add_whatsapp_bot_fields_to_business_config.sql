/*
# Add WhatsApp chatbot fields and RLS policies to business_config

1. New Columns
- `whatsapp_api_token`: Token de acceso a la API de WhatsApp
- `whatsapp_phone_id`: ID del número de teléfono en WhatsApp Business
- `whatsapp_verify_token`: Token de verificación del webhook
- `bot_enabled`: Si el chatbot está activado
- `bot_personality`: Personalidad/configuración del bot

2. RLS Policies
- Enable RLS on business_config
- Allow anon + authenticated full CRUD (matching rooms/reservations pattern)
*/

ALTER TABLE business_config 
ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_verify_token TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_personality TEXT DEFAULT 'Sos un asistente amable y profesional del hostel. Respondés en español, de forma clara y concisa.';

-- Enable RLS (idempotent)
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_config (single-tenant, public access for hotel staff)
DROP POLICY IF EXISTS "anon_read_business_config" ON business_config;
CREATE POLICY "anon_read_business_config" ON business_config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_business_config" ON business_config;
CREATE POLICY "anon_insert_business_config" ON business_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_business_config" ON business_config;
CREATE POLICY "anon_update_business_config" ON business_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_business_config" ON business_config;
CREATE POLICY "anon_delete_business_config" ON business_config FOR DELETE
  TO anon, authenticated USING (true);
