const database = require("../lib/database");
const event = require("../lib/event");

event.on(event.CASTLE_CREATED, ({userId, x, y}) => {
    setTimeout(() => {
        console.log("[questService] Castle created: ", userId, x, y);
        const {count} = database
            .prepare(`select count(*) as count
                      from castle
                      where user_id = @userId
                        and x = @x
                        and y = @y;`)
            .get({
                userId, x, y
            });
        if (count === 1) {
            console.log("[questService] User solved quest. Castles count: ", count);
        }
    });
});

const self = {

    status: {

        //  The quest is totally new to the user and the user did
        //  not see the description yet. This status should make a
        //  badge in the UI and the "open quests" button
        OPEN_NEW: "OPEN_NEW",

        //  Not solved yet, but the user has seen the description
        //  of the quest.
        OPEN_SEEN: "OPEN_SEEN",

        //  An internal event happened, so that quest got solved,
        //  but the hasn't seen that yet and has not claimed the
        //  benefit.
        SOLVED: "SOLVED_NEW",

        //  Done. Benefit claimed and quest solved.
        SOLVED_SEEN: "SOLVED_SEEN"
    },

    /**
     * @param {number} userId
     * @return {(QuestEntity & UserQuestEntity)[]}
     */
    getNextQuests(userId) {
        const quests = self.getUnsolvedQuests(userId);
        if (quests.length === 0) {
            quests.push(self.getStartQuest(userId));
        } else {
            if (!quests.some(q => !q.isRecurring && q.status !== self.status.SOLVED_SEEN)) {
                quests.push(self.getNextNonRecurringQuest(userId));
            }
        }
        return quests;
    },

    /**
     * @param {number} userId
     * @return {(QuestEntity & UserQuestEntity)[]}
     */
    getUnsolvedQuests(userId) {
        return database
            .prepare(`select *
                      from user_quest uq
                               join quest q on q.id = uq.questId
                      where userId = ?
                        and uq.status <> 'SOLVED_SEEN'`).all(userId);
    },

    /**
     * @param {number} userId
     * @return {(QuestEntity & UserQuestEntity)}
     */
    getStartQuest(userId) {
        const [quest] = database
            .prepare(`select *
                      from quest
                      where isRecurring = 0
                        and prevQuestId IS NULL
                      LIMIT 1`).all();
        database
            .prepare(`insert into user_quest (questId, userId, timestamp, status)
                      values (@questId, @userId, @timestamp, @status)`)
            .run({
                questId: quest.id,
                userId,
                timestamp: Date.now(),
                status: self.status.OPEN_NEW
            });
        return self.getByUserIdAndQuestId(quest.id, userId);
    },

    /**
     * @param {number} userId
     * @return {(QuestEntity & UserQuestEntity)}
     */
    getNextNonRecurringQuest(userId) {
        const [lastSolvedQuest] = database
            .prepare(`select *
                      from user_quest uq
                               join quest q on q.id = uq.questId
                      where uq.userId = @userId
                      order by uq.timestamp desc
                      limit 1`).all({userId});
        const [quest] = database
            .prepare(`select *
                      from quest
                      where isRecurring = 0
                        and prevQuestId = ?
                      LIMIT 1`).all(lastSolvedQuest.id);
        return self.getByUserIdAndQuestId(quest.id, userId);
    },

    /**
     * @param {number} questId
     * @param {number} userId
     * @return {(QuestEntity & UserQuestEntity)}
     */
    getByUserIdAndQuestId(questId, userId) {
        return database
            .prepare(`select *
                      from quest q
                               join user_quest uq on uq.questId = q.id
                      where uq.userId = @userId
                        and q.id = @questId`)
            .get({
                questId,
                userId
            });
    },

    /**
     * @param {number} questId
     * @param {UserEntity} user
     * @return {Boolean}
     */
    readQuest(questId, user) {
        const {changes} = database
            .prepare(`update user_quest
                      set status='OPEN_SEEN'
                      where status = 'OPEN_NEW'
                        and questId = @questId
                        and userId = @userId`)
            .run({questId, userId: user.id});
        return changes === 1;
    }
};

module.exports = self;
