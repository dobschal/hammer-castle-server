const db = require("../lib/database");
const tool = require("../lib/tool");
const config = require("../config");
const websocket = require("./websocket");

function create(castlePosition, user) {
  const result = db
      .prepare(`INSERT INTO castle (user_id, x, y)
                VALUES (?, ?, ?);`)
      .run(user.id, castlePosition.x, castlePosition.y);

  console.log("Castle created: ", result);
}

/**
 * @typedef Castle
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} user_id
 * @property {string} username
 * @property {string} color
 *
 * @return Castle[]
 */
function getAll() {
  return db.prepare(`
    SELECT castle.x, castle.y, castle.user_id, user.color, user.username
    FROM castle
           JOIN user ON castle.user_id = user.id;
  `).all();
}

function changeCastlesUser(x, y, newUserId) {
  return db.prepare("UPDATE castle SET user_id=? WHERE x=? AND y=?").run(newUserId, x, y);
}

setInterval(function conquerScheduler() {
  const t1 = Date.now();
  const castles = getAll().map(c => {
    c.points = {};
    return c;
  }); // points will contain the roads attached per user
  for (let i = 0; i < castles.length; i++) {
    const c1 = castles[i];
    for (let j = i + 1; j < castles.length; j++) {
      const c2 = castles[j];
      const distanceInPixel = tool.positionDistance(c1, c2);
      if (distanceInPixel < config.MAX_CASTLE_DISTANCE) { // castles are connected via road...
        c1.points[c2.user_id] = c1.points[c2.user_id] ? c1.points[c2.user_id] + 1 : 1;
        c2.points[c1.user_id] = c2.points[c1.user_id] ? c2.points[c1.user_id] + 1 : 1;
      }
    }
  }
  castles.forEach(c => {
    let maxPoints = 0;
    let userId = undefined;
    Object.keys(c.points).forEach(userId2 => {
      if (c.points[userId2] > maxPoints || (c.points[userId2] === maxPoints && userId2 === c.user_id)) {
        maxPoints = c.points[userId2];
        userId = Number(userId2);
      }
    });
    if (userId !== c.user_id) {
      changeCastlesUser(c.x, c.y, userId);
      Object.keys(websocket.connections).forEach(key => websocket.connections[key].emit("CASTLE_CONQUER", {
        x: c.x, y: c.y, userId: userId, username: c.username, color: c.color
      }));
    }
  });
  console.log("[castle] Conquer scheduler ran in " + (Date.now() - t1) + "ms");
}, 5000);

module.exports = {create, getAll};
