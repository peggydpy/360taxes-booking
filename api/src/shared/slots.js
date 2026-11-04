const cfg = require('./config');

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const slotId = (min) => String(Math.floor(min / 60)).padStart(2, '0') + String(min % 60).padStart(2, '0');
const slotLabel = (min) => {
  const h = Math.floor(min / 60);
  const m = String(min % 60).padStart(2, '0');
  return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'AM' : 'PM'}`;
};

function nowInTz(tz = cfg.timeZone, at = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(at);
  const g = (t) => parts.find((p) => p.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: Number(g('hour')) * 60 + Number(g('minute')) };
}

function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** All bookable slots for a date, before removing ones already taken. */
function getSlotsForDate(date, now = nowInTz()) {
  if (!isValidDate(date)) return [];
  if (date < now.date || date > cfg.bookingEndDate) return [];
  if (cfg.blackoutDates.includes(date)) return [];
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const out = [];
  for (const [start, end] of cfg.hours[dow] || []) {
    for (let m = toMin(start); m + cfg.slotMinutes <= toMin(end); m += cfg.slotMinutes) {
      if (date > now.date || m >= now.minutes + cfg.minNoticeMinutes) {
        out.push({ id: slotId(m), label: slotLabel(m) });
      }
    }
  }
  return out;
}

module.exports = { nowInTz, isValidDate, addDays, getSlotsForDate, slotLabel };
