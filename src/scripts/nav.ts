/** Taskbar: reveal, active section, Bangkok clock, scroll progress (a peach rides the bar). */
import { gsap, ScrollTrigger, $, $$, reduceMotion } from './core';
import { scrollToTarget } from './smooth';
import { burstFrom } from './fx';

export function initNav() {
  const bar = $('.taskbar');
  if (!bar) return;
  gsap.to(bar, { y: 0, duration: reduceMotion ? 0 : 0.9, ease: 'back.out(1.6)', clearProps: 'transform' });

  const links = $$<HTMLAnchorElement>('[data-nav]', bar);
  links.forEach((a) => {
    const sec = document.getElementById(a.dataset.nav!);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) links.forEach((l) => l.classList.toggle('is-active', l === a)); },
    });
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

  const top = $('[data-totop]');
  top?.addEventListener('click', () => {
    burstFrom(top, 'heart', 12, 0.7);
    if (!reduceMotion) gsap.to($('svg', top), { rotation: '-=720', y: -30, duration: 1.2, ease: 'power2.inOut', yoyo: true, repeat: 1 });
    scrollToTarget(0);
  });
}
