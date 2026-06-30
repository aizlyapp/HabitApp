'use client';

import { useTranslation } from '@/lib/i18n/context';

const steps = [
  { num: '1', titleKey: 'landing.step_1_title', descKey: 'landing.step_1_desc' },
  { num: '2', titleKey: 'landing.step_2_title', descKey: 'landing.step_2_desc' },
  { num: '3', titleKey: 'landing.step_3_title', descKey: 'landing.step_3_desc' },
];

export default function Steps() {
  const { t } = useTranslation();
  return (
    <section className="l-steps">
      <div className="l-container">
        <h2 className="section-title fade-in">{t('landing.steps_title')}</h2>
        <div className="steps-grid fade-in">
          {steps.map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{s.num}</div>
              <h3 className="step-title">{t(s.titleKey)}</h3>
              <p className="step-desc">{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
