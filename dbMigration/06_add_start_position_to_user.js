const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE user ADD startX INTEGER DEFAULT 0;`).run();
    db.prepare(`ALTER TABLE user ADD startY INTEGER DEFAULT 0;`).run();
};
