'use client';

import { useTranslation } from '@/lib/i18n/context';
import { useNavScroll } from './landing-hooks';

const flags = {
  es: (
    <svg viewBox="0 0 16 12" className="w-5 h-5" aria-hidden="true">
      <defs>
        <linearGradient id="es-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#AA151B" />
          <stop offset="100%" stopColor="#8B0E15" />
        </linearGradient>
        <linearGradient id="es-yellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1BF00" />
          <stop offset="100%" stopColor="#D4A800" />
        </linearGradient>
      </defs>
      <rect width="16" height="12" fill="url(#es-red)" />
      <rect y="3" width="16" height="6" fill="url(#es-yellow)" />
      <rect y="9" width="16" height="3" fill="url(#es-red)" />
    </svg>
  ),
  pt: (
    <svg viewBox="0 0 16 12" className="w-5 h-5" aria-hidden="true">
      <defs>
        <linearGradient id="pt-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#009C3B" />
          <stop offset="100%" stopColor="#007A2F" />
        </linearGradient>
        <linearGradient id="pt-yellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFDF00" />
          <stop offset="100%" stopColor="#E6C800" />
        </linearGradient>
        <linearGradient id="pt-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#002776" />
          <stop offset="100%" stopColor="#001F5E" />
        </linearGradient>
      </defs>
      <rect width="16" height="12" fill="url(#pt-green)" />
      <polygon points="0,0 16,6 0,12" fill="url(#pt-yellow)" />
      <circle cx="8" cy="6" r="3.5" fill="url(#pt-blue)" />
      <ellipse cx="8" cy="6" rx="2.2" ry="1.3" fill="url(#pt-yellow)" transform="rotate(-15 8 6)" />
    </svg>
  ),
};

export default function Nav() {
  const { t, toggleLang, lang } = useTranslation();
  const scrolled = useNavScroll();

  return (
    <nav className={`l-nav${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#" className="l-logo">Roomy</a>
        <div className="nav-cta">
          <button
            className="lang-btn flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
            onClick={toggleLang}
            aria-label={lang === 'es' ? 'Cambiar a portugués' : 'Mudar para espanhol'}
          >
            {flags[lang]}
            <span className="text-xs font-medium text-zinc-300 hidden sm:inline">
              {lang === 'es' ? 'ES' : 'PT'}
            </span>
          </button>
          <a href="https://app.roomy.com.ar" className="btn btn-primary">
            {t('landing.nav_cta')}
          </a>
        </div>
      </div>
    </nav>
  );
}
