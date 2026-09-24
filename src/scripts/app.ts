import { gsap, ScrollTrigger } from './core';
import { initSmooth, stopScroll, startScroll, resetScroll } from './smooth';
import { initFx } from './fx';
import { runLoader } from './loader';
import { initHero } from './hero';
import { initReveals, initMarquee, initAbout, initModels, initJourney } from './sections';
import { initWait, initComeback } from './story';
import { initVideos } from './videos';
import { initLetter } from './letter';
import { initNav } from './nav';
import { initPlayer } from './player';
import { initMusic } from './music';
import { loadLatest } from './latest';

/** run one part of the page; if it throws, log it and keep going instead of taking the whole page down */
function safe<T>(name: string, fn: () => T): T | undefined {
  try {
    return fn();
  } catch (err) {
    console.error(`[peachi] ${name} failed`, err);
    return undefined;
  }
}

async function main() {
  window.scrollTo(0, 0);
  initSmooth();
  stopScroll();
  safe('fx', initFx);
  safe('player', initPlayer);
  const music = safe('music', initMusic);
  // builds the (paused) hero entrance, so the loader reveals its first frame
  const hero = safe('hero', initHero);
  let library: ReturnType<typeof initVideos> | undefined;
  let nav: ReturnType<typeof initNav> | undefined;

  await runLoader({
    // everything scroll-driven is created while the loader still covers the page, measured from the very
    // top, in page order so pin spacing above each section is already known
    beforeOpen: () => {
      resetScroll();
      safe('hero scroll', () => hero?.scroll());
      safe('marquee', initMarquee);
      safe('about', initAbout);
      safe('models', initModels);
      safe('journey', initJourney);
      safe('wait', initWait);
      safe('comeback', initComeback);
      safe('music scroll', () => music?.scroll());
      library = safe('videos', initVideos);
      safe('letter', initLetter);
      safe('reveals', initReveals);
      nav = safe('nav', initNav);
      ScrollTrigger.refresh();
    },
    // the entrance starts as the loader irises open
    onOpen: () => {
      hero?.intro().catch((err) => console.error('[peachi] hero intro failed', err));
      gsap.delayedCall(1.6, () => nav?.reveal());
    },
  });
  startScroll();
  loadLatest((v) => library?.addLatest(v));
}

main();

// fonts & late images can shift layout: re-measure once everything has settled
window.addEventListener('load', () => ScrollTrigger.refresh());
