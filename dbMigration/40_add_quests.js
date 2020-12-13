const db = require("../lib/database");

module.exports = function () {

    db.prepare(`insert into quest (id, eventName, titleKey, messageKey,
                                   imageName,
                                   benefitType, benefitValue, prevQuestId)
                VALUES (@id, @eventName, @titleKey, @messageKey, @imageName,
                        @benefitType, @benefitValue, @prevQuestId)`)
        .run({
            id: "FIVE_WAREHOUSES",
            eventName: "WAREHOUSE_CREATED",
            titleKey: "quest.fiveWarehouses.title",
            messageKey: "quest.fiveWarehouses.message",
            imageName: "fiveWarehouses",
            benefitType: "HAMMER",
            benefitValue: 1500,
            prevQuestId: "FIVE_CASTLES"
        });

    db.prepare(`insert into quest_condition (questId, key, value, valueType)
                VALUES (@questId, @key, @value, @valueType)`)
        .run({
            questId: "FIVE_WAREHOUSES",
            key: "AMOUNT_OF_WAREHOUSES",
            value: "5", // always string !!!
            valueType: "number"
        });

    db.prepare(`insert into quest (id, eventName, titleKey, messageKey,
                                   imageName,
                                   benefitType, benefitValue, prevQuestId)
                VALUES (@id, @eventName, @titleKey, @messageKey, @imageName,
                        @benefitType, @benefitValue, @prevQuestId)`)
        .run({
            id: "FIRST_WAREHOUSE_LEVEL_2",
            eventName: "WAREHOUSE_UPGRADED",
            titleKey: "quest.warehouseLevel2.title",
            messageKey: "quest.warehouseLevel2.message",
            imageName: "warehouseLevel2",
            benefitType: "BEER",
            benefitValue: 100,
            prevQuestId: "FIVE_WAREHOUSES"
        });

    db.prepare(`insert into quest_condition (questId, key, value, valueType)
                VALUES (@questId, @key, @value, @valueType)`)
        .run({
            questId: "FIRST_WAREHOUSE_LEVEL_2",
            key: "AMOUNT_OF_WAREHOUSES_LEVEL_2",
            value: "1", // always string !!!
            valueType: "number"
        });
};
