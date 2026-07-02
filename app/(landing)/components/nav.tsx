'use client';

import { useTranslation } from '@/lib/i18n/context';
import { useNavScroll } from './landing-hooks';
import { useThemeToggle } from '@/components/theme-provider';

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
        <linearGradient id="pt-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8E8E8" />
        </linearGradient>
      </defs>
      <rect width="16" height="12" fill="url(#pt-green)" />
      <polygon points="0,6 8,0 16,6 8,12" fill="url(#pt-yellow)" />
      <circle cx="8" cy="6" r="3.8" fill="url(#pt-blue)" />
      <g fill="url(#pt-white)" fill-opacity="0.95">
        <circle cx="8" cy="2.6" r="0.4" />
        <circle cx="9.7" cy="3.3" r="0.4" />
        <circle cx="11.1" cy="4.6" r="0.4" />
        <circle cx="11.8" cy="6" r="0.4" />
        <circle cx="11.1" cy="7.4" r="0.4" />
        <circle cx="9.7" cy="8.7" r="0.4" />
        <circle cx="8" cy="9.4" r="0.4" />
        <circle cx="6.3" cy="8.7" r="0.4" />
        <circle cx="4.9" cy="7.4" r="0.4" />
        <circle cx="4.2" cy="6" r="0.4" />
        <circle cx="4.9" cy="4.6" r="0.4" />
        <circle cx="6.3" cy="3.3" r="0.4" />
      </g>
    </svg>
  ),
};

export default function Nav() {
  const { t, toggleLang, lang } = useTranslation();
  const { theme, toggleTheme } = useThemeToggle();
  const scrolled = useNavScroll();

  return (
    <nav className={`l-nav${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="nav-container">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border transition-colors sm:hidden"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
            }}
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <a href="#" className="l-logo">Roomy</a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
            }}
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-1">
            {(['es', 'pt'] as const).map((l) => (
              <button
                key={l}
                onClick={() => toggleLang()}
                className={`nav-lang-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                  lang === l
                    ? 'nav-lang-btn-active border-sky-500/50 bg-sky-500/10 text-white'
                    : 'border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600'
                }`}
                aria-current={lang === l ? 'true' : 'false'}
                aria-label={l === 'es' ? 'Español' : 'Português'}
              >
                {flags[l]}
                <span className="text-xs font-medium capitalize hidden sm:inline">
                  {l === 'es' ? 'ES' : 'PT'}
                </span>
                {lang === l && (
                  <span className="sky-400 ml-0.5">✓</span>
                )}
              </button>
            ))}
          </div>
          <a href="https://app.roomy.com.ar" className="btn btn-primary">
            {t('landing.nav_cta')}
          </a>
        </div>
      </div>
    </nav>
  );
}
