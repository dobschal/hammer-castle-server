
module.exports = {
    type: "object",
    required: ["name", "description", "id"],
    properties: {
        id: {type: "number"},
        name: {type: "string"},
        description: {type: "string"}
    }
};
