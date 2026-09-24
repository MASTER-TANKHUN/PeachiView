/** The envelope opens, the letter slides out, then each paragraph is "written". */
import { gsap, $, $$, rand, reduceMotion } from './core';
import { burstFrom } from './fx';

export function initLetter() {
  const stage = $('[data-letter]');
  if (!stage) return;
  const paper = $('.paper', stage)!;
  const envs = $$('.env', stage);
  const back = $('.env--back', stage)!;
  const flap = $('.env--flap', stage)!;
  const seal = $('.seal', stage)!;
  const lines = $$('.paper__greet, .paper__p, .paper__from, .paper__sign', stage);
  const extras = $$('.paper__tape, .paper__peach', stage);

  // hearts button (count kept in this browser only)
  const btn = $('[data-hearts]');
  const count = $('[data-hearts-count]');
  const read = () => { try { return Number(localStorage.getItem('peachi-hearts') ?? 0); } catch { return 0; } };
  const write = (n: number) => { try { localStorage.setItem('peachi-hearts', String(n)); } catch { /* private mode */ } };
  const show = (n: number) => { if (count) count.textContent = n ? `ส่งหัวใจไปแล้ว ${n.toLocaleString('en-US')} ดวง ♡` : ''; };
  show(read());
  btn?.addEventListener('click', () => {
    const n = read() + 1;
    write(n); show(n);
    burstFrom(btn, 'heart', 22, 1.1);
    const peach = $('.paper__peach svg');
    if (peach && !reduceMotion) gsap.fromTo(peach, { y: 0 }, { y: -26, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });
  });

  // the wrappers drop in; the polaroids inside keep their CSS tilt & hover
  gsap.from('.memory-wrap', {
    y: -120, rotation: () => rand(-25, 25), autoAlpha: 0, duration: 1, stagger: 0.15, ease: 'bounce.out',
    scrollTrigger: { trigger: '.memories', start: 'top 80%', once: true },
  });

  if (reduceMotion) { envs.forEach((e) => e.remove()); seal.remove(); return; }

  // The paper lives in the page flow (it sets the section's height); while it's "inside" the
  // envelope it is clipped at the envelope's bottom edge, so nothing ever pokes out.
  //   y      – paper offset (starts just inside the envelope's top edge)
  //   drop   – how far the envelope has fallen away
  //   unroll – 0: clipped at the envelope's bottom · 1: the whole letter is visible
  const s = { y: 16, drop: 0, unroll: 0 };
  const render = () => {
    // (14px of margin: the paper is tilted a little, so a bottom corner would otherwise peek out)
    const visible = back.offsetHeight + s.drop - s.y - 14;
    const hidden = Math.max(0, (paper.offsetHeight - visible) * (1 - s.unroll));
    gsap.set(paper, { y: s.y, clipPath: `inset(-90px -90px ${hidden}px -90px)` });
  };
  render();
  gsap.set(lines, { autoAlpha: 0, y: 12 });
  gsap.set(extras, { autoAlpha: 0, scale: 0.4 });

  const tl = gsap.timeline({ paused: true });
  tl.to(seal, { rotation: 12, duration: 0.08, yoyo: true, repeat: 5, ease: 'none' })
    .to(seal, { scale: 1.4, duration: 0.18, ease: 'power2.out' })
    .add(() => burstFrom(seal, 'heart', 18, 0.9))
    .to(seal, { scale: 0, autoAlpha: 0, duration: 0.25, ease: 'back.in(2)' })
    // the flap flips open backwards and tucks behind the letter halfway through
    .to(flap, { rotationX: 180, duration: 0.6, ease: 'power2.inOut', transformPerspective: 900 }, '-=0.05')
    .set(flap, { zIndex: 1 }, '-=0.3')
    // the letter slides up out of the envelope
    .to(s, { y: -125, duration: 0.75, ease: 'power2.out', onUpdate: render })
    .to(extras, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2.4)' }, '-=0.2')
    // the envelope falls away while the letter unrolls to full length and settles
    .to(s, { drop: 280, duration: 0.8, ease: 'power3.in', onUpdate: render }, '-=0.1')
    .to(envs, { y: 280, autoAlpha: 0, rotation: 5, duration: 0.8, ease: 'power3.in' }, '<')
    .to(s, { unroll: 1, duration: 0.9, ease: 'power2.inOut', onUpdate: render }, '<0.15')
    .to(s, { y: 0, duration: 0.9, ease: 'back.out(1.3)', onUpdate: render }, '<')
    .to(lines, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.18, ease: 'power2.out' }, '-=0.3')
    .add(() => { envs.forEach((e) => e.remove()); seal.remove(); gsap.set(paper, { clearProps: 'clipPath' }); });

  gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 62%', once: true, onEnter: () => tl.play() } });
  seal.addEventListener('click', () => tl.play());
}
