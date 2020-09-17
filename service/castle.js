/**
 * @type {object}
 * @property {function} prepare
 */
const db = require("../lib/database");
const tool = require("../lib/tool");
const config = require("../config");
const websocket = require("./websocket");
const blockAreaService = require("./blockArea");
const schema = require("../lib/schema");
const CastleInsideBlockAreaError = require("../error/CastleInsideBlockAreaError");
const CastleMinDistanceError = require("../error/CastleMinDistanceError");

/**
 * @type {Conquer[]}
 */
const runningConquers = [];

const castleDtoSqlQuery = `
    SELECT castle.points  as points,
       castle.x       as x,
       castle.y       as y,
       castle.name    as name,
       castle.user_id as userId,
       user.color     as color,
       user.username  as username
`;

/**
 * @param {Position} castlePosition
 * @param {User} user
 * @return {CastleDto}
 */
function create(castlePosition, user) {
    if (blockAreaService.isInsideBlockArea(castlePosition)) {
        throw new CastleInsideBlockAreaError("Tried to build a castle inside a blocked area.");
    }
    const castlesInDistance = getCastlesInDistance(castlePosition, config.MAX_CASTLE_DISTANCE * 2);
    if (castlesInDistance.some(c => tool.positionDistance(castlePosition, c) < config.MIN_CASTLE_DISTANCE)) {
        throw new CastleMinDistanceError();
    }
    const points = _updatedCastlePointsForNewCastle(castlePosition, user.id);
    db.prepare(`INSERT INTO castle (user_id, x, y, points)
                VALUES (?, ?, ?, ?);`)
        .run(user.id, castlePosition.x, castlePosition.y, points);
    const castle = getOne(castlePosition);
    db.prepare(`UPDATE user
                SET startX=?,
                    startY=?
                WHERE id = ?`).run(castlePosition.x, castlePosition.y, user.id);
    blockAreaService.createRandomBlockArea(castle, castlesInDistance);
    websocket.broadcast("NEW_CASTLE", castle);
    return castle;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {string} name
 * @param {User} user
 * @param {CastleDto} castle
 */
function changeName({x, y, name}, user) {
    const result = db.prepare(`UPDATE castle
                               SET name=?
                               WHERE x = ?
                                 AND y = ?
                                 AND user_id = ?`).run(name, x, y, user.id);
    const castle = getOne({x, y});
    console.log("[castle] Changed castle name: ", castle, result);
    websocket.broadcast("UPDATE_CASTLE", castle);
    return castle;
}

/**
 * @param {Position} position
 * @param {number} maxDistance
 * @return {CastleDto[]}
 */
function getCastlesInDistance(position, maxDistance) {
    const minX = position.x - maxDistance;
    const maxX = position.x + maxDistance;
    const minY = position.y - maxDistance;
    const maxY = position.y + maxDistance;
    return getCastlesFromTo(minX, minY, maxX, maxY);
}

/**
 * @param {number} minX
 * @param {number} minY
 * @param {number} maxX
 * @param {number} maxY
 * @return {CastleDto[]}
 */
function getCastlesFromTo(minX, minY, maxX, maxY) {
    const sqlQuery = `
        ${castleDtoSqlQuery}
        FROM castle
        JOIN user ON castle.user_id = user.id
        WHERE castle.x <= ? AND castle.x >= ? AND castle.y <= ? AND castle.y >= ?;
    `;
    return db.prepare(sqlQuery).all(maxX, minX, maxY, minY);
}

/**
 * @return {CastleDto[]}
 */
function getAll() {
    return db.prepare(`
       ${castleDtoSqlQuery}
        FROM castle
                 JOIN user ON castle.user_id = user.id;
    `).all();
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @return {CastleDto}
 */
function getOne({x, y}) {
    return db.prepare(`
        ${castleDtoSqlQuery}
        FROM castle
                 JOIN user ON castle.user_id = user.id
        WHERE castle.x = ?
          AND castle.y = ?;
    `).get(x, y);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} newUserId
 * @return {CastleDto}
 */
function changeCastlesUser(x, y, newUserId) {
    db.prepare("UPDATE castle SET user_id=? WHERE x=? AND y=?").run(newUserId, x, y);
    return getOne({x, y});
}

/**
 * @param {User} user
 * @return {number}
 */
function getNextCastlePrice(user) {
    const { count } = db.prepare(`SELECT COUNT(*) AS count FROM castle WHERE user_id=?`).get(user.id);
    return config.CASTLE_PRICE * (count * config.CASTLE_PRICE_ADJUST);
}

/**
 * @return {Conquer[]}
 */
function getConquers() {
    return runningConquers;
}

function _updatedCastlePointsForNewCastle(newCastlePosition, userId) {
    const castles = db.prepare(`
       ${castleDtoSqlQuery}
        FROM castle
                 JOIN user ON castle.user_id = user.id
        WHERE castle.user_id = ?;
    `).all(userId);
    let pointsOfNewCastle = 0;
    castles.forEach(castleFromDb => {
        const distanceInPixel = tool.positionDistance(newCastlePosition, castleFromDb);
        if (distanceInPixel < config.MAX_CASTLE_DISTANCE) {
            pointsOfNewCastle++;
            const result = db.prepare(`UPDATE castle
                                       SET points = points + 1
                                       WHERE x = ?
                                         AND y = ?`).run(castleFromDb.x, castleFromDb.y);
            castleFromDb.points++;
            websocket.broadcast("UPDATE_CASTLE", castleFromDb);
        }
    });
    return pointsOfNewCastle;
}

function _detectCastleConquer() {
    const castles = _getAllCastlesWithUserPoints();
    castles.forEach(c => {
        let maxPoints = 0;
        let userId = undefined;
        Object.keys(c.pointsPerUser).forEach(userId2 => {
            if (c.pointsPerUser[userId2] > maxPoints || (c.pointsPerUser[userId2] === maxPoints && Number(userId2) === c.userId)) {
                maxPoints = c.pointsPerUser[userId2];
                userId = Number(userId2);
            }
        });
        if (userId && userId !== c.userId) {
            delete c.pointsPerUser; // clean up
            _handleCastleConquer(c, userId);
        }
    });
}

function _getAllCastlesWithUserPoints() {
    const castles = getAll().map(c => {
        c.pointsPerUser = {};
        return c;
    });
    for (let i = 0; i < castles.length; i++) {
        const c1 = castles[i];
        for (let j = i + 1; j < castles.length; j++) {
            const c2 = castles[j];
            const distanceInPixel = tool.positionDistance(c1, c2);
            if (distanceInPixel < config.MAX_CASTLE_DISTANCE) { // castles are connected via road...
                c1.pointsPerUser[String(c2.userId)] = c1.pointsPerUser[String(c2.userId)] ? Number(c1.pointsPerUser[String(c2.userId)]) + 1 : 1;
                c2.pointsPerUser[String(c1.userId)] = c2.pointsPerUser[String(c1.userId)] ? Number(c2.pointsPerUser[String(c1.userId)]) + 1 : 1;
            }
        }
    }

    return castles;
}

function _handleCastleConquer(castle, userId) {
    const index = runningConquers.findIndex(rc => rc.castle.x === castle.x && rc.castle.y === castle.y);
    if (index === -1) {
        console.log("[castle] New conquer started: ", castle.x, castle.y, userId);
        const newConquer = {
            castle,
            userId,
            timestamp: Date.now()
        };
        schema.is(newConquer, "dto/ConquerDto");
        runningConquers.push(newConquer);
        websocket.broadcast("NEW_CONQUER", newConquer);
    } else {
        let runningConquer = runningConquers[index];
        if (runningConquer.userId !== userId) {
            console.log("[castle] Conquerer for castle changed: ", castle.x, castle.y, userId);
            runningConquer.timestamp = Date.now();
            runningConquer.userId = userId;
            websocket.broadcast("UPDATE_CONQUER", runningConquer);
        } else { // conquer is still active, check if timestamp is old enough for conquer final...
            if (runningConquer.timestamp + config.CONQUER_DELAY <= Date.now()) {
                console.log("[castle] Castle conquered!: ", castle.x, castle.y, userId);
                const exchangedCastle = changeCastlesUser(runningConquer.castle.x, runningConquer.castle.y, runningConquer.userId);
                schema.is(exchangedCastle, "dto/CastleDto");
                websocket.broadcast("UPDATE_CASTLE", exchangedCastle);
                websocket.broadcast("DELETE_CONQUER", runningConquer);
                runningConquers.splice(index, 1);
            }
        }
    }
}

setInterval(_detectCastleConquer, 2000);

module.exports = {create, getAll, getCastlesInDistance, getCastlesFromTo, changeName, getNextCastlePrice, getConquers};
