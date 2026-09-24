/**
 * Ambient particle fields: peach-blossom petals in the hero, snow in the "waiting" scene.
 * Each field only animates while its canvas is on screen.
 */
import { dpr, rand, pick, whileVisible, reduceMotion } from './core';

interface Flake { x: number; y: number; s: number; vx: number; vy: number; r: number; vr: number; ph: number; c: string; kind: 0 | 1 | 2 }

export interface Field { setIntensity: (v: number) => void; destroy: () => void }

export function createField(canvas: HTMLCanvasElement, mode: 'petals' | 'snow', opts: { max?: number; repel?: boolean } = {}): Field {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, ratio = 1, raf = 0, visible = false;
  let intensity = mode === 'petals' ? 1 : 0.15;
  const max = opts.max ?? (mode === 'petals' ? 38 : 150);
  const flakes: Flake[] = [];
  const mouse = { x: -999, y: -999 };
  const petalColors = ['#ffc6df', '#ffb0cf', '#ffd9e9', '#fbe3f1', '#f9a3cf'];

  const spawn = (fromTop: boolean): Flake => ({
    x: rand(0, W), y: fromTop ? rand(-60, -10) : rand(0, H),
    s: mode === 'petals' ? rand(6, 13) : rand(1.2, 3.8),
    vx: rand(-0.3, 0.3), vy: mode === 'petals' ? rand(0.5, 1.3) : rand(0.6, 1.8),
    r: rand(0, Math.PI * 2), vr: rand(-0.03, 0.03), ph: rand(0, 100),
    c: mode === 'petals' ? pick(petalColors) : '#ffffff',
    kind: mode === 'petals' ? (Math.random() < 0.12 ? 1 : Math.random() < 0.1 ? 2 : 0) : (Math.random() < 0.08 ? 1 : 0),
  });

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    ratio = dpr(1.5);
    W = r.width; H = r.height;
    canvas.width = Math.max(1, W * ratio); canvas.height = Math.max(1, H * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const drawPetal = (f: Flake) => {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.moveTo(0, -f.s);
    ctx.bezierCurveTo(f.s * 0.9, -f.s * 0.7, f.s * 0.75, f.s * 0.6, 0, f.s);
    ctx.bezierCurveTo(-f.s * 0.75, f.s * 0.6, -f.s * 0.9, -f.s * 0.7, 0, -f.s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(-f.s * 0.2, -f.s * 0.3, f.s * 0.18, f.s * 0.42, 0.3, 0, Math.PI * 2); ctx.fill();
  };
  const drawSparkle = (f: Flake, t: number) => {
    const a = 0.4 + 0.6 * Math.abs(Math.sin(t / 30 + f.ph));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const an = (i * Math.PI) / 4, rr = i % 2 ? f.s * 0.18 : f.s * 0.7; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  const drawHeart = (f: Flake) => {
    const s = f.s * 0.8;
    ctx.fillStyle = '#fa93d2';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.15, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.45, -s * 1.15, s * 1.1, -s * 0.35, 0, s * 0.35);
    ctx.fill();
  };
  const drawSnowflake = (f: Flake) => {
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    const s = f.s * 2.2;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { const an = (i * Math.PI) / 3; ctx.moveTo(Math.cos(an) * -s, Math.sin(an) * -s); ctx.lineTo(Math.cos(an) * s, Math.sin(an) * s); }
    ctx.stroke();
  };

  let t = 0;
  const frame = () => {
    t++;
    ctx.clearRect(0, 0, W, H);
    const want = Math.round(max * intensity);
    while (flakes.length < want) flakes.push(spawn(flakes.length > want * 0.5));
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.ph += 0.02;
      f.x += f.vx + Math.sin(f.ph) * (mode === 'petals' ? 0.7 : 0.35);
      f.y += f.vy;
      f.r += f.vr;
      if (opts.repel) {
        const dx = f.x - mouse.x, dy = f.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const d = Math.sqrt(d2) || 1; f.x += (dx / d) * 2.4; f.y += (dy / d) * 1.4; }
      }
      if (f.y > H + 20 || f.x < -40 || f.x > W + 40) {
        if (flakes.length > want) { flakes.splice(i, 1); continue; }
        Object.assign(f, spawn(true));
      }
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.r);
      if (mode === 'petals') {
        if (f.kind === 1) drawSparkle(f, t); else if (f.kind === 2) drawHeart(f); else drawPetal(f);
      } else if (f.kind === 1) drawSnowflake(f);
      else {
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath(); ctx.arc(0, 0, f.s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  };

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  };
  resize();
  window.addEventListener('resize', resize);
  if (opts.repel) window.addEventListener('pointermove', onMove, { passive: true });
  const io = reduceMotion ? null : whileVisible(canvas, (v) => {
    visible = v;
    cancelAnimationFrame(raf);
    if (visible) { resize(); raf = requestAnimationFrame(frame); }
  });

  return {
    setIntensity: (v: number) => { intensity = v; },
    destroy: () => { io?.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); },
  };
}
