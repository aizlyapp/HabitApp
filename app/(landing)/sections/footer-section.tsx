'use client';

import { useTranslation } from '@/lib/i18n/context';

export default function FooterSection() {
  const { t } = useTranslation();
  return (
    <footer className="l-footer">
      <div className="l-container">
        <div className="footer-content">
          <div className="footer-logo">Roomy</div>
          <div className="footer-links">
            <span className="footer-copyright">{t('landing.footer_copy')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
