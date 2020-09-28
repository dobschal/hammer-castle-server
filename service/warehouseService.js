const db = require("../lib/database");
const websocket = require("./websocket");
const castleService = require("./castle");
const hammerService = require("./hammerService");
const userService = require("./user");
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const ConflictError = require("../error/ConflictError");
const NotEnoughHammerError = require("../error/NotEnoughHammerError");

const selectQuery = `warehouse.x,
               warehouse.y,
               warehouse.castle_1_x,
               warehouse.castle_1_y,
               warehouse.castle_2_x,
               warehouse.castle_2_y,
               warehouse.timestamp,
               warehouse.user_id,
               user.color,
               user.username`;

/**
 * @param {CreateWarehouseRequest} warehouseRequestBody
 * @param {User} user
 */
function create(warehouseRequestBody, user) {
    user.hammer -= getNextWarehousePrice(user);
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
        throw new CastleNotFoundError("Could not found castle next to warehouse.");
    }
    if (user.id !== castle1.userId || user.id !== castle2.userId) {
        throw new PermissionError("You need to own the castles next to a warehouse!");
    }
    const {x, y, castle1X, castle1Y, castle2X, castle2Y} = warehouseRequestBody;
    if (getByPosition({x, y})) {
        throw new ConflictError("There is already a warehouse on that road!");
    }
    db.prepare("INSERT INTO warehouse (x, y, castle_1_x, castle_1_y, castle_2_x, castle_2_y, user_id) VALUES (?,?,?,?,?,?,?);")
        .run(x, y, castle1X, castle1Y, castle2X, castle2Y, user.id);
    db.prepare(`UPDATE user
                SET hammer=?
                WHERE id = ?`).run(user.hammer, user.id);
    const warehouse = getByPosition({x, y});
    const updatedUser = userService.updateUserValues(user, undefined, getAllOfUser(user));
    if (websocket.connections[user.username]) {
        websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
    }
    websocket.broadcast("NEW_WAREHOUSE", warehouse);
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
 * @param {User} user
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
 *
 * @param {User} user
 * @return {*}
 */
function getNextWarehousePrice(user) {
    return Math.floor(user.max_hammers * 0.8);
}

/**
 * A warehouse is located on a road connecting two castles of one player.
 * In case that one of the castles is destroyed, or owned by a different player, we need to destroy the warehouse.
 */
function cleanUp() {
    getAll().forEach(w => {
        const castle1 = castleService.getByPosition({
            x: w.castle_1_x,
            y: w.castle_1_y
        });
        const castle2 = castleService.getByPosition({
            x: w.castle_2_x,
            y: w.castle_2_y
        });
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
            const updatedUser = userService.updateUserValues(user, undefined, getAllOfUser(user));
            if (websocket.connections[user.username]) {
                websocket.connections[user.username].emit("UPDATE_USER", updatedUser);
            }
        }
    });
}

module.exports = {create, getByPosition, getAll, getWarehousesFromTo, cleanUp, deleteWarehouse, getNextWarehousePrice};
