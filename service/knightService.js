const db = require("../lib/database");
let priceService;
const userService = require("./userService");
const castleService = require("./castleService");
const websocket = require("./websocketService");
const actionLogService = require("./actionLogService");
const NotEnoughBeerError = require("../error/NotEnoughBeerError");
const CastleNotFoundError = require("../error/CastleNotFoundError");
const PermissionError = require("../error/PermissionError");
const ConflictError = require("../error/ConflictError");
const KnightNotFoundError = require("../error/KnightNotFoundError");
const config = require("../config");
const event = require("../lib/event");
setTimeout(() => {
    priceService = require("../service/priceService");
});

const self = {

    /**
     * @param {Position} position
     * @param {UserEntity} user
     * @return {KnightEntity}
     */
    create(position, user) {
        position.x = Math.round(position.x);
        position.y = Math.round(position.y);
        user.beer -= priceService.nextKnightPrice(user.id);
        if (user.beer < 0)
            throw new NotEnoughBeerError("You have not enough beer to build a knight.");

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

        db.prepare("UPDATE user SET beer=@beer WHERE id = @id").run(user);
        delete user.password;
        websocket.sendTo(user.username, "UPDATE_USER", user);

        actionLogService.save("You build a knight.", user.id, user.username, knight, "BUILD_KNIGHT");
        castleService.actionLogToNeighbours(
            knight,
            user.id,
            "OPPONENT_BUILD_KNIGHT",
            () => `${user.username} has built a knight named ${knight.name} next to you.`
        );

        event.emit(event.KNIGHT_CREATED, knight);

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
    },

    // Runs every minute...
    chargeKnights() {
        const usersToUpdate = [];
        const knightsToDelete = [];
        self.getSummedKnightLevelsPerUser().forEach(user => {
            const beerCost = config.KNIGHT_BEER_COST_PER_LEVEL * user.summedKnightLevels;
            if (user.beer === 0 && beerCost > 0) {
                knightsToDelete.push({id: user.knightId});
                websocket.sendTo(user.username, "DELETE_KNIGHT", {id: user.knightId});
                const knight = self.getById(user.knightId);
                actionLogService.save(
                    "You lost a knight, because you ran out of beer!",
                    user.userId,
                    user.username,
                    knight,
                    "LOST_KNIGHT"
                );
                castleService.actionLogToNeighbours(knight, user.userId, "OPPONENT_LOST_KNIGHT", () => `${user.username} had no beer left and lost a knight!`);
                event.emit(event.KNIGHT_DESTROYED, knight);
            } else {
                const item = {
                    id: user.userId,
                    beer: Math.max(user.beer - beerCost, 0)
                };
                usersToUpdate.push(item);
                websocket.sendTo(user.username, "UPDATE_USER", item);
            }
        });
        self.deleteMany(knightsToDelete);
        userService.updateMany(["beer"], usersToUpdate);
    },

    /**
     * @param {{id: number}[]} knightsToDelete
     */
    deleteMany(knightsToDelete) {
        const deleteKnight = db.prepare("DELETE FROM knight WHERE id = @id;");
        db.transaction((knightsToDelete) => {
            for (const knightId of knightsToDelete) deleteKnight.run(knightId);
        })(knightsToDelete);
    },

    /**
     * @return {{userId: number, username: string, summedKnightLevels: number, beer: number, knightId: number}[]}
     */
    getSummedKnightLevelsPerUser() {
        return db.prepare(`select u.id         as userId,
                                  u.username   as username,
                                  u.beer       as beer,
                                  sum(k.level) as summedKnightLevels,
                                  k.id         as knightId
                           from knight k
                                    join user u on u.id = k.userId
                           group by u.id`).all();
    },

    /**
     * @return {{userId: number, username: string, summedKnightLevels: number, beer: number, knightId: number}[]}
     */
    getSummedKnightLevels(userId) {
        return db.prepare(`select u.id         as userId,
                                  u.username   as username,
                                  u.beer       as beer,
                                  sum(k.level) as summedKnightLevels,
                                  k.id         as knightId
                           from knight k
                                    join user u on u.id = k.userId
                           where u.id = ?
                           group by u.id`).all(userId);
    },

    /**
     * @param {MoveKnightRequest} requestBody
     * @param {UserEntity} user
     */
    move(requestBody, user) {
        const knight = self.getById(requestBody.knightId);
        if (self.getByPosition(requestBody)) throw new ConflictError("There can be only one knight per castle at a time.");
        const {count} = db.prepare(`select count(*) as count
                                    from knight
                                    where goToX = ?
                                      and goToY = ?
                                      and id <> ?`).get(requestBody.x, requestBody.y, requestBody.knightId);
        if (count > 0) throw new ConflictError("There is already a knight moving to that castle.");
        if (!knight) throw new KnightNotFoundError("Didn't find the knight to move...");
        if (knight.userId !== user.id) throw new PermissionError("Sorry, you need to own the knight you want to move...");
        if (knight.goToX || knight.goToY) throw new ConflictError("The knight is already moving.");
        knight.goToX = requestBody.x;
        knight.goToY = requestBody.y;
        knight.arrivesAt = Date.now() + config.KNIGHT_MOVE_DURATION;
        const {changes} = db.prepare(`update knight
                                      set goToX=@goToX,
                                          goToY=@goToY,
                                          arrivesAt=@arrivesAt
                                      where id = @id`).run(knight);
        if (changes !== 1) throw new Error("[knightService] Update knight failed.");
        websocket.broadcast("UPDATE_KNIGHT", knight);
        castleService.actionLogToNeighbours(knight, user.id, "OPPONENT_MOVES_KNIGHT", () => `${user.username} moved his knight.`);
    },

    moveKnights() {
        const knights = db.prepare("SELECT knight.*, user.username, user.color FROM knight JOIN user ON knight.userId = user.id WHERE goToX NOT NULL AND goToY NOT NULL AND arrivesAt NOT NULL;").all();
        const knightsToUpdate = [];
        knights.forEach(
            /**
             *  @param {KnightEntity} knight
             */
            knight => {
                if (knight.arrivesAt < Date.now()) {
                    event.emit(event.KNIGHT_MOVED, knight);
                    knight.x = knight.goToX;
                    knight.y = knight.goToY;
                    knight.arrivesAt = undefined;
                    knight.goToX = undefined;
                    knight.goToY = undefined;
                    knightsToUpdate.push(knight);
                    setTimeout(() => {
                        websocket.broadcast("UPDATE_KNIGHT", knight);
                    });
                }
            });
        self.updateMany(["x", "y", "goToX", "goToY", "arrivesAt"], knightsToUpdate);
    },

    /**
     * @param {string[]} keys
     * @param {KnightEntity[]} knights
     */
    updateMany(keys, knights) {
        keys = keys.map(key => `${key} = @${key}`);
        const sqlQuery = `UPDATE knight SET ${keys.join(", ")} WHERE id = @id;`;
        const update = db.prepare(sqlQuery);

        const transact = db.transaction((knights) => {
            for (const knight of knights) update.run(knight);
        });

        transact(knights);
    },


    /**
     * @param {Position} position
     * @param {UserEntity} user
     * @param {boolean} isDestroy
     */
    deleteKnight(position, user, isDestroy= false) {
        const knight = self.getByPosition(position);
        if (!knight) {
            throw new KnightNotFoundError("The knight you want to delete, does not exist anymore.");
        }
        const {changes} = db.prepare(`delete
                                      from knight
                                      where x = @x
                                        and y = @y`).run(position);
        if (changes !== 1) {
            return console.error("[knight] Delete has unexpected amount of results: ", changes, position, user.id);
        }
        websocket.broadcast("DELETE_KNIGHT", knight);

        if (isDestroy) {
            actionLogService.save("You lost a knight, caused by a catapult attack!", user.id, user.username, knight, "LOST_KNIGHT");
        }

        castleService.actionLogToNeighbours(
            knight,
            user.id,
            "OPPONENT_LOST_KNIGHT",
            () => `${user.username} ${isDestroy ? "lost a knight, caused by a catapult attack" : " deleted a knight"}!`
        );
        event.emit(event.KNIGHT_DESTROYED, knight);
    }
};

module.exports = self;
