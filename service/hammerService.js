const websocketService = require("./websocketService");
const castleService = require("./castleService");
const userService = require("./userService");
const config = require("../config");
const timer = require("../lib/timer");
const updatesPerMinute = 60000 / config.MAKE_RESOURCES_INTERVAL;

const self = {
    makeHammers() {
        timer.start("MAKE_HAMMER");
        const usersToUpdate = [];
        castleService.getPointsSummedUpPerUser().forEach(({points, username, userId, hammer, max_hammers}) => {
            if (hammer >= max_hammers) return;
            const hammerToAdd = Math.floor(points / updatesPerMinute);
            hammer = Math.min(hammer + Math.max(1, hammerToAdd), max_hammers);
            usersToUpdate.push({id: userId, hammer});
            setTimeout(() => websocketService.sendTo(username, "UPDATE_USER", {hammer}));
        });
        userService.updateMany(["hammer"], usersToUpdate);
        timer.end("MAKE_HAMMER", `${usersToUpdate.length} users updated and informed.`);
    }
};

module.exports = self;
