const db = require("../lib/database");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS user_castle_points
             (
                 id      INTEGER PRIMARY KEY AUTOINCREMENT,
                 castleX INTEGER NOT NULL,
                 castleY INTEGER NOT NULL,
                 userId  INTEGER NOT NULL,
                 points  INTEGER NOT NULL
             );`
    ).run();

    db.prepare(
            `CREATE INDEX user_castle_points_index_x_y_user_id
                ON user_castle_points (castleX, castleY, userId);`
    ).run();
    db.prepare(
        `CREATE INDEX user_castle_points_index_x_y
                ON user_castle_points (castleX, castleY);`
    ).run();

};
