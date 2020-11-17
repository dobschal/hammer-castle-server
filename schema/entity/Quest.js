module.exports = {
    type: "object",
    properties: {
        id: {type: "number"},
        prevQuestId: {type: "number"},
        isRecurring: {type: "number"},
        recurringInterval: {type: "string"},
        titleKey: {type: "string"},
        messageKey: {type: "string"},
        imageName: {type: "string"},
        benefitType: {type: "string"},
        benefitValue: {type: "number"}
    }
};
