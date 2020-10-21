module.exports = {
    type: "object",
    required: ["email"],
    properties: {
        id: {type: "number"},
        username: {type: "string"},
        password: {type: "string"},
        timestamp: {type: "string"},
        email: {type: "string"},
        email_verified: {type: "number"},
        color: {type: "string"},
        startX: {type: "number"},
        startY: {type: "number"},
        hammer: {type: "number"},
        hammer_per_minute: {type: "number"},
        level: {type: "number"},
        max_hammers: {type: "number"},
        last_active_at: {type: "number"},
        last_daily_reward_claim: {type: "number"},
        beer: {type: "number"},
        max_beer: {type: "number"}
    }
};
