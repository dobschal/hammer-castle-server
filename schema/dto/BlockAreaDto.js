/**
 * @typedef BlockAreaDto
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} size
 * @property {string} type
 */

module.exports = {
    type: "object",
    properties: {
        x: {type: "number"},
        y: {type: "number"},
        size: {type: "number"},
        type: {type: "string"}
    }
};
