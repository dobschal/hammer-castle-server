/**
 * @typedef CreateForumEntryRequest
 * @type {object}
 * @property {number} categoryId
 * @property {number} userId
 * @property {string} content
 * @property {number} timestamp
 */

module.exports = {
    type: "object",
    required: ["name", "description"],
    properties: {
        categoryId: {type: "number"},
        content: {type: "string"},
        timestamp: {type: "number"},
        userId: {type: "number"}
    }
};
