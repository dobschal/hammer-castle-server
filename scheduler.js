const statsService = require("./service/statsService");
const priceService = require("./service/priceService");
const castleService = require("./service/castleService");
const catapultService = require("./service/catapultService");
const warehouseService = require("./service/warehouseService");
const knightService = require("./service/knightService");
const userService = require("./service/userService");
const config = require("./config");
const conquerService = require("./service/conquerService");
const userCastlePointsService = require("./service/userCastlePointsService");
const timer = require("./lib/timer");

module.exports = {
    run: function () {

        // Clear all castles on start up
        timer.start("CLEAR_CASTLES");
        castleService.getAll().forEach(c => userCastlePointsService.castlePointsCleanUp(c))
        timer.end("CLEAR_CASTLES");

        setInterval(knightService.chargeKnights, config.CHARGE_KNIGHTS_INTERVAL);
        setInterval(knightService.moveKnights, config.MOVE_KNIGHTS_INTERVAL);

        setInterval(userService.cleanUp.bind(userService), config.USER_CLEAN_UP_INTERVAL);

        setInterval(warehouseService.cleanUp, config.WAREHOUSE_CLEAN_UP_INTERVAL);

        setInterval(priceService.makeHammers, config.MAKE_RESOURCES_INTERVAL);
        setInterval(priceService.makeBeer, config.MAKE_RESOURCES_INTERVAL);

        setInterval(catapultService.triggerCatapultAttacks, config.DETECT_CATAPULT_ATTACK_INTERVAL);

        const handleConquers = () => {
            conquerService.handleConquers();
            setTimeout(handleConquers, config.DETECT_CONQUER_INTERVAL);
        };
        handleConquers();


        // Stats
        const oneHour = 1000 * 60 * 60;
        const twentyFourHours = oneHour * 24;
        const thirtyDays = twentyFourHours * 30;
        setInterval(() => statsService.storeLastActive("1h", oneHour), oneHour);
        setInterval(() => statsService.storeLastActive("24h", twentyFourHours), oneHour);
        setInterval(() => statsService.storeLastActive("30d", thirtyDays), oneHour);
    }
};
