const castleService = require("./castle");
const config = require("../config");
const userService = require("./user");
const websocket = require("./websocket");

function makeHammers() {
    const t1 = Date.now();
    const castles = castleService.getAll();
    const userPoints = {};
    castles.forEach(c => {
        if (typeof userPoints[c.userId] === "undefined") {
            userPoints[c.userId] = 0;
        }
        userPoints[c.userId] += c.points;
    });
    for (const userId in userPoints) {
        if (userPoints.hasOwnProperty(userId)) {
            const user = userService.giveHammers(Number(userId), userPoints[userId]);
            // console.log("[hammerService] User is getting hammers: ", userPoints[userId], user.username);
            if (websocket.connections[user.username]) {
                websocket.connections[user.username].emit("UPDATE_USER", {hammer: user.hammer});
            }
        }
    }
    console.log("[hammerService] Made hammers in: " + (Date.now() - t1) + "ms.");
}

module.exports = {makeHammers};
