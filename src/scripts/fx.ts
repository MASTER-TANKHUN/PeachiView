/**
 * One fixed canvas for every "extra" effect: cursor sparkle trail, heart / confetti bursts,
 * peach rain. The loop sleeps whenever there is nothing to draw.
 */
import { gsap, $, $$, rand, pick, dpr, reduceMotion, finePointer, toast } from './core';

type Kind = 'spark' | 'heart' | 'petal' | 'peach' | 'confetti' | 'snow';
interface P { k: Kind; x: number; y: number; vx: number; vy: number; g: number; r: number; vr: number; s: number; life: number; max: number; c: string; }

const COLORS = ['#fa93d2', '#f569c0', '#ffb8a5', '#c8a7d5', '#ffd66b', '#9dbdf7', '#ffffff'];
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let W = 0, H = 0, ratio = 1;
const parts: P[] = [];
let running = false;

function resize() {
  if (!canvas || !ctx) return;
  ratio = dpr(1.5);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * ratio; canvas.height = H * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawHeart(c: CanvasRenderingContext2D, s: number) {
  c.beginPath();
  c.moveTo(0, s * 0.35);
  c.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.15, 0, -s * 0.45);
  c.bezierCurveTo(s * 0.45, -s * 1.15, s * 1.1, -s * 0.35, 0, s * 0.35);
  c.fill();
}
function drawSpark(c: CanvasRenderingContext2D, s: number) {
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, rr = i % 2 ? s * 0.28 : s;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}
function drawPetal(c: CanvasRenderingContext2D, s: number) {
  c.beginPath();
  c.moveTo(0, -s);
  c.bezierCurveTo(s * 0.9, -s * 0.8, s * 0.8, s * 0.6, 0, s);
  c.bezierCurveTo(-s * 0.8, s * 0.6, -s * 0.9, -s * 0.8, 0, -s);
  c.fill();
}
function drawPeach(c: CanvasRenderingContext2D, s: number) {
  // same design as the SVG mascot: heart-topped peach, fuzz gradient, glossy leaves, kawaii face
  const k = s / 80;
  c.save();
  c.scale(k, k);
  c.translate(-100, -112);
  const body = new Path2D('M100 54C86 36 57 31 38 46 18 62 14 97 23 128c10 36 42 58 77 58s67-22 77-58c9-31 5-66-15-82-19-15-48-10-62 8Z');
  const g = c.createRadialGradient(68, 60, 6, 90, 100, 150);
  g.addColorStop(0, '#fff3df'); g.addColorStop(0.3, '#ffcfae'); g.addColorStop(0.68, '#ff9db0'); g.addColorStop(1, '#f26b96');
  c.fillStyle = g; c.fill(body);
  c.lineWidth = 4; c.strokeStyle = '#e65a8d'; c.stroke(body);
  c.fillStyle = 'rgba(255,255,255,.75)';
  c.beginPath(); c.ellipse(58, 80, 16, 9.5, -0.6, 0, Math.PI * 2); c.fill();
  const leaf = new Path2D('M99 51C88 31 64 20 41 25c6 20 31 32 58 26Zm3-1c7-24 32-39 58-34-6 23-31 38-58 34Z');
  c.fillStyle = '#6fcf73'; c.fill(leaf); c.lineWidth = 3.5; c.strokeStyle = '#358a4c'; c.stroke(leaf);
  c.fillStyle = '#3a1818';
  c.beginPath(); c.ellipse(73, 122, 11.5, 13.5, 0, 0, Math.PI * 2); c.ellipse(127, 122, 11.5, 13.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(68.5, 116, 5.2, 0, Math.PI * 2); c.arc(122.5, 116, 5.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,95,152,.4)';
  c.beginPath(); c.ellipse(50, 141, 13, 7.5, 0, 0, Math.PI * 2); c.ellipse(150, 141, 13, 7.5, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = 3.5; c.strokeStyle = '#3a1818'; c.lineCap = 'round';
  c.stroke(new Path2D('M89 139q5.5 6.5 11 0q5.5 6.5 11 0'));
  c.restore();
}

function loop() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life++;
    p.vy += p.g; p.vx *= 0.985; p.vy *= p.k === 'petal' || p.k === 'snow' ? 0.99 : 0.992;
    p.x += p.vx; p.y += p.vy; p.r += p.vr;
    if (p.k === 'petal' || p.k === 'snow') p.x += Math.sin((p.life + p.s * 10) / 18) * 0.6;
    const t = p.life / p.max;
    if (t >= 1 || p.y > H + 60) { parts.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = t > 0.75 ? (1 - t) / 0.25 : 1;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.fillStyle = p.c;
    if (p.k === 'heart') drawHeart(ctx, p.s);
    else if (p.k === 'spark') drawSpark(ctx, p.s);
    else if (p.k === 'petal') drawPetal(ctx, p.s);
    else if (p.k === 'peach') drawPeach(ctx, p.s);
    else if (p.k === 'snow') { ctx.beginPath(); ctx.arc(0, 0, p.s, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.scale(1, Math.cos(p.life / 5)); ctx.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); }
    ctx.restore();
  }
  if (parts.length) requestAnimationFrame(loop);
  else { running = false; ctx.clearRect(0, 0, W, H); }
}
function kick() { if (!running && ctx) { running = true; requestAnimationFrame(loop); } }

function add(p: Partial<P> & { k: Kind; x: number; y: number }) {
  if (parts.length > 700) return;
  parts.push({ vx: 0, vy: 0, g: 0.18, r: rand(0, Math.PI * 2), vr: rand(-0.08, 0.08), s: 8, life: 0, max: 90, c: pick(COLORS), ...p });
}

/** radial burst, e.g. burst(x, y, 'heart', 18) */
export function burst(x: number, y: number, k: Kind = 'spark', n = 24, spread = 1) {
  if (reduceMotion || !ctx) return;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(3, 9) * spread;
    add({
      k, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(1, 4),
      g: k === 'confetti' ? 0.16 : 0.12, s: k === 'confetti' ? rand(4, 7) : k === 'heart' ? rand(7, 13) : rand(5, 10),
      max: rand(60, 110),
      c: k === 'heart' ? pick(['#f569c0', '#fa93d2', '#ff5f98', '#ffffff']) : pick(COLORS),
    });
  }
  kick();
}
export function burstFrom(el: Element, k: Kind = 'spark', n = 24, spread = 1) {
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, k, n, spread);
}
export function rain(k: Kind = 'peach', n = 40) {
  if (reduceMotion || !ctx) return;
  for (let i = 0; i < n; i++) {
    add({ k, x: rand(0, W), y: rand(-H * 0.6, -20), vx: rand(-1, 1), vy: rand(1, 4), g: 0.05, s: k === 'peach' ? rand(10, 18) : rand(4, 8), max: 400, vr: rand(-0.04, 0.04), c: k === 'snow' ? '#ffffff' : pick(COLORS) });
  }
  kick();
}

