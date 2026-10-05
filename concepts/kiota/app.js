/* ============================================================================
   Kiota Studio (Storyfront concept) - shared behaviour. Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '254769968444'; // concept: booking messages reach Storyfront
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Hi Storyfront, this came from a button on the Kiota Studio concept:\n\n' + text);
  }

  /* ---------------------------------------------------------- splash ----- */
  var splash = $('.splash');
  function finishSplash() {
    document.body.classList.add('is-ready');
    if (splash) {
      setTimeout(function () {
        splash.classList.add('done');
        setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 700);
      }, reduced ? 0 : 620);
    }
  }
  if (document.readyState === 'complete') finishSplash();
  else window.addEventListener('load', finishSplash);
  // Safety net so the splash can never trap the page if an asset stalls.
  setTimeout(finishSplash, 3500);

  /* ------------------------------------------------- header + mobile nav -- */
  var header = $('.site-header');
  var burger = $('.burger');
  var mnav = $('.mobile-nav');
  var lastY = window.pageYOffset;
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    if (header) {
      header.classList.toggle('at-top', y < 12);
      // Reappears on any upward scroll, from anywhere on the page.
      if (!mnav || !mnav.classList.contains('open')) {
        if (y > lastY && y > 220) header.classList.add('is-hidden');
        else header.classList.remove('is-hidden');
      }
    }
    var wa = $('.wa-float');
    if (wa) wa.classList.toggle('show', y > 300);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) header.classList.remove('is-hidden');
    });
    $$('a', mnav).forEach(function (a) {
      a.addEventListener('click', function () {
        mnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ------------------------------------------------------ scroll reveal -- */
  var revealables = $$('.reveal');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------------------------------------------------- lightbox --- */
  var lb = $('.lb');
  if (lb) {
    var photos = $$('.photo');
    var lbImg = $('.lb-img', lb);
    var lbCap = $('.lb-cap', lb);
    var lbCount = $('.lb-count', lb);
    var idx = 0;
    var lastFocus = null;

    function show(i) {
      idx = (i + photos.length) % photos.length;
      var btn = photos[idx];
      var full = btn.getAttribute('data-full');
      var cap = btn.getAttribute('data-caption') || '';
      var img = $('img', btn);
      lbImg.src = full;
      lbImg.alt = img ? img.alt : '';
      lbCap.textContent = cap;
      lbCount.textContent = (idx + 1) + ' / ' + photos.length;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var c = $('.lb-close', lb); if (c) c.focus();
    }
    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lbImg.src = '';
      if (lastFocus) lastFocus.focus();
    }
    photos.forEach(function (p, i) {
      p.addEventListener('click', function () { open(i); });
    });
    var cl = $('.lb-close', lb); if (cl) cl.addEventListener('click', close);
    var pv = $('.lb-prev', lb); if (pv) pv.addEventListener('click', function () { show(idx - 1); });
    var nx = $('.lb-next', lb); if (nx) nx.addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
    // swipe on touch
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var d = e.changedTouches[0].clientX - sx;
      if (Math.abs(d) > 55) show(idx + (d < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* --------------------------------------------------------------- FAQ --- */
  var faqList = $('.faq-list');
  if (faqList) {
    var items = $$('.faq-item', faqList);

    function collapse(item) {
      var a = $('.faq-a', item);
      a.style.height = a.scrollHeight + 'px';
      requestAnimationFrame(function () { a.style.height = '0px'; });
      item.classList.remove('open');
      $('.faq-q', item).setAttribute('aria-expanded', 'false');
    }
    function expand(item) {
      var a = $('.faq-a', item);
      a.style.height = a.scrollHeight + 'px';
      item.classList.add('open');
      $('.faq-q', item).setAttribute('aria-expanded', 'true');
      a.addEventListener('transitionend', function te(ev) {
        if (ev.propertyName !== 'height') return;
        if (item.classList.contains('open')) a.style.height = 'auto';
        a.removeEventListener('transitionend', te);
      });
    }
    items.forEach(function (item) {
      $('.faq-q', item).addEventListener('click', function () {
        if (item.classList.contains('open')) collapse(item);
        else {
          // accordion: only one answer open at a time
          items.forEach(function (o) { if (o !== item && o.classList.contains('open')) collapse(o); });
          expand(item);
        }
      });
    });

    var chips = $$('.chip');
    var search = $('#faq-search');
    var empty = $('.faq-empty');
    var activeCat = 'all';

    function applyFilter() {
      var q = (search && search.value || '').trim().toLowerCase();
      var shown = 0;
      items.forEach(function (item) {
        var cat = item.getAttribute('data-cat') || '';
        var text = item.textContent.toLowerCase();
        var okCat = activeCat === 'all' || cat === activeCat;
        var okText = !q || text.indexOf(q) !== -1;
        var vis = okCat && okText;
        item.classList.toggle('hide', !vis);
        if (vis) shown++;
        else if (item.classList.contains('open')) collapse(item);
      });
      if (empty) empty.classList.toggle('show', shown === 0);
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        activeCat = c.getAttribute('data-cat');
        applyFilter();
      });
    });
    if (search) search.addEventListener('input', applyFilter);
  }

  /* ---------------------------------------------------- booking flow ----- */
  var book = $('#book-form');
  if (book) {
    var steps = $$('.step', book);
    var markers = $$('.book-steps li', book);
    var cur = 0;

    var btnNext = $('#book-next');
    var btnBack = $('#book-back');
    var btnSend = $('#book-send');

    function paint() {
      steps.forEach(function (s, i) { s.classList.toggle('active', i === cur); });
      markers.forEach(function (m, i) {
        m.classList.toggle('current', i === cur);
        m.classList.toggle('done', i < cur);
      });
      btnBack.style.visibility = cur === 0 ? 'hidden' : 'visible';
      btnNext.hidden = cur === steps.length - 1;
      btnSend.hidden = cur !== steps.length - 1;
      if (cur === steps.length - 1) buildSummary();
      var top = book.getBoundingClientRect().top + window.pageYOffset - 100;
      if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    }

    function stepValid(i) {
      var s = steps[i];
      var ok = true;
      // one radio group per choice step
      var groups = {};
      $$('input[type=radio]', s).forEach(function (r) { groups[r.name] = groups[r.name] || []; groups[r.name].push(r); });
      Object.keys(groups).forEach(function (n) {
        if (!groups[n].some(function (r) { return r.checked; })) ok = false;
      });
      $$('[data-required]', s).forEach(function (f) {
        var field = f.closest('.field');
        var bad = !f.value.trim();
        if (!bad && f.type === 'tel') bad = f.value.replace(/\D/g, '').length < 9;
        if (field) field.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) {
        var first = $('.field.invalid', s) || s;
        first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      }
      return ok;
    }

    btnNext.addEventListener('click', function () {
      if (!stepValid(cur)) return;
      if (cur < steps.length - 1) { cur++; paint(); }
    });
    btnBack.addEventListener('click', function () { if (cur > 0) { cur--; paint(); } });

    $$('input,select,textarea', book).forEach(function (el) {
      el.addEventListener('change', function () {
        var f = el.closest('.field'); if (f) f.classList.remove('invalid');
      });
      el.addEventListener('input', function () {
        var f = el.closest('.field'); if (f) f.classList.remove('invalid');
      });
    });

    function val(name) {
      var el = book.querySelector('[name="' + name + '"]:checked') || book.querySelector('[name="' + name + '"]');
      if (!el) return '';
      return (el.getAttribute('data-label') || el.value || '').trim();
    }

    /* The studio runs a discount for bookings deposited 1st-7th of the month.
       If today falls inside that window the form says so, unprompted. */
    function offerActive() {
      var d = new Date().getDate();
      return d >= 1 && d <= 7;
    }
    var banner = $('.offer-live');
    if (banner && offerActive()) banner.classList.add('show');

    function buildSummary() {
      var dl = $('#summary-dl');
      if (!dl) return;
      var rows = [
        ['Session', val('session')],
        ['Package', val('package')],
        ['Child’s age', val('age')],
        ['Preferred timing', val('timing')],
        ['Parent', val('parent')],
        ['Phone', val('phone')],
        ['Decor ideas', val('notes') || '—']
      ];
      dl.innerHTML = rows.map(function (r) {
        return '<dt>' + r[0] + '</dt><dd>' + (r[1] ? escapeHtml(r[1]) : '—') + '</dd>';
      }).join('');
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    btnSend.addEventListener('click', function () {
      if (!stepValid(cur)) return;
      var lines = [
        'Hi Kiota Studio! I’d like to book a session.',
        '',
        'Session: ' + val('session'),
        'Package: ' + val('package'),
        'Child’s age: ' + val('age'),
        'Preferred timing: ' + val('timing'),
        'Parent’s name: ' + val('parent'),
        'Phone: ' + val('phone')
      ];
      var notes = val('notes');
      if (notes) lines.push('Decor ideas: ' + notes);
      if (offerActive()) lines.push('', 'I’m booking within the 1st–7th offer window.');
      lines.push('', 'I understand a 50% deposit reserves the date. Please confirm availability.');
      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
    });

    paint();
  }

  /* -------------------------------------------- generic prefilled links -- */
  $$('[data-wa]').forEach(function (el) {
    el.setAttribute('href', waLink(el.getAttribute('data-wa')));
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  /* ------------------------------------------------------------ footer --- */
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
