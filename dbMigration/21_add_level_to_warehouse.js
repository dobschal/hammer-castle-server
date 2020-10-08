const db = require("../lib/database");

module.exports = function(app) {
    db.prepare(`ALTER TABLE warehouse ADD level INTEGER DEFAULT 1;`).run();
};
