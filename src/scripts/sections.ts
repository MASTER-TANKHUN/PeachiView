import { gsap, ScrollTrigger, Draggable, $, $$, rand, clamp, reduceMotion, finePointer, isDesktop } from './core';
import { burstFrom } from './fx';

/* ───────── generic: [data-reveal] + hand-drawn scribbles ───────── */
export function initReveals() {
  if (reduceMotion) return;
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 50, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('section:not(.hero) [data-scribble]').forEach((p) => {
    gsap.from(p, { drawSVG: 0, duration: 1.1, ease: 'power2.inOut', scrollTrigger: { trigger: p, start: 'top 85%', once: true } });
  });
  // hand-drawn wiggle on scribbles
  $$('.scribble').forEach((s) => s.setAttribute('filter', 'url(#boil)'));
}

/* ───────── ribbons: speed & direction follow the scroll ───────── */
export function initMarquee() {
  const ribbons = $$('[data-marquee]');
  if (!ribbons.length || reduceMotion) return;
  const tweens = ribbons.map((r) => {
    const track = $('.ribbon__track', r)!;
    const dir = Number(r.dataset.marquee);
    return { dir, tw: gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 }) };
  });
  let lastDir = 1;
  ScrollTrigger.create({
    trigger: '.ribbons', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity();
      const d = v === 0 ? lastDir : Math.sign(v);
      lastDir = d;
      const boost = clamp(1 + Math.abs(v) / 260, 1, 7);
      tweens.forEach(({ tw }) => {
        gsap.to(tw, { timeScale: boost * d, duration: 0.2, overwrite: true });
        gsap.to(tw, { timeScale: d, duration: 1.2, delay: 0.25, overwrite: false });
      });
    },
  });
  // the ribbons are tucked under the hero's clouds, so they'd already be "on screen" at load; instead they
  // start hidden and swing in over the first scroll, settling as they reach ~65% of the screen
  const box = $('.ribbons')!;
  const swing = {
    start: 0, scrub: 0.8, invalidateOnRefresh: true,
    end: () => Math.max(1, box.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.65),
  };
  gsap.from('.ribbon--pink', { autoAlpha: 0, yPercent: 60, xPercent: -30, rotation: -8, ease: 'power2.out', scrollTrigger: swing });
  gsap.from('.ribbon--white', { autoAlpha: 0, yPercent: 60, xPercent: 30, rotation: 8, ease: 'power2.out', scrollTrigger: swing });
}

/* ───────── about: tilt/flip card, count-up, draggable stickers ───────── */
export function initAbout() {
  const card = $<HTMLButtonElement>('.idcard');
  if (card) {
    card.addEventListener('click', () => {
      const on = card.getAttribute('aria-pressed') === 'true';
      card.setAttribute('aria-pressed', String(!on));
      burstFrom(card, 'spark', 14, 0.7);
    });
    if (finePointer && !reduceMotion) {
      const inner = $('.idcard__inner', card)!;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('is-tilting');
        inner.style.setProperty('--ry', `${nx * 22}deg`);
        inner.style.setProperty('--rx', `${-ny * 18}deg`);
        $$('.idcard__foil', card).forEach((f) => { f.style.setProperty('--fx', `${50 + nx * 80}%`); f.style.setProperty('--fy', `${50 + ny * 80}%`); });
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        inner.style.setProperty('--ry', '0deg');
        inner.style.setProperty('--rx', '0deg');
      });
    }
  }

  // count-up numbers
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const fmt = el.dataset.format === 'k' ? (n: number) => `${(n / 1000).toFixed(1)}K` : (n: number) => Math.round(n).toLocaleString('en-US');
    if (reduceMotion) { el.textContent = fmt(end); return; }
    const o = { n: 0 };
    el.textContent = fmt(0);
    gsap.to(o, {
      n: end, duration: 2.2, ease: 'power3.out',
      onUpdate: () => { el.textContent = fmt(o.n); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // stickers
  const zone = $('[data-stickers]');
  const stickers = $$('.sticker');
  if (!zone || !stickers.length) return;
  if (!reduceMotion) {
    gsap.from(stickers, {
      scale: 0, rotation: () => rand(-180, 180), duration: 0.9, stagger: 0.06, ease: 'back.out(2.5)',
      scrollTrigger: { trigger: '.about__grid', start: 'top 80%', once: true },
    });
    stickers.forEach((s, i) => {
      gsap.to(s, { y: rand(-18, 18), duration: rand(2.5, 4), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.2 });
    });
  }
  let z = 10;
  Draggable.create(stickers, {
    type: 'x,y',
    bounds: '.about',
    inertia: true,
    edgeResistance: 0.7,
    onPress() {
      gsap.killTweensOf(this.target, 'y');
      gsap.to(this.target, { scale: 1.18, rotation: `+=${rand(-10, 10)}`, zIndex: ++z, duration: 0.2 });
    },
    onRelease() {
      gsap.to(this.target, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    },
    onThrowComplete() { burstFrom(this.target as Element, 'spark', 8, 0.4); },
    onClick() { burstFrom(this.target as Element, 'heart', 8, 0.5); },
  });
}

/* ───────── models: horizontal pinned gallery on desktop ───────── */
export function initModels() {
  const section = $('.models');
  if (!section) return;
  const models = $$('.model', section);
  const nodes = $$('.evo__node', section);
  const fill = $('.evo__fill', section);
  const evoPeach = $('.evo__peach', section);
  const setActive = (p: number) => {
    const idx = Math.min(models.length - 1, Math.floor(p * models.length * 0.999));
    nodes.forEach((n, i) => n.classList.toggle('is-on', i <= idx));
    if (fill) gsap.set(fill, { scaleX: p });
    if (evoPeach) gsap.set(evoPeach, { left: `${p * 100}%`, xPercent: -50 * p, rotation: p * 720 });
  };
  setActive(0);

  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, (c) => {
    const { desk, reduce } = c.conditions as Record<string, boolean>;
    if (desk && !reduce) {
      section.classList.add('is-horizontal');
      const track = $('.models__track', section)!;
      const dist = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: section, pin: '.models__pin', start: 'top top', end: () => `+=${dist()}`, scrub: 0.8,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => setActive(self.progress),
        },
      });
      models.forEach((m) => {
        const img = $('.model__img', m), num = $('.model__num', m), info = $('.model__info', m), extra = $('.model__extra', m);
        const st = { trigger: m, containerAnimation: tween, start: 'left 85%', end: 'center center', scrub: true };
        if (img) gsap.fromTo(img, { scale: 0.7, rotation: -8, yPercent: 12 }, { scale: 1, rotation: 0, yPercent: 0, ease: 'power2.out', scrollTrigger: st });
        if (num) gsap.fromTo(num, { xPercent: 60 }, { xPercent: -20, ease: 'none', scrollTrigger: { ...st, end: 'right left' } });
        if (info) gsap.fromTo(info, { y: 80, rotation: 4, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: st });
        if (extra) gsap.fromTo(extra, { xPercent: 60, rotation: 30, autoAlpha: 0 }, { xPercent: 0, rotation: 6, autoAlpha: 1, ease: 'back.out(1.6)', scrollTrigger: st });
      });
      return () => section.classList.remove('is-horizontal');
    }
    if (!reduce) {
      models.forEach((m) => {
        gsap.from($('.model__img', m), { scale: 0.6, rotation: -10, autoAlpha: 0, duration: 1.1, ease: 'elastic.out(1, 0.6)', scrollTrigger: { trigger: m, start: 'top 75%', once: true } });
        gsap.from($('.model__info', m), { y: 60, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: m, start: 'top 60%', once: true } });
        const extra = $('.model__extra', m);
        if (extra) gsap.from(extra, { xPercent: 50, rotation: 25, autoAlpha: 0, duration: 1, ease: 'back.out(1.6)', scrollTrigger: { trigger: m, start: 'top 65%', once: true } });
      });
      ScrollTrigger.create({ trigger: '.models__track', start: 'top center', end: 'bottom center', onUpdate: (s) => setActive(s.progress) });
    }
    return undefined;
  });
}

