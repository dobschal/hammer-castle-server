/**
 * @typedef Conquer
 * @type {object}
 * @property {number} userId
 * @property {CastleDto} castle
 * @property {number} timestamp
 */

const CastleDto = require("./CastleDto");

module.exports = {
    type: "object",
    properties: {
        userId: {type: "number"},
        castle: CastleDto,
        timestamp: {type: "number"}
    }
};
