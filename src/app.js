(function () {
  const SITE = window.SITE || {};
  const $ = (sel) => document.querySelector(sel);
  const form = $('#bookingForm');
  const dateInput = $('#date');
  const slotsBox = $('#slots');
  const errorBox = $('#formError');
  let selectedTime = null;

  const fmtDate = (iso, opts) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', opts || { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // ---- Booking window ----
  fetch('/api/window')
    .then((r) => r.json())
    .then((w) => {
      dateInput.min = w.start;
      dateInput.max = w.end;
      $('#windowHint').textContent = `Booking open through ${fmtDate(w.end, { month: 'long', day: 'numeric', year: 'numeric' })}. Weekday evenings and Saturdays.`;
    })
    .catch(() => {});

  // ---- Time slots ----
  async function loadSlots() {
    selectedTime = null;
    const date = dateInput.value;
    if (!date) return;
    slotsBox.innerHTML = '<p class="hint">Loading open times...</p>';
    try {
      const res = await fetch(`/api/slots?date=${encodeURIComponent(date)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load times.');
      if (!data.slots.length) {
        slotsBox.innerHTML = '<p class="hint">No open times that day. Try a weekday evening or a Saturday.</p>';
        return;
      }
      slotsBox.innerHTML = '';
      data.slots.forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = s.label;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => {
          slotsBox.querySelectorAll('.slot').forEach((x) => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
          selectedTime = s.id;
          errorBox.textContent = '';
        });
        slotsBox.appendChild(b);
      });
    } catch (e) {
      slotsBox.innerHTML = `<p class="hint">${e.message} You can also call or text ${SITE.phone}.</p>`;
    }
  }
  dateInput.addEventListener('change', loadSlots);

  // ---- Submit ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.date) return (errorBox.textContent = 'Please choose a day.');
    if (!selectedTime) return (errorBox.textContent = 'Please choose a time.');
    if (!data.name || !data.phone) return (errorBox.textContent = 'Please enter your name and phone number.');
    if (!data.filerType || !data.meetingType) return (errorBox.textContent = 'Please tell me what you are filing and how you want to meet.');
    data.time = selectedTime;

    const btn = $('#submitBtn');
    btn.disabled = true;
    btn.textContent = 'Reserving...';
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const out = await res.json();
      if (!res.ok) {
        errorBox.textContent = out.error || 'Something went wrong.';
        if (res.status === 409) loadSlots();
        return;
      }
      form.hidden = true;
      $('#confirmText').textContent = `Thank you, ${data.name.split(' ')[0]}! Your appointment request is set for ${fmtDate(out.date || data.date)} at ${out.label} (Central).`;
      $('#confirm').hidden = false;
      $('#confirm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      errorBox.textContent = `Could not reach the booking system. Please call or text ${SITE.phone}.`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Reserve my free estimate';
    }
  });

  // ---- Workshops ----
  const list = $('#eventList');
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (SITE.events || []).filter((ev) => ev.date >= today);
  if (!upcoming.length) {
    list.innerHTML = '<p class="center">New workshops coming soon. Check Eventbrite for the latest.</p>';
  }
  upcoming.forEach((ev) => {
    const d = new Date(`${ev.date}T12:00:00`);
    const el = document.createElement('article');
    el.className = 'event';
    el.innerHTML = `
      <div class="event-date"><div class="m">${d.toLocaleDateString('en-US', { month: 'short' })}</div><div class="d">${d.getDate()}</div></div>
      <div><h3></h3><p class="meta"></p><p class="blurb"></p></div>
      <div></div>`;
    el.querySelector('h3').textContent = ev.title;
    el.querySelector('.meta').textContent = `${d.toLocaleDateString('en-US', { weekday: 'long' })} · ${ev.time} CT · ${ev.format}`;
    el.querySelector('.blurb').textContent = ev.blurb;
    const action = el.lastElementChild;
    if (ev.url) {
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = ev.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Register free';
      action.appendChild(a);
    } else {
      action.innerHTML = '<span class="soon">Registration opening soon</span>';
    }
    list.appendChild(el);
  });
  $('#eventbriteAll').href = SITE.eventbriteOrganizerUrl || 'https://www.eventbrite.com/';

  // ---- Share ----
  $('#shareBtn').addEventListener('click', async () => {
    const shareData = { title: '360 Taxes with Peggy Darnell', text: 'Book your tax appointment with Peggy Darnell, 360 Taxes.', url: location.origin };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(location.origin);
        $('#shareBtn').textContent = 'Link copied!';
      } catch {}
    }
  });
})();
