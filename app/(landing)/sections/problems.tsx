'use client';

import { useTranslation } from '@/lib/i18n/context';

const problems = [
  {
    num: '01',
    borderColor: '#ef4444',
    iconBg: 'rgba(239,68,68,0.1)',
    iconColor: '#ef4444',
    titleKey: 'landing.prob_1_title',
    descKey: 'landing.prob_1_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
    ),
  },
  {
    num: '02',
    borderColor: '#f97316',
    iconBg: 'rgba(249,115,22,0.1)',
    iconColor: '#f97316',
    titleKey: 'landing.prob_2_title',
    descKey: 'landing.prob_2_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
  },
  {
    num: '03',
    borderColor: '#eab308',
    iconBg: 'rgba(234,179,8,0.1)',
    iconColor: '#eab308',
    titleKey: 'landing.prob_3_title',
    descKey: 'landing.prob_3_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
];

export default function Problems() {
  const { t } = useTranslation();
  return (
    <section className="l-problems">
      <div className="l-container">
        <div className="problem-cards">
          {problems.map((p, i) => (
            <div key={i} className="problem-card fade-in" style={{ borderLeftColor: p.borderColor }}>
              <span className="problem-number">{p.num}</span>
              <div className="problem-icon" style={{ background: p.iconBg, color: p.iconColor }}>
                {p.icon}
              </div>
              <h3 className="problem-title">{t(p.titleKey)}</h3>
              <p className="problem-desc">{t(p.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
