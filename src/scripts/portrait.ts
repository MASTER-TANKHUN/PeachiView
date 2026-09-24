/**
 * Draws Peachi like an artist would: pen strokes reveal the real line art (traced from her
 * avatar), a brush paints the colours in underneath, then the final image fades up.
 * Strokes come from scripts/build_portrait.py (skeleton of the line art, face-first order).
 */
import { gsap, $, dpr, reduceMotion, isDesktop } from './core';
import { portraitAssets, type PortraitAssets } from './assets';
import { burstFrom } from './fx';

interface Path { pts: [number, number][]; cum: number[]; len: number; drawn: number; t0: number; dur: number }

function buildPaths(raw: number[][], k: number, ox: number, oy: number, scale: number): Path[] {
  return raw.map((flat) => {
    const pts: [number, number][] = [];
    let x = 0, y = 0;
    for (let i = 0; i < flat.length; i += 2) {
      x += flat[i]; y += flat[i + 1];
      pts.push([x * scale * k + ox, y * scale * k + oy]);
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1], drawn: 0, t0: 0, dur: 0 };
  });
}

/** stroke the part of `p` between p.drawn and `target` (so every frame only adds new ink) */
function strokeTo(ctx: CanvasRenderingContext2D, p: Path, target: number) {
  if (target <= p.drawn) return;
  ctx.beginPath();
  let started = false;
  for (let i = 1; i < p.pts.length; i++) {
    const a = p.cum[i - 1], b = p.cum[i];
    if (b < p.drawn) continue;
    if (a > target) break;
    const [x0, y0] = p.pts[i - 1], [x1, y1] = p.pts[i];
    const seg = b - a || 1;
    const u0 = Math.max(0, (p.drawn - a) / seg), u1 = Math.min(1, (target - a) / seg);
    if (!started) { ctx.moveTo(x0 + (x1 - x0) * u0, y0 + (y1 - y0) * u0); started = true; }
    ctx.lineTo(x0 + (x1 - x0) * u1, y0 + (y1 - y0) * u1);
  }
  ctx.stroke();
  p.drawn = target;
}

function schedule(paths: Path[], total: number, speed: number, maxDur: number) {
  const n = paths.length;
  paths.forEach((p, i) => {
    p.drawn = 0;
    p.t0 = (i / n) * total * 0.8;
    p.dur = Math.min(maxDur, Math.max(0.08, p.len / speed));
  });
}

const layer = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

