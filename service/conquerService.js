const websocketService = require("../service/websocketService");
const castleService = require("../service/castleService");
const userService = require("../service/userService");
const userCastlePointsService = require("../service/userCastlePointsService");
const config = require("../config");
const timer = require("../lib/timer");
const event = require("../lib/event");
const db = require("../lib/database");

const self = {

    getConquers() {
        return db.prepare(`select *
                           from conquer;`)
            .all()
            .map(
                /**
                 * @param {ConquerEntity} c
                 */
                c => {
                    return {
                        castle: {x: c.castleX, y: c.castleY, userId: c.userId},
                        timestamp: c.startedAt,
                        userId: c.userId
                    };
                });
    },

    handleConquers() {

        timer.start("CHECK_CONQUERS");

        let items = self.getExpiredConquers().map(expiredConquer => {
            const item = {
                x: expiredConquer.castleX,
                y: expiredConquer.castleY,
                userId: expiredConquer.userId
            };
            const castle = castleService.getByPosition(item);
            if (!castle || castle.userId === expiredConquer.userId) {
                return item;
            }
            const mostPointsForCastle = userCastlePointsService.mostPointsForCastle(item);
            if (!mostPointsForCastle || mostPointsForCastle.userId !== item.userId) {
                return item;
            }
            item.doConquer = true;
            item.oldUserId = castle.userId;
            item.timestamp = expiredConquer.startedAt;
            return item;
        });

        if (items.length === 0) return timer.end("CHECK_CONQUERS", "no conquers");

        self.deleteByPositions(items);

        items = items.filter(item => item.doConquer);
        castleService.changeCastlesUser(items);

        setTimeout(() => {
            items.forEach(item => {
                const updatedCastle = castleService.getByPosition(item);
                websocketService.broadcast("UPDATE_CASTLE", updatedCastle);
                const conquerForWebsocket = {
                    castle: updatedCastle,
                    timestamp: item.timestamp,
                    userId: item.userId
                };
                websocketService.broadcast("DELETE_CONQUER", conquerForWebsocket);
                event.emit(event.CASTLE_CONQUERED, {
                    castle: updatedCastle,
                    oldUserId: item.oldUserId
                });

                const involvedUsers = [item.userId, item.oldUserId];
                involvedUsers.forEach((userId) => {
                    const user = userService.getById(userId);

                    // TODO: Refactore update user values flow...

                    const updatedUser = userService.updateUserValues(user.id);
                    if (websocketService.connections[user.username]) {
                        websocketService.connections[user.username].emit("UPDATE_USER", updatedUser);
                    }
                });
            });
        });

        timer.end("CHECK_CONQUERS", items.length + " conquers handled.");
    },

    /**
     * @param {CastleDto} castle
     * @param {CastlePointsEntity} mostCastlePoints
     */
    updateConquer(castle, mostCastlePoints) {
        if (castle.userId === mostCastlePoints.userId) {
            self.deleteByPositions([castle]);
            websocketService.broadcast("DELETE_CONQUER", {
                castle
            });
            return;
        }
        const conquers = self.getByPosition(castle);
        const conquer = {
            userId: mostCastlePoints.userId,
            castleX: castle.x,
            castleY: castle.y,
            startedAt: Date.now() + castle.points * 1000
        };
        const conquerForWebsocket = {
            castle,
            timestamp: conquer.startedAt,
            userId: conquer.userId
        };
        if (conquers.length === 1) {
            if (conquers[0].userId === conquer.userId)
                return; // conquer is already running...
            self.updateByPosition(conquer);
            websocketService.broadcast("UPDATE_CONQUER", conquerForWebsocket);
        } else if (conquers.length > 1) {
            self.deleteByPositions([castle]);
            websocketService.broadcast("DELETE_CONQUER", {
                castle
            });
        }
        self.insert(conquer);
        websocketService.broadcast("NEW_CONQUER", conquerForWebsocket);
    },

    /**
     * @param {CastleDto} castle
     */
    removeConquer(castle) {
        self.deleteByPositions([castle]);
        websocketService.broadcast("DELETE_CONQUER", {
            castle
        });
    },

    /**
     * @param {Position} position
     * @return {ConquerEntity[]}
     */
    getByPosition(position) {
        return db.prepare(`SELECT *
                           FROM conquer
                           WHERE castleX = ?
                             AND castleY = ?;`).all(position.x, position.y);
    },

    /**
     * @param {Position[]} positions
     */
    deleteByPositions(positions) {
        const statement = db.prepare(`DELETE
                                      FROM conquer
                                      WHERE castleX = ?
                                        AND castleY = ?;`);
        return db.transaction(positions => {
            for (const position of positions) statement.run(position.x, position.y);
        })(positions);
    },

    /**
     * @param {ConquerEntity} conquer
     */
    updateByPosition(conquer) {
        return db.prepare(`UPDATE conquer
                           SET startedAt=@startedAt,
                               userId=@userId
                           WHERE castleX = @castleX
                             AND castleY = @castleY;`).run(conquer);
    },

    /**
     * @param {ConquerEntity} conquer
     */
    insert(conquer) {
        return db.prepare(`INSERT INTO conquer (castleX, castleY, userId, startedAt)
                           VALUES (@castleX, @castleY, @userId, @startedAt)`).run(conquer);
    },

    /**
     * @return {ConquerEntity[]}
     */
    getExpiredConquers() {
        return db.prepare(`SELECT *
                           FROM conquer
                           WHERE startedAt <= ?`).all(Date.now() - config.CONQUER_DELAY);
    }
};

module.exports = self;
