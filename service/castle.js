const db = require("../lib/database");

function create(castlePosition, user) {
  const result = db
    .prepare(`INSERT INTO castle (user_id, x, y) VALUES (?,?,?);`)
    .run(user.id, castlePosition.x, castlePosition.y);

  console.log("Castle created: ", result);
}

function getAll() {
  const castles = db.prepare(`SELECT castle.x, castle.y, castle.user_id, user.color, user.username FROM castle JOIN user ON castle.user_id = user.id;`).all();
  console.log("[castle] Got all castles: ", castles);
  return castles;
}

module.exports = { create, getAll };
