const db = require("../lib/database");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS friend
             (
                 id      INTEGER PRIMARY KEY AUTOINCREMENT,
                 userAId INTEGER NOT NULL,
                 userBId INTEGER NOT NULL
             );`
    ).run();

};
