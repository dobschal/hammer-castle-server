const db = require("../lib/database");
const tool = require("../lib/tool");
const config = require("../config");
const websocket = require("./websocket");
const castleService = require("./castle");
const userService = require("./user");
const actionLogService = require("./actionLogService");
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const WrongPositionError = require("../error/WrongPositionError");
const ConflictError = require("../error/ConflictError");
const NotEnoughHammerError = require("../error/NotEnoughHammerError");

const selectQuery = `catapult.x,
               catapult.y,
               catapult.opponent_castle_y,
               catapult.opponent_castle_x,
               catapult.user_castle_x,
               catapult.user_castle_y,
               catapult.timestamp,
               catapult.lifetime,
               catapult.user_id,
               catapult.chance_to_win,
               user.color,
               user.username`;

/**
 * @param {CreateCatapultRequest} catapultRequestBody
 * @param {User} user
 */
function create(catapultRequestBody, user) {
    user.hammer -= getNextCatapultPrice(user);
    if (user.hammer < 0) {
        throw new NotEnoughHammerError("You have not enough hammer to build a catapult.");
    }
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
    const chanceToWin = Math.floor(Math.min(66, (1 / opponentCastle.points) * 1.5 * 100));
    db.prepare("INSERT INTO catapult (x, y, opponent_castle_x, opponent_castle_y, user_castle_x, user_castle_y, user_id, lifetime, chance_to_win) VALUES (?,?,?,?,?,?,?,?, ?);")
        .run(x, y, opponentCastleX, opponentCastleY, userCastleX, userCastleY, user.id, config.CATAPULT_LIFETIME, chanceToWin);
    const catapult = getByPosition({x, y});
    db.prepare(`UPDATE user
                SET hammer=?
                WHERE id = ?`).run(user.hammer, user.id);
    if (websocket.connections[user.username]) {
        websocket.connections[user.username].emit("UPDATE_USER", user);
    }
    websocket.broadcast("NEW_CATAPULT", catapult);
    actionLogService.save("You built a catapult at " + x + "/" + y + ".", user.id, user.username);
    actionLogService.save(user.username + " has built a catapult next to you at " + catapultRequestBody.x + "/" + catapultRequestBody.y + ".", opponentCastle.userId, opponentCastle.username);
    return catapult;
}

/**
 * @param {number} x
 * @param {number} y
 * @return {Catapult}
 */
function getByPosition({x, y}) {
    return db.prepare(`SELECT ${selectQuery} FROM catapult JOIN user ON catapult.user_id = user.id WHERE x=? AND y=?;`).get(x, y);
}

/**
 * @return {Catapult[]}
 */
function getAll() {
    return db.prepare(`SELECT ${selectQuery} FROM catapult JOIN user ON catapult.user_id = user.id;`).all();
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

function triggerCatapultAttacks() {
    const t1 = Date.now();
    getAll().forEach(catapult => {
        const attacksAt = tool.dateFromDbTimestamp(catapult.timestamp);
        if (attacksAt.getTime() + catapult.lifetime < Date.now()) {
            console.log("[catapultService] Catapult is going to attack.");
            const opponentsCastle = castleService.getByPosition({
                x: catapult.opponent_castle_x,
                y: catapult.opponent_castle_y
            });
            const result = db.prepare("DELETE FROM catapult WHERE x=? AND y=? AND user_id=?").run(catapult.x, catapult.y, catapult.user_id);
            websocket.broadcast("DELETE_CATAPULT", catapult);
            if (opponentsCastle && opponentsCastle.userId !== catapult.user_id) {
                const dice = Math.random();// is still not my castle? --> no friendly shooting
                console.log("[catapultService] Catapult attack (dice/chance): ", dice, catapult.chance_to_win / 100);
                if (dice <= catapult.chance_to_win / 100) { // Throw the dice...
                    const opponentUser = userService.getById(opponentsCastle.userId);
                    castleService.deleteCastle({x: opponentsCastle.x, y: opponentsCastle.y}, opponentUser, false);
                    actionLogService.save(
                        "Your catapult destroyed a castle of '" + opponentsCastle.username + "' at " + opponentsCastle.x + "/" + opponentsCastle.y + "!!!",
                        catapult.user_id,
                        catapult.username
                    );
                    actionLogService.save(
                        "Your castle '" + opponentsCastle.name + "' got destroyed by '" + catapult.username + "' at " + opponentsCastle.x + "/" + opponentsCastle.y + "!!!",
                        opponentsCastle.userId,
                        opponentsCastle.username);
                } else {
                    actionLogService.save("Your catapult failed at " + opponentsCastle.x + "/" + opponentsCastle.y + "!!!", catapult.user_id, catapult.username);
                }
            }
        }
    });
    console.log("[catapultService] Triggered catapult attacks in " + (Date.now() - t1) + "ms.");
}

/**
 * @param {User} user
 * @return {number}
 */
function getNextCatapultPrice(user) {
    return Math.floor(castleService.getNextCastlePrice(user) * 0.35);
}

module.exports = {create, getByPosition, getAll, getCatapultsFromTo, triggerCatapultAttacks, getNextCatapultPrice};
