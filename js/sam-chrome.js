/* SAM SKIN — fixed header, vestibule menu & scroll-aware masthead. */
(function (global) {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger) && !reduce;

  function initChrome(opts) {
    opts = opts || {};
    var BRAND = opts.brand || { email: '', instagram: '', whatsapp: '', phone: '' };
    var onProducts = /products\.html$/i.test(location.pathname);
    var scrollIds = opts.scrollIds || (onProducts ? ['pg-intro', 'pg-gallery', 'pg-close', 'contact'] : ['top', 'collection', 'philosophy', 'ritual', 'campaign', 'finale', 'contact']);
    var forceNav = opts.forceNav || (onProducts ? 'collection' : null);

    if (BRAND.email) { var c = $('#ftContact'); if (c) { var a = document.createElement('a'); a.href = 'mailto:' + BRAND.email; a.textContent = BRAND.email; c.replaceWith(a); } }
    if (BRAND.instagram) {
      var i = $('#ftInsta');
      if (i) { var b = document.createElement('a'); b.href = BRAND.instagram; b.target = '_blank'; b.rel = 'noopener'; b.textContent = 'Instagram'; i.replaceWith(b); }
      var vi = $('#vestInsta');
      if (vi) { vi.href = BRAND.instagram; vi.target = '_blank'; vi.rel = 'noopener'; }
    }
    if (BRAND.whatsapp) {
      var vw = $('#vestWa');
      if (vw) { vw.href = BRAND.whatsapp.indexOf('http') === 0 ? BRAND.whatsapp : 'https://wa.me/' + BRAND.whatsapp.replace(/[^\d+]/g, ''); vw.target = '_blank'; vw.rel = 'noopener'; }
    }
    if (BRAND.phone) {
      var vp = $('#vestPhone');
      if (vp) vp.href = 'tel:' + BRAND.phone.replace(/[^\d+]/g, '');
    }

    var hdr = $('#hdr'), scrollGate = 56, hdrTick = false;
    function barCenterY() { return hdr.querySelector('.hdr__bar').getBoundingClientRect().bottom - 2; }

    function updateMast() {
      var y = window.scrollY, sheet = $('#sheet'), open = sheet && sheet.classList.contains('is-open');
      var bagEl = $('#bag'), bagOpen = bagEl && (bagEl.classList.contains('is-open') || bagEl.classList.contains('is-closing'));
      hdr.classList.toggle('is-top', y < scrollGate && !open && !bagOpen);
      hdr.classList.toggle('is-solid', y >= scrollGate || open || bagOpen);
      var probe = barCenterY(), onDark = false;
      $$('[data-tone="dark"]').forEach(function (s) {
        var r = s.getBoundingClientRect();
        var off = s.classList.contains('fin') || s.classList.contains('pg-close') ? Math.min(128, window.innerWidth * .08) + 24 : 0;
        if (r.top + off <= probe && r.bottom >= probe) onDark = true;
      });
      hdr.classList.toggle('on-dark', onDark);
      var links = $$('[data-nav]');
      if (forceNav) {
        links.forEach(function (a) { a.classList.toggle('is-current', a.dataset.nav === forceNav); });
        $$('[data-vest-link]').forEach(function (a) {
          if (!a.dataset.nav) return;
          a.classList.toggle('is-current', a.dataset.nav === forceNav);
        });
        return;
      }
      var cur = scrollIds[0] || 'top';
      scrollIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.top <= barCenterY() + 80 && r.bottom > barCenterY()) cur = id === 'finale' ? 'contact' : id;
      });
      var map = { top: '', philosophy: 'philosophy', collection: 'collection', ritual: 'ritual', contact: 'contact', 'pg-intro': 'collection', 'pg-gallery': 'collection' };
      links.forEach(function (a) { a.classList.toggle('is-current', map[cur] && a.dataset.nav === map[cur]); });
      $$('[data-vest-link]').forEach(function (a) {
        if (!a.dataset.nav) return;
        a.classList.toggle('is-current', map[cur] && a.dataset.nav === map[cur]);
      });
    }
    window.addEventListener('scroll', function () {
      if (hdrTick) return; hdrTick = true;
      requestAnimationFrame(function () { updateMast(); hdrTick = false; });
    }, { passive: true });
    updateMast();

    var sheet = $('#sheet'), mb = $('#menuBtn'), scrim = $('#menuScrim'), slab = $('[data-vestibule-slab]'), vestHall = $('.vestibule__hall');
    var vestLinks = $$('[data-vest-link]'), vestNavLinks = $$('.vestibule__nav a[data-vest-link]'), vestCh = $$('[data-vest-chamber]'), vestFoot = $('[data-vest-threshold]');
    var menuTL = null, menuBusy = false, menuBackdropUntil = 0;
    var menuIn = 'power3.out', menuOut = 'power2.in';

    if (!mb || !sheet) { global.SamChrome = { updateMast: updateMast }; return; }

    function setMenuAria(open) { mb.setAttribute('aria-expanded', open ? 'true' : 'false'); mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    function resetVestAnim() {
      if (!hasG) return;
      gsap.set(slab, { clearProps: 'transform' });
      gsap.set(scrim, { clearProps: 'opacity' });
      if (vestHall) gsap.set(vestHall, { clearProps: 'opacity' });
      gsap.set(vestNavLinks, { clearProps: 'all' });
      gsap.set(vestCh, { clearProps: 'all' });
      if (vestFoot) gsap.set(vestFoot, { clearProps: 'all' });
    }
    function openMenu() {
      if (menuBusy || sheet.classList.contains('is-open')) return;
      menuBusy = true;
      menuBackdropUntil = Date.now() + 360;
      if (menuTL) { menuTL.kill(); menuTL = null; }
      sheet.hidden = false;
      sheet.classList.add('is-open');
      setMenuAria(true);
      document.body.classList.add('is-menu-open');
      updateMast();
      if (reduce) {
        if (hasG) {
          gsap.set(slab, { x: '0%' });
          gsap.set(scrim, { opacity: 1 });
          gsap.set(vestNavLinks, { opacity: 1, y: 0 });
          gsap.set(vestCh, { opacity: 1, y: 0 });
          if (vestFoot) gsap.set(vestFoot, { opacity: 1, y: 0 });
        }
        menuBusy = false;
        mb.focus({ preventScroll: true });
        return;
      }
      if (hasG) {
        gsap.set(slab, { x: '100%' });
        gsap.set(scrim, { opacity: 0 });
        if (vestHall) gsap.set(vestHall, { opacity: 1 });
        gsap.set(vestNavLinks, { opacity: 0, y: 10 });
        gsap.set(vestCh, { opacity: 0, y: 8 });
        if (vestFoot) gsap.set(vestFoot, { opacity: 0, y: 12 });
        menuTL = gsap.timeline({ defaults: { ease: menuIn }, onComplete: function () { menuBusy = false; mb.focus({ preventScroll: true }); } });
        menuTL.to(scrim, { opacity: 1, duration: .28 }, 0)
          .to(slab, { x: '0%', duration: .38, ease: menuIn }, 0)
          .to(vestNavLinks, { opacity: 1, y: 0, duration: .32, stagger: .04 }, 0.08)
          .to(vestCh, { opacity: 1, y: 0, duration: .28, stagger: .05 }, 0.1)
          .to(vestFoot, { opacity: 1, y: 0, duration: .3 }, 0.12);
      } else {
        scrim.style.opacity = '1';
        menuBusy = false;
        mb.focus({ preventScroll: true });
      }
    }
    function closeMenu() {
      if (menuBusy || !sheet.classList.contains('is-open')) return;
      menuBusy = true;
      menuBackdropUntil = Date.now() + 320;
      if (menuTL) { menuTL.kill(); menuTL = null; }
      function doneClose() {
        sheet.classList.remove('is-open');
        setMenuAria(false);
        document.body.classList.remove('is-menu-open');
        mb.focus();
        updateMast();
        resetVestAnim();
        scrim.style.opacity = '';
        menuBusy = false;
        window.setTimeout(function () { if (!sheet.classList.contains('is-open')) sheet.hidden = true; }, 60);
      }
      if (reduce) { doneClose(); return; }
      if (hasG) {
        menuTL = gsap.timeline({ defaults: { ease: menuOut }, onComplete: doneClose });
        menuTL.to(vestNavLinks, { opacity: 0, y: 6, duration: .2, stagger: .02 }, 0)
          .to(vestCh, { opacity: 0, duration: .18 }, 0)
          .to(vestFoot, { opacity: 0, y: 8, duration: .2 }, 0)
          .to(slab, { x: '100%', duration: .32, ease: menuOut }, 0.04)
          .to(scrim, { opacity: 0, duration: .24 }, 0.08);
      } else { doneClose(); }
    }
    function onBackdropClose(e) {
      if (Date.now() < menuBackdropUntil) { e.preventDefault(); e.stopPropagation(); return; }
      closeMenu();
    }
    mb.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuBusy) return;
      sheet.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    scrim.addEventListener('click', onBackdropClose);
    vestLinks.forEach(function (a) { a.addEventListener('click', function () { if (!menuBusy) closeMenu(); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('is-open')) { closeMenu(); return; }
      if (e.key === 'Tab' && sheet.classList.contains('is-open')) {
        var f = $$('.vestibule__hall a[href]');
        if (!f.length) return;
        var nodes = [mb].concat(f), first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus({ preventScroll: true }); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus({ preventScroll: true }); }
      }
    });

    global.SamChrome = { updateMast: updateMast };
  }

  global.SamChromeInit = initChrome;
})(window);
