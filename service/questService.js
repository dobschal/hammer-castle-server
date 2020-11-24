const database = require("../lib/database");
const event = require("../lib/event");
const websocketService = require("../service/websocketService");
const userService = require("../service/userService");
const ConflictError = require("../error/ConflictError");

//  Logic:
//  Each quest record has an dedicated event.
//  No recurring quests!
//  Each event needs param 1 to have a property userId!
//  On server app start event listeners are attached for each quest record
//  A separate quest_condition table controls the quest solved state

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
        SOLVED_NEW: "SOLVED_NEW",

        //  Done. Benefit claimed and quest solved.
        SOLVED_SEEN: "SOLVED_SEEN"
    },

    conditionResolver: {

        /**
         * @param {QuestEntity} quest
         * @param {QuestConditionEntity} condition
         * @param {number} userId
         * @param {*} [props]
         * @return {boolean}
         */
        AMOUNT_OF_CASTLES(quest, condition, userId, props) {
            const {count} = database
                .prepare("select count(*) as count from castle where user_id = @userId")
                .get({userId});
            return count >= parseInt(condition.value);
        }
    },

    init() {
        console.log("[questService] Initialise quest event listeners.");
        database
            .prepare("select * from quest")
            .all()
            .forEach(/** @param {QuestEntity} quest */quest => {
                if (!(quest.eventName in event)) {
                    return console.error("[quest] The quest '" + quest.id + "' has an unknown event name '" + quest.eventName + "'.");
                }
                const conditions = database
                    .prepare("select * from quest_condition where questId=@questId;")
                    .all({questId: quest.id});
                event.on(quest.eventName, ({userId, ...props}) => {
                    if (!userId) {
                        return console.error("[quest] The event '" + quest.eventName + "' does not provide the property userId at param 1. This is needed for quest handling!");
                    }
                    const {count} = database
                        .prepare("select count(*) as count from user_quest where userId=@userId and questId=@questId and status in ('OPEN_NEW', 'OPEN_SEEN')")
                        .get({userId, questId: quest.id});
                    if (count > 0) {
                        self.handleQuestRelatedEvent(quest, conditions, userId, props);
                    } else {
                        console.log("[questService] User has no related quest on action.");
                    }
                });
            });
    },

    /**
     * @param {QuestEntity} quest
     * @param {QuestConditionEntity[]} conditions
     * @param {number} userId
     * @param {*} [props]
     */
    handleQuestRelatedEvent(quest, conditions, userId, props) {
        console.log("[questService] Quest event triggered: ", quest, conditions, userId, props);
        const hasUnresolvedCondition = conditions.some(/** @param {QuestConditionEntity} condition */condition => {
            return !self.conditionResolver[condition.key](quest, condition, userId, props);
        });
        if (!hasUnresolvedCondition) {
            database
                .prepare("update user_quest set status='SOLVED_NEW' where questId = @questId and userId = @userId")
                .run({questId: quest.id, userId});
            const {username} = database
                .prepare("select username from user where id=@userId;")
                .get({userId});
            websocketService.sendTo(username, "UPDATE_QUEST", {
                status: "SOLVED_NEW"
            });
        }
    },

    /**
     * @param {number} userId
     * @return {(QuestEntity & UserQuestEntity)[]}
     */
    getNextQuests(userId) {
        const quests = self.getUnsolvedQuests(userId);
        if (!quests.some(q => q.status !== self.status.SOLVED_SEEN)) {
            const quest = self.getNextQuest(userId);
            if (quest) quests.push(quest);
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
                      where prevQuestId IS NULL
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
     * @return {(QuestEntity & UserQuestEntity)|void}
     */
    getNextQuest(userId) {
        const [lastSolvedQuest] = database
            .prepare(`select *
                      from user_quest uq
                               join quest q on q.id = uq.questId
                      where uq.userId = @userId
                      order by uq.timestamp desc
                      limit 1`).all({userId});
        if (!lastSolvedQuest) {
            return self.getStartQuest(userId);
        }
        const [quest] = database
            .prepare(`select *
                      from quest
                      where prevQuestId = ?
                      LIMIT 1`).all(lastSolvedQuest.id);
        if (!quest) return;
        return self.getByUserIdAndQuestId(quest.id, userId);
    },

    /**
     * @param {string} questId
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
     * @param {string} questId
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
    },

    /**
     * @param {string} questId
     * @param {UserEntity} user
     * @return {Boolean}
     */
    claimReward(questId, user) {
        const query = `select *
                       from user_quest uq
                                join quest q on uq.questId = q.id
                       where uq.status = 'SOLVED_NEW'
                         and uq.questId = @questId
                         and uq.userId = @userId;`
        /** @type {(QuestEntity & UserQuestEntity)} */
        const userQuest = database
            .prepare(query)
            .get({questId, userId: user.id});
        if (!userQuest || userQuest.status !== self.status.SOLVED_NEW) {
            throw new ConflictError("Quest claim failed.");
        }
        database
            .prepare(`UPDATE user_quest
                      SET status='SOLVED_SEEN'
                      WHERE questId = @questId
                        and userId = @userId`)
            .run({userId: user.id, questId: questId});
        websocketService.sendTo(user.username, "UPDATE_QUEST", {
            status: "SOLVED_SEEN"
        });
        switch (userQuest.benefitType) {
            case "HAMMER":
                database
                    .prepare(`UPDATE user
                              SET hammer = hammer + @hammer
                              WHERE id = @userId`)
                    .run({userId: user.id, hammer: userQuest.benefitValue});
                const {hammer} = database
                    .prepare(`select hammer
                              from user
                              where id = @userId`)
                    .get({userId: user.id});
                websocketService.sendTo(user.username, "UPDATE_USER", {hammer});
                break;
            case "BEER":
                database
                    .prepare(`UPDATE user
                              SET beer = beer + @beer
                              WHERE id = @userId`)
                    .run({userId: user.id, beer: userQuest.benefitValue});
                const {beer} = database
                    .prepare(`select beer
                              from user
                              where id = @userId`)
                    .get({userId: user.id});
                websocketService.sendTo(user.username, "UPDATE_USER", {beer});
                break;
            default:
                throw new Error("Internal server error, benefit type of quest is not correct! " + userQuest.benefitType);
        }

        // TODO: add action log with live preview to show the user the reward...

    }
};

self.init();

module.exports = self;
