const db = require("../lib/database");

module.exports = function () {
    db.prepare(`insert into quest (id, isRecurring, titleKey, messageKey, imageName,
                                   benefitType, benefitValue)
                VALUES (@isRecurring, @titleKey, @messageKey, @imageName,
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

    db.prepare(`insert into quest (isRecurring, recurringInterval, titleKey, messageKey, imageName,
                                   benefitType)
                VALUES (@isRecurring, @recurringInterval, @titleKey, @messageKey, @imageName,
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
};
