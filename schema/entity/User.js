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
 * @property {number} max_hammers
 * @property {number} last_active_at
 * @property {number} last_daily_reward_claim
 * @property {number} beer
 * @property {number} max_beer
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
    level: {type: "number"},
    max_hammers: {type: "number"},
    last_active_at: {type: "number"},
    last_daily_reward_claim: {type: "number"},
    beer: {type: "number"},
    max_beer: {type: "number"}
  }
};
