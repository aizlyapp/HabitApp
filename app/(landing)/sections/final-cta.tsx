'use client';

import { useTranslation } from '@/lib/i18n/context';

export default function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section className="l-final-cta">
      <div className="l-container">
        <h2 className="final-cta-title fade-in">{t('landing.cta_title')}</h2>
        <p className="cta-seo-text fade-in">{t('landing.cta_seo')}</p>
        <a href="https://app.roomy.com.ar" className="btn btn-white btn-large fade-in">
          {t('landing.cta_btn')}
        </a>
      </div>
    </section>
  );
}
