/* Storyfront portfolio: header state, reveal-on-scroll, the hero phones, and the Launch Feature's end date. */
(() => {
  const hdr = document.querySelector('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // The launch offer ends on its date without anyone having to remember to take it down.
  document.querySelectorAll('[data-launch]').forEach(el => {
    if (Date.now() > Date.parse(el.dataset.ends)) el.remove();
  });

  const fan = document.querySelector('.fan');
  if (fan) setTimeout(() => fan.classList.add('ready'), 350);

  const items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('in'));

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
