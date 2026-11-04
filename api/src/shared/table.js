const { TableClient } = require('@azure/data-tables');

let clientPromise;

/** Returns a TableClient for the Bookings table, creating the table on first use. */
function getTable() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const conn = process.env.STORAGE_CONNECTION_STRING;
      if (!conn) throw new Error('STORAGE_CONNECTION_STRING is not set');
      const local = conn.includes('UseDevelopmentStorage') || conn.includes('127.0.0.1');
      const client = TableClient.fromConnectionString(conn, process.env.BOOKINGS_TABLE || 'Bookings', {
        allowInsecureConnection: local
      });
      try {
        await client.createTable();
      } catch (e) {
        if (e.statusCode !== 409) throw e;
      }
      return client;
    })().catch((e) => {
      clientPromise = undefined;
      throw e;
    });
  }
  return clientPromise;
}

module.exports = { getTable };
