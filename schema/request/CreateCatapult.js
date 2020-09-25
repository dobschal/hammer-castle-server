/**
 * @typedef CreateCatapultRequest
 * @type {object}
 * @property {number} opponentCastleX
 * @property {number} opponentCastleY
 * @property {number} userCastleX
 * @property {number} userCastleY
 * @property {number} x
 * @property {number} y
 */

module.exports = {
    type: "object",
    properties: {
        x: {type: "number"},
        y: {type: "number"},
        opponentCastleX: {type: "number"},
        opponentCastleY: {type: "number"},
        userCastleX: {type: "number"},
        userCastleY: {type: "number"}
    }
};
