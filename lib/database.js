const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../data/data.db");
const db = new Database(dbPath/*, {
  verbose: msg => {
    console.log("[database] Run sql: " + msg);
  }
}*/);

db.prepare(
  `CREATE TABLE IF NOT EXISTS migration (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name text,
   timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`
).run();

module.exports = db;
