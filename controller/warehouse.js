const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const warehouseService = require("../service/warehouseService");
const userService = require("../service/userService");
const priceService = require("../service/priceService");

router.post("/create", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/CreateWarehouse");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        warehouse: warehouseService.create(requestBody, user)
    });
});

router.post("/upgrade", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/UpgradeWarehouse");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        warehouse: warehouseService.upgradeWarehouse(requestBody, user)
    });
});

router.get("/price", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    const price = priceService.nextWarehousePrice(user.id);
    res.send({price});
});

router.get("/upgrade-price", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    const price = priceService.upgradeWarehousePrice(user.id);
    res.send({price});
});

router.get("/amount", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({amount: warehouseService.countWarehousesOfUser(user.id)});
});

router.get("/", hasUserRole(["USER"]), function (req, res) {
    if ("fromX" in req.query && "fromY" in req.query && "toX" in req.query && "toY" in req.query) {
        res.send(warehouseService.getWarehousesFromTo(
            Number(req.query.fromX),
            Number(req.query.fromY),
            Number(req.query.toX),
            Number(req.query.toY)));
    } else {
        res.send(warehouseService.getAll());
    }
});

module.exports = router;
