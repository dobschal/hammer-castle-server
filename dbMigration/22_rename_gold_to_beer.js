const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE user RENAME COLUMN gold TO beer;`).run();
    db.prepare(`ALTER TABLE user RENAME COLUMN max_gold TO max_beer;`).run();
};
