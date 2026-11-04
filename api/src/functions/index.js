const { app } = require('@azure/functions');
const h = require('../shared/handlers');

const safe = (fn) => async (request, context) => {
  try {
    return await fn(request, context);
  } catch (err) {
    context.error(err);
    return { status: 500, jsonBody: { error: 'Something went wrong. Please call or text 901-578-7973.' } };
  }
};

// Public
app.http('window', { methods: ['GET'], authLevel: 'anonymous', route: 'window', handler: safe(h.getWindow) });
app.http('slots', { methods: ['GET'], authLevel: 'anonymous', route: 'slots', handler: safe(h.getSlots) });
app.http('book', { methods: ['POST'], authLevel: 'anonymous', route: 'book', handler: safe(h.createBooking) });

// Admin only (also locked down in staticwebapp.config.json). "admin" is a reserved route in Azure Functions, so we use "manage".
app.http('listBookings', { methods: ['GET'], authLevel: 'anonymous', route: 'manage/bookings', handler: safe(h.listBookings) });
app.http('updateBooking', { methods: ['PATCH'], authLevel: 'anonymous', route: 'manage/bookings/{date}/{time}', handler: safe(h.updateBooking) });
