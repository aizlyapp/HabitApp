'use client';

import { useTranslation } from '@/lib/i18n/context';
import { useNavScroll } from './landing-hooks';

export default function Nav() {
  const { t, toggleLang, lang } = useTranslation();
  const scrolled = useNavScroll();

  return (
    <nav className={`l-nav${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#" className="l-logo">Roomy</a>
        <div className="nav-cta">
          <button className="lang-btn" onClick={toggleLang} aria-label="Trocar idioma">
            {lang === 'es' ? 'PT' : 'ES'}
          </button>
          <a href="https://app.roomy.com.ar" className="btn btn-primary">
            {t('landing.nav_cta')}
          </a>
        </div>
      </div>
    </nav>
  );
}
