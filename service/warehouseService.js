const db = require("../lib/database");
const websocket = require("./websocketService");
const castleService = require("./castleService");
let priceService;
let userService;
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const ConflictError = require("../error/ConflictError");
const NotEnoughHammerError = require("../error/NotEnoughHammerError");
const actionLogService = require("./actionLogService");
setTimeout(() => {
    priceService = require("./priceService");
    userService = require("./userService");
}, 1000);

const selectQuery = `warehouse.x,
               warehouse.y,
               warehouse.castle_1_x,
               warehouse.castle_1_y,
               warehouse.castle_2_x,
               warehouse.castle_2_y,
               warehouse.timestamp,
               warehouse.user_id,
               warehouse.level,
               user.color,
               user.username`;

/**
 * @param {CreateWarehouseRequest} warehouseRequestBody
 * @param {UserEntity} user
 */
function create(warehouseRequestBody, user) {
    user.hammer -= priceService.nextWarehousePrice(user.id);
    if (user.hammer < 0) {
        throw new NotEnoughHammerError("You have not enough hammer to build a warehouse.");
    }
    const castle1 = castleService.getByPosition({
        x: warehouseRequestBody.castle1X,
        y: warehouseRequestBody.castle1Y
    });
    const castle2 = castleService.getByPosition({
        x: warehouseRequestBody.castle2X,
        y: warehouseRequestBody.castle2Y
    });
    if (!castle1 || !castle2) {
        throw new CastleNotFoundError("Could not find castle next to warehouse.");
    }
    if (user.id !== castle1.userId || user.id !== castle2.userId) {
        throw new PermissionError("You need to own the castles next to a warehouse!");
    }
    const {x, y, castle1X, castle1Y, castle2X, castle2Y} = warehouseRequestBody;
    if (getByPosition({x, y})) {
        throw new ConflictError("There is already a warehouse on that road!");
    }
    db.prepare("INSERT INTO warehouse (x, y, castle_1_x, castle_1_y, castle_2_x, castle_2_y, user_id, level) VALUES (?,?,?,?,?,?,?, ?);")
        .run(x, y, castle1X, castle1Y, castle2X, castle2Y, user.id, 1);
    db.prepare(`UPDATE user
                SET hammer=?
                WHERE id = ?`).run(user.hammer, user.id);
    const warehouse = getByPosition({x, y});
    const updatedUser = userService.updateUserValues(user.id);
    if (websocket.connections[user.username]) {
        websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
    }
    websocket.broadcast("NEW_WAREHOUSE", warehouse);
    actionLogService.save("You built a warehouse.", user.id, user.username, {x, y}, "BUILD_WAREHOUSE");
    castleService.actionLogToNeighbours({
        x,
        y
    }, user.id, "OPPONENT_BUILD_WAREHOUSE", () => `${user.username} build a warehouse.`);
    return warehouse;
}

/**
 * @param {number} x
 * @param {number} y
 * @return {Warehouse}
 */
function getByPosition({x, y}) {
    return db.prepare(`SELECT ${selectQuery} FROM warehouse JOIN user ON warehouse.user_id = user.id WHERE x=? AND y=?;`).get(x, y);
}

/**
 * @return {Warehouse[]}
 */
function getAll() {
    return db.prepare(`SELECT ${selectQuery} FROM warehouse JOIN user ON warehouse.user_id = user.id;`).all();
}

/**
 * @param {number} minX
 * @param {number} minY
 * @param {number} maxX
 * @param {number} maxY
 * @return {Warehouse[]}
 */
function getWarehousesFromTo(minX, minY, maxX, maxY) {
    const sqlQuery = `
        SELECT ${selectQuery}
        FROM warehouse
                 JOIN user ON warehouse.user_id = user.id
        WHERE warehouse.x <= ?
          AND warehouse.x >= ?
          AND warehouse.y <= ?
          AND warehouse.y >= ?;
    `;
    return db.prepare(sqlQuery).all(maxX, minX, maxY, minY);
}

