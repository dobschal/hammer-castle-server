const event = require("../lib/event");
const db = require("../lib/database");
const castleService = require("../service/castleService");
let conquerService;
const websocketService = require("../service/websocketService");

setTimeout(() => {
    conquerService = require("../service/conquerService");
});

/**
 * When to update user castle points?
 * On Castle Create
 * On Castle Conquered
 * On Castle Destroy
 * On Knight Move
 * On Knight Create
 * On Knight Destroy
 */

event.on(event.CASTLE_POINTS_CHANGED, ({x, y}) => {

    const castle = castleService.getByPosition({x, y});
    websocketService.broadcast("UPDATE_CASTLE", castle);

    let [mostCastlePoints] = db.prepare(`SELECT *
                                         FROM user_castle_points
                                         WHERE castleX = ?
                                           AND castleY = ?
                                           AND userId <> ?
                                         ORDER BY points DESC
                                         LIMIT 1;`)
        .all(x, y, castle.userId);
    if (mostCastlePoints && mostCastlePoints.points > castle.points) {
        conquerService.updateConquer(castle, mostCastlePoints);
    } else {
        conquerService.removeConquer(castle);
    }

});

event.on(event.CASTLE_CONQUERED,
    /**
     * Increment all owned neighbor castle and decrement the others
     * @param {CastleDto} castle
     * @param {number} oldUserId
     */
    ({castle, oldUserId}) => {
        const castlePointsToChange = [];
        const neighborCastles = castleService.getNeighborCastles(castle);
        neighborCastles.forEach(neighborCastle => {
            if (neighborCastle.userId === oldUserId) {
                castlePointsToChange.push({
                    ...neighborCastle,
                    amount: -1
                });
            } else if (neighborCastle.userId === castle.userId) {
                castlePointsToChange.push({
                    ...neighborCastle,
                    amount: 1
                });
            }
        });
        self.incrementCastlePoints(castlePointsToChange);
        setTimeout(() => {
            neighborCastles.forEach(neighborCastle => {
                event.emit(event.CASTLE_POINTS_CHANGED, {x: neighborCastle.x, y: neighborCastle.y});
            });
        });
    }
)
;

event.on(event.CASTLE_DESTROYED,
    /**
     * @description "Delete all related points and decrement neighbors..."
     * @param {CastleDto} castle
     */
    castle => {
        const castlesToDecrement = [];
        const neighborCastles = castleService.getNeighborCastles(castle);
        neighborCastles.forEach(neighborCastle => {
            castlesToDecrement.push({
                ...neighborCastle,
                userId: castle.userId,
                amount: -1
            });
        });
        self.incrementCastlePoints(castlesToDecrement);
        self.deleteCastlePoints(castle);
        setTimeout(() => {
            neighborCastles.forEach(neighborCastle => {
                event.emit(event.CASTLE_POINTS_CHANGED, {x: neighborCastle.x, y: neighborCastle.y});
            });
        });
    });

event.on(event.CASTLE_CREATED,
    /**
     * @description "The owner of the new castle gets +1 on all neighbor castles. Points of the new castle need to be calculated fully from scratch."
     * @param {CastleDto} castle
     */
    castle => {
        const castlesToInsert = [];
        const castlesToIncrement = [];
        const neighborCastles = castleService.getNeighborCastles(castle);
        neighborCastles.forEach(neighborCastle => {
            castlesToIncrement.push({
                ...neighborCastle,
                userId: castle.userId,
                amount: 1
            });
            const index = castlesToInsert.findIndex(p => p.userId === neighborCastle.userId);
            if (index === -1) {
                castlesToInsert.push({
                    ...castle,
                    userId: neighborCastle.userId,
                    amount: 1
                });
            } else {
                castlesToInsert[index].amount += 1;
            }
        });
        self.incrementCastlePoints(castlesToIncrement);
        self.insertCastlePoints(castlesToInsert);
        setTimeout(() => {
            event.emit(event.CASTLE_POINTS_CHANGED, {x: castle.x, y: castle.y});
            neighborCastles.forEach(neighborCastle => {
                event.emit(event.CASTLE_POINTS_CHANGED, {x: neighborCastle.x, y: neighborCastle.y});
            });
        });
    });

