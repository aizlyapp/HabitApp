'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAnimatedCounter } from '../components/landing-hooks';

export default function Pricing() {
  const { t, lang } = useTranslation();
  const valueRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const locale = lang === 'pt' ? 'pt-BR' : 'es-AR';
  const target = lang === 'pt' ? 299 : 75000;

  const animateValue = useAnimatedCounter(valueRef, target, locale);

  const handleVisible = useCallback(() => {
    setTimeout(() => animateValue(), 300);
  }, [animateValue]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) handleVisible();
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleVisible]);

  const features = [
    'landing.pricing_feat_1',
    'landing.pricing_feat_2',
    'landing.pricing_feat_3',
    'landing.pricing_feat_4',
    'landing.pricing_feat_5',
    'landing.pricing_feat_6',
  ];

  return (
    <section className="l-pricing" id="pricing">
      <div className="l-container">
        <h2 className="section-title fade-in">{t('landing.pricing_title')}</h2>
        <div className="pricing-card fade-in" ref={cardRef}>
          <div className="pricing-content">
            <span className="pricing-badge">{t('landing.pricing_badge')}</span>
            <h3 className="pricing-name">Roomy Pro</h3>
            <div className="pricing-amount">
              <span className="pricing-currency">{t('landing.pricing_currency')}</span>
              <span className="pricing-value" ref={valueRef}>0</span>
              <span className="pricing-period">{t('landing.pricing_period')}</span>
            </div>
            <p className="pricing-note">{t('landing.pricing_note')}</p>
            <p className="pricing-mp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
              <span>{t('landing.pricing_mp')}</span>
            </p>
            <ul className="pricing-features">
              {features.map((key, i) => (
                <li key={i} className="pricing-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <a href="https://app.roomy.com.ar" className="btn btn-primary btn-large pricing-cta">
              {t('landing.pricing_cta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
