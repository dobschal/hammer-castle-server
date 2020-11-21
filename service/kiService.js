const userService = require("./userService");
const castleService = require("./castleService");
const priceService = require("./priceService");
const warehouseService = require("./warehouseService");
const blockAreaService = require("./blockAreaService");
const config = require("../config");
const timer = require("../lib/timer");
const tool = require("../lib/tool");
const players = ["Mischa", "Luni", "Johnny", "Pete"];
const playersData = {};
const timeout = 60000;

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

    buildCastle(playerName) {
        timer.start("KI_BUILD_CASTLE");
        const {user} = playersData[playerName];
        const price = priceService.nextCastlePrice(user.id);
        if (user.max_hammers < price) {
            console.log("[kiService] Build warehouse next, cause max hammers is too low...", playerName);
            timer.end("KI_BUILD_CASTLE", playerName);
            return setTimeout(() => self.buildWarehouse(playerName), timeout);
        }
        if (user.hammer < price) {
            console.log("[kiService] KI Player hos not enough hammer for a castle: ", playerName);
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
                if (!castles.some(c => tool.positionDistance(c, {
                    x,
                    y
                }) < config.MIN_CASTLE_DISTANCE) && !blockAreaService.isInsideBlockArea(position)) {
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
        const {user} = playersData[playerName];
        const castles = castleService.getAllOfUser(user);
        const warehouses = warehouseService.getAllOfUser(user);
        const price = priceService.nextWarehousePrice(user.id)
        if (user.hammer < price) {
            console.log("[kiService] KI Player hos not enough hammer for warehouse: ", playerName);
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
                setTimeout(() => self.buildCastle(playerName), timeout);
            } catch (e) {
                console.log("[kiService] Failed to build warehouse.", playerName, e.message);
                setTimeout(() => self.buildWarehouse(playerName), timeout);
            }
        } else {
            console.log("[kiService] No place for new warehouse found...", playerName);
            setTimeout(() => self.buildWarehouse(playerName), timeout);
        }
        timer.end("KI_BUILD_WAREHOUSE", playerName);
    }
};

module.exports = self;
