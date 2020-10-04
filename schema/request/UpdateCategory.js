/**
 * @typedef UpdateCategoryRequest
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {string} description
 */

module.exports = {
    type: "object",
    required: ["name", "description", "id"],
    properties: {
        id: {type: "number"},
        name: {type: "string"},
        description: {type: "string"}
    }
};
