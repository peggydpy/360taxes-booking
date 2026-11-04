(function () {
  const SITE = window.SITE || {};
  const $ = (sel) => document.querySelector(sel);
  // ---- Calendly booking ----
  const box = $('#calendlyBox');
  if (SITE.calendlyUrl) {
    const w = document.createElement('div');
    w.className = 'calendly-inline-widget';
    const sep = SITE.calendlyUrl.includes('?') ? '&' : '?';
    w.dataset.url = `${SITE.calendlyUrl}${sep}hide_gdpr_banner=1&primary_color=2357c6`;
    box.appendChild(w);
    const sc = document.createElement('script');
    sc.src = 'https://assets.calendly.com/assets/external/widget.js';
    sc.async = true;
    sc.onerror = () => { box.innerHTML = fallback(); };
    document.body.appendChild(sc);
  } else {
    box.innerHTML = fallback();
  }
  function fallback() {
    const tel = (SITE.phone || '').replace(/\D/g, '');
    return `<div class="cal-fallback">
      <h3>${SITE.calendlyUrl ? 'Book your free estimate online' : 'Online booking is coming soon!'}</h3>
      <p>${SITE.calendlyUrl ? 'Pick your time on my calendar, or call or text me.' : 'Call or text to reserve your free tax preparation estimate.'}</p>
      <p>${SITE.calendlyUrl ? `<a class="btn" href="${SITE.calendlyUrl}" target="_blank" rel="noopener">Book online</a> ` : ''}<a class="btn${SITE.calendlyUrl ? ' btn-ghost' : ''}" href="sms:+1${tel}">Text ${SITE.phone}</a> <a class="btn btn-ghost" href="tel:+1${tel}">Call ${SITE.phone}</a></p>
    </div>`;
  }
  // Show a thank-you message when someone books in Calendly.
  window.addEventListener('message', (e) => {
    if (e.origin === 'https://calendly.com' && e.data && e.data.event === 'calendly.event_scheduled') {
      $('#confirm').hidden = false;
      $('#confirm').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
