const security = require("../lib/security");
const db = require("../lib/database");
const schema = require("../lib/schema");
const ConflictError = require("../error/ConflictError");
const UnauthorisedError = require("../error/UnauthorisedError");
const config = require("../config");
const securityService = require("./security");
const FraudError = require("../error/FraudError");
let priceService;
setTimeout(() => {
    priceService = require("./priceService");
}, 1000);

/**
 * @return {User}
 */
function currentUser(req) {
    const tokenBody = securityService.getTokenBody(req);
    schema.is(tokenBody, "UserTokenBody");
    return getUserFromTokenBody(tokenBody);
}


/**
 * @param tokenBody
 * @return {User}
 */
function getUserFromTokenBody(tokenBody) {
    return db.prepare(`SELECT *
                       FROM user
                       WHERE id = ?`).get(tokenBody.id);
}

function create({username, password, color}, ip) {
    const {amount} = db
        .prepare("SELECT COUNT(*) AS amount FROM user WHERE username=?")
        .get(username);
    if (amount > 0) throw new ConflictError("Username is already taken.");
    password = security.encrypt(password, process.env.SECRET);
    const {x, y} = _getStartPosition();
    const {lastInsertRowid: userId} = db
        .prepare("INSERT INTO user (username, password, color, hammer, max_hammers, startX, startY) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(username, password, color, 200, 0, x, y);
    db.prepare("INSERT INTO user_role (user_id, role) VALUES (?, 'USER')").run(
        userId
    );
    db.prepare("INSERT INTO user_ip (user_id, ip, timestamp) VALUES (?,?,?);").run(userId, ip, Date.now());
    return userId;
}

/**
 * @param {number} userId
 * @return {User}
 */
function getById(userId) {
    return db.prepare(`SELECT *
                       FROM user
                       WHERE id = ?`).get(userId)
}

function authenticate({username, password}, ip) {
    password = security.encrypt(password, process.env.SECRET);
    const user = db
        .prepare(
                `
                    SELECT id, username, password, group_concat(user_role.role) as userRoles
                    FROM user
                             JOIN user_role on user.id = user_role.user_id
                    WHERE user.username = ?
                    GROUP BY user.id;
            `
        )
        .get(username);
    if (!user) throw new UnauthorisedError("User not found.");
    if (password !== user.password)
        throw new UnauthorisedError("Wrong credentials.");
    delete user.password;
    const userTokenBody = {
        expires: Date.now() + config.TOKEN_EXPIRATION,
        ...user
    };
    schema.is(userTokenBody, "UserTokenBody");
    const token = security.signedUserToken(userTokenBody, process.env.SECRET);
    checkIpForLogin(ip, user.id);
    return {token};
}

function getAllUsers() {
    const users = db
        .prepare(
                `SELECT user.id,
                        user.username,
                        user.timestamp               as registeredAt,
                        group_concat(user_role.role) as userRoles
                 FROM user
                          JOIN user_role on user.id = user_role.user_id
                 GROUP BY user.id;`
        )
        .all();
    return users;
}

function getRanking() {
    return db.prepare("SELECT username, level, id FROM user ORDER BY level DESC;").all();
}

/**
 * @param {string} ip
 * @param {string} userId
 */
function checkIpForLogin(ip, userId) {
    const {count} = db.prepare("SELECT COUNT(*) as count FROM user_ip WHERE ip=? AND user_id!=? AND timestamp > ?").get(ip, userId, Date.now() - 1000 * 60 * 60);
    if (count > config.USERS_PER_IP) {
        throw new FraudError("Too many users (" + count + ") with same IP. Sorry!");
    }
    const userIpObj = db.prepare("SELECT * FROM user_ip WHERE ip=? AND user_id=?").get(ip, userId);
    if (userIpObj) {
        const result = db.prepare("UPDATE user_ip SET timestamp=? WHERE ip=? AND user_id=?").run(Date.now(), ip, userId);
        console.log("[user] Stored IP of login (update): ", userId, ip);
    } else {
        const result = db.prepare("INSERT INTO user_ip (user_id, ip, timestamp) VALUES (?,?,?)").run(userId, ip, Date.now());
        console.log("[user] Stored IP of login (insert): ", userId, ip);
    }
}

function checkIpForRegistration(ip) {
    const {count} = db.prepare("SELECT COUNT(*) as count FROM user_ip WHERE ip=?").get(ip);
    if (count > config.USERS_PER_IP) {
        throw new FraudError("Too many users with same IP. Sorry!");
    }
}

/**
 * @param {User} user
 */
function claimDailyReward(user) {
    db.prepare("UPDATE user SET hammer=?, last_daily_reward_claim=? WHERE id=?").run(user.max_hammers, Date.now(), user.id);
    const actionLogService = require("./actionLogService");
    actionLogService.save("You claimed your daily reward and filled up your storage with hammers fro free.", user.id, user.username);
    const websocket = require("./websocket");
    if (websocket.connections[user.username]) {
        websocket.connections[user.username].emit("UPDATE_USER", {
            hammer: user.max_hammers,
            last_daily_reward_claim: Date.now()
        });
    }
}

/**
 * @return {Position}
 */
function _getStartPosition() {
    const position = db.prepare("SELECT x, y FROM castle ORDER BY ABS(X) DESC, ABS(Y) DESC LIMIT 1").get() || {
        x: 0,
        y: 0
    };
    position.x += Math.floor(Math.random() * 1000);
    position.y += Math.floor(Math.random() * 1000);
    return position;
}

/**
 * @param {number} userId
 * @return {Position}
 */
function getPlayersHome(userId) {
    return db.prepare("SELECT x, y FROM castle WHERE user_id=? ORDER BY timestamp DESC LIMIT 1").get(userId) || {x: 0, y: 0};
}

module.exports = {
    getById,
    create,
    authenticate,
    getAllUsers,
    currentUser,
    getUserFromTokenBody,

    /**
     * @param {number} userId
     * @param {number} amountOfHammers
     * @return {User}
     */
    giveHammers(userId, amountOfHammers) {
        const user = getById(userId);
        if (user.hammer > user.max_hammers) return user;
        user.hammer = Math.min(user.hammer + Math.max(1, amountOfHammers), user.max_hammers);
        db.prepare(`UPDATE user
                    SET hammer = ?
                    WHERE id = ?`).run(user.hammer, userId);
        return user;
    },

    /**
     * @param {number} userId
     * @return {User} - updated one
     */
    updateUserValues(userId) {
        const maxHammers = priceService.calculateMaxHammer(userId);
        const {level} = db.prepare(`select sum(c.points) as level
                                    from castle c
                                    where c.user_id = ?`).get(userId);
        db.prepare(`UPDATE user
                    SET hammer_per_minute = ?,
                        level             = ?,
                        max_hammers       = ?
                    WHERE id = ?`).run(level, level, maxHammers, userId);
        return getById(userId);
    },

    cleanUp() {
        const t1 = Date.now();
        const users = db.prepare(`select *
                                  from user`).all();
        users.forEach(user => {
            this.updateUserValues(user.id);
        });
        console.log("[user] Cleaned up " + users.length + " user in " + (Date.now() - t1) + "ms.");
    },

    getRanking,
    checkIpForRegistration,
    checkIpForLogin,
    claimDailyReward,
    getPlayersHome
};
