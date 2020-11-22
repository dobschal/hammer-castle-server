const db = require("../lib/database");

module.exports = function () {
    db.prepare(
            `CREATE TABLE IF NOT EXISTS user_quest
             (
                 questId   VARCHAR(255),
                 userId    INTEGER NOT NULL,
                 timestamp INTEGER NOT NULL,
                 status    TEXT    NOT NULL
             );`
    ).run();
};
