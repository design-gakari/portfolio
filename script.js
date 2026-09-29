// 公開先のURLが決まり次第、空文字を実際のURLに変更してください。
const links = {
  works: 'works.html',
  service: '',
  workMenu: 'work-wedding-menu.html',
  workConcert: 'work-piano-concert.html',
  workWebsite: 'work-illustrator-website.html',
  workProgram: 'work-concert-program-2025.html',
  line: '',
  form: '',
  x: '',
  instagram: '',
  litlink: ''
};

// ── 全画面メニューとキーボード操作 ──
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const menuBackground = [...document.querySelectorAll('main, footer, .header > .brand')];
let menuClosing = false;
async function closeMenu(restoreFocus = true) {
  if (navigation.hidden || menuClosing) return;
  menuClosing = true;
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
  const fade = navigation.animate(
    [{ opacity: getComputedStyle(navigation).opacity }, { opacity: 0 }],
    { duration, easing: 'ease-out', fill: 'forwards' }
  );
  await fade.finished;
  navigation.hidden = true;
  fade.cancel();
  menuClosing = false;
  document.documentElement.classList.remove('menu-open');
  menuBackground.forEach(element => {
    element.inert = false;
  });
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'メニューを開く');
  if (restoreFocus && !matchMedia('(min-width:1024px)').matches) toggle.focus();
}
function openMenu() {
  navigation.hidden = false;
  document.documentElement.classList.add('menu-open');
  menuBackground.forEach(element => {
    element.inert = true;
  });
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'メニューを閉じる');
  navigation.querySelector('a').focus();
}
toggle.addEventListener('click', () => {
  if (navigation.hidden) {
    openMenu();
  } else {
    closeMenu();
  }
});
navigation.addEventListener('click', async event => {
  const link = event.target.closest('a');
  if (!link) return;
  event.preventDefault();
  if (menuClosing) return;
  await closeMenu(false);
  const destination = new URL(link.href, location.href);
  if (destination.pathname !== location.pathname || !destination.hash) {
    location.href = destination.href;
    return;
  }
  const target = document.getElementById(destination.hash.slice(1));
  if (target) {
    history.pushState(null, '', destination.hash);
    target.scrollIntoView();
    fadeInMenuContent(target);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }
});
document.addEventListener('keydown', event => {
  if (navigation.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
  }
  if (event.key === 'Tab') {
    const controls = [toggle, ...navigation.querySelectorAll('a, button')];
    const current = controls.indexOf(document.activeElement);
    event.preventDefault();
    controls[(current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
  }
});
// ── 未設定リンクの案内 ──
const notice = document.querySelector('#link-notice');
document.querySelectorAll('[data-link]').forEach(button => {
  const url = links[button.dataset.link];
  if (url && button.tagName === 'A') {
    button.href = url;
  } else if (url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.className = button.className;
    anchor.innerHTML = button.innerHTML;
    if (button.hasAttribute('aria-label')) anchor.setAttribute('aria-label', button.getAttribute('aria-label'));
    button.replaceWith(anchor);
  } else {
    button.addEventListener('click', event => {
      event.preventDefault();
      notice.showModal();
    });
  }
});
document.querySelector('#close-notice').addEventListener('click', () => notice.close());

// PC表示への切替時は、モバイルメニューのスクロールロックを解除する。
matchMedia('(min-width:1024px)').addEventListener('change', event => {
  if (event.matches && !navigation.hidden) closeMenu(false);
});

// 実際のヘッダー高に合わせ、ページ内リンクの移動位置を調整。
const stickyHeader = document.querySelector('.header');
function updateHeaderOffset() {
  document.documentElement.style.setProperty('--header-offset', `${stickyHeader.getBoundingClientRect().height + 16}px`);
}
new ResizeObserver(updateHeaderOffset).observe(stickyHeader);
updateHeaderOffset();

// メニューから移動したセクションだけをフェードインする。
const sectionFades = new WeakMap();
function fadeInMenuContent(target) {
  sectionFades.get(target)?.cancel();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const animation = target.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 550,
    easing: 'ease-out'
  });
  sectionFades.set(target, animation);
}
document.querySelector('.desktop-navigation').addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  const destination = new URL(link.href, location.href);
  if (destination.pathname !== location.pathname || !destination.hash) return;
  const target = document.getElementById(destination.hash.slice(1));
  if (target) fadeInMenuContent(target);
});

// 制作実績カードは初めて画面に入ったときだけ、下からフェードイン。
(() => {
  const cards = [...document.querySelectorAll('body:not(.portfolio-page) .work-card')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold: .12 });
  cards.forEach(card => {
    card.classList.add('reveal-card');
    observer.observe(card);
    card.addEventListener('focus', () => {
      card.classList.add('is-revealed');
      observer.unobserve(card);
    });
  });
  motion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      cards.forEach(card => card.classList.add('is-revealed'));
    }
  });
})();

// サービスカードは位置を動かさず、画面に入った順に不透明度だけを変える。
(() => {
  const cards = [...document.querySelectorAll('.service-card')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  let nextStart = 0;
  const observer = new IntersectionObserver(entries => {
    const entering = entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => cards.indexOf(a.target) - cards.indexOf(b.target));
    for (const entry of entering) {
      const now = performance.now();
      const start = Math.max(now, nextStart);
      entry.target.style.setProperty('--service-reveal-delay', `${start - now}ms`);
      entry.target.classList.add('is-revealed');
      nextStart = start + 200;
      observer.unobserve(entry.target);
    }
  }, { threshold: .12 });
  cards.forEach(card => {
    card.classList.add('service-reveal');
    observer.observe(card);
  });
  motion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      cards.forEach(card => card.classList.add('is-revealed'));
    }
  });
})();

// 追従ヘッダー内のアンカー位置に依存せず、サイト名から最上部へ戻る。
document.querySelectorAll('.header > .brand, .footer > .brand').forEach(link => {
  link.addEventListener('click', event => {
    const destination = new URL(link.href, location.href);
    if (destination.pathname !== location.pathname) return;
    event.preventDefault();
    history.pushState(null, '', '#top');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const brand = document.querySelector('.header > .brand');
    brand.focus({ preventScroll: true });
  });
});

// 初期の途中位置表示やブラウザのスクロール復元にも対応。
function updateHeaderBackground() {
  stickyHeader.classList.toggle('is-scrolled', window.scrollY > 0);
}
window.addEventListener('scroll', updateHeaderBackground, { passive: true });
window.addEventListener('pageshow', updateHeaderBackground);
updateHeaderBackground();