/**
 * @param {Warehouse} w
 */
function deleteWarehouse(w) {
    const result = db.prepare("DELETE FROM warehouse WHERE x=? AND y=?").run(w.x, w.y);
    websocket.broadcast("DELETE_WAREHOUSE", w);
}

/**
 * @param {UserEntity} user
 * @return {Warehouse[]}
 */
function getAllOfUser(user) {
    return db.prepare(`
       SELECT ${selectQuery}
        FROM warehouse
                 JOIN user ON warehouse.user_id = user.id WHERE warehouse.user_id=?;
    `).all(user.id);
}

/**
 * A warehouse is located on a road connecting two castles of one player.
 * In case that one of the castles is destroyed, or owned by a different player, we need to destroy the warehouse.
 */
function cleanUp() {
    const t1 = Date.now();
    const castles = castleService.getAll();
    getAll().forEach(w => {
        const castle1 = castles.find(c => c.x === w.castle_1_x && c.y === w.castle_1_y);
        const castle2 = castles.find(c => c.x === w.castle_2_x && c.y === w.castle_2_y);
        let remove = false;
        if (!castle1 || !castle2) {
            console.log("[warehouseService] Destroy warehouse, close castle was destroyed.");
            remove = true;
        } else if (w.user_id !== castle1.userId || w.user_id !== castle2.userId) {
            console.log("[warehouseService] Destroy warehouse, user is not owning close castle anymore.");
            remove = true;
        }
        if (remove) {
            deleteWarehouse(w);
            const user = userService.getById(w.user_id);
            const updatedUser = userService.updateUserValues(user.id);
            if (websocket.connections[user.username]) {
                websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
            }
            actionLogService.save("Your warehouse got destroyed!", updatedUser.id, updatedUser.username, w, "WAREHOUSE_DESTROYED");
            castleService.actionLogToNeighbours(w, updatedUser.id, "OPPONENT_LOST_WAREHOUSE", () => `${updatedUser.username} lost a warehouse.`)
        }
    });
    console.log("[warehouseService] Cleaned up warehouses in " + (Date.now() - t1) + "ms.");
}

module.exports = {
    create, getByPosition, getAll, getWarehousesFromTo, cleanUp, deleteWarehouse,

    /**
     * @param {number} userId
     * @param {number} minLevel - of warehouses to count
     * @return {number}
     */
    countWarehousesOfUser(userId, minLevel = 1) {
        const {count} = db.prepare(`select count(*) as count
                                    from warehouse
                                    where user_id = ?
                                      and level >= ?`).get(userId, minLevel);
        return count;
    },

    /**
     * @param {UpgradeWarehouseRequest} requestBody
     * @param {UserEntity} user
     */
    upgradeWarehouse(requestBody, user) {
        user.hammer -= priceService.upgradeWarehousePrice(user.id);
        if (user.hammer < 0) {
            throw new NotEnoughHammerError("You have not enough hammer to upgrade a warehouse.");
        }
        const result = db.prepare("UPDATE warehouse SET level=level + 1 WHERE x=? AND y=? AND user_id=?").run(requestBody.x, requestBody.y, user.id);
        if (result.changes !== 1) {
            throw new ConflictError("Cannot upgrade warehouse.");
        }
        db.prepare(`UPDATE user
                    SET hammer=?
                    WHERE id = ?`).run(user.hammer, user.id);
        const warehouse = getByPosition({x: requestBody.x, y: requestBody.y});
        const updatedUser = userService.updateUserValues(user.id);
        if (websocket.connections[user.username]) {
            websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
        }
        websocket.broadcast("UPDATE_WAREHOUSE", warehouse);
        actionLogService.save("You upgraded a warehouse.", user.id, user.username, requestBody, "UPGRADE_WAREHOUSE");
        castleService.actionLogToNeighbours(requestBody, user.id, "OPPONENT_UPGRADED_WAREHOUSE", () => `${user.username} upgraded a warehouse.`);
        return warehouse;
    }
};
