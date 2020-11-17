const db = require("../lib/database");

module.exports = function () {
    db.prepare(
            `CREATE TABLE IF NOT EXISTS user_quest
             (
                 questId   INTEGER NOT NULL,
                 userId    INTEGER NOT NULL,
                 timestamp INTEGER NOT NULL,
                 status    TEXT    NOT NULL
             );`
    ).run();
};
