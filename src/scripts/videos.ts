/** Video library: filter chips, search, "load more", animated with GSAP Flip. */
import { gsap, Flip, ScrollTrigger, $, $$, reduceMotion } from './core';

interface V { id: string; title: string; date: string; kind: string; views: number; length: string; cats: string[]; era: string }
const PAGE = 12;
const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const thaiDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${thaiMonths[m - 1]} ${y}`; };
const stamp = (iso: string) => { const [y, m, d] = iso.split('-'); return `'${y.slice(2)} ${m} ${d}`; };
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 1e5 ? 0 : 1)}K` : `${n}`);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const badge = (v: V) => (v.kind === 'live' ? 'LIVE' : v.kind === 'short' ? 'SHORTS' : v.length);
const rots = [-2, 1.5, -1, 2, -1.5, 1];

function card(v: V, i: number) {
  const li = document.createElement('li');
  li.className = 'vcard';
  li.dataset.id = v.id;
  li.style.setProperty('--r', `${rots[i % rots.length]}deg`);
  const t = `https://i.ytimg.com/vi/${v.id}`;
  li.innerHTML = `
    <button class="vcard__btn" type="button" data-video="${v.id}" aria-label="เล่นคลิป ${esc(v.title)}">
      <span class="vcard__img">
        <img src="${t}/mqdefault.jpg" srcset="${t}/mqdefault.jpg 320w, ${t}/sddefault.jpg 640w" sizes="(max-width: 600px) 92vw, (max-width: 1100px) 45vw, 300px" alt="" width="320" height="180" loading="lazy" decoding="async">
        <span class="vcard__len">${esc(badge(v))}</span>
        <span class="stamp">${stamp(v.date)}</span>
      </span>
      <span class="vcard__title">${esc(v.title)}</span>
      <span class="vcard__meta">
        <span><svg aria-hidden="true"><use href="#i-eye"></use></svg> ${compact(v.views)}</span>
        <span>${thaiDate(v.date)}</span>
        <span class="era era--${v.era}">${v.era}</span>
      </span>
    </button>`;
  return li;
}

export function initVideos() {
  const grid = $('[data-grid]');
  const dataEl = $('#videos-data');
  if (!grid || !dataEl) return { addLatest: (_: V[]) => {} };
  let all = JSON.parse(dataEl.textContent ?? '[]') as V[];
  const chips = $$<HTMLButtonElement>('.vchip');
  const search = $<HTMLInputElement>('[data-search]');
  const more = $<HTMLButtonElement>('[data-more]');
  const status = $('[data-status]');
  // the grid's scoped styles live on Astro's class; copy it to cards we create
  const scope = [...(grid.querySelector('.vcard')?.attributes ?? [])].find((a) => a.name.startsWith('data-astro-cid'))?.name;
  let filter = 'all', query = '', shown = PAGE;

  const list = () => {
    let l = all.filter((v) => (filter === 'all' || filter === 'popular' ? true : v.cats.includes(filter)));
    if (query) l = l.filter((v) => v.title.toLowerCase().includes(query));
    return filter === 'popular' ? [...l].sort((a, b) => b.views - a.views) : [...l].sort((a, b) => b.date.localeCompare(a.date));
  };
  const scopeTree = (el: Element) => { if (!scope) return; el.setAttribute(scope, ''); el.querySelectorAll('*').forEach((c) => c.setAttribute(scope, '')); };

  const render = (animate: boolean) => {
    const items = list();
    const visible = items.slice(0, shown);
    const existing = new Map($$<HTMLElement>('.vcard', grid).map((el) => [el.dataset.id!, el]));
    const state = animate && !reduceMotion ? Flip.getState($$('.vcard', grid)) : null;
    const next = visible.map((v, i) => {
      const el = existing.get(v.id) ?? card(v, i);
      if (!existing.has(v.id)) scopeTree(el);
      return el;
    });
    grid.replaceChildren(...next);
    if (status) status.textContent = items.length ? `แสดง ${visible.length} จาก ${items.length} คลิป` : 'ไม่เจอคลิปที่ค้นหาเลย ลองคำอื่นดูนะ 🍑';
    if (more) more.parentElement!.hidden = visible.length >= items.length;
    if (state) {
      Flip.from(state, {
        duration: 0.6, ease: 'power2.inOut', absolute: true, scale: true, nested: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.7, rotation: () => gsap.utils.random(-12, 12) }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.03 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.7, duration: 0.3 }),
      });
    }
    ScrollTrigger.refresh();
  };

  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    filter = c.dataset.filter ?? 'all';
    shown = PAGE;
    render(true);
  }));
  let timer = 0;
  search?.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { query = search.value.trim().toLowerCase(); shown = PAGE; render(true); }, 180);
  });
  more?.addEventListener('click', () => { shown += PAGE; render(true); });

  if (!reduceMotion) {
    ScrollTrigger.batch($$('.vcard', grid), {
      start: 'top 92%', once: true,
      onEnter: (batch) => gsap.from(batch, { y: 60, autoAlpha: 0, rotation: () => gsap.utils.random(-10, 10), duration: 0.8, stagger: 0.07, ease: 'back.out(1.4)' }),
    });
  }

  return {
    /** merge uploads that appeared after the site was built (from /api/latest) */
    addLatest(latest: V[]) {
      const known = new Set(all.map((v) => v.id));
      const fresh = latest.filter((v) => !known.has(v.id));
      if (!fresh.length) return;
      all = [...fresh, ...all];
      render(false);
    },
  };
}
