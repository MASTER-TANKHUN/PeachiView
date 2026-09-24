import { gsap, $, $$, reduceMotion } from './core';
import { onProgress, portraitAssets } from './assets';

const messages = ['กำลังปลุกพีชชี่…', 'ใส่หูฟังหูแมว…', 'เก็บลูกพีช 1,702 ลูก…', 'ปัดฝุ่นช่อง YouTube…', 'พร้อมแล้ว!'];

/** "PeachiOS" boot screen. Resolves when the loader has irised out. */
export function runLoader(): Promise<void> {
  const root = $('#loader');
  if (!root) return Promise.resolve();
  const finish = () => { root.remove(); };
  if (reduceMotion) {
    return Promise.race([portraitAssets.then(() => undefined), new Promise<void>((r) => setTimeout(r, 1200))]).then(finish);
  }

  const quick = sessionStorage.getItem('peachi-booted') === '1';
  sessionStorage.setItem('peachi-booted', '1');
  const blocks = $$('.loader__bar i', root);
  const pct = $('.loader__pct', root)!;
  const text = $('.loader__text', root)!;
  const sketch = $$('.loader__sketch > *', root);
  const mascot = $('.loader__mascot', root)!;
  const shown = { p: 0 };
  let target = 0;
  onProgress((p) => { target = p; });

  return new Promise<void>((resolve) => {
    let closed = false;
    const tl = gsap.timeline();
    tl.from('.loader__brand, .loader__bar, .loader__msg', { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, 0)
      .from(sketch, { drawSVG: 0, duration: quick ? 0.4 : 0.9, stagger: 0.06, ease: 'power2.inOut' }, 0.1)
      .from(mascot, { scale: 0.3, autoAlpha: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)', transformOrigin: '50% 80%' }, quick ? 0.45 : 0.95)
      .to(sketch, { autoAlpha: 0, duration: 0.3 }, quick ? 0.6 : 1.15);

    const minTime = quick ? 0.9 : 2.3;
    const start = performance.now();
    const update = () => {
      shown.p += (Math.min(target, 1) - shown.p) * 0.12;
      const elapsed = (performance.now() - start) / 1000;
      const visual = Math.min(shown.p, elapsed / minTime);
      const on = Math.round(visual * blocks.length);
      blocks.forEach((b, i) => b.classList.toggle('on', i < on));
      pct.textContent = `${Math.round(visual * 100)}%`;
      text.textContent = messages[Math.min(messages.length - 1, Math.floor(visual * (messages.length - 1) + 0.001))];
      if (visual >= 0.995) close();
    };
    gsap.ticker.add(update);

    const close = () => {
      if (closed) return;
      closed = true;
      gsap.ticker.remove(update);
      const r = mascot.getBoundingClientRect();
      const cx = ((r.left + r.width / 2) / window.innerWidth) * 100;
      const cy = ((r.top + r.height / 2) / window.innerHeight) * 100;
      gsap.timeline({ onComplete: () => { finish(); resolve(); } })
        .to(mascot, { y: -26, scaleY: 1.1, scaleX: 0.92, duration: 0.25, ease: 'power2.out', transformOrigin: '50% 100%' })
        .to(mascot, { y: 0, scaleY: 0.85, scaleX: 1.12, duration: 0.18, ease: 'power2.in' })
        .to(mascot, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' })
        .fromTo(root, { clipPath: `circle(150% at ${cx}% ${cy}%)` }, { clipPath: `circle(0% at ${cx}% ${cy}%)`, duration: 0.9, ease: 'power4.inOut' }, '-=0.15');
    };
    $('.loader__skip', root)?.addEventListener('click', () => { target = 1; shown.p = 1; close(); });
    // never hang on a slow network
    window.setTimeout(() => { target = 1; }, 7000);
  });
}
