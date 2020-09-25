const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE catapult ADD user_castle_x INTEGER DEFAULT 0;`).run();
    db.prepare(`ALTER TABLE catapult ADD user_castle_y INTEGER DEFAULT 0;`).run();
};
