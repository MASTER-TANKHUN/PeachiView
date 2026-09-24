import Lenis from 'lenis';
import { gsap, ScrollTrigger, reduceMotion } from './core';

let lenis: Lenis | null = null;

export function initSmooth() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // in-page anchors go through Lenis so they glide
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href')!;
    const target = id === '#top' ? 0 : document.querySelector<HTMLElement>(id);
    if (target === null) return;
    e.preventDefault();
    scrollToTarget(target);
    if (typeof target !== 'number') history.replaceState(null, '', id);
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

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();
