/**
 * Music controller for the #radio section (+ the floating mini player).
 * The song plays through a visible YouTube IFrame player inside the section's "music_video.mp4" window.
 * Playing turns the party on: disco balls, lights, a spinning record, a tonearm that lowers onto it and
 * travels inwards with the song, peaches dancing on the speakers, speakers & EQ pumping to the beat,
 * floating notes and karaoke lyrics (LRC from src/data/site.ts). Beat-driven loops follow the song's clock.
 */
import { gsap, ScrollTrigger, $, $$, rand, reduceMotion } from './core';
import { burst, burstFrom } from './fx';

interface Song { id: string; title: string; artist: string; start: number; url: string; lrc: string }
interface YTPlayer {
  playVideo(): void; pauseVideo(): void; seekTo(s: number, allow: boolean): void; setVolume(v: number): void;
  getCurrentTime(): number; getDuration(): number;
}
declare global {
  interface Window { YT?: { Player: new (el: HTMLElement, opts: object) => YTPlayer }; onYouTubeIframeAPIReady?: () => void }
}

const BPM = 92;
const BEAT = 60 / BPM;
// tonearm angles (deg, clockwise from straight down): resting off the record → outer groove → near the label
const ARM_REST = -4, ARM_START = 24, ARM_END = 46;

let api: Promise<void> | null = null;
function loadApi() {
  api ??= new Promise<void>((resolve) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.append(s);
  });
  return api;
}
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function parseLrc(lrc: string) {
  const out: { t: number; text: string }[] = [];
  lrc.split(/\r?\n/).forEach((line) => {
    const tags = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const text = line.replace(/\[[^\]]*\]/g, '').trim();
    tags.forEach((m) => out.push({ t: Number(m[1]) * 60 + Number(m[2]), text }));
  });
  return out.filter((l) => l.text).sort((a, b) => a.t - b.t);
}

/** keep a looping timeline locked to the song's clock (so the moves stay on the beat after seeking) */
function syncLoop(tl: gsap.core.Timeline, songTime: number) {
  const d = tl.duration();
  if (!d) return;
  const want = ((songTime % d) + d) % d;
  const diff = Math.abs(tl.time() - want);
  if (diff > 0.1 && diff < d - 0.1) tl.time(want);
}

