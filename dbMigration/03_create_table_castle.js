const db = require("../lib/database");

module.exports = function(app) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS castle (
         user_id INTEGER NOT NULL,
         x INTEGER NOT NULL,
         y INTEGER NOT NULL,
         timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
   `
  ).run();
};
