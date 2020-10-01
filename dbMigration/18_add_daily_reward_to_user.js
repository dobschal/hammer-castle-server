const db = require("../lib/database");

module.exports = function (app) {
    db.prepare(`ALTER TABLE user
        ADD last_daily_reward_claim INTEGER DEFAULT 0;`).run();
};
