const db = require("../lib/database");

module.exports = function () {

    db.prepare(`insert into quest (id, eventName, titleKey, messageKey,
                                   imageName,
                                   benefitType, benefitValue, prevQuestId)
                VALUES (@id, @eventName, @titleKey, @messageKey, @imageName,
                        @benefitType, @benefitValue, @prevQuestId)`)
        .run({
            id: "FIRST_WAREHOUSE",
            eventName: "WAREHOUSE_CREATED",
            titleKey: "quest.firstWarehouse.title",
            messageKey: "quest.firstWarehouse.message",
            imageName: "firstWarehouse",
            benefitType: "HAMMER",
            benefitValue: 300,
            prevQuestId: "FIRST_CASTLE"
        });

    db.prepare(`insert into quest_condition (questId, key, value, valueType)
                VALUES (@questId, @key, @value, @valueType)`)
        .run({
            questId: "FIRST_WAREHOUSE",
            key: "AMOUNT_OF_WAREHOUSES",
            value: "1", // always string !!!
            valueType: "number"
        });

    db.prepare(`insert into quest (id, eventName, titleKey, messageKey,
                                   imageName,
                                   benefitType, benefitValue, prevQuestId)
                VALUES (@id, @eventName, @titleKey, @messageKey, @imageName,
                        @benefitType, @benefitValue, @prevQuestId)`)
        .run({
            id: "FIVE_CASTLES",
            eventName: "CASTLE_CREATED",
            titleKey: "quest.fiveCastles.title",
            messageKey: "quest.fiveCastles.message",
            imageName: "fiveCastles",
            benefitType: "HAMMER",
            benefitValue: 1000,
            prevQuestId: "FIRST_WAREHOUSE"
        });

    db.prepare(`insert into quest_condition (questId, key, value, valueType)
                VALUES (@questId, @key, @value, @valueType)`)
        .run({
            questId: "FIVE_CASTLES",
            key: "AMOUNT_OF_CASTLES",
            value: "5", // always string !!!
            valueType: "number"
        });
};
