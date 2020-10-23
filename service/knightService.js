const db = require("../lib/database");
const priceService = require("../service/priceService");
const castleService = require("../service/castle");
const websocket = require("./websocket");
const actionLogService = require("./actionLogService");
const NotEnoughHammerError = require("../error/NotEnoughHammerError");
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const ConflictError = require("../error/ConflictError");

module.exports = {

    /**
     * @param {Position} position
     * @param {UserEntity} user
     * @return {KnightEntity}
     */
    create(position, user) {

        user.hammer -= priceService.nextKnightPrice(user.id);
        if (user.hammer < 0)
            throw new NotEnoughHammerError("You have not enough hammer to build a knight.");

        const userCastle = castleService.getByPosition(position);
        if (!userCastle)
            throw new CastleNotFoundError("Could not find castle next to knight.");
        if (user.id !== userCastle.userId)
            throw new PermissionError("You need to own a castle next to a knight!");
        if (this.getByPosition(position))
            throw new ConflictError("There is already a knight in that castle!");

        const {lastInsertRowid: knightId} = db.prepare("INSERT INTO knight (x, y, userId, name) VALUES (?,?,?,?)")
            .run(position.x, position.y, user.id, "Sir Friedbert");
        const knight = this.getById(knightId);
        websocket.broadcast("NEW_KNIGHT", knight);

        db.prepare("UPDATE user SET hammer=? WHERE id = ?").run(user.hammer, user.id);
        delete user.password;
        websocket.sendTo(user.username, "UPDATE_USER", user);

        actionLogService.save("You build a knight.", user.id, user.username, knight);

        return knight;
    },

    /**
     *
     * @param {number} id
     * @return {KnightEntity}
     */
    getById(id) {
        return db.prepare("SELECT knight.*, user.username, user.color FROM knight JOIN user ON knight.userId = user.id WHERE knight.id=?;").get(id);
    },

    /**
     *
     * @param {number} x
     * @param {number} y
     * @return {KnightEntity}
     */
    getByPosition({x, y}) {
        return db.prepare("SELECT knight.*, user.username, user.color FROM knight JOIN user ON knight.userId = user.id WHERE knight.x=? AND knight.y=?;").get(x, y);
    },

    /**
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @return {KnightEntity[]}
     */
    findKnightsFromTo(minX, minY, maxX, maxY) {
        const sqlQuery = `
            SELECT knight.*, user.username, user.color
            FROM knight
                     JOIN user ON knight.userId = user.id
            WHERE knight.x <= ?
              AND knight.x >= ?
              AND knight.y <= ?
              AND knight.y >= ?;
        `;
        return db.prepare(sqlQuery).all(maxX, minX, maxY, minY);
    },

    /**
     * @return {KnightEntity[]}
     */
    getAll() {
        return db.prepare("SELECT knight.*, user.username, user.color FROM knight JOIN user ON knight.userId = user.id;").all();
    }
};
