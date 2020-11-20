const castleService = require("./castleService.js");
const knightService = require("./knightService.js");
const priceService = require("./priceService.js");
const userService = require("./userService.js");
const websocketService = require("./websocketService");
const config = require("../config.js");
const timer = require("../lib/timer");

const updatesPerMinute = 60000 / config.MAKE_RESOURCES_INTERVAL;

const beerService = {

    /**
     * @param {number} userId
     * @return {number}
     */
    beerCostsPerMinute(userId) {
        const result = knightService.getSummedKnightLevels(userId);
        if (result.length !== 1) return 0;
        return config.KNIGHT_BEER_COST_PER_LEVEL * result[0].summedKnightLevels;
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    beerPerMinute(userId) {
        const result = castleService.getBeerPoints(userId);
        if (result.length !== 1) return 0;
        return result[0].points || 0;
    },

    /**
     * @param userId
     * @return {{maxBeer: number, beerPerMinute: number, beerCostsPerMinute: number}}
     */
    beerStats(userId) {
        const maxBeer = priceService.calculateMaxBeer(userId);
        const beerPerMinute = beerService.beerPerMinute(userId);
        const beerCostsPerMinute = beerService.beerCostsPerMinute(userId);
        return {
            maxBeer,
            beerPerMinute,
            beerCostsPerMinute
        }
    },

    makeBeer() {
        timer.start("MAKE_BEER");
        const usersToUpdate = [];
        castleService.getBeerPointsPerUser().forEach(({points, username, userId, beer, max_beer}) => {
            if (beer >= max_beer) return;
            const beerToAdd = Math.floor(points / updatesPerMinute);
            beer = Math.min(beer + Math.max(1, beerToAdd), max_beer);
            usersToUpdate.push({id: userId, beer});
            setTimeout(() => websocketService.sendTo(username, "UPDATE_USER", {beer: beer}));
        });
        userService.updateMany(["beer"], usersToUpdate);
        timer.end("MAKE_BEER", `${usersToUpdate.length} users updated and informed.`);
    }
};

module.exports = beerService;
