import { createClient } from '@/lib/supabase/client';

export interface BusinessConfig {
  nombre: string;
  titular: string;
  banco: string;
  direccion: string;
  logo: string;
  aliasCbuCvu: string;
  linkPago: string;
}

export const defaultConfig: BusinessConfig = {
  nombre: '',
  titular: '',
  banco: '',
  direccion: '',
  logo: '',
  aliasCbuCvu: '',
  linkPago: '',
};

export async function loadConfigFromDB(userId: string): Promise<BusinessConfig> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('business_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading business config:', error);
    return defaultConfig;
  }

  if (!data) return defaultConfig;

  return {
    nombre: data.nombre || '',
    titular: data.titular || '',
    banco: data.banco || '',
    direccion: data.direccion || '',
    logo: data.logo || '',
    aliasCbuCvu: data.alias_cbu_cvu || '',
    linkPago: data.link_pago || '',
  };
}

export async function saveConfigToDB(userId: string, config: BusinessConfig): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('business_config')
    .upsert({
      user_id: userId,
      nombre: config.nombre,
      titular: config.titular,
      banco: config.banco,
      direccion: config.direccion,
      logo: config.logo,
      alias_cbu_cvu: config.aliasCbuCvu,
      link_pago: config.linkPago,
    }, { onConflict: 'user_id' });

  if (error) throw error;
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
