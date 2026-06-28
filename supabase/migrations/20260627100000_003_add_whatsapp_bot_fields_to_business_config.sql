/*
# Add WhatsApp chatbot fields to business_config

1. New Columns
- `whatsapp_api_token`: Token de acceso a la API de WhatsApp
- `whatsapp_phone_id`: ID del número de teléfono en WhatsApp Business
- `whatsapp_verify_token`: Token de verificación del webhook
- `bot_enabled`: Si el chatbot está activado
- `bot_personality`: Personalidad/configuración del bot
*/

ALTER TABLE business_config 
ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_verify_token TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_personality TEXT DEFAULT 'Sos un asistente amable y profesional del hostel. Respondés en español, de forma clara y concisa.';
