/* XMTP — maquette · interactions légères, sans dépendance */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  };

  /* ---------- En-tête : ombre au scroll ---------- */
  var header = $('.site-header');
  var onScroll = function () { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = $('.nav-toggle');
  var nav = $('#nav');
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav-toggle__label').textContent = open ? 'Fermer' : 'Menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); });
  }

  /* ---------- Toast pour les pages hors maquette ---------- */
  var toast;
  function showToast(msg) {
    if (!toast) {
      toast = document.createElement('div');
      toast.setAttribute('role', 'status');
      toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);z-index:160;background:#15171A;color:#fff;padding:12px 18px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 12px 32px rgba(0,0,0,.25);opacity:0;transition:all .3s;max-width:calc(100vw - 32px);text-align:center;border-left:4px solid #F2CC00';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    requestAnimationFrame(function () { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%)'; });
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(20px)'; }, 2800);
  }
  $$('[data-soon]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); showToast(el.getAttribute('data-soon') || 'Disponible dans le site final.'); });
  });

  /* ---------- Filtres machines ---------- */
  var filterBtns = $$('[data-filter]');
  var cards = $$('[data-tags]');
  function applyFilter(f) {
    filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === f)); });
    cards.forEach(function (c) { c.hidden = !(f === 'tout' || c.getAttribute('data-tags').split(' ').indexOf(f) > -1); });
    var grid = $('.machines--scroll'); if (grid) grid.scrollLeft = 0;
  }
  filterBtns.forEach(function (b) {
    var f = b.getAttribute('data-filter');
    var count = f === 'tout' ? cards.length : cards.filter(function (c) { return c.getAttribute('data-tags').split(' ').indexOf(f) > -1; }).length;
    var span = b.querySelector('.chip__count'); if (span) span.textContent = count;
    b.addEventListener('click', function () { applyFilter(f); });
  });
  $$('[data-set-filter]').forEach(function (a) {
    a.addEventListener('click', function () { applyFilter(a.getAttribute('data-set-filter')); });
  });

  /* ---------- Onglets (location) ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Horaires : jour courant + ouvert/fermé (heure locale) ---------- */
  var hours = { 1: [[8, 12], [14, 18]], 2: [[8, 12], [14, 18]], 3: [[8, 12], [14, 18]], 4: [[8, 12], [14, 18]], 5: [[8, 12], [14, 17]] };
  var now = new Date(), day = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  $$('.hours [data-day]').forEach(function (row) {
    if (row.getAttribute('data-day').split(',').indexOf(String(day)) > -1) row.classList.add('is-today');
  });
  $$('.open-state').forEach(function (el) {
    var open = (hours[day] || []).some(function (r) { return h >= r[0] && h < r[1]; });
    el.classList.toggle('is-open', open);
    el.textContent = open ? 'Ouvert en ce moment' : 'Fermé en ce moment';
  });

  /* ---------- Carte : chargement sur clic (aucun tiers avant consentement) ---------- */
  $$('[data-load-map]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var map = btn.closest('.map');
      var iframe = document.createElement('iframe');
      iframe.title = 'Carte d’accès à XMTP, ZI La Garosse, Saint-André-de-Cubzac';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer';
      iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=-0.4588%2C44.9990%2C-0.3988%2C45.0250&layer=mapnik&marker=45.01205%2C-0.42879';
      map.appendChild(iframe);
      var ph = $('.map__placeholder', map); if (ph) ph.remove();
    });
  });

  /* ---------- Formulaires (front uniquement) ---------- */
  $$('form[data-demo-form]').forEach(function (form) {
    var success = document.getElementById(form.getAttribute('data-success'));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('was-validated');
      if (!form.checkValidity()) {
        var first = form.querySelector(':invalid');
        if (first) first.focus();
        return;
      }
      form.hidden = true;
      if (success) {
        success.classList.add('is-visible');
        var t = success.querySelector('h4'); if (t) { t.tabIndex = -1; t.focus(); }
      }
    });
    if (success) {
      var again = success.querySelector('[data-reset]');
      if (again) again.addEventListener('click', function () {
        form.reset(); form.classList.remove('was-validated'); form.hidden = false;
        success.classList.remove('is-visible'); syncType(form);
        var f = form.querySelector('input, select, textarea'); if (f) f.focus();
      });
    }
    $$('input[name="type"]', form).forEach(function (r) { r.addEventListener('change', function () { syncType(form); }); });
    syncType(form);
  });
  function syncType(form) {
    var dates = form.querySelector('.dates');
    if (!dates) return;
    var checked = form.querySelector('input[name="type"]:checked');
    var isRent = checked && checked.value === 'location';
    dates.hidden = !isRent;
    $$('input', dates).forEach(function (i) { i.required = isRent; });
  }
  // Pré-sélection du motif depuis un lien (ex. « Demander une pièce »)
  $$('[data-preset]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = $('#c-motif'); if (sel) sel.value = a.getAttribute('data-preset');
    });
  });
  // Date de début : pas avant aujourd'hui
  var today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $$('input[type="date"]').forEach(function (i) { i.min = today; });
  var start = $('#q-debut'), end = $('#q-fin');
  if (start && end) start.addEventListener('change', function () { end.min = start.value || today; });

  /* ---------- Galerie fiche machine ---------- */
  var main = $('#gallery-main');
  if (main) {
    var label = $('#gallery-label'), count = $('#gallery-count');
    var thumbs = $$('.thumb[data-src]');
    thumbs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        thumbs.forEach(function (x) { x.setAttribute('aria-current', String(x === t)); });
        main.style.opacity = '0';
        setTimeout(function () {
          main.src = t.getAttribute('data-src');
          main.alt = t.getAttribute('data-alt');
          main.className = t.getAttribute('data-class') || '';
          label.textContent = t.getAttribute('data-label');
          count.textContent = (i + 1) + ' / ' + thumbs.length;
          main.style.opacity = '1';
        }, 150);
      });
    });
  }

  /* ---------- CTA collant mobile (fiche machine) ---------- */
  var sticky = $('.sticky-cta');
  if (sticky && 'IntersectionObserver' in window) {
    document.body.classList.add('has-sticky-cta');
    var trigger = $('#product-ctas'), target = $('#devis');
    var pastTrigger = false, atForm = false;
    var update = function () { sticky.classList.toggle('is-visible', pastTrigger && !atForm); };
    new IntersectionObserver(function (en) { pastTrigger = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; update(); }).observe(trigger);
    new IntersectionObserver(function (en) { atForm = en[0].isIntersecting; update(); }, { threshold: 0.15 }).observe(target);
  }

  /* ---------- Bandeau cookies (RGPD, choix égal accepter / refuser) ---------- */
  var cookie = $('#cookie');
  if (cookie) {
    var KEY = 'xmtp-maquette-consent';
    var show = function () { cookie.hidden = false; requestAnimationFrame(function () { cookie.classList.add('is-visible'); }); };
    var hide = function () { cookie.classList.remove('is-visible'); setTimeout(function () { cookie.hidden = true; }, 350); };
    if (!store.get(KEY)) setTimeout(show, 600);
    cookie.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cookie]'); if (!b) return;
      var a = b.getAttribute('data-cookie');
      if (a === 'custom') { cookie.classList.add('show-prefs'); return; }
      var val = a === 'accept' ? 'all' : a === 'refuse' ? 'none' : JSON.stringify({ audience: $('#ck-audience').checked, tiers: $('#ck-tiers').checked });
      store.set(KEY, val);
      hide();
      showToast(a === 'refuse' ? 'Choix enregistré : cookies refusés.' : 'Préférences enregistrées.');
    });
    $$('[data-open-cookies]').forEach(function (b) { b.addEventListener('click', function () { cookie.classList.remove('show-prefs'); show(); }); });
  }

  /* ---------- Année ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
