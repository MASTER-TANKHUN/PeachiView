import Lenis from 'lenis';
import { gsap, ScrollTrigger, reduceMotion } from './core';

let lenis: Lenis | null = null;

export function initSmooth() {
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // the only in-page link left is the keyboard skip link; glide there without touching the URL
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href')!;
    const target = id === '#top' ? 0 : document.querySelector<HTMLElement>(id);
    if (target === null) return;
    e.preventDefault();
    scrollToTarget(target);
  });
}

export function scrollToTarget(target: number | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
  } else {
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

/** jump to the very top instantly (also while Lenis is stopped) */
export function resetScroll() {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();
