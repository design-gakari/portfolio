// トップ専用。画像は加工せず、現在の位置に一度だけ登場させる。
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || !Element.prototype.animate) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  // ページ内リンクやスクロール復元で途中から開く場合は即表示。
  if ((location.hash && location.hash !== '#top') || window.scrollY > 24) return;

  const art = hero.querySelector('.hero-art');
  const images = ['.hero-person', '.hero-books', '.hero-vase', '.hero-coffee']
    .map(selector => hero.querySelector(selector));
  const leaf = hero.querySelector('.hero-leaf');
  if (!art || images.some(image => !image) || !leaf) return;

  let ready = false;
  let started = false;
  let stopped = false;
  let frame = 0;
  let observer;
  let menuObserver;
  let readyTimer;
  let sequenceTimer;
  const animations = [];
  const earliestStart = performance.now() + 600;
  const header = document.querySelector('.header');
  const menu = document.querySelector('#navigation');

  function detach() {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', schedule);
    cancelAnimationFrame(frame);
    observer?.disconnect();
    menuObserver?.disconnect();
    clearTimeout(readyTimer);
    clearTimeout(sequenceTimer);
  }

  function finish() {
    stopped = true;
    detach();
    hero.classList.remove('intro-art-pending', 'intro-copy-playing');
    animations.forEach(animation => animation.cancel());
  }

  function play() {
    if (started || stopped) return;
    started = true;
    detach();
    const small = matchMedia('(max-width:600px)').matches;
    const duration = small ? 440 : 540;
    const gap = small ? 100 : 140;
    try {
      images.forEach((image, index) => {
        animations.push(image.animate([
          { opacity: 0, transform: `translateY(${small ? 6 : 12}px)` },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration, delay: index * gap, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }));
      });
      // 葉の既存の傾きは維持し、不透明度だけを変更。
      animations.push(leaf.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 360, delay: 3 * gap + 100, easing: 'ease-out', fill: 'both'
      }));
      hero.classList.remove('intro-art-pending');
      Promise.all(animations.map(animation => animation.finished))
        .then(() => animations.forEach(animation => animation.cancel()))
        .catch(finish);
    } catch {
      finish();
    }
  }

  function check() {
    frame = 0;
    if (stopped || started || !ready || document.hidden) return;
    if (menu && !menu.hidden) return;
    const topLimit = Math.max(0, header?.getBoundingClientRect().bottom || 0) + 12;
    const bottomLimit = window.innerHeight - 16;
    const bounds = images.map(image => image.getBoundingClientRect());
    const top = Math.min(...bounds.map(rect => rect.top));
    const bottom = Math.max(...bounds.map(rect => rect.bottom));
    // 素早いスクロールで通過したときにも、画像を非表示のまま残さない。
    if (bottom <= topLimit) {
      finish();
      return;
    }
    const available = bottomLimit - topLimit;
    if (available <= 0) return;
    const visible = Math.max(0, Math.min(bottom, bottomLimit) - Math.max(top, topLimit));
    const height = bottom - top;
    // 通常は小物の下端まで入ってから。横向き等では可視範囲に合わせる。
    const enough = height <= available
      ? bottom <= bottomLimit && visible >= height * .72
      : visible >= available * .78;
    if (!enough) return;
    const remaining = earliestStart - performance.now();
    if (remaining > 0) {
      clearTimeout(sequenceTimer);
      sequenceTimer = setTimeout(schedule, remaining);
      return;
    }
    play();
  }

  function schedule() {
    if (!stopped && !started && !frame) frame = requestAnimationFrame(check);
  }

  hero.classList.add('intro-copy-playing', 'intro-art-pending');
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  if ('ResizeObserver' in window) {
    observer = new ResizeObserver(schedule);
    [hero, art, ...images].forEach(element => observer.observe(element));
  }
  if (menu) {
    menuObserver = new MutationObserver(schedule);
    menuObserver.observe(menu, { attributes: true, attributeFilter: ['hidden'] });
  }
  motion.addEventListener('change', event => {
    if (event.matches) finish();
  });
  window.addEventListener('pagehide', finish, { once: true });
  window.addEventListener('pageshow', event => {
    if (event.persisted || window.scrollY > 24) finish();
  });
  // 回線や画像のエラーで表示を待ち続けない。
  readyTimer = setTimeout(finish, 2200);
  Promise.all([...images, leaf].map(image => image.decode()))
    .then(() => {
      if (stopped) return;
      clearTimeout(readyTimer);
      ready = true;
      schedule();
    }).catch(finish);
})();