export function initPortrait() {
  const fig = $('[data-portrait]');
  const foundCanvas = fig?.querySelector('canvas');
  const foundImg = fig?.querySelector<HTMLImageElement>('.portrait__final');
  const sheen = fig?.querySelector<HTMLElement>('.portrait__sheen');
  if (!fig || !foundCanvas || !foundImg) return { play: () => Promise.resolve() };
  const canvas: HTMLCanvasElement = foundCanvas;
  const img: HTMLImageElement = foundImg;

  const showFinal = () => {
    gsap.set(img, { opacity: 1 });
    gsap.set(canvas, { opacity: 0 });
    fig.classList.add('is-done');
  };
  if (reduceMotion) { showFinal(); return { play: () => Promise.resolve() }; }

  let tl: gsap.core.Timeline | null = null;

  async function play(assets?: PortraitAssets) {
    const a = assets ?? (await portraitAssets);
    tl?.kill();
    fig!.classList.remove('is-done');
    const rect = fig!.getBoundingClientRect();
    const r = dpr(2);
    const W = Math.max(2, Math.round(rect.width * r)), H = Math.max(2, Math.round(rect.height * r));
    canvas!.width = W; canvas!.height = H;
    const ctx = canvas!.getContext('2d')!;
    const { strokes, lines, color } = a;
    // fit the art (object-fit: contain)
    const k = Math.min(W / strokes.w, H / strokes.h);
    const ox = (W - strokes.w * k) / 2, oy = (H - strokes.h * k) / 2;
    const artW = strokes.w * k, artH = strokes.h * k;

    const ink = layer(W, H), inkCtx = ink.getContext('2d')!;
    const mask = layer(W, H), maskCtx = mask.getContext('2d')!;
    const paint = layer(W, H), paintCtx = paint.getContext('2d')!;

    const linePattern = inkCtx.createPattern(lines, 'no-repeat')!;
    linePattern.setTransform(new DOMMatrix([artW / lines.width, 0, 0, artH / lines.height, ox, oy]));
    inkCtx.strokeStyle = linePattern;
    inkCtx.lineCap = 'round'; inkCtx.lineJoin = 'round';
    inkCtx.lineWidth = 5.5 * k;

    const desktop = isDesktop();
    const paths = buildPaths(strokes.paths, k, ox, oy, strokes.scale);
    const drawT = desktop ? 3.6 : 2.8;
    schedule(paths, drawT, 1100 * k, 0.9);

    // brush: two interleaved zig-zags over the figure, painted with soft edges
    const zig = (startRight: boolean): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const right = (i % 2 === 0) === startRight;
        pts.push([ox + artW * (right ? 0.96 : 0.04), oy + artH * (-0.02 + i * 0.13)]);
      }
      return pts;
    };
    const brushes: Path[] = [zig(false), zig(true)].map((pts) => {
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { pts, cum, len: cum[cum.length - 1], drawn: 0, t0: 0, dur: 0 };
    });
    maskCtx.strokeStyle = '#000';
    maskCtx.lineCap = 'round'; maskCtx.lineJoin = 'round';
    maskCtx.lineWidth = artH * 0.2;
    maskCtx.shadowColor = '#000';
    maskCtx.shadowBlur = artH * 0.05;

    const compose = (lineAlpha: number) => {
      paintCtx.globalCompositeOperation = 'source-over';
      paintCtx.clearRect(0, 0, W, H);
      paintCtx.drawImage(mask, 0, 0);
      paintCtx.globalCompositeOperation = 'source-in';
      paintCtx.drawImage(color, ox, oy, artW, artH);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(paint, 0, 0);
      ctx.globalAlpha = lineAlpha;
      ctx.drawImage(ink, 0, 0);
      ctx.globalAlpha = 1;
    };

    gsap.set(canvas, { opacity: 1 });
    gsap.set(img, { opacity: 0 });
    const state = { t: 0, gap: 0, brush: 0, lineAlpha: 1 };
    let painting = false;

    return new Promise<void>((resolve) => {
      tl = gsap.timeline({ onComplete: () => { fig!.classList.add('is-done'); resolve(); } });
      // 1 — pen drawing
      tl.to(state, {
        t: drawT, duration: drawT, ease: 'none',
        onUpdate: () => {
          for (const p of paths) {
            if (state.t < p.t0) continue;
            strokeTo(inkCtx, p, Math.min(1, (state.t - p.t0) / p.dur) * p.len);
          }
          compose(1);
        },
      });
      // 2 — fill any hairline gaps with the full line art
      tl.to(state, {
        gap: 1, duration: 0.45, ease: 'power1.inOut',
        onUpdate: () => {
          inkCtx.save();
          inkCtx.globalAlpha = 0.12;
          inkCtx.drawImage(lines, ox, oy, artW, artH);
          inkCtx.restore();
          compose(1);
        },
      });
      // 3 — watercolour brush
      tl.to(state, {
        brush: 1, duration: desktop ? 1.5 : 1.2, ease: 'power1.inOut',
        onStart: () => { painting = true; },
        onUpdate: () => {
          for (const b of brushes) strokeTo(maskCtx, b, state.brush * b.len);
          compose(1);
        },
      });
      // 4 — the real picture
      tl.to(state, { lineAlpha: 0.0, duration: 0.6, ease: 'power1.out', onUpdate: () => painting && compose(state.lineAlpha) }, '-=0.2');
      tl.to(img, { opacity: 1, duration: 0.7, ease: 'power1.out' }, '<');
      tl.to(canvas, { opacity: 0, duration: 0.5 }, '>-0.2');
      tl.add(() => burstFrom(fig!, 'spark', 34, 1.3), '<');
    });
  }

  // click while drawing → fast-forward; replay button → draw again
  fig.addEventListener('click', (e) => {
    if ((e.target as Element).closest('.portrait__replay')) { play(); return; }
    if (tl && tl.isActive()) tl.timeScale(5);
  });

  // holographic sheen that follows the pointer
  if (sheen && window.matchMedia('(hover: hover)').matches) {
    fig.addEventListener('pointermove', (e) => {
      const r = fig.getBoundingClientRect();
      sheen.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      sheen.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      gsap.to(sheen, { opacity: fig.classList.contains('is-done') ? 1 : 0, duration: 0.3 });
    });
    fig.addEventListener('pointerleave', () => gsap.to(sheen, { opacity: 0, duration: 0.4 }));
  }

  // if the layout changes mid-animation just jump to the finished picture
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastW) < 40) return;
    lastW = window.innerWidth;
    tl?.progress(1);
    showFinal();
  });

  return { play };
}
