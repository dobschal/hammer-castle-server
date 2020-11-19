const userService = require("./userService");
const castleService = require("./castleService");
const warehouseService = require("./warehouseService");
const config = require("../config");
const tool = require("../lib/tool");
const players = ["Mischa", "Luni", "Johnny"];
const playersData = {};

const self = {

    start() {
        players.forEach(playerName => {
            self.registerPlayer(playerName);
            self.authenticatePlayer(playerName);
            console.log("[kiService] Authenticated KI players...");
            self.buildCastle(playerName);
            self.buildWarehouse(playerName);
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
        const {user} = playersData[playerName];
        const castles = castleService.getAllOfUser(user);
        let position;
        if (castles.length === 0) {
            position = userService.getStartPosition();
        } else {
            const aroundCastle = castles[Math.floor(Math.random() * castles.length)];

            // Random position around existing castle...
            const distanceFromCastle = Math.floor((config.MIN_CASTLE_DISTANCE + config.MAX_CASTLE_DISTANCE) / 2);
            const randomAngle = Math.random() * Math.PI * 2;
            const x = Math.floor(distanceFromCastle * Math.cos(randomAngle) + aroundCastle.x);
            const y = Math.floor(distanceFromCastle * Math.sin(randomAngle) + aroundCastle.y);
            position = {x, y};
        }
        try {
            castleService.create(position, user);
            console.log("[kiService] KI player " + playerName + " build castle at: ", position.x, position.y);
        } catch (e) {
            console.log("[kiService] Failed to build castle.", e.message);
        }
        setTimeout(() => self.buildCastle(playerName), 60000);
    },

    buildWarehouse(playerName) {
        const {user} = playersData[playerName];
        const castles = castleService.getAllOfUser(user);
        const firstCastle = castles[Math.floor(Math.random() * castles.length)];
        const secondCastle = castles.find(c => firstCastle.x !== c.x && firstCastle.y !== c.y && tool.positionDistance(firstCastle, c) < config.MAX_CASTLE_DISTANCE);
        if (firstCastle && secondCastle) {
            const position = {
                x: (firstCastle.x + secondCastle.x) / 2,
                y: (firstCastle.y + secondCastle.y) / 2
            };
            try {
                warehouseService.create({
                    x: position.x,
                    y: position.y,
                    castle1X: firstCastle.x,
                    castle1Y: firstCastle.y,
                    castle2X: secondCastle.x,
                    castle2Y: secondCastle.y
                }, user);
            } catch (e) {
                console.log("[kiService] Failed to build warehouse.", e.message);
            }
        } else {
            console.log("[kiService] No place for new warehouse found...");
        }
        setTimeout(() => self.buildWarehouse(playerName), 50000);
    }
};

module.exports = self;
