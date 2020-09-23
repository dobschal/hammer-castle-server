const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE user ADD hammer_per_minute INTEGER DEFAULT 0;`).run();
    db.prepare(`ALTER TABLE user ADD level INTEGER DEFAULT 0;`).run();
};
