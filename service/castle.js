const db = require("../lib/database");

function create(castlePosition, user) {
  const result = db
    .prepare(`INSERT INTO castle (user_id, x, y) VALUES (?,?,?);`)
    .run(user.id, castlePosition.x, castlePosition.y);

  console.log("Castle created: ", result);
}

function getAll() {
  return db.prepare(`SELECT * FROM castle;`).all();
}

module.exports = { create, getAll };
