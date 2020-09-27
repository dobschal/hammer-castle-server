const security = require("../lib/security");
const db = require("../lib/database");
const schema = require("../lib/schema");
const ConflictError = require("../error/ConflictError");
const UnauthorisedError = require("../error/UnauthorisedError");
const config = require("../config");
const securityService = require("./security");
const websocketService = require("./websocket");

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
  return db.prepare(`SELECT * FROM user WHERE id=?`).get(tokenBody.id);
}

function create({ username, password, color }) {
    const {amount} = db
        .prepare("SELECT COUNT(*) AS amount FROM user WHERE username=?")
        .get(username);
    if (amount > 0) throw new ConflictError("Username is already taken.");
    password = security.encrypt(password, process.env.SECRET);
    const {lastInsertRowid: userId} = db
        .prepare("INSERT INTO user (username, password, color, hammer, max_hammers) VALUES (?, ?, ?, ?, ?)")
        .run(username, password, color, config.START_HAMMER, config.MAX_HAMMERS);
    db.prepare("INSERT INTO user_role (user_id, role) VALUES (?, 'USER')").run(
        userId
    );
    return userId;
}

const priceMultiplier = config.BASE_TIMER * (60000 / config.MAKE_HAMMER_INTERVAL);

/**
 * @param {User} user
 * @param {CastleDto[]} castles
 * @param {Warehouse[]} warehouses
 * @return {User} - updated one
 */
function updateUserValues(user, castles, warehouses) {
    if (castles) {
        const level = castles.reduce((prev, curr) => prev + curr.points, 0);
        const hammerPerMinute = level * (60000 / config.MAKE_HAMMER_INTERVAL);
        db.prepare(`UPDATE user
                    SET hammer_per_minute = ?,
                        level             = ?
                    WHERE id = ?`).run(hammerPerMinute, level, user.id);
    }
    if (warehouses) {
        const maxHammers = Math.max(config.MAX_HAMMERS, (warehouses.length) * config.AVERAGE_ROADS_PER_CASTLE * priceMultiplier);
        db.prepare(`UPDATE user
                    SET max_hammers = ?
                    WHERE id = ?`).run(maxHammers, user.id);
    }
    return getById(user.id)
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

/**
 * @param {number} userId
 * @param {number} amountOfHammers
 * @return {User}
 */
function giveHammers(userId, amountOfHammers) {
    const {hammer, maxHammers} = db.prepare("SELECT hammer, max_hammers as maxHammers FROM user WHERE id=?").get(userId);
    db.prepare(`UPDATE user
                SET hammer = ?
                WHERE id = ?`).run(Math.min(hammer + amountOfHammers, maxHammers), userId);
    return db.prepare(`SELECT *
                       FROM user
                       WHERE id = ?`).get(userId);
}

function authenticate({username, password}) {
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
  return { token };
}

function getAllUsers() {
    const users = db
        .prepare(
                `SELECT user.id,
                        user.username,
                        user.timestamp as registeredAt,
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
 * @param {string} username
 * @return {boolean}
 */
function isOnline(username) {
    return Boolean(websocketService.connections[username]);
}

module.exports = {
    getById,
    create,
    authenticate,
    getAllUsers,
    currentUser,
    getUserFromTokenBody,
    giveHammers,
    updateUserValues,
    getRanking,
    isOnline
};
