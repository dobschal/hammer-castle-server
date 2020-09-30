const db = require("../lib/database");

module.exports = function (app) {
    db.prepare(`ALTER TABLE catapult
        ADD chance_to_win INTEGER DEFAULT 50;`).run();
};
