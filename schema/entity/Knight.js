module.exports = {
    type: "object",
    properties: {
        id: {
            type: "number"
        },
        x: {
            type: "number"
        },
        y: {
            type: "number"
        },
        goToX: {
            type: "number"
        },
        goToY: {
            type: "number"
        },
        arrivesAt: { // timestamp that says when the knight is arriving at a new castle.
            type: "number"
        },
        level: {
            type: "number"
        },
        userId: {
            type: "number"
        },
        name: {
            type: "string"
        }
    }
};
