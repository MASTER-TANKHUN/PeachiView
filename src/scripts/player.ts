/** Any [data-video] element opens the shared "player.exe" dialog with a privacy-friendly embed. */
import { gsap, $, reduceMotion } from './core';
import { stopScroll, startScroll } from './smooth';
import { pauseMusic } from './music';

interface Meta { title: string; date: string; views: number }
const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const thaiDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${thaiMonths[m - 1]} ${y}`; };

export function initPlayer() {
  const dlg = $<HTMLDialogElement>('[data-player]');
  if (!dlg) return;
  const screen = $('[data-player-screen]', dlg)!;
  const title = $('[data-player-title]', dlg)!;
  const meta = $('[data-player-meta]', dlg)!;
  const link = $<HTMLAnchorElement>('[data-player-link]', dlg)!;
  const byId = new Map<string, Meta>();
  try {
    (JSON.parse($('#videos-data')?.textContent ?? '[]') as (Meta & { id: string })[]).forEach((v) => byId.set(v.id, v));
  } catch { /* data is optional */ }

  const open = (id: string, fallbackTitle: string) => {
    pauseMusic();
    const m = byId.get(id);
    title.textContent = m?.title ?? fallbackTitle ?? 'player.exe';
    meta.textContent = m ? `${thaiDate(m.date)} · ${m.views.toLocaleString('en-US')} วิว · ช่อง PeachiView` : 'ช่อง PeachiView';
    link.href = `https://www.youtube.com/watch?v=${id}`;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.title = title.textContent ?? 'YouTube video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    screen.replaceChildren(f);
    dlg.showModal();
    stopScroll();
    if (!reduceMotion) gsap.fromTo('.player__win', { scale: 0.8, y: 40, rotation: -3, autoAlpha: 0 }, { scale: 1, y: 0, rotation: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.6)' });
  };
  const close = () => dlg.close();

  dlg.addEventListener('close', () => { screen.replaceChildren(); startScroll(); });
  $('[data-player-close]', dlg)?.addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });

  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLElement>('[data-video]');
    if (!trigger || (e.target as Element).closest('.sticker')) return;
    e.preventDefault();
    open(trigger.dataset.video!, trigger.getAttribute('aria-label')?.replace(/^เล่นคลิป\s*/, '') ?? '');
  });
}
