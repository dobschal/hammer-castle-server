/**
 * @typedef User
 * @type {object}
 * @property {number} id
 * @property {string} username
 * @property {string} password
 * @property {string} timestamp
 * @property {string} email
 * @property {number} email_verified
 * @property {string} color
 * @property {number} hammer
 * @property {number} startX
 * @property {number} startY
 * @property {number} hammer_per_minute
 * @property {number} level
 */

module.exports = {
  type: "object",
  properties: {
    id: {type: "number"},
    username: {type: "string"},
    password: {type: "string"},
    timestamp: {type: "string"},
    email: {type: "string"},
    email_verified: {type: "number"},
    color: {type: "string"},
    startX: {type: "number"},
    startY: {type: "number"},
    hammer: {type: "number"},
    hammer_per_minute: {type: "number"},
    level: {type: "number"}
  }
};
