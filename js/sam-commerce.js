/* SAM SKIN — shared catalog, bag & product dialog (home + products page). */
(function (global) {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger) && !reduce;

  var P = {
    pure: { no: '01 / 04', name: 'Pure Form', kind: 'Gentle daily facial cleanser', size: '200 ml / 6.76 fl. oz.', line: 'The first minute of the day, kept simple.', verb: 'Cleanse', cat: 'cleanse', img: 'img/photos/pure-form.jpg', scene: 'img/photos/campaign-arch.jpg', alt: 'SAM SKIN PURE FORM gentle daily facial cleanser on a stone ledge.', sceneAlt: 'Pure Form at the cheek in morning light beside a stone arch.' },
    dew: { no: '02 / 04', name: 'Dew Elixir', kind: 'Hydrating face serum', size: '30 ml / 1.01 fl. oz.', line: 'In frosted glass, with a dropper.', verb: 'Hydrate', cat: 'hydrate', img: 'img/photos/dew-elixir.jpg', scene: 'img/photos/scene-dew.jpg', alt: 'SAM SKIN DEW ELIXIR hydrating face serum in frosted glass.', sceneAlt: 'Dew Elixir held in soft light during a hydration ritual.' },
    velvet: { no: '03 / 04', name: 'Velvet Skin', kind: 'Deep hydration cream', size: '50 ml / 1.69 fl. oz.', line: 'Shaped to sit in the hand.', verb: 'Moisturize', cat: 'moisturize', img: 'img/photos/velvet-skin.jpg', scene: 'img/photos/scene-velvet.jpg', alt: 'SAM SKIN VELVET SKIN deep hydration cream jar.', sceneAlt: 'Velvet Skin cream beside still pool water.' },
    solar: { no: '04 / 04', name: 'Solar Veil', kind: 'Daily UV fluid SPF 50+', size: '50 ml / 1.69 fl. oz.', line: 'The last step before you step out.', verb: 'Protect', cat: 'protect', img: 'img/photos/solar-veil.jpg', scene: 'img/photos/scene-solar.jpg', alt: 'SAM SKIN SOLAR VEIL daily UV fluid SPF 50+ bottle.', sceneAlt: 'Solar Veil in warm light before stepping out.' }
  };

  var SHOP = { currency: 'USD', locale: 'en-US', prices: { pure: 48, dew: 72, velvet: 64, solar: 58 } };
  var moneyFmt = new Intl.NumberFormat(SHOP.locale, { style: 'currency', currency: SHOP.currency });
  function priceOf(sku) { return SHOP.prices[sku] || 0; }
  function formatPrice(n) { return moneyFmt.format(n); }

  global.SAM_PRODUCTS = P;
  global.SAM_formatPrice = formatPrice;
  global.SAM_priceOf = priceOf;

  function initCommerce(BRAND) {
    BRAND = BRAND || { email: '', instagram: '', whatsapp: '', phone: '' };

    function paintPrice(el, sku) {
      var amt = formatPrice(priceOf(sku));
      var slot = el.querySelector('.prod__price-amt, .price-ribbon__amt');
      if (slot) slot.textContent = amt;
      else if (el.classList.contains('rp__price') || el.dataset.priceSku) el.textContent = amt;
    }
    $$('[data-price-for]').forEach(function (el) { paintPrice(el, el.dataset.priceFor); });
    $$('[data-price-ribbon]').forEach(function (el) { paintPrice(el, el.dataset.priceRibbon); });
    $$('[data-price-sku]').forEach(function (el) { paintPrice(el, el.dataset.priceSku); });

    var CART_KEY = 'sam-skin-bag-v1';
    function loadCart() { try { var raw = localStorage.getItem(CART_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
    function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
    var cart = loadCart();
    var bag = $('#bag'), bagPanel = $('#bagPanel'), bagScrim = $('#bagScrim'), bagClose = $('#bagClose'), bagList = $('#bagList'), bagEmpty = $('#bagEmpty'), hdrBag = $('#hdrBag'), bagClosing = false, bagCloseTimer = null;

    function cartCount() { return cart.reduce(function (n, x) { return n + x.qty; }, 0); }
    function cartSubtotal() { return cart.reduce(function (s, x) { return s + priceOf(x.sku) * x.qty; }, 0); }

    function renderBagList() {
      if (!cart.length) { bagList.hidden = true; bagEmpty.hidden = false; bagList.innerHTML = ''; return; }
      bagEmpty.hidden = true; bagList.hidden = false;
      bagList.innerHTML = cart.map(function (line, i) {
        var p = P[line.sku];
        if (!p) return '';
        return '<li class="bag__line" data-line="' + i + '">' +
          '<figure class="bag__thumb"><img src="' + p.img + '" width="256" height="320" loading="lazy" alt="' + p.name + '"></figure>' +
          '<div class="bag__main">' +
          '<div class="bag__line-top"><h3>' + p.name + '</h3><button type="button" class="bag__remove" data-rm="' + i + '">Remove</button></div>' +
          '<p class="bag__meta">' + p.size + '</p>' +
          '<div class="bag__line-foot">' +
          '<div class="bag__qty" role="group" aria-label="Quantity">' +
          '<button type="button" data-qty-d="' + i + '" aria-label="Decrease">−</button>' +
          '<span>' + line.qty + '</span>' +
          '<button type="button" data-qty-i="' + i + '" aria-label="Increase">+</button>' +
          '</div><p class="bag__line-price">' + formatPrice(priceOf(line.sku) * line.qty) + '</p></div></div></li>';
      }).join('');
      $$('[data-qty-d]', bagList).forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.qtyD; if (cart[i].qty > 1) cart[i].qty--; else cart.splice(i, 1); saveCart(); updateBagChrome(); renderBagList(); }); });
      $$('[data-qty-i]', bagList).forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.qtyI; cart[i].qty++; saveCart(); updateBagChrome(); renderBagList(); }); });
      $$('[data-rm]', bagList).forEach(function (b) { b.addEventListener('click', function () { cart.splice(+b.dataset.rm, 1); saveCart(); updateBagChrome(); renderBagList(); }); });
    }

    function updateBagChrome() {
      var n = cartCount(), bc = $('#bagCount'), sub = $('#bagSubtotal'), co = $('#bagCheckout'), note = $('#bagNote');
      if (bc) { bc.textContent = n || ''; bc.dataset.empty = n ? 'false' : 'true'; }
      if (sub) sub.textContent = formatPrice(cartSubtotal());
      if (co) co.disabled = !n;
      if (note) {
        if (BRAND.whatsapp) note.textContent = 'Complete your order via WhatsApp — we confirm shipping personally.';
        else if (BRAND.email) note.textContent = 'Complete your order by email — we reply with payment & delivery.';
        else note.textContent = 'Add contact details in BRAND settings to enable checkout.';
      }
      if (co) co.textContent = BRAND.whatsapp ? 'Order via WhatsApp' : BRAND.email ? 'Send order request' : 'Continue to contact';
    }

    var bagToast = $('#bagToast'), bagToastTxt = $('#bagToastTxt'), bagToastOpen = $('#bagToastOpen'), bagToastTimer = null;
    function flySource(btn) {
      if (!btn) return null;
      var card = btn.closest('[data-prod]');
      if (card) return card.querySelector('.img--product, .pg-tile__pack');
      if (btn.id === 'pdBag' || btn.closest('#prodDlg')) return $('#pdImg');
      return null;
    }
    function showBagToast(name) {
      if (!bagToast) return;
      if (bagToastTxt) bagToastTxt.textContent = name ? ' to your bag: ' + name : ' to your bag';
      bagToast.hidden = false;
      bagToast.classList.add('is-on');
      if (bagToastTimer) clearTimeout(bagToastTimer);
      bagToastTimer = window.setTimeout(function () { bagToast.classList.remove('is-on'); bagToast.hidden = true; }, 3400);
    }
    function celebrateBagAdd(sku, fromBtn) {
      var p = P[sku], bagBtn = $('#hdrBag');
      updateBagChrome();
      if (!bagBtn) return;
      showBagToast(p ? p.name : '');
      bagBtn.classList.add('is-landed');
      window.setTimeout(function () { bagBtn.classList.remove('is-landed'); }, 680);
      if (reduce || !hasG) return;
      var src = flySource(fromBtn), glyph = bagBtn.querySelector('.hdr__bag-glyph');
      if (!src || !glyph) return;
      var fr = src.getBoundingClientRect(), br = glyph.getBoundingClientRect();
      var fly = document.createElement('div');
      fly.className = 'bag-flight';
      var im = document.createElement('img');
      im.src = (p && p.img) || src.getAttribute('src');
      im.alt = '';
      fly.appendChild(im);
      document.body.appendChild(fly);
      gsap.set(fly, { left: fr.left + fr.width / 2, top: fr.top + fr.height / 2, xPercent: -50, yPercent: -50, width: Math.min(54, fr.width || 54), height: Math.min(68, fr.height || 68) });
      gsap.timeline({ onComplete: function () { fly.remove(); } })
        .to(fly, { left: br.left + br.width / 2, top: br.top + br.height / 2, width: 13, height: 16, duration: .82, ease: 'power3.inOut' })
        .to(fly, { opacity: 0, duration: .16 }, '-=.1');
      gsap.fromTo(bagBtn, { scale: 1 }, { scale: 1.06, duration: .24, yoyo: true, repeat: 1, ease: 'expo.out' });
      var bc = $('#bagCount');
      if (bc && bc.dataset.empty === 'false') {
        gsap.fromTo(bc, { scale: .35, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(2.4)' });
      }
    }
    function addToCart(sku, qty, fromBtn) {
      qty = qty || 1;
      var row = cart.find(function (x) { return x.sku === sku; });
      if (row) row.qty += qty; else cart.push({ sku: sku, qty: qty });
      saveCart(); renderBagList();
      celebrateBagAdd(sku, fromBtn);
    }

    function finishBagClose() {
      if (!bag || !bagClosing) return;
      if (bagCloseTimer) { clearTimeout(bagCloseTimer); bagCloseTimer = null; }
      bag.classList.remove('is-closing');
      bag.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-bag-open');
      bagClosing = false;
      if (global.SamChrome && global.SamChrome.updateMast) global.SamChrome.updateMast();
    }
    function openBag() {
      if (!bag || bagClosing) return;
      if (bagCloseTimer) { clearTimeout(bagCloseTimer); bagCloseTimer = null; }
      bag.classList.remove('is-closing');
      bag.classList.add('is-open');
      bag.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-bag-open');
      if (hdrBag) hdrBag.setAttribute('aria-expanded', 'true');
      if (global.SamChrome && global.SamChrome.updateMast) global.SamChrome.updateMast();
      renderBagList();
    }
    function closeBag() {
      if (!bag || !bag.classList.contains('is-open') || bagClosing) return;
      bagClosing = true;
      if (hdrBag) hdrBag.setAttribute('aria-expanded', 'false');
      bag.classList.remove('is-open');
      bag.classList.add('is-closing');
      if (global.SamChrome && global.SamChrome.updateMast) global.SamChrome.updateMast();
      if (reduce) { finishBagClose(); return; }
      if (hasG && bagPanel && bagScrim) {
        if (bagCloseTimer) clearTimeout(bagCloseTimer);
        var bagShutX = window.matchMedia('(max-width:820px)').matches ? '-102%' : '102%';
        gsap.killTweensOf([bagPanel, bagScrim]);
        gsap.timeline({
          defaults: { ease: 'power3.in' }, onComplete: function () {
            if (bagCloseTimer) { clearTimeout(bagCloseTimer); bagCloseTimer = null; }
            gsap.set(bagPanel, { clearProps: 'transform' });
            gsap.set(bagScrim, { clearProps: 'opacity' });
            finishBagClose();
          }
        })
          .to(bagPanel, { x: bagShutX, duration: .44 }, 0)
          .to(bagScrim, { opacity: 0, duration: .34 }, 0);
        bagCloseTimer = window.setTimeout(function () { if (bagClosing) finishBagClose(); }, 560);
        return;
      }
      finishBagClose();
    }
    function checkoutBag() {
      if (!cart.length) return;
      var lines = cart.map(function (x) { var p = P[x.sku]; return (p ? p.name : x.sku) + ' × ' + x.qty + ' — ' + formatPrice(priceOf(x.sku) * x.qty); });
      var text = 'Hello SAM SKIN,\n\nI would like to order:\n' + lines.join('\n') + '\n\nSubtotal: ' + formatPrice(cartSubtotal());
      if (BRAND.whatsapp) {
        var wa = BRAND.whatsapp.indexOf('http') === 0 ? BRAND.whatsapp : 'https://wa.me/' + BRAND.whatsapp.replace(/[^\d+]/g, '');
        window.open(wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        return;
      }
      if (BRAND.email) {
        location.href = 'mailto:' + BRAND.email + '?subject=' + encodeURIComponent('SAM SKIN order') + '&body=' + encodeURIComponent(text);
        return;
      }
      closeBag();
      var contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
      else location.href = 'index.html#contact';
    }

    if (hdrBag) hdrBag.addEventListener('click', function () { bag.classList.contains('is-open') ? closeBag() : openBag(); });
    if (bagScrim) bagScrim.addEventListener('click', closeBag);
    if (bagClose) bagClose.addEventListener('click', closeBag);
    var bagCo = $('#bagCheckout');
    if (bagCo) bagCo.addEventListener('click', checkoutBag);
    if (bagToastOpen) bagToastOpen.addEventListener('click', function () { if (bagToastTimer) clearTimeout(bagToastTimer); bagToast.classList.remove('is-on'); bagToast.hidden = true; openBag(); });
    $$('[data-add-cart]').forEach(function (btn) { btn.addEventListener('click', function () { addToCart(btn.dataset.addCart, 1, btn); }); });
    updateBagChrome(); renderBagList();

    var pd = $('#prodDlg'), md = $('#manDlg'), opener = null, dlgSku = null;
    function openDlg(d, from) {
      opener = from || null;
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      var cls = d.querySelector('.dlg__close');
      window.requestAnimationFrame(function () { if (d.open && cls) cls.focus(); });
    }
    function fill(k) {
      dlgSku = k;
      var p = P[k];
      if ($('#pdNo')) $('#pdNo').textContent = p.no;
      if ($('#pdName')) $('#pdName').textContent = p.name;
      if ($('#pdLine')) $('#pdLine').textContent = p.line;
      if ($('#pdKind')) $('#pdKind').textContent = p.kind;
      if ($('#pdSize')) $('#pdSize').textContent = p.size;
      if ($('#pdVerb')) $('#pdVerb').textContent = p.verb;
      var im = $('#pdImg');
      if (im) { im.src = p.scene || p.img; im.alt = p.sceneAlt || p.alt; im.className = p.scene ? 'img--campaign' : 'img--product'; }
      var pr = $('#pdPrice');
      if (pr) pr.textContent = formatPrice(priceOf(k));
    }
    $$('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () { if (!pd) return; fill(b.dataset.open); openDlg(pd, b); });
    });
    var pdBag = $('#pdBag');
    if (pdBag) pdBag.addEventListener('click', function () { if (!dlgSku) return; addToCart(dlgSku, 1, pdBag); if (pd) pd.close(); });
    var manifesto = $('[data-manifesto]');
    if (manifesto && md) manifesto.addEventListener('click', function (e) { openDlg(md, e.currentTarget); });
    [[pd, '#pdClose'], [md, '#mdClose']].forEach(function (x) {
      var dlg = x[0], btn = $(x[1]);
      if (!dlg || !btn) return;
      btn.addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', function () { if (opener && typeof opener.focus === 'function') opener.focus(); });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); dlg.close(); });
    });
    var pdRit = $('#pdRit');
    if (pdRit) pdRit.addEventListener('click', function () { if (pd) pd.close(); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (pd && pd.open) { pd.close(); return; }
      if (md && md.open) { md.close(); return; }
      if (bag && (bag.classList.contains('is-open') || bag.classList.contains('is-closing'))) closeBag();
    });

    global.SAM_addToCart = addToCart;
  }

  global.SamCommerce = { init: initCommerce, catalog: P, formatPrice: formatPrice, priceOf: priceOf };
})(window);
