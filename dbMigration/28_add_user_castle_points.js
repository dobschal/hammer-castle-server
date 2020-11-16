const db = require("../lib/database");
const tool = require("../lib/tool");
const timer = require("../lib/timer");
const config = require("../config");

/**
 * @return {CastleDto[]}
 * @private
 */
function _getAllCastlesWithUserPoints() {
    let castles = db
        .prepare(`select c.x          as x,
                         c.y          as y,
                         c.user_id    as userId,
                         c.points     as points,
                         sum(k.level) as knightLevels,
                         k.userId     as knightUserId
                  from castle c
                           left join knight k on c.x = k.x and c.y = k.y
                  group by c.x, c.y`)
        .all();
    castles.forEach((c1, i) => {
        c1.pointsPerUser = c1.pointsPerUser || {};
        if (c1.knightUserId && c1.knightLevels) {
            c1.pointsPerUser[c1.userId] = c1.pointsPerUser[c1.userId] || 0;
            c1.pointsPerUser[c1.userId] = c1.knightUserId === c1.userId ? 1 : -1;
        }
        for (let j = i + 1; j < castles.length; j++) {
            const c2 = castles[j];
            c2.pointsPerUser = c2.pointsPerUser || {};
            const distanceInPixel = tool.positionDistance(c1, c2);
            if (distanceInPixel < config.MAX_CASTLE_DISTANCE) { // castles are connected via road...
                c1.pointsPerUser[String(c2.userId)] = c1.pointsPerUser[String(c2.userId)] ? Number(c1.pointsPerUser[String(c2.userId)]) + 1 : 1;
                c2.pointsPerUser[String(c1.userId)] = c2.pointsPerUser[String(c1.userId)] ? Number(c2.pointsPerUser[String(c1.userId)]) + 1 : 1;
            }
        }
    });
    return castles;
}

module.exports = function (app) {
    timer.start("GET_USER_CASTLE_POINTS");
    const castles = _getAllCastlesWithUserPoints();
    const preparedQuery = db.prepare(`INSERT INTO user_castle_points (castleX, castleY, userId, points)
                                      VALUES (@x, @y, @userId, @points)`);
    const itemsToAdd = [];
    castles.forEach(({x, y, pointsPerUser}) => {
        for (const userIdAsString in pointsPerUser) {
            if (pointsPerUser.hasOwnProperty(userIdAsString)) {
                const userId = Number(userIdAsString);
                const points = pointsPerUser[userIdAsString];
                itemsToAdd.push({x, y, userId, points});
            }
        }
    });
    db.transaction((itemsToAdd) => {
        for (const item of itemsToAdd) preparedQuery.run(item);
    })(itemsToAdd);
    timer.end("GET_USER_CASTLE_POINTS");
};
