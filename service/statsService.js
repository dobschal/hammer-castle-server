const db = require("../lib/database");
const userService = require("./userService");

const self = {

    thirtyDays: 1000 * 60 * 60 * 24 * 30,

    range: {
        "1h": "1h",
        "24h": "24h",
        "30d": "30d"
    },

    /**
     * @param {string} rangeName - like "1h" or "7d"
     * @param rangeMilliseconds - "1h" would be 1000 * 60 * 60
     */
    storeLastActive(rangeName, rangeMilliseconds) {
        const {count} = db.prepare("SELECT COUNT(*) as count FROM user WHERE last_active_at>?;").get(Date.now() - rangeMilliseconds);
        db.prepare("INSERT INTO stats (timestamp, time_range, value, name) VALUES (?,?,?,?)").run(Date.now(), rangeName, count, "active_users");
        console.log("[statsService] Stored stats for active users: ", rangeName, count);
    },

    getActiveUsers(range = self.range["24h"], since = Date.now() - self.thirtyDays) {
        return db.prepare(`select *
                           from stats
                           where timestamp > @since
                             and name = 'active_users'
                             and time_range = @range
                           ORDER BY timestamp DESC;`)
            .all({since, range})
            .map(candle => {
                candle.date = new Date(candle.timestamp).toISOString().substring(0, 10);
                return candle;
            })
            .filter((candle, index, candles) => {

                //  The candles are sorted descending. So for entries < i, the
                //  timestamp is older. We take always the last entry at a day.

                let dayAlreadyInserted = false;
                for (let i = index - 1; i >= 0; i--) {
                    if (candles[i].date === candle.date) {
                        dayAlreadyInserted = true;
                        break;
                    }
                }
                return !dayAlreadyInserted;
            });
    }
};

module.exports = self;
