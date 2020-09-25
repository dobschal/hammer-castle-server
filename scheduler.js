const hammerService = require("./service/hammerService");
const castleService = require("./service/castle");
const catapultService = require("./service/catapultService");
const config = require("./config");

module.exports = {
    run: function () {
        setInterval(castleService.detectCastleConquer, config.DETECT_CONQUER_INTERVAL);
        setInterval(castleService.castlePointsCleanUp, config.CASTLE_CLEAN_UP_INTERVAL);
        setInterval(hammerService.makeHammers, config.MAKE_HAMMER_INTERVAL);
        setInterval(catapultService.triggerCatapultAttacks, config.DETECT_CATAPULT_ATTACK_INTERVAL);
    }
};
