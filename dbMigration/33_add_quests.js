const db = require("../lib/database");

module.exports = function () {
    db.prepare(`insert into quest (isRecurring, titleKey, messageKey, imageName,
                                   benefitType, benefitValue)
                VALUES (@isRecurring, @titleKey, @messageKey, @imageName,
                        @benefitType, @benefitValue)`)
        .run({
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
            isRecurring: 1,
            recurringInterval: "DAILY",
            titleKey: "quest.dailyLogin.title",
            messageKey: "quest.dailyLogin.message",
            imageName: "dailyLogin",
            benefitType: "FILL_UP_STORAGE"
        });
};
