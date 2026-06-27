export interface BusinessConfig {
  nombre: string;
  titular: string;
  banco: string;
  direccion: string;
  logo: string;
  aliasCbuCvu: string;
  linkPago: string;
}

const STORAGE_KEY = 'habitapp_business_config';

export const defaultConfig: BusinessConfig = {
  nombre: '',
  titular: '',
  banco: '',
  direccion: '',
  logo: '',
  aliasCbuCvu: '',
  linkPago: '',
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
  const parts: string[] = [];
  if (config.nombre) parts.push(config.nombre);
  if (config.titular) parts.push(`Titular: ${config.titular}`);
  if (config.banco) parts.push(`Banco: ${config.banco}`);
  if (config.aliasCbuCvu) parts.push(config.aliasCbuCvu);
  if (amount) parts.push(`Monto: $${amount.toLocaleString('es-AR')}`);
  if (config.linkPago) {
    if (amount) {
      parts.push(`${config.linkPago}${config.linkPago.includes('?') ? '&' : '?'}amount=${amount}`);
    } else {
      parts.push(config.linkPago);
    }
  }
  return parts.join('\n');
}
