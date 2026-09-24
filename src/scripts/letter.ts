/** The envelope opens, the letter rises out, then each paragraph is "written". */
import { gsap, $, $$, rand, reduceMotion } from './core';
import { burstFrom } from './fx';

export function initLetter() {
  const stage = $('[data-letter]');
  if (!stage) return;
  const paper = $('.paper', stage)!;
  const envs = $$('.env', stage);
  const flap = $('.env--flap', stage)!;
  const seal = $('.seal', stage)!;
  const lines = $$('.paper__greet, .paper__p, .paper__from, .paper__sign', stage);

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

  gsap.from('.memory', {
    y: -120, rotation: () => rand(-25, 25), autoAlpha: 0, duration: 1, stagger: 0.15, ease: 'bounce.out',
    scrollTrigger: { trigger: '.memories', start: 'top 80%', once: true },
  });

  if (reduceMotion) { envs.forEach((e) => e.remove()); seal.remove(); return; }

  // closed state: the paper waits inside the envelope
  const pocket = () => {
    const envBottom = envs[0].offsetTop + envs[0].offsetHeight;
    return Math.max(0, paper.offsetHeight - (envBottom - 20));
  };
  gsap.set(paper, { y: 20, scale: 0.94, clipPath: `inset(0px 0px ${pocket()}px 0px)` });
  gsap.set(lines, { autoAlpha: 0, y: 12 });

  const tl = gsap.timeline({ paused: true });
  tl.to(seal, { rotation: 12, duration: 0.08, yoyo: true, repeat: 5, ease: 'none' })
    .to(seal, { scale: 1.4, duration: 0.18, ease: 'power2.out' })
    .add(() => burstFrom(seal, 'heart', 18, 0.9))
    .to(seal, { scale: 0, autoAlpha: 0, duration: 0.25, ease: 'back.in(2)' })
    .to(flap, { rotationX: 180, duration: 0.6, ease: 'power2.inOut', transformPerspective: 900 }, '-=0.05')
    .set(flap, { zIndex: 0 }, '-=0.3')
    .to(paper, { y: -140, duration: 0.7, ease: 'power2.out' })
    .to(paper, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.01 })
    .to(envs, { y: 260, rotation: 6, autoAlpha: 0, duration: 0.8, ease: 'power3.in' }, '<')
    .to(paper, { y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.3)' }, '-=0.2')
    .to(lines, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.18, ease: 'power2.out' }, '-=0.3')
    .add(() => { envs.forEach((e) => e.remove()); seal.remove(); gsap.set(paper, { clearProps: 'clipPath' }); });

  gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 62%', once: true, onEnter: () => tl.play() } });
  seal.addEventListener('click', () => tl.play());
}
