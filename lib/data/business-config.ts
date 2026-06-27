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

function extractCBU(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 22) return digits;
  return null;
}

export function qrContent(config: BusinessConfig, amount?: number): string {
  if (config.linkPago) {
    const url = config.linkPago.trim();
    if (amount && !url.includes('amount')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}amount=${amount}`;
    }
    return url;
  }

  if (config.aliasCbuCvu) {
    const cbu = extractCBU(config.aliasCbuCvu);
    if (cbu) {
      return `https://debin.com.ar/pagar/${cbu}`;
    }
  }

  return '';
}
