/* Ngozi concept: a working consultation calendar (the Premium feature). Nothing is stored or sent
   anywhere; confirming hands the visitor to Storyfront on WhatsApp. */
(() => {
  const MSG = "Hi Storyfront, I just tried the booking calendar on the Ngozi Skin Clinic concept. I'd like online booking like this for my business.";
  const days = [], now = new Date();
  for (let d = 1; days.length < 10; d++) {
    const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    if (x.getDay() !== 0) days.push(x);
  }
  const slots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
  const taken = (di, si) => ((di * 7 + si * 3) % 5) === 0;   // a believable, stable pattern of booked slots
  const fmt = (d, o) => d.toLocaleDateString('en-KE', o);

  const el = document.createElement('div');
  el.className = 'bk'; el.hidden = true;
  el.innerHTML = `<div class="bk-sheet" role="dialog" aria-modal="true" aria-labelledby="bk-h">
    <button class="bk-x" type="button" aria-label="Close">×</button>
    <span class="bk-eyebrow">Virtual consultation · KES 1,500 · 1 hour</span>
    <h2 id="bk-h">Choose a time</h2>
    <div class="bk-step" data-s="1"><p class="bk-label">1 · Day</p><div class="bk-days"></div>
      <p class="bk-label">2 · Time <span>East Africa Time</span></p><div class="bk-slots"><p class="bk-hint">Pick a day first.</p></div></div>
    <div class="bk-step" data-s="2" hidden><p class="bk-label">3 · Your details</p>
      <label>Name<input name="n" autocomplete="name" placeholder="Your name"></label>
      <label>Main concern<select name="c"><option>Acne</option><option>Pigmentation</option><option>Premature ageing</option><option>Hair loss</option><option>Not sure yet</option></select></label>
      <button class="bk-go" type="button">Confirm booking</button><button class="bk-back" type="button">Back</button></div>
    <div class="bk-step" data-s="3" hidden><div class="bk-done"><b>This is where the booking would be confirmed.</b>
      <p class="bk-sum"></p><p>On a client's site, the slot drops straight into the doctor's calendar and the patient gets a confirmation. This concept doesn't store anything.</p>
      <a class="bk-wa" target="_blank" rel="noopener">Want booking like this? WhatsApp Storyfront</a></div></div>
  </div>`;
  document.body.appendChild(el);
  const $ = s => el.querySelector(s);
  let day = null, slot = null;

  const step = n => el.querySelectorAll('.bk-step').forEach(s => s.hidden = s.dataset.s !== String(n));
  const drawSlots = () => {
    $('.bk-slots').innerHTML = slots.map((t, i) => {
      const off = taken(days.indexOf(day), i);
      return `<button type="button" ${off ? 'disabled' : ''} data-t="${t}">${t}${off ? '<small>booked</small>' : ''}</button>`;
    }).join('');
  };
  $('.bk-days').innerHTML = days.map((d, i) =>
    `<button type="button" data-i="${i}"><small>${fmt(d, { weekday: 'short' })}</small>${d.getDate()}<small>${fmt(d, { month: 'short' })}</small></button>`).join('');
  $('.bk-days').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    el.querySelectorAll('.bk-days button').forEach(x => x.classList.toggle('on', x === b));
    day = days[+b.dataset.i]; drawSlots();
  });
  $('.bk-slots').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    slot = b.dataset.t; step(2); $('input[name=n]').focus();
  });
  $('.bk-back').addEventListener('click', () => step(1));
  $('.bk-go').addEventListener('click', () => {
    const who = $('input[name=n]').value.trim() || 'You';
    $('.bk-sum').textContent = `${who} · ${fmt(day, { weekday: 'long', day: 'numeric', month: 'long' })} at ${slot} · ${$('select[name=c]').value}`;
    $('.bk-wa').href = 'https://wa.me/254769968444?text=' + encodeURIComponent(MSG);
    step(3);
  });
  const close = () => { el.hidden = true; document.documentElement.style.overflow = ''; };
  const open = e => { e.preventDefault(); step(1); el.hidden = false; document.documentElement.style.overflow = 'hidden'; $('.bk-x').focus(); };
  $('.bk-x').addEventListener('click', close);
  el.addEventListener('click', e => { if (e.target === el) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden) close(); });
  document.querySelectorAll('[data-book]').forEach(a => a.addEventListener('click', open));
})();
