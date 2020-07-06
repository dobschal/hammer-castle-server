const db = require("../lib/database");
const security = require("../lib/security");

module.exports = function(app) {
  const result = db
    .prepare(
      `CREATE TABLE IF NOT EXISTS user_role (
      user_id INTEGER NOT NULL,
      role VARCHAR(255) NOT NULL
   )`
    )
    .run();

  const result2 = db
    .prepare(`INSERT INTO user (username,password) values (?, ?)`)
    .run(
      "admin",
      security.encrypt(process.env.adminPassword, process.env.secret)
    );

  const result3 = db
    .prepare(`INSERT INTO user_role (user_id,role) values (?, 'ADMIN')`)
    .run(result2.lastInsertRowid);

  const result4 = db
    .prepare(`INSERT INTO user_role (user_id,role) values (?, 'USER')`)
    .run(result2.lastInsertRowid);

  console.log(
    "[2_add_admin_user] Ran db migration: ",
    result,
    result2,
    result3,
    result4
  );
};
