import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, Draggable, InertiaPlugin, Flip);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

// Every visit starts at the top — the story is told by scrolling. ScrollTrigger remembers the
// scrollRestoration value it saw when it registered ("auto") and writes it back after each refresh,
// so it has to be told "manual" itself; otherwise a reload lands mid-page before anything is measured.
ScrollTrigger.clearScrollMemory('manual');
if (location.hash) history.replaceState(null, '', location.pathname + location.search);

export { gsap, ScrollTrigger, Draggable, Flip };

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** device pixel ratio, capped so big canvases stay cheap */
export const dpr = (cap = 2) => Math.min(window.devicePixelRatio || 1, cap);

/** run a callback only while an element is on screen (used to pause canvas loops) */
export function whileVisible(el: Element, onChange: (visible: boolean) => void, rootMargin = '100px') {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => onChange(e.isIntersecting)), { rootMargin });
  io.observe(el);
  return io;
}

export function toast(text: string, ms = 2400) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = text;
  el.classList.add('is-on');
  window.clearTimeout(Number(el.dataset.timer));
  el.dataset.timer = String(window.setTimeout(() => el.classList.remove('is-on'), ms));
}
