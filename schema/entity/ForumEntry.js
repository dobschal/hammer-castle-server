/**
 * @typedef ForumEntry
 * @type {object}
 * @property {number} id
 * @property {number} categoryId
 * @property {number} userId
 * @property {string} content
 * @property {number} timestamp
 */

module.exports = {
    type: "object",
    properties: {
        id: {type: "number"},
        categoryId: {type: "number"},
        content: {type: "string"},
        timestamp: {type: "number"},
        userId: {type: "number"}
    }
};
