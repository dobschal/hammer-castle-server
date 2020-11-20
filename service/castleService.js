const timer = require("../lib/timer");

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
const event = require("../lib/event");

setTimeout(() => {
    priceService = require("./priceService");
    userService = require("./userService");
});

event.on(event.CASTLE_DESTROYED, deletedCastle => {
    setTimeout(() => {
        const castle = getAllOfUserId(deletedCastle.userId)[0];
        if (!castle) return;
        const user = userService.getById(deletedCastle.userId);
        userService.markAsHome(castle, user);
    });
});

const castleDtoSqlQuery = `
    SELECT IFNULL(ucp.points, 0)  as points,
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
    castlePosition.y = Math.round(castlePosition.y);
    castlePosition.x = Math.round(castlePosition.x);
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
        } else if (!castlesInDistance.some(c => user.id === c.userId && tool.positionDistance(castlePosition, c) < config.MAX_CASTLE_DISTANCE)) {
            throw new WrongPositionError("Your castle should have an owned neighbor castle!");
        }
    }

    const price = priceService.nextCastlePrice(user.id);
    if (user.hammer < price) {
        throw new NotEnoughHammerError("You have not enough hammer to build a castle!");
    }
    user.hammer = (user.hammer - price) || 0;

    const castleName = config.CASTLE_NAMES[Math.floor(Math.random() * config.CASTLE_NAMES.length)];
    db.prepare(`INSERT INTO castle (user_id, x, y, name)
                VALUES (?, ?, ?, ?);`)
        .run(user.id, castlePosition.x, castlePosition.y, castleName);
    event.emit(event.CASTLE_CREATED, {userId: user.id, ...castlePosition});
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

    actionLogService.save("You built the castle '" + castle.name + "'.", user.id, user.username, castlePosition, "BUILD_CASTLE");
    self.actionLogToNeighbours(
        castlePosition,
        user.id,
        "OPPONENT_BUILD_CASTLE",
        () => `${user.username} has built a castle named ${castle.name} next to you.`
    );

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
    db.prepare("DELETE FROM castle WHERE x=? AND y=? AND user_id=?;").run(castlePosition.x, castlePosition.y, user.id);
    const updatedUser = userService.updateUserValues(user.id);
    if (websocket.connections[user.username]) {
        websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
    }
    websocket.broadcast("DELETE_CASTLE", castlePosition);
    event.emit(event.CASTLE_DESTROYED, castleToDelete);
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
                 LEFT JOIN user_castle_points ucp
                      ON castle.x = ucp.castleX AND castle.y = ucp.castleY AND castle.user_id = ucp.userId
        WHERE castle.x <= ?
          AND castle.x >= ?
          AND castle.y <= ?
          AND castle.y >= ?;
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
                 JOIN user ON castle.user_id = user.id 
                 LEFT JOIN user_castle_points ucp
                      ON castle.x = ucp.castleX AND castle.y = ucp.castleY AND castle.user_id = ucp.userId;
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
                 JOIN user ON castle.user_id = user.id 
                 LEFT JOIN user_castle_points ucp
                      ON castle.x = ucp.castleX AND castle.y = ucp.castleY AND castle.user_id = ucp.userId
                  WHERE castle.user_id=?;
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
                 JOIN user ON castle.user_id = user.id 
                 LEFT JOIN user_castle_points ucp
                      ON castle.x = ucp.castleX AND castle.y = ucp.castleY AND castle.user_id = ucp.userId
                  WHERE castle.user_id=?;
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
                 LEFT JOIN user_castle_points ucp
                      ON castle.x = ucp.castleX AND castle.y = ucp.castleY AND castle.user_id = ucp.userId
        WHERE castle.x = ?
          AND castle.y = ?;
    `).get(x, y);
}

/**
 * @param {Position} position
 * @return {CastleDto}
 */
function getByPosition(position) {
    return getOne(position);
}

const self = {
    create,
    deleteCastle,
    getAll,
    getCastlesFromTo,
    changeName,
    getAllOfUser,
    getByPosition,

    /**
     * @param {Position} castle
     * @return {CastleDto[]}
     */
    getNeighborCastles(castle) {
        return getCastlesInDistance(castle, config.MAX_CASTLE_DISTANCE)
            .filter(c => tool.positionDistance(castle, c) < config.MAX_CASTLE_DISTANCE && (c.x !== castle.x || c.y !== castle.y));
    },

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
        return db.prepare(`select u.id as userId, u.username as username, sum(ucp.points) as points
                           from castle c
                                    join user u on u.id = c.user_id
                                    left join user_castle_points ucp
                                              on c.x = ucp.castleX AND c.y = ucp.castleY AND c.user_id = ucp.userId
                           group by u.id`).all();
    },

    /**
     * @return {UserPointsDto[]}
     */
    getBeerPointsPerUser() {
        return db.prepare(`select u.id            as userId,
                                  u.username      as username,
                                  sum(ucp.points) as points,
                                  u.beer          as beer,
                                  u.max_beer      as max_beer
                           from castle c
                                    join user u on u.id = c.user_id
                                    left join user_castle_points ucp
                                              on c.x = ucp.castleX AND c.y = ucp.castleY AND c.user_id = ucp.userId
                           where ucp.points > 4
                           group by u.id`).all();
    },


    /**
     * @param {number} userId
     * @return {UserPointsDto[]}
     */
    getBeerPoints(userId) {
        return db.prepare(`select u.id            as userId,
                                  u.username      as username,
                                  sum(ucp.points) as points
                           from castle c
                                    join user u on u.id = c.user_id
                                    left join user_castle_points ucp
                                              on c.x = ucp.castleX AND c.y = ucp.castleY AND c.user_id = ucp.userId
                           where ucp.points > 4
                             and u.id = ?
                           group by u.id`).all(userId);
    },

    /**
     * @typedef NeighborDto
     * @type object
     * @property {number} userId
     * @property {string} username
     *
     * @param {Position} position
     * @param {number} userId
     * @param {string} type
     * @param {function(NeighborDto)} messageResolver
     * @return {Promise}
     */
    actionLogToNeighbours(position, userId, type, messageResolver) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const castlesInDistance = getCastlesInDistance(position, config.MAX_CASTLE_DISTANCE * 2);
                    const neighbors = castlesInDistance
                        .map(c => ({userId: c.userId, username: c.username}))
                        .filter((neighbor, index, neighbors) => {
                            if (neighbor.userId === userId)
                                return false; // only neighbors not user itself
                            if (neighbors.findIndex(neighbor2 => neighbor2.userId === neighbor.userId) !== index)
                                return false; // make neighbors array unique distinct
                            return true;
                        });
                    neighbors.forEach(neighbor => {
                        const message = messageResolver(neighbor);
                        actionLogService.save(message, neighbor.userId, neighbor.username, position, type);
                    });
                    resolve(true);
                } catch (e) {
                    console.error("[castleService] Error in actionLogToNeighbours: ", e);
                    reject(e);
                }
            });
        });
    },

    /**
     * @param {CastleDto[]} castles
     */
    changeCastlesUser(castles) {
        const statement = db.prepare(`UPDATE castle
                                      SET user_id=@userId
                                      WHERE x = @x
                                        AND y = @y;`);
        return db.transaction(castles => {
            for (const castle of castles) statement.run(castle);
        })(castles);
    }
};

module.exports = self;
