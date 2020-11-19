const db = require("../lib/database");
const event = require("../lib/event");

event.on(event.CASTLE_CREATED, ({userId, x, y}) => {
    setTimeout(() => {

    });
});

const self = {

    // TODO: add daily quests...

    /**
     * @param {number} userId
     * @return {QuestEntity[]}
     */
    getNextQuests(userId) {
        const quests = db.prepare(`select *
                                   from user_quest
                                            join quest on quest.id = user_quest.questId
                                   where userId = ?`).all(userId);
        if(quests.length === 0) {
            return self.getStartQuests();
        }

        return []; // TODO: implement
    },

    /**
     * @return {QuestEntity[]}
     */
    getStartQuests() {
        return db.prepare(`select * from quest where isRecurring=0 and prevQuestId IS NULL`).all();
    }
};

module.exports = self;
