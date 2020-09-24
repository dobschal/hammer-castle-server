const db = require("../lib/database");
const config = require("../config");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS catapult
             (
                 x                 INTEGER NOT NULL,
                 y                 INTEGER NOT NULL,
                 opponent_castle_x INTEGER NOT NULL,
                 opponent_castle_y INTEGER NOT NULL,
                 timestamp         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 lifetime          INTEGER NOT NULL,
                 user_id           INTEGER NOT NULL
             );`
    ).run();

};
