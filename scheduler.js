const statsService = require("./service/statsService");
const hammerService = require("./service/hammerService");
const castleService = require("./service/castle");
const catapultService = require("./service/catapultService");
const warehouseService = require("./service/warehouseService");
const config = require("./config");

module.exports = {
    run: function () {
        setInterval(castleService.detectCastleConquer, config.DETECT_CONQUER_INTERVAL);
        setInterval(castleService.castlePointsCleanUp, config.CASTLE_CLEAN_UP_INTERVAL);
        setInterval(warehouseService.cleanUp, config.WAREHOUSE_CLEAN_UP_INTERVAL);
        setInterval(hammerService.makeHammers, config.MAKE_HAMMER_INTERVAL);
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
