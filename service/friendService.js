const db = require("../lib/database");
const UserNotFoundError = require("../error/UserNotFoundError");
const ConflictError = require("../error/ConflictError");

const self = {

    /**
     * @param {string} query
     */
    findUser(query) {
        return db.prepare(`select username, id, startY, startX, last_active_at as lastActiveAt, level from user where username like '%${query}%'`).all();
    },

    /**
     * @param {string} friendsUsername
     * @param {UserEntity} user
     */
    addFriend(friendsUsername, user) {
        const {id: friendsId} = db.prepare(`select id
                                            from user
                                            where username = ?`).get(friendsUsername);
        if (!friendsId)
            throw new UserNotFoundError("The user does not exist!");
        const result = db.prepare(`select *
                                   from friend
                                   where (userAId = @friendsId AND userBId = @userId)
                                      OR (userBId = @userId AND userAId = @friendsId)`).get({
            friendsId,
            userId: user.id
        });
        if (result)
            throw new ConflictError("You are already friends...");
        db.prepare(`insert into friend (userAId, userBId)
                    VALUES (?, ?)`).run(user.id, friendsId);
    },

    /**
     * @param {UserEntity} user
     */
    getFriendsList(user) {
        return db.prepare(`select user.username,
                                  user.id,
                                  user.level,
                                  user.last_active_at as lastActiveAt
                           from friend
                                    join user
                                         on ((user.id = friend.userBId or
                                              user.id = friend.userAId) and
                                             user.id <> @id)
                           where userAId = @id
                              OR userBId = @id`).all(user);
    }
};

module.exports = self;
