const db = require("../lib/database");
const config = require("../config");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS action_log
             (
                 id        INTEGER PRIMARY KEY AUTOINCREMENT,
                 timestamp INTEGER NOT NULL,
                 content   TEXT    NOT NULL,
                 user_id   INTEGER NOT NULL
             );`
    ).run();

};
