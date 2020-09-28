const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const warehouseService = require("../service/warehouseService");
const userService = require("../service/user");

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

router.get("/price", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    const price = warehouseService.getNextWarehousePrice(user);
    res.send({price});
});

router.get("/", hasUserRole(["USER"]), function (req, res) {
    if ("fromX" in req.query && "fromY" in req.query && "toX" in req.query && "toY" in req.query) {
        console.log("[warehouse] Get warehouses in area: ", req.query);
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
