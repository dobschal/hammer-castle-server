const db = require("../lib/database");

module.exports = function () {
    db.prepare(`ALTER TABLE quest
        ADD autoOpen Integer DEFAULT 1;`).run();
};
