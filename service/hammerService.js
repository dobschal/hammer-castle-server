const castleService = require("./castle");
const config = require("../config");
const userService = require("./user");
const websocket = require("./websocket");

function makeHammers() {
    console.log("[hammerService] Make hammers!");
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
}

module.exports = {makeHammers};
