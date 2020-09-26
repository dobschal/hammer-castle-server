/**
 * @typedef CreateWarehouseRequest
 * @type {object}
 * @property {number} castle1X
 * @property {number} castle1Y
 * @property {number} castle2X
 * @property {number} castle2Y
 * @property {number} x
 * @property {number} y
 */

module.exports = {
    type: "object",
    properties: {
        x: {type: "number"},
        y: {type: "number"},
        castle1X: {type: "number"},
        castle1Y: {type: "number"},
        castle2X: {type: "number"},
        castle2Y: {type: "number"}
    }
};
