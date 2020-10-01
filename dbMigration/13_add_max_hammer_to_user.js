const db = require("../lib/database");

module.exports = function (app) {
    db.prepare(`ALTER TABLE user
        ADD max_hammers INTEGER DEFAULT 180;
    ALTER TABLE user
        ADD last_active_at INTEGER DEFAULT 0;`).run();
};
