/**
 * @typedef CreateForumEntryRequest
 * @type {object}
 * @property {number} categoryId
 * @property {string} content
 */

module.exports = {
    type: "object",
    required: ["categoryId", "content"],
    properties: {
        categoryId: {type: "number"},
        content: {type: "string"}
    }
};
