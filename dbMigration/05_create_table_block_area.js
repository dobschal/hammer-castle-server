const db = require("../lib/database");
const config = require("../config");

// block_area types can be "forest" or "water"

module.exports = function (app) {

    db.prepare(
            `CREATE TABLE IF NOT EXISTS block_area
             (
                 x    INTEGER      NOT NULL,
                 y    INTEGER      NOT NULL,
                 size INTEGER      NOT NULL,
                 type VARCHAR(255) NOT NULL
             );`
    ).run();

};
