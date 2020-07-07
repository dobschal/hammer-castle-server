const security = require("../lib/security");
const db = require("../lib/database");
const schema = require("../lib/schema");
const ConflictError = require("../error/ConflictError");
const UnauthorisedError = require("../error/UnauthorisedError");
const config = require("../config");
const securityService = require("./security");

function currentUser(req) {
  const tokenBody = securityService.getTokenBody(req);
  schema.is(tokenBody, "UserTokenBody");
  return getUserFromTokenBody(tokenBody);
}

function getUserFromTokenBody(tokenBody) {
  return db.prepare(`SELECT * FROM user WHERE id=?`).get(tokenBody.id);
}

function create({ username, password }) {
  const { amount } = db
    .prepare("SELECT COUNT(*) AS amount FROM user WHERE username=?")
    .get(username);
  if (amount > 0) throw new ConflictError("Username is already taken.");
  password = security.encrypt(password, process.env.SECRET);
  const { lastInsertRowid: userId } = db
    .prepare("INSERT INTO user (username, password) VALUES (?, ?)")
    .run(username, password);
  db.prepare("INSERT INTO user_role (user_id, role) VALUES (?, 'USER')").run(
    userId
  );
  return userId;
}

function authenticate({ username, password }) {
  password = security.encrypt(password, process.env.SECRET);
  const user = db
    .prepare(
      `
      SELECT id, username, password,  group_concat(user_role.role) as userRoles
      FROM user 
      JOIN user_role on user.id=user_role.user_id 
      WHERE user.username=? 
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
      `SELECT user.id, user.username, user.timestamp as registeredAt, group_concat(user_role.role) as userRoles 
  FROM user 
  JOIN user_role on user.id=user_role.user_id 
  GROUP BY user.id;`
    )
    .all();
  return users;
}

module.exports = {
  create,
  authenticate,
  getAllUsers,
  currentUser,
  getUserFromTokenBody
};
