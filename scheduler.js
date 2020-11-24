const statsService = require("./service/statsService");
const castleService = require("./service/castleService");
const catapultService = require("./service/catapultService");
const hammerService = require("./service/hammerService");
const warehouseService = require("./service/warehouseService");
const beerService = require("./service/beerService");
const knightService = require("./service/knightService");
const userService = require("./service/userService");
const config = require("./config");
const conquerService = require("./service/conquerService");
const userCastlePointsService = require("./service/userCastlePointsService");
const timer = require("./lib/timer");
const kiService = require("./service/kiService");

/**
 * @param {function} callback
 * @param {number} delay
 */
function realInterval(callback, delay) {
    callback();
    setTimeout(() => realInterval(callback, delay), delay);
}

module.exports = {
    run: function () {

        // Clear all castles on start up
        timer.start("CLEAR_CASTLES_ON_START");
        castleService.getAll().forEach(c => userCastlePointsService.castlePointsCleanUp(c));
        timer.end("CLEAR_CASTLES_ON_START");

        realInterval(knightService.chargeKnights, config.CHARGE_KNIGHTS_INTERVAL);
        realInterval(knightService.moveKnights, config.MOVE_KNIGHTS_INTERVAL);

        realInterval(userService.cleanUp.bind(userService), config.USER_CLEAN_UP_INTERVAL);

        realInterval(warehouseService.cleanUp, config.WAREHOUSE_CLEAN_UP_INTERVAL);

        realInterval(hammerService.makeHammers, config.MAKE_RESOURCES_INTERVAL);
        realInterval(beerService.makeBeer, config.MAKE_RESOURCES_INTERVAL);

        realInterval(catapultService.triggerCatapultAttacks, config.DETECT_CATAPULT_ATTACK_INTERVAL);

        realInterval(conquerService.handleConquers, config.DETECT_CONQUER_INTERVAL);


        // Stats
        const oneHour = 1000 * 60 * 60;
        const twentyFourHours = oneHour * 24;
        const thirtyDays = twentyFourHours * 30;
        setInterval(() => statsService.storeLastActive(statsService.range["1h"], oneHour), oneHour);
        setInterval(() => statsService.storeLastActive(statsService.range["24h"], twentyFourHours), oneHour);
        setInterval(() => statsService.storeLastActive(statsService.range["30d"], thirtyDays), oneHour);

        setTimeout(kiService.start, 1000);
    }
};