function initCursor() {
  if (!finePointer || reduceMotion) return;
  const cur = $('[data-cursor]');
  const label = $('[data-cursor-label]');
  if (!cur || !label) return;
  document.documentElement.classList.add('has-cursor');
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.18, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.18, ease: 'power3' });
  let last = 0;
  window.addEventListener('pointermove', (e) => {
    xTo(e.clientX); yTo(e.clientY);
    const now = performance.now();
    if (now - last > 45 && Math.random() < 0.55) {
      last = now;
      add({ k: 'spark', x: e.clientX + rand(-4, 4), y: e.clientY + rand(-4, 4), vx: rand(-0.6, 0.6), vy: rand(-0.4, 0.8), g: 0.03, s: rand(2.5, 5), max: 40, c: pick(['#fa93d2', '#c8a7d5', '#ffd66b', '#ffb8a5']) });
      kick();
    }
  }, { passive: true });
  window.addEventListener('pointerdown', () => cur.classList.add('is-down'));
  window.addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element;
    const hit = t.closest('a, button, [data-video], .sticker, .idcard, input, label');
    cur.classList.toggle('is-hover', !!hit);
    let text = '';
    if (t.closest('[data-video]')) text = 'ดูคลิป ▶';
    else if (t.closest('.sticker')) text = 'ลากได้!';
    else if (t.closest('.idcard')) text = 'พลิกการ์ด';
    else if (t.closest('.mascot-click, .sleeper, .paper__peach')) text = 'จิ้มเลย';
    label.textContent = text;
    cur.classList.toggle('has-label', !!text);
  });
  document.addEventListener('mouseleave', () => gsap.to(cur, { autoAlpha: 0, duration: 0.2 }));
  document.addEventListener('mouseenter', () => gsap.to(cur, { autoAlpha: 1, duration: 0.2 }));
}

