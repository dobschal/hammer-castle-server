const db = require("../lib/database");

module.exports = function (app) {
    db.prepare(`ALTER TABLE action_log
        ADD x INTEGER NOT NULL DEFAULT -1;`).run();
    db.prepare(`ALTER TABLE action_log
        ADD y INTEGER NOT NULL DEFAULT -1;`).run();
    db.prepare(`ALTER TABLE action_log
        ADD type VARCHAR(255) NOT NULL DEFAULT 'UNKNOWN';`).run();
};
