const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE user ADD hammer INTEGER DEFAULT 0;`).run();
};
