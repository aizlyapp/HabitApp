'use client';

import { useState, useRef, useEffect } from 'react';
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
        <linearGradient id="pt-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8E8E8" />
        </linearGradient>
      </defs>
      <rect width="16" height="12" fill="url(#pt-green)" />
      <polygon points="0,0 16,6 0,12" fill="url(#pt-yellow)" />
      <circle cx="8" cy="6" r="4" fill="url(#pt-blue)" />
      {/* 27 stars in a circle - simplified as dots */}
      <g fill="url(#pt-white)" fill-opacity="0.9">
        <circle cx="8" cy="2.5" r="0.35" />
        <circle cx="9.8" cy="3.2" r="0.35" />
        <circle cx="11.2" cy="4.5" r="0.35" />
        <circle cx="11.8" cy="6" r="0.35" />
        <circle cx="11.2" cy="7.5" r="0.35" />
        <circle cx="9.8" cy="8.8" r="0.35" />
        <circle cx="8" cy="9.5" r="0.35" />
        <circle cx="6.2" cy="8.8" r="0.35" />
        <circle cx="4.8" cy="7.5" r="0.35" />
        <circle cx="4.2" cy="6" r="0.35" />
        <circle cx="4.8" cy="4.5" r="0.35" />
        <circle cx="6.2" cy="3.2" r="0.35" />
      </g>
      <text x="8" y="6.5" text-anchor="middle" fill="url(#pt-white)" font-size="1.1" font-weight="bold" font-family="sans-serif">ORDEM E PROGRESSO</text>
    </svg>
  ),
};

export default function Nav() {
  const { t, toggleLang, lang } = useTranslation();
  const scrolled = useNavScroll();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`l-nav${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#" className="l-logo">Roomy</a>
        <div className="nav-cta">
          <div className="relative" ref={dropdownRef}>
            <button
              className="lang-btn flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label={lang === 'es' ? 'Cambiar a portugués' : 'Mudar para espanhol'}
              aria-expanded={open}
            >
              {flags[lang]}
              <span className="text-xs font-medium text-zinc-300 hidden sm:inline">
                {lang === 'es' ? 'ES' : 'PT'}
              </span>
            </button>
            {open && (
              <div className="absolute right-0 mt-1.5 z-50 flex flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-1 shadow-lg animate-fade-in">
                {(['es', 'pt'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => { toggleLang(); setOpen(false); }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors ${
                      lang === l
                        ? 'bg-sky-600/30 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                    aria-current={lang === l ? 'true' : 'false'}
                  >
                    {flags[l]}
                    <span className="text-xs font-medium capitalize">
                      {l === 'es' ? 'Español' : 'Português'}
                    </span>
                    {lang === l && (
                      <span className="ml-auto text-sky-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="https://app.roomy.com.ar" className="btn btn-primary">
            {t('landing.nav_cta')}
          </a>
        </div>
      </div>
    </nav>
  );
}
