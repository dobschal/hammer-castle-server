const db = require("../lib/database");
const tool = require("../lib/tool");
const config = require("../config");
const websocket = require("./websocket");
const castleService = require("./castle");
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const WrongPositionError = require("../error/WrongPositionError");
const ConflictError = require("../error/ConflictError");

const selectQuery = `catapult.x,
               catapult.y,
               catapult.opponent_castle_y,
               catapult.opponent_castle_x,
               catapult.user_castle_x,
               catapult.user_castle_y,
               catapult.timestamp,
               catapult.lifetime,
               user.color,
               user.username`;

/**
 * @param {CreateCatapultRequest} catapultRequestBody
 * @param {User} user
 */
function create(catapultRequestBody, user) {
    const opponentCastle = castleService.getByPosition({
        x: catapultRequestBody.opponentCastleX,
        y: catapultRequestBody.opponentCastleY
    });
    const userCastle = castleService.getByPosition({
        x: catapultRequestBody.userCastleX,
        y: catapultRequestBody.userCastleY
    });
    if (!opponentCastle || !userCastle) {
        throw new CastleNotFoundError("Could not found castle next to catapult.");
    }
    if (user.id !== userCastle.userId) {
        throw new PermissionError("You need to own a castle next to a catapult!");
    }
    if (user.id === opponentCastle.userId) {
        throw new WrongPositionError("A catapult should be located between one of yours and a opponents castle.");
    }
    const {x, y, opponentCastleX, opponentCastleY, userCastleX, userCastleY} = catapultRequestBody;
    if (getByPosition({x, y})) {
        throw new ConflictError("There is already a catapult on that road!");
    }
    db.prepare("INSERT INTO catapult (x, y, opponent_castle_x, opponent_castle_y, user_castle_x, user_castle_y, user_id, lifetime) VALUES (?,?,?,?,?,?,?,?);")
        .run(x, y, opponentCastleX, opponentCastleY, userCastleX, userCastleY, user.id, config.CATAPULT_LIFETIME);
    const catapult = getByPosition({x, y});
    websocket.broadcast("NEW_CATAPULT", catapult);
    return catapult;
}

/**
 * @param {number} x
 * @param {number} y
 * @return {Catapult}
 */
function getByPosition({x, y}) {
    return db.prepare(`SELECT ${selectQuery} FROM catapult WHERE x=? AND y=?;`).get(x, y);
}

/**
 * @return {Catapult[]}
 */
function getAll() {
    return db.prepare(`SELECT ${selectQuery} FROM catapult;`).all();
}

/**
 * @param {number} minX
 * @param {number} minY
 * @param {number} maxX
 * @param {number} maxY
 * @return {Catapult[]}
 */
function getCatapultsFromTo(minX, minY, maxX, maxY) {
    const sqlQuery = `
        SELECT ${selectQuery}
        FROM catapult
                 JOIN user ON catapult.user_id = user.id
        WHERE catapult.x <= ?
          AND catapult.x >= ?
          AND catapult.y <= ?
          AND catapult.y >= ?;
    `;
    return db.prepare(sqlQuery).all(maxX, minX, maxY, minY);
}

module.exports = {create, getByPosition, getAll, getCatapultsFromTo};
