module.exports = {
    type: "object",
    properties: {
        id: {type: "number"},
        prevQuestId: {type: "number"},
        eventName: {type: "string"},
        titleKey: {type: "string"},
        messageKey: {type: "string"},
        imageName: {type: "string"},
        benefitType: {type: "string"},
        benefitValue: {type: "number"}
    }
};
