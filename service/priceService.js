const timer = require("../lib/timer");
const castleService = require("./castleService");
const warehouseService = require("./warehouseService");
const config = require("../config");
let userService;
const websocket = require("./websocketService");
const knightService = require("./knightService");

setTimeout(() => {
    userService = require("./userService");
});

const self = {

    /**
     * @param {number} userId
     * @param {number} castlesCount
     * @return {number}
     */
    aimedHammersPerHour(userId, castlesCount) {
        const amountOfCastles = castlesCount || castleService.countCastlesOfUser(userId);
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
        return Math.floor(self.aimedHammersPerHour(userId) * 0.6);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    nextKnightPrice(userId) {

        let summedKnightLevels;
        try {
            [{summedKnightLevels}] = knightService.getSummedKnightLevels(userId);
        } catch (e) {
            summedKnightLevels = 0;
        }

        // One Castle level 6 can feed one knight...
        // So a player can have at least 6 warehouses level 2 at one castle!
        // ATM 300 Beer is the base price, which means 3 warehouses level 2 per knight.

        return config.KNIGHT_PRICE * (summedKnightLevels + 1);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    nextCatapultPrice(userId) {
        return Math.floor(self.aimedHammersPerHour(userId) * 0.2);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    nextWarehousePrice(userId) {
        const price1 = Math.floor(self.aimedHammersPerHour(userId) * 0.3);
        const {max_hammers} = userService.getById(userId);
        const price2 = Math.floor(max_hammers ? max_hammers / config.MAX_FARM_RESOURCES_HOURS : 0);
        return Math.min(price1, price2);
    },

    /**
     * @param {number} userId
     * @return {number}
     */
    upgradeWarehousePrice(userId) {
        const price1 = Math.floor(self.aimedHammersPerHour(userId) * 0.66);
        const {max_hammers} = userService.getById(userId);
        const price2 = Math.floor(max_hammers ? max_hammers * 0.8 : 0);
        return Math.min(price1, price2);
    },

    /**
     * @param {number} userId
     * @param {number} castlesCount
     * @return {number}
     */
    calculateMaxHammer(userId, castlesCount) {
        castlesCount = castlesCount || castleService.countCastlesOfUser(userId);
        const realMax = self.aimedHammersPerHour(userId, castlesCount) * config.MAX_FARM_RESOURCES_HOURS;
        const maxPossibleAmountOfWarehouses = (castlesCount - 1) * 2 - 1;
        const amountOfWarehouses = warehouseService.countWarehousesOfUser(userId, 1) + 1;
        return Math.floor(amountOfWarehouses / maxPossibleAmountOfWarehouses * realMax);
    },

    /**
     * Each warehouse level 2 can store 100 beer...
     * @param {number} userId
     * @return {number}
     */
    calculateMaxBeer(userId) {
        const amountOfWarehouses = warehouseService.countWarehousesOfUser(userId, 2) + 1;
        return amountOfWarehouses * 100;
    }
};

module.exports = self;