/* ───────── journey: the vine grows with the scroll, polaroids flutter onto the page ───────── */
// x of the vine at a given y (viewBox units): the path is 80-unit cubic waves (see Journey.astro)
function vineX(y: number) {
  const k = Math.max(0, Math.floor(y / 80));
  const y0 = k * 80, s = k % 2 ? -1 : 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) {
    const t = (lo + hi) / 2;
    const yt = y0 + 3 * (1 - t) ** 2 * t * 22 + 3 * (1 - t) * t * t * 58 + t ** 3 * 80;
    if (yt < y) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return 50 + 30 * s * 3 * t * (1 - t);
}

export function initJourney() {
  const book = $('.journey__book');
  if (!book || reduceMotion) return;
  // The vine is stretched to the book's height (non-uniformly), so DrawSVG can't measure it.
  // A clip that follows the scroll draws it exactly, and a blossom rides the growing tip.
  const path = $('.journey__path', book)!;
  const vine = $('.journey__vinesvg', book)!;
  const tip = $('.journey__tip', book);
  const moveTip = (p: number) => {
    if (!tip) return;
    const w = path.offsetWidth, h = path.offsetHeight;
    const y = Math.min(1000, p * 1000);
    gsap.set(tip, { x: (vineX(y) / 100) * w - tip.offsetWidth / 2, y: p * h - tip.offsetHeight / 2, rotation: p * 900, autoAlpha: p > 0.004 && p < 0.996 ? 1 : 0 });
  };
  gsap.fromTo(vine, { clipPath: 'inset(0px -20px 100% -20px)' }, {
    clipPath: 'inset(0px -20px 0% -20px)', ease: 'none',
    scrollTrigger: { trigger: book, start: 'top 70%', end: 'bottom 70%', scrub: 0.6, onUpdate: (self) => moveTip(self.progress), onRefresh: (self) => moveTip(self.progress) },
  });
  gsap.to('.journey__year', { yPercent: 120, ease: 'none', scrollTrigger: { trigger: book, start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('.entry', book).forEach((e) => {
    const left = e.dataset.side === 'l' || !isDesktop();
    // the wrapper flies in; the polaroid inside keeps its CSS tilt & hover
    const card = $('.entry__cardwrap', e), note = $('.entry__note', e), dot = $('.entry__dot', e);
    const tl = gsap.timeline({ scrollTrigger: { trigger: e, start: 'top 80%', once: true } });
    tl.from(dot, { scale: 0, rotation: -180, duration: 0.6, ease: 'back.out(3)' })
      .from(card, { x: left ? -80 : 80, y: 60, rotation: left ? -18 : 18, autoAlpha: 0, duration: 1, ease: 'back.out(1.4)' }, 0.05)
      .from(note, { x: left ? 40 : -40, autoAlpha: 0, duration: 0.8 }, 0.25);
  });
}
