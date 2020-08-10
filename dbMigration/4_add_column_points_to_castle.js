const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE castle ADD points INTEGER DEFAULT 0;`).run();
};
