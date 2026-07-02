'use client';

export default function TrustBadges() {
  return (
    <section className="trust-badges">
      <div className="l-container">
        <div className="trust-badges-inner">
          <span className="trust-badges-label">Tecnología de confianza</span>
          <div className="trust-badges-row">
            <div className="trust-badge-item">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <span>Supabase</span>
            </div>
            <div className="trust-badge-item">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M21 9H3" />
                <path d="M9 21V9" />
              </svg>
              <span>Mercado Pago</span>
            </div>
            <div className="trust-badge-item">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />
              </svg>
              <span>Paddle</span>
            </div>
            <div className="trust-badge-item">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>WhatsApp API</span>
            </div>
            <div className="trust-badge-item">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>SSL Seguro</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
