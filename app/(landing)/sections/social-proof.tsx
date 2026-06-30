'use client';

import { useTranslation } from '@/lib/i18n/context';

export default function SocialProof() {
  const { t } = useTranslation();
  return (
    <section className="l-social-proof">
      <div className="l-container">
        <p className="proof-text fade-in">{t('landing.social_proof_text')}</p>
      </div>
    </section>
  );
}
