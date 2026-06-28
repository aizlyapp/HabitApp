import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessConfig } from './business-config';

export async function loadConfigFromDB(
  userId: string,
  supabase: SupabaseClient
): Promise<Partial<BusinessConfig>> {
  const { data, error } = await supabase
    .from('business_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return {};

  return {
    nombre: data.nombre || '',
    titular: data.titular || '',
    banco: data.banco || '',
    logo: data.logo || '',
    whatsappApiToken: data.whatsapp_api_token || '',
    whatsappPhoneId: data.whatsapp_phone_id || '',
    whatsappVerifyToken: data.whatsapp_verify_token || '',
    botEnabled: data.bot_enabled || false,
    botPersonality: data.bot_personality || '',
    aliasCbuCvu: data.alias_cbu_cvu || '',
    linkPago: data.link_pago || '',
    direccion: data.direccion || '',
  };
}

export async function saveConfigToDB(
  userId: string,
  config: Partial<BusinessConfig>,
  supabase: SupabaseClient
): Promise<void> {
  const dbData: Record<string, unknown> = {};

  if ('whatsappApiToken' in config) dbData.whatsapp_api_token = config.whatsappApiToken;
  if ('whatsappPhoneId' in config) dbData.whatsapp_phone_id = config.whatsappPhoneId;
  if ('whatsappVerifyToken' in config) dbData.whatsapp_verify_token = config.whatsappVerifyToken;
  if ('botEnabled' in config) dbData.bot_enabled = config.botEnabled;
  if ('botPersonality' in config) dbData.bot_personality = config.botPersonality;
  if ('aliasCbuCvu' in config) dbData.alias_cbu_cvu = config.aliasCbuCvu;
  if ('linkPago' in config) dbData.link_pago = config.linkPago;
  if ('direccion' in config) dbData.direccion = config.direccion;
  if ('nombre' in config) dbData.nombre = config.nombre;
  if ('titular' in config) dbData.titular = config.titular;
  if ('banco' in config) dbData.banco = config.banco;
  if ('logo' in config) dbData.logo = config.logo;

  const { data: existing } = await supabase
    .from('business_config')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase
      .from('business_config')
      .update(dbData)
      .eq('user_id', userId);
  } else {
    await supabase
      .from('business_config')
      .insert({ ...dbData, user_id: userId });
  }
}
