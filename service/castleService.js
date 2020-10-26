const db = require("../lib/database");
const tool = require("../lib/tool");
const config = require("../config");
const websocket = require("./websocketService");
const blockAreaService = require("./blockAreaService");
const schema = require("../lib/schema");
const CastleInsideBlockAreaError = require("../error/CastleInsideBlockAreaError");
const CastleMinDistanceError = require("../error/CastleMinDistanceError");
const NotEnoughHammerError = require("../error/NotEnoughHammerError");
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const WrongPositionError = require("../error/WrongPositionError");
const ConflictError = require("../error/ConflictError");
let priceService;
let userService;
const actionLogService = require("./actionLogService");

setTimeout(() => {
    priceService = require("./priceService");
    userService = require("./userService");
}, 1000);

/**
 * @type {ConquerDto[]}
 */
const runningConquers = [];

const castleDtoSqlQuery = `
    SELECT castle.points  as points,
       castle.x       as x,
       castle.y       as y,
       castle.name    as name,
       castle.user_id as userId,
       castle.timestamp as timestamp,
       user.color     as color,
       user.username  as username
`;

/**
 * @param {UserEntity} user
 * @return {boolean}
 */
function isFirstCastle(user) {
    const {count} = db.prepare("SELECT COUNT(*) as count FROM castle WHERE user_id=?").get(user.id);
    return count === 0;
}

/**
 * @param {Position} castlePosition
 * @param {UserEntity} user
 * @return {CastleDto}
 */
function create(castlePosition, user) {
    if (blockAreaService.isInsideBlockArea(castlePosition)) {
        throw new CastleInsideBlockAreaError("Tried to build a castle inside a blocked area.");
    }
    const castlesInDistance = getCastlesInDistance(castlePosition, config.MAX_CASTLE_DISTANCE * 2);
    if (isFirstCastle(user)) {
        if (castlesInDistance.some(c => tool.positionDistance(castlePosition, c) < config.MAX_CASTLE_DISTANCE)) {
            throw new WrongPositionError("The new position is too close to a other castle!");
        }
    } else {
        if (castlesInDistance.some(c => tool.positionDistance(castlePosition, c) < config.MIN_CASTLE_DISTANCE)) {
            throw new CastleMinDistanceError("The new position is too close to a other castle.");
        }
    }

    const price = priceService.nextCastlePrice(user.id);
    if (user.hammer < price) {
        throw new NotEnoughHammerError("You have not enough hammer to build a castle!");
    }
    user.hammer = (user.hammer - price) || 0;

    const points = _updatedCastlePointsForNewCastle(castlePosition, user.id);
    const castleName = config.CASTLE_NAMES[Math.floor(Math.random() * config.CASTLE_NAMES.length)];
    db.prepare(`INSERT INTO castle (user_id, x, y, points, name)
                VALUES (?, ?, ?, ?, ?);`)
        .run(user.id, castlePosition.x, castlePosition.y, points, castleName);
    const castle = getOne(castlePosition);
    websocket.broadcast("NEW_CASTLE", castle);

    blockAreaService.createRandomBlockArea(castle, castlesInDistance);

    // TODO: refactor user update...
    db.prepare(`UPDATE user
                SET startX=?,
                    startY=?,
                    hammer=?
                WHERE id = ?`).run(castlePosition.x, castlePosition.y, user.hammer, user.id);
    const updatedUser = userService.updateUserValues(user.id);
    if (websocket.connections[user.username]) {
        websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
    }

    actionLogService.save("You built the castle '" + castle.name + "'.", user.id, user.username, castlePosition);
    setTimeout(() => {
        const userIdsOfNeighbors = castlesInDistance
            .map(c => c.userId)
            .filter((v, i, a) => a.indexOf(v) === i && v !== user.id);
        userIdsOfNeighbors.forEach(userId => {
            const neighborUser = userService.getById(userId);
            actionLogService.save(user.username + " has built the castle '" + castle.name + "' next to you.", neighborUser.id, neighborUser.username, castlePosition)
        });
    });
    return castle;
}

/**
 * @param {Position} castlePosition
 * @param {UserEntity} user
 * @param {boolean} isSelfDelete
 * @return {CastleDto}
 */
