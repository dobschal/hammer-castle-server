const db = require("../lib/database");

module.exports = function(app) {
  const stmt = db.prepare(`CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      email_verified INTEGER DEFAULT 0,
      color VARCHAR(255),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   )`);

  const result = stmt.run();

  console.log("[1_create_user_table] Ran db migration: ", result);
};
