const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../data/data.db");

/**
 * @typedef {object}
 * @property {function} prepare
 * @property {function} backup
 * @property {function} transaction
 */
const db = new Database(dbPath);

db.prepare(
        `CREATE TABLE IF NOT EXISTS migration
         (
             id        INTEGER PRIMARY KEY AUTOINCREMENT,
             name      text,
             timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )`
).run();

(async () => {
    const backupFilePath = path.join(__dirname, "../data/backup-" + Date.now() + ".db");
    await db.backup(backupFilePath);
    console.log("[database] Backup completed: '" + backupFilePath + "'");
})();

module.exports = db;
