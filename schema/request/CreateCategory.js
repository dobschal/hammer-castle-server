/**
 * @typedef CreateCategoryRequest
 * @type {object}
 * @property {string} name
 * @property {string} description
 */

module.exports = {
    type: "object",
    required: ["name", "description"],
    properties: {
        name: {type: "string"},
        description: {type: "string"}
    }
};
