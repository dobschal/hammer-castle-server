const db = require("../lib/database");

module.exports = function (app) {

    db.prepare(
            `CREATE INDEX warehouse_index_x_y
                ON warehouse (x, y);`
    ).run();

    db.prepare(
            `CREATE INDEX warehouse_index_x_y_user_id
                ON warehouse (x, y, user_id);`
    ).run();

    db.prepare(
            `CREATE INDEX warehouse_index_user_id
                ON warehouse (user_id);`
    ).run();

};
