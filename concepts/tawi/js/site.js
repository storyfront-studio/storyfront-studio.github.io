/* Tawi Hair Spa × Tawi Botanics — shared behaviour for every page. Vanilla JS, no libraries. */
(() => {
  document.documentElement.classList.add("js");
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = "254769968444"; // concept: every order and booking button reaches Storyfront

  /* ---------- WhatsApp links: data-wa holds the pre-filled message ---------- */
  $$("[data-wa]").forEach(a => {
    const msg = a.dataset.wa || "Hello! I found you on your website and I'd like to ask about your treatments.";
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent("Hi Storyfront, this came from a button on the Tawi concept:\n\n" + msg)}`;
    a.target = "_blank"; a.rel = "noopener";
  });

  /* ---------- splash ---------- */
  const splash = $(".splash");
  let splashDone = false;
  const endSplash = () => { if (splashDone) return; splashDone = true; splash && splash.classList.add("done"); document.dispatchEvent(new Event("splashdone")); };
  if (splash) { addEventListener("load", () => setTimeout(endSplash, RM ? 0 : 450)); setTimeout(endSplash, 2400); }
  else setTimeout(endSplash, 0);

  /* ---------- smart sticky header ---------- */
  const hdr = $(".hdr");
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    if (hdr) {
      hdr.classList.toggle("scrolled", y > 10);
      if (!document.documentElement.classList.contains("menu-open")) {
        if (y > lastY + 6 && y > 160) hdr.classList.add("hide");
        else if (y < lastY - 6 || y < 160) hdr.classList.remove("hide");
      }
    }
    lastY = y; ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- mobile menu ---------- */
  const mb = $(".menu-btn");
  if (mb) mb.addEventListener("click", () => {
    const open = document.documentElement.classList.toggle("menu-open");
    mb.setAttribute("aria-expanded", open); mb.innerHTML = open ? ICON.x : ICON.menu;
    hdr.classList.remove("hide");
  });
  $$(".mobile-panel a").forEach(a => a.addEventListener("click", () => {
    document.documentElement.classList.remove("menu-open"); if (mb) { mb.setAttribute("aria-expanded", "false"); mb.innerHTML = ICON.menu; }
  }));
  addEventListener("keydown", e => { if (e.key === "Escape" && document.documentElement.classList.contains("menu-open")) mb.click(); });

  /* ---------- scroll reveals ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: .1 });
  $$(".rise").forEach(el => RM ? el.classList.add("in") : io.observe(el));

  /* ---------- photo lightbox ---------- */
  const groups = {};
  $$("[data-lb]").forEach(b => (groups[b.dataset.lb] ||= []).push(b));
  let lb, lbImg, lbCap, lbCount, cur = [], idx = 0, lastFocus;
  const buildLb = () => {
    lb = document.createElement("div");
    lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Photo viewer");
    lb.innerHTML = `<div class="lb-top"><span class="lb-count"></span><button class="ibtn lb-close" aria-label="Close">${ICON.x}</button></div>
      <div class="lb-stage"><button class="ibtn lb-nav lb-prev" aria-label="Previous photo">${ICON.l}</button><img alt=""><button class="ibtn lb-nav lb-next" aria-label="Next photo">${ICON.r}</button></div>
      <p class="lb-cap"></p>`;
    document.body.append(lb);
    lbImg = $("img", lb); lbCap = $(".lb-cap", lb); lbCount = $(".lb-count", lb);
    $(".lb-close", lb).onclick = closeLb; $(".lb-prev", lb).onclick = () => show(idx - 1); $(".lb-next", lb).onclick = () => show(idx + 1);
    lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLb(); });
    let sx = null;
    lb.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener("touchend", e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); sx = null; });
  };
  const show = i => {
    idx = (i + cur.length) % cur.length; const b = cur[idx];
    lbImg.src = b.dataset.full; lbImg.alt = $("img", b).alt;
    lbCap.textContent = b.dataset.caption || $("img", b).alt;
    lbCount.textContent = `${idx + 1} / ${cur.length}`;
  };
  function closeLb() { lb.classList.remove("open"); document.body.style.overflow = ""; lastFocus && lastFocus.focus(); }
  Object.values(groups).forEach(g => g.forEach((b, i) => b.addEventListener("click", () => {
    if (!lb) buildLb(); cur = g; lastFocus = b; show(i);
    lb.classList.add("open"); document.body.style.overflow = "hidden"; $(".lb-close", lb).focus();
  })));
  addEventListener("keydown", e => {
    if (!lb || !lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb(); if (e.key === "ArrowRight") show(idx + 1); if (e.key === "ArrowLeft") show(idx - 1);
  });

  /* ---------- films: never autoplay. The apothecary-label poster shows whenever a film isn't playing.
       Tap the poster -> close-up player (with its own full-screen button).
       Tap the card's full-screen icon -> straight to full screen.
       Only one film ever plays (and has sound) at a time. ---------- */
  const cards = $$(".film-card");
  const vids = cards.map(c => $("video", c));
  const goFull = el => {
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitEnterFullscreen;
    if (fn) { try { const r = fn.call(el); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
  };
  const isFull = () => document.fullscreenElement || document.webkitFullscreenElement;
  const stopAll = except => { vids.forEach(o => { if (o !== except) o.pause(); }); if (fo && fv !== except) fv.pause(); };

  // close-up player
  let fo, fv, fcover, fplay, fsnd, curCard;
  const syncPlay = () => { const p = fv.paused; fplay.innerHTML = p ? ICON.play : ICON.pause; fplay.setAttribute("aria-label", p ? "Play" : "Pause"); fcover.hidden = !p; };
  const syncSnd = () => { fsnd.innerHTML = fv.muted ? ICON.off : ICON.on; fsnd.setAttribute("aria-label", fv.muted ? "Turn sound on" : "Mute"); fsnd.setAttribute("aria-pressed", !fv.muted); };
  const buildFo = () => {
    fo = document.createElement("div"); fo.className = "lb fo"; fo.setAttribute("role", "dialog"); fo.setAttribute("aria-modal", "true"); fo.setAttribute("aria-label", "Film player");
    fo.innerHTML = `<div class="lb-top"><span class="fo-title"></span><button class="ibtn fo-close" type="button" aria-label="Close">${ICON.x}</button></div>
      <div class="lb-stage"><div class="fo-frame"><video playsinline></video><button class="fo-cover" type="button" aria-label="Play film"><img alt=""><span class="pl">${ICON.play}</span></button></div></div>
      <div class="fo-bar"><button class="ibtn fo-play" type="button"></button><button class="ibtn fo-snd" type="button"></button><button class="ibtn fo-full" type="button" aria-label="Full screen">${ICON.full}</button></div>
      <p class="lb-cap"></p>`;
    document.body.append(fo);
    fv = $("video", fo); fcover = $(".fo-cover", fo); fplay = $(".fo-play", fo); fsnd = $(".fo-snd", fo);
    const toggle = () => { if (fv.paused) { stopAll(fv); fv.play().catch(() => {}); } else fv.pause(); };
    fplay.onclick = toggle; fv.onclick = toggle; fcover.onclick = toggle;
    fsnd.onclick = () => { fv.muted = !fv.muted; syncSnd(); };
    $(".fo-full", fo).onclick = () => { if (fv.paused) toggle(); goFull(fv); };
    $(".fo-close", fo).onclick = closeFo;
    fv.addEventListener("play", syncPlay); fv.addEventListener("pause", syncPlay);
    fv.addEventListener("ended", () => { fv.currentTime = 0; syncPlay(); });
    fo.addEventListener("click", e => { if (e.target === fo || e.target.classList.contains("lb-stage")) closeFo(); });
    addEventListener("keydown", e => { if (e.key === "Escape" && fo.classList.contains("open") && !isFull()) closeFo(); });
  };
  function openFo(card) {
    if (!fo) buildFo();
    curCard = card; stopAll(null);
    const v = $("video", card), f = card.closest(".film");
    fv.src = v.dataset.src; fv.poster = v.poster; $("img", fcover).src = v.poster;
    $(".fo-title", fo).textContent = $("figcaption b", f)?.textContent || "";
    $(".lb-cap", fo).textContent = $("figcaption span", f)?.textContent || "";
    fv.muted = false; syncSnd(); syncPlay();
    fo.classList.add("open"); document.body.style.overflow = "hidden";
    fv.play().catch(() => { fv.muted = true; syncSnd(); fv.play().catch(() => {}); });
    $(".fo-close", fo).focus();
  }
  function closeFo() { fv.pause(); fv.removeAttribute("src"); fv.load(); fo.classList.remove("open"); document.body.style.overflow = ""; curCard && $(".label", curCard).focus(); }

  cards.forEach(card => {
    const v = $("video", card), label = $(".label", card);
    v.preload = "none"; v.playsInline = true;
    label.addEventListener("click", () => openFo(card));
    v.addEventListener("play", () => card.classList.add("playing"));
    v.addEventListener("pause", () => card.classList.remove("playing"));
    v.addEventListener("ended", () => { v.currentTime = 0; });
    // straight to full screen from the card
    $(".full", card).addEventListener("click", () => {
      stopAll(v);
      if (!v.src) v.src = v.dataset.src;
      v.muted = false; goFull(v); v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    });
  });
  // leaving full screen on a card film stops it, so the label poster comes back
  const onFsChange = () => { if (!isFull()) vids.forEach(v => v.pause()); };
  document.addEventListener("fullscreenchange", onFsChange); document.addEventListener("webkitfullscreenchange", onFsChange);
  vids.forEach(v => v.addEventListener("webkitendfullscreen", () => v.pause()));

  /* keep the floating WhatsApp button out of the way of the on-screen keyboard */
  const fab = $(".fab");
  if (fab) {
    document.addEventListener("focusin", e => { if (e.target.matches("input,select,textarea")) fab.style.display = "none"; });
    document.addEventListener("focusout", () => { fab.style.display = ""; });
  }
  $$(".yr").forEach(y => y.textContent = new Date().getFullYear());
})();

/* icons (inline SVG strings) */
var ICON = {
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 5l-7 7 7 7"/></svg>',
  r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5l7 7-7 7"/></svg>',
  on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
};
