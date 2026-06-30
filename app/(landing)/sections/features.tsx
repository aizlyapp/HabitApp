'use client';

import { useTranslation } from '@/lib/i18n/context';

const features = [
  {
    titleKey: 'landing.feat_1_title',
    descKey: 'landing.feat_1_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ),
  },
  {
    titleKey: 'landing.feat_2_title',
    descKey: 'landing.feat_2_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
    ),
  },
  {
    titleKey: 'landing.feat_3_title',
    descKey: 'landing.feat_3_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    titleKey: 'landing.feat_4_title',
    descKey: 'landing.feat_4_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    ),
  },
];

export default function Features() {
  const { t } = useTranslation();
  return (
    <section className="l-solution" id="features">
      <div className="l-container">
        <h2 className="section-title fade-in">{t('landing.features_title')}</h2>
<p className="features-seo-text fade-in">
           {t('landing.features_seo')}
         </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card fade-in">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-content">
                <h3 className="feature-title">{t(f.titleKey)}</h3>
                <p className="feature-desc">{t(f.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
