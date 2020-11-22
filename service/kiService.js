const userService = require("./userService");
const castleService = require("./castleService");
const priceService = require("./priceService");
const warehouseService = require("./warehouseService");
const blockAreaService = require("./blockAreaService");
const catapultService = require("./catapultService");
const config = require("../config");
const timer = require("../lib/timer");
const tool = require("../lib/tool");
const players = ["Mischa", "Luni", "Johnny", "Pete", "Lelek"];
const playersData = {};
const timeout = 30000;

const self = {

    start() {
        players.forEach(playerName => {
            self.registerPlayer(playerName);
            self.authenticatePlayer(playerName);
            console.log("[kiService] Authenticated KI players...");
            self.buildCastle(playerName);
        });
    },

    registerPlayer(playerName) {
        try {
            userService.create({
                username: playerName,
                password: process.env.SECRET,
                color: tool.randomColor()
            }, "non-" + playerName);
        } catch (e) {
        }
    },

    authenticatePlayer(playerName) {
        const {token} = userService.authenticate({
            username: playerName,
            password: process.env.SECRET
        }, "non-" + playerName);
        playersData[playerName] = {
            token,
            user: userService.getByUsername(playerName)
        };
    },

    /**
     * @param {UserEntity} user
     */
    claimDailyReward(user) {
        try {
            userService.claimDailyReward(user);
            console.log("[kiService] User got daily reward: ", user.username);
            return true;
        } catch (e) {
            console.log("[kiService] No daily reward: ", user.username);
        }
        return false;
    },

    buildCastle(playerName) {
        timer.start("KI_BUILD_CASTLE");
        let user = userService.getByUsername(playerName);
        if (self.claimDailyReward(user)) {
            user = userService.getByUsername(playerName);
        }
        const price = priceService.nextCastlePrice(user.id);
        if (user.max_hammers < price) {
            console.log("[kiService] Build warehouse next, cause max hammers is too low...", playerName);
            timer.end("KI_BUILD_CASTLE", playerName);
            return setTimeout(() => self.buildWarehouse(playerName), timeout);
        }
        if (user.hammer < price) {
            console.log("[kiService] KI Player hos not enough hammer for a castle: ", playerName, user.hammer, price);
            timer.end("KI_BUILD_CASTLE", playerName);
            return setTimeout(() => self.buildCastle(playerName), timeout);
        }
        const castles = castleService.getAllOfUser(user);
        let position;
        if (castles.length === 0) {
            position = userService.getStartPosition();
        } else {
            const possibleNeighbors = castles.filter(c => c.points < 5);
            const aroundCastle = possibleNeighbors[Math.floor(Math.random() * possibleNeighbors.length)];
            let tries = 0;
            while (tries < 50) {

                // Random position around existing castle...
                const distanceFromCastle = Math.floor((config.MIN_CASTLE_DISTANCE + config.MAX_CASTLE_DISTANCE) / 2);
                const randomAngle = Math.random() * Math.PI * 2;
                const x = Math.floor(distanceFromCastle * Math.cos(randomAngle) + aroundCastle.x);
                const y = Math.floor(distanceFromCastle * Math.sin(randomAngle) + aroundCastle.y);
                position = {x, y};

                //  Check that new chosen position is not too close to another castle.
                const tooCloseToOtherCastle = castleService
                    .getNeighborCastles(position)
                    .some(c => tool.positionDistance(c, position) < config.MIN_CASTLE_DISTANCE);
                if (!tooCloseToOtherCastle && !blockAreaService.isInsideBlockArea(position)) {
                    break;
                } else {
                    position = undefined;
                }

                tries++;
            }
        }
        if (position) {
            try {
                castleService.create(position, user);
                console.log("[kiService] KI player " + playerName + " build castle at: ", position.x, position.y);
                setTimeout(() => self.buildWarehouse(playerName), timeout);
            } catch (e) {
                console.log("[kiService] Failed to build castle.", playerName, e.message);
                setTimeout(() => self.buildCastle(playerName), timeout);
            }
        } else {
            console.log("[kiService] Didn't find position for new castle: ", playerName);
            setTimeout(() => self.buildCastle(playerName), timeout);
        }
        timer.end("KI_BUILD_CASTLE", playerName);
    },

    buildWarehouse(playerName) {
        timer.start("KI_BUILD_WAREHOUSE");
        const user = userService.getByUsername(playerName);
        const castles = castleService.getAllOfUser(user);
        const warehouses = warehouseService.getAllOfUser(user);
        const price = priceService.nextWarehousePrice(user.id)
        if (user.hammer < price) {
            console.log("[kiService] KI Player hos not enough hammer for warehouse: ", playerName, user.hammer, price);
            timer.end("KI_BUILD_WAREHOUSE", playerName);
            return setTimeout(() => self.buildWarehouse(playerName), timeout);
        }
        if (castles.length < 2) {
            timer.end("KI_BUILD_WAREHOUSE", playerName);
            return setTimeout(() => self.buildCastle(playerName), timeout);
        }
        let tries = 0;
        let firstCastle, secondCastle, position;
        while (tries < 50) {
            firstCastle = castles[Math.floor(Math.random() * castles.length)];
            secondCastle = castles.find(c => firstCastle.x !== c.x && firstCastle.y !== c.y && tool.positionDistance(firstCastle, c) < config.MAX_CASTLE_DISTANCE);
            if (firstCastle && secondCastle) {
                position = {
                    x: Math.round((firstCastle.x + secondCastle.x) / 2),
                    y: Math.round((firstCastle.y + secondCastle.y) / 2)
                };
                if (!warehouses.some(w => w.x === position.x && w.y === position.y)) {
                    break;
                } else {
                    position = undefined;
                }
            }
            tries++;
        }
        if (firstCastle && secondCastle && position) {
            try {
                warehouseService.create({
                    x: position.x,
                    y: position.y,
                    castle1X: firstCastle.x,
                    castle1Y: firstCastle.y,
                    castle2X: secondCastle.x,
                    castle2Y: secondCastle.y
                }, user);
                setTimeout(() => self.buildCatapult(playerName), timeout);
            } catch (e) {
                console.log("[kiService] Failed to build warehouse.", playerName, e.message);
                setTimeout(() => self.buildWarehouse(playerName), timeout);
            }
        } else {
            console.log("[kiService] No place for new warehouse found...", playerName);
            setTimeout(() => self.buildWarehouse(playerName), timeout);
        }
        timer.end("KI_BUILD_WAREHOUSE", playerName);
    },

    buildCatapult(playerName) {
        timer.start("KI_BUILD_CATAPULT");
        const user = userService.getByUsername(playerName);
        const price = priceService.nextCatapultPrice(user.id);
        if (user.max_hammers < price) {
            console.log("[kiService] Max hammers less than catapult price: ", playerName, price, user.max_hammers);
            timer.end("KI_BUILD_CATAPULT", playerName);
            return setTimeout(() => self.buildWarehouse(playerName), timeout);
        }
        if (user.hammer < price) {
            console.log("[kiService] Hammers less than catapult price: ", playerName, price, user.max_hammers);
            timer.end("KI_BUILD_CATAPULT", playerName);
            return setTimeout(() => self.buildCatapult(playerName), timeout);
        }
        const castles = castleService.getAllOfUser(user);
        let opponentNeighbor, castle;
        for (let i = 0; i < castles.length; i++) {
            const neighbors = castleService.getNeighborCastles(castles[i]);
            opponentNeighbor = neighbors.find(nc => nc.userId !== user.id);
            if (opponentNeighbor) {
                castle = castles[i];
                break;
            }
        }
        if (castle && opponentNeighbor) {
            const x = Math.round((castle.x + opponentNeighbor.x) / 2);
            const y = Math.round((castle.y + opponentNeighbor.y) / 2);
            try {
                catapultService.create({
                    x,
                    y,
                    userCastleX: castle.x,
                    userCastleY: castle.y,
                    opponentCastleX: opponentNeighbor.x,
                    opponentCastleY: opponentNeighbor.y
                }, user);
                console.log("[kiService] Build catapult! ", playerName);
            } catch (e) {
                console.log("[kiService] Failed to build catapult: ", e.message);
            }
        } else {
            console.log("[kiService] Failed to build catapult, no opponent castle.");
        }
        setTimeout(() => self.buildCastle(playerName), timeout);
        timer.end("KI_BUILD_CATAPULT", playerName);
    }
};

module.exports = self;
