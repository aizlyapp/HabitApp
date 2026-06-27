export interface BusinessConfig {
  nombre: string;
  titular: string;
  banco: string;
  direccion: string;
  logo: string;
  aliasCbuCvu: string;
  linkPago: string;
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

  const raw = config.aliasCbuCvu?.trim();
  if (!raw) return '';

  return raw;
}
