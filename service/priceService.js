const castleService = require("./castle");
const warehouseService = require("./warehouseService");
const config = require("../config");
let userService;
const websocket = require("./websocket");

setTimeout(() => {
    userService = require("./user");
}, 1000);

const updatesPerMinute = 60000 / config.MAKE_HAMMER_INTERVAL;

module.exports = {

    /**
     * @param {number} userId
     * @return {number}
     */
    aimedHammersPerHour(userId) {
        const amountOfCastles = castleService.countCastlesOfUser(userId);
        switch (amountOfCastles) {
            case 0:
                return 0;
            case 1:
                return 0;
            case 2:
                return 120;
            case 3:
                return 360;
            case 4:
                return 600;
            default:
                const hammersPerMinute = config.AVERAGE_POINTS_PER_CASTLE * amountOfCastles;
                return hammersPerMinute * 60;
        }
    },

    /**

     /**
     * @param {number} userId
     * @return {number}
     */
    nextCastlePrice(userId) {
        return Math.floor(this.aimedHammersPerHour(userId) * 0.6);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    nextCatapultPrice(userId) {
        return Math.floor(this.aimedHammersPerHour(userId) * 0.3);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    nextWarehousePrice(userId) {
        const price1 = Math.floor(this.aimedHammersPerHour(userId) * 0.4);
        const price2 = Math.floor(userService.getById(userId).max_hammers ? userService.getById(userId).max_hammers / config.MAX_HAMMER_HOURS : 0);
        return Math.min(price1, price2);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    calculateMaxHammer(userId) {
        const realMax = this.aimedHammersPerHour(userId) * config.MAX_HAMMER_HOURS;
        const maxPossibleAmountOfWarehouses = (castleService.countCastlesOfUser(userId) - 1) * 2 - 1;
        const amountOfWarehouses = warehouseService.countWarehousesOfUser(userId) + 1;
        return Math.floor(amountOfWarehouses / maxPossibleAmountOfWarehouses * realMax);
    },

    makeHammers() {
        const t1 = Date.now();
        let sum = 0;
        castleService.getPointsSummedUpPerUser().forEach(userPoints => {
            const pointsToGive = Math.floor(userPoints.points / updatesPerMinute);
            sum += pointsToGive;
            const user = userService.giveHammers(userPoints.userId, pointsToGive);
            if (websocket.connections[user.username]) {
                websocket.connections[user.username].emit("UPDATE_USER", {hammer: user.hammer});
            }
        });
        console.log("[hammerService] Made " + sum + " hammers in: " + (Date.now() - t1) + "ms.");
    }
};
