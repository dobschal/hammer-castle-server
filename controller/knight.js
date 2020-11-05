const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const knightService = require("../service/knightService");
const userService = require("../service/userService");
const priceService = require("../service/priceService");

router.get("/", hasUserRole(["USER"]), function (req, res) {
    if ("fromX" in req.query && "fromY" in req.query && "toX" in req.query && "toY" in req.query) {
        res.send(knightService.findKnightsFromTo(
            Number(req.query.fromX),
            Number(req.query.fromY),
            Number(req.query.toX),
            Number(req.query.toY)));
    } else {
        res.send(knightService.getAll());
    }
});

router.get("/price", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    const price = priceService.nextKnightPrice(user.id);
    res.send({price});
});

router.post("/create", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "Position");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        knight: knightService.create(requestBody, user)
    });
});

router.post("/move", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/MoveKnight");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        knight: knightService.move(requestBody, user)
    });
});

module.exports = router;
