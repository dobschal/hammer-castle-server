const statsService = require("./service/statsService");
const priceService = require("./service/priceService");
const castleService = require("./service/castleService");
const catapultService = require("./service/catapultService");
const warehouseService = require("./service/warehouseService");
const knightService = require("./service/knightService");
const userService = require("./service/userService");
const config = require("./config");

module.exports = {
    run: function () {
        setInterval(knightService.chargeKnights, config.CHARGE_KNIGHTS_INTERVAL);
        setInterval(knightService.moveKnights, config.MOVE_KNIGHTS_INTERVAL);

        setInterval(castleService.detectCastleConquer, config.DETECT_CONQUER_INTERVAL);
        setInterval(castleService.castlePointsCleanUp, config.CASTLE_CLEAN_UP_INTERVAL);

        setInterval(userService.cleanUp.bind(userService), config.USER_CLEAN_UP_INTERVAL);

        setInterval(warehouseService.cleanUp, config.WAREHOUSE_CLEAN_UP_INTERVAL);

        setInterval(priceService.makeHammers, config.MAKE_HAMMER_INTERVAL);
        setInterval(priceService.makeBeer, config.MAKE_HAMMER_INTERVAL);

        setInterval(catapultService.triggerCatapultAttacks, config.DETECT_CATAPULT_ATTACK_INTERVAL);

        // Stats
        const oneHour = 1000 * 60 * 60;
        const twentyFourHours = oneHour * 24;
        const thirtyDays = twentyFourHours * 30;
        setInterval(() => statsService.storeLastActive("1h", oneHour), oneHour);
        setInterval(() => statsService.storeLastActive("24h", twentyFourHours), oneHour);
        setInterval(() => statsService.storeLastActive("30d", thirtyDays), oneHour);
    }
};
