const db = require("../lib/database");

module.exports = function () {
    db.prepare(
            `CREATE TABLE IF NOT EXISTS quest
             (
                 id                INTEGER PRIMARY KEY AUTOINCREMENT,
                 prevQuestId       INTEGER DEFAULT NULL,
                 isRecurring       INTEGER DEFAULT 0,
                 recurringInterval TEXT,
                 titleKey          TEXT,
                 messageKey        TEXT,
                 imageName         TEXT,
                 benefitType       TEXT,
                 benefitValue      INTEGER
             );`
    ).run();
};
