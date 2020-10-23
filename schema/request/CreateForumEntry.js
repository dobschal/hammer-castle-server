
module.exports = {
    type: "object",
    required: ["categoryId", "content"],
    properties: {
        categoryId: {type: "number"},
        content: {type: "string"}
    }
};
