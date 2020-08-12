/**
 * @typedef CastleDto
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} userId
 * @property {number} points
 * @property {string} color
 * @property {string} username
 */

module.exports = {
    type: "object",
    properties: {
        x: {type: "number"},
        y: {type: "number"},
        userId: {type: "number"},
        points: {type: "number"},
        color: {type: "string"},
        username: {type: "string"}
    }
};
