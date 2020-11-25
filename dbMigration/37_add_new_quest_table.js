const db = require("../lib/database");

module.exports = function () {

    db.prepare("drop table if exists quest").run();

    db.prepare(
            `CREATE TABLE IF NOT EXISTS quest
             (
                 id           VARCHAR(255) UNIQUE PRIMARY KEY,
                 prevQuestId  VARCHAR(255),
                 titleKey     TEXT,
                 messageKey   TEXT,
                 imageName    TEXT,
                 benefitType  TEXT,
                 benefitValue INTEGER,
                 eventName    VARCHAR(255)
             );`
    ).run();

    db.prepare(`insert into quest (id, eventName, titleKey, messageKey, imageName,
                                   benefitType, benefitValue)
                VALUES (@id, @eventName, @titleKey, @messageKey, @imageName,
                        @benefitType, @benefitValue)`)
        .run({
            id: "FIRST_CASTLE",
            eventName: "CASTLE_CREATED",
            titleKey: "quest.firstCastle.title",
            messageKey: "quest.firstCastle.message",
            imageName: "firstCastle",
            benefitType: "HAMMER",
            benefitValue: 200
        });

    db.prepare("drop table if exists quest_condition").run();

    db.prepare(
            `CREATE TABLE IF NOT EXISTS quest_condition
             (
                 questId   VARCHAR(255),
                 key       VARCHAR(255),
                 value     VARCHAR(255),
                 valueType VARCHAR(255)
             );`
    ).run();

    db.prepare(`insert into quest_condition (questId, key, value, valueType)
                VALUES (@questId, @key, @value, @valueType)`)
        .run({
            questId: "FIRST_CASTLE",
            key: "AMOUNT_OF_CASTLES",
            value: "1", // always string !!!
            valueType: "number"
        });

};
