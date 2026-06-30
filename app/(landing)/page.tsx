'use client';

import { useEffect } from 'react';
import './landing.css';
import { useCustomCursor, useParticles, useScrollReveal } from './components/landing-hooks';
import Nav from './components/nav';
import Hero from './sections/hero';
import Problems from './sections/problems';
import Features from './sections/features';
import Pricing from './sections/pricing';
import Steps from './sections/steps';
import FAQ from './sections/faq';
import FinalCTA from './sections/final-cta';
import Contact from './sections/contact';
import FooterSection from './sections/footer-section';
import ChatWidget from './components/chat-widget';

export default function LandingPage() {
  const cursorRef = useCustomCursor();
  const particlesRef = useParticles();
  useScrollReveal();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div className="landing-page">
      <div className="custom-cursor" ref={cursorRef} />
      <Nav />
      <Hero />
      <Problems />
      <Features />
      <Pricing />
      <Steps />
      <FAQ />
      <FinalCTA />
      <Contact />
      <FooterSection />
      <ChatWidget />
    </div>
  );
}
