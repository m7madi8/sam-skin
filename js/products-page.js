/* SAM SKIN — products page: filters, count, scroll reveals. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger) && !reduce;
  if (hasG) gsap.registerPlugin(ScrollTrigger);

  var grid = document.getElementById('pgGrid');
  var countEl = document.getElementById('pgCount');
  var tiles = grid ? Array.prototype.slice.call(grid.querySelectorAll('[data-prod]')) : [];
  var filters = document.querySelectorAll('[data-pg-filter]');
  var active = 'all';

  function visibleCount() {
    return tiles.filter(function (t) { return !t.classList.contains('is-hidden'); }).length;
  }
  function setCount() {
    if (!countEl) return;
    var n = visibleCount();
    countEl.textContent = n === 1 ? '1 object' : n + ' objects';
  }

  function applyFilter(cat) {
    active = cat;
    filters.forEach(function (b) {
      var on = b.dataset.pgFilter === cat;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    tiles.forEach(function (tile) {
      var show = cat === 'all' || tile.dataset.cat === cat;
      tile.classList.toggle('is-hidden', !show);
      tile.setAttribute('aria-hidden', show ? 'false' : 'true');
    });
    setCount();
    if (grid && window.matchMedia('(max-width:820px)').matches) {
      grid.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (hasG && !reduce) {
      var shown = tiles.filter(function (t) { return !t.classList.contains('is-hidden'); });
      gsap.fromTo(shown, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'expo.out', clearProps: 'transform' });
    }
  }

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.dataset.pgFilter); });
  });
  setCount();

  document.documentElement.classList.add('js');
  if (hasG) {
    gsap.from('[data-pg-intro] > *', { y: 28, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.05 });
    gsap.from('.pg-intro__figure', { clipPath: 'inset(0 0 100% 0)', duration: 1.35, ease: 'expo.out', delay: 0.12 });
    tiles.forEach(function (tile, i) {
      var vis = tile.querySelector('.pg-tile__visual');
      gsap.from(vis, {
        clipPath: 'inset(0 0 100% 0)', duration: 1.2, delay: i * 0.05, ease: 'expo.out',
        scrollTrigger: { trigger: tile, start: 'top 88%', once: true }
      });
    });
    gsap.from('.pg-close__grid > *', {
      y: 36, opacity: 0, duration: 1.15, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.pg-close', start: 'top 82%', once: true }
    });
  }

  SamChromeInit({ forceNav: 'collection' });
  SamCommerce.init();
})();
