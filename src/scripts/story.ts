import { gsap, ScrollTrigger, $, $$, rand, reduceMotion, isDesktop } from './core';
import { createField, type Field } from './ambient';
import { burstFrom, burst } from './fx';
import { splitChars } from './split';

/* ───────── 1,702 days: pinned night scene scrubbed by scroll ───────── */
export function initWait() {
  const section = $('.wait');
  if (!section) return;
  const num = $('.wait__num', section)!;
  const total = Number(num.dataset.days);
  const sleeper = $<SVGElement>('.sleeper .peach', section);
  const snowCanvas = $<HTMLCanvasElement>('.wait__snow', section);
  let snow: Field | null = null;
  if (snowCanvas && !reduceMotion) snow = createField(snowCanvas, 'snow', { max: isDesktop() ? 170 : 90 });

  if (reduceMotion) {
    section.classList.add('is-night');
    gsap.set('.wait__night, .wait__stars, .wait__moon', { opacity: 1, y: 0 });
    gsap.set('.msg, .snowcard, .wait__alert', { autoAlpha: 1 });
    gsap.set($$('.calendar__page', section).slice(1), { autoAlpha: 0 }); // show 2026
    if (sleeper) sleeper.dataset.mood = 'wow';
    return;
  }

  num.textContent = '0';
  const pages = $$('.calendar__page', section).reverse(); // top page first (2022)
  const msgs = $$('.msg', section);
  const counter = { d: 0 };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section, pin: '.wait__pin', start: 'top top', end: () => `+=${window.innerHeight * (isDesktop() ? 2.8 : 2.2)}`, scrub: 0.7,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        section.classList.toggle('is-night', p > 0.06);
        snow?.setIntensity(0.15 + Math.min(1, p * 1.3) * 0.85);
        if (sleeper) sleeper.dataset.mood = p > 0.9 ? 'wow' : 'sleep';
      },
    },
  });
  tl.to('.wait__night', { opacity: 1, duration: 0.12 }, 0)
    .to('.wait__stars', { opacity: 1, duration: 0.15 }, 0.05)
    .to('.wait__moon', { opacity: 1, y: 0, duration: 0.2 }, 0.05)
    .to(counter, { d: total, duration: 0.8, ease: 'power1.inOut', onUpdate: () => { num.textContent = Math.round(counter.d).toLocaleString('en-US'); } }, 0.05);
  pages.slice(0, -1).forEach((pg, i) => {
    tl.to(pg, { rotationX: -95, y: 260, rotation: rand(-25, 25), opacity: 0, duration: 0.1, ease: 'power2.in' }, 0.18 + i * 0.16);
  });
  msgs.forEach((m, i) => {
    tl.fromTo(m, { autoAlpha: 0, scale: 0.5, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.05, ease: 'back.out(2)' }, 0.12 + i * 0.09);
  });
  tl.fromTo('.snowcard', { autoAlpha: 0, y: 80, rotation: -12 }, { autoAlpha: 1, y: 0, rotation: -3, duration: 0.08, ease: 'back.out(1.6)' }, 0.3)
    .to(msgs, { autoAlpha: 0.35, duration: 0.06, stagger: 0.01 }, 0.86)
    .fromTo('.wait__alert', { autoAlpha: 0, scale: 0.3, rotation: -10 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.08, ease: 'back.out(2.2)' }, 0.88)
    .to({}, { duration: 0.06 });
}

/* ───────── comeback: MISSING tape peels off, FOUND! stamp slams down ───────── */
export function initComeback() {
  const section = $('.comeback');
  if (!section) return;
  const title = $('[data-split]', section);
  const poster = $('[data-poster]', section);
  const tape = $('.poster__tape', section);
  const found = $('.found', section);
  if (reduceMotion) { gsap.set(found, { autoAlpha: 1 }); gsap.set(tape, { autoAlpha: 0 }); return; }

  const chars = title ? splitChars(title, 'cb-ch') : [];
  gsap.set(chars, { yPercent: 110, rotation: 12, autoAlpha: 0 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: poster ?? section, start: 'top 55%', once: true } });
  tl.from(poster, { y: 80, rotation: -12, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.4)' })
    .to(tape, { rotation: -32, x: '110%', y: '-60%', autoAlpha: 0, duration: 0.9, ease: 'power3.in' }, '+=0.35')
    .fromTo(found, { scale: 3.2, autoAlpha: 0, rotation: -40 }, { scale: 1, autoAlpha: 1, rotation: -14, duration: 0.35, ease: 'power4.in' }, '-=0.1')
    .add(() => {
      if (found) burstFrom(found, 'confetti', 70, 1.6);
      burst(window.innerWidth * 0.5, window.innerHeight * 0.3, 'heart', 20, 1.2);
    })
    .to(poster, { x: 6, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' })
    .to(chars, { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 0.7, stagger: 0.035, ease: 'back.out(2.4)' }, '-=0.2')
    .from('.comeback__quote', { y: 40, autoAlpha: 0, rotation: 4, duration: 0.7 }, '-=0.4')
    .from('.tv', { y: 70, autoAlpha: 0, rotation: -6, duration: 0.9, ease: 'back.out(1.5)' }, '-=0.5');

  // playful wave on hover
  title?.addEventListener('pointerenter', () => {
    gsap.to(chars, { y: -14, duration: 0.25, stagger: { each: 0.03, yoyo: true, repeat: 1 }, ease: 'sine.inOut' });
  });
  gsap.to('.tv', { y: -8, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });

  gsap.from('.fresh__list > li', {
    y: 60, autoAlpha: 0, rotation: () => rand(-8, 8), duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)',
    scrollTrigger: { trigger: '.fresh', start: 'top 80%', once: true },
  });
  ScrollTrigger.create({ trigger: section, start: 'top 60%', once: true, onEnter: () => gsap.from('.comeback__rays', { scale: 0.2, opacity: 0, duration: 2, ease: 'expo.out' }) });
}
