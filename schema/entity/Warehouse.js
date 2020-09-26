/**
 * @typedef Warehouse
 * @type {object}
 * @property {number} castle_1_x
 * @property {number} castle_1_y
 * @property {number} castle_2_x
 * @property {number} castle_2_y
 * @property {number} x
 * @property {number} y
 * @property {number} user_id
 * @property {string} timestamp
 * @property {string} color
 * @property {string} username
 */

module.exports = {
    type: "object",
    properties: {
        x: {type: "number"},
        y: {type: "number"},
        castle_1_x: {type: "number"},
        castle_1_y: {type: "number"},
        castle_2_x: {type: "number"},
        castle_2_y: {type: "number"},
        user_id: {type: "number"},
        timestamp: {type: "string"},
        color: {type: "string"},
        username: {type: "string"}
    }
};
