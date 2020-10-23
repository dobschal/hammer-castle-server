const CastleDto = require("./Castle");

module.exports = {
    type: "object",
    properties: {
        userId: {type: "number"},
        castle: CastleDto,
        timestamp: {type: "number"}
    }
};
