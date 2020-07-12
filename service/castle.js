const db = require("../lib/database");
const tool = require("../lib/tool");
const config = require("../config");
const websocket = require("./websocket");

function create(castlePosition, user) {
  db.prepare(`INSERT INTO castle (user_id, x, y)
              VALUES (?, ?, ?);`)
      .run(user.id, castlePosition.x, castlePosition.y);
  const castle = getOne(castlePosition);
  websocket.broadcast("NEW_CASTLE", castle);
  return castle;
}

function getAll() {
  return db.prepare(`
    SELECT castle.x as x, castle.y as y, castle.user_id as userId, user.color as color, user.username as username
    FROM castle
           JOIN user ON castle.user_id = user.id;
  `).all();
}

function getOne({x, y}) {
  return db.prepare(`
    SELECT castle.x as x, castle.y as y, castle.user_id as userId, user.color as color, user.username as username
    FROM castle
           JOIN user ON castle.user_id = user.id
    WHERE castle.x = ?
      AND castle.y = ?;
  `).get(x, y);
}

function changeCastlesUser(x, y, newUserId) {
  return db.prepare("UPDATE castle SET user_id=? WHERE x=? AND y=?").run(newUserId, x, y);
}

/*function updateCastlePointsAndOwner() {

  //  TODO: Refactor this method...

  const t1 = Date.now();
  castles = getAll(false).map(c => {
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
  const castlesToExchange = [];
  castles.forEach(c => {
    let maxPoints = 0;
    let userId = undefined;
    Object.keys(c.points).forEach(userId2 => {
      if (c.points[userId2] > maxPoints || (c.points[userId2] === maxPoints && userId2 === c.user_id)) {
        maxPoints = c.points[userId2];
        userId = Number(userId2);
      }
    });
    if (userId && userId !== c.user_id) {
      castlesToExchange.push({x: c.x, y: c.y, c, userId});
    }
  });
  castlesToExchange.forEach(({x, y, c, userId}) => {
    changeCastlesUser(c.x, c.y, userId);
    Object.keys(websocket.connections).forEach(key => websocket.connections[key].emit("CASTLE_CONQUER", {
      x: c.x, y: c.y, userId: userId, username: c.username, color: c.color
    }));
  });
  console.log("[castle] Conquer scheduler ran in " + (Date.now() - t1) + "ms");
}

setInterval(updateCastlePointsAndOwner, 2000);*/

module.exports = {create, getAll, getOne};
