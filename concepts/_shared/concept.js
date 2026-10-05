/* Storyfront concept ribbon. Pinned to the top of every concept page so a screenshot can't pass a
   concept off as a real business. Any header already pinned to the top is moved down to make room. */
(() => {
  const me = document.currentScript;
  const back = (me && me.dataset.back) || '../../';
  const H = 34;

  const css = document.createElement('style');
  css.textContent = `
    .sf-bar{position:fixed;top:0;left:0;right:0;height:${H}px;z-index:2147483000;display:flex;align-items:center;
      justify-content:space-between;gap:12px;padding:0 14px;background:#0C1F1E;color:#F3F1EA;
      font:500 12.5px/1 Manrope,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.01em;
      border-bottom:1px solid rgba(201,162,75,.45);box-sizing:border-box}
    .sf-bar b{font-weight:700;color:#C9A24B}
    .sf-bar a{color:#F3F1EA;text-decoration:none;font-weight:700;white-space:nowrap;padding:8px 0}
    .sf-bar a:hover{color:#C9A24B}
    .sf-bar .sf-long{opacity:.75}
    @media (max-width:640px){.sf-bar .sf-long{display:none}.sf-bar{font-size:12px}}
    html{scroll-padding-top:${H + 70}px}`;
  document.head.appendChild(css);

  const bar = document.createElement('div');
  bar.className = 'sf-bar';
  bar.setAttribute('role', 'note');
  bar.innerHTML = `<span><b>Concept site by Storyfront</b><span class="sf-long"> · a design study for a fictional business</span></span>`
    + `<a href="${back}">Back to portfolio →</a>`;

  const shift = () => {
    for (const el of document.body.querySelectorAll('*')) {
      if (el === bar || el.dataset.sfShifted) continue;
      const cs = getComputedStyle(el);
      if ((cs.position === 'fixed' || cs.position === 'sticky') && parseFloat(cs.top) === 0) {
        el.style.top = H + 'px';
        el.dataset.sfShifted = '1';
      }
    }
  };
  const start = () => { document.body.prepend(bar); shift(); setTimeout(shift, 600); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
