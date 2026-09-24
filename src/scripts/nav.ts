/**
 * PeachiOS taskbar: shows which part of the story you're in (it doesn't jump — the page is meant to be
 * scrolled), a Bangkok clock and a scroll progress bar with a peach riding it.
 */
import { gsap, ScrollTrigger, $, $$, reduceMotion, toast, pick } from './core';
import { scrollToTarget } from './smooth';
import { burstFrom } from './fx';

const startLines = ['PeachiOS 3.0 ✦ เลื่อนลงไปเรื่อยๆ นะ ♡', 'ยังไม่มีเมนูหรอก เลื่อนดูเองน้า 🍑', 'start แล้ว! ลุยต่อเลย~'];

export function initNav() {
  const bar = $('.taskbar');
  if (bar) gsap.set(bar, { yPercent: 160, autoAlpha: 0 });

  const items = $$('[data-nav]', bar ?? document);
  items.forEach((li) => {
    const sec = document.getElementById(li.dataset.nav!);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) items.forEach((l) => l.classList.toggle('is-active', l === li)); },
    });
  });

  const start = $('[data-start]', bar ?? document);
  start?.addEventListener('click', () => {
    burstFrom(start, 'heart', 10, 0.6);
    toast(pick(startLines));
  });

  const clock = $('[data-clock]');
  const tick = () => {
    if (clock) clock.textContent = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date());
  };
  tick();
  window.setInterval(tick, 20_000);

  const prog = $('.progress__bar');
  const peach = $('.progress__peach');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      if (prog) gsap.set(prog, { scaleX: self.progress });
      if (peach) gsap.set(peach, { x: self.progress * (window.innerWidth - 20), rotation: self.progress * 1440 });
    },
  });

  // the footer's "back to top" peach
  const top = $('[data-totop]');
  top?.addEventListener('click', () => {
    burstFrom(top, 'heart', 12, 0.7);
    if (!reduceMotion) gsap.to($('svg', top), { rotation: '-=720', y: -30, duration: 1.2, ease: 'power2.inOut', yoyo: true, repeat: 1 });
    scrollToTarget(0);
  });

  return {
    reveal: () => { if (bar) gsap.to(bar, { yPercent: 0, autoAlpha: 1, duration: reduceMotion ? 0 : 0.9, ease: 'back.out(1.6)' }); },
  };
}
