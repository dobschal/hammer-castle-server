const db = require("../lib/database");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS conquer
             (
                 id      INTEGER PRIMARY KEY AUTOINCREMENT,
                 castleX INTEGER NOT NULL,
                 castleY INTEGER NOT NULL,
                 userId  INTEGER NOT NULL,
                 startedAt INTEGER NOT NULL
             );`
    ).run();

    db.prepare(
            `CREATE INDEX conquer_index_x_y_user_id
                ON conquer (castleX, castleY, userId);`
    ).run();

    db.prepare(
            `CREATE INDEX conquer_index_x_y
                ON conquer (castleX, castleY);`
    ).run();

};
