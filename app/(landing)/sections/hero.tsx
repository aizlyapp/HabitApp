'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAnimatedCounter } from '../components/landing-hooks';

function CharReveal({ text }: { text: string }) {
  return (
    <span className="char" style={{ animationDelay: '0ms' }}>
      {text}
    </span>
  );
}

export default function Hero() {
  const { t, lang } = useTranslation();
  const kpiOccupancyRef = useRef<HTMLSpanElement>(null);
  const kpiRevenueRef = useRef<HTMLSpanElement>(null);
  const kpiPendingRef = useRef<HTMLSpanElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const animateOccupancy = useAnimatedCounter(kpiOccupancyRef, 73);
  const animateRevenue = useAnimatedCounter(kpiRevenueRef, 2850000);
  const animatePending = useAnimatedCounter(kpiPendingRef, 4);

  const handleMockupVisible = useCallback(() => {
    setTimeout(() => {
      animateOccupancy();
      animateRevenue();
      animatePending();
    }, 300);
  }, [animateOccupancy, animateRevenue, animatePending]);

  useEffect(() => {
    const el = mockupRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) handleMockupVisible();
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleMockupVisible]);

  return (
    <section className="l-hero">
      <div className="hero-gradient" />
      <div className="hero-dots" />
      <div className="particles" id="particles" />

      <div className="l-container hero-content">
        <div className="badge fade-in">
          <span className="badge-dot" />
          <span>{t('landing.hero_badge')}</span>
        </div>
        <h1 className="l-hero-title fade-in" style={{ marginTop: '40px' }}>
          <CharReveal text={t('landing.hero_title')} />
        </h1>
        <p className="hero-subtitle fade-in">
          {t('landing.hero_sub')}
        </p>
        <div className="hero-buttons fade-in">
          <a href="https://app.roomy.com.ar" className="btn btn-primary btn-large">
            {t('landing.hero_cta_1')}
          </a>
        </div>

        <div className="mockup-wrapper fade-in" ref={mockupRef}>
          <div className="mockup">
            <div className="mockup-header">
              <div className="mockup-dot" />
              <div className="mockup-dot" />
              <div className="mockup-dot" />
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="sidebar-item active">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                  <span>{t('landing.mockup_dashboard')}</span>
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <span>{t('landing.mockup_bookings')}</span>
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                  <span>{t('landing.mockup_rooms')}</span>
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  <span>{t('landing.mockup_guests')}</span>
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  <span>{t('landing.mockup_payments')}</span>
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                  <span>{t('landing.mockup_settings')}</span>
                </div>
              </div>
              <div className="mockup-main">
                <div className="mockup-kpis">
                  <div className="kpi-card">
                    <div className="kpi-label">{t('landing.kpi_occupancy')}</div>
                    <div className="kpi-value"><span className="accent" ref={kpiOccupancyRef}>0</span>%</div>
                    <div className="kpi-change positive">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
                      +5% vs ayer
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">{t('landing.kpi_revenue')}</div>
                    <div className="kpi-value">$<span ref={kpiRevenueRef}>0</span><span style={{ fontSize: 14, color: 'var(--text-muted)' }}> {t('landing.kpi_revenue_currency')}</span></div>
                    <div className="kpi-change">
                      <span style={{ color: 'var(--success)' }}>{t('landing.kpi_revenue_collected')}</span><span style={{ color: 'var(--text-muted)' }}> · </span><span style={{ color: 'var(--warning)' }}>{t('landing.kpi_revenue_pending')}</span>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">{t('landing.kpi_pending')}</div>
                    <div className="kpi-value"><span className="warning" ref={kpiPendingRef}>0</span></div>
                    <div className="kpi-change">{t('landing.kpi_pending_change')}</div>
                  </div>
                </div>
                <div className="gantt-calendar">
                  <div className="gantt-header">
                    <span className="gantt-title">{t('landing.gantt_title')}</span>
                    <div className="gantt-legend">
                      <div className="gantt-legend-item"><div className="gantt-legend-dot" style={{ background: '#22c55e' }} /><span>{t('landing.gantt_confirmed')}</span></div>
                      <div className="gantt-legend-item"><div className="gantt-legend-dot" style={{ background: 'var(--accent)' }} /><span>{t('landing.gantt_pending')}</span></div>
                      <div className="gantt-legend-item"><div className="gantt-legend-dot" style={{ background: '#8b5cf6' }} /><span>{t('landing.gantt_checkout')}</span></div>
                    </div>
                  </div>
                  <div className="gantt-grid">
                    {[
                      { room: 'Hab 101 · $25.000', name: 'Martínez', bars: [{ cls: 'confirmed', left: 5, width: 35 }] },
                      { room: 'Hab 102 · $18.000', name: 'Rodríguez', bars: [{ cls: 'pending', left: 20, width: 25 }] },
                      { room: 'Hab 103 · $85.000', name: 'López', bars: [{ cls: 'confirmed', left: 0, width: 45 }] },
                      { room: 'Dorm A · $22.000', name: 'Fernández', bars: [{ cls: 'checkout', left: 10, width: 30 }, { cls: 'pending', left: 55, width: 20 }] },
                      { room: 'Dorm B · $35.000', name: 'Gómez', bars: [{ cls: 'confirmed', left: 15, width: 40 }] },
                    ].map((row, i) => (
                      <div key={i} className="gantt-row">
                        <div className="gantt-room">{row.room} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.name}</span></div>
                        <div className="gantt-bar-container">
                          {row.bars.map((bar, bi) => (
                            <div key={bi} className={`gantt-bar ${bar.cls}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
