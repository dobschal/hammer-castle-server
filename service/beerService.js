const castleService = require("./castleService.js");
const knightService = require("./knightService.js");
const priceService = require("./priceService.js");
const config = require("../config.js");

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
    }
};

module.exports = beerService;
