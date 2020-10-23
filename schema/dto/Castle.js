module.exports = {
    type: "object",
    properties: {
        x: {type: "number"},
        y: {type: "number"},
        userId: {type: "number"},
        points: {type: "number"},
        color: {type: "string"},
        username: {type: "string"},
        name: {type: "string"},
        pointsPerUser: {
            type: "object"
        }
    }
};