/** buttons lean towards the cursor; GSAP owns their transform (hover lift & press included) */
function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointerenter', () => gsap.to(el, { rotation: -1.5, scale: 1.02, duration: 0.3, ease: 'back.out(3)' }));
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35 - 3);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); gsap.to(el, { rotation: 0, scale: 1, duration: 0.4 }); });
    el.addEventListener('pointerdown', () => gsap.to(el, { scale: 0.95, duration: 0.12 }));
    el.addEventListener('pointerup', () => gsap.to(el, { scale: 1.02, duration: 0.4, ease: 'elastic.out(1, 0.4)' }));
  });
}

// things Peachi might say when you poke her peach (random, a little silly)
const peachLines = [
  'อย่าจิ้มสิ! จั๊กจี้นะ 🍑',
  'กรี๊ดดด! นึกว่าผีมา 👻',
  'จิ้มอีกทีจะไปนอนต่ออีก 4 ปีนะ!',
  'ขอโทษที่หายไปนานน้าาา 🙏',
  'นี่ลูกพีชนะ ไม่ใช่แอปเปิ้ล!',
  'เดี๋ยวๆ ยังไม่ได้เปิดกล้องเลย!',
  'ใครจิ้มบ่อยสุด โดนลากไปเล่นเกมผีด้วยกัน!',
  'หูฟังหูแมวนี่ของรักของหวงนะ ห้ามแย่ง!',
  'ร้านไอติมใน Roblox ยังเปิดอยู่มั้ยน้า… 🍦',
  'เตรียมเสียงกรี๊ดไว้แล้ว พร้อมเล่นเกมผี!',
  'ลูกพีชน้อยคิดถึงพีชชี่มั้ย? พีชชี่คิดถึงนะ ♡',
  'บุ๋งๆ เด้งๆ ~ 🍑',
];

function initEasterEggs() {
  // click any peach mascot → squish + a line
  document.addEventListener('click', (e) => {
    const m = (e.target as Element).closest<HTMLElement>('.mascot-click, .sleeper, .paper__peach, .loader__peach');
    if (!m) return;
    const svg = m.matches('svg') ? m : m.querySelector('svg');
    if (svg) gsap.fromTo(svg, { scaleX: 1.25, scaleY: 0.75 }, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1.2, 0.35)', transformOrigin: '50% 100%' });
    burstFrom(m, 'heart', 10, 0.6);
    toast(pick(peachLines));
  });
  // type "peach" → peach rain; Konami → PeachixSnow
  let buf = '';
  const konami = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
  let kbuf = '';
  window.addEventListener('keydown', (e) => {
    if ((e.target as Element).closest('input, textarea')) return;
    buf = (buf + e.key.toLowerCase()).slice(-5);
    kbuf = (kbuf + e.key).slice(-konami.length);
    if (buf === 'peach') { rain('peach', 50); toast('🍑 ฝนลูกพีชตกแล้ว!'); }
    if (kbuf === konami) { rain('snow', 160); toast('❄ PeachixSnow mode!'); }
  });
}

/** shuffle the #boil turbulence seed so hand-drawn doodles "wiggle" like animation cels */
function initBoil() {
  if (reduceMotion) return;
  const turb = document.querySelector('#boil feTurbulence');
  if (!turb) return;
  let seed = 1;
  window.setInterval(() => { seed = (seed % 6) + 1; turb.setAttribute('seed', String(seed)); }, 130);
}

export function initFx() {
  canvas = $('[data-fx]') as HTMLCanvasElement | null;
  ctx = canvas?.getContext('2d') ?? null;
  resize();
  window.addEventListener('resize', resize);
  initCursor();
  initMagnetic();
  initEasterEggs();
  initBoil();
}
