/* Ngozi — shared behaviour. Vanilla, no dependencies. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- splash ---------- */
  var splash = document.querySelector('.splash');
  function hideSplash() { if (splash) splash.classList.add('gone'); }
  if (splash) {
    var seen = false;
    try { seen = sessionStorage.getItem('dn-splash') === '1'; sessionStorage.setItem('dn-splash', '1'); } catch (e) {}
    if (seen || reduce) hideSplash();
    else { window.addEventListener('load', function () { setTimeout(hideSplash, 650); }); setTimeout(hideSplash, 2600); }
  }

  /* ---------- smart sticky header ---------- */
  var header = document.querySelector('.site-header');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (!header) return;
    header.classList.toggle('scrolled', y > 40);
    if (document.body.classList.contains('menu-open')) return;
    if (y > lastY + 4 && y > 220) header.classList.add('hide');
    else if (y < lastY - 2 || y < 220) header.classList.remove('hide');
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open'); document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) burger.click();
    });
  }

  /* ---------- split headline words ---------- */
  document.querySelectorAll('.split-line').forEach(function (el) {
    var html = el.innerHTML.trim();
    // wrap each word (keeping inline tags like <em> intact)
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    var out = []; var i = 0;
    (function walk(nodes, wrapTag) {
      nodes.forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { out.push(' '); return; }
            var inner = wrapTag ? '<' + wrapTag + '>' + part + '</' + wrapTag.split(' ')[0] + '>' : part;
            out.push('<span class="w"><span style="transition-delay:' + (i++ * 0.06).toFixed(2) + 's">' + inner + '</span></span>');
          });
        } else if (n.nodeName === 'BR') { out.push('<br>'); }
        else { var tag = n.nodeName.toLowerCase(); var cls = n.getAttribute('class'); walk(Array.prototype.slice.call(n.childNodes), tag + (cls ? ' class="' + cls + '"' : '')); }
      });
    })(Array.prototype.slice.call(tmp.childNodes), null);
    el.innerHTML = out.join('');
  });

  /* ---------- reveal on scroll ---------- */
  var els = document.querySelectorAll('.rv, .split-line');
  function showAll() { els.forEach(function (el) { el.classList.add('in'); }); }
  if (reduce || !('IntersectionObserver' in window)) showAll();
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    // failsafe: hidden tabs never fire IO
    document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(function(){ els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('in'); }); }, 200); });
    setTimeout(function () { els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight * 1.2) el.classList.add('in'); }); }, 4000);
  }

  /* ---------- gentle 3D tilt on cards (pointer devices only) ---------- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      var raf = null;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { card.style.transform = 'perspective(900px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg) translateY(-4px)'; });
      });
      card.addEventListener('pointerleave', function () { if (raf) cancelAnimationFrame(raf); card.style.transform = ''; });
    });
  }

  /* ---------- films: no autoplay, one at a time, thumbnail returns on pause ---------- */
  var films = Array.prototype.slice.call(document.querySelectorAll('.film'));
  var ICON = {
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
  };
  films.forEach(function (film) {
    var v = film.querySelector('video');
    var thumb = film.querySelector('.thumb');
    var label = film.getAttribute('data-title') || 'video';
    var ctrls = document.createElement('div'); ctrls.className = 'ctrls';
    ctrls.innerHTML = '<button type="button" class="c-pause" aria-label="Pause ' + label + '">' + ICON.pause + '</button><button type="button" class="c-full" aria-label="Full screen">' + ICON.full + '</button>';
    film.appendChild(ctrls);
    var bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = '<i></i>'; film.appendChild(bar);
    var fill = bar.firstChild;

    function play() {
      films.forEach(function (f) { if (f !== film) { var o = f.querySelector('video'); if (!o.paused) o.pause(); } });
      if (!v.getAttribute('src')) { v.setAttribute('src', v.getAttribute('data-src')); }
      v.muted = false;
      var p = v.play(); if (p && p.catch) p.catch(function () { v.muted = true; v.play(); });
    }
    thumb.addEventListener('click', play);
    thumb.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
    v.addEventListener('play', function () { film.classList.add('playing'); });
    v.addEventListener('pause', function () { film.classList.remove('playing'); });
    v.addEventListener('ended', function () { film.classList.remove('playing'); v.currentTime = 0; });
    v.addEventListener('timeupdate', function () { if (v.duration) fill.style.width = (v.currentTime / v.duration * 100) + '%'; });
    v.addEventListener('click', function () { v.pause(); });
    ctrls.querySelector('.c-pause').addEventListener('click', function () { v.pause(); });
    ctrls.querySelector('.c-full').addEventListener('click', function () {
      if (v.requestFullscreen) v.requestFullscreen(); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
  });
  // pause any playing film when it scrolls out of view
  if ('IntersectionObserver' in window && films.length) {
    var fo = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (!en.isIntersecting) { var v = en.target.querySelector('video'); if (v && !v.paused) v.pause(); } });
    }, { threshold: 0.15 });
    films.forEach(function (f) { fo.observe(f); });
  }

  /* ---------- treatment filters ---------- */
  var fbtns = document.querySelectorAll('.filters button');
  fbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var cat = b.getAttribute('data-cat');
      fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('[data-group]').forEach(function (g) {
        g.hidden = !(cat === 'all' || g.getAttribute('data-group') === cat);
      });
    });
  });

  /* ---------- hero watchdog: if three.js can't load (offline, CDN blocked), show the static bottle ---------- */
  var heroEl = document.querySelector('.hero');
  if (heroEl) {
    setTimeout(function () {
      if (!heroEl.classList.contains('gl-ready')) {
        heroEl.classList.add('no-gl');
        var c = heroEl.querySelector('canvas.gl'); if (c) c.style.display = 'none';
      }
    }, 6000);
  }

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
