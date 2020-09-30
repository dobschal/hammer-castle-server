const db = require("../lib/database");
const userService = require("./user");

module.exports = {
    /**
     * @param {string} rangeName - like "1h" or "7d"
     * @param rangeMilliseconds - "1h" would be 1000 * 60 * 60
     */
    storeLastActive(rangeName, rangeMilliseconds) {
        const {count} = db.prepare("SELECT COUNT(*) as count FROM user WHERE last_active_at>?;").get(Date.now() - rangeMilliseconds);
        db.prepare("INSERT INTO stats (timestamp, time_range, value, name) VALUES (?,?,?,?)").run(Date.now(), rangeName, count, "active_users");
        console.log("[statsService] Stored stats for active users: ", rangeName, count);
    }
};
