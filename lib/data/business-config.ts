export interface BusinessConfig {
  nombre: string;
  titular: string;
  banco: string;
  direccion: string;
  logo: string;
  aliasCbuCvu: string;
  linkPago: string;
  whatsappApiToken: string;
  whatsappPhoneId: string;
  whatsappVerifyToken: string;
  botEnabled: boolean;
  botPersonality: string;
}

const STORAGE_KEY = 'roomy_business_config';

export const defaultConfig: BusinessConfig = {
  nombre: '',
  titular: '',
  banco: '',
  direccion: '',
  logo: '',
  aliasCbuCvu: '',
  linkPago: '',
  whatsappApiToken: '',
  whatsappPhoneId: '',
  whatsappVerifyToken: '',
  botEnabled: false,
  botPersonality: 'Sos un asistente amable y profesional del hostel. Respondés en español, de forma clara y concisa.',
};

export function loadConfig(): BusinessConfig {
  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) } as BusinessConfig;
  } catch {
    return defaultConfig;
  }
}

export function saveConfig(config: BusinessConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function hasPaymentData(config: BusinessConfig): boolean {
  return !!(config.aliasCbuCvu || config.linkPago);
}

export function qrContent(config: BusinessConfig, amount?: number): string {
  const link = config.linkPago?.trim();
  if (link) {
    if (amount) {
      const sep = link.includes('?') ? '&' : '?';
      return link.includes('amount') ? link : `${link}${sep}amount=${amount}`;
    }
    return link;
  }

  return '';
}

export async function loadConfigFromDB(userId: string): Promise<Partial<BusinessConfig>> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('business_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return {};

  return {
    nombre: data.nombre || '',
    whatsappApiToken: data.whatsapp_api_token || '',
    whatsappPhoneId: data.whatsapp_phone_id || '',
    whatsappVerifyToken: data.whatsapp_verify_token || '',
    botEnabled: data.bot_enabled || false,
    botPersonality: data.bot_personality || defaultConfig.botPersonality,
    aliasCbuCvu: data.alias_cbu_cvu || '',
    linkPago: data.link_pago || '',
    direccion: data.direccion || '',
  };
}

export async function saveConfigToDB(userId: string, config: Partial<BusinessConfig>): Promise<void> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();
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
