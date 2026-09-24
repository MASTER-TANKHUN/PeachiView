import { gsap, Draggable, $, $$, rand, reduceMotion, finePointer, isDesktop } from './core';
import { createField } from './ambient';
import { initPortrait } from './portrait';
import { graphemes } from './split';
import { burstFrom } from './fx';

export function initHero() {
  const hero = $('.hero');
  if (!hero) return { intro: async () => {} };
  const portrait = initPortrait();
  const petals = $<HTMLCanvasElement>('.hero__petals', hero);
  if (petals && !reduceMotion) createField(petals, 'petals', { repel: finePointer, max: isDesktop() ? 40 : 20 });

  const wins = $$('.float-win, .hero__mascot', hero);
  const bubble = $('.bubble', hero);
  const bubbleText = $('.bubble__text', hero);

  if (!reduceMotion) {
    // pointer parallax on decorative layers
    if (finePointer) {
      const layers = $$('[data-depth]', hero).map((el) => ({
        d: Number(el.dataset.depth),
        x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }),
      }));
      const art = $('.hero__art', hero)!;
      const ax = gsap.quickTo(art, 'rotationY', { duration: 1.2, ease: 'power3' });
      const ay = gsap.quickTo(art, 'rotationX', { duration: 1.2, ease: 'power3' });
      gsap.set(art, { transformPerspective: 1400 });
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(nx * 60 * l.d); l.y(ny * 40 * l.d); });
        ax(nx * 6); ay(-ny * 4);
      });
    }

    // scrolling away: the scene drifts apart
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
    gsap.to('.hero__copy', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: st });
    gsap.to('.portrait', { yPercent: 10, ease: 'none', scrollTrigger: st });
    gsap.to('.float-win--video', { x: -80, y: -60, rotation: -8, ease: 'none', scrollTrigger: st });
    gsap.to('.float-win--status', { x: 80, y: -90, rotation: 10, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__clouds .cl--1', { yPercent: -30, xPercent: -8, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__clouds .cl--3', { yPercent: -40, xPercent: 8, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__clouds .cl--2', { yPercent: -18, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__hearts', { yPercent: -30, ease: 'none', scrollTrigger: st });
  }

  const idle = () => {
    wins.forEach((w, i) => {
      gsap.to(w, { y: `+=${rand(8, 14)}`, rotation: rand(-2, 2), duration: rand(2.4, 3.4), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 });
    });
    if (finePointer) {
      Draggable.create($$('.float-win', hero), {
        trigger: $$('.float-win .win__bar', hero),
        bounds: hero,
        inertia: true,
        onPress() { gsap.to(this.target, { scale: 1.05, zIndex: 20, duration: 0.2 }); },
        onRelease() { gsap.to(this.target, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }); },
      });
    }
  };

  const typeBubble = () => {
    if (!bubble || !bubbleText) return;
    const full = bubbleText.textContent ?? '';
    const parts = graphemes(full);
    bubbleText.textContent = '';
    gsap.fromTo(bubble, { autoAlpha: 0, scale: 0.4, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.2)' });
    const o = { n: 0 };
    gsap.to(o, { n: parts.length, duration: parts.length * 0.07, delay: 0.3, ease: 'none', onUpdate: () => { bubbleText.textContent = parts.slice(0, Math.round(o.n)).join(''); } });
  };

  async function intro() {
    if (reduceMotion) {
      gsap.set(bubble, { autoAlpha: 1 });
      return;
    }
    const tl = gsap.timeline();
    tl.from('.hero__holo', { scale: 1.2, opacity: 0, duration: 1.4, ease: 'power2.out' }, 0)
      .from('.logo__ch', {
        yPercent: () => rand(-160, -110), rotation: () => rand(-35, 35), autoAlpha: 0,
        duration: 1, stagger: 0.055, ease: 'back.out(2.4)',
      }, 0.15)
      .from('.hero__status', { y: -20, autoAlpha: 0, duration: 0.6 }, 0.2)
      .from('.hero__welcome', { y: 30, autoAlpha: 0, duration: 0.8 }, 0.6)
      .from('.hero__welcome [data-scribble]', { drawSVG: 0, duration: 0.9, ease: 'power2.inOut' }, 1.1)
      .from('.hero__lead, .hero__cta > *, .hero__chips > *', { y: 26, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, 0.8)
      .from('.hero__halo', { scale: 0.6, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, 0.2)
      .from('.hero__hearts .h', { scale: 0, rotation: () => rand(-90, 90), duration: 0.8, stagger: 0.08, ease: 'back.out(3)' }, 0.5)
      .from('.deco-win', { y: 60, autoAlpha: 0, duration: 1.1, stagger: 0.1 }, 0.3)
      .from('.hero__clouds .cl', { yPercent: 60, duration: 1.4, stagger: 0.08, ease: 'expo.out' }, 0.1)
      .from(wins, { scale: 0.3, autoAlpha: 0, rotation: () => rand(-20, 20), duration: 0.9, stagger: 0.15, ease: 'back.out(1.8)' }, 1.4)
      .from('.hero__scroll', { y: 20, autoAlpha: 0, duration: 0.6 }, 1.8);
    tl.add(idle, '>');
    await gsap.delayedCall(0.25, () => {}).then();
    await portrait.play();
    typeBubble();
    const heroMascot = $('.hero__mascot');
    if (heroMascot) burstFrom(heroMascot, 'heart', 12, 0.7);
  }

  return { intro };
}
