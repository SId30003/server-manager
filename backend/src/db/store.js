const fs = require('fs');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dataDir = path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbFile = path.join(dataDir, 'db.json');
const isFirstRun = !fs.existsSync(dbFile);

const adapter = new FileSync(dbFile);
const db = low(adapter);

// Only write the default shape on the very first run. Calling .write() on
// every boot (even with unchanged content) updates the file's mtime, which
// makes nodemon think a source file changed and restart - which writes
// again - which restarts again, forever. See nodemon.json for the other
// half of this fix (ignoring the data directory outright).
if (isFirstRun) {
  db.defaults({ users: [], servers: [], installLogs: [] }).write();
}

module.exports = db;
