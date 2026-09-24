/** Pull uploads newer than the build from /api/latest.json and slot them into the page. */
import { gsap, $, reduceMotion } from './core';

interface V { id: string; title: string; date: string; kind: string; views: number; length: string; cats: string[]; era: string }

export async function loadLatest(addToLibrary: (v: V[]) => void) {
  const list = $('[data-fresh]');
  let data: { ok: boolean; videos: V[] };
  try {
    const r = await fetch('/api/latest.json', { headers: { accept: 'application/json' } });
    if (!r.ok) return;
    data = await r.json();
  } catch { return; }
  if (!data.ok || !data.videos?.length) return;

  const shown = new Set([...document.querySelectorAll<HTMLElement>('[data-fresh] [data-video]')].map((b) => b.dataset.video));
  const known = new Set((JSON.parse($('#videos-data')?.textContent ?? '[]') as V[]).map((v) => v.id));
  const fresh = data.videos.filter((v) => !known.has(v.id));
  addToLibrary(fresh);
  if (!list) return;
  const scope = [...(list.querySelector('li')?.attributes ?? [])].find((a) => a.name.startsWith('data-astro-cid'))?.name;
  fresh.filter((v) => !shown.has(v.id)).reverse().forEach((v) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button class="fresh__card" type="button" data-video="${v.id}" aria-label="เล่นคลิป ${v.title.replace(/"/g, '&quot;')}">
        <span class="fresh__thumb">
          <img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" width="320" height="180" loading="lazy">
          <span class="fresh__kind">${v.length || 'NEW'}</span>
        </span>
        <span class="fresh__name"></span>
        <span class="fresh__meta">ใหม่ล่าสุด ✦</span>
      </button>`;
    li.querySelector('.fresh__name')!.textContent = v.title;
    if (scope) { li.setAttribute(scope, ''); li.querySelectorAll('*').forEach((c) => c.setAttribute(scope, '')); }
    list.prepend(li);
    if (!reduceMotion) gsap.from(li, { scale: 0.6, autoAlpha: 0, rotation: -8, duration: 0.7, ease: 'back.out(2)' });
  });
}
