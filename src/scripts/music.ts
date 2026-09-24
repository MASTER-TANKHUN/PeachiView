/**
 * Music controller for the #radio section (+ the floating mini player).
 * The song plays through a visible YouTube IFrame player inside the section's "music_video.mp4" window.
 * Playing turns the party on: disco ball, beams, spinning record, tonearm that follows the song,
 * speakers & EQ pumping to the beat, floating notes and karaoke lyrics (LRC from src/data/site.ts).
 */
import { gsap, ScrollTrigger, $, $$, rand, reduceMotion } from './core';
import { burst, burstFrom } from './fx';
import { scrollToTarget } from './smooth';

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

let pauseHook: () => void = () => {};
/** pause the song, e.g. when a video is opened */
export const pauseMusic = () => pauseHook();

export function initMusic() {
  const radio = $('[data-radio]');
  const mini = $('[data-mini]');
  if (!radio) return { scroll: () => {}, reveal: () => {} };
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
  const miniTitle = mini ? $('[data-mini-title]', mini) : null;
  const miniTicker = mini ? $('[data-mini-ticker]', mini) : null;

  const lines = parseLrc(song.lrc || '');
  let player: YTPlayer | null = null;
  let ready = false, wantPlay = false, playing = false, duration = 0, lastLine = -2;
  let radioInView = false;

  // record spin with spin-up / spin-down
  const spin = gsap.to(vinyl, { rotation: '+=360', duration: 1.8, ease: 'none', repeat: -1, paused: true, transformOrigin: '50% 50%' });
  spin.timeScale(0.001);

  // beat: speakers pump, EQ jumps, woofers kick
  const beat = gsap.timeline({ repeat: -1, paused: true });
  beat.to(woofers, { scale: 1.12, duration: BEAT * 0.18, ease: 'power2.out' })
    .to(woofers, { scale: 1, duration: BEAT * 0.82, ease: 'power2.inOut' })
    .to(speakers, { scaleY: 1.03, scaleX: 0.985, duration: BEAT * 0.2, ease: 'power2.out', transformOrigin: '50% 100%' }, 0)
    .to(speakers, { scaleY: 1, scaleX: 1, duration: BEAT * 0.8, ease: 'elastic.out(1, 0.5)' }, BEAT * 0.2);
  let eqTimer = 0;
  const eqStep = () => {
    bars.forEach((b, i) => gsap.to(b, { height: playing ? rand(10, 90) * (0.6 + 0.4 * Math.sin(i / 3 + performance.now() / 500) ** 2) : 8, duration: BEAT / 2, ease: 'power2.out' }));
  };

  const setState = (s: 'idle' | 'playing' | 'paused') => {
    playing = s === 'playing';
    radio.dataset.state = s;
    if (mini) mini.dataset.state = s;
    toggle.setAttribute('aria-label', playing ? 'หยุดเพลงชั่วคราว' : 'เล่นเพลง');
    if (miniTitle) miniTitle.textContent = playing ? 'กำลังเล่น ♪' : s === 'paused' ? 'หยุดไว้ ♪' : 'เปิดเพลง ♪';
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
      arm.style.rotate = '-28deg';
    }
  };

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

  // mini player: away from the section it controls the song; idle → takes you to the radio
  if (mini) {
    $('[data-mini-main]', mini)?.addEventListener('click', () => {
      if (playing) pause();
      else if (ready) play();
      else { scrollToTarget(radio); window.setTimeout(play, 900); }
    });
  }

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
    if (!playing || reduceMotion || (mini && !radioInView)) return;
    const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    n.innerHTML = '<use href="#i-note"></use>';
    notesBox.append(n);
    gsap.fromTo(n, { x: 0, y: 0, scale: 0.4, rotation: rand(-30, 30) }, {
      x: rand(-220, 220), y: rand(-260, -380), scale: rand(0.9, 1.6), rotation: rand(-60, 60), duration: 3, ease: 'sine.out',
      keyframes: { opacity: [0, 1, 1, 0] }, onComplete: () => n.remove(),
    });
  }, 420);

  // progress, tonearm & lyrics
  let lastTick = '';
  gsap.ticker.add(() => {
    if (!ready || !player) return;
    const t = player.getCurrentTime();
    const span = Math.max(1, duration - song.start);
    const p = Math.min(1, Math.max(0, (t - song.start) / span));
    fill.style.width = `${p * 100}%`;
    thumb.style.left = `${p * 100}%`;
    seek.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    cur.textContent = fmt(t);
    if (playing) arm.style.rotate = `${-2 + p * 16}deg`;

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

  /** scroll-driven bits; called in page order so pinned sections above are already measured */
  const scroll = () => {
    if (mini) {
      ScrollTrigger.create({
        trigger: radio, start: 'top 70%', end: 'bottom 30%',
        onToggle: (self) => {
          radioInView = self.isActive;
          gsap.to(mini, { autoAlpha: radioInView ? 0 : 1, y: radioInView ? 20 : 0, duration: 0.4 });
        },
      });
    }
    if (reduceMotion) return;
    const st = { trigger: radio, start: 'top 75%', once: true };
    gsap.from(q('.tt__deck'), { y: 120, rotation: -8, scale: 0.8, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.4)', scrollTrigger: st });
    gsap.from(speakers, { y: 160, rotation: (i: number) => (i ? 12 : -12), autoAlpha: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.12, delay: 0.2, scrollTrigger: st });
    gsap.from(arm, { rotation: -60, duration: 1.4, ease: 'elastic.out(1, 0.5)', delay: 0.5, scrollTrigger: st });
    gsap.fromTo(bars, { height: 2 }, { height: () => rand(6, 30), duration: 0.8, stagger: 0.015, scrollTrigger: st });
  };

  return {
    scroll,
    reveal: () => { if (mini) gsap.to(mini, { autoAlpha: radioInView ? 0 : 1, duration: 0.6 }); },
  };
}
