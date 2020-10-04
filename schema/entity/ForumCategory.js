/**
 * @typedef ForumCategory
 * @type {object}
 * @property {string} name
 * @property {string} description
 * @property {number} id
 */

module.exports = {
    type: "object",
    properties: {
        id: {type: "number"},
        name: {type: "string"},
        description: {type: "string"}
    }
};
