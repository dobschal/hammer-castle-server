const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const catapultService = require("../service/catapultService");
const userService = require("../service/userService");
const priceService = require("../service/priceService");

router.post("/create", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/CreateCatapult");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        catapult: catapultService.create(requestBody, user)
    });
});


router.get("/price", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    const price = priceService.nextCatapultPrice(user.id);
    res.send({price});
});

router.get("/", hasUserRole(["USER"]), function (req, res) {
    if ("fromX" in req.query && "fromY" in req.query && "toX" in req.query && "toY" in req.query) {
        console.log("[catapult] Get catapults in area: ", req.query);
        res.send(catapultService.getCatapultsFromTo(
            Number(req.query.fromX),
            Number(req.query.fromY),
            Number(req.query.toX),
            Number(req.query.toY)));
    } else {
        res.send(catapultService.getAll());
    }
});

module.exports = router;
