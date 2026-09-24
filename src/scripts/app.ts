import { ScrollTrigger } from './core';
import { initSmooth, stopScroll, startScroll } from './smooth';
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

async function main() {
  window.scrollTo(0, 0);
  initSmooth();
  stopScroll();
  initFx();
  initPlayer();
  const music = initMusic();
  const hero = initHero();

  await runLoader();
  startScroll();

  // scroll-driven sections, created top-to-bottom so pin spacing is measured in order
  initMarquee();
  initAbout();
  initModels();
  initJourney();
  initWait();
  initComeback();
  music.scroll();
  const library = initVideos();
  initLetter();
  initReveals();
  initNav();
  ScrollTrigger.refresh();

  await hero.intro();
  music.reveal();
  loadLatest((v) => library.addLatest(v));
}

main();

// fonts & late images can shift layout: re-measure once everything has settled
window.addEventListener('load', () => ScrollTrigger.refresh());