event.on(event.KNIGHT_CREATED,
    /**
     * @param {KnightEntity} knight
     */
    knight => {
        self.incrementCastlePoints([{...knight, amount: 1}]);
        event.emit(event.CASTLE_POINTS_CHANGED, {x: knight.x, y: knight.y});
    });

event.on(event.KNIGHT_DESTROYED,
    /**
     * @param {KnightEntity} knight
     */
    knight => {
        self.incrementCastlePoints([{...knight, amount: -1}]);
        event.emit(event.CASTLE_POINTS_CHANGED, {x: knight.x, y: knight.y});
    });

event.on(event.KNIGHT_MOVED,
    /**
     * @param {KnightEntity} knight
     */
    knight => {
        self.incrementCastlePoints([
            {...knight, amount: -1},
            {userId: knight.userId, x: knight.goToX, y: knight.goToY, amount: 1}
        ]);
        event.emit(event.CASTLE_POINTS_CHANGED, {x: knight.x, y: knight.y});
        event.emit(event.CASTLE_POINTS_CHANGED, {x: knight.goToX, y: knight.goToY});
    });

const self = {

    /**
     * @param {Position} castlePoint
     */
    deleteCastlePoints(castlePoint) {
        return db.prepare(`DELETE
                           FROM user_castle_points
                           WHERE castleX = @x
                             AND castleY = @y;`).run(castlePoint);
    },

    /**
     * @typedef CastlePoint
     * @type {object}
     * @property {number} userId
     * @property {number} x
     * @property {number} y
     * @property {number} amount
     *
     * @param {CastlePoint[]} castlePoints
     */
    incrementCastlePoints(castlePoints) {
        const statement = db.prepare(`UPDATE user_castle_points
                                      SET points = points + @amount
                                      WHERE userId = @userId
                                        AND castleX = @x
                                        AND castleY = @y`);
        return db.transaction((items) => {
            for (const item of items) {
                const {changes} = statement.run(item);
                if (changes === 0) {
                    self.castlePointsCleanUp(item);
                }
            }
        })(castlePoints);
    },

    castlePointsCleanUp({x, y, userId}) {
        console.log("[userCastlePointsService] Clean up needed!", x, y, userId);
        const neighborCastles = castleService.getNeighborCastles({x, y});
        const amount = neighborCastles.filter(c => c.userId === userId).length
        const {count} = db.prepare(`select count(*) as count
                                    from user_castle_points
                                    where castleX = ?
                                      and castleY = ?
                                      and userId = ?`).get(x, y, userId);
        if (count === 0) {
            self.insertCastlePoints([{
                x, y, userId, amount
            }])
        } else {
            self.updateCastlePoints([{
                x, y, userId, amount
            }]);
        }
    },

    /**
     * @param {CastlePoint[]} castlePoints
     */
    updateCastlePoints(castlePoints) {
        const statement = db.prepare(`UPDATE user_castle_points
                                      SET points=@amount
                                      WHERE userId = @userId
                                        AND castleX = @x
                                        AND castleY = @y;`);
        return db.transaction((items) => {
            for (const item of items) statement.run(item);
        })(castlePoints);
    },

    /**
     * @param {CastlePoint[]} castlePoints
     */
    insertCastlePoints(castlePoints) {
        const statement = db.prepare(`INSERT INTO user_castle_points (userId, castleX, castleY, points)
                                      VALUES (@userId, @x, @y, @amount);`);
        return db.transaction((items) => {
            for (const item of items) statement.run(item);
        })(castlePoints);
    },

    /**
     * @param {number} x
     * @param {number} y
     * @return {CastlePointsEntity}
     */
    mostPointsForCastle({x, y}) {
        return db.prepare(`SELECT *
                           FROM user_castle_points
                           WHERE castleX = ?
                             AND castleY = ?
                           ORDER BY points DESC
                           LIMIT 1;`).all(x, y)[0];
    }
};

module.exports = self;
