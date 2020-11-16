const db = require("../lib/database");

module.exports = function (app) {

    db.prepare(
            `CREATE INDEX castle_index_x_y
                ON castle (x, y);`
    ).run();

};