function deleteCastle(castlePosition, user, isSelfDelete = true) {
    const castleToDelete = getOne(castlePosition);
    if (!castleToDelete) {
        throw new CastleNotFoundError("The castle you try to delete, does not exist.");
    }
    if (user.id !== castleToDelete.userId) {
        throw new PermissionError("You cannot destroy a castle, you don't own...");
    }
    if (isSelfDelete) {
        const {count} = db.prepare("SELECT COUNT(*) as count FROM castle WHERE user_id=?").get(user.id);
        if (count <= 2) {
            throw new ConflictError("You cannot delete your last 2 castles...");
        }
    }
    _updatedCastlePointsForDestroyedCastle(castlePosition, user.id);
    db.prepare("DELETE FROM castle WHERE x=? AND y=? AND user_id=?;").run(castlePosition.x, castlePosition.y, user.id);
    const updatedUser = userService.updateUserValues(user.id);
    if (websocket.connections[user.username]) {
        websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
    }
    websocket.broadcast("DELETE_CASTLE", castlePosition);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {string} name
 * @param {UserEntity} user
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
 * @param {number} userId
 * @return {CastleDto[]}
 */
function getAllOfUserId(userId) {
    return db.prepare(`
       ${castleDtoSqlQuery}
        FROM castle
                 JOIN user ON castle.user_id = user.id WHERE castle.user_id=?;
    `).all(userId);
}

/**
 * @param {UserEntity} user
 * @return {CastleDto[]}
 */
function getAllOfUser(user) {
    return db.prepare(`
       ${castleDtoSqlQuery}
        FROM castle
                 JOIN user ON castle.user_id = user.id WHERE castle.user_id=?;
    `).all(user.id);
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
 * @param {number} newPointsOfCastle
 * @return {CastleDto}
 */
function changeCastlesUser(x, y, newUserId, newPointsOfCastle) {
    db.prepare("UPDATE castle SET user_id=?, points=? WHERE x=? AND y=?").run(newUserId, newPointsOfCastle, x, y);
    return getOne({x, y});
}

/**
 * @return {ConquerDto[]}
 */
function getConquers() {
    return runningConquers;
}

/**
 * @param {Position} position
 * @return {CastleDto}
 */
function getByPosition(position) {
    return getOne(position);
}

function castlePointsCleanUp() {
    const t1 = Date.now();
    const castles = _getAllCastlesWithUserPoints();
    const castlesToCleanUp = [];
    castles.forEach(c => {
        if (c.points === 0 && !c.pointsPerUser[c.userId]) return;
        if (c.pointsPerUser[c.userId] !== c.points) {
            castlesToCleanUp.push({
                points: c.pointsPerUser[c.userId] || 0,
                x: c.x,
                y: c.y
            });
        }
    });
    self.updateMany(["points"], castlesToCleanUp);
    console.log("[castle] Cleaned up castles in " + (Date.now() - t1) + "ms.");
}

function detectCastleConquer() {
    const t1 = Date.now();
    const castles = _getAllCastlesWithUserPoints();
    castles.forEach(c => {
        if (castles.filter(c2 => c2.userId === c.userId).length <= 2) {
            return;
        }
        let maxPoints = 0;
        let userId = undefined;
        Object.keys(c.pointsPerUser).forEach(userId2 => {
            if (c.pointsPerUser[userId2] > maxPoints || (c.pointsPerUser[userId2] === maxPoints && Number(userId2) === c.userId)) {
                maxPoints = c.pointsPerUser[userId2];
                userId = Number(userId2);
            }
        });
        if (userId && userId !== c.userId) {
            const newPoints = c.pointsPerUser[userId];
            delete c.pointsPerUser; // clean up
            _handleCastleConquer(c, userId, newPoints);
        }
    });

    // Clean up...
    for (let i = runningConquers.length - 1; i > 0; i--) {
        const runningConquer = runningConquers[i];
        if (runningConquer.timestamp + config.CONQUER_DELAY < Date.now()) {
            runningConquers.splice(i, 1);
            websocket.broadcast("DELETE_CONQUER", runningConquer);
        }
    }

    console.log("[castle] Handled conquers in " + (Date.now() - t1) + "ms.");
}

/* * * * * * * * * * * * * * * * * * *  PRIVATE * * * * * * * * * * * * * * * * * * */

function _updatedCastlePointsForNewCastle(newCastlePosition, userId) {
    const castles = getAllOfUserId(userId);
    let pointsOfNewCastle = 0;
    castles.forEach(castleFromDb => {
        const distanceInPixel = tool.positionDistance(newCastlePosition, castleFromDb);
        if (distanceInPixel <= config.MAX_CASTLE_DISTANCE) {
            pointsOfNewCastle++;
            db.prepare(`UPDATE castle
                                       SET points = points + 1
                                       WHERE x = ?
                                         AND y = ?`).run(castleFromDb.x, castleFromDb.y);
            castleFromDb.points++;
            websocket.broadcast("UPDATE_CASTLE", castleFromDb);
        }
    });
    return pointsOfNewCastle;
}

function _updatedCastlePointsForDestroyedCastle(destroyedCastlePosition, userId) {
    const castles = getAllOfUserId(userId);
    castles.forEach(castleFromDb => {
        const distanceInPixel = tool.positionDistance(destroyedCastlePosition, castleFromDb);
        if (distanceInPixel <= config.MAX_CASTLE_DISTANCE) {
            db.prepare(`UPDATE castle
                                       SET points = points - 1
                                       WHERE x = ?
                                         AND y = ?`).run(castleFromDb.x, castleFromDb.y);
            castleFromDb.points++;
            websocket.broadcast("UPDATE_CASTLE", castleFromDb);
        }
    });
}

/**
 * @return {CastleDto[]}
 * @private
 */
function _getAllCastlesWithUserPoints() {

    //  TODO: Add extra points for knights...

    let castles = getAll().map(c => {
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

/**
 * @param {CastleDto} castle
 * @param {number} userId
 * @param {number} newPointsOfCastle
 * @private
 */
function _handleCastleConquer(castle, userId, newPointsOfCastle) {
    const index = runningConquers.findIndex(rc => rc.castle.x === castle.x && rc.castle.y === castle.y);
    if (index === -1) {
        console.log("[castle] New conquer started: ", castle.x, castle.y, userId);
        const newConquer = {
            castle,
            userId,
            timestamp: Date.now() + (castle.points * 1000)
        };
        schema.is(newConquer, "dto/Conquer");
        runningConquers.push(newConquer);
        websocket.broadcast("NEW_CONQUER", newConquer);
    } else {
        let runningConquer = runningConquers[index];
        if (runningConquer.userId !== userId) {
            console.log("[castle] Conquerer for castle changed: ", castle.x, castle.y, userId);
            runningConquer.castle = getByPosition(castle);
            runningConquer.timestamp = Date.now() + (castle.points * 1000);
            runningConquer.userId = userId;
            websocket.broadcast("UPDATE_CONQUER", runningConquer);
        } else { // conquer is still active, check if timestamp is old enough for conquer final...
            if (runningConquer.timestamp + config.CONQUER_DELAY <= Date.now()) {
                console.log("[castle] Castle conquered!: ", castle.x, castle.y, userId);
                const involvedUsers = [castle.userId, userId];

                const exchangedCastle = changeCastlesUser(runningConquer.castle.x, runningConquer.castle.y, runningConquer.userId, newPointsOfCastle);
                schema.is(exchangedCastle, "dto/Castle");

                involvedUsers.forEach((userId) => {
                    const user = userService.getById(userId);
                    const updatedUser = userService.updateUserValues(user.id);
                    if (websocket.connections[user.username]) {
                        websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
                    }
                });

                websocket.broadcast("UPDATE_CASTLE", exchangedCastle);
                websocket.broadcast("DELETE_CONQUER", runningConquer);
                runningConquers.splice(index, 1);
            }
        }
    }
}


const self = {
    create,
    deleteCastle,
    getAll,
    getCastlesFromTo,
    changeName,
    getConquers,
    getAllOfUser,
    castlePointsCleanUp,
    detectCastleConquer,
    getByPosition,

    /**
     *
     * @param {string[]} keys
     * @param castles
     */
    updateMany(keys, castles) {
        keys = keys.map(key => `${key} = @${key}`);
        const sqlQuery = `UPDATE castle SET ${keys.join(", ")} WHERE x = @x AND y = @y;`;
        const update = db.prepare(sqlQuery);
        const transact = db.transaction((castles) => {
            for (const castle of castles) update.run(castle);
        });
        transact(castles);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    countCastlesOfUser(userId) {
        const {count} = db.prepare(`select count(*) as count
                                    from castle
                                    where user_id = ?`).get(userId);
        return count;
    },

    /**
     * @return {UserPointsDto[]}
     */
    getPointsSummedUpPerUser() {
        return db.prepare(`select u.id as userId, u.username as username, sum(c.points) as points
                           from castle c
                                    join user u on u.id = c.user_id
                           group by u.id`).all();
    },

    /**
     * @return {UserPointsDto[]}
     */
    getBeerPointsPerUser() {
        return db.prepare(`select u.id as userId, u.username as username, sum(c.points) as points
                           from castle c
                                    join user u on u.id = c.user_id
                           where c.points > 4
                           group by u.id`).all();
    }
};

module.exports = self;
