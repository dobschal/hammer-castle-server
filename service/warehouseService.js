const db = require("../lib/database");
const tool = require("../lib/tool");
const config = require("../config");
const websocket = require("./websocket");
const castleService = require("./castle");
const userService = require("./user");
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const WrongPositionError = require("../error/WrongPositionError");
const ConflictError = require("../error/ConflictError");

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
    const warehouse = getByPosition({x, y});
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

module.exports = {create, getByPosition, getAll, getWarehousesFromTo};
