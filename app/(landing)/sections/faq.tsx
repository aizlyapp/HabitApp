'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

const faqItems = [
  { qKey: 'landing.faq_1_q', aKey: 'landing.faq_1_a' },
  { qKey: 'landing.faq_2_q', aKey: 'landing.faq_2_a' },
  { qKey: 'landing.faq_3_q', aKey: 'landing.faq_3_a' },
  { qKey: 'landing.faq_4_q', aKey: 'landing.faq_4_a' },
];

export default function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="l-faq" id="faq">
      <div className="l-container">
        <h2 className="section-title fade-in">{t('landing.faq_title')}</h2>
        <div className="faq-grid">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className={`faq-item fade-in${openIndex === i ? ' open' : ''}`}
              onClick={() => toggle(i)}
            >
              <div className="faq-question">
                <span>{t(item.qKey)}</span>
                <div className="faq-toggle">+</div>
              </div>
              <div className="faq-answer">
                <p>{t(item.aKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
