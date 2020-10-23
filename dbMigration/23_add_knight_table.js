const db = require("../lib/database");
const config = require("../config");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS knight
             (
                 id        INTEGER PRIMARY KEY AUTOINCREMENT,
                 x         INTEGER      NOT NULL,
                 y         INTEGER      NOT NULL,
                 goToX     INTEGER,
                 goToY     INTEGER,
                 arrivesAt INTEGER,
                 userId    INTEGER      NOT NULL,
                 name      VARCHAR(255) NOT NULL,
                 level     INTEGER DEFAULT 1
             );`
    ).run();

};
