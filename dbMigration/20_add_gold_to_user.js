const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE user ADD gold INTEGER DEFAULT 0;`).run();
    db.prepare(`ALTER TABLE user ADD max_gold INTEGER DEFAULT 0;`).run();
};
