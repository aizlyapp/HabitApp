'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useCustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || window.innerWidth <= 768) return;

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const hoverable = document.querySelectorAll('a, button, .btn, .sidebar-item, .faq-item');
    const onEnter = () => cursor.classList.add('hover');
    const onLeave = () => cursor.classList.remove('hover');

    hoverable.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    document.addEventListener('mousemove', onMouseMove);

    let rafId: number;
    const animate = () => {
      cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * 0.15;
      cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * 0.15;
      cursor.style.left = `${cursorPos.current.x}px`;
      cursor.style.top = `${cursorPos.current.y}px`;
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
      hoverable.forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  return cursorRef;
}

export function useParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const count = 15;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 20}s`;
      p.style.animationDuration = `${15 + Math.random() * 10}s`;
      container.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  return containerRef;
}

export function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrolled;
}

export function useAnimatedCounter(
  ref: React.RefObject<HTMLSpanElement | null>,
  target: number,
  locale = 'es-AR',
) {
  const animated = useRef(false);

  const animate = useCallback(() => {
    if (animated.current || !ref.current) return;
    animated.current = true;

    const duration = 1500;
    const startTime = performance.now();
    const element = ref.current;

    const update = (currentTime: number) => {
      if (!element) return;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      element.textContent = current.toLocaleString(locale);
      if (progress < 1) requestAnimationFrame(update);
      else element.textContent = target.toLocaleString(locale);
    };

    requestAnimationFrame(update);
  }, [ref, target, locale]);

  return animate;
}

export function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const parent = entry.target.parentElement;
            const siblings = parent ? Array.from(parent.querySelectorAll('.fade-in')) : [entry.target];
            const index = siblings.indexOf(entry.target);
            (entry.target as HTMLElement).style.transitionDelay = `${index * 100}ms`;
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    const els = document.querySelectorAll('.fade-in');
    els.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return null;
}
