// カテゴリー絞り込み。カードの表示だけを変更する。
const filters = [...document.querySelectorAll('[data-filter]')];
const portfolioCards = [...document.querySelectorAll('[data-category]')];
function selectCategory(category) {
  if (!filters.some(button => button.dataset.filter === category)) category = 'すべて';
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  let count = 0;
  portfolioCards.forEach(card => {
    card.hidden = category !== 'すべて' && card.dataset.category !== category;
    if (!card.hidden) count++;
  });
  const status = document.querySelector('#filter-status');
  if (status) status.textContent = `${category}：${count}件`;
  const empty = document.querySelector('.filter-empty');
  if (empty) empty.hidden = count !== 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  const url = new URL(location.href);
  if (category === 'すべて') url.searchParams.delete('category');
  else url.searchParams.set('category', category);
  history.replaceState(null, '', url);
  selectCategory(category);
}));
if (filters.length) selectCategory(new URL(location.href).searchParams.get('category') || 'すべて');

// 複数画像だけに表示する手動スライダー。タイマーや自動再生は使用しない。
document.querySelectorAll('.work-gallery').forEach(gallery => {
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  if (slides.length < 2) return;
  const dots = [...gallery.querySelectorAll('.gallery-dot')];
  let index = 0;
  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    gallery.querySelector('.gallery-status').textContent = `${slides.length}枚中${index + 1}枚目`;
  }
  gallery.querySelector('.gallery-prev').addEventListener('click', () => show(index - 1));
  gallery.querySelector('.gallery-next').addEventListener('click', () => show(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
});
