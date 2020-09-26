const db = require("../lib/database");
const config = require("../config");

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS warehouse
             (
                 x          INTEGER NOT NULL,
                 y          INTEGER NOT NULL,
                 castle_1_x INTEGER NOT NULL,
                 castle_1_y INTEGER NOT NULL,
                 castle_2_x INTEGER NOT NULL,
                 castle_2_y INTEGER NOT NULL,
                 timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 user_id    INTEGER NOT NULL
             );`
    ).run();

};
