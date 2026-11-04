(function () {
  const STATUSES = ['Requested', 'Confirmed', 'Completed', 'No-show', 'Cancelled'];
  const $ = (s) => document.querySelector(s);
  const from = $('#from');
  const hide = $('#hideCancelled');
  let bookings = [];

  from.value = new Date().toISOString().slice(0, 10);

  fetch('/.auth/me').then((r) => r.json()).then((d) => {
    if (d.clientPrincipal) $('#who').textContent = d.clientPrincipal.userDetails;
  }).catch(() => {});

  const td = (text) => {
    const c = document.createElement('td');
    c.textContent = text ?? '';
    return c;
  };

  function render() {
    const rows = $('#rows');
    rows.innerHTML = '';
    const shown = bookings.filter((b) => !(hide.checked && b.status === 'Cancelled'));
    shown.forEach((b) => {
      const tr = document.createElement('tr');
      const day = new Date(`${b.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      tr.append(td(day), td(b.label), td(`${b.name} (${b.clientType})`));
      const contact = document.createElement('td');
      const tel = document.createElement('a');
      tel.href = `sms:${b.phone}`;
      tel.textContent = b.phone;
      contact.append(tel);
      if (b.email) {
        contact.append(document.createElement('br'));
        const m = document.createElement('a');
        m.href = `mailto:${b.email}`;
        m.textContent = b.email;
        contact.append(m);
      }
      tr.append(contact, td(b.filerType), td(b.meetingType), td(b.has1099), td(b.source), td(b.notes));
      const sc = document.createElement('td');
      const sel = document.createElement('select');
      STATUSES.forEach((s) => sel.add(new Option(s, s, false, s === b.status)));
      sel.addEventListener('change', async () => {
        const res = await fetch(`/api/manage/bookings/${b.date}/${b.time}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: sel.value })
        });
        if (res.ok) { b.status = sel.value; render(); } else { $('#err').textContent = 'Could not update status.'; }
      });
      sc.append(sel);
      tr.append(sc);
      rows.append(tr);
    });
    const count = (s) => bookings.filter((b) => b.status === s).length;
    $('#stats').innerHTML = ['Requested', 'Confirmed', 'Completed', 'No-show']
      .map((s) => `<div class="stat"><b>${count(s)}</b>${s}</div>`).join('') +
      `<div class="stat"><b>${bookings.filter((b) => b.status !== 'Cancelled').length}</b>Total active</div>`;
  }

  async function load() {
    $('#err').textContent = '';
    const res = await fetch(`/api/manage/bookings?from=${from.value}`);
    if (!res.ok) { $('#err').textContent = 'Could not load bookings. Are you signed in as an admin?'; return; }
    bookings = (await res.json()).bookings;
    render();
  }

  $('#csv').addEventListener('click', () => {
    const cols = ['date', 'label', 'name', 'phone', 'email', 'filerType', 'meetingType', 'has1099', 'clientType', 'source', 'notes', 'status', 'createdAt'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...bookings.map((b) => cols.map((c) => esc(b[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `360taxes-bookings-${from.value}.csv`;
    a.click();
  });

  from.addEventListener('change', load);
  hide.addEventListener('change', render);
  load();
})();