/** a 4-bar routine for one dancing peach: bounce · sway · hop-spin · wave */
function buildDance(svg: SVGSVGElement) {
  const q = (s: string) => svg.querySelector(s);
  const armL = q('.peach__arm--l'), armR = q('.peach__arm--r');
  const footL = q('.peach__foot--l'), footR = q('.peach__foot--r');
  const leaves = svg.querySelectorAll('.peach__leaf');
  if (armL) gsap.set(armL, { svgOrigin: '36 146' });
  if (armR) gsap.set(armR, { svgOrigin: '164 146' });
  gsap.set(leaves, { svgOrigin: '100 52' });
  const b = BEAT;
  const mood = (m: string) => () => { svg.dataset.mood = m; };
  const t = gsap.timeline();

  // bar 1 — bounce: squash on the beat, pop up, arms pump
  for (let i = 0; i < 4; i++) {
    const at = i * b;
    t.to(svg, { scaleX: 1.12, scaleY: 0.86, y: 0, duration: b * 0.16, ease: 'power2.out' }, at)
      .to(svg, { scaleX: 0.95, scaleY: 1.07, y: -16, duration: b * 0.38, ease: 'power2.out' }, at + b * 0.16)
      .to(svg, { scaleX: 1, scaleY: 1, y: 0, duration: b * 0.46, ease: 'power2.in' }, at + b * 0.54)
      .to(armL, { rotation: i % 2 ? 10 : 95, duration: b * 0.3, ease: 'back.out(2)' }, at)
      .to(armR, { rotation: i % 2 ? -10 : -95, duration: b * 0.3, ease: 'back.out(2)' }, at)
      .to(leaves, { rotation: i % 2 ? -10 : 10, duration: b * 0.3 }, at);
  }
  t.call(mood('joy'), [], 4 * b);
  // bar 2 — sway side to side, stepping
  for (let i = 0; i < 4; i++) {
    const at = (4 + i) * b, dir = i % 2 ? -1 : 1;
    t.to(svg, { rotation: 12 * dir, x: 8 * dir, scaleX: 1, scaleY: 1, y: 0, duration: b * 0.5, ease: 'sine.inOut' }, at)
      .to(armL, { rotation: dir > 0 ? 70 : 20, duration: b * 0.5, ease: 'sine.inOut' }, at)
      .to(armR, { rotation: dir > 0 ? -20 : -70, duration: b * 0.5, ease: 'sine.inOut' }, at)
      .to(dir > 0 ? footL : footR, { y: -9, duration: b * 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, at);
  }
  t.call(mood('happy'), [], 8 * b);
  // bar 3 — crouch, jump & spin, then two little bounces
  t.to(svg, { rotation: 0, x: 0, scaleX: 1.14, scaleY: 0.82, duration: b * 0.3, ease: 'power2.out' }, 8 * b)
    .to([armL, armR], { rotation: (i: number) => (i ? -140 : 140), duration: b * 0.4, ease: 'back.out(2)' }, 8 * b + b * 0.3)
    .to(svg, { y: -46, scaleX: 0.94, scaleY: 1.08, rotation: 360, duration: b * 1.1, ease: 'power2.out' }, 8 * b + b * 0.3)
    .call(mood('wow'), [], 8 * b + b * 0.5)
    .to(svg, { y: 0, scaleX: 1, scaleY: 1, duration: b * 0.6, ease: 'bounce.out' }, 8 * b + b * 1.4)
    .set(svg, { rotation: 0 }, 10 * b)
    .call(mood('happy'), [], 10 * b);
  for (let i = 0; i < 2; i++) {
    const at = (10 + i) * b;
    t.to(svg, { scaleX: 1.1, scaleY: 0.88, duration: b * 0.2 }, at)
      .to(svg, { scaleX: 1, scaleY: 1, y: -10, duration: b * 0.35, ease: 'power2.out' }, at + b * 0.2)
      .to(svg, { y: 0, duration: b * 0.45, ease: 'power2.in' }, at + b * 0.55)
      .to([armL, armR], { rotation: (j: number) => (j ? -40 : 40), duration: b * 0.3 }, at);
  }
  t.call(mood('joy'), [], 12 * b);
  // bar 4 — arms up, waving, side steps
  for (let i = 0; i < 4; i++) {
    const at = (12 + i) * b, dir = i % 2 ? -1 : 1;
    t.to(svg, { x: 12 * dir, rotation: -5 * dir, duration: b * 0.5, ease: 'sine.inOut' }, at)
      .to(armL, { rotation: 150 + 22 * dir, duration: b * 0.5, ease: 'sine.inOut' }, at)
      .to(armR, { rotation: -150 + 22 * dir, duration: b * 0.5, ease: 'sine.inOut' }, at)
      .to(dir > 0 ? footR : footL, { y: -8, duration: b * 0.25, yoyo: true, repeat: 1 }, at)
      .to(leaves, { rotation: 14 * dir, duration: b * 0.5 }, at);
  }
  t.to(svg, { x: 0, rotation: 0, duration: b * 0.3 }, 15.7 * b);
  t.call(mood('happy'), [], 15.9 * b);
  t.set({}, {}, 16 * b); // exactly 16 beats long so the loop lines up with the music
  return { tl: t, parts: [svg, armL, armR, footL, footR, ...leaves].filter(Boolean) as Element[] };
}

let pauseHook: () => void = () => {};
/** pause the song, e.g. when a video is opened */
export const pauseMusic = () => pauseHook();

export function initMusic() {
  const radio = $('[data-radio]');
  const mini = $('[data-mini]');
  if (!radio) return { scroll: () => {} };
  const song = JSON.parse(radio.dataset.song ?? '{}') as Song;
  const q = <T extends Element = HTMLElement>(s: string) => $<T>(s, radio)!;
  const ytBox = q('[data-yt]');
  const cover = q<HTMLButtonElement>('[data-play-cover]');
  const blocked = q('[data-blocked]');
  const toggle = q<HTMLButtonElement>('[data-toggle]');
  const vinyl = q<SVGElement>('[data-vinyl]');
  const arm = q<SVGElement>('[data-arm]');
  const notesBox = q('[data-notes]');
  const seek = q('[data-seek]');
  const fill = q('[data-fill]');
  const thumb = q('[data-thumb]');
  const cur = q('[data-cur]');
  const dur = q('[data-dur]');
  const vol = q<HTMLInputElement>('[data-vol]');
  const kPrev = q('[data-k-prev]'), kNow = q('[data-k-now]'), kNext = q('[data-k-next]');
  const wishCount = q('[data-wish-count]');
  const bars = $$('.eq i', radio);
  const woofers = $$('.speaker__woof, .speaker__tw', radio);
  const speakers = $$('.speaker', radio);
  const dancerWraps = $$('[data-dancer]', radio);
  const miniTitle = mini ? $('[data-mini-title]', mini) : null;
  const miniTicker = mini ? $('[data-mini-ticker]', mini) : null;

  const lines = parseLrc(song.lrc || '');
  let player: YTPlayer | null = null;
  let ready = false, playing = false, duration = 0, lastLine = -2, progress = 0;
  let radioInView = false, hasPlayed = false;

  // record spin with spin-up / spin-down
  const spin = gsap.to(vinyl, { rotation: '+=360', duration: 1.8, ease: 'none', repeat: -1, paused: true, transformOrigin: '50% 50%' });
  spin.timeScale(0.001);

  // beat: speakers pump, woofers kick
  const beat = gsap.timeline({ repeat: -1, paused: true });
  beat.to(woofers, { scale: 1.12, duration: BEAT * 0.18, ease: 'power2.out' })
    .to(woofers, { scale: 1, duration: BEAT * 0.82, ease: 'power2.inOut' })
    .to(speakers, { scaleY: 1.03, scaleX: 0.985, duration: BEAT * 0.2, ease: 'power2.out', transformOrigin: '50% 100%' }, 0)
    .to(speakers, { scaleY: 1, scaleX: 1, duration: BEAT * 0.8, ease: 'elastic.out(1, 0.5)' }, BEAT * 0.2);
  let eqTimer = 0;
  const eqStep = () => {
    bars.forEach((b, i) => gsap.to(b, { height: playing ? rand(10, 90) * (0.6 + 0.4 * Math.sin(i / 3 + performance.now() / 500) ** 2) : 8, duration: BEAT / 2, ease: 'power2.out' }));
  };

  // dancing peaches (one routine per dancer, all in one loop)
  const dance = gsap.timeline({ repeat: -1, paused: true });
  const danceParts: Element[] = [];
  const danceSvgs: SVGSVGElement[] = [];
  if (!reduceMotion) {
    dancerWraps.forEach((w) => {
      const svg = $<SVGSVGElement>('svg.peach', w);
      if (!svg) return;
      const d = buildDance(svg);
      dance.add(d.tl, 0);
      danceParts.push(...d.parts);
      danceSvgs.push(svg);
    });
  }
  const startDance = () => {
    if (reduceMotion || !danceSvgs.length) return;
    dancerWraps.forEach((w) => w.classList.add('is-dancing'));
    dance.play();
  };
  const stopDance = () => {
    if (!danceSvgs.length) return;
    dance.pause();
    dancerWraps.forEach((w) => w.classList.remove('is-dancing'));
    gsap.to(danceParts, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 0.5, ease: 'power2.out' });
    danceSvgs.forEach((s) => { s.dataset.mood = 'happy'; });
  };

  // tonearm: lift → swing → lower onto the record; then it follows the song towards the label
  gsap.set(arm, { rotation: ARM_REST });
  const armFollow = gsap.quickTo(arm, 'rotation', { duration: 0.6, ease: 'power1.out' });
  let armOnRecord = false;
  let armTl: gsap.core.Timeline | null = null;
  const armAngle = () => ARM_START + progress * (ARM_END - ARM_START);
  // (while it swings, armOnRecord is false so the follow tween never fights the swing)
  const dropArm = () => {
    armTl?.kill();
    if (reduceMotion) { gsap.set(arm, { rotation: armAngle() }); armOnRecord = true; return; }
    armOnRecord = false;
    armTl = gsap.timeline({ onComplete: () => { armOnRecord = true; } })
      .to(arm, { '--lift': 1, scale: 1.04, duration: 0.25, ease: 'power2.out' })
      .to(arm, { rotation: armAngle, duration: 0.9, ease: 'power2.inOut' })
      .to(arm, { '--lift': 0, scale: 1, duration: 0.3, ease: 'power2.in' })
      .add(() => burstFrom(arm.querySelector('g') ?? arm, 'spark', 8, 0.35), '<0.2');
  };
  const liftArm = () => {
    armTl?.kill();
    armOnRecord = false;
    if (reduceMotion) { gsap.set(arm, { rotation: ARM_REST }); return; }
    armTl = gsap.timeline()
      .to(arm, { '--lift': 1, scale: 1.04, duration: 0.2, ease: 'power2.out' })
      .to(arm, { rotation: ARM_REST, duration: 0.9, ease: 'power2.inOut' })
      .to(arm, { '--lift': 0, scale: 1, duration: 0.25, ease: 'power2.in' });
  };

  const updateMini = () => {
    if (!mini) return;
    const show = hasPlayed && !radioInView;
    gsap.to(mini, { autoAlpha: show ? 1 : 0, y: show ? 0 : 20, duration: 0.4 });
  };

  const setState = (s: 'idle' | 'playing' | 'paused') => {
    const was = playing;
    playing = s === 'playing';
    radio.dataset.state = s;
    if (mini) mini.dataset.state = s;
    toggle.setAttribute('aria-label', playing ? 'หยุดเพลงชั่วคราว' : 'เล่นเพลง');
    if (miniTitle) miniTitle.textContent = playing ? 'กำลังเล่น ♪' : 'หยุดไว้ ♪';
    if (playing && !hasPlayed) { hasPlayed = true; updateMini(); }
    if (playing && !was) { dropArm(); startDance(); }
    if (!playing && was) { liftArm(); stopDance(); }
    if (reduceMotion) return;
    if (playing) {
      spin.play();
      gsap.to(spin, { timeScale: 1, duration: 1.3, ease: 'power2.out' });
      beat.play();
      window.clearInterval(eqTimer);
      eqTimer = window.setInterval(eqStep, (BEAT * 1000) / 2);
    } else {
      gsap.to(spin, { timeScale: 0.001, duration: 1.6, ease: 'power2.out' });
      beat.pause();
      window.clearInterval(eqTimer);
      eqStep();
    }
  };

  let wantPlay = false;
  const create = async () => {
    if (player) return;
    await loadApi();
    const host = document.createElement('div');
    ytBox.append(host);
    player = new window.YT!.Player(host, {
      host: 'https://www.youtube-nocookie.com',
      videoId: song.id,
      width: '100%',
      height: '100%',
      playerVars: { start: Math.floor(song.start), rel: 0, playsinline: 1, modestbranding: 1, controls: 1, origin: location.origin },
      events: {
        onReady: () => {
          ready = true;
          player!.setVolume(Number(vol.value));
          duration = player!.getDuration();
          dur.textContent = duration ? fmt(duration) : '--:--';
          if (wantPlay) { player!.seekTo(song.start, true); player!.playVideo(); }
        },
        onStateChange: (e: { data: number }) => {
          if (e.data === 1) {
            if (!duration) { duration = player!.getDuration(); dur.textContent = fmt(duration); }
            if (!playing) burstFrom(q('.tt__deck'), 'confetti', 40, 1.2);
            setState('playing');
          } else if (e.data === 2) setState('paused');
          else if (e.data === 0) { setState('paused'); player!.seekTo(song.start, true); player!.pauseVideo(); }
        },
        onError: () => { blocked.hidden = false; setState('idle'); },
      },
    });
  };

  const play = async () => {
    wantPlay = true;
    if (!reduceMotion) gsap.to(cover, { autoAlpha: 0, scale: 1.05, duration: 0.5, onComplete: () => { cover.style.display = 'none'; } });
    else cover.style.display = 'none';
    await create();
    if (!ready) return;
    if (player!.getCurrentTime() < song.start - 0.3) player!.seekTo(song.start, true);
    player!.playVideo();
  };
  const pause = () => { wantPlay = false; player?.pauseVideo(); };
  pauseHook = () => { if (playing) pause(); };

  cover.addEventListener('pointerenter', () => { loadApi(); }, { once: true });
  cover.addEventListener('click', play);
  toggle.addEventListener('click', () => (playing ? pause() : play()));
  q('[data-restart]').addEventListener('click', () => { if (ready) { player!.seekTo(song.start, true); player!.playVideo(); } else play(); });
  vol.addEventListener('input', () => player?.setVolume(Number(vol.value)));

  const seekTo = (ratio: number) => {
    if (!ready || !duration) return;
    player!.seekTo(song.start + Math.min(1, Math.max(0, ratio)) * (duration - song.start), true);
  };
  seek.addEventListener('pointerdown', (e) => { const r = seek.getBoundingClientRect(); seekTo((e.clientX - r.left) / r.width); });
  seek.addEventListener('keydown', (e) => {
    if (!ready) return;
    const step = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
    if (step) { e.preventDefault(); player!.seekTo(player!.getCurrentTime() + step, true); }
  });

  // mini player: only appears once the song has been started here, and only plays/pauses (it never scrolls)
  $('[data-mini-main]', mini ?? document)?.addEventListener('click', () => { if (playing) pause(); else play(); });

  // wishes: tap the room to send a star up
  let wishes = 0;
  try { wishes = Number(localStorage.getItem('peachi-wishes') ?? 0); } catch { /* private mode */ }
  const showWishes = () => { wishCount.textContent = wishes ? `(ขอพรไปแล้ว ${wishes.toLocaleString('en-US')} ครั้ง)` : ''; };
  showWishes();
  radio.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('button, a, input, label, iframe, [role="slider"], .win, .deckpanel')) return;
    wishes++;
    try { localStorage.setItem('peachi-wishes', String(wishes)); } catch { /* ignore */ }
    showWishes();
    burst(e.clientX, e.clientY, 'spark', 14, 0.8);
    if (reduceMotion) return;
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    star.innerHTML = '<use href="#i-spark"></use>';
    star.setAttribute('style', `position:fixed;left:${e.clientX - 14}px;top:${e.clientY - 14}px;width:28px;height:28px;color:#ffe08a;z-index:9100;pointer-events:none;filter:drop-shadow(0 0 8px #fff6b0)`);
    document.body.append(star);
    gsap.to(star, { y: -window.innerHeight * rand(0.6, 0.9), x: rand(-80, 80), rotation: 360, scale: 0.4, duration: rand(1.6, 2.4), ease: 'power2.in', onComplete: () => { burst(e.clientX + rand(-80, 80), e.clientY - window.innerHeight * 0.75, 'spark', 8, 0.5); star.remove(); } });
  });

  // floating notes while playing
  window.setInterval(() => {
    if (!playing || reduceMotion || !radioInView) return;
    const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    n.innerHTML = '<use href="#i-note"></use>';
    notesBox.append(n);
    gsap.fromTo(n, { x: 0, y: 0, scale: 0.4, rotation: rand(-30, 30) }, {
      x: rand(-220, 220), y: rand(-260, -380), scale: rand(0.9, 1.6), rotation: rand(-60, 60), duration: 3, ease: 'sine.out',
      keyframes: { opacity: [0, 1, 1, 0] }, onComplete: () => n.remove(),
    });
  }, 420);

  // progress, tonearm, beat sync & lyrics
  let lastTick = '';
  gsap.ticker.add(() => {
    if (!ready || !player) return;
    const t = player.getCurrentTime();
    const span = Math.max(1, duration - song.start);
    progress = Math.min(1, Math.max(0, (t - song.start) / span));
    fill.style.width = `${progress * 100}%`;
    thumb.style.left = `${progress * 100}%`;
    seek.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    cur.textContent = fmt(t);
    if (playing) {
      if (armOnRecord) armFollow(armAngle());
      syncLoop(beat, t - song.start);
      syncLoop(dance, t - song.start);
    }

    if (lines.length) {
      let i = -1;
      for (let k = 0; k < lines.length; k++) { if (lines[k].t <= t + 0.1) i = k; else break; }
      if (i !== lastLine) {
        lastLine = i;
        kPrev.textContent = lines[i - 1]?.text ?? '';
        kNow.textContent = i >= 0 ? lines[i].text : `♪ ${song.title} ♪`;
        kNext.textContent = lines[i + 1]?.text ?? '';
        if (!reduceMotion) gsap.fromTo(kNow, { y: 14, scale: 0.94 }, { y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' });
      }
      const start = i >= 0 ? lines[i].t : song.start;
      const end = lines[i + 1]?.t ?? duration;
      kNow.style.setProperty('--p', `${Math.min(100, Math.max(0, ((t - start) / Math.max(0.5, end - start)) * 100))}%`);
      const tickText = playing && i >= 0 ? `♪ ${lines[i].text}` : '';
      if (miniTicker && tickText !== lastTick) {
        lastTick = tickText;
        miniTicker.textContent = tickText;
        miniTicker.classList.toggle('is-on', !!tickText && !radioInView);
      }
    } else {
      // no lyrics yet: the title "sings" along with the beat
      kNow.style.setProperty('--p', `${((t - song.start) % (BEAT * 8)) / (BEAT * 8) * 100}%`);
    }
    if (miniTicker && radioInView) miniTicker.classList.remove('is-on');
  });

  /** scroll-driven bits; created in page order with the other ScrollTriggers */
  const scroll = () => {
    ScrollTrigger.create({
      trigger: radio, start: 'top 70%', end: 'bottom 30%',
      onToggle: (self) => { radioInView = self.isActive; updateMini(); },
    });
    if (reduceMotion) return;
    const st = { trigger: radio, start: 'top 75%', once: true };
    gsap.from(q('.tt__deck'), { y: 120, rotation: -8, scale: 0.8, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.4)', scrollTrigger: st });
    gsap.from(speakers, { y: 160, rotation: (i: number) => (i ? 12 : -12), autoAlpha: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.12, delay: 0.2, scrollTrigger: st });
    gsap.fromTo(arm, { rotation: -30 }, { rotation: ARM_REST, duration: 1.4, ease: 'elastic.out(1, 0.5)', delay: 0.5, scrollTrigger: st });
    gsap.from(danceSvgs, { y: -80, autoAlpha: 0, duration: 0.9, ease: 'bounce.out', stagger: 0.15, delay: 0.9, scrollTrigger: st });
    gsap.fromTo(bars, { height: 2 }, { height: () => rand(6, 30), duration: 0.8, stagger: 0.015, scrollTrigger: st });
  };

  return { scroll };
}
