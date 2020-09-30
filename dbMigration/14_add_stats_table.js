const db = require("../lib/database");
const config = require("../config");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS stats
             (
                 id         INTEGER PRIMARY KEY AUTOINCREMENT,
                 timestamp  INTEGER      NOT NULL,
                 time_range VARCHAR(255) NOT NULL,
                 value      INTEGER      NOT NULL,
                 name       VARCHAR(255) NOT NULL
             );`
    ).run();

};
