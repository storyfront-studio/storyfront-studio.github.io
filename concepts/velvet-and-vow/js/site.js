/* Velvet & Vow (Storyfront concept) — shared behaviour (vanilla, no libraries) */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '254769968444';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  window.OP = { WA, RM };

  /* splash */
  const splash = $('.splash');
  const done = () => { document.documentElement.classList.add('ready'); splash && splash.classList.add('gone'); };
  if (document.readyState === 'complete') setTimeout(done, 250); else addEventListener('load', () => setTimeout(done, 250));
  setTimeout(done, 3500); // never trap anyone behind the splash on slow data

  /* split headings into masked words */
  $$('[data-split]').forEach(h => {
    const base = parseFloat(h.dataset.delay || '.2'); let i = 0;
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return; if (/^\s+$/.test(t)) { f.append(t); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = t;
          s.style.transitionDelay = (base + i++ * 0.08) + 's'; w.append(s); f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(h);
  });

  /* smart sticky header */
  const hdr = $('.hdr');
  if (hdr) {
    const darkTop = hdr.dataset.dark === 'true';
    let last = scrollY, ticking = false;
    const upd = () => {
      const y = scrollY;
      const past = y > 40;
      hdr.classList.toggle('solid', past);
      hdr.classList.toggle('on-dark', darkTop && !past);
      if (!hdr.classList.contains('open')) hdr.classList.toggle('hide', y > last && y > 240);
      last = y; ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(upd); ticking = true; } }, { passive: true });
    upd();
    const btn = $('.menu-btn'), scrim = $('.scrim');
    const toggle = open => {
      hdr.classList.toggle('open', open); scrim && scrim.classList.toggle('on', open);
      btn.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
    };
    btn && btn.addEventListener('click', () => toggle(!hdr.classList.contains('open')));
    scrim && scrim.addEventListener('click', () => toggle(false));
    addEventListener('keydown', e => { if (e.key === 'Escape' && hdr.classList.contains('open')) toggle(false); });
  }

  /* scroll reveal */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('.rv, .rise[data-late]').forEach(el => RM ? el.classList.add('in') : io.observe(el));

  /* gentle scroll-linked tilt on photo cards (kept under 1deg) */
  const tilts = $$('.tilt');
  if (tilts.length && !RM) {
    let t = false;
    const run = () => {
      const vh = innerHeight;
      tilts.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = ((r.top + r.height / 2) / vh - .5) * 2; // -1..1
        el.style.transform = `perspective(900px) rotateX(${(p * .8).toFixed(3)}deg) rotateZ(${((i % 2 ? 1 : -1) * p * .5).toFixed(3)}deg)`;
      });
      t = false;
    };
    addEventListener('scroll', () => { if (!t) { requestAnimationFrame(run); t = true; } }, { passive: true });
    run();
  }

  /* lightbox */
  const grid = $('[data-lightbox]');
  if (grid) {
    const lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = `<span class="count" aria-live="polite"></span>
      <button class="x" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <button class="pv" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 5l-7 7 7 7"/></svg></button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="nx" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5l7 7-7 7"/></svg></button>`;
    document.body.append(lb);
    const img = $('img', lb), cap = $('figcaption', lb), cnt = $('.count', lb);
    let list = [], idx = 0, opener = null;
    const show = i => {
      idx = (i + list.length) % list.length; const b = list[idx];
      img.src = b.dataset.full; img.alt = $('img', b).alt; cap.textContent = b.dataset.caption || '';
      cnt.textContent = `${idx + 1} / ${list.length}`;
      img.style.animation = 'none'; img.offsetWidth; img.style.animation = '';
    };
    const open = b => { list = $$('.ph:not(.hidden)', grid); opener = b; show(list.indexOf(b)); lb.classList.add('on'); document.body.style.overflow = 'hidden'; $('.x', lb).focus(); };
    const close = () => { lb.classList.remove('on'); document.body.style.overflow = ''; opener && opener.focus(); };
    grid.addEventListener('click', e => { const b = e.target.closest('.ph'); if (b) open(b); });
    $('.x', lb).onclick = close; $('.pv', lb).onclick = () => show(idx - 1); $('.nx', lb).onclick = () => show(idx + 1);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); sx = null; });

    /* filter tabs */
    $$('.filters button').forEach(btn => btn.addEventListener('click', () => {
      $$('.filters button').forEach(b => b.setAttribute('aria-pressed', b === btn));
      const f = btn.dataset.f;
      $$('.ph', grid).forEach(p => p.classList.toggle('hidden', f !== 'all' && !p.dataset.cat.split(' ').includes(f)));
    }));
  }

  /* films: muted autoplay on scroll, one sound at a time, fullscreen player */
  const films = $$('.film');
  if (films.length) {
    const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';
    const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    const vids = films.map(f => $('video', f));
    const setSound = (v, on) => {
      v.muted = !on; const b = $('.snd', v.closest('.film'));
      b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Mute video' : 'Turn sound on'); b.innerHTML = on ? ICON_ON : ICON_OFF;
    };
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting && e.intersectionRatio >= .5) { if (!RM) v.play().catch(() => {}); }
      else { v.pause(); if (!v.muted) setSound(v, false); }
    }), { threshold: [0, .5] });
    vids.forEach(v => { v.muted = true; v.playsInline = true; setSound(v, false); vio.observe(v); });
    films.forEach(f => {
      const v = $('video', f);
      $('.snd', f).addEventListener('click', e => {
        e.stopPropagation(); const turnOn = v.muted;
        vids.forEach(o => { if (o !== v && !o.muted) setSound(o, false); });
        setSound(v, turnOn); if (turnOn) v.play().catch(() => {});
      });
      const openPlayer = e => { e && e.stopPropagation(); playerOpen(v); };
      $('.fs', f).addEventListener('click', openPlayer);
      f.addEventListener('click', openPlayer);
      f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayer(); } });
    });
    const pl = document.createElement('div');
    pl.className = 'player'; pl.setAttribute('role', 'dialog'); pl.setAttribute('aria-modal', 'true'); pl.setAttribute('aria-label', 'Video player');
    pl.innerHTML = '<button class="x" type="button" aria-label="Close video"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg></button><video controls playsinline></video>';
    document.body.append(pl);
    const pv = $('video', pl);
    let from = null;
    const playerOpen = v => {
      from = v; vids.forEach(o => { o.pause(); if (!o.muted) setSound(o, false); });
      pv.src = v.currentSrc || $('source', v).src; pv.poster = v.poster; pv.currentTime = 0; pv.muted = false;
      pl.classList.add('on'); document.body.style.overflow = 'hidden'; pv.play().catch(() => {}); $('.x', pl).focus();
    };
    const playerClose = () => { pv.pause(); pv.removeAttribute('src'); pv.load(); pl.classList.remove('on'); document.body.style.overflow = ''; from && from.closest('.film').focus(); };
    $('.x', pl).onclick = playerClose;
    pl.addEventListener('click', e => { if (e.target === pl) playerClose(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && pl.classList.contains('on')) playerClose(); });
  }

  /* booking flow → structured WhatsApp message */
  const flow = $('#flow');
  if (flow) {
    const steps = $$('.step', flow), bars = $$('.steps i', flow), lbl = $('.flow-top .lbl', flow);
    const back = $('[data-back]', flow), next = $('[data-next]', flow), send = $('[data-send]', flow);
    let cur = 0;
    const val = n => { const els = $$(`[name="${n}"]`, flow); if (!els.length) return ''; if (els[0].type === 'radio') return (els.find(e => e.checked) || {}).value || ''; if (els[0].type === 'checkbox') return els.filter(e => e.checked).map(e => e.value).join(', '); return els[0].value.trim(); };
    const need = { 0: ['event'], 1: ['date', 'guests', 'area'], 3: ['name'] };
    const check = i => {
      let ok = true;
      (need[i] || []).forEach(n => {
        const f = $(`[data-f="${n}"]`, flow); const good = !!val(n);
        f && f.classList.toggle('bad', !good); if (!good) ok = false;
      });
      return ok;
    };
    const msg = () => {
      const L = [
        'Hi Storyfront! I just tried the event planner on the Velvet & Vow concept. This is what it sent:', '', 'Hello Velvet & Vow! I\'d like to plan an event. ✨', '',
        `*Event:* ${val('event')}`,
        `*Date:* ${val('date') ? new Date(val('date') + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : ''}${val('flex') ? ' (dates are flexible)' : ''}`,
        `*Guests:* ${val('guests')}`,
        `*Area / venue:* ${val('area')}`,
      ];
      if (val('services')) L.push(`*I'd love help with:* ${val('services')}`);
      if (val('budget')) L.push(`*Budget range:* ${val('budget')}`);
      if (val('vision')) L.push('', `*The vision:* ${val('vision')}`);
      L.push('', `— ${val('name')}`);
      return L.join('\n');
    };
    const go = i => {
      cur = i; steps.forEach((s, k) => s.classList.toggle('on', k === i));
      bars.forEach((b, k) => b.classList.toggle('done', k <= i));
      lbl.textContent = `Step ${i + 1} of ${steps.length}`;
      back.hidden = i === 0; next.hidden = i === steps.length - 1; send.hidden = i !== steps.length - 1;
      if (i === steps.length - 1) $('.summary', flow).textContent = msg();
      const top = flow.getBoundingClientRect().top + scrollY - 90; if (scrollY > top) scrollTo({ top, behavior: RM ? 'auto' : 'smooth' });
    };
    next.addEventListener('click', () => { if (check(cur)) go(cur + 1); });
    back.addEventListener('click', () => go(cur - 1));
    $$('input[type=radio][name=event]', flow).forEach(r => r.addEventListener('change', () => { $('[data-f="event"]', flow).classList.remove('bad'); setTimeout(() => go(1), 260); }));
    send.addEventListener('click', () => {
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg())}`, '_blank', 'noopener');
    });
    // prefill from ?event=
    const pre = new URLSearchParams(location.search).get('event');
    if (pre) { const r = $$('input[name=event]', flow).find(x => x.value.toLowerCase().startsWith(pre.toLowerCase())); if (r) r.checked = true; }
    const d = $('input[name=date]', flow); if (d) d.min = new Date().toISOString().slice(0, 10);
    go(0);
  }

  /* review form (concept demo: validates and thanks the visitor, sends nothing) */
  const rf = $('#review-form');
  if (rf) {
    const stars = $$('.stars label', rf);
    const paint = n => stars.forEach((s, i) => s.classList.toggle('lit', i < n));
    stars.forEach((s, i) => {
      s.addEventListener('mouseenter', () => paint(i + 1));
      $('input', s).addEventListener('change', () => paint(i + 1));
    });
    $('.stars', rf).addEventListener('mouseleave', () => { const c = $('.stars input:checked', rf); paint(c ? +c.value : 0); });
    rf.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      ['r_name', 'r_rating', 'r_text'].forEach(n => {
        const f = $(`[data-f="${n}"]`, rf); const el = $$(`[name="${n}"]`, rf);
        const good = el[0].type === 'radio' ? el.some(x => x.checked) : !!el[0].value.trim();
        f.classList.toggle('bad', !good); if (!good) ok = false;
      });
      if (!ok) return;
      const btn = $('button[type=submit]', rf), note = $('.ok-msg', rf);
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        await new Promise(r => setTimeout(r, 700));   // concept: nothing is sent anywhere
        rf.reset(); paint(0);
        note.textContent = 'Thank you! On a client\'s site this goes straight to their inbox. This concept doesn\'t send it anywhere.'; note.classList.add('on');
      } catch {
        note.textContent = 'That didn\'t go through. Please try again, or send your review on WhatsApp.'; note.classList.add('on');
      }
      btn.disabled = false; btn.textContent = 'Send my review';
    });
  }

  /* year */
  $$('[data-year]').forEach(y => y.textContent = new Date().getFullYear());
})();
