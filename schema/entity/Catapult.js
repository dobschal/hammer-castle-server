/**
 * @typedef Catapult
 * @type {object}
 * @property {number} opponent_castle_x
 * @property {number} opponent_castle_y
 * @property {number} user_castle_x
 * @property {number} user_castle_y
 * @property {number} x
 * @property {number} y
 * @property {number} user_id
 * @property {number} lifetime
 * @property {string} timestamp
 * @property {string} color
 * @property {string} username
 * @property {number} chance_to_win // in percent
 */

module.exports = {
    type: "object",
    properties: {
        x: {type: "number"},
        y: {type: "number"},
        opponent_castle_x: {type: "number"},
        opponent_castle_y: {type: "number"},
        user_castle_x: {type: "number"},
        user_castle_y: {type: "number"},
        user_id: {type: "number"},
        lifetime: {type: "number"},
        timestamp: {type: "string"},
        color: {type: "string"},
        username: {type: "string"},
        chance_to_win: {type: "number"}
    }
};
