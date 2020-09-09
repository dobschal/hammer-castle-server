const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE castle ADD name VARCHAR(255) DEFAULT '';`).run();
};
