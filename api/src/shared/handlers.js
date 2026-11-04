const { odata } = require('@azure/data-tables');
const { getTable } = require('./table');
const { getSlotsForDate, isValidDate, nowInTz, slotLabel } = require('./slots');

const FILER_TYPES = ['Individual', 'Business', 'Both'];
const MEETING_TYPES = ['Virtual (video)', 'Phone call', 'In person', 'Document drop-off'];
const STATUSES = ['Requested', 'Confirmed', 'Completed', 'No-show', 'Cancelled'];

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const json = (status, body) => ({ status, jsonBody: body });
const labelFor = (id) => slotLabel(Number(id.slice(0, 2)) * 60 + Number(id.slice(2)));
// Blocks anything that looks like a Social Security / taxpayer ID number in free text.
const looksLikeSsn = (s) => /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/.test(s);

async function takenSlots(table, date) {
  const taken = new Set();
  const iter = table.listEntities({ queryOptions: { filter: odata`PartitionKey eq ${date}` } });
  for await (const e of iter) if (e.status !== 'Cancelled') taken.add(e.rowKey);
  return taken;
}

function getWindow() {
  const cfg = require('./config');
  return json(200, { start: nowInTz().date, end: cfg.bookingEndDate, timeZone: cfg.timeZone });
}

async function getSlots(request) {
  const date = request.query.get('date');
  if (!isValidDate(date)) return json(400, { error: 'Pick a valid date.' });
  const all = getSlotsForDate(date);
  if (!all.length) return json(200, { date, slots: [] });
  const taken = await takenSlots(await getTable(), date);
  return json(200, { date, slots: all.filter((s) => !taken.has(s.id)) });
}

async function createBooking(request) {
  let b;
  try {
    b = await request.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }
  // Honeypot: real people never fill this hidden field.
  if (b.website) return json(200, { ok: true });

  const booking = {
    name: clean(b.name, 80),
    phone: clean(b.phone, 20),
    email: clean(b.email, 120),
    filerType: clean(b.filerType, 20),
    meetingType: clean(b.meetingType, 30),
    has1099: b.has1099 === 'Yes' ? 'Yes' : 'No',
    clientType: b.clientType === 'Returning' ? 'Returning' : 'New',
    source: clean(b.source, 60),
    notes: clean(b.notes, 500)
  };
  const date = clean(b.date, 10);
  const time = clean(b.time, 4);

  const digits = booking.phone.replace(/\D/g, '');
  if (booking.name.length < 2) return json(400, { error: 'Please enter your name.' });
  if (digits.length < 10 || digits.length > 11) return json(400, { error: 'Please enter a valid phone number.' });
  if (booking.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) return json(400, { error: 'Please check your email address.' });
  if (!FILER_TYPES.includes(booking.filerType)) return json(400, { error: 'Choose individual, business, or both.' });
  if (!MEETING_TYPES.includes(booking.meetingType)) return json(400, { error: 'Choose how you want to meet.' });
  if (looksLikeSsn(booking.notes)) return json(400, { error: 'Please do not include Social Security or tax ID numbers here.' });
  if (!getSlotsForDate(date).some((s) => s.id === time)) return json(400, { error: 'That time is not available. Please pick another.' });

  const table = await getTable();
  const entity = { partitionKey: date, rowKey: time, ...booking, status: 'Requested', createdAt: new Date().toISOString() };
  try {
    await table.createEntity(entity);
  } catch (e) {
    if (e.statusCode !== 409) throw e;
    // Slot row exists: reuse it only if that booking was cancelled.
    const existing = await table.getEntity(date, time);
    if (existing.status !== 'Cancelled') return json(409, { error: 'Someone just booked that time. Please pick another.' });
    try {
      await table.updateEntity(entity, 'Replace', { etag: existing.etag });
    } catch (e2) {
      if (e2.statusCode === 412) return json(409, { error: 'Someone just booked that time. Please pick another.' });
      throw e2;
    }
  }
  return json(201, { ok: true, date, time, label: labelFor(time) });
}

function isAdmin(request) {
  const header = request.headers.get('x-ms-client-principal');
  if (!header) return false;
  try {
    const p = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
    return Array.isArray(p.userRoles) && p.userRoles.includes('admin');
  } catch {
    return false;
  }
}

async function listBookings(request) {
  if (!isAdmin(request)) return json(401, { error: 'Admins only.' });
  const from = request.query.get('from');
  const start = isValidDate(from) ? from : nowInTz().date;
  const table = await getTable();
  const rows = [];
  for await (const e of table.listEntities({ queryOptions: { filter: odata`PartitionKey ge ${start}` } })) {
    rows.push({
      date: e.partitionKey, time: e.rowKey, label: labelFor(e.rowKey),
      name: e.name, phone: e.phone, email: e.email, filerType: e.filerType, meetingType: e.meetingType,
      has1099: e.has1099, clientType: e.clientType, source: e.source, notes: e.notes,
      status: e.status, createdAt: e.createdAt
    });
  }
  rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return json(200, { bookings: rows });
}

async function updateBooking(request) {
  if (!isAdmin(request)) return json(401, { error: 'Admins only.' });
  const { date, time } = request.params;
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }
  if (!isValidDate(date) || !/^\d{4}$/.test(time || '')) return json(400, { error: 'Invalid booking.' });
  if (!STATUSES.includes(body.status)) return json(400, { error: 'Invalid status.' });
  const table = await getTable();
  try {
    await table.updateEntity({ partitionKey: date, rowKey: time, status: body.status }, 'Merge');
  } catch (e) {
    if (e.statusCode === 404) return json(404, { error: 'Booking not found.' });
    throw e;
  }
  return json(200, { ok: true });
}

module.exports = { getWindow, getSlots, createBooking, listBookings, updateBooking, isAdmin, STATUSES };
