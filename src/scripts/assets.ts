/** Preloads everything the hero drawing needs and reports progress to the loader. */
export interface StrokeData { w: number; h: number; scale: number; paths: number[][] }
export interface PortraitAssets { lines: HTMLImageElement; color: HTMLImageElement; strokes: StrokeData }

type Listener = (p: number) => void;
const listeners: Listener[] = [];
let done = 0;
const TOTAL = 4;
const tick = () => { done++; listeners.forEach((l) => l(done / TOTAL)); };
export const onProgress = (l: Listener) => { listeners.push(l); l(done / TOTAL); };

const img = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.decoding = 'async';
    i.onload = () => { tick(); resolve(i); };
    i.onerror = reject;
    i.src = src;
  });

export const portraitAssets: Promise<PortraitAssets> = Promise.all([
  img('/portrait/lines.webp'),
  img('/portrait/color.webp'),
  fetch('/portrait/strokes.json').then((r) => r.json() as Promise<StrokeData>).then((d) => { tick(); return d; }),
  (document.fonts?.ready ?? Promise.resolve()).then(() => tick()),
]).then(([lines, color, strokes]) => ({ lines, color, strokes }));
