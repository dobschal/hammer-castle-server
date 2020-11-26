const websocketService = require("./websocketService");
const tool = require("../lib/tool");
const event = require("../lib/event.js");

event.on(event.USER_CONNECTED, /** @param {UserEntity} user */user => {
    self.send(user.username, user.username + " is online!", "USER_ONLINE", user.startX, user.startY);
});

const self = {

    /**
     * @param {string} username
     * @param {string} message
     * @param {string} type
     * @param {number} x
     * @param {number} y
     */
    send(username, message, type, x, y) {
        setTimeout(() => {
            websocketService.broadcast("SHORT_MESSAGE", {
                id: tool.createRandomId(),
                message,
                type,
                x,
                y
            });
        });
    }
};

module.exports = self;
