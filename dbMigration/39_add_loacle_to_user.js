const db = require("../lib/database");

module.exports = function () {
    db.prepare(`ALTER TABLE user
        ADD locale VARCHAR(4) DEFAULT 'en';`).run();
};
