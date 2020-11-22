const db = require("../lib/database");

module.exports = function () {

    db.prepare("drop table if exists quest").run();

    db.prepare("drop table if exists user_quest").run();

    db.prepare(
            `CREATE TABLE IF NOT EXISTS quest
             (
                 id                VARCHAR(255) UNIQUE PRIMARY KEY,
                 prevQuestId       VARCHAR(255),
                 isRecurring       INTEGER DEFAULT 0,
                 recurringInterval TEXT,
                 titleKey          TEXT,
                 messageKey        TEXT,
                 imageName         TEXT,
                 benefitType       TEXT,
                 benefitValue      INTEGER
             );`
    ).run();

    db.prepare(
            `CREATE TABLE IF NOT EXISTS user_quest
             (
                 questId   VARCHAR(255),
                 userId    INTEGER NOT NULL,
                 timestamp INTEGER NOT NULL,
                 status    TEXT    NOT NULL
             );`
    ).run();

    db.prepare(`insert into quest (id, isRecurring, titleKey, messageKey, imageName,
                                   benefitType, benefitValue)
                VALUES (@id, @isRecurring, @titleKey, @messageKey, @imageName,
                        @benefitType, @benefitValue)`)
        .run({
            id: "FIRST_CASTLE",
            isRecurring: 0,
            titleKey: "quest.firstCastle.title",
            messageKey: "quest.firstCastle.message",
            imageName: "firstCastle",
            benefitType: "HAMMER",
            benefitValue: 200
        });

    db.prepare(`insert into quest (id, isRecurring, recurringInterval, titleKey, messageKey, imageName,
                                   benefitType)
                VALUES (@id, @isRecurring, @recurringInterval, @titleKey, @messageKey, @imageName,
                        @benefitType)`)
        .run({
            id: "DAILY_REWARD",
            isRecurring: 1,
            recurringInterval: "DAILY",
            titleKey: "quest.dailyLogin.title",
            messageKey: "quest.dailyLogin.message",
            imageName: "dailyLogin",
            benefitType: "FILL_UP_STORAGE"
        });
}
