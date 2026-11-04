// Edit these to change when clients can book.
module.exports = {
  timeZone: 'America/Chicago',
  slotMinutes: 30,
  // Minimum notice before an appointment, in minutes.
  minNoticeMinutes: 120,
  // Booking window: today through this date. Move it forward as the season goes.
  bookingEndDate: '2027-01-31',
  // Day of week (0 = Sunday ... 6 = Saturday) -> list of [start, end) ranges, 24-hour "HH:MM".
  hours: {
    1: [['17:00', '20:00']], // Monday evening
    2: [['17:00', '20:00']], // Tuesday evening
    3: [['17:00', '20:00']], // Wednesday evening
    4: [['17:00', '20:00']], // Thursday evening
    6: [['10:00', '16:00']]  // Saturday
  },
  // Dates you are unavailable, "YYYY-MM-DD".
  blackoutDates: ['2026-11-26', '2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01']
};
